import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright")
);

const url = process.argv[2] ?? "https://relab-template.webflow.io/";
const width = Number(process.argv[3] ?? 1440);

const browser = await chromium.launch({
  executablePath:
    process.env.LOCALAPPDATA +
    "\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
});
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(2500);
const out = await page.evaluate(() => {
  const out = {};
  for (const sel of [".services-mask", ".process-slider .w-slider-mask"]) {
    const el = document.querySelector(sel);
    if (!el) { out[sel] = null; continue; }
    const cs = getComputedStyle(el);
    out[sel] = {
      inline: el.getAttribute("style"),
      ml: cs.marginLeft, mr: cs.marginRight, w: cs.width,
      x: el.getBoundingClientRect().x,
      parentW: el.parentElement.getBoundingClientRect().width,
      parentX: el.parentElement.getBoundingClientRect().x,
      slide0W: el.querySelector(".w-slide")?.getBoundingClientRect().width,
      slide0MR: el.querySelector(".w-slide") ? getComputedStyle(el.querySelector(".w-slide")).marginRight : null,
      sliderInline: el.parentElement.getAttribute("style"),
    };
  }
  out.sliderExtraAttrs = Array.from(document.querySelectorAll(".w-slider")).map((s) =>
    Array.from(s.attributes).map((a) => a.name).join(" ")
  );
  return JSON.stringify(out, null, 2);
});
console.log(out);
await browser.close();