// Enumerate top-level <section> elements in the captured live page HTML.
import fs from "node:fs";

const html = fs.readFileSync(process.argv[2], "utf8");
const body = html.slice(html.indexOf("<body") + 5, html.indexOf("</body>"));

// Walk top-level children of body.
const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

function children(str) {
  const out = [];
  let i = 0;
  let depth = 0;
  let start = -1;
  let tag = "";
  while (i < str.length) {
    if (str[i] === "<") {
      if (str[i + 1] === "/") {
        const gt = str.indexOf(">", i);
        const name = str.slice(i + 2, gt).trim().split(/\s/)[0].toLowerCase();
        if (depth === 0) { start = i; tag = name; }
        depth--;
        if (depth === 0 && start >= 0) { out.push({ tag: name, html: str.slice(start, gt + 1) }); start = -1; }
        i = gt + 1;
        continue;
      }
      const m = /^<([a-zA-Z][\w:-]*)/.exec(str.slice(i));
      if (!m) { i++; continue; }
      const name = m[1].toLowerCase();
      if (depth === 0) { start = i; tag = name; }
      // find end of tag accounting for quoted attribute values
      let j = i;
      let quote = null;
      while (j < str.length) {
        const c = str[j];
        if (quote) { if (c === quote) quote = null; }
        else if (c === '"' || c === "'") quote = c;
        else if (c === ">") break;
        j++;
      }
      const selfClose = str[j - 1] === "/";
      if (VOID.has(name) || selfClose) {
        if (depth === 0) out.push({ tag: name, html: str.slice(i, j + 1) });
      } else {
        depth++;
      }
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

const nodes = children(body);
let idx = 0;
for (const n of nodes) {
  const cm = /class="([^"]*)"/.exec(n.html);
  const idm = /id="([^"]*)"/.exec(n.html);
  idx += 1;
  console.log(
    `${String(idx).padStart(2, "0")}  <${n.tag}>  len=${n.html.length}  id=${idm ? idm[1] : "-"}  class=${cm ? cm[1] : "-"}`
  );
}