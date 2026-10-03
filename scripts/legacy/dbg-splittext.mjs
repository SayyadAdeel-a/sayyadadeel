import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("node_modules/gsap/package.json", "utf8"));
console.log("gsap version:", pkg.version);

const src = fs.readFileSync("node_modules/gsap/SplitText.js", "utf8");
console.log("SplitText size:", src.length);
console.log("has gsap_split_word:", src.includes("gsap_split_word"));
console.log("has gsap_split_letter:", src.includes("gsap_split_letter"));
console.log("has gsap-split-word:", src.includes("gsap-split-word"));
const idx = src.indexOf("createElement");
console.log("createElement snippet:", JSON.stringify(src.slice(idx - 200, idx + 300)));

// Compare with the CDN build the reference site loads.
const cdn = fs.readFileSync(
  "docs/research/relab-0c02b053/root-8a5edab2/webflow-js/SplitText.min.js",
  "utf8"
);
console.log("\ncdn size:", cdn.length);
console.log("cdn has gsap_split_word:", cdn.includes("gsap_split_word"));
console.log("cdn has gsap_split_letter:", cdn.includes("gsap_split_letter"));