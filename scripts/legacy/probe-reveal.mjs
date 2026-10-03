import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright")
);

const url = process.argv[2];
const target = Number(process.argv[3] ?? 10800);

const browser = await chromium.launch({
  executablePath:
    process.env.LOCALAPPDATA +
    "\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForLoadState("networkidle").catch(() => {});
await page.evaluate(() => document.fonts.ready).catch(() => {});
await page.waitForTimeout(2600);

await page.evaluate(async (t) => {
  const step = Math.max(120, Math.round(window.innerHeight * 0.6));
  let cur = window.scrollY;
  while (cur < t) {
    cur = Math.min(t, cur + step);
    window.scrollTo(0, cur);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 40)));
  }
  window.scrollTo(0, t);
}, target);
await page.waitForTimeout(2500);

const out = await page.evaluate(() => {
  const info = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      inline: el.getAttribute("style"),
      opacity: cs.opacity,
      transform: cs.transform,
      y: Math.round(r.y + window.scrollY),
      h: Math.round(r.height),
    };
  };
  return JSON.stringify(
    {
      scrollY: Math.round(window.scrollY),
      workedTextWrapper: info(".worked-image-text-wrapper"),
      workedHeading: info(".worked-text-name-wrap .h2"),
      brandsH2: info(".brands-section .h2"),
      pricingH2: info(".pricing-section .h2"),
      workedImageWrap: info(".worked-image-wrapper"),
    },
    null,
    2
  );
});
console.log(out);
await browser.close();