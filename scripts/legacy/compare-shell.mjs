// Compare the repeated shell sections (header / cta / footer) across every
// captured page so shared components can be extracted without losing fidelity.
import fs from "node:fs";
import path from "node:path";

const ART_ROOT = "docs/research/relab-0c02b053";

function topLevel(src) {
  const out = [];
  let i = 0;
  let depth = 0;
  let start = -1;
  const VOID = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
  ]);
  for (; i < src.length; i++) {
    if (src[i] !== "<") continue;
    if (src[i + 1] === "/") {
      const gt = src.indexOf(">", i);
      depth -= 1;
      if (depth === 0 && start >= 0) {
        out.push(src.slice(start, gt + 1));
        start = -1;
      }
      i = gt;
      continue;
    }
    const m = /^<([a-zA-Z][\w:.-]*)/.exec(src.slice(i));
    if (!m) continue;
    const name = m[1].toLowerCase();
    if (depth === 0) start = i;
    let j = i;
    let quote = null;
    while (j < src.length) {
      const c = src[j];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === ">") break;
      j++;
    }
    const selfClose = src[j - 1] === "/";
    if (VOID.has(name) || selfClose) {
      if (depth === 0) out.push(src.slice(i, j + 1));
    } else depth += 1;
    i = j;
  }
  return out;
}

const pages = [];
for (const dir of fs.readdirSync(ART_ROOT)) {
  const file = path.join(ART_ROOT, dir, "live-page.html");
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const body = html.slice(html.indexOf("<body") + 5, html.indexOf("</body>"));
  const nodes = topLevel(body);
  const sections = {};
  for (const node of nodes) {
    const cm = /class="([^"]*)"/.exec(node);
    const cls = cm ? cm[1].trim().split(/\s+/)[0] : "";
    sections[cls] = node;
  }
  pages.push({ dir, sections });
}

const SHELL = ["header-section", "cta-section", "footer-section"];

for (const shell of SHELL) {
  const variants = new Map();
  for (const p of pages) {
    const node = p.sections[shell];
    if (!node) continue;
    if (!variants.has(node)) variants.set(node, []);
    variants.get(node).push(p.dir);
  }
  console.log(
    `\n===== ${shell}: ${variants.size} distinct variant(s) across ${pages.length} pages =====`
  );
  let index = 0;
  for (const [html, dirs] of variants) {
    index += 1;
    console.log(`  variant ${index} (${html.length} bytes) used by ${dirs.length} page(s):`);
    console.log(`    ${dirs.slice(0, 4).join(", ")}${dirs.length > 4 ? ", …" : ""}`);
  }

  // Show the first difference between the two largest variants.
  const sorted = [...variants.entries()].sort((a, b) => b[0].length - a[0].length);
  if (sorted.length > 1) {
    const a = sorted[0][0];
    const b = sorted[1][0];
    let i = 0;
    while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
    console.log(`\n  first divergence at char ${i}:`);
    console.log(`    A: …${a.slice(Math.max(0, i - 70), i + 90)}…`);
    console.log(`    B: …${b.slice(Math.max(0, i - 70), i + 90)}…`);
  }
}

console.log("\n===== per-page section inventory =====");
for (const p of pages) {
  console.log(`${p.dir}\n  ${Object.keys(p.sections).join(", ")}`);
}