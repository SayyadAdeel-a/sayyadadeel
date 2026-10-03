import fs from "node:fs";

const h = fs.readFileSync(
  "docs/research/relab-0c02b053/root-8a5edab2/live-page.html",
  "utf8"
);
const i = h.indexOf("Trusted by");
console.log(JSON.stringify(h.slice(i - 120, i + 160)));

console.log("--- entity census in body text ---");
const body = h.slice(h.indexOf("<body"));
const ents = new Map();
for (const m of body.matchAll(/&([a-zA-Z]+|#x?[0-9a-fA-F]+);/g)) {
  ents.set(m[1], (ents.get(m[1]) ?? 0) + 1);
}
console.log([...ents.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30));