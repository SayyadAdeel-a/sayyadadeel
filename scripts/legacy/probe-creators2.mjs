import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright")
);

const url = process.argv[2] ?? "http://localhost:3100/";
const browser = await chromium.launch({
  executablePath:
    process.env.LOCALAPPDATA +
    "\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);

const top = await page.evaluate(
  () =>
    document.querySelector(".our-creators-section").getBoundingClientRect().top +
    window.scrollY
);
console.log("section top:", top);

const samples = [];
for (const offset of [0, 200, 400, 700, 1000, 1350, 1800, 2200]) {
  const y = top + offset;
  await page.evaluate(async (t) => {
    window.scrollTo(0, t);
    await new Promise((r) => setTimeout(r, 400));
  }, y);
  await page.waitForTimeout(1600);
  const s = await page.evaluate(() => {
    const m = getComputedStyle(document.querySelector(".box-one")).transform;
    const parts = m.slice(m.indexOf("(") + 1).split(",").map(Number);
    return { scrollY: Math.round(window.scrollY), x: parts[4], y: parts[5] };
  });
  samples.push({ offset, ...s });
  console.log(
    `offset=${String(offset).padStart(4)} scrollY=${s.scrollY} box-one=(${s.x}, ${s.y})`
  );
}

const browser2 = browser;
await browser2.close();

// Fit p = (scroll - start) / (end - start) with x = 500 - 400p.
const pts = samples.map((s) => ({
  scroll: s.scrollY,
  p: (500 - s.x) / 400,
}));
console.log("\nprogress samples:", pts.map((p) => `${p.scroll}:${p.p.toFixed(3)}`).join("  "));