// Verify every locally-referenced asset actually exists on disk.
import fs from "node:fs";
import path from "node:path";

const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(p);
    } else if (/\.(tsx|ts|css)$/.test(entry.name)) {
      files.push(p);
    }
  }
};
walk("src");
walk("app");

const missing = new Set();
let checked = 0;
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  for (const m of text.matchAll(/["'(](\/sites\/[^"')\s]+)["')]/g)) {
    for (const rel of m[1].split(",")) {
      checked += 1;
      if (!fs.existsSync(path.join("public", rel))) missing.add(rel);
    }
  }
}

console.log(`references checked: ${checked}`);
console.log(`missing files: ${missing.size}`);
for (const m of [...missing].sort()) console.log("  " + m);