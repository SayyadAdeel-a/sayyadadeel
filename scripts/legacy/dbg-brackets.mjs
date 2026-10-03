import fs from "node:fs";

const dir =
  "docs/research/relab-0c02b053/root-8a5edab2/webflow-js";
const code = fs.readFileSync(
  `${dir}/webflow.a3e096e3.6dc6b8e39b5bf737.js`,
  "utf8"
);
const start = code.indexOf('[{id:"i-');

let depth = 0;
let inStr = null;
const hits = [];
for (let i = start; i < start + 30000; i++) {
  const ch = code[i];
  if (inStr) {
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === inStr) inStr = null;
    continue;
  }
  if (ch === '"' || ch === "'" || ch === "`") {
    inStr = ch;
    continue;
  }
  if (ch === "[") depth++;
  else if (ch === "]") {
    depth--;
    if (depth <= 1) hits.push([i, depth, JSON.stringify(code.slice(i - 45, i + 3))]);
    if (depth === 0) break;
  }
}
for (const h of hits.slice(-12)) console.log(h[0], "depth", h[1], h[2]);