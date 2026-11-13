import Image from "next/image";
import gift from "@/public/gift.webp";
import { siteConfig, links } from "@/site.config";
import { getTokenStatus, type TokenStatus } from "@/lib/token";
import LaunchPanel, { FooterLinks } from "@/components/LaunchPanel";
import CopyAddress from "@/components/CopyAddress";
import { brandIcon } from "@/components/BrandIcon";
import ScrollReveal from "@/components/ScrollReveal";
import { ArrowUpRight } from "@/components/icons";

/** Re-render the page (with a fresh launch status) at most every 30s. */
export const revalidate = 30;

const steps = [
  { n: "01", title: "Trade", body: "$GIFT generates creator fees through Pump.fun trading activity." },
  { n: "02", title: "Donate", body: "Creator fees are allocated to toy donation efforts through donate.gg." },
  { n: "03", title: "Give", body: "The goal is to help provide toys and gifts to children in need." },
];

/**
 * Scroll-reveal vocabulary (see globals.css):
 *  .reveal      → container observed by <ScrollReveal/>
 *  .ri          → item that fades + rises in; stagger with style={{"--i": n}}
 *  .rl          → thin divider that draws in from the left
 * Content is only hidden when JS is running (html.js), so nothing disappears
 * if scripts or animations fail.
 */
const i = (n: number) => ({ "--i": n }) as React.CSSProperties;

function Section({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="reveal">
      <div className="rl h-px bg-line" />
      <div className="mx-auto grid max-w-[1080px] gap-6 px-6 py-24 sm:px-10 md:grid-cols-[220px_1fr] md:gap-10 md:py-32">
        <p className="ri pt-2 text-[12px] font-medium uppercase tracking-[0.18em] text-muted" style={i(0)}>
          {label}
        </p>
        <div className="max-w-[620px]">{children}</div>
      </div>
    </section>
  );
}

const h2 = "ri font-serif text-[2rem] leading-[1.15] tracking-[-0.01em] sm:text-[2.5rem]";

