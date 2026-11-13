/**
 * Server-side launch detection + market data for a Pump.fun token.
 *
 * Design rules
 * - Launch is confirmed by ANY provider that finds the token.
 * - "Pre-launch" is only reported when a Solana RPC positively answers that
 *   the mint account does not exist. A failed request never means "doesn't exist".
 * - Market values are only returned when a provider returns a real, positive
 *   number. Missing data stays null (never 0).
 * - No API keys reach the browser: this module only runs on the server.
 *
 * Dependency-free on purpose (plain fetch) so it can be unit-tested in Node.
 */

export type ProviderState = "found" | "not_found" | "error";
export type LaunchStatus = "live" | "prelaunch" | "unknown";

export type Valuation = { label: "Market cap" | "FDV"; value: number };

export type MarketData = {
  priceUsd: number | null;
  valuation: Valuation | null;
  volume24hUsd: number | null;
  source: "Dexscreener" | "GeckoTerminal" | "Pump.fun";
};

export type TokenStatus = {
  mint: string;
  status: LaunchStatus;
  /** Market data from one verified source, or null when unavailable. */
  market: MarketData | null;
  /** True when Dexscreener has indexed the token (its page will resolve). */
  dexscreenerIndexed: boolean;
  providers: Record<"rpc" | "pumpfun" | "dexscreener" | "geckoterminal", ProviderState>;
  checkedAt: string;
};

type Fetch = typeof fetch;

type ProviderOut = { state: ProviderState; market?: MarketData | null };

const TIMEOUT_MS = 4500;
const PUMP_DECIMALS = 6;

const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";

/* ── helpers ──────────────────────────────────────────────── */

/** Positive, finite number or null. Strings are parsed. 0 → null. */
export function num(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function timed(f: Fetch, url: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await f(url, {
      ...init,
      signal: ctrl.signal,
      headers: { accept: "application/json", ...(init.headers ?? {}) },
      // Next.js data cache: share responses for 10s across requests/instances.
      // (Ignored outside Next, e.g. in the offline tests.)
      next: { revalidate: 10 },
    } as RequestInit);
  } finally {
    clearTimeout(t);
  }
}

function rpcUrls(): string[] {
  const fromEnv = (process.env.SOLANA_RPC_URL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...fromEnv, PUBLIC_RPC];
}

/* ── providers ────────────────────────────────────────────── */

/** Authoritative on-chain existence check. Tries each RPC until one answers. */
export async function checkRpc(f: Fetch, mint: string, urls = rpcUrls()): Promise<ProviderOut> {
  for (const url of urls) {
    try {
      const res = await timed(f, url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getAccountInfo",
          params: [mint, { encoding: "base64", commitment: "confirmed", dataSlice: { offset: 0, length: 0 } }],
        }),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { result?: { value: unknown }; error?: unknown };
      if (json.error || !json.result || !("value" in json.result)) continue;
      return { state: json.result.value === null ? "not_found" : "found" };
    } catch {
      /* try next RPC */
    }
  }
  return { state: "error" };
}

export async function checkPumpFun(f: Fetch, mint: string): Promise<ProviderOut> {
  try {
    const res = await timed(f, `https://frontend-api-v3.pump.fun/coins/${mint}`);
    if (res.status === 404) return { state: "not_found" };
    if (!res.ok) return { state: "error" };
    const text = await res.text();
    if (!text) return { state: "not_found" };
    const c = JSON.parse(text) as { mint?: string; usd_market_cap?: unknown; total_supply?: unknown };
    if (c?.mint !== mint) return { state: "not_found" };

    const mc = num(c.usd_market_cap);
    const supplyRaw = num(c.total_supply);
    const supply = supplyRaw ? supplyRaw / 10 ** PUMP_DECIMALS : null;
    const price = mc && supply ? mc / supply : null;

    return {
      state: "found",
      market:
        mc || price
          ? {
              priceUsd: price,
              valuation: mc ? { label: "Market cap", value: mc } : null,
              volume24hUsd: null, // Pump.fun does not expose 24h volume here
              source: "Pump.fun",
            }
          : null,
    };
  } catch {
    return { state: "error" };
  }
}

type DexPair = {
  chainId?: string;
  baseToken?: { address?: string };
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  volume?: { h24?: number };
  liquidity?: { usd?: number };
};

