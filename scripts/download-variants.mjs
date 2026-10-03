// Download every responsive image variant referenced by a `srcset` attribute so
// the clone serves the same candidate images (and therefore the same intrinsic
// dimensions) as the reference at every breakpoint.
import fs from "node:fs";
import path from "node:path";

const ART = "docs/research/relab-0c02b053/root-8a5edab2";
const SITE = "relab-0c02b053";
const PAGE = "root-8a5edab2";
const OUT_DIR = `public/sites/${SITE}/${PAGE}/variants`;

const mapPath = `${ART}/asset-map.json`;
const assetMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));

const html = fs.readFileSync(`${ART}/live-page.html`, "utf8");
const urls = new Set();
for (const m of html.matchAll(/srcset="([^"]+)"/gi)) {
  for (const part of m[1].split(",")) {
    const u = part.trim().split(/\s+/)[0];
    if (u) urls.add(u);
  }
}

function localNameFor(remoteUrl) {
  const last = decodeURIComponent(
    new URL(remoteUrl).pathname.split("/").pop() ?? "asset"
  );
  const safe = last.replace(/[^A-Za-z0-9._-]+/g, "_");
  return safe;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

let downloaded = 0;
let skipped = 0;
const failures = [];

const queue = [...urls];
const BATCH = 6;

async function worker() {
  while (queue.length) {
    const url = queue.shift();
    if (!url) return;
    const name = localNameFor(url);
    const target = path.join(OUT_DIR, name);
    const local = `/sites/${SITE}/${PAGE}/variants/${name}`;
    if (fs.existsSync(target)) {
      assetMap[url] = local;
      skipped += 1;
      continue;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(target, buf);
      assetMap[url] = local;
      downloaded += 1;
    } catch (err) {
      failures.push(`${url} -> ${err.message}`);
    }
  }
}

await Promise.all(Array.from({ length: BATCH }, worker));

fs.writeFileSync(mapPath, JSON.stringify(assetMap, null, 2));

console.log(`variants downloaded: ${downloaded}`);
console.log(`variants already present: ${skipped}`);
console.log(`failures: ${failures.length}`);
for (const f of failures) console.log("  " + f);
console.log(`asset-map entries: ${Object.keys(assetMap).length}`);