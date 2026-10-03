// Does a button label survive a hover?
//
// The hover audit reported "hover does not return to rest after the pointer
// leaves" on some pages. The `.button` hover timeline is a pair of `fromTo`
// actions whose winning from-state is `y: 100%`, so a plain `reverse()` ends at
// progress 0 — i.e. at 100%, which inside the label's `overflow: hidden` wrapper
// means the text has rolled out of sight. That is a user-visible defect (every
// button looks empty after you hover it), so it is checked directly rather than
// inferred from a displacement number.
//
// Usage: node scripts/probe-hover-leave.mjs [route] [width] [selector]
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/services";
const width = Number(process.argv[3] ?? 1440);
const triggerSelector = process.argv[4] ?? ".button";

const VISIBLE = ({ selector }) => {
  const out = [];
  [...document.querySelectorAll(selector)].forEach((el, i) => {
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (rect.width <= 0 || rect.height <= 0) return;
    if (cs.display === "none" || cs.visibility === "hidden") return;
    if (rect.left > window.innerWidth + 40 || rect.right < -40) return;
    out.push(i);
  });
  return out;
};

/** Is any split character of this button's label inside the wrapper's box? */
const LABEL_STATE = ({ selector, index }) => {
  const button = document.querySelectorAll(selector)[index];
  if (!button) return { error: "no button" };
  const wrap =
    button.querySelector(".button-text-wrap") ||
    button.querySelector(".text-button-text-wrap");
  const label =
    button.querySelector(".button-normal-text") ||
    button.querySelector(".text-button-normal-text");
    button.querySelector(".button-hover-text") ||
    button.querySelector(".text-button-hover-text");
  if (!wrap || !label) return { error: "no wrap/label" };

  const wrapRect = wrap.getBoundingClientRect();
  const chars = [...label.querySelectorAll("span")].filter((s) =>
    s.className?.toString().includes("gsap_split_letter")
  );
  const parse = (t) => {
    if (!t || t === "none") return null;
    const m = /matrix(3d)?\(([^)]+)\)/.exec(t);
    if (!m) return null;
    const v = m[2].split(",").map(Number);
    return v.length > 6 ? v[13] : v[5];
  };
  const charTys = chars.map((c) => parse(getComputedStyle(c).transform) ?? 0);
  const charHeights = chars.map((c) => c.getBoundingClientRect().height);

  // A character is "on screen" when its own box overlaps the wrapper's band.
  const charRects = chars.map((c) => c.getBoundingClientRect());
  const visibleCount = charRects.filter(
    (r) => r.bottom > wrapRect.top + 1 && r.top < wrapRect.bottom - 1
  ).length;

  return {
    wrapTop: Math.round(wrapRect.top * 10) / 10,
    wrapHeight: Math.round(wrapRect.height * 10) / 10,
    charCount: chars.length,
    charHeights: [...new Set(charHeights.map((h) => Math.round(h)))],
    charTys: charTys.map((t) => Math.round(t * 10) / 10),
    maxTy: Math.round(Math.max(...charTys.map(Math.abs), 0) * 10) / 10,
    // How many characters actually paint inside the visible band.
    visibleCount,
    labelText: label.textContent?.trim().slice(0, 24),
  };
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
  const visible = await page.evaluate(VISIBLE, { selector: triggerSelector });
  if (!visible.length) {
    console.log(`\n=== ${label} === no visible ${triggerSelector}`);
    await context.close();
    continue;
  }
  const index = visible[0];
  const trigger = page.locator(triggerSelector).nth(index);
  await trigger.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(500);
  const box = await trigger.boundingBox();

  const at = async (phase) => {
    const state = await page.evaluate(LABEL_STATE, { selector: triggerSelector, index });
    console.log(
      `  ${phase.padEnd(14)} visible=${state.visibleCount ?? "?"}/${state.charCount ?? "?"} ` +
        `maxTy=${state.maxTy ?? "?"} heights=${JSON.stringify(state.charHeights ?? [])}`
    );
    return state;
  };

  console.log(`\n=== ${label} ${route} @${width} [${triggerSelector}[${index}]] ===`);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(500);
  const rest = await at("rest");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(120);
  await at("hover 120ms");
  await page.waitForTimeout(700);
  await at("hover 820ms");
  await page.mouse.move(2, 2);
  await page.waitForTimeout(300);
  const left1 = await at("left +300ms");
  await page.waitForTimeout(1500);
  const left2 = await at("left +1800ms");

  // Does the visible band end up empty?
  if (left2.visibleCount === 0 && rest.visibleCount > 0) {
    console.log(
      `  *** DEFECT: the label is no longer visible after hovering ` +
        `(rest had ${rest.visibleCount}, after leave ${left2.visibleCount})`
    );
  }
  if (left1.visibleCount === 0 || left2.visibleCount === 0) {
    console.log(`  *** label invisible shortly after leaving`);
  }
  await context.close();
}
await browser.close();
