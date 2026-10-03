import fs from "node:fs";

// The previous PowerShell-based edit corrupted the UTF-8 box-drawing
// characters in this file. Repair them.
const file = "scripts/generate-specs.mjs";
let text = fs.readFileSync(file, "utf8");

text = text.replaceAll("1440A-900", "1440x900");
text = text.replace(/box `([^`]*)A([^`]*)`/g, (_m, a, b) => `box \`${a}x${b}\``);
text = text.replace(/—/g, "-");

fs.writeFileSync(file, text, "utf8");

const bad = (text.match(/\uFFFD/g) || []).length;
console.log(`replacement characters remaining: ${bad}`);
console.log("--- sanity ---");
for (const line of text.split("\n")) {
  if (line.includes("1440")) console.log(line.trim());
  if (line.includes("box ")) console.log(line.trim());
}