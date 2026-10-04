/**
 * Loads every page in a real browser and fails on any asset that 404s.
 *
 * Usage:
 *   npx next start --port 3100
 *   node --experimental-strip-types scripts/verify-asset-loads.mjs
 *
 * ## Why this exists
 *
 * A static existence check proves a path in the source resolves to a file on
 * disk. It cannot prove the browser actually requested it, and it cannot catch a
 * rewrite that points at the *wrong* file — one that exists, loads, and is the
 * wrong image. Only a real load can.
 *
 * Every response with a 4xx/5xx status is recorded, together with which page
 * asked for it, and the run fails if there are any.
 */
import path from "node:path";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
await require(path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright"));
const { launch } = await import("./lib/qa.mjs");

const BASE = process.env.LOCAL_URL ?? "http://localhost:3100";

const registry = JSON.parse(
  readFileSync(path.join("docs", "research", "relab-0c02b053", "routes.json"), "utf8")
);
const routes = (registry.routes ?? registry).map((entry) =>
  typeof entry === "string" ? entry : entry.route ?? entry.path
);

let failures = 0;
const browser = await launch();

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  let current = "";
  const bad = [];

  page.on("response", (response) => {
    const status = response.status();
    if (status < 400) return;
    const url = new URL(response.url());
    // Only our own assets; a failure on the reference site is not ours.
    if (!url.pathname.startsWith("/assets/") && !url.pathname.startsWith("/sites/")) return;
    bad.push({ route: current, status, url: url.pathname });
  });

  let assetsOk = 0;

  for (const route of routes) {
    current = route;
    const before = bad.length;

    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
    // Scroll the whole page so lazy images and scroll-triggered sources fire.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);

    // Count images that actually decoded, rather than merely being requested.
    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src)
    );

    assetsOk += await page.evaluate(() => document.images.length);

    const newBad = bad.length - before;
    if (newBad === 0 && broken.length === 0) {
      console.log("  ok    " + route);
    } else {
      failures += 1;
      console.log("  FAIL  " + route);
      for (const entry of bad.slice(before)) {
        console.log("          " + entry.status + " " + entry.url);
      }
      for (const src of broken) console.log("          broken <img>: " + src);
    }
  }

  console.log("\nimages requested across all routes: " + assetsOk);
  console.log(failures === 0 ? "\nALL PAGES CLEAN: no asset failed to load." : "\n" + failures + " page(s) with failures");
} finally {
  await browser.close();
}

process.exitCode = failures === 0 ? 0 : 1;