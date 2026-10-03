// Write the canonical registry of every cloned route: path, page key,
// <title>, meta description, og image and the reference canonical URL.
//
// Usage: node scripts/build-routes-registry.mjs
import fs from "node:fs";
import { ART_ROOT, pageKey, readPage } from "./lib/page-pipeline.mjs";

const ROUTES = [
  "/",
  "/about",
  "/services",
  "/services/campaign-management",
  "/services/creator-partnerships",
  "/services/short-form-video-production",
  "/case-studies",
  "/case-studies/brew-blend-launch",
  "/case-studies/glowskin-launch",
  "/case-studies/movefit-challenge",
  "/case-studies/nova-ai-assistant",
  "/case-studies/urban-streetwear",
  "/blogs",
  "/blogs/behind-every-high-performing-influencer-campaign",
  "/blogs/choosing-the-right-kocs-for-your-next-campaign",
  "/blogs/how-to-work-viewers-in-the-first-3-seconds",
  "/blogs/short-video-trends-that-will-dominate-this-year",
  "/blogs/turning-creator-content-into-brand-growth",
  "/blogs/what-consumers-actually-want-to-watch-today",
  "/pricing",
  "/contact",
  "/licenses",
  "/style-guide",
  "/changelog",
  "/404",
];

// Webflow writes `<meta content="…" name="…"/>` (content first), so the
// attribute order cannot be assumed.
const meta = (head, attr) => {
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const nameAttr = /(?:^|\s)(?:name|property)="([^"]*)"/i.exec(tag);
    if (!nameAttr || nameAttr[1].toLowerCase() !== attr.toLowerCase()) continue;
    const content = /(?:^|\s)content="([^"]*)"/i.exec(tag);
    return content ? content[1] : null;
  }
  return null;
};
const prop = (head, attr) => meta(head, attr);

const entries = [];
for (const route of ROUTES) {
  const key = pageKey(route);
  const file = `${ART_ROOT}/${key}/live-page.html`;
  if (!fs.existsSync(file)) {
    console.log(`MISSING CAPTURE: ${route} -> ${key}`);
    continue;
  }
  const { head } = readPage(key);
  const title = /<title>([^<]*)<\/title>/i.exec(head)?.[1] ?? null;
  entries.push({
    route,
    pageKey: key,
    isHome: route === "/",
    title,
    description: meta(head, "description"),
    ogTitle: prop(head, "og:title"),
    ogDescription: prop(head, "og:description"),
    ogImage: prop(head, "og:image"),
    twitterImage: prop(head, "twitter:image"),
    canonical: /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i.exec(head)?.[1] ?? null,
  });
}

fs.writeFileSync(
  `${ART_ROOT}/routes.json`,
  JSON.stringify({ routes: entries }, null, 2)
);
console.log(`wrote ${ART_ROOT}/routes.json with ${entries.length} routes`);
for (const e of entries) {
  console.log(`  ${e.route.padEnd(56)} ${e.pageKey}`);
}