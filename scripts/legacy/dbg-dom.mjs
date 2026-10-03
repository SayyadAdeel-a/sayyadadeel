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
const out = await page.evaluate(() => {
  const el = document.querySelector(".decorated-title-style-text-wrap");
  const h = document.querySelector(".our-creators-section h2");
  const span = document.querySelector(".spen-style");
  return JSON.stringify(
    {
      wrapHTML: el?.outerHTML.slice(0, 400),
      spanNext: span?.nextSibling?.nodeType,
      spanNextData: JSON.stringify(span?.nextSibling?.data),
      h2: h?.outerHTML.slice(0, 220),
      bodyHasNbsp: document.body.innerHTML.includes("&nbsp;"),
    },
    null,
    2
  );
});
console.log(out);
await browser.close();