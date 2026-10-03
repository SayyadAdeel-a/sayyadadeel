import fs from "node:fs";

const file = "scripts/compare-behavior.mjs";
let text = fs.readFileSync(file, "utf8");

const selectors = [
  ".selider-section .right-arrow",
  '.w-tab-link[data-w-tab="Tab 3"]',
  ".hero-intro-card-box:nth-of-type(2)",
  ".w-backgroundvideo-backgroundvideoplaypausebutton",
  "[card-image-hover-pfriend]",
  "[hover-pfriend]",
  ".process-slider .w-slider-arrow-right",
];

let patched = 0;
for (const sel of selectors) {
  const needle = `if (${JSON.stringify(sel).replace(/"/g, '"')}) {`;
  // Build the two variants of the guard.
  const quotedDouble = `await page.$("${sel}")`;
  const from = `if (${await_expr(quotedDouble)}) {`;
  void from;
}

function await_expr() {
  return "";
}

// Simpler: replace every `if (X) {` guard that follows a `page.$(...)` call.
const pattern = /(const\s+\w+\s*=\s*await page\.\$\((("[^"]*")|('[^']*'))\);\s*\n\s*if \()(\w+)(\) \{)/g;
text = text.replace(pattern, (m, head, _q1, _q2, _q3, name, tail) => {
  patched += 1;
  return `${head}${name} && (await ${name}.isVisible())${tail}`;
});

fs.writeFileSync(file, text);
console.log(`guards patched: ${patched}`);