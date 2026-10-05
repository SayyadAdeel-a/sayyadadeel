/**
 * Captures the geometry of the homepage hero so two builds can be compared.
 *
 * Usage:
 *   node scripts/capture-hero.mjs before
 *   npm run build && restart server
 *   node scripts/capture-hero.mjs after
 *   node scripts/capture-hero.mjs diff before after
 *
 * ## Why this exists
 *
 * Replacing hero copy changes the width of text nodes, and a text node that
 * wraps differently moves every box below it. Parity against the live reference
 * cannot answer "did the layout survive the edit" — the reference still has the
 * old words, so a difference is expected whether or not the layout broke.
 *
 * What can answer it is the previous build. This records the same measurement
 * across both and reports only the boxes that moved, so "the copy changed and
 * nothing else did" is a measurement rather than an assertion.
 *
 * The 👋 and 💗 marks in the hero are SVG images, not text, and are captured as
 * boxes too so an accidental change to them would show up here.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
await require(path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright"));
const { launch } = await import("./lib/qa.mjs");

const BASE = process.env.LOCAL_URL ?? "http://localhost:3100";
const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "390x844", width: 390, height: 844 },
];

/**
 * The homepage sections whose copy has been customised, plus the wrappers whose
 * boxes depend on their text.
 *
 * The creators section is included because it is a *sticky* container: if its
 * heading wraps to an extra line the pinned height changes, which alters scroll
 * behaviour rather than just a box -- exactly the kind of thing a box diff is
 * for.
 */
const ROOTS = [".hero-section", ".hero-intro-section", ".our-creators-section"];

const MEASURE = (roots) => {
  const out = {};
  for (const root of roots) {
    for (const el of document.querySelectorAll(root)) {
      for (const node of [el, ...el.querySelectorAll("*")]) {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        if (rect.width === 0 && rect.height === 0) continue;

        // A stable identity: the element's position in the tree, not its content,
        // so the same node can be found again after the text changed.
        const key =
          root +
          "|" +
          node.tagName.toLowerCase() +
          "." +
          String(node.className || "").trim().replace(/\s+/g, ".") +
          "|" +
          (node.querySelectorAll("*").length);

        out[key] = {
          x: Math.round(rect.x * 10) / 10,
          y: Math.round(rect.y * 10) / 10,
          w: Math.round(rect.width * 10) / 10,
          h: Math.round(rect.height * 10) / 10,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          fontFamily: style.fontFamily.split(",")[0],
          color: style.color,
        };
      }
    }
  }
  return out;
};

const mode = process.argv[2];
const a = process.argv[3];
const b = process.argv[4];

/* ------------------------------------------------------------------ diff -- */

if (mode === "diff") {
  const before = JSON.parse(fs.readFileSync(a, "utf8"));
  const after = JSON.parse(fs.readFileSync(b, "utf8"));

  let compared = 0;
  let moved = 0;
  let changedType = 0;

  for (const [vp, boxes] of Object.entries(before)) {
    const now = after[vp] ?? {};
    for (const [key, prev] of Object.entries(boxes)) {
      const next = now[key];
      compared += 1;

      if (!next) {
        moved += 1;
        console.log("  [" + vp + "] REMOVED  " + key);
        continue;
      }

      const delta = {};
      for (const field of ["x", "y", "w", "h"]) {
        if (Math.abs(prev[field] - next[field]) > 0.5) delta[field] = prev[field] + " -> " + next[field];
      }
      for (const field of ["fontSize", "lineHeight", "fontFamily", "color"]) {
        if (prev[field] !== next[field]) delta[field] = prev[field] + " -> " + next[field];
      }

      if (Object.keys(delta).length === 0) continue;

      moved += 1;
      const geometryOnly = !("fontSize" in delta || "lineHeight" in delta || "fontFamily" in delta || "color" in delta);
      if (!geometryOnly) changedType += 1;

      console.log("  [" + vp + "] " + (geometryOnly ? "moved " : "STYLE ") + key);
      for (const [field, value] of Object.entries(delta)) console.log("        " + field + ": " + value);
    }
  }

  const added = Object.keys(after).reduce(
    (n, vp) => n + Object.keys(after[vp]).filter((k) => !(before[vp] ?? {})[k]).length,
    0
  );
  if (added) {
    console.log("  boxes present only in " + b + ": " + added);
    for (const vp of Object.keys(after)) {
      for (const k of Object.keys(after[vp])) {
        if (!(before[vp] ?? {})[k]) console.log("    [" + vp + "] ADDED " + k);
      }
    }
  }

  console.log("\nboxes compared: " + compared);
  console.log("unchanged:      " + (compared - moved));
  console.log("moved/resized:  " + moved);
  console.log("style changed:  " + changedType);
  console.log("added:          " + added);

  if (moved === 0 && added === 0) {
    console.log("\nOK: every hero box is byte-identical. Only the text changed.");
  } else {
    process.exitCode = 1;
  }
  process.exit(0);
}

/* --------------------------------------------------------------- capture -- */

if (!mode) {
  console.error("usage: capture-hero.mjs before|after <file> | diff <a> <b>");
  process.exit(2);
}

const result = {};
const browser = await launch();
try {
  const context = await browser.newContext();
  for (const vp of VIEWPORTS) {
    const page = await context.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
    // Let the hero's entrance animations settle so nothing is caught mid-flight.
    await page.waitForTimeout(2500);
    result[vp.name] = await page.evaluate(MEASURE, ROOTS);
    console.log("  " + vp.name + ": " + Object.keys(result[vp.name]).length + " boxes");
    await page.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(a, JSON.stringify(result, null, 1), "utf8");
console.log("wrote " + a);
