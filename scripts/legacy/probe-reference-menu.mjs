// Observe the reference site's mobile-menu interaction: the inline styles it
// writes to `.nav-menu-wrap` / `.menu-wrapper` / the hamburger lines before
// the first click, after opening, and after closing again.
import { launch, ORIGIN, open } from "./lib/qa.mjs";

const route = process.argv[2] ?? "/about";
const width = Number(process.argv[3] ?? 390);

const browser = await launch();
const context = await browser.newContext({ viewport: { width, height: 844 } });
const page = await context.newPage();
await open(page, ORIGIN + route, { settle: false });

const snap = () =>
  page.evaluate(() => {
    const read = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        inline: el.getAttribute("style"),
        display: cs.display,
        opacity: cs.opacity,
        visibility: cs.visibility,
        transform: cs.transform,
      };
    };
    return {
      navMenuWrap: read(".nav-menu-wrap"),
      menuWrapper: read(".menu-wrapper"),
      lineTop: read(".hamburger-line-top"),
      lineMiddle: read(".hamburger-line-middle"),
      lineBottom: read(".hamburger-line-bottom"),
      menuButtonClass: document.querySelector(".menu-button")?.className ?? null,
    };
  });

const before = await snap();
await page.click(".menu-button");
await page.waitForTimeout(700);
const openState = await snap();
await page.click(".menu-button");
await page.waitForTimeout(900);
const closed = await snap();

console.log(`=== ${route} @ ${width} ===`);
console.log("before :", JSON.stringify(before, null, 1));
console.log("open   :", JSON.stringify(openState, null, 1));
console.log("closed :", JSON.stringify(closed, null, 1));

await context.close();
await browser.close();