// At rest, which label does a button actually show?
//
// The hover audit found `.text-button-hover-text` split leaves travelling -44.8px
// on the reference and +44.8px on the clone. Equal magnitude, opposite sign,
// which points at one of two very different defects:
//
//   * the tween is inverted, so the hover label is the one parked out of view
//     and every button shows its *hover* label at rest; or
//   * the tween is right and the two layers are laid out differently.
//
// Which layer is on top at rest is the question that separates them, and it is
// directly visible to a user.
//
// Usage: node scripts/probe-button-layers.mjs [route] [width]
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/";
const width = Number(process.argv[3] ?? 1440);

const LAYERS = () => {
  const describe = (host) => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        top: Math.round(r.top * 10) / 10,
        bottom: Math.round(r.bottom * 10) / 10,
        height: Math.round(r.height * 10) / 10,
        position: cs.position,
        top_px: cs.top,
        overflow: cs.overflow,
        opacity: cs.opacity,
        transform: cs.transform,
      };
    };
    return {
      host: host.className?.toString().slice(0, 60) ?? "",
      text: host.textContent?.replace(/\s+/g, " ").trim().slice(0, 40),
      wrap: rect(host.querySelector(".button-text-wrap, .text-button-text-wrap")),
      normal: rect(host.querySelector(".button-normal-text, .text-button-normal-text")),
      hover: rect(host.querySelector(".button-hover-text, .text-button-hover-text")),
      // Is anything clipping the layers?
      hostOverflow: getComputedStyle(host).overflow,
    };
  };
  return {
    buttons: [...document.querySelectorAll(".button")].slice(0, 4).map(describe),
    textButtons: [...document.querySelectorAll(".text-button")].slice(0, 4).map(describe),
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
  const out = await page.evaluate(LAYERS);
  console.log(`\n=== ${label} ${route} @${width} ===`);
  const show = (entry, kind) => {
    const n = entry[kind];
    const w = entry.wrap;
    if (!n || !w) {
      console.log(`    ${kind}: (absent)`);
      return;
    }
    // "On top" means the layer that overlaps the wrapper's visible band.
    const coversTop = n.top <= w.top + 2 && n.bottom >= w.bottom - 2;
    console.log(
      `    ${kind}: top=${n.top} bottom=${n.bottom} h=${n.height} ` +
        `position=${n.position} css-top=${n.top_px} transform=${n.transform} ` +
        `coversWrapper=${coversTop}`
    );
  };
  for (const kind of ["buttons", "textButtons"]) {
    console.log(`  ${kind}:`);
    out[kind].forEach((entry, i) => {
      console.log(`   [${i}] "${entry.text}"  .${entry.host}  overflow=${entry.hostOverflow}`);
      if (entry.wrap) {
        console.log(
          `       wrap: top=${entry.wrap.top} bottom=${entry.wrap.bottom} h=${entry.wrap.height} overflow=${entry.wrap.overflow}`
        );
      }
      show(entry, "normal");
      show(entry, "hover");
    });
  }
  await context.close();
}
await browser.close();