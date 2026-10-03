// Content parity: compare the rendered text of every cloned route against the
// reference. The box comparison proves geometry; this proves nothing was lost
// in translation.
//
// Usage: node scripts/verify-content.mjs [--routes=/about,/blogs]
import { launch, open, ORIGIN, LOCAL, parseArgs } from "./lib/qa.mjs";

const args = parseArgs();
const allRoutes = JSON.parse(
  await import("node:fs").then((fs) =>
    fs.readFileSync("docs/research/relab-0c02b053/routes.json", "utf8")
  )
).routes.map((r) => r.route);

const routes =
  typeof args.routes === "string"
    ? args.routes.split(",").map((r) => r.trim())
    : allRoutes;

const browser = await launch();
let failures = 0;

/**
 * Visible text, one entry per text-bearing leaf element.
 *
 * `style` / `script` subtrees are skipped because the reference inlines a
 * `<style>` block in its body that the clone does not (see `QA_REPORT.md`).
 * `.w-slider` subtrees are skipped because an autoplaying slider shows a
 * different slide depending on when the page was sampled; every slide is
 * covered by the per-element box comparison instead.
 */
const TEXT = () => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const parts = [];
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent.replace(/[\s ]+/g, " ").trim();
    if (!text) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    if (parent.closest("style, script, noscript")) continue;
    if (parent.closest(".w-slider")) continue;
    const style = getComputedStyle(parent);
    if (style.display === "none" || style.visibility === "hidden") continue;
    parts.push(text);
  }
  return parts;
};

async function capture(base, route) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await open(page, base + route);
  const parts = await page.evaluate(TEXT);
  await context.close();
  return parts;
}

console.log(`comparing rendered text for ${routes.length} routes\n`);

for (const route of routes) {
  const ref = await capture(ORIGIN, route);
  const clone = await capture(LOCAL, route);

  // Align on the multiset of normalised strings so a duplicated string in one
  // and missing in the other still shows up as a difference.
  const count = (list) => {
    const map = new Map();
    for (const item of list) map.set(item, (map.get(item) ?? 0) + 1);
    return map;
  };
  const refCounts = count(ref);
  const cloneCounts = count(clone);

  const missing = [];
  const extra = [];
  for (const [text, n] of refCounts) {
    const other = cloneCounts.get(text) ?? 0;
    if (other < n) missing.push({ text, ref: n, clone: other });
  }
  for (const [text, n] of cloneCounts) {
    const other = refCounts.get(text) ?? 0;
    if (other < n) extra.push({ text, ref: other, clone: n });
  }

  const ok = missing.length === 0 && extra.length === 0;
  if (!ok) failures += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${route.padEnd(52)} ` +
      `strings ref=${String(ref.length).padStart(4)} clone=${String(clone.length).padStart(4)} ` +
      `missing=${missing.length} extra=${extra.length}`
  );
  for (const item of missing.slice(0, 8)) {
    console.log(`      missing "${item.text.slice(0, 90)}" (${item.ref} vs ${item.clone})`);
  }
  for (const item of extra.slice(0, 8)) {
    console.log(`      extra   "${item.text.slice(0, 90)}" (${item.ref} vs ${item.clone})`);
  }
}

await browser.close();
console.log(`\n${routes.length - failures}/${routes.length} routes match the reference's text`);
process.exitCode = failures === 0 ? 0 : 1;