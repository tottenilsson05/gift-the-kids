/**
 * ─────────────────────────────────────────────────────────────
 *  Gift The Kids — the ONLY file you need to edit.
 * ─────────────────────────────────────────────────────────────
 */

export type Receipt = {
  /** ISO date, e.g. "2026-12-20" */
  date: string;
  /** Short, factual description, e.g. "Toy donation via donate.gg" */
  description: string;
  /** Public link to the verified receipt or transaction. */
  url: string;
  /** Optional amount exactly as shown on the receipt, e.g. "$1,250" */
  amount?: string;
};

export const siteConfig = {
  name: "Gift The Kids",
  ticker: "$GIFT",
  tagline: "Making sure no kid wakes up to an empty tree.",
  description:
    "Gift The Kids ($GIFT) is a charity-driven memecoin. Creator fees are intended to fund toys and Christmas gifts for children in need through donate.gg.",

  /** Public URL of the deployed site (used for SEO / social cards). */
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),

  /** Solana token mint address on Pump.fun. Used everywhere on the site. */
  tokenAddress: "CNzHveiTBFUmBeAt1VfcT1HcMYFqKqtjTiRGDyWrpump",

  /**
   * "auto"      → detect launch automatically (recommended)
   * "prelaunch" → force the pre-launch state
   * "live"      → force the live state
   */
  launchMode: "auto" as "auto" | "prelaunch" | "live",

  /** Project X profile, e.g. "https://x.com/giftthekids". Empty = shown as "Soon". */
  xUrl: "https://x.com/giftthekids",

  donateGgUrl: "https://donate.gg",

  /**
   * Verified donation receipts — add them by hand, only once verified.
   * Nothing is ever calculated or estimated. Empty = no receipts shown.
   */
  receipts: [] as Receipt[],

  copyrightYear: 2026,
} as const;

/* ── Derived links (don't edit) ───────────────────────────── */

const ca = siteConfig.tokenAddress;

export const links = {
  pumpfun: `https://pump.fun/coin/${ca}`,
  dexscreener: `https://dexscreener.com/solana/${ca}`,
  x: siteConfig.xUrl.trim() || null,
  donateGg: siteConfig.donateGgUrl,
};
