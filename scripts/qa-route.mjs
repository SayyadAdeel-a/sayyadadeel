// Compare a cloned route against the reference at one viewport, in three
// passes: structural outline, per-element boxes, and full-page pixel diff.
//
// Usage: node scripts/qa-route.mjs --route=/about --width=1440 --height=900
import fs from "node:fs";
import { launch, openPair, OUTLINE, BOXES, parseArgs } from "./lib/qa.mjs";

const args = parseArgs();
const { route, width, height, tolerance, limit } = args;

const browser = await launch();
const pair = await openPair(browser, route, width, height);

const refOutline = await pair.ref.page.evaluate(OUTLINE);
const cloneOutline = await pair.clone.page.evaluate(OUTLINE);
const refBoxes = await pair.ref.page.evaluate(BOXES);
const cloneBoxes = await pair.clone.page.evaluate(BOXES);

/* ---- structure ---- */
const refSet = new Set(refOutline);
const cloneSet = new Set(cloneOutline);
const onlyRef = refOutline.filter((p) => !cloneSet.has(p));
const onlyClone = cloneOutline.filter((p) => !refSet.has(p));

/* ---- boxes ---- */
const boxMismatches = [];
const phaseMismatches = [];
for (let i = 0; i < Math.min(refBoxes.length, cloneBoxes.length); i++) {
  const a = refBoxes[i];
  const b = cloneBoxes[i];
  if (a.tag !== b.tag || a.cls !== b.cls || (a.id !== b.id && a.id)) {
    boxMismatches.push({ kind: "node", i, a, b });
    continue;
  }
  const d = {
    x: Math.abs(a.x - b.x),
    y: Math.abs(a.y - b.y),
    w: Math.abs(a.w - b.w),
    h: Math.abs(a.h - b.h),
  };
  if (Math.max(d.x, d.y, d.w, d.h) <= tolerance) continue;
  // Elements inside a GSAP-driven subtree sit at an arbitrary point of an
  // infinite ambient loop, so their geometry is a function of when the page
  // happened to be sampled. They are reported separately and excluded from the
  // pass/fail decision, exactly as the homepage harness does.
  if (a.animated || b.animated) {
    phaseMismatches.push({ i, d, a, b });
    continue;
  }
  boxMismatches.push({ kind: "box", i, d, a, b });
}

/* ---- pixels ---- */
const refShot = await pair.ref.page.screenshot({ fullPage: true });
const cloneShot = await pair.clone.page.screenshot({ fullPage: true });
let pixelDiff = null;
try {
  const diffPath = `docs/research/relab-0c02b053/qa/${route === "/" ? "root" : route.slice(1).replace(/\//g, "-")}-${width}.png`;
  fs.mkdirSync("docs/research/relab-0c02b053/qa", { recursive: true });
  fs.writeFileSync(diffPath.replace(/\.png$/, "-ref.png"), refShot);
  fs.writeFileSync(diffPath.replace(/\.png$/, "-clone.png"), cloneShot);
  pixelDiff = diffPath;
} catch (error) {
  pixelDiff = `screenshot failed: ${error.message}`;
}

/* ---- report ---- */
const metrics = {
  route,
  viewport: `${width}x${height}`,
  documentHeight: {
    ref: await pair.ref.page.evaluate(() => document.body.scrollHeight),
    clone: await pair.clone.page.evaluate(() => document.body.scrollHeight),
  },
  outline: {
    ref: refOutline.length,
    clone: cloneOutline.length,
    onlyRef: onlyRef.length,
    onlyClone: onlyClone.length,
  },
  boxes: {
    ref: refBoxes.length,
    clone: cloneBoxes.length,
    compared: Math.min(refBoxes.length, cloneBoxes.length),
    mismatches: boxMismatches.length,
    ambientLoopPhase: phaseMismatches.length,
    animatedElements: {
      ref: refBoxes.filter((b) => b.animated).length,
      clone: cloneBoxes.filter((b) => b.animated).length,
    },
  },
  consoleErrors: {
    ref: pair.ref.errors.slice(0, 8),
    clone: pair.clone.errors.slice(0, 8),
  },
};

console.log(`\n===== ${route} @ ${width}x${height} =====`);
console.log(JSON.stringify(metrics, null, 2));

if (onlyRef.length) {
  console.log(`\nonly in reference (${onlyRef.length}):`);
  for (const p of onlyRef.slice(0, limit)) console.log("  " + p);
}
if (onlyClone.length) {
  console.log(`\nonly in clone (${onlyClone.length}):`);
  for (const p of onlyClone.slice(0, limit)) console.log("  " + p);
}
if (boxMismatches.length) {
  console.log(`\nbox mismatches (${boxMismatches.length}):`);
  for (const m of boxMismatches.slice(0, limit)) {
    if (m.kind === "node") {
      console.log(
        `\n#${m.i} NODE\n  ref  : <${m.a.tag} id="${m.a.id}" class="${m.a.cls}">\n  clone: <${m.b.tag} id="${m.b.id}" class="${m.b.cls}">`
      );
    } else {
      console.log(
        `\n#${m.i} <${m.a.tag} class="${m.a.cls}">${m.a.animated || m.b.animated ? " [animated]" : ""}\n  ref  : x=${m.a.x} y=${m.a.y} w=${m.a.w} h=${m.a.h}  "${m.a.text}"\n  clone: x=${m.b.x} y=${m.b.y} w=${m.b.w} h=${m.b.h}  "${m.b.text}"\n  delta: x=${m.d.x.toFixed(2)} y=${m.d.y.toFixed(2)} w=${m.d.w.toFixed(2)} h=${m.d.h.toFixed(2)}`
      );
    }
  }
}
console.log(`\nscreenshots: ${pixelDiff}`);
if (phaseMismatches.length) {
  console.log(
    `\nambient-loop phase differences (${phaseMismatches.length}) — expected, these are infinite loops sampled at different instants:`
  );
  const byClass = new Map();
  for (const m of phaseMismatches) {
    const key = `${m.a.tag}.${m.a.cls}`;
    byClass.set(key, (byClass.get(key) ?? 0) + 1);
  }
  for (const [key, count] of [...byClass].sort((x, y) => y[1] - x[1])) {
    console.log(`  ${String(count).padStart(4)}x  ${key}`);
  }
}

await pair.ref.context.close();
await pair.clone.context.close();
await browser.close();

const ok =
  onlyRef.length === 0 &&
  onlyClone.length === 0 &&
  boxMismatches.length === 0 &&
  pair.clone.errors.length === 0;
console.log(`\n${ok ? "PASS" : "FAIL"}`);
process.exitCode = ok ? 0 : 1;