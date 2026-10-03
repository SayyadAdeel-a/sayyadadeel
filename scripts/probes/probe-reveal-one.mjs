// Inspect one element's reveal state on both sites, with everything needed to
// work out why they disagree: the from-state, the payload that should apply it,
// the ScrollTrigger's own view of the element, and whether anything is covering
// it.
//
// Usage: node scripts/probe-reveal-one.mjs <route> <width> <hook> [index]
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/";
const width = Number(process.argv[3] ?? 390);
const hook = process.argv[4] ?? "origin-fade-up";
const index = Number(process.argv[5] ?? 7);

/** Runs in the page. */
const INSPECT = ({ hook: h, index: i }) => {
  const parse = (transform) => {
    if (!transform || transform === "none") return null;
    const m = /matrix(3d)?\(([^)]+)\)/.exec(transform);
    return m ? m[2].split(",").map(Number) : null;
  };
  const describe = (el, label) => {
    if (!el) return { label, missing: true };
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const matrix = parse(cs.transform);
    // gsap sets these custom properties; Webflow's runtime does not, but a
    // clone that emulates its state via CSS would show up here.
    const style = el.getAttribute("style") ?? "";
    return {
      label,
      tag: el.tagName.toLowerCase(),
      cls: el.className?.toString().slice(0, 70) ?? "",
      docTop: Math.round(rect.top + window.scrollY),
      viewportTop: Math.round(rect.top),
      height: Math.round(rect.height),
      opacity: Math.round(Number(cs.opacity) * 1000) / 1000,
      visibility: cs.visibility,
      display: cs.display,
      matrix: matrix ? matrix.map((v) => Math.round(v * 10) / 10) : null,
      ty: matrix && matrix.length >= 6 ? Math.round(matrix[5] * 10) / 10 : 0,
      inline: style.slice(0, 160),
      gsapProps: [...style.matchAll(/--?[\w-]*: ?[^;]+/g)].map((m) => m[0]).join(" | "),
      htmlHook: el.getAttribute(h),
    };
  };

  const nodes = [...document.querySelectorAll(`[${h}]`)];
  const el = nodes[i];
  // The element that carries the reveal trigger for this one, if any.
  const triggerHost = el?.closest("[origin-fade-up-pfriend],[group-fade-up-parent],[group-fedup-move-pfriend],[group-fedup-phone-pfriend]");

  // GSAP's ScrollTrigger registry, when the page exposes one.
  let scrollTriggers = null;
  try {
    // gsap is bundled by Webflow, usually on window as a module or via the
    // ScrollTrigger plugin's global registry.
    const registry =
      window.ScrollTrigger?.getAll?.() ??
      window.gsap?.core?.globals?.().ScrollTrigger?.getAll?.();
    if (registry) {
      scrollTriggers = registry.map((st) => ({
        id: st.trigger?.className?.toString().slice(0, 60) ?? "?",
        start: Math.round(st.start),
        end: Math.round(st.end),
        progress: Math.round(st.progress * 1000) / 1000,
        isActive: st.isActive,
        animationPaused: st.animation?.paused?.(),
      }));
    }
  } catch (error) {
    scrollTriggers = `error: ${error.message}`;
  }

  return {
    count: nodes.length,
    element: describe(el, "target"),
    triggerHost: describe(triggerHost, "triggerHost"),
    // Is the element inside the viewport on a fresh load?
    inInitialViewport: el
      ? el.getBoundingClientRect().top < window.innerHeight &&
        el.getBoundingClientRect().bottom > 0
      : null,
    windowScrollY: window.scrollY,
    innerHeight: window.innerHeight,
    scrollTriggers,
    gsapPresent: typeof window.gsap !== "undefined",
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
  await open(page, base + route, { settle: false });
  await page.waitForTimeout(1500);
  const out = await page.evaluate(INSPECT, { hook, index });
  console.log(`\n=== ${label} ${route} @${width} [${hook}] index ${index} ===`);
  console.log(`  ${out.count} elements; gsap on window: ${out.gsapPresent}`);
  console.log(
    `  scrollY=${out.windowScrollY} innerHeight=${out.innerHeight} ` +
      `target inInitialViewport=${out.inInitialViewport}`
  );
  for (const key of ["element", "triggerHost"]) {
    const d = out[key];
    if (d.missing) {
      console.log(`  ${key}: (not found)`);
      continue;
    }
    console.log(
      `  ${key}: <${d.tag} class="${d.cls}"> docTop=${d.docTop} h=${d.height} ` +
        `opacity=${d.opacity} visibility=${d.visibility} ty=${d.ty}`
    );
    console.log(`      matrix=${JSON.stringify(d.matrix)}`);
    console.log(`      inline=${JSON.stringify(d.inline)}`);
    if (d.gsapProps) console.log(`      cssvars=${d.gsapProps}`);
  }
  if (Array.isArray(out.scrollTriggers)) {
    console.log(`  ${out.scrollTriggers.length} ScrollTrigger(s):`);
    for (const st of out.scrollTriggers.slice(0, 12)) {
      console.log(
        `      .${st.id} start=${st.start} end=${st.end} progress=${st.progress} ` +
          `active=${st.isActive} paused=${st.animationPaused}`
      );
    }
  } else {
    console.log(`  ScrollTrigger registry: ${out.scrollTriggers}`);
  }
  await context.close();
}
await browser.close();