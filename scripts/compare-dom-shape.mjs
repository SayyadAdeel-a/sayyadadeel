// Compare the two DOM trees by structural path instead of index, so a single
// extra/missing element reports itself instead of cascading.
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright")
);

const width = Number(process.argv[2] ?? 390);
const height = Number(process.argv[3] ?? 844);

const outline = () => {
  const lines = [];
  const walk = (el, pathStr) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    const cls = el.className?.toString().split(/\s+/).slice(0, 2).join(".") ?? "";
    const p = `${pathStr}/${el.tagName.toLowerCase()}${cls ? "." + cls : ""}`;
    lines.push(p);
    // Number only the siblings that are part of the outline, so injected
    // zero-size nodes (Next.js payload scripts) do not shift the paths.
    const kept = [];
    for (const child of el.children) {
      const sub = walk(child, p);
      if (sub !== null) kept.push(sub);
    }
    return kept.length;
  };
  walk(document.body, "");
  return lines;
};

async function run(browser, url) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(2500);
  const list = await page.evaluate(outline);
  await ctx.close();
  return list;
}

const browser = await chromium.launch({
  executablePath:
    process.env.LOCALAPPDATA +
    "\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
});
const ref = await run(browser, "https://relab-template.webflow.io/");
const clone = await run(browser, process.env.LOCAL_URL ?? "http://localhost:3100/");
await browser.close();

console.log(`nodes: reference=${ref.length} clone=${clone.length}`);

const refSet = new Set(ref);
const cloneSet = new Set(clone);

const onlyRef = ref.filter((p) => !cloneSet.has(p));
const onlyClone = clone.filter((p) => !refSet.has(p));

console.log(`\nonly in reference (${onlyRef.length}):`);
for (const p of onlyRef.slice(0, 40)) console.log("  " + p);
console.log(`\nonly in clone (${onlyClone.length}):`);
for (const p of onlyClone.slice(0, 40)) console.log("  " + p);