/**
 * Reports boxes whose height changed between two captures.
 *
 * Usage:
 *   node scripts/capture-hero.mjs before docs/hero-before.json
 *   # ... edit, rebuild, restart ...
 *   node scripts/capture-hero.mjs after  docs/hero-after.json
 *   node scripts/diff-heights.mjs docs/hero-before.json docs/hero-after.json
 *
 * ## Why height and not position
 *
 * Changing text changes box widths and positions constantly, and that is
 * expected: a label that is a different length is a different length. Height is
 * the signal that matters, because a box that grows taller has wrapped onto an
 * extra line, which pushes the rest of the section down and changes its rhythm.
 *
 * ## Why not compare against the reference
 *
 * The reference still carries the original words, so a difference there proves
 * nothing about whether the edit broke the layout. These captures are both of
 * our own builds, before and after, which is the only comparison that isolates
 * the edit.
 */
import fs from "node:fs";

const before = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const after = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));

const ROOTS = [".hero-section", ".hero-intro-section", ".our-creators-section"];
const LABEL = {
  ".our-creators-section": "creators",
  ".hero-intro-section": "hero-intro",
  ".hero-section": "hero",
};

/** One line of the h2 font, used to tell a rewrap from a rounding wobble. */
const LINE = 79.2;

let total = 0;
let rewraps = 0;

for (const vp of Object.keys(before)) {
  const rows = [];

  for (const [key, prev] of Object.entries(before[vp])) {
    const next = after[vp]?.[key];
    if (!next) continue;
    const delta = Math.round((next.h - prev.h) * 10) / 10;
    if (Math.abs(delta) < 0.5) continue;

    const root = ROOTS.find((r) => key.startsWith(r)) ?? "other";
    rows.push({ key: key.replace(/\|[^|]*$/, ""), delta, prev: prev.h, next: next.h, root });
  }

  if (!rows.length) {
    console.log("\n[" + vp + "]  no height changes");
    continue;
  }

  rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  console.log("\n[" + vp + "]  " + rows.length + " box(es) changed height:");

  for (const r of rows) {
    const whole = Math.abs(r.delta) > LINE * 0.5;
    if (whole) rewraps += 1;
    console.log(
      "  " + (LABEL[r.root] ?? r.root).padEnd(11) +
        "  h " + String(r.prev).padStart(7) + " -> " + String(r.next).padStart(7) +
        "  (" + (r.delta > 0 ? "+" : "") + r.delta + ")" +
        (whole ? "   <-- gained or lost a whole line" : "") +
        "   " + r.key
    );
  }
  total += rows.length;
}

console.log("\nheight changes: " + total + "   whole-line changes: " + rewraps);
if (rewraps === 0) console.log("OK: nothing rewrapped. Every height change is sub-line.");
