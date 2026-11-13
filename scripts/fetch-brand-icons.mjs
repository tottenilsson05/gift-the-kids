/**
 * Downloads the official Pump.fun and Dexscreener icons into /public/brand,
 * straight from each platform's own website. Runs automatically before
 * `npm run build` (see "prebuild" in package.json).
 *
 * - Never fails the build.
 * - Never overwrites a file you placed there yourself.
 * - If nothing can be downloaded, the button simply shows no logo — the site
 *   never substitutes a redrawn or approximate logo.
 */
import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "brand");

const icons = [
  {
    name: "pumpfun",
    sources: [
      "https://pump.fun/icon.svg",
      "https://pump.fun/favicon.svg",
      "https://pump.fun/apple-touch-icon.png",
      "https://pump.fun/icon.png",
      // Google's favicon service returns the site's own published favicon
      "https://www.google.com/s2/favicons?domain=pump.fun&sz=128",
    ],
  },
  {
    name: "dexscreener",
    sources: [
      "https://dexscreener.com/favicon.svg",
      "https://dexscreener.com/apple-touch-icon.png",
      "https://dexscreener.com/favicon.png",
      "https://www.google.com/s2/favicons?domain=dexscreener.com&sz=128",
    ],
  },
];

function kind(buf) {
  if (buf.length > 100 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  const head = buf.subarray(0, 512).toString("utf8").trimStart();
  if (/^(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(head)) return "svg";
  return null;
}

async function get(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "Mozilla/5.0 (brand-icon-fetch)" } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const k = kind(buf);
    return k ? { buf, ext: k } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function exists(p) {
  try {
    return (await fs.stat(p)).size > 100;
  } catch {
    return false;
  }
}

try {
  await fs.mkdir(OUT, { recursive: true });
  for (const { name, sources } of icons) {
    if ((await exists(path.join(OUT, `${name}.svg`))) || (await exists(path.join(OUT, `${name}.png`)))) {
      console.log(`[brand] ${name}: already present`);
      continue;
    }
    let saved = false;
    for (const url of sources) {
      const r = await get(url);
      if (r) {
        await fs.writeFile(path.join(OUT, `${name}.${r.ext}`), r.buf);
        console.log(`[brand] ${name}: saved ${name}.${r.ext} from ${url}`);
        saved = true;
        break;
      }
    }
    if (!saved) console.log(`[brand] ${name}: not downloaded — button will show without a logo`);
  }
} catch (e) {
  console.log("[brand] skipped:", e?.message ?? e);
}
