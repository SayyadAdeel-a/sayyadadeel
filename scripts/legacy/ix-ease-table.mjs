// Extract the numeric ease-index -> GSAP ease mapping used by Webflow's
// interaction engine, straight out of the captured runtime chunk.
import fs from "node:fs";

const file = process.argv[2] ??
  "docs/research/relab-0c02b053/404-316556f0/webflow-js/webflow.schunk.39b583d8f7fa071d.js";
const code = fs.readFileSync(file, "utf8");

const needles = ["power1.out", "elastic.inOut", "bounce.inOut", "sine.inOut"];
for (const needle of needles) {
  const idx = code.indexOf(needle);
  if (idx < 0) {
    console.log(`${needle}: not found`);
    continue;
  }
  console.log(`\n===== context around ${needle} @${idx} =====`);
  console.log(code.slice(Math.max(0, idx - 900), idx + 700));
}