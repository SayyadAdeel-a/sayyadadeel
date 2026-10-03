// Pin down how GSAP handles a zero-duration `set()` at position 0 across
// play/reverse, with and without `immediateRender`, and with sibling tweens.
// This decides how the mobile menu's `display` must be reproduced.
import { launch, ORIGIN, open } from "./lib/qa.mjs";

const browser = await launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await open(page, ORIGIN + "/about", { settle: false });

const probe = await page.evaluate(async () => {
  const g = window.gsap;
  const results = {};
  const make = () => {
    const el = document.createElement("div");
    el.style.cssText =
      "position:fixed;left:-9999px;width:10px;height:10px;display:none";
    document.body.appendChild(el);
    return el;
  };
  const display = (el) => (el.style.display || "(unset)");

  const scenarios = {
    setOnly_default: () => {
      const el = make();
      const tl = g.timeline({ paused: true });
      tl.set(el, { display: "block" }, 0);
      const out = { created: display(el) };
      tl.play();
      out.played = display(el);
      tl.reverse();
      out.reversed = display(el);
      tl.play();
      out.replayed = display(el);
      return out;
    },
    setOnly_immediate: () => {
      const el = make();
      const tl = g.timeline({ paused: true });
      tl.set(el, { display: "block", immediateRender: true }, 0);
      const out = { created: display(el) };
      tl.play();
      out.played = display(el);
      tl.reverse();
      out.reversed = display(el);
      return out;
    },
    setPlusFrom_default: async () => {
      const el = make();
      const other = make();
      const tl = g.timeline({ paused: true });
      tl.set(el, { display: "block" }, 0);
      tl.from(other, { opacity: 0, y: 50, duration: 0.5, force3D: true }, 0);
      const out = { created: display(el) };
      tl.play();
      await new Promise((r) => setTimeout(r, 700));
      out.played = display(el);
      tl.reverse();
      await new Promise((r) => setTimeout(r, 700));
      out.reversed = display(el);
      return out;
    },
    setPlusFrom_immediate: async () => {
      const el = make();
      const other = make();
      const tl = g.timeline({ paused: true });
      tl.set(el, { display: "block", immediateRender: true }, 0);
      tl.from(other, { opacity: 0, y: 50, duration: 0.5, force3D: true }, 0);
      const out = { created: display(el) };
      tl.play();
      await new Promise((r) => setTimeout(r, 700));
      out.played = display(el);
      tl.reverse();
      await new Promise((r) => setTimeout(r, 700));
      out.reversed = display(el);
      return out;
    },
    progressZeroAfterPlay: () => {
      const el = make();
      const tl = g.timeline({ paused: true });
      tl.set(el, { display: "block" }, 0);
      tl.progress(1);
      const after1 = display(el);
      tl.progress(0);
      return { after1, after0: display(el) };
    },
    progressZeroAfterPlay_immediate: () => {
      const el = make();
      const tl = g.timeline({ paused: true });
      tl.set(el, { display: "block", immediateRender: true }, 0);
      tl.progress(1);
      const after1 = display(el);
      tl.progress(0);
      return { after1, after0: display(el) };
    },
  };

  for (const [name, run] of Object.entries(scenarios)) {
    results[name] = await run();
  }
  return results;
});

console.log(JSON.stringify(probe, null, 2));
await context.close();
await browser.close();