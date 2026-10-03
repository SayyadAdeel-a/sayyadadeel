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

const geo = await page.evaluate(() => {
  const el = document.querySelector(".our-creators-section");
  const r = el.getBoundingClientRect();
  return {
    top: Math.round(r.top + window.scrollY),
    height: Math.round(r.height),
    sticky: (() => {
      const s = document.querySelector(".our-creators-sticky");
      const sr = s.getBoundingClientRect();
      return { pos: getComputedStyle(s).position, h: Math.round(sr.height) };
    })(),
    innerHeight: window.innerHeight,
  };
});
console.log("geometry:", JSON.stringify(geo));

const target = geo.top + 400;
await page.evaluate(async (t) => {
  window.scrollTo(0, t);
  await new Promise((r) => setTimeout(r, 1500));
}, target);
await page.waitForTimeout(1500);

const state = await page.evaluate(() => ({
  scrollY: Math.round(window.scrollY),
  boxes: ["box-one", "box-two", "box-three", "box-four"].map((c) =>
    getComputedStyle(document.querySelector(`.${c}`)).transform
  ),
}));
console.log("state:", JSON.stringify(state, null, 2));
console.log(
  `implied progress: ${((1 - (parseFloat(state.boxes[0].slice(7).split(",")[0]) - 100) / 400) * 100).toFixed(2)}%`
);
await browser.close();