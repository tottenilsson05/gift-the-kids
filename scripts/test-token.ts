/**
 * Offline tests for lib/token.ts — no network, mocked providers.
 * Run: node --experimental-strip-types scripts/test-token.ts
 */
import assert from "node:assert/strict";
import { fetchTokenStatus, num } from "../lib/token.ts";

const MINT = "B48mB3doUa5312UatFd87MQfzMNCRsbAsTomLzsGpump";

type Route = { rpc?: unknown; pump?: unknown; dex?: unknown; gecko?: unknown };
// Each value: a JSON body, a number (HTTP status), or "throw" (network failure).

function mockFetch(r: Route): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const pick = url.includes("pump.fun")
      ? r.pump
      : url.includes("dexscreener")
        ? r.dex
        : url.includes("geckoterminal")
          ? r.gecko
          : r.rpc;
    if (pick === "throw" || pick === undefined) throw new Error("network down");
    if (typeof pick === "number") return new Response("", { status: pick });
    return new Response(JSON.stringify(pick), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
}

const rpcMissing = { jsonrpc: "2.0", id: 1, result: { context: { slot: 1 }, value: null } };
const rpcFound = { jsonrpc: "2.0", id: 1, result: { context: { slot: 1 }, value: { owner: "Tokenz..", data: ["", "base64"] } } };

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log("lib/token.ts");

await test("num() rejects zero, negatives, NaN, null", async () => {
  assert.equal(num(0), null);
  assert.equal(num("0"), null);
  assert.equal(num(-1), null);
  assert.equal(num("abc"), null);
  assert.equal(num(null), null);
  assert.equal(num("12.5"), 12.5);
});

await test("pre-launch: RPC says mint does not exist, nobody indexes it", async () => {
  const s = await fetchTokenStatus(MINT, mockFetch({ rpc: rpcMissing, pump: 404, dex: [], gecko: 404 }));
  assert.equal(s.status, "prelaunch");
  assert.equal(s.market, null);
  assert.equal(s.dexscreenerIndexed, false);
});

await test("unknown (NOT pre-launch) when every provider is unreachable", async () => {
  const s = await fetchTokenStatus(MINT, mockFetch({ rpc: "throw", pump: "throw", dex: "throw", gecko: "throw" }));
  assert.equal(s.status, "unknown");
  assert.equal(s.market, null);
});

await test("unknown when RPC is down and indexers just haven't seen it", async () => {
  const s = await fetchTokenStatus(MINT, mockFetch({ rpc: 503, pump: 500, dex: [], gecko: 404 }));
  assert.equal(s.status, "unknown");
});

await test("live from RPC alone right after launch (no market data yet)", async () => {
  const s = await fetchTokenStatus(MINT, mockFetch({ rpc: rpcFound, pump: 500, dex: [], gecko: 404 }));
  assert.equal(s.status, "live");
  assert.equal(s.market, null, "no invented values");
  assert.equal(s.dexscreenerIndexed, false);
});

await test("live from Pump.fun when RPC is down; price derived from real market cap + supply", async () => {
  const s = await fetchTokenStatus(
    MINT,
    mockFetch({ rpc: "throw", pump: { mint: MINT, usd_market_cap: 8000, total_supply: 1_000_000_000_000_000 }, dex: [], gecko: 404 }),
  );
  assert.equal(s.status, "live");
  assert.equal(s.market?.source, "Pump.fun");
  assert.deepEqual(s.market?.valuation, { label: "Market cap", value: 8000 });
  assert.equal(s.market?.priceUsd, 0.000008);
  assert.equal(s.market?.volume24hUsd, null, "Pump.fun has no 24h volume → hidden, not 0");
});

await test("Dexscreener preferred; picks the most liquid pair; labels FDV when no market cap", async () => {
  const dex = [
    { baseToken: { address: MINT }, priceUsd: "0.0001", fdv: 100000, volume: { h24: 5 }, liquidity: { usd: 10 } },
    { baseToken: { address: MINT }, priceUsd: "0.0002", fdv: 200000, volume: { h24: 9000 }, liquidity: { usd: 50000 } },
    { baseToken: { address: "other" }, priceUsd: "9", marketCap: 1, liquidity: { usd: 999999 } },
  ];
  const s = await fetchTokenStatus(MINT, mockFetch({ rpc: rpcFound, pump: { mint: MINT, usd_market_cap: 1 }, dex, gecko: 404 }));
  assert.equal(s.market?.source, "Dexscreener");
  assert.equal(s.market?.priceUsd, 0.0002);
  assert.deepEqual(s.market?.valuation, { label: "FDV", value: 200000 });
  assert.equal(s.market?.volume24hUsd, 9000);
  assert.equal(s.dexscreenerIndexed, true);
});

await test("falls back to GeckoTerminal when Dexscreener is down", async () => {
  const gecko = { data: { attributes: { price_usd: "0.0003", market_cap_usd: null, fdv_usd: "300000", volume_usd: { h24: "0" } } } };
  const s = await fetchTokenStatus(MINT, mockFetch({ rpc: rpcFound, pump: 500, dex: 502, gecko }));
  assert.equal(s.market?.source, "GeckoTerminal");
  assert.deepEqual(s.market?.valuation, { label: "FDV", value: 300000 });
  assert.equal(s.market?.volume24hUsd, null, "0 volume is treated as unavailable, not shown");
});

await test("second RPC is used when the first one fails", async () => {
  const { checkRpc } = await import("../lib/token.ts");
  let calls = 0;
  const f = (async (url: string) => {
    calls++;
    if (url.includes("bad")) return new Response("", { status: 500 });
    return new Response(JSON.stringify(rpcFound), { status: 200 });
  }) as unknown as typeof fetch;
  const r = await checkRpc(f, MINT, ["https://bad.example", "https://good.example"]);
  assert.equal(r.state, "found");
  assert.equal(calls, 2);
});

console.log(`\n${passed} passed`);
