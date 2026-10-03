// Measure a marquee exactly: element geometry, the travel rate, the implied
// loop width and duration, and whether the row is duplicated enough to wrap
// seamlessly.
//
// Usage: node scripts/probe-marquee.mjs [route] [width]
import { launch, ORIGIN, LOCAL, open } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/";
const width = Number(process.argv[3] ?? 1440);

const PROBE = async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const slides = [...document.querySelectorAll("[marku-slide]")];
  if (!slides.length) return { error: "no [marku-slide] elements" };

  const describe = (el) => {
    const rect = el.getBoundingClientRect();
    const parent = el.parentElement;
    const parentRect = parent.getBoundingClientRect();
    return {
      cls: el.className?.toString(),
      width: Math.round(rect.width * 10) / 10,
      left: Math.round(rect.left * 10) / 10,
      offsetWidth: el.offsetWidth,
      parentCls: parent?.className?.toString(),
      parentWidth: Math.round(parentRect.width * 10) / 10,
      parentDisplay: parent ? getComputedStyle(parent).display : null,
      parentFlexWrap: parent ? getComputedStyle(parent).flexWrap : null,
      parentGap: parent ? getComputedStyle(parent).gap : null,
      parentOverflow: parent ? getComputedStyle(parent).overflow : null,
      grandParentOverflow: parent?.parentElement
        ? getComputedStyle(parent.parentElement).overflow
        : null,
      grandParentWidth: parent?.parentElement
        ? Math.round(parent.parentElement.getBoundingClientRect().width * 10) / 10
        : null,
      inline: el.getAttribute("style"),
    };
  };

  // Sample the horizontal position over a known window to get the real rate.
  const sample = async (ms) => {
    const first = slides[0];
    const start = first.getBoundingClientRect().left;
    const t0 = performance.now();
    await sleep(ms);
    const end = first.getBoundingClientRect().left;
    const elapsed = performance.now() - t0;
    return {
      elapsed: Math.round(elapsed),
      travelled: Math.round((start - end) * 10) / 10,
      pxPerSecond: Math.round(((start - end) / elapsed) * 1000 * 10) / 10,
    };
  };

  const first = await sample(6000);
  return {
    count: slides.length,
    slides: slides.map(describe),
    rate: first,
    documentWidth: Math.round(document.body.scrollWidth),
    viewport: window.innerWidth,
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
  await page.waitForTimeout(1200);
  const result = await page.evaluate(PROBE);
  console.log(`\n=== ${label} ${route} @${width} ===`);
  if (result.error) {
    console.log("  " + result.error);
    continue;
  }
  console.log(
    `  viewport=${result.viewport}  document=${result.documentWidth}  slides=${result.count}`
  );
  console.log(
    `  travel: ${result.rate.travelled}px in ${result.rate.elapsed}ms ` +
      `= ${result.rate.pxPerSecond}px/s`
  );
  // A loop of `duration` seconds over one slide width implies slideWidth.
  console.log(
    `  implied slide width if duration=18s: ${((result.rate.pxPerSecond * 18) / 1).toFixed(1)}px`
  );
  result.slides.forEach((s, i) => {
    console.log(
      `  [${i}] .${s.cls}  w=${s.width} offsetW=${s.offsetWidth} left=${s.left}`
    );
    console.log(
      `      parent .${s.parentCls} display=${s.parentDisplay} wrap=${s.parentFlexWrap} ` +
        `gap=${s.parentGap} w=${s.parentWidth} overflow=${s.parentOverflow}`
    );
    console.log(
      `      grandparent overflow=${s.grandParentOverflow} w=${s.grandParentWidth}  inline=${JSON.stringify(s.inline)}`
    );
  });
  await context.close();
}
await browser.close();