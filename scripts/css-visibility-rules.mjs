// List every `visibility` rule in a page's captured stylesheet, grouped, so the
// initial-hiding mechanism is read from the artefact rather than guessed at.
//
// Why: on `/` the reference hides 7 of 21 `[group-fedup-move]` elements on a
// fresh load and the clone hides all 21. The hook attributes that the reveal
// interactions bind to (`group-fedup-move-pfriend`, `group-fade-up-parent`) match
// **zero** elements in the live DOM — they exist only inside selectors in the
// stylesheet. So whatever hides those 7 elements is not the ScrollTrigger, and
// the stylesheet is where the real mechanism must be.
//
// Usage: node scripts/css-visibility-rules.mjs [page-key]
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT } from "./lib/page-pipeline.mjs";

const pageKey = process.argv[2] ?? "root-8a5edab2";
const html = fs.readFileSync(path.join(ART_ROOT, pageKey, "live-page.html"), "utf8");

// Every <style> block, concatenated.
const blocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
  (m) => m[1]
);
console.log(`${blocks.length} <style> block(s) in ${pageKey}\n`);

/** Split a stylesheet into rules, tolerating @media wrappers. */
function rules(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) out.push({ selector: m[1].trim(), body: m[2].trim() });
  return out;
}

const all = blocks.flatMap((css) =>
  rules(css).map((r) => ({ ...r, block: blocks.indexOf(css) }))
);

const visibility = all.filter((r) => /visibility/.test(r.body));
console.log(`=== ${visibility.length} rule(s) setting visibility ===\n`);
for (const rule of visibility) {
  console.log(`  selector: ${rule.selector.replace(/\s+/g, " ")}`);
  console.log(`  body    : ${rule.body.replace(/\s+/g, " ")}`);
  console.log(`  block   : #${rule.block} (${rule.selector.split(",").length} selector(s))`);
  for (const part of rule.selector.split(",")) {
    console.log(`      - ${part.trim()}`);
  }
  console.log();
}

// Also: any rule that sets opacity: 0 up front, which would hide without GSAP.
const opacityZero = all.filter((r) => /opacity\s*:\s*0(?![\d.])/.test(r.body));
console.log(`=== ${opacityZero.length} rule(s) setting opacity: 0 ===\n`);
for (const rule of opacityZero) {
  console.log(`  ${rule.selector.replace(/\s+/g, " ").slice(0, 200)}`);
  console.log(`    body: ${rule.body.replace(/\s+/g, " ")}`);
}

// And the page's own custom JS, which may do the hiding imperatively.
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
  (m) => m[1]
);
console.log(`\n=== ${inlineScripts.length} inline <script> block(s) ===`);
inlineScripts.forEach((code, i) => {
  const trimmed = code.trim();
  if (!trimmed) return;
  console.log(`\n--- script ${i} (${trimmed.length} chars) ---`);
  console.log(trimmed.slice(0, 4000));
});