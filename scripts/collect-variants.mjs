import fs from "node:fs";

const h = fs.readFileSync(
  "docs/research/relab-0c02b053/root-8a5edab2/live-page.html",
  "utf8"
);

const urls = new Set();
let attrCount = 0;
for (const m of h.matchAll(/srcset="([^"]+)"/gi)) {
  attrCount += 1;
  for (const part of m[1].split(",")) {
    const u = part.trim().split(/\s+/)[0];
    if (u) urls.add(u);
  }
}
console.log("srcset attributes:", attrCount);
console.log("unique variant urls:", urls.size);

// Group by base file (strip the -WxH suffix).
const groups = new Map();
for (const u of urls) {
  const base = u.replace(/-\d+x\d+(\.[a-z0-9]+)$/i, "$1");
  if (!groups.has(base)) groups.set(base, []);
  groups.get(base).push(u);
}
console.log("distinct source images with variants:", groups.size);
const sample = [...groups.entries()].slice(0, 4);
for (const [base, list] of sample) {
  console.log(`\n${base}`);
  for (const u of list) console.log("   " + u);
}

fs.writeFileSync(
  "docs/research/relab-0c02b053/root-8a5edab2/image-variants.json",
  JSON.stringify([...groups.entries()], null, 2)
);
console.log("\nwrote image-variants.json");