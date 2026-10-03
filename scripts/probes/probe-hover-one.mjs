// Diagnostic for the hover audit: does hovering actually change anything, and
// are the targets the ones the payload names?
//
// An earlier version of the harness reported "no hover animation anywhere" on
// both sites, which is certainly wrong. Before trusting or discarding it, print
// the raw before/during rows for one trigger so the reason is visible.
//
// Usage: node scripts/probe-hover-one.mjs [route] [width] [triggerSelector] [targetSelector]
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/about";
const width = Number(process.argv[3] ?? 1440);
const triggerSelector = process.argv[4] ?? ".text-button";
const targetSelector = process.argv[5] ?? ".text-button-normal-text";

const READ = ({ target }) => {
  const parse = (transform) => {
    if (!transform || transform === "none") return null;
    const m = /matrix(3d)?\(([^)]+)\)/.exec(transform);
    return m ? m[2].split(",").map(Number) : null;
  };
  return [...document.querySelectorAll(target)].map((el, i) => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const matrix = parse(cs.transform);
    return {
      i,
      cls: el.className?.toString().slice(0, 60) ?? "",
      text: el.textContent?.slice(0, 12) ?? "",
      matrix: matrix ? matrix.map((v) => Math.round(v * 10) / 10) : null,
      opacity: Math.round(Number(cs.opacity) * 1000) / 1000,
      inline: el.getAttribute("style"),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      top: Math.round(rect.top),
    };
  });
};

/** What does the page think its hover triggers are? */
const CENSUS = () => ({
  textButtons: document.querySelectorAll(".text-button").length,
  normalText: document.querySelectorAll(".text-button-normal-text").length,
  hoverText: document.querySelectorAll(".text-button-hover-text").length,
  buttons: document.querySelectorAll(".button").length,
  buttonNormalText: document.querySelectorAll(".button-normal-text").length,
  splitClasses: [
    ...new Set(
      [...document.querySelectorAll("*")]
        .flatMap((el) => [...el.classList])
        .filter((c) => c.includes("split"))
    ),
  ].slice(0, 10),
  gsapPresent: typeof window.gsap !== "undefined",
  ixActive: document.documentElement.classList.contains("w-mod-ix3"),
});

/**
 * Which instances of a trigger are worth hovering?
 *
 * A trigger is only useful if it is visible *and* the target elements it drives
 * are actually rendered. Webflow's nav contains `.text-button`s whose
 * `.text-button-normal-text` collapses to 0x0, so hovering those proves nothing.
 */
const VISIBLE_INDICES = ({ selector, target }) => {
  const out = [];
  [...document.querySelectorAll(selector)].forEach((el, i) => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    if (cs.display === "none" || cs.visibility === "hidden") return;
    if (rect.left > window.innerWidth + 40 || rect.right < -40) return;
    // Require at least one rendered target inside this trigger.
    const usable = [...el.querySelectorAll(target)].some((t) => {
      const tr = t.getBoundingClientRect();
      const tcs = getComputedStyle(t);
      return tr.width > 0 && tr.height > 0 && tcs.display !== "none";
    });
    if (!usable) return;
    out.push({ i, cls: el.className?.toString().slice(0, 60) ?? "" });
  });
  return out;
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
  const census = await page.evaluate(CENSUS);
  console.log(`\n=== ${label} ${route} @${width} ===`);
  console.log(
    `  .text-button=${census.textButtons} .text-button-normal-text=${census.normalText} ` +
      `.text-button-hover-text=${census.hoverText} .button=${census.buttons} ` +
      `.button-normal-text=${census.buttonNormalText}`
  );
  console.log(
    `  gsap=${census.gsapPresent} w-mod-ix3=${census.ixActive} splitClasses=${JSON.stringify(census.splitClasses)}`
  );

  const visible = await page.evaluate(VISIBLE_INDICES, { selector: triggerSelector, target: targetSelector });
  console.log(
    `  ${visible.length} usable instance(s) of ${triggerSelector} ` +
      `(of ${census.textButtons} .text-button, ${census.buttons} .button)`
  );
  for (const v of visible) console.log(`      index ${v.i}: .${v.cls}`);
  if (!visible.length) {
    await context.close();
    continue;
  }
  const handle = page.locator(triggerSelector).nth(visible[0].i);
  await handle.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);

  const before = await page.evaluate(READ, { target: targetSelector });
  await handle.hover({ force: true });
  await page.waitForTimeout(800);
  const during = await page.evaluate(READ, { target: targetSelector });
  await page.mouse.move(4, 4);
  await page.waitForTimeout(1000);
  const after = await page.evaluate(READ, { target: targetSelector });

  console.log(`  ${targetSelector}: ${before.length} element(s)`);
  const limit = before.length;
  for (let i = 0; i < Math.min(limit, before.length); i++) {
    const b = before[i];
    const d = during[i] ?? {};
    const a = after[i] ?? {};
    console.log(
      `   [${i}] "${b.text}" w=${b.w} h=${b.h} top=${b.top}`
    );
    console.log(
      `        before  matrix=${JSON.stringify(b.matrix)} opacity=${b.opacity}`
    );
    console.log(
      `        during  matrix=${JSON.stringify(d.matrix)} opacity=${d.opacity}`
    );
    console.log(
      `        after   matrix=${JSON.stringify(a.matrix)} opacity=${a.opacity}`
    );
  }
  await context.close();
}
await browser.close();