export default async function Home() {
  const mode = siteConfig.launchMode;
  let initial: TokenStatus | null = null;
  if (mode === "auto") {
    try {
      initial = await getTokenStatus(siteConfig.tokenAddress);
    } catch {
      initial = null; // the client retries; never treated as "not launched"
    }
  }

  const icons = {
    pumpfun: brandIcon("pumpfun"),
    dexscreener: brandIcon("dexscreener"),
    x: brandIcon("x"),
  };

  return (
    <main>
      <ScrollReveal />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="flex min-h-[94svh] flex-col items-center justify-center px-6 pb-24 pt-20 text-center">
        <div className="relative w-[188px] sm:w-[228px] md:w-[248px]">
          {/* Extremely subtle light behind the gift only */}
          <div aria-hidden="true" className="hero-light animate-fade-in [animation-delay:200ms]" />
          {/* 1. fade in + settle upward */}
          <div className="animate-logo-in">
            {/* 2. slow 5px float (screen-blend lets the logo's black edge melt into the page; glow preserved) */}
            <div className="animate-float mix-blend-screen">
              <Image
                src={gift}
                alt="Gift The Kids logo — a green gift box"
                priority
                placeholder="blur"
                sizes="(min-width: 768px) 248px, (min-width: 640px) 228px, 188px"
                className="h-auto w-full select-none"
                draggable={false}
              />
            </div>
          </div>
        </div>

        <div className="mt-9 animate-fade-up [animation-delay:260ms]">
          <p className="text-[13px] font-semibold tracking-[0.38em] text-white">GIFT&nbsp;THE&nbsp;KIDS</p>
          <p className="mt-3 text-[11px] font-medium tracking-[0.2em] text-neon">$GIFT — A CHARITY-DRIVEN MEMECOIN</p>
        </div>

        <h1 className="mt-11 max-w-[16ch] animate-fade-up font-serif text-[2.55rem] font-normal leading-[1.05] tracking-[-0.015em] text-white [animation-delay:380ms] sm:text-[3.5rem] md:text-[4.1rem]">
          Making sure no kid wakes up to an empty tree.
        </h1>

        <p className="mt-7 max-w-[33rem] animate-fade-up text-[16px] leading-[1.7] text-white/60 [animation-delay:500ms] sm:text-[17px]">
          Helping bring Christmas gifts to children in need through creator-fee-funded donations via donate.gg.
        </p>

        <div className="mt-11 flex w-full justify-center">
          <LaunchPanel
            initial={initial}
            mode={mode}
            address={siteConfig.tokenAddress}
            links={{ pumpfun: links.pumpfun, dexscreener: links.dexscreener, x: links.x }}
            icons={icons}
          />
        </div>
      </section>

      {/* ── ABOUT ──────────────────────────────────────────── */}
      <Section id="about" label="About">
        <h2 id="about-title" className={h2} style={i(1)}>
          A little gift can mean a lot.
        </h2>
        <div className="mt-8 space-y-5 text-[16px] leading-[1.75] text-white/65 sm:text-[17px]">
          <p className="ri text-white/90" style={i(2)}>
            Not every child wakes up to presents on Christmas morning.
          </p>
          <p className="ri" style={i(3)}>
            Gift The Kids was created with a simple goal: use creator fees from $GIFT to help fund toys and gifts
            for children in need.
          </p>
          <p className="ri" style={i(4)}>
            Through donate.gg, the project aims to support toy donation efforts during Christmas and beyond.
          </p>
          <p className="ri text-white/90" style={i(5)}>
            No complicated promises. Just a simple idea with a meaningful purpose.
          </p>
        </div>
      </Section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <Section id="how" label="How it works">
        <h2 id="how-title" className={h2} style={i(1)}>
          From trading to toys.
        </h2>
        <ol className="mt-10">
          {steps.map((s, k) => (
            <li key={s.n}>
              <div className="rl h-px bg-line" style={i(2 + k)} />
              <div
                className="ri grid grid-cols-[44px_1fr] gap-x-4 gap-y-1 py-7 sm:grid-cols-[56px_120px_1fr] sm:items-baseline"
                style={i(2 + k)}
              >
                <span className="font-mono text-[12px] text-neon">{s.n}</span>
                <h3 className="text-[17px] font-medium text-white">{s.title}</h3>
                <p className="col-start-2 text-[15.5px] leading-[1.65] text-white/60 sm:col-start-3">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="rl h-px bg-line" style={i(5)} />
      </Section>

      {/* ── COMMITMENT (donations) ─────────────────────────── */}
      <Section id="commitment" label="Donations">
        <h2 id="commitment-title" className={h2} style={i(1)}>
          Our Commitment
        </h2>
        <p className="ri mt-8 font-serif text-[1.3rem] leading-[1.55] text-white/85 sm:text-[1.45rem]" style={i(2)}>
          Creator fees from $GIFT are intended to support toy donations for children in need through donate.gg,
          during Christmas and beyond.
        </p>

        <dl className="mt-12">
          {[
            {
              k: "Where",
              v: (
                <>
                  Donations are made through{" "}
                  <a
                    href={links.donateGg}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 border-b border-white/25 text-white transition-colors hover:border-neon"
                  >
                    donate.gg
                    <ArrowUpRight className="h-3 w-3 text-neon" />
                  </a>
                  , a platform for charitable crypto donations.
                </>
              ),
            },
            {
              k: "Receipts",
              v: "Verified receipts are added to this page by hand, once a donation has actually been made.",
            },
            {
              k: "Figures",
              v: "This site does not track, estimate or calculate donation amounts automatically. Creator fees earned are not the same as donations completed.",
            },
          ].map((row, k) => (
            <div key={row.k}>
              <div className="rl h-px bg-line" style={i(3 + k)} />
              <div className="ri grid gap-1 py-5 sm:grid-cols-[120px_1fr] sm:gap-6" style={i(3 + k)}>
                <dt className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted sm:pt-[3px]">{row.k}</dt>
                <dd className="text-[15px] leading-[1.7] text-white/65">{row.v}</dd>
              </div>
            </div>
          ))}
          <div className="rl h-px bg-line" style={i(6)} />
        </dl>

        {siteConfig.receipts.length > 0 && (
          <div className="ri mt-14" style={i(7)}>
            <h3 className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted">Donation receipts</h3>
            <ul className="mt-5 border-b border-line">
              {siteConfig.receipts.map((r) => (
                <li
                  key={r.url}
                  className="grid gap-1 border-t border-line py-4 text-[14.5px] sm:grid-cols-[110px_1fr_auto] sm:items-baseline sm:gap-4"
                >
                  <time dateTime={r.date} className="font-mono text-[12px] text-muted">
                    {r.date}
                  </time>
                  <span className="text-white/85">
                    {r.description}
                    {r.amount ? <span className="ml-2 font-mono text-[13px] text-white/60">{r.amount}</span> : null}
                  </span>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[13px] text-white/70 hover:text-white"
                  >
                    View receipt <ArrowUpRight className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="reveal">
        <div className="rl h-px bg-line" />
        <div className="mx-auto max-w-[1080px] px-6 pb-12 pt-14 sm:px-10">
          <div className="ri flex flex-col gap-8 md:flex-row md:items-start md:justify-between" style={i(0)}>
            <div>
              <p className="font-serif text-[1.35rem] leading-snug text-white/90">{siteConfig.tagline}</p>
              <p className="mt-2 text-[13px] text-muted">
                {siteConfig.name} © {siteConfig.copyrightYear}
              </p>
            </div>
            <FooterLinks
              initial={initial}
              mode={mode}
              address={siteConfig.tokenAddress}
              links={{ pumpfun: links.pumpfun, dexscreener: links.dexscreener, x: links.x, donateGg: links.donateGg }}
            />
          </div>

          <div className="ri mt-12 flex flex-col gap-6 border-t border-line pt-8" style={i(1)}>
            <CopyAddress address={siteConfig.tokenAddress} />
            <p className="max-w-[46rem] text-[12px] leading-[1.7] text-white/40">
              Gift The Kids is an independent community project. Cryptocurrency trading involves risk. Donations are
              subject to the project&apos;s actual fee distribution and donation process. Gift The Kids is not
              officially partnered with donate.gg or any recipient charity unless publicly confirmed.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
