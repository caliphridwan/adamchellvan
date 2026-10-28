// Downloads the placeholder photographs of Lagos architecture into public/images/lagos/
// so the site serves them itself (no Cloudinary, no runtime dependency on Unsplash).
// Runs automatically after `npm install`; re-run any time with `npm run images:fetch`.
// All photos: Unsplash License (free for commercial use) — credits in src/lib/placeholder-images.ts.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const IMAGES = {
  victoriaIslandTowers: "photo-1572727850654-f50a7ead20df",
  victoriaIslandSkyline: "photo-1728597476224-1843cf5384f2",
  lekkiAerial: "photo-1618828665011-0abd973f7bb8",
  ikoyiRooftops: "photo-1594538756542-8c88bda491c5",
  lagosHighRise: "photo-1543414758-63906835c16b",
  lagosWhiteTower: "photo-1543414347-1c348021f279",
};

const quiet = process.argv.includes("--quiet");
const force = process.argv.includes("--force");
const dir = path.join(process.cwd(), "public", "images", "lagos");
mkdirSync(dir, { recursive: true });

let ok = 0;
let skipped = 0;
for (const [key, id] of Object.entries(IMAGES)) {
  const file = path.join(dir, `${key}.jpg`);
  if (existsSync(file) && !force) {
    skipped++;
    continue;
  }
  try {
    const res = await fetch(`https://images.unsplash.com/${id}?fm=jpg&fit=crop&w=2400&q=80`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10_000) throw new Error("file too small");
    writeFileSync(file, buf);
    ok++;
    if (!quiet) console.log(`✓ ${key}.jpg (${Math.round(buf.length / 1024)} KB)`);
  } catch (err) {
    // Never fail installs: the site falls back to Unsplash's CDN for any missing image.
    console.warn(`! Could not download ${key}: ${err.message}. The site will load it from Unsplash instead.`);
  }
}
if (!quiet || ok) console.log(`Placeholder images: ${ok} downloaded, ${skipped} already present → public/images/lagos/`);
