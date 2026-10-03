// Does this browser advertise hover capability, and does Webflow's hover layer
// exist at all?
//
// `probe-hover-trace.mjs` put the real pointer on a `.button` — verified with
// `elementFromPoint` — and the hover tween never ran on the reference *or* the
// clone. Before concluding anything about the clone, the environment has to be
// ruled out: Webflow's IX3 and GSAP's `matchMedia` both gate hover behaviour on
// `(hover: hover)` / `(pointer: fine)`, and headless Chromium reports those
// differently from a desktop browser.
//
// Usage: node scripts/probe-hover-env.mjs [route]
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/";

const ENV = () => ({
  hoverHover: matchMedia("(hover: hover)").matches,
  hoverNone: matchMedia("(hover: none)").matches,
  pointerFine: matchMedia("(pointer: fine)").matches,
  pointerCoarse: matchMedia("(pointer: coarse)").matches,
  anyHover: matchMedia("(any-hover: hover)").matches,
  hasTouch: navigator.maxTouchPoints > 0,
  gsapOnWindow: typeof window.gsap !== "undefined",
  ix3Class: document.documentElement.classList.contains("w-mod-ix3"),
  // Webflow registers its event listeners through a plugin on window; look for
  // anything that hints the hover plugin booted.
  windowKeys: Object.keys(window).filter((k) => /ix|webflow|gsap|wmod/i.test(k)),
});

/** Does a listener exist for pointer/mouse events on the document? */
const LISTENERS = () => {
  // Playwright/CDP cannot enumerate listeners directly, so instead observe:
  // dispatch a real trusted move and check whether anything reacts.
  return { note: "cannot enumerate; rely on observable state instead" };
};

const browser = await launch();
for (const [label, base] of [
  ["ref", ORIGIN],
  ["clone", LOCAL],
]) {
  for (const hasTouch of [false]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      hasTouch,
      isMobile: false,
    });
    const page = await context.newPage();
    await open(page, base + route);
    const env = await page.evaluate(ENV);
    const listeners = await page.evaluate(LISTENERS);
    console.log(`\n=== ${label} (hasTouch=${hasTouch}) ===`);
    console.log(
      `  (hover:hover)=${env.hoverHover} (hover:none)=${env.hoverNone} ` +
        `(pointer:fine)=${env.pointerFine} (pointer:coarse)=${env.pointerCoarse} ` +
        `(any-hover:hover)=${env.anyHover}`
    );
    console.log(
      `  maxTouchPoints>0: ${env.hasTouch}  gsap on window: ${env.gsapOnWindow}  ` +
        `w-mod-ix3: ${env.ix3Class}`
    );
    console.log(`  window keys matching /ix|webflow|gsap|wmod/: ${JSON.stringify(env.windowKeys)}`);
    console.log(`  ${listeners.note}`);

    // Observe: hover a nav button and report whether the target moved.
    const probe = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const button = document.querySelector(".button");
      if (!button) return { error: "no .button" };
      const target = button.querySelector(".button-normal-text");
      const before = target ? getComputedStyle(target).transform : null;
      const rect = button.getBoundingClientRect();
      return {
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
        before,
        targetFound: !!target,
      };
    });
    console.log(`  first .button: ${JSON.stringify(probe)}`);
    if (probe.rect) {
      await page.mouse.move(probe.rect.x + probe.rect.w / 2, probe.rect.y + probe.rect.h / 2);
      await page.waitForTimeout(700);
      const after = await page.evaluate(() => {
        const button = document.querySelector(".button");
        const target = button?.querySelector(".button-normal-text");
        return target
          ? {
              transform: getComputedStyle(target).transform,
              inline: target.getAttribute("style"),
            }
          : null;
      });
      console.log(`  after real-mouse hover: ${JSON.stringify(after)}`);
    }
    await context.close();
  }
}
await browser.close();