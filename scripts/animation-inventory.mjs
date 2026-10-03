// Ground truth: which animation hooks and Webflow widgets exist on each page.
//
// This is the checklist the animation audit works from. It reads the captured
// reference HTML, so it lists what the reference *declares*; the audit then
// checks whether the clone actually animates each one.
//
// Usage: node scripts/animation-inventory.mjs
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT, allRoutes } from "./lib/page-pipeline.mjs";

/** Attribute values Webflow uses for its interaction hooks. */
const HOOK_VALUE = /^(?:ture|true|false|1|0)$/;

const rows = [];
const siteHooks = new Map(); // hook -> Set(pageKey)

for (const entry of allRoutes()) {
  const html = fs.readFileSync(
    path.join(ART_ROOT, entry.pageKey, "live-page.html"),
    "utf8"
  );
  const body = html.slice(html.indexOf("<body"), html.indexOf("</body>"));

  // Hook attributes: any lowercase attribute whose value is a boolean-ish word.
  const hooks = new Map();
  for (const m of body.matchAll(/<([a-zA-Z][\w-]*)\s([^>]*?)>/g)) {
    const tag = m[1];
    if (tag === "img" || tag === "meta" || tag === "link") continue;
    for (const a of m[2].matchAll(/([a-z][a-z0-9-]*)="([^"]*)"/g)) {
      const [, name, value] = a;
      if (!HOOK_VALUE.test(value)) continue;
      if (name.startsWith("data-") || name === "class" || name === "id") continue;
      hooks.set(name, (hooks.get(name) ?? 0) + 1);
    }
  }

  // Widget classes that drive motion in their own right.
  const classes = new Set();
  for (const m of body.matchAll(/class="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) classes.add(c);
  }
  const widgets = [];
  if (classes.has("w-slider")) widgets.push("w-slider");
  if (classes.has("w-tabs")) widgets.push("w-tabs");
  if (classes.has("w-background-video")) widgets.push("w-background-video");
  if (classes.has("hero-intro-card-box")) widgets.push("hero-intro-tabs(script)");
  if (classes.has("marquee-el")) widgets.push("marquee");
  if (classes.has("our-creators-sticky")) widgets.push("sticky-convergence");

  for (const hook of hooks.keys()) {
    if (!siteHooks.has(hook)) siteHooks.set(hook, new Set());
    siteHooks.get(hook).add(entry.pageKey);
  }

  rows.push({
    route: entry.route,
    pageKey: entry.pageKey,
    hooks: [...hooks.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    widgets,
    sliderCount: (body.match(/class="[^"]*\bw-slider\b/g) ?? []).length,
    videoCount: (body.match(/w-background-video/g) ?? []).length,
  });
}

console.log("=== per page ===\n");
for (const row of rows) {
  const hooks = row.hooks.map(([h, n]) => `${h}(${n})`).join(" ");
  console.log(`${row.route}`);
  console.log(`   widgets : ${row.widgets.join(", ") || "none"}`);
  console.log(`   sliders : ${row.sliderCount}   background videos: ${row.videoCount}`);
  console.log(`   hooks   : ${hooks || "none"}`);
  console.log();
}

console.log("=== hooks across the site ===\n");
const siteRows = [...siteHooks.entries()]
  .map(([hook, keys]) => [hook, keys.size])
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
for (const [hook, count] of siteRows) {
  console.log(`  ${String(count).padStart(3)} pages  ${hook}`);
}
console.log(`\n${siteRows.length} distinct hook attributes across ${rows.length} routes`);

fs.writeFileSync(
  `${ART_ROOT}/generated/animation-inventory.json`,
  JSON.stringify({ rows, siteHooks: Object.fromEntries([...siteHooks]) }, null, 2)
);
console.log(`\nwrote ${ART_ROOT}/generated/animation-inventory.json`);