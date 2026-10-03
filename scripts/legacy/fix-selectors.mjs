import fs from "node:fs";

const file =
  "src/components/sites/relab-0c02b053/shared/InteractionsRuntime.tsx";
let text = fs.readFileSync(file, "utf8");

// The Webflow hover host attributes are `card-image-hover-priend` and
// `hover-pfriend` (note: "priend", not "pfriend").
const FIXES = [
  [/\[card-image-hover-p\w*\]/g, "[card-image-hover-priend]"],
  [/\[hover-p\w*\]/g, "[hover-priend]"],
];

for (const [pattern, replacement] of FIXES) {
  let match;
  while ((match = pattern.exec(text)) !== null) {
    console.log(`${match[0]} -> ${replacement}`);
  }
  text = text.replace(pattern, replacement);
}

fs.writeFileSync(file, text);

for (const sel of ["[card-image-hover-priend]", "[hover-priend]"]) {
  console.log(sel, "->", Array.from(sel).map((c) => c.charCodeAt(0)).join(","));
}