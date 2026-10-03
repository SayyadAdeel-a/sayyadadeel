// Why do some homepage reveal elements sit at their *from* state in the clone
// but already revealed in the reference, on a fresh load with no scrolling?
//
// `audit-reveals.mjs` reported `group-fedup-move` elements on `/` that read
// opacity 1 / translate 0 in the reference and opacity 0 / translate 100 in the
// clone before any scrolling. This probe records, without scrolling at all,
// whether each element is inside the viewport, how the trigger would evaluate,
// and what the element's own inline style says.
//
// Usage: node scripts/probe-reveal-init.mjs [route] [width] [hook]
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/";
const width = Number(process.argv[3] ?? 1440);
const hook = process.argv[4] ?? "group-fedup-move";

/** Runs in the page. No scrolling, so `rect.top` is document-relative here. */
const PROBE = ({ hook }) => {
  const parse = (transform) => {
    if (!transform || transform === "none") return null;
    const m = /matrix(3d)?\(([^)]+)\)/.exec(transform);
    return m ? m[2].split(",").map(Number) : null;
  };
  const viewportHeight = window.innerHeight;

  return [...document.querySelectorAll(`[${hook}]`)].map((el, index) => {
    const rect = el.getBoundingClientRect();
    const docTop = Math.round(rect.top + window.scrollY);
    const cs = getComputedStyle(el);
    const matrix = parse(cs.transform);

    // Which element carries the wf:scroll trigger for this one?
    const parent = el.closest(
      "[group-fedup-move-pfriend],[group-fade-up-parent],.our-values-wrapper,[fade-up]"
    );

    return {
      index,
      cls: el.className?.toString().slice(0, 54) ?? "",
      docTop,
      height: Math.round(rect.height),
      // "top 92%" means the trigger fires when the element's top crosses 92% of
      // the viewport. Anything with docTop < 0.92 * viewportHeight has already
      // crossed it at load, and so should already be played.
      crossed92: docTop < Math.round(viewportHeight * 0.92),
      inViewport: docTop < viewportHeight && docTop + rect.height > 0,
      opacity: Math.round(Number(cs.opacity) * 1000) / 1000,
      ty: matrix && matrix.length >= 6 ? Math.round(matrix[5] * 10) / 10 : 0,
      inline: el.getAttribute("style"),
      parentCls: parent?.className?.toString().slice(0, 44) ?? null,
      parentDocTop: parent
        ? Math.round(parent.getBoundingClientRect().top + window.scrollY)
        : null,
      parentCrossed92: parent
        ? parent.getBoundingClientRect().top + window.scrollY <
          Math.round(viewportHeight * 0.92)
        : null,
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
  // settle:false — the whole point is to observe the state with zero scrolling.
  await open(page, base + route, { settle: false });
  await page.waitForTimeout(1500);
  const rows = await page.evaluate(PROBE, { hook });
  console.log(`\n=== ${label} ${route} @${width} [${hook}] (no scrolling) ===`);
  console.log(
    `  ${String(rows.length).padStart(3)} elements; ` +
      `crossed92=${rows.filter((r) => r.crossed92).length} ` +
      `inViewport=${rows.filter((r) => r.inViewport).length} ` +
      `hidden=${rows.filter((r) => r.opacity < 0.99).length}`
  );
  for (const row of rows) {
    if (row.opacity >= 0.99 && row.ty === 0) continue; // revealed, unremarkable
    console.log(
      `  [${String(row.index).padStart(2)}] docTop=${String(row.docTop).padStart(6)} ` +
        `h=${String(row.height).padStart(4)} crossed92=${String(row.crossed92).padStart(5)} ` +
        `inVp=${String(row.inViewport).padStart(5)} opacity=${row.opacity} ty=${row.ty}`
    );
    console.log(`         .${row.cls}`);
    console.log(
      `         parent .${row.parentCls} docTop=${row.parentDocTop} crossed92=${row.parentCrossed92}`
    );
    console.log(`         inline=${JSON.stringify(row.inline)}`);
  }
  await context.close();
}
await browser.close();