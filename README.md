# Gift The Kids ($GIFT)

> Making sure no kid wakes up to an empty tree.

One-page charity memecoin site. Next.js 15 (App Router), TypeScript, Tailwind CSS. No database, no wallet connection.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # offline tests for launch detection
npm run build    # production build (fetches official brand icons first)
```

## Configuration — `site.config.ts`

| Field | What it does |
|---|---|
| `tokenAddress` | `CNzHveiTBFUmBeAt1VfcT1HcMYFqKqtjTiRGDyWrpump`. Every link and copy button derives from this one value. |
| `launchMode` | `"auto"` (default) detects launch. `"prelaunch"` / `"live"` force a state. |
| `xUrl` | Project X profile. Empty = the X button shows as "Coming soon" (not clickable). |
| `receipts` | Verified donation receipts, added by hand: `{ date, description, url, amount? }`. Empty = none shown. |

## Environment variables (Vercel → Settings → Environment Variables)

| Variable | Required | Purpose |
|---|---|---|
| `SOLANA_RPC_URL` | Recommended | Your RPC endpoint (Helius, QuickNode, Triton…). Comma-separate several for failover. Server-only, never sent to the browser. Falls back to the public Solana RPC. |
| `NEXT_PUBLIC_SITE_URL` | Optional | e.g. `https://giftthekids.fun`, used for social cards. |

## Launch detection — how it works

`GET /api/token` (server-side, cached 10s in memory and at the edge) checks four sources in parallel:

1. **Solana RPC** `getAccountInfo(mint)`: the authoritative check of whether the mint exists on-chain.
2. **Pump.fun** coin API: detection plus market cap.
3. **Dexscreener**: market data (price, market cap/FDV, 24h volume) once indexed.
4. **GeckoTerminal**: fallback market data.

Rules:

- **Live** as soon as any source finds the token. Dexscreener is never required.
- **Pre-launch** only when an RPC positively answers that the mint doesn't exist.
- **Unknown** ("Launch status unavailable" / "Data unavailable") when sources can't be reached. An outage is never shown as "not launched".
- Once live, it stays live, both on the server and in the visitor's browser.
- Market values come from one source at a time, labelled with that source ("Market cap" vs "FDV" as reported). A missing value is hidden, never shown as `0`.
- The page polls every 12s while the tab is visible.
- The Dexscreener button turns on only once Dexscreener has indexed the token, so it never opens an empty page.

## Donations

The site does **not** track, estimate or calculate donations. Creator fees ≠ completed donations. Publish verified receipts manually via `receipts`.

## Official platform logos

Logos are never redrawn or approximated.

- **X**: the official vector mark.
- **Pump.fun / Dexscreener**: `npm run build` first runs `scripts/fetch-brand-icons.mjs`, which downloads each platform's own icon from its website into `public/brand/` (`pumpfun.svg|png`, `dexscreener.svg|png`). You can also place the official files there yourself. Files you add are never overwritten.
- If no official file is available, that button shows its name without a logo rather than a substitute.

## Animations

CSS plus a single IntersectionObserver (`components/ScrollReveal.tsx`), with no animation library.

- **Hero entrance:** the logo fades in and settles upward, then the headline, the text and the three buttons appear in turn.
- **Logo:** after the entrance it floats slowly (5px, 6s loop).
- **On scroll:** content fades and rises into place, and dividers draw in.
- **Safe fallback:** content is only hidden while JavaScript is confirmed running, and it is shown immediately if the reveal script doesn't start.
- **Reduced motion:** `prefers-reduced-motion` turns all motion off.

## Logo

`public/gift.webp` is the original gift logo at 496px (shown at up to 248px, so it stays sharp on 2x screens). `app/icon.png` is the favicon made from the same image.

## Deploy

Push to GitHub → import on Vercel (framework auto-detected) → add `SOLANA_RPC_URL` → deploy.
