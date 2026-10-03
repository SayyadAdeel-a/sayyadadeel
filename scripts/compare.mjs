// Side-by-side screenshot harness: captures the reference site and the local
// clone at identical viewport widths and scroll offsets.
//
// Usage:
//   node scripts/compare.mjs [--width=1440] [--out=docs/design-references/...]
//                              [--sections] [--full]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const globalNodeModules =
  process.env.APPDATA + "\\npm\\node_modules";
const { chromium } = require(path.join(globalNodeModules, "playwright"));

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const WIDTH = Number(args.width ?? 1440);
const HEIGHT = Number(args.height ?? 900);
const OUT = args.out ?? `docs/design-references/relab-0c02b053/root-8a5edab2/compare-${WIDTH}`;
const REFERENCE = "https://relab-template.webflow.io/";
const LOCAL = args.local ?? "http://localhost:3100/";

const SECTIONS = [
  ["header", 0],
  ["hero", 1],
  ["hero-intro", 2],
  ["our-creators", 3],
  ["creators-mid", 4],
  ["creators-end", 5],
  ["services", 6],
  ["meet", 7],
  ["featured-work", 8],
  ["capabilities", 9],
  ["process", 10],
  ["clients", 11],
  ["brands", 12],
  ["worked", 13],
  ["pricing", 14],
  ["reviews", 15],
  ["insights", 16],
  ["cta", 17],
  ["footer", 18],
];

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  // Let Webflow / GSAP finish its intro timeline.
  await page.waitForTimeout(2600);
}

/**
 * Scroll in small steps so scroll-triggered animations fire exactly as they do
 * for a human reader, then wait for the scrub tweens to catch up.
 */
async function scrollTo(page, top) {
  await page.evaluate(async (target) => {
    const step = Math.max(120, Math.round(window.innerHeight * 0.6));
    let current = window.scrollY;
    while (current < target) {
      const next = Math.min(target, current + step);
      window.scrollTo(0, next);
      current = next;
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 40)));
    }
    window.scrollTo(0, target);
  }, top);
  await page.waitForTimeout(Number(args.settle ?? 900));
  if (args.verbose) {
    const settled = await page.evaluate(() => Math.round(window.scrollY));
    console.log(`  requested ${top} -> settled ${settled}`);
  }
}

async function capture(browser, url, prefix) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 300)));

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await settle(page);

  const metrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    bodyHeight: document.body.scrollHeight,
  }));
  console.log(`${prefix} scrollHeight=${metrics.scrollHeight}`);

  fs.mkdirSync(OUT, { recursive: true });

  if (args.full) {
    await page.screenshot({
      path: path.join(OUT, `${prefix}-full.png`),
      fullPage: true,
    });
  }

  if (args.sections) {
    // Offsets can be given explicitly: --offsets=0,600,1200
    const offsets = args.offsets
      ? String(args.offsets)
          .split(",")
          .map((n) => Number(n.trim()))
      : SECTIONS.map((_, i) =>
          Math.round(
            (i / (SECTIONS.length - 1)) * (metrics.scrollHeight - HEIGHT)
          )
        );
    for (let i = 0; i < offsets.length; i++) {
      const top = offsets[i];
      const name = args.offsets
        ? `y${String(top).padStart(5, "0")}`
        : SECTIONS[i][0];
      const clamped = Math.max(
        0,
        Math.min(top, metrics.scrollHeight - HEIGHT)
      );
      await scrollTo(page, clamped);
      await page.screenshot({
        path: path.join(OUT, `${prefix}-${name}.png`),
      });
    }
  }

  if (errors.length) {
    console.log(`${prefix} console errors:`);
    for (const e of [...new Set(errors)].slice(0, 12)) console.log("   " + e);
  } else {
    console.log(`${prefix} no console errors`);
  }

  await context.close();
  return metrics;
}

const browser = await chromium.launch({
  // The globally installed Playwright package expects a different Chromium
  // build than the one cached on this machine; point it at the cached build.
  executablePath:
    process.env.CHROMIUM_PATH ??
    process.env.LOCALAPPDATA +
      "\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
});
const refMetrics = await capture(browser, REFERENCE, "ref");
const localMetrics = await capture(browser, LOCAL, "clone");
await browser.close();

console.log(
  `\nheight delta: reference=${refMetrics.scrollHeight} clone=${localMetrics.scrollHeight}`
);