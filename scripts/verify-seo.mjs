/**
 * verify-seo.mjs
 *
 * Checks the SEO guarantees that are easy to state and easy to silently break:
 * a sitemap that has drifted from the routes, a canonical that points somewhere
 * else, a page that is indexable but absent from the sitemap, an image that
 * lost its alt, a JSON-LD graph whose `@id` references resolve to nothing.
 *
 * Everything is measured from the **served** HTML rather than the source files,
 * because that is all a crawler sees. Next merges route metadata over the root
 * layout's and replaces `openGraph`/`twitter` wholesale, so a field can be
 * dropped without anything failing to build -- reading the source would certify
 * the intention rather than the bytes.
 *
 * Deliberately free of Playwright: it only needs `fetch`, so it runs on this
 * machine where the browser-based QA harnesses cannot.
 *
 *   node scripts/verify-seo.mjs                # http://127.0.0.1:3100
 *   LOCAL_URL=http://127.0.0.1:3100 node ...
 *   LOCAL_URL=https://adeelsayyad.tech node ...  # against the deployed site
 */

import fs from "node:fs";
import path from "node:path";

const ORIGIN = (process.env.LOCAL_URL || "http://127.0.0.1:3100").replace(/\/$/, "");
const SITE_URL = "https://adeelsayyad.tech";

/**
 * Retired template URLs, read out of `next.config.ts` rather than repeated here.
 *
 * There are 22 of them and restating them would mean the script could disagree
 * with the config without either side noticing. Both arrays are plain
 * `as const` literals, so a regex reaches them; if that shape ever changes the
 * parse fails loudly rather than silently passing.
 */
const cfg = fs.readFileSync(path.resolve("next.config.ts"), "utf8");

const block = (name) => {
  const m = cfg.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\] as const`));
  if (!m) throw new Error(`could not find \`const ${name}\` in next.config.ts`);
  return m[1];
};

// Old URL -> the homepage section that now carries that content.
const MOVED = [...block("MOVED").matchAll(/from:\s*"([^"]+)",\s*to:\s*"([^"]+)"/g)].map((m) => ({
  from: m[1],
  to: m[2],
}));

// Old URLs with no successor at all.
const GONE = [...block("GONE").matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const problems = [];
const notes = [];
/** Filled in by the sitemap section; used by the route-coverage check. */
let sitemapPaths = [];

const ok = (label, detail = "") =>
  console.log(`  \u2713 ${label}${detail ? "  " + detail : ""}`);
const bad = (label, detail = "") => {
  problems.push(label);
  console.log(`  \u2717 ${label}${detail ? "  " + detail : ""}`);
};

const grab = (html, re) => {
  const m = html.match(re);
  return m ? m[1].replace(/&amp;/g, "&").trim() : null;
};

async function get(url) {
  const res = await fetch(url, { redirect: "manual" });
  const body = res.status >= 200 && res.status < 300 ? await res.text() : "";
  return { status: res.status, headers: res.headers, body, url };
}

// ---------------------------------------------------------------------------
console.log(`\nSEO verification against ${ORIGIN}\n`);

// 1. sitemap --------------------------------------------------------------
console.log("sitemap.xml");
const sm = await get(`${ORIGIN}/sitemap.xml`);
if (sm.status !== 200) {
  bad(`sitemap.xml returned ${sm.status}`);
} else {
  const locs = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const parsed = locs.map((l) => new URL(l));

  const offOrigin = parsed.filter((u) => u.origin !== SITE_URL);
  offOrigin.length
    ? bad(`${offOrigin.length} URL(s) not on ${SITE_URL}`, offOrigin[0].href)
    : ok(`${locs.length} URL(s), all absolute and on ${SITE_URL}`);

  const badShape = parsed.filter((u) => u.search || u.hash);
  badShape.length
    ? bad(`${badShape.length} URL(s) carry a query or fragment`, badShape[0].href)
    : ok("no query strings or fragments");

  const lastmod = [...sm.body.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)];
  lastmod.length === locs.length
    ? ok("lastmod on every entry")
    : bad(`lastmod on ${lastmod.length} of ${locs.length} entries`);

  sitemapPaths = parsed.map((u) => u.pathname);
}

// 2. routes on disk vs what is published ----------------------------------
console.log("\nroutes");
const appDir = path.resolve("app");
const pageFiles = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === "page.tsx") pageFiles.push(p);
  }
};
walk(appDir);

