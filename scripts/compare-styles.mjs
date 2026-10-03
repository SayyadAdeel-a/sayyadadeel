// Compare computed styles for a list of selectors between the reference site
// and the local clone, and report any property that differs.
//
// Usage: node scripts/compare-styles.mjs [--width=1440] [--height=900] [file-with-selectors]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const globalNodeModules = process.env.APPDATA + "\\npm\\node_modules";
const { chromium } = require(path.join(globalNodeModules, "playwright"));

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const WIDTH = Number(args.width ?? 1440);
const HEIGHT = Number(args.height ?? 900);
const REFERENCE = "https://relab-template.webflow.io/";
const LOCAL = args.local ?? "http://localhost:3100/";
const SELECTOR_FILE =
  args.selectors ??
  "docs/research/relab-0c02b053/root-8a5edab2/style-probe-selectors.txt";

const PROPS = [
  "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight",
  "letterSpacing", "color", "textTransform", "backgroundColor",
  "backgroundImage", "paddingTop", "paddingRight", "paddingBottom",
  "paddingLeft", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "width", "height", "maxWidth", "minWidth", "maxHeight", "minHeight",
  "display", "flexDirection", "justifyContent", "alignItems", "alignSelf",
  "gap", "rowGap", "columnGap", "gridTemplateColumns", "position", "top",
  "right", "bottom", "left", "zIndex", "borderRadius", "borderTop",
  "borderRight", "borderBottom", "borderLeft", "boxShadow", "overflow",
  "overflowX", "overflowY", "opacity", "transform", "transformOrigin",
  "transition", "cursor", "objectFit", "objectPosition", "mixBlendMode",
  "filter", "backdropFilter", "whiteSpace", "textOverflow", "float",
  "flexWrap", "flexDirection", "flexBasis", "flexGrow", "flexShrink",
  "aspectRatio", "inset", "visibility", "pointerEvents", "verticalAlign",
  "textDecoration", "textIndent", "listStyleType", "willChange",
];

const selectors = fs
  .readFileSync(SELECTOR_FILE, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

async function probe(browser, url) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(2800);

  const data = await page.evaluate(
    ({ selectors, props }) => {
      const out = {};
      for (const sel of selectors) {
        let els;
        try {
          els = document.querySelectorAll(sel);
        } catch {
          out[sel] = { error: "invalid selector" };
          continue;
        }
        if (!els.length) {
          out[sel] = { missing: true };
          continue;
        }
        const el = els[0];
        const cs = getComputedStyle(el);
        const styles = {};
        for (const p of props) styles[p] = cs[p];
        const rect = el.getBoundingClientRect();
        out[sel] = {
          count: els.length,
          styles,
          rect: {
            x: Math.round(rect.x * 100) / 100,
            y: Math.round((rect.y + window.scrollY) * 100) / 100,
            w: Math.round(rect.width * 100) / 100,
            h: Math.round(rect.height * 100) / 100,
          },
          text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 90),
        };
      }
      return out;
    },
    { selectors, props: PROPS }
  );

  const layout = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    bodyFont: getComputedStyle(document.body).fontFamily,
    bodyFontSize: getComputedStyle(document.body).fontSize,
    fonts: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style} ${f.status}`),
  }));

  await context.close();
  return { data, layout };
}

const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ??
    process.env.LOCALAPPDATA +
      "\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
});

const ref = await probe(browser, REFERENCE);
const clone = await probe(browser, LOCAL);
await browser.close();

console.log(`viewport ${WIDTH}x${HEIGHT}`);
console.log(
  `scrollHeight  reference=${ref.layout.scrollHeight}  clone=${clone.layout.scrollHeight}`
);
console.log(`body font    reference=${ref.layout.bodyFont}`);
console.log(`body font    clone    =${clone.layout.bodyFont}`);

let issues = 0;
for (const sel of selectors) {
  const a = ref.data[sel];
  const b = clone.data[sel];
  if (!a || !b) continue;
  if (a.missing && b.missing) continue;
  if (a.missing !== b.missing) {
    console.log(
      `\n[presence] ${sel}: reference ${a.missing ? "MISSING" : "present"}, clone ${b.missing ? "MISSING" : "present"}`
    );
    issues += 1;
    continue;
  }
  if (a.error || b.error) {
    console.log(`\n[selector] ${sel}: ${a.error ?? ""} / ${b.error ?? ""}`);
    issues += 1;
    continue;
  }
  if (a.count !== b.count) {
    console.log(`\n[count] ${sel}: reference=${a.count} clone=${b.count}`);
    issues += 1;
  }
  const diffs = [];
  for (const p of PROPS) {
    const av = a.styles?.[p];
    const bv = b.styles?.[p];
    if (av !== bv) diffs.push(`  ${p}: ref=${av} | clone=${bv}`);
  }
  if (diffs.length) {
    console.log(`\n[styles] ${sel}`);
    for (const d of diffs) console.log(d);
    issues += 1;
  }
  for (const k of ["x", "y", "w", "h"]) {
    const av = a.rect[k];
    const bv = b.rect[k];
    if (Math.abs(av - bv) > 1.5) {
      console.log(`\n[rect] ${sel}.${k}: ref=${av} clone=${bv} (delta ${(bv - av).toFixed(2)})`);
      issues += 1;
    }
  }
  if (a.text !== b.text) {
    console.log(`\n[text] ${sel}\n  ref  : ${a.text}\n  clone: ${b.text}`);
    issues += 1;
  }
}

console.log(`\n${issues} issue group(s) across ${selectors.length} selectors`);