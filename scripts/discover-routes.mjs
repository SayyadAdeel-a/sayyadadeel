// Discover every route published by the reference site: its sitemap, the nav
// links in the served HTML, and the Webflow CMS collection names that indicate
// detail pages.
//
// Usage: node scripts/discover-routes.mjs
import fs from "node:fs";

const ORIGIN = "https://relab-template.webflow.io";
const ART = "docs/research/relab-0c02b053/routes";

fs.mkdirSync(ART, { recursive: true });

async function get(path) {
  const res = await fetch(ORIGIN + path, {
    headers: { "user-agent": "Mozilla/5.0 clone-research" },
  });
  const text = await res.status === 200 ? await res.text() : "";
  return { status: res.status, text };
}

console.log("=== sitemap.xml ===");
const sitemap = await get("/sitemap.xml");
if (sitemap.status === 200) {
  console.log(sitemap.text.slice(0, 4000));
  fs.writeFileSync(`${ART}/sitemap.xml`, sitemap.text);
} else {
  console.log(`  (${sitemap.status})`);
}

console.log("\n=== nav links on the homepage ===");
const home = await get("/");
if (home.status === 200) {
  const links = new Set();
  for (const m of home.text.matchAll(/href="(\/[^"#]*)"/g)) links.add(m[1]);
  console.log([...links].sort().join("\n"));
}

console.log("\n=== probing candidate routes ===");
const CANDIDATES = [
  "/", "/about", "/services", "/case-studies", "/blogs", "/blog",
  "/pricing", "/contact", "/channel-logo", "/license", "/style-guide",
  "/404", "/not-found", "/styleguide", "/channel", "/case-study",
  "/blog-post", "/post",
];

const results = [];
for (const path of CANDIDATES) {
  const r = await get(path);
  const title = /<title>([^<]*)<\/title>/i.exec(r.text)?.[1] ?? "";
  const len = r.text.length;
  results.push({ path, status: r.status, len, title });
  console.log(
    `${String(r.status).padEnd(4)} ${String(len).padStart(7)}  ${path.padEnd(16)} ${title}`
  );
}

fs.writeFileSync(`${ART}/route-probe.json`, JSON.stringify(results, null, 2));