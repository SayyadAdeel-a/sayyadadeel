// Counts the reveal hook attributes on a page and, for each, whether a CSS
// attribute selector matches — printed at several points after load.
//
// Why: two probes disagreed about the same page. `probe-reveal-binding.mjs`
// reported `[group-fedup-move-pfriend]` matching 0 elements, while
// `probe-attr-bytes.mjs` reported 5 on the same route. The difference between
// them is when they looked: Webflow's runtime writes some of these hook
// attributes from JavaScript after the document parses, so a snapshot taken too
// early sees fewer of them. That timing is not a curiosity — it decides whether
// a `wf:scroll` ScrollTrigger has anything to bind to, and therefore whether a
// reveal ever plays.
//
// Usage: node scripts/probe-hook-timeline.mjs [route]
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/";

const HOOKS = [
  "group-fedup-move-pfriend",
  "group-fedup-move",
  "group-fedup-phone-pfriend",
  "group-fedup-phone",
  "group-fade-up-parent",
  "group-fade-up-item",
  "fade-up",
  "fade",
  "marku-slide",
  "move-scroll-card-box",
];

/** Runs in the page. */
const COUNT = ({ hooks }) =>
  hooks.map((hook) => [hook, document.querySelectorAll(`[${hook}]`).length]);

const browser = await launch();
for (const [label, base] of [
  ["ref", ORIGIN],
  ["clone", LOCAL],
]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 90000 });

  console.log(`\n=== ${label} ${route} ===`);
  console.log("  after domcontentloaded:");
  for (const [hook, n] of await page.evaluate(COUNT, { hooks: HOOKS })) {
    console.log(`    ${String(n).padStart(3)}  [${hook}]`);
  }

  await page.waitForLoadState("networkidle").catch(() => {});
  console.log("  after networkidle:");
  for (const [hook, n] of await page.evaluate(COUNT, { hooks: HOOKS })) {
    console.log(`    ${String(n).padStart(3)}  [${hook}]`);
  }

  await page.waitForTimeout(2500);
  console.log("  after +2500ms:");
  const settled = await page.evaluate(COUNT, { hooks: HOOKS });
  for (const [hook, n] of settled) {
    console.log(`    ${String(n).padStart(3)}  [${hook}]`);
  }

  // Does the reference's own runtime add the attributes, or are they in the
  // served HTML? Compare against the captured HTML on disk.
  const html = await page.content();
  console.log("  in served HTML (this run's DOM):");
  for (const hook of HOOKS) {
    const inHtml = html.includes(`${hook}=`);
    console.log(`    ${inHtml ? "yes" : "no "}  ${hook}=`);
  }
  await context.close();
}
await browser.close();