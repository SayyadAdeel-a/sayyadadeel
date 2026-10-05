/**
 * Screenshots the hero's social icon row, and reports whether each icon decoded.
 *
 * Usage: node scripts/shoot-icons.mjs [outfile]
 *
 * ## Why a screenshot and not a box measurement
 *
 * The icons are 64px squares fixed by CSS, so a box diff cannot tell a
 * correctly-drawn glyph from a broken one: a malformed SVG still occupies its
 * 64px box, it just draws nothing. These two icons were hand-authored path data
 * rather than exported from a brand kit, so the only honest check is to look at
 * them, and to confirm the browser actually decoded each file.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
await require(path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright"));
const { launch } = await import("./lib/qa.mjs");

const BASE = process.env.LOCAL_URL ?? "http://localhost:3100";
const OUT = process.argv[2] ?? "docs/hero-icons.png";

const browser = await launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);

  const row = page.locator(".hero-intro-right-wrapper").first();
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await row.screenshot({ path: OUT });

  // Did each icon actually decode, or is the file being served as an error page?
  const decoded = await page.evaluate(() => {
    const out = [];
    for (const img of document.querySelectorAll(".hero-intro-right-wrapper img")) {
      out.push({
        src: (img.currentSrc || img.src).split("/").pop(),
        alt: img.getAttribute("alt"),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        rendered: Math.round(img.getBoundingClientRect().width) + "x" + Math.round(img.getBoundingClientRect().height),
        decoded: img.complete && img.naturalWidth > 0,
      });
    }
    return out;
  });

  console.log("wrote " + OUT);
  for (const d of decoded) {
    console.log(
      "  " + (d.decoded ? "ok  " : "FAIL") +
      "  " + String(d.src).padEnd(38) +
      " alt=" + String(d.alt).padEnd(10) +
      " intrinsic " + d.naturalWidth + "x" + d.naturalHeight +
      "  rendered " + d.rendered
    );
  }
  const broken = decoded.filter((d) => !d.decoded);
  if (broken.length) {
    console.log("\n" + broken.length + " icon(s) failed to decode");
    process.exitCode = 1;
  } else {
    console.log("\nall icons decoded at full intrinsic size");
  }
} finally {
  await browser.close();
}
