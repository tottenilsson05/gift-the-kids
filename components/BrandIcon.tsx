import fs from "node:fs";
import path from "node:path";
import { XLogo } from "@/components/icons";

/**
 * Official platform logos — never redrawn or approximated.
 *
 * Pump.fun / Dexscreener: the official icon file in /public/brand
 * (pumpfun.svg|png, dexscreener.svg|png). `npm run build` first runs
 * scripts/fetch-brand-icons.mjs, which downloads each platform's own icon.
 * You can also place the official files there yourself.
 * If no official file is present, the button shows no logo (rather than a fake one).
 *
 * X: the official vector mark.
 */
function findFile(base: string): string | null {
  for (const ext of ["svg", "png"]) {
    try {
      const p = path.join(process.cwd(), "public", "brand", `${base}.${ext}`);
      if (fs.statSync(p).size > 100) return `/brand/${base}.${ext}`;
    } catch {
      /* not present */
    }
  }
  return null;
}

/** Returns the official logo element, or null when no official file is available. */
export function brandIcon(name: "pumpfun" | "dexscreener" | "x") {
  if (name === "x") return <XLogo className="h-[15px] w-[15px] text-white" />;

  const src = findFile(name);
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={20} height={20} className="h-5 w-5 rounded-[5px] object-contain" decoding="async" />
  );
}
