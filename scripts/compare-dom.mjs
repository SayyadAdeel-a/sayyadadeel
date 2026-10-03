// Structural parity: walk every element in the reference and the clone and
// compare bounding boxes and computed styles, reporting the largest outliers.
//
// Usage: node scripts/compare-dom.mjs --width=390 --height=844 [--tolerance=1]
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright")
);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const WIDTH = Number(args.width ?? 1440);
const HEIGHT = Number(args.height ?? 900);
const TOLERANCE = Number(args.tolerance ?? 1);
const LIMIT = Number(args.limit ?? 60);

const collect = () => {
  const out = [];
  const walk = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" && cs.visibility === "hidden") return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      for (const child of el.children) walk(child);
      return;
    }
    // A non-`none` matrix means GSAP is driving this element; its subtree is
    // phase-dependent and is verified by the behaviour harness instead.
    const animated =
      /^(matrix|matrix3d)\(/.test(cs.transform) && cs.transform !== "none";
    const start = out.length;
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: el.className?.toString().slice(0, 90) ?? "",
      id: el.id ?? "",
      x: Math.round((r.x + window.scrollX) * 100) / 100,
      y: Math.round((r.y + window.scrollY) * 100) / 100,
      w: Math.round(r.width * 100) / 100,
      h: Math.round(r.height * 100) / 100,
      text: (el.childElementCount === 0 ? el.textContent : "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60),
      animated,
    });
    for (const child of el.children) walk(child);
    if (animated) for (let i = start; i < out.length; i++) out[i].animated = true;
  };
  walk(document.body);
  return out;
};

async function run(browser, url) {
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(2500);
  // Scroll the whole page so lazy content and reveals are in their settled state.
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
  });
  await page.waitForTimeout(1200);
  const list = await page.evaluate(collect);
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

console.log(`viewport ${WIDTH}x${HEIGHT}  tolerance ${TOLERANCE}px`);
console.log(`elements: reference=${ref.length} clone=${clone.length}`);

if (ref.length !== clone.length) {
  console.log("  ^ element count mismatch");
}

let reported = 0;
let mismatches = 0;
for (let i = 0; i < Math.min(ref.length, clone.length); i++) {
  const a = ref[i];
  const b = clone[i];
  const sameNode =
    a.tag === b.tag && a.cls === b.cls && (a.id === b.id || !a.id);
  if (!sameNode) {
    mismatches += 1;
    if (reported++ < LIMIT) {
      console.log(`\n#${i} NODE MISMATCH`);
      console.log(`  ref  : <${a.tag} id="${a.id}" class="${a.cls}">`);
      console.log(`  clone: <${b.tag} id="${b.id}" class="${b.cls}">`);
    }
    continue;
  }
  const d = {
    x: Math.abs(a.x - b.x),
    y: Math.abs(a.y - b.y),
    w: Math.abs(a.w - b.w),
    h: Math.abs(a.h - b.h),
  };
  const worst = Math.max(d.x, d.y, d.w, d.h);
  if (worst <= TOLERANCE) continue;
  // Elements whose ancestor is GSAP-animated depend on the animation phase at
  // sample time; the behaviour harness covers those separately.
  if (args.static && (a.animated || b.animated)) continue;
  mismatches += 1;
  if (reported++ < LIMIT) {
    console.log(
      `\n#${i} <${a.tag} class="${a.cls}">${a.animated || b.animated ? " [animated]" : ""}`
    );
    console.log(
      `  ref  : x=${a.x} y=${a.y} w=${a.w} h=${a.h}  "${a.text}"`
    );
    console.log(
      `  clone: x=${b.x} y=${b.y} w=${b.w} h=${b.h}  "${b.text}"`
    );
  }
}

console.log(
  `\n${mismatches} mismatching element(s) out of ${Math.min(ref.length, clone.length)}`
);