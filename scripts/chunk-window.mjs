// Dump a wide window of Webflow's runtime chunk around an offset so the
// action-building and tween-config code can be read in full.
import fs from "node:fs";

const file = process.argv[2] ??
  "docs/research/relab-0c02b053/404-316556f0/webflow-js/webflow.schunk.39b583d8f7fa071d.js";
const at = Number(process.argv[3] ?? 147471);
const before = Number(process.argv[4] ?? 6000);
const after = Number(process.argv[5] ?? 600);
const code = fs.readFileSync(file, "utf8");
const slice = code.slice(Math.max(0, at - before), at + after);
// Insert line breaks after `;` and `{` to make the minified source readable.
console.log(slice.replace(/;/g, ";\n").replace(/\{\s*(?=[a-zA-Z_$])/g, "{\n"));