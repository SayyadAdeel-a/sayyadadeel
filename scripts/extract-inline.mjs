import fs from "node:fs";

const html = fs.readFileSync(
  "docs/research/relab-0c02b053/root-8a5edab2/live-page.html",
  "utf8"
);
const outDir = "docs/research/relab-0c02b053/root-8a5edab2/scripts-inline";
fs.mkdirSync(outDir, { recursive: true });

let n = 0;
for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
  n += 1;
  const code = m[1].trim();
  if (!code) continue;
  const file = `${outDir}/inline-${String(n).padStart(2, "0")}.js`;
  fs.writeFileSync(file, code);
  console.log(`--- ${file} (${code.length} chars) ---`);
  console.log(code);
  console.log("");
}