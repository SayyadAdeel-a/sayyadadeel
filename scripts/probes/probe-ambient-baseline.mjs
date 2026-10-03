// How much does the reference differ from *itself* on consecutive loads?
//
// The clone's remaining pixel differences are concentrated on sections driven by
// infinite ambient loops, whose phase depends on when the page was sampled. This
// measures the reference against itself to establish the size of that baseline,
// so the clone's numbers can be read in context.
//
// Usage: node scripts/probe-ambient-baseline.mjs [route] [width] [gapMs]
//
// The homepage is excluded on purpose: it is frozen and already documented.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { launch, ORIGIN, open } from "../lib/qa.mjs";

const OUT = "docs/research/relab-0c02b053/qa/pixels";
const slug = (route) => (route === "/" ? "root" : route.slice(1).replace(/\//g, "-"));

const targets = (
  process.argv.slice(2).length ? process.argv.slice(2) : ["/about", "/services"]
).filter((arg) => !/^\d+$/.test(arg));
const width = Number(
  process.argv.slice(2).find((arg) => /^\d+$/.test(arg)) ?? 1440
);
const gap = Number(
  process.argv.slice(2).find((arg) => /^\d+$/.test(arg)) ?? 900
) + Number(process.argv.slice(2).find((arg) => /^\d+$/.test(arg)) ?? 0);
const count = 4;

const browser = await launch();
const rows = [];

for (const route of targets) {
  // Each baseline capture gets its own browser context, so the measurement is
  // unaffected by state left behind by the previous route.
  const files = [];
  for (let i = 0; i < count; i++) {
    const context = await browser.newContext({
      viewport: { width, height: width < 992 ? 844 : 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await open(page, ORIGIN + route);
    if (i > 0) await page.waitForTimeout(gap);
    const file = path.join(OUT, `_baseline-${slug(route)}-${width}-${i}.png`);
    await page.screenshot({ path: file, fullPage: true });
    files.push(file);
    await context.close();
  }

  function diffPercent(a, b) {
    const output = execFileSync(
      process.execPath,
      ["scripts/diff-images.mjs", a, b],
      { encoding: "utf8" }
    );
    return (
      Number(
        /differing pixels \(>64\): \d+ \(([\d.]+)%\)/.exec(output)?.[1] ?? "NaN"
      ) || 0
    );
  }

  const first = files[0];
  const selfDiffs = files.slice(1).map((file) => diffPercent(first, file));
  const reference = path.join(OUT, `${slug(route)}-${width}-ref.png`);
  const clone = path.join(OUT, `${slug(route)}-${width}-clone.png`);
  const vsClone = fs.existsSync(clone) && fs.existsSync(reference)
    ? diffPercent(reference, clone)
    : null;

  rows.push({ route, width, selfDiffs, vsClone });
  console.log(`\n=== ${route} @${width} ===`);
  console.log(
    `reference vs itself (${count - 1} reloads, ${gap}ms apart): ` +
      selfDiffs.map((d) => `${d}%`).join(", ")
  );
  if (vsClone !== null) {
    console.log(`reference vs clone                        : ${vsClone}%`);
    console.log(
      vsClone <= Math.max(...selfDiffs)
        ? "  -> the clone's difference is inside the reference's own reload noise"
        : "  -> LARGER than the reference's own reload noise; investigate"
    );
  }

  for (const file of files) {
    // Leave the tree clean: the baseline captures are throwaway.
    try {
      fs.unlinkSync(file);
    } catch {
      /* ignore */
    }
  }
}

await browser.close();

const previous = fs.existsSync(`${OUT}/ambient-baseline.json`)
  ? JSON.parse(fs.readFileSync(`${OUT}/ambient-baseline.json`, "utf8"))
  : [];
const merged = [...previous.filter((r) => !rows.some((n) => n.route === r.route && r.width === n.width)), ...rows];
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/ambient-baseline.json`, JSON.stringify(merged, null, 2));
console.log(`\nreport: ${OUT}/ambient-baseline.json`);