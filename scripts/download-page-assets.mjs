// Download every remote asset a captured page references into a content-named
// pool shared by all pages of the site, and write that page's asset map.
//
// Webflow CDN filenames embed a content hash, so identical assets dedupe to the
// same local file across pages.
//
// Usage: node scripts/download-page-assets.mjs [page-key ...]
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT, SITE_KEY, allRoutes, pageKey, readPage } from "./lib/page-pipeline.mjs";

const POOL_DIR = path.resolve(`public/sites/${SITE_KEY}/_pool`);
const POOL_INDEX = path.join(POOL_DIR, "index.json");

fs.mkdirSync(POOL_DIR, { recursive: true });

const pool = fs.existsSync(POOL_INDEX)
  ? JSON.parse(fs.readFileSync(POOL_INDEX, "utf8"))
  : {};

function localNameFor(remoteUrl) {
  let last = "asset";
  try {
    last = decodeURIComponent(new URL(remoteUrl).pathname.split("/").pop() ?? "asset");
  } catch {
    /* keep default */
  }
  let safe = last.replace(/[^A-Za-z0-9._-]+/g, "_");
  if (!safe || safe === "_" || safe.length < 3) {
    const ext = (() => {
      const m = /\.(jpe?g|png|gif|webp|avif|svg|mp4|webm|json|woff2?)$/i.exec(remoteUrl);
      return m ? m[1].replace("jpeg", "jpg") : "bin";
    })();
    safe = `asset-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  }
  return safe;
}

function ensureUnique(name) {
  if (!fs.existsSync(path.join(POOL_DIR, name))) return name;
  const ext = path.extname(name);
  const stem = name.slice(0, -ext.length);
  let n = 2;
  while (fs.existsSync(path.join(POOL_DIR, `${stem}-${n}${ext}`))) n += 1;
  return `${stem}-${n}${ext}`;
}

/** Collect every remote URL a page references. */
function collectUrls(body, head) {
  const urls = new Set();
  const add = (u) => {
    if (typeof u === "string" && /^https?:\/\//.test(u)) urls.add(u);
  };
  for (const m of body.matchAll(/\ssrc="([^"]+)"/g)) add(m[1]);
  for (const m of body.matchAll(/\ssrcset="([^"]+)"/g)) {
    for (const part of m[1].split(",")) add(part.trim().split(/\s+/)[0]);
  }
  for (const m of body.matchAll(/\sdata-poster-url="([^"]+)"/g)) add(m[1]);
  for (const m of body.matchAll(/\sdata-video-urls="([^"]+)"/g)) {
    for (const u of m[1].split(",")) add(u.trim());
  }
  for (const m of body.matchAll(/url\(["']?(https?:\/\/[^"')]+)["']?\)/g)) add(m[1]);
  for (const m of body.matchAll(/<source[^>]+src="([^"]+)"/g)) add(m[1]);
  for (const m of head.matchAll(/content="(https?:\/\/[^"]+\.(?:png|jpg|jpeg|svg|gif|webp))"/gi)) {
    add(m[1]);
  }
  // The CSS file itself is not downloaded per page; the site shares one
  // stylesheet, already localised in app/webflow.css.
  return urls;
}

const CONCURRENCY = 8;

async function fetchTo(url, target) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(target, buf);
  return buf.length;
}

const keys = process.argv.slice(2).length
  ? process.argv.slice(2)
  : allRoutes()
      .map((r) => r.route)
      .filter((r) => r !== "/")
      .map((r) => pageKey(r));

let totalNew = 0;
let totalCached = 0;
const allFailures = [];

for (const key of keys) {
  const dir = `${ART_ROOT}/${key}`;
  if (!fs.existsSync(`${dir}/live-page.html`)) {
    console.log(`skip ${key} (no capture)`);
    continue;
  }
  const { body, head } = readPage(key);
  const urls = [...collectUrls(body, head)];
  const mapPath = path.join(dir, "asset-map.json");
  const assetMap = fs.existsSync(mapPath)
    ? JSON.parse(fs.readFileSync(mapPath, "utf8"))
    : {};

  let fresh = 0;
  let cached = 0;
  const failures = [];
  const queue = urls.slice();

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const url = queue.shift();
        if (!url) return;
        if (pool[url]) {
          assetMap[url] = pool[url];
          cached += 1;
          continue;
        }
        try {
          const name = ensureUnique(localNameFor(url));
          const target = path.join(POOL_DIR, name);
          await fetchTo(url, target);
          const local = `/sites/${SITE_KEY}/_pool/${name}`;
          pool[url] = local;
          assetMap[url] = local;
          fresh += 1;
        } catch (err) {
          failures.push(`${url} -> ${err.message}`);
        }
      }
    })
  );

  fs.writeFileSync(mapPath, JSON.stringify(assetMap, null, 2));
  totalNew += fresh;
  totalCached += cached;
  console.log(
    `${key.padEnd(62)} urls=${String(urls.length).padStart(4)} new=${String(fresh).padStart(3)} cached=${String(cached).padStart(4)} failed=${failures.length}`
  );
  for (const f of failures) console.log(`    FAIL ${f}`);
  allFailures.push(...failures);
}

fs.writeFileSync(POOL_INDEX, JSON.stringify(pool, null, 2));
console.log(
  `\npool: ${Object.keys(pool).length} urls, ${fs.readdirSync(POOL_DIR).length - 1} files`
);
console.log(`new downloads: ${totalNew}, cache hits: ${totalCached}, failures: ${allFailures.length}`);