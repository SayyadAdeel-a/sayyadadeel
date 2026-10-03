import fs from "node:fs";

const src = fs.readFileSync("node_modules/gsap/SplitText.js", "utf8");
for (const needle of ["createElement(tag)", "incrementClass", "display = "]) {
  const idx = src.indexOf(needle);
  console.log("=== " + needle + " @ " + idx + " ===");
  console.log(src.slice(Math.max(0, idx - 600), idx + 900));
  console.log();
}