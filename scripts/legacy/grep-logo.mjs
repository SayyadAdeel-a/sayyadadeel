import fs from "node:fs";
import path from "node:path";

const ART_ROOT = "docs/research/relab-0c02b053";
const target = process.argv[2];

for (const dir of fs.readdirSync(ART_ROOT)) {
  if (target && dir !== target) continue;
  const file = path.join(ART_ROOT, dir, "live-page.html");
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const found = new Set();
  for (const m of html.matchAll(/.{0,45}logo.{0,45}/gi)) {
    const t = m[0].replace(/\s+/g, " ").trim();
    if (!found.has(t)) found.add(t);
  }
  console.log(`\n===== ${dir} (${found.size} matches) =====`);
  for (const t of [...found].slice(0, 25)) console.log("  " + t);
}