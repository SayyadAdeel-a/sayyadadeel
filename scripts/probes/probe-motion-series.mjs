// Reproduce the motion audit's sampling for one hook and print the raw series,
// so a "finding" can be confirmed or dismissed with data instead of inference.
//
// Usage: node scripts/probe-motion-series.mjs [route] [width] [hook]
import { launch, ORIGIN, LOCAL, open } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/";
const width = Number(process.argv[3] ?? 1440);
const hook = process.argv[4] ?? "marku-slide";
const SAMPLES = 14;
const DURATION = 4200;

const SERIES = async ({ hook, samples, duration }) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const nodes = [...document.querySelectorAll(`[${hook}]`)];
  const step = duration / (samples - 1);
  const rows = [];
  for (let i = 0; i < samples; i++) {
    rows.push({
      i,
      t: Math.round(i * step),
      values: nodes.map((el) => {
        const cs = getComputedStyle(el);
        const m = /matrix(3d)?\(([^)]+)\)/.exec(cs.transform);
        return {
          matrix: m ? m[2].split(",").map((v) => Math.round(Number(v) * 10) / 10) : null,
          left: Math.round(el.getBoundingClientRect().left * 10) / 10,
          width: Math.round(el.getBoundingClientRect().width * 10) / 10,
          opacity: cs.opacity,
        };
      }),
    });
    if (i < samples - 1) await sleep(step);
  }
  return { rows, scrollY: window.scrollY, scrollX: window.scrollX };
};

const browser = await launch();
for (const [label, base] of [
  ["ref", ORIGIN],
  ["clone", LOCAL],
]) {
  const context = await browser.newContext({
    viewport: { width, height: width < 992 ? 844 : 900 },
  });
  const page = await context.newPage();
  // Settle exactly like scripts/lib/qa.mjs open() does, so this reproduces the
  // audit's numbers rather than measuring a different situation.
  await open(page, base + route);
  const { rows, scrollX, scrollY } = await page.evaluate(SERIES, {
    hook,
    samples: SAMPLES,
    duration: DURATION,
  });
  console.log(`\n=== ${label} ${route} @${width} [${hook}] ===`);
  console.log(`  scrollX=${scrollX} scrollY=${scrollY}`);
  for (const row of rows) {
    console.log(
      `  ${String(row.t).padStart(5)}ms  ` +
        row.values
          .map(
            (v, n) =>
              `#${n} tx=${v.matrix ? v.matrix[4] : "-"} left=${v.left} w=${v.width}`
          )
          .join("  ")
    );
  }
  const tx = rows.map((r) => r.values[0].matrix?.[4]).filter((v) => v !== undefined);
  if (tx.length > 1) {
    const spread = Math.max(...tx) - Math.min(...tx);
    const totalLeft = rows.map((r) => r.values[0].left);
    console.log(
      `  tx spread over the window: ${Math.round(spread * 100) / 100}   ` +
        `left spread: ${
          Math.round((Math.max(...totalLeft) - Math.min(...totalLeft)) * 10) / 10
        }`
    );
    console.log(
      `  implied px/s: ${(
        (Math.max(...totalLeft) - Math.min(...totalLeft)) /
        (DURATION / 1000)
      ).toFixed(1)}`
    );
  }
  await context.close();
}
await browser.close();