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
  const hosts = [...document.querySelectorAll("[card-image-hover-pfriend]")].length;
  const childHost = child?.closest("[card-image-hover-pfriend]");
  return {
    hosts,
    childParent: child?.parentElement?.className,
    childHasHost: !!childHost,
    childInline: child?.getAttribute("style"),
  };
});
console.log("info:", JSON.stringify(info, null, 2));

const host = await page.$("[card-image-hover-pfriend]");
if (host) {
  await host.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const box = await host.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => {
    const c = document.querySelector("[card-image-hover-child='ture']");
    return { transform: getComputedStyle(c).transform, inline: c.getAttribute("style") };
  });
  console.log("after hover:", JSON.stringify(after, null, 2));
} else {
  console.log("no host found");
}
await browser.close();