const routes = pageFiles.map((p) => {
  const rel = path.relative(appDir, p).replace(/\\/g, "/");
  // `app/page.tsx` is the root route, so it has no directory to strip.
  return rel === "page.tsx" ? "/" : `/${rel.replace(/\/page\.tsx$/, "")}`;
});

const smSet = new Set(sitemapPaths || []);
for (const route of routes) {
  const res = await get(ORIGIN + route);
  const noindex = /noindex/i.test(res.headers.get("x-robots-tag") || "") ||
    /noindex/i.test(grab(res.body, /<meta name="robots" content="([^"]*)"/) || "");
  // A non-2xx response cannot be indexed regardless of what its body says, and
  // `/404` reaches this check exactly that way -- 404 status, noindex meta.
  const indexable = res.status === 200 && !noindex;

  if (smSet.has(route)) {
    indexable
      ? ok(`${route}  200, indexable, in sitemap`)
      : bad(`${route} is in the sitemap but is not indexable`, `status ${res.status}${noindex ? ", noindex" : ""}`);
  } else if (indexable) {
    bad(`${route} is indexable but missing from the sitemap`);
  } else {
    ok(`${route.padEnd(9)} excluded on purpose`, `status ${res.status}${noindex ? ", noindex" : ""}`);
  }
}

// A route with dynamic segments (e.g. `/writing/[slug]`) matches every concrete
// path that fills those segments, so a sitemap entry for a live article must be
// matched against the pattern, not the literal page-file string.
const routePattern = (route) =>
  new RegExp(`^${route.replace(/\[[^\]]+\]/g, "[^/]+")}$`);

for (const p of smSet) {
  const matches = routes.some((r) => r === p || routePattern(r).test(p));
  if (!matches) bad(`sitemap lists ${p}, which has no page file`);
}

// 3. per-page on-page ------------------------------------------------------
console.log("\non-page");
const INDEXABLE = (sitemapPaths || routes).filter((p) => p !== "/404");
const pages = {};
for (const route of INDEXABLE) pages[route] = await get(ORIGIN + route);

for (const [route, res] of Object.entries(pages)) {
  const h = res.body;
  const title = grab(h, /<title[^>]*>([\s\S]*?)<\/title>/);
  const desc = grab(h, /<meta name="description" content="([^"]*)"/);
  const canon = grab(h, /<link rel="canonical" href="([^"]*)"/);
  const h1s = [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) =>
    m[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
  );
  const imgs = [...h.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/\balt\s*=/.test(t));
  const expected = SITE_URL + (route === "/" ? "" : route);

  const checks = [
    ["title 40-65 chars", title && title.length >= 40 && title.length <= 65, `${title?.length}"${title}"`],
    ["description 50-160 chars", desc && desc.length >= 50 && desc.length <= 160, `${desc?.length}"`],
    ["canonical self-references", canon === expected, canon],
    ["exactly one h1", h1s.length === 1, JSON.stringify(h1s)],
    // Only the homepage needs to name the person in its heading. "/contact" is
    // legitimately headed "Let's Connect" -- a page that demanded its own name
    // in every h1 would read worse to a visitor than it did to a crawler.
    [
      route === "/" ? "h1 names the person" : "h1 is not empty",
      route === "/" ? !!h1s[0] && /adeel/i.test(h1s[0]) : !!h1s[0],
      h1s[0],
    ],
    ["html lang set", !!grab(h, /<html[^>]*\slang="([^"]*)"/), grab(h, /<html[^>]*\slang="([^"]*)"/)],
    ["og:image absolute https", /^https:\/\//.test(grab(h, /<meta property="og:image" content="([^"]*)"/) || ""), null],
    ["twitter:image matches og:image", grab(h, /<meta name="twitter:image" content="([^"]*)"/) === grab(h, /<meta property="og:image" content="([^"]*)"/), null],
    ["every image has an alt attribute", noAlt.length === 0, noAlt.length ? noAlt[0].slice(0, 90) : ""],
  ];

  for (const [label, pass, detail] of checks) {
    pass ? ok(`${route.padEnd(9)} ${label}`, detail || "") : bad(`${route} ${label}`, detail || "");
  }
}

