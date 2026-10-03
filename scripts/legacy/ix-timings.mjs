// Print every distinct `timing` shape and easing value across all captured
// pages, so the runtime's easing mapping can be derived from real data.
import fs from "node:fs";
import path from "node:path";

const ART_ROOT = "docs/research/relab-0c02b053";
const seen = new Map();

for (const dir of fs.readdirSync(ART_ROOT)) {
  const file = path.join(ART_ROOT, dir, "webflow-ix2.json");
  if (!fs.existsSync(file)) continue;
  const ix = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const tl of ix.timelines) {
    for (const a of tl.actions ?? []) {
      const timing = a.timing ?? {};
      const key = JSON.stringify(timing);
      if (!seen.has(key)) seen.set(key, { count: 0, dirs: new Set() });
      const rec = seen.get(key);
      rec.count += 1;
      rec.dirs.add(dir);
    }
  }
}

console.log(`distinct timing objects: ${seen.size}\n`);
const rows = [...seen.entries()].sort((x, y) => y[1].count - x[1].count);
for (const [key, rec] of rows) {
  console.log(`${String(rec.count).padStart(5)}  pages=${rec.dirs.size}  ${key}`);
}