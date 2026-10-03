// Reproduce audit-motion.mjs's sampling loop exactly, but dump the raw frames for
// one hook so a harness discrepancy can be traced to a specific sample.
//
// The batch harness reported the reference's marquee at 483 px/s while a
// dedicated probe measured 94.7 px/s on the same page, same viewport, same
// settle. This script prints the per-sample timestamps and positions the batch
// harness would have used, which is where that factor of five has to show up.
//
// Usage: node scripts/probe-audit-repro.mjs [route] [width] [hook]
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/services/campaign-management";
const width = Number(process.argv[3] ?? 1440);
const hook = process.argv[4] ?? "marku-slide";
const SAMPLES = 10;
const DURATION = 4000;

const CANDIDATE_SELECTOR = [
  "btn-anim",
  "button-icon-anin-one",
  "button-icon-anin-two",
  "card-image-hover-child",
  "card-image-hover-pfriend",
  "contain-left-move-child",
  "contain-right-move-child",
  "fade",
  "fade-up",
  "group-fade-up-item",
  "group-fade-up-parent",
  "group-fedup-move",
  "group-fedup-move-pfriend",
  "group-fedup-phone",
  "group-fedup-phone-pfriend",
  "group-fast-move",
  "group-secend-move",
  "hover-pfriend",
  "icon-btn-anim",
  "love-child",
  "marku-slide",
  "menu-bar",
  "menu-bar-toggle",
  "move-left-right",
  "move-scroll-card-box",
  "origin-fade-up-pfriend",
  "slider-click-btn",
  "text-box-child",
  "zome-in-zom-out",
  "w-slide",
  "w-slider-mask",
  "hero-intro-card-box",
  "single-image-wrap",
  "marquee-el",
  "our-creators-box",
  "services-mask",
  "process-slider-mask",
  "about-slider-mask",
  "promotional-image-slider",
  "hamburger-line-top",
  "hamburger-line-middle",
  "hamburger-line-bottom",
  "menu-wrapper",
]
  .map((h) => `[${h}]:not([${h}="false"])`)
  .join(", ");

const LOOP = async ({ selector, hook: watch, samples, duration }) => {
  const parse = (transform) => {
    if (!transform || transform === "none") return null;
    const m = /matrix(3d)?\(([^)]+)\)/.exec(transform);
    if (!m) return null;
    return m[2].split(",").map(Number);
  };
  const nodes = [...document.querySelectorAll(selector)];
  const watched = nodes
    .map((el, index) => ({ el, index }))
    .filter(({ el }) => el.hasAttribute(watch));

  const step = duration / (samples - 1);
  const frames = [];
  const started = performance.now();
  for (let i = 0; i < samples; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, step));
    const t = performance.now();
    const reads = nodes.map((element) => {
      const cs = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        matrix: parse(cs.transform),
        opacity: Number(cs.opacity),
        left: rect.left,
        top: rect.top,
        w: rect.width,
        h: rect.height,
      };
    });
    frames.push({
      t,
      readStarted: t,
      readEnded: performance.now(),
      reads,
    });
  }
  const elapsed = (performance.now() - started) / 1000;

  return {
    candidates: nodes.length,
    watched: watched.length,
    elapsed,
    nominalStep: step,
    frames: frames.map((f) => {
      const r = f.reads[watched[0].index];
      return {
        tFromStart: Math.round(f.t - started),
        readMs: Math.round(f.readEnded - f.readStarted),
        left: Math.round(r.left * 10) / 10,
        matrix: r.matrix,
        w: Math.round(r.w * 10) / 10,
      };
    }),
  };
};

const browser = await launch();
for (const [label, base] of [
  ["ref", ORIGIN],
  ["clone", LOCAL],
]) {
  const context = await browser.newContext({
    viewport: { width, height: width < 992 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await open(page, base + route);
  await page.waitForTimeout(2500);
  const out = await page.evaluate(LOOP, {
    selector: CANDIDATE_SELECTOR,
    hook,
    samples: SAMPLES,
    duration: DURATION,
  });
  console.log(`\n=== ${label} ${route} @${width} ===`);
  console.log(
    `  candidates=${out.candidates} watched=${out.watched} ` +
      `elapsed=${out.elapsed.toFixed(2)}s nominalStep=${out.nominalStep}ms`
  );
  for (const f of out.frames) {
    console.log(
      `  t=${String(f.tFromStart).padStart(6)}ms read=${String(f.readMs).padStart(4)}ms ` +
        `left=${String(f.left).padStart(10)} w=${f.w}  matrix=${JSON.stringify(f.matrix)}`
    );
  }
  const lefts = out.frames.map((f) => f.left);
  let path = 0;
  for (let i = 1; i < lefts.length; i++) path += Math.abs(lefts[i] - lefts[i - 1]);
  console.log(
    `  path=${Math.round(path * 10) / 10}  elapsed=${out.elapsed.toFixed(2)}s  ` +
      `=> ${(path / out.elapsed).toFixed(1)} px/s  (nominal duration ${DURATION}ms)`
  );
  // Rate measured over the *nominal* window instead of the real one, which is
  // what the harness's own numbers imply if readAll dominates the loop.
  console.log(
    `  path / nominal ${DURATION}ms => ${((path / (DURATION / 1000))).toFixed(1)} px/s`
  );
  await context.close();
}
await browser.close();