// Navigation regression check: after visiting a generated page and coming back,
// the homepage must render exactly as it does on a direct load.
//
// Each generated page imports its own `critical.css`, which hides IX-driven
// elements until the runtime sets `w-mod-ix3` on `<html>`. If that stylesheet
// were retained into the homepage — which does not set `w-mod-ix3`, because it
// predates the rule — the homepage's `[fade-up]` / `[fade]` elements would stay
// invisible. The generated pages use plain `<a href>` (verbatim Webflow markup),
// so every navigation is a full page load and the document — including any
// injected stylesheet — starts clean. This asserts that, either way.
import { launch, LOCAL, open } from "./lib/qa.mjs";

const browser = await launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const inspect = () =>
  page.evaluate(() => {
    const pick = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { visibility: cs.visibility, opacity: cs.opacity };
    };
    return {
      htmlClasses: [...document.documentElement.classList].filter((c) =>
        c.startsWith("w-mod")
      ),
      hiddenSheets: [...document.styleSheets].filter(
        (sheet) => sheet.href && /critical/.test(sheet.href)
      ).length,
      inlineStyleBlocks: [...document.querySelectorAll("style")].length,
      fadeUp: pick("[fade-up='true']"),
      fade: pick("[fade='true']"),
      heroIntro: pick(".hero-intro-section"),
      ctaWrapper: pick(".cta-wrapper"),
      bodyHeight: document.body.scrollHeight,
    };
  });

/* --- direct load of the homepage --- */
await open(page, LOCAL + "/", { settle: false });
await page.waitForTimeout(1500);
const direct = await inspect();

/* --- visit an inner page, then navigate back --- */
await open(page, LOCAL + "/about", { settle: false });
await page.waitForTimeout(1500);
const onAbout = await inspect();
await page.evaluate(() => {
  const link = [...document.querySelectorAll("a[href='/']")][0];
  link.click();
});
await page.waitForTimeout(2500);
const afterNav = await inspect();

console.log("direct load of /          :", JSON.stringify(direct, null, 1));
console.log("on /about                  :", JSON.stringify(onAbout, null, 1));
console.log("back on / after navigating :", JSON.stringify(afterNav, null, 1));

const same =
  JSON.stringify(direct.fadeUp) === JSON.stringify(afterNav.fadeUp) &&
  JSON.stringify(direct.fade) === JSON.stringify(afterNav.fade) &&
  JSON.stringify(direct.heroIntro) === JSON.stringify(afterNav.heroIntro) &&
  JSON.stringify(direct.ctaWrapper) === JSON.stringify(afterNav.ctaWrapper) &&
  direct.bodyHeight === afterNav.bodyHeight;

const noLeak = afterNav.hiddenSheets === 0 && !afterNav.htmlClasses.includes("w-mod-ix3");

console.log(`\nhomepage identical after navigation : ${same ? "YES" : "NO"}`);
console.log(`no inner stylesheet on /           : ${noLeak ? "YES" : "NO"}`);
if (!same) console.log("  the leaked critical stylesheet is hiding elements on /");
if (!noLeak) console.log("  a generated page's stylesheet is still loaded on /");

await context.close();
await browser.close();
process.exitCode = same ? 0 : 1;