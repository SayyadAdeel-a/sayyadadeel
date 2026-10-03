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

const info = await page.evaluate(() => {
  const child = document.querySelector("[card-image-hover-child='ture']");
  const parent = child.parentElement;
  const name = Array.from(parent.attributes).find((a) =>
    a.name.startsWith("card-image")
  ).name;
  return {
    name,
    codes: Array.from(name).map((c) => c.charCodeAt(0)).join(","),
    matchesBare: parent.matches("[" + name + "]"),
    matchesValue: parent.matches("[" + name + '="ture"]'),
    queryAll: document.querySelectorAll("[" + name + "]").length,
    expected: document.querySelectorAll("[card-image-hover-pfriend]").length,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();