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

const read = () =>
  page.evaluate(() => {
    const wrap = document.querySelector(".nav-button-wrap .button-text-wrap");
    const normal = document.querySelector(
      ".nav-button-wrap .button-normal-text"
    );
    const hover = document.querySelector(".nav-button-wrap .button-hover-text");
    const icon = document.querySelector(
      ".nav-button-wrap [button-icon-anin-one]"
    );
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const first = document.querySelector(
      ".nav-button-wrap .button-normal-text .gsap_split_letter, .nav-button-wrap .button-normal-text div"
    );
    const last = [...document.querySelectorAll(
      ".nav-button-wrap .button-normal-text .gsap_split_letter, .nav-button-wrap .button-normal-text div"
    )].pop();
    return {
      wrapRectY: wrap ? Math.round(wrap.getBoundingClientRect().y) : null,
      wrapH: wrap ? Math.round(wrap.getBoundingClientRect().height) : null,
      normalRectY: normal ? Math.round(normal.getBoundingClientRect().y) : null,
      hoverRectY: hover ? Math.round(hover.getBoundingClientRect().y) : null,
      normalTransform: normal ? cs(normal).transform : null,
      hoverTransform: hover ? cs(hover).transform : null,
      iconTransform: icon ? cs(icon).transform : null,
      firstChar: first ? cs(first).transform : null,
      lastChar: last ? cs(last).transform : null,
    };
  });

console.log("AT REST:", JSON.stringify(await read(), null, 2));

const btn = await page.$(".nav-button-wrap .button");
await btn.hover();
await page.waitForTimeout(120);
console.log("HOVER 120ms:", JSON.stringify(await read(), null, 2));
await page.waitForTimeout(600);
console.log("HOVER 720ms:", JSON.stringify(await read(), null, 2));

await page.mouse.move(5, 700);
await page.waitForTimeout(900);
console.log("OUT 900ms:", JSON.stringify(await read(), null, 2));
await browser.close();