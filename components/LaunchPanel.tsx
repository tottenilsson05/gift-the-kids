"use client";

import type { ReactNode } from "react";
import type { TokenStatus, MarketData } from "@/lib/token";
import CopyAddress from "@/components/CopyAddress";
import { useLaunch, type Mode, type View } from "@/components/useLaunch";

/* ── formatting (only ever called with real, positive numbers) ── */

const compact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

export function formatPrice(p: number) {
  if (p >= 1) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  // Small prices: ~3 significant digits, never scientific notation
  const digits = Math.min(12, Math.max(2, -Math.floor(Math.log10(p)) + 2));
  return `$${p.toFixed(digits)}`;
}

function PlatformButton({
  href,
  enabled,
  icon,
  name,
  caption,
  disabledCaption,
  order,
}: {
  href: string | null;
  enabled: boolean;
  icon: ReactNode;
  name: string;
  caption: string;
  disabledCaption: string;
  /** Position in the staggered entrance sequence. */
  order: number;
}) {
  const live = enabled && Boolean(href);
  const inner = (
    <>
      {icon ? (
        <span className="pb-logo grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-col items-start leading-tight">
        <span className="text-[14px] font-medium tracking-[-0.005em] text-white">{name}</span>
        <span className="mt-0.5 text-[11.5px] text-white/45">{live ? caption : disabledCaption}</span>
      </span>
      {live ? (
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="pb-arrow ml-auto h-3.5 w-3.5 shrink-0 text-white/35"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 11l6-6M6 5h5v5" />
        </svg>
      ) : null}
    </>
  );

  const style = { animationDelay: `${640 + order * 90}ms` };

  if (!live) {
    return (
      <span aria-disabled="true" className="pbtn pbtn-off animate-fade-up" style={style}>
        {inner}
      </span>
    );
  }
  return (
    <a
      href={href!}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${name} — ${caption} (opens in a new tab)`}
      className="pbtn animate-fade-up"
      style={style}
    >
      {inner}
    </a>
  );
}

function MarketRow({ market, failed }: { market: MarketData | null; failed: boolean }) {
  if (!market || failed) return <p className="text-[12px] text-muted">Market data unavailable</p>;

  const items: { label: string; value: string }[] = [];
  if (market.valuation) items.push({ label: market.valuation.label, value: compact.format(market.valuation.value) });
  if (market.priceUsd) items.push({ label: "Price", value: formatPrice(market.priceUsd) });
  if (market.volume24hUsd) items.push({ label: "24h volume", value: compact.format(market.volume24hUsd) });

  return (
    <div className="flex flex-col items-center gap-2">
      <dl className="flex flex-wrap items-baseline justify-center gap-x-7 gap-y-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-baseline gap-2">
            <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">{it.label}</dt>
            <dd className="font-mono text-[13px] tabular-nums text-white/90">{it.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[11px] text-muted/70">Source: {market.source}</p>
    </div>
  );
}

const statusText: Record<View, string> = {
  checking: "Checking launch status",
  prelaunch: "Pre-launch · Launching on Pump.fun",
  live: "Live on Pump.fun",
  unknown: "Launch status unavailable",
};

export default function LaunchPanel({
  initial,
  mode,
  address,
  links,
  icons,
}: {
  initial: TokenStatus | null;
  mode: Mode;
  address: string;
  links: { pumpfun: string; dexscreener: string; x: string | null };
  icons: { pumpfun: ReactNode; dexscreener: ReactNode; x: ReactNode };
}) {
  const { view, market, marketFailed, pumpEnabled, dexEnabled } = useLaunch(initial, mode, address);
  const live = view === "live";

  return (
    <div className="flex w-full flex-col items-center">
      <div className="grid w-full max-w-[340px] grid-cols-1 gap-2.5 sm:flex sm:max-w-none sm:flex-row sm:justify-center sm:gap-3">
        <PlatformButton
          order={0}
          href={links.pumpfun}
          enabled={pumpEnabled}
          icon={icons.pumpfun}
          name="Pump.fun"
          caption="Buy $GIFT"
          disabledCaption="Available at launch"
        />
        <PlatformButton
          order={1}
          href={links.dexscreener}
          enabled={dexEnabled}
          icon={icons.dexscreener}
          name="Dexscreener"
          caption="View chart"
          disabledCaption={live ? "Indexing — soon" : "Available at launch"}
        />
        <PlatformButton
          order={2}
          href={links.x}
          enabled={Boolean(links.x)}
          icon={icons.x}
          name="X"
          caption="Follow updates"
          disabledCaption="Coming soon"
        />
      </div>

      <div className="mt-10 flex animate-fade-up flex-col items-center gap-4 [animation-delay:980ms]">
        {(live || view === "unknown") && (
          <p className="inline-flex items-center gap-2 text-[12px] text-muted" aria-live="polite">
            <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-neon" : "bg-amber-300/80"}`} />
            {statusText[view]}
          </p>
        )}

        {live && <MarketRow market={market} failed={marketFailed} />}
        {view === "unknown" && <p className="text-[12px] text-muted">Data unavailable</p>}

        <CopyAddress address={address} truncate className="mt-1" />
      </div>
    </div>
  );
}

/** Footer links that follow the same launch state (no links to pages that don't exist yet). */
export function FooterLinks({
  initial,
  mode,
  address,
  links,
}: {
  initial: TokenStatus | null;
  mode: Mode;
  address: string;
  links: { pumpfun: string; dexscreener: string; x: string | null; donateGg: string };
}) {
  const { pumpEnabled, dexEnabled } = useLaunch(initial, mode, address);
  const items = [
    { label: "Pump.fun", href: pumpEnabled ? links.pumpfun : null },
    { label: "Dexscreener", href: dexEnabled ? links.dexscreener : null },
    { label: "X", href: links.x },
    { label: "donate.gg", href: links.donateGg },
  ];
  return (
    <nav aria-label="Project links" className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
      {items.map(({ label, href }) =>
        href ? (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="text-white/70 transition-colors hover:text-white">
            {label}
          </a>
        ) : (
          <span key={label} className="text-white/25" title="Available at launch">
            {label}
          </span>
        ),
      )}
    </nav>
  );
}
