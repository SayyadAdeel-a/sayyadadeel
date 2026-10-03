// For every captured page, list which anchors in the header / cta / footer
// Webflow marked as the current page. This yields the exact rule the shared
// shell components must implement.
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

for (const dir of fs.readdirSync(ART_ROOT)) {
  const file = path.join(ART_ROOT, dir, "live-page.html");
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const body = html.slice(html.indexOf("<body") + 5, html.indexOf("</body>"));
  const sections = {};
  for (const node of topLevel(body)) {
    const cm = /class="([^"]*)"/.exec(node);
    sections[cm ? cm[1].trim().split(/\s+/)[0] : ""] = node;
  }

  const marks = {};
  for (const shell of ["header-section", "cta-section", "footer-section"]) {
    const node = sections[shell];
    if (!node) continue;
    marks[shell] = [...node.matchAll(/<a\b[^>]*>/g)]
      .filter((m) => m[0].includes('aria-current="page"'))
      .map((m) => {
        const href = /href="([^"]*)"/.exec(m[0])?.[1] ?? "?";
        const cls = /class="([^"]*)"/.exec(m[0])?.[1] ?? "";
        return `${href} [${cls.split(/\s+/).slice(0, 2).join(".")}]`;
      });
  }
  console.log(`\n${dir}`);
  for (const [shell, list] of Object.entries(marks)) {
    console.log(`  ${shell.padEnd(16)} ${list.length ? list.join("  |  ") : "(none)"}`);
  }
}