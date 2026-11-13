/**
 * Restores public/gift.webp (the original gift logo) from assets/gift.webp.b64
 * and verifies its SHA-1, so a corrupted logo can never be deployed.
 * Runs before every build (see "prebuild" in package.json).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const EXPECTED_SHA1 = "b4630836fd78dd4bd60d07881db0ed4500c0849d";
const src = path.join(process.cwd(), "assets", "gift.webp.b64");
const dest = path.join(process.cwd(), "public", "gift.webp");

const buf = Buffer.from(fs.readFileSync(src, "utf8").replace(/\s+/g, ""), "base64");
const sha1 = crypto.createHash("sha1").update(buf).digest("hex");
if (sha1 !== EXPECTED_SHA1) {
  console.error(`[assets] gift.webp checksum mismatch (${sha1}). Refusing to build with a corrupted logo.`);
  process.exit(1);
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, buf);
console.log(`[assets] gift.webp restored and verified (${buf.length} bytes)`);
