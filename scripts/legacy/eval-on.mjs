import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright")
);

const url = process.argv[2] ?? "http://localhost:3100/";
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);
const scriptArg = process.argv[3];
const script = fs.existsSync(scriptArg)
  ? fs.readFileSync(scriptArg, "utf8")
  : scriptArg;

const browser = await chromium.launch({
  executablePath:
    process.env.LOCALAPPDATA +
    "\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
});
const page = await browser.newPage({ viewport: { width, height } });
const logs = [];
page.on("console", (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on("pageerror", (e) => logs.push(`PAGEERROR: ${e.message}`));
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);
const result = await page.evaluate(script);
console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2));
if (logs.length) {
  console.log("--- console ---");
  for (const l of logs.slice(0, 30)) console.log(l);
}
await browser.close();