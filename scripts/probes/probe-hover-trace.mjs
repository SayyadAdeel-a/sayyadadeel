// Poll one hover through time on both sites: move the real mouse onto a trigger,
// then sample the target's inline style and computed transform every 50ms.
//
// Why: `audit-hover.mjs` reported no hover animation on either site, and a
// single before/after read could be wrong for mundane reasons — the tween may
// have finished and reverted, the pointer may never have entered, or the element
// chosen may be one of the 0x0 nav duplicates. Sampling the whole window shows
// which, and prints the distinct states rather than a verdict.
//
// Usage: node scripts/probe-hover-trace.mjs <route> <width> <trigger> <target>
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/about";
const width = Number(process.argv[3] ?? 1440);
const triggerSelector = process.argv[4] ?? ".text-button";
const targetSelector = process.argv[5] ?? ".text-button-normal-text";
const TRIGGER_INDEX = Number(process.argv[6] ?? 9);

const SNAPSHOT = ({ selector }) => {
  const parse = (transform) => {
    if (!transform || transform === "none") return null;
    const m = /matrix(3d)?\(([^)]+)\)/.exec(transform);
    return m ? m[2].split(",").map((v) => Math.round(Number(v) * 10) / 10) : null;
  };
  return [...document.querySelectorAll(selector)].map((el) => {
    const cs = getComputedStyle(el);
    return {
      matrix: parse(cs.transform),
      opacity: Math.round(Number(cs.opacity) * 1000) / 1000,
      inline: el.getAttribute("style"),
      cls: el.className?.toString().slice(0, 44) ?? "",
    };
  });
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
  await open(page, base + route);

  const target = page.locator(triggerSelector).nth(TRIGGER_INDEX);
  await target.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);

  const box = await target.boundingBox();
  console.log(`\n=== ${label} ${route} @${width} ===`);
  console.log(
    `  trigger ${triggerSelector}[${TRIGGER_INDEX}] box=${box ? `${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)}` : "none"}`
  );
  if (!box) {
    await context.close();
    continue;
  }

  // Park the pointer well away first, so the hover is a genuine enter.
  await page.mouse.move(2, 2);
  await page.waitForTimeout(500);

  // What is actually on top at the point we are about to hover? A covering
  // element means the pointer never reaches the trigger and no hover can fire.
  const hit = await page.evaluate(
    ({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return { none: true };
      const chain = [];
      let node = el;
      while (node && chain.length < 6) {
        chain.push(
          `<${node.tagName.toLowerCase()} class="${node.className?.toString().split(/\s+/).slice(0, 3).join(".")}">`
        );
        node = node.parentElement;
      }
      return { hit: chain };
    },
    { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) }
  );
  console.log(`  elementFromPoint at hover target: ${JSON.stringify(hit)}`);
  const rest = await page.evaluate(SNAPSHOT, { selector: targetSelector });
  const distinct = new Map();
  const record = async (phase, ms) => {
    const now = await page.evaluate(SNAPSHOT, { selector: targetSelector });
    now.forEach((row, i) => {
      const key = `${row.matrix ? row.matrix.join(",") : "-"}|${row.opacity}`;
      if (!distinct.has(key)) {
        distinct.set(key, { phase, ms, index: i, cls: row.cls, row });
      }
    });
  };

  await record("rest", 0);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let t = 50; t <= 1200; t += 50) {
    await page.waitForTimeout(50);
    await record("hover", t);
  }
  await page.mouse.move(2, 2);
  for (let t = 50; t <= 1000; t += 50) {
    await page.waitForTimeout(50);
    await record("leave", t);
  }

  console.log(`  ${distinct.size} distinct state(s) across ${targetSelector}:`);
  for (const [key, info] of distinct) {
    console.log(
      `    [${info.phase} ${String(info.ms).padStart(4)}ms] target[${info.index}] ${info.cls}`
    );
    console.log(`        ${key}`);
    console.log(`        inline=${JSON.stringify(info.row.inline)}`);
  }
  if (distinct.size === 1) {
    console.log("  NO CHANGE: the tween never ran on this element.");
  }
  await context.close();
}
await browser.close();
