import fs from "node:fs";

// Webflow's IX engine uses GSAP's `power1.out` as the default ease for its
// timelines. Normalise every hand-written interaction to that value, leaving the
// eases that the page's own script specifies (the hero intro tab switch) alone.
const file =
  "src/components/sites/adeel-site/shared/InteractionsRuntime.tsx";
const KEEP = [
  "g.to(currentImage, {", // hero intro tab switch: power2.inOut
  "g.to(nextImage, {", // hero intro tab switch: power2.out
];

const lines = fs.readFileSync(file, "utf8").split("\n");
let changed = 0;
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].includes('"power2.out"')) continue;
  // Skip the hero intro tab block.
  const window = lines.slice(Math.max(0, i - 6), i + 1).join("\n");
  if (KEEP.some((k) => window.includes(k))) continue;
  lines[i] = lines[i].replaceAll('"power2.out"', '"power1.out"');
  changed += 1;
}
fs.writeFileSync(file, lines.join("\n"));
console.log(`lines updated: ${changed}`);