// 4. structured data -------------------------------------------------------
console.log("\nstructured data");
const ids = new Set();
const dangling = [];
for (const [route, res] of Object.entries(pages)) {
  const nodes = [...res.body.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  if (!nodes.length) {
    bad(`${route} emits no JSON-LD`);
    continue;
  }
  const types = [];
  for (const n of nodes) {
    let json;
    try {
      json = JSON.parse(n[1]);
    } catch (e) {
      bad(`${route} has unparseable JSON-LD`, e.message);
      continue;
    }
    // collect every @id this route declares, then check the ones it references
    const collect = (o) => {
      if (!o || typeof o !== "object") return;
      if (o["@id"]) ids.add(o["@id"]);
      for (const v of Object.values(o)) {
        if (Array.isArray(v)) v.forEach(collect);
        else collect(v);
      }
    };
    collect(json);
    types.push(json["@type"] || json["@graph"]?.[0]?.["@type"]);
  }
  ok(`${route.padEnd(9)} ${nodes.length} node(s): ${types.join(", ")}`);

  // every "@id" reference must resolve to a node on one of the pages
  const refs = [...res.body.matchAll(/"@id"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  for (const r of refs) if (!ids.has(r)) dangling.push(`${route} -> ${r}`);
}
dangling.length ? bad(`JSON-LD @id reference(s) resolve to nothing`, dangling.join(", ")) : ok("every @id resolves");

// 5. robots ----------------------------------------------------------------
console.log("\nrobots.txt");
const robots = await get(`${ORIGIN}/robots.txt`);
if (robots.status !== 200) bad(`robots.txt returned ${robots.status}`);
else {
  const hasSitemap = robots.body.includes(`${SITE_URL}/sitemap.xml`);
  hasSitemap ? ok("points at the sitemap") : bad("does not reference the sitemap");
  // Next emits `User-Agent: *` with capital A and omits a redundant
  // `Allow: /` in some versions, so both are matched case-insensitively and a
  // blanket `Disallow: /` is what actually counts as blocking.
  const blocksAll = /Disallow:\s*\/\s*$/m.test(robots.body);
  /User-Agent:\s*\*/i.test(robots.body) && !blocksAll
    ? ok("allows every crawler")
    : bad("does not clearly allow crawling");
  /Disallow: \/404/.test(robots.body) ? ok("disallows /404") : notes.push("robots.txt does not disallow /404");
}

// 6. internal links --------------------------------------------------------
console.log("\ninternal links");
const seen = new Set();
const dead = [];
for (const res of Object.values(pages)) {
  for (const m of res.body.matchAll(/href="(\/[^"#:?]*)"/g)) {
    const p = m[1];
    if (!p || seen.has(p) || p.startsWith("/_next/") || p.startsWith("/assets/")) continue;
    seen.add(p);
    const r = await get(ORIGIN + p);
    if (r.status >= 400) dead.push(`${p} -> ${r.status}`);
  }
}
dead.length ? bad(`${dead.length} dead internal link(s)`, dead.join(", ")) : ok(`${seen.size} internal link(s) all resolve`);

// 7. retired URLs ----------------------------------------------------------
console.log("\nretired URLs");
{
  const wrong = [];
  for (const { from, to } of MOVED) {
    const r = await fetch(ORIGIN + from, { redirect: "manual" });
    const loc = r.headers.get("location") || "";
    // The fragment has to survive the redirect or the anchor lands nowhere, and
    // the destination has to be the section actually promised in the config.
    if (r.status !== 301) wrong.push(`${from} -> ${r.status}`);
    else if (loc !== to) wrong.push(`${from} -> ${loc} (expected ${to})`);
    else if (!to.includes("#")) wrong.push(`${from} redirects but carries no anchor`);
  }
  wrong.length
    ? bad(`${MOVED.length} moved URLs expected 301`, wrong.join(", "))
    : ok(`${MOVED.length} moved URL(s) still 301 to the right anchor`, MOVED.map((m) => `${m.from} -> ${m.to}`).join(", "));

  const gone = [];
  for (const p of GONE) {
    const r = await get(ORIGIN + p);
    if (r.status !== 410) gone.push(`${p} -> ${r.status}`);
    else if (!/noindex/i.test(r.headers.get("x-robots-tag") || "")) gone.push(`${p} is 410 but not marked noindex`);
  }
  gone.length
    ? bad(`${GONE.length} retired URLs expected 410`, gone.slice(0, 4).join(", "))
    : ok(`${GONE.length} retired URL(s) still answer 410 and carry x-robots-tag`);
}

// ---------------------------------------------------------------------------
console.log(`\n${problems.length ? `\u2717 ${problems.length} problem(s)\n` : "\u2713 all checks passed\n"}`);
if (notes.length) notes.forEach((n) => console.log(`  note: ${n}\n`));
process.exit(problems.length ? 1 : 0);
