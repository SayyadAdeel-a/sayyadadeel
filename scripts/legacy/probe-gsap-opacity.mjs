// Determine how GSAP resolves a percentage string in a `from()` tween for
// `opacity`, which is what Webflow's `.menu-wrapper` payload uses
// (`opacity: ["0%", null]`).
import { launch, ORIGIN, open } from "./lib/qa.mjs";

const browser = await launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await open(page, ORIGIN + "/about", { settle: false });

const probe = await page.evaluate(async () => {
  const g = window.gsap;
  const make = () => {
    const el = document.createElement("div");
    el.style.cssText =
      "position:fixed;left:-9999px;width:10px;height:10px;opacity:1";
    document.body.appendChild(el);
    return el;
  };
  const out = {};

  const percentFrom = make();
  const tl1 = g.timeline({ paused: true });
  tl1.from(percentFrom, { opacity: "0%", y: "50px", duration: 0.5, force3D: true }, 0);
  out.percentFromImmediate = percentFrom.getAttribute("style");
  tl1.play();
  await new Promise((r) => setTimeout(r, 800));
  out.percentFromSettled = percentFrom.getAttribute("style");

  const numberFrom = make();
  const tl2 = g.timeline({ paused: true });
  tl2.from(numberFrom, { opacity: 0, y: "50px", duration: 0.5, force3D: true }, 0);
  out.numberFromImmediate = numberFrom.getAttribute("style");
  tl2.play();
  await new Promise((r) => setTimeout(r, 800));
  out.numberFromSettled = numberFrom.getAttribute("style");

  const flipEase = make();
  const tl3 = g.timeline({ paused: true });
  tl3.from(flipEase, { opacity: "0%", y: "50px", duration: 0.5, force3D: true, easeReverse: true }, 0);
  out.flipEaseImmediate = flipEase.getAttribute("style");
  tl3.play();
  await new Promise((r) => setTimeout(r, 800));
  out.flipEaseSettled = flipEase.getAttribute("style");

  return out;
});

console.log(JSON.stringify(probe, null, 2));
await context.close();
await browser.close();