export async function checkDexscreener(f: Fetch, mint: string): Promise<ProviderOut> {
  try {
    const res = await timed(f, `https://api.dexscreener.com/tokens/v1/solana/${mint}`);
    if (!res.ok) return { state: "error" };
    const pairs = (await res.json()) as DexPair[];
    const mine = Array.isArray(pairs) ? pairs.filter((p) => p?.baseToken?.address === mint) : [];
    // Not indexed yet ≠ not launched. Report not_found; it never decides "pre-launch".
    if (mine.length === 0) return { state: "not_found" };

    const best = mine.reduce((a, b) => ((num(b.liquidity?.usd) ?? 0) > (num(a.liquidity?.usd) ?? 0) ? b : a));
    const mc = num(best.marketCap);
    const fdv = num(best.fdv);
    const price = num(best.priceUsd);
    const valuation: Valuation | null = mc ? { label: "Market cap", value: mc } : fdv ? { label: "FDV", value: fdv } : null;

    return {
      state: "found",
      market:
        price || valuation
          ? { priceUsd: price, valuation, volume24hUsd: num(best.volume?.h24), source: "Dexscreener" }
          : null,
    };
  } catch {
    return { state: "error" };
  }
}

export async function checkGeckoTerminal(f: Fetch, mint: string): Promise<ProviderOut> {
  try {
    const res = await timed(f, `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mint}`);
    if (res.status === 404) return { state: "not_found" };
    if (!res.ok) return { state: "error" };
    const json = (await res.json()) as {
      data?: {
        attributes?: {
          address?: string;
          price_usd?: string | null;
          market_cap_usd?: string | null;
          fdv_usd?: string | null;
          volume_usd?: { h24?: string | null };
        };
      };
    };
    const a = json?.data?.attributes;
    if (!a) return { state: "not_found" };

    const mc = num(a.market_cap_usd);
    const fdv = num(a.fdv_usd);
    const price = num(a.price_usd);
    const valuation: Valuation | null = mc ? { label: "Market cap", value: mc } : fdv ? { label: "FDV", value: fdv } : null;

    return {
      state: "found",
      market:
        price || valuation
          ? { priceUsd: price, valuation, volume24hUsd: num(a.volume_usd?.h24), source: "GeckoTerminal" }
          : null,
    };
  } catch {
    return { state: "error" };
  }
}

/* ── aggregate ────────────────────────────────────────────── */

export async function fetchTokenStatus(mint: string, f: Fetch = fetch): Promise<TokenStatus> {
  const [rpc, pump, dex, gecko] = await Promise.all([
    checkRpc(f, mint),
    checkPumpFun(f, mint),
    checkDexscreener(f, mint),
    checkGeckoTerminal(f, mint),
  ]);

  const anyFound = [rpc, pump, dex, gecko].some((p) => p.state === "found");

  let status: LaunchStatus;
  if (anyFound) status = "live";
  else if (rpc.state === "not_found") status = "prelaunch";
  else status = "unknown"; // RPC unreachable and nobody found it: we genuinely don't know

  // One source per row, most complete first.
  const market =
    status === "live" ? (dex.market ?? gecko.market ?? pump.market ?? null) : null;

  return {
    mint,
    status,
    market,
    dexscreenerIndexed: dex.state === "found",
    providers: { rpc: rpc.state, pumpfun: pump.state, dexscreener: dex.state, geckoterminal: gecko.state },
    checkedAt: new Date().toISOString(),
  };
}

/* ── in-memory cache (per server instance) ────────────────── */

const TTL_MS = 10_000;
let cached: { at: number; value: TokenStatus } | null = null;
let inflight: Promise<TokenStatus> | null = null;
let everLive = false;

/** Cached wrapper: at most one upstream round-trip per 10s per instance. */
export async function getTokenStatus(mint: string): Promise<TokenStatus> {
  if (cached && cached.value.mint === mint && Date.now() - cached.at < TTL_MS) return cached.value;
  if (!inflight) {
    inflight = fetchTokenStatus(mint)
      .then((v) => {
        // A token that has launched can't un-launch: if every provider fails
        // later, keep reporting live (with market data unavailable).
        if (v.status === "live") everLive = true;
        else if (everLive) v = { ...v, status: "live", market: null };
        cached = { at: Date.now(), value: v };
        return v;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}
