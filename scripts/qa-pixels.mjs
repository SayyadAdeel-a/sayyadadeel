// Full-page pixel comparison for every cloned route: capture the reference and
// the clone at the same viewport after both have settled, then diff them.
//
// Usage:
//   node scripts/qa-pixels.mjs                    # every route, 1440 + 390
//   node scripts/qa-pixels.mjs --routes=/about --widths=1440
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, open, ORIGIN, LOCAL, parseArgs } from "./lib/qa.mjs";

const args = parseArgs();
const WIDTHS =
  typeof args.widths === "string"
    ? args.widths.split(",").map((w) => Number(w.trim()))
    : [1440, 390];

const allRoutes = JSON.parse(
  fs.readFileSync("docs/research/relab-0c02b053/routes.json", "utf8")
).routes.map((r) => r.route);

const routes =
  typeof args.routes === "string"
    ? args.routes.split(",").map((r) => r.trim())
    : allRoutes;

const OUT = "docs/research/relab-0c02b053/qa/pixels";
fs.mkdirSync(OUT, { recursive: true });

/** Decode the differing-pixel percentage out of diff-images.mjs's output. */
function parseDiff(output) {
  const mean = /mean abs delta per pixel: ([\d.]+)/.exec(output)?.[1];
  const pct = /differing pixels \(>64\): \d+ \(([\d.]+)%\)/.exec(output)?.[1];
  const sizeA = /^A .*: (\d+)x(\d+)/m.exec(output);
  const sizeB = /^B .*: (\d+)x(\d+)/m.exec(output);
  return {
    meanDelta: mean === undefined ? null : Number(mean),
    differingPct: pct === undefined ? null : Number(pct),
    refSize: sizeA ? `${sizeA[1]}x${sizeA[2]}` : null,
    cloneSize: sizeB ? `${sizeB[1]}x${sizeB[2]}` : null,
  };
}

const browser = await launch();
const rows = [];

for (const route of routes) {
  const slug = route === "/" ? "root" : route.slice(1).replace(/\//g, "-");
  for (const width of WIDTHS) {
    const shots = {};
    for (const [label, base] of [
      ["ref", ORIGIN],
      ["clone", LOCAL],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height: width < 992 ? 844 : 900 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await open(page, base + route);
      const file = path.join(OUT, `${slug}-${width}-${label}.png`);
      await page.screenshot({ path: file, fullPage: true });
      shots[label] = file;
      await context.close();
    }

    let diff = { differingPct: null, meanDelta: null };
    try {
      const output = execFileSync(
        process.execPath,
        [
          "scripts/diff-images.mjs",
          shots.ref,
          shots.clone,
          `--out=${path.join(OUT, `${slug}-${width}-diff.png`)}`,
        ],
        { encoding: "utf8" }
      );
      diff = parseDiff(output);
    } catch (error) {
      diff = { error: String(error.message).slice(0, 200) };
    }

    const row = { route, width, ...diff };
    rows.push(row);
    console.log(
      `${route.padEnd(52)} ${String(width).padEnd(5)} ` +
        `differing=${diff.differingPct === null ? "n/a" : `${diff.differingPct}%`} ` +
        `meanDelta=${diff.meanDelta ?? "n/a"} ` +
        `ref=${diff.refSize} clone=${diff.cloneSize}`
    );
  }
}

await browser.close();
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(rows, null, 2));
console.log(`\nreport: ${OUT}/report.json`);
const worst = rows
  .filter((r) => typeof r.differingPct === "number")
  .sort((a, b) => b.differingPct - a.differingPct)
  .slice(0, 5);
if (worst.length) {
  console.log("\nlargest differences:");
  for (const row of worst) {
    console.log(`  ${row.route} @${row.width}: ${row.differingPct}%`);
  }
}