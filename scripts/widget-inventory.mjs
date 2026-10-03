// Inventory the Webflow *widget* markup on every route: sliders, tabs,
// accordions, navigation, and the autoplay/loop attributes that drive them.
//
// Why: sliders, carousels and tabs are driven by Webflow's own widget runtime,
// not by the IX3 interaction payload the animation audits read. Nothing so far
// has checked that they work in the clone at all.
//
// Usage: node scripts/widget-inventory.mjs
import fs from "node:fs";
import { ART_ROOT, allRoutes } from "./lib/page-pipeline.mjs";

/** Count occurrences of a class or attribute inside a page's body markup. */
const count = (body, pattern) => (body.match(pattern) ?? []).length;

const WIDGETS = {
  sliders: /class="[^"]*\bw-slider\b/g,
  slideMasks: /class="[^"]*\bw-slider-mask\b/g,
  slides: /class="[^"]*\bw-slide\b/g,
  sliderNav: /class="[^"]*\bw-slider-nav\b/g,
  sliderArrowLeft: /class="[^"]*\bw-slider-arrow-left\b/g,
  sliderArrowRight: /class="[^"]*\bw-slider-arrow-right\b/g,
  autoplay: /\bw-autoplay\b/g,
  autoplayReverse: /\bw-autoplay-reverse\b/g,
  loop: /\bw--loop\b/g,
  swipeable: /\bw-swipeable\b/g,
  tabs: /class="[^"]*\bw-tabs\b/g,
  tabMenu: /class="[^"]*\bw-tabs-menu\b/g,
  tabPane: /class="[^"]*\bw-tab\b/g,
  tabActive: /\bw--tab-active\b/g,
  accordions: /class="[^"]*\baccordion\b/g,
};

const rows = [];
for (const entry of allRoutes()) {
  const html = fs.readFileSync(
    `${ART_ROOT}/${entry.pageKey}/live-page.html`,
    "utf8"
  );
  const body = html.slice(html.indexOf("<body"), html.indexOf("</body>"));
  const row = { route: entry.route };
  let any = false;
  for (const [name, pattern] of Object.entries(WIDGETS)) {
    row[name] = count(body, pattern);
    if (row[name]) any = true;
  }
  rows.push(row);
}

const columns = Object.keys(WIDGETS);
console.log(
  "route".padEnd(50) +
    columns.map((c) => c.slice(0, 9).padStart(10)).join("")
);
console.log("-".repeat(50 + columns.length * 10));
for (const row of rows) {
  const cells = columns.map((c) => String(row[c]).padStart(10)).join("");
  console.log(row.route.padEnd(50) + cells);
}

const totals = columns.map((c) => [
  c,
  rows.reduce((n, r) => n + r[c], 0),
]);
console.log("\ntotals:");
for (const [name, total] of totals) {
  if (total) console.log(`  ${String(total).padStart(4)}  ${name}`);
}

fs.writeFileSync(
  `${ART_ROOT}/generated/widget-inventory.json`,
  JSON.stringify(rows, null, 2)
);
console.log(`\nwrote ${ART_ROOT}/generated/widget-inventory.json`);