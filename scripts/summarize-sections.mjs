// Summarize which Webflow widget classes and IX attribute hooks each top-level
// section uses, so we know which runtime behaviors must be reimplemented.
import fs from "node:fs";

const ART = "docs/research/relab-0c02b053/root-8a5edab2";
const html = fs.readFileSync(`${ART}/live-page.html`, "utf8");
const body = html.slice(html.indexOf("<body") + 5, html.indexOf("</body>"));

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

function children(str) {
  const out = [];
  let i = 0;
  let depth = 0;
  let start = -1;
  for (; i < str.length; i++) {
    if (str[i] === "<") {
      if (str[i + 1] === "/") {
        const gt = str.indexOf(">", i);
        depth--;
        if (depth === 0 && start >= 0) {
          out.push(str.slice(start, gt + 1));
          start = -1;
        }
        i = gt;
        continue;
      }
      const m = /^<([a-zA-Z][\w:-]*)/.exec(str.slice(i));
      if (!m) continue;
      const name = m[1].toLowerCase();
      if (depth === 0) start = i;
      let j = i;
      let quote = null;
      while (j < str.length) {
        const c = str[j];
        if (quote) {
          if (c === quote) quote = null;
        } else if (c === '"' || c === "'") quote = c;
        else if (c === ">") break;
        j++;
      }
      const selfClose = str[j - 1] === "/";
      if (VOID.has(name) || selfClose) {
        if (depth === 0) out.push(str.slice(i, j + 1));
      } else depth++;
      i = j;
    }
  }
  return out;
}

const nodes = children(body).filter(
  (h) => /^<(section|div|main|nav|footer)\b/.test(h)
);

for (const node of nodes) {
  const cm = /class="([^"]*)"/.exec(node);
  const cls = cm ? cm[1] : "-";
  const widgets = [
    ...new Set(
      [...node.matchAll(/class="([^"]*)"/g)]
        .flatMap((m) => m[1].split(/\s+/))
        .filter((c) => c.startsWith("w-"))
    ),
  ].join(" ");
  const attrs = [
    ...new Set(
      [...node.matchAll(/\s([a-zA-Z-]+(?:="[^"]*")?)(?=[\s>])/g)]
        .map((m) => m[1])
        .filter((a) => !a.startsWith("data-wf") && !/^(class|src|alt|style|href|id|srcset|loading|decoding|width|height|role|aria-\w+)$/.test(a))
        .map((a) => a.replace(/=.*/, ""))
    ),
  ].join(" ");
  const scripts = (node.match(/<script/g) || []).length;
  console.log(`### ${cls}`);
  console.log(`  widgets: ${widgets || "-"}`);
  console.log(`  custom attrs: ${attrs || "-"}`);
  console.log(`  scripts: ${scripts}`);
  const imgs = (node.match(/<img /g) || []).length;
  const videos = (node.match(/<video/g) || []).length;
  const bgs = [...new Set([...node.matchAll(/background-image:\s*url\(([^)]+)\)/g)].map((m) => m[1]))];
  console.log(`  imgs=${imgs} videos=${videos} cssBg=${bgs.length}`);
  if (bgs.length) console.log(`    bg urls: ${bgs.join(" | ")}`);
  console.log("");
}