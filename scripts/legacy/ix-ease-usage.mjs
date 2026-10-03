// Find how Webflow's engine maps a numeric `ease` index to a GSAP ease, and
// how it treats `properties` whose target value is null.
import fs from "node:fs";

const file = process.argv[2] ??
  "docs/research/relab-0c02b053/404-316556f0/webflow-js/webflow.schunk.39b583d8f7fa071d.js";
const code = fs.readFileSync(file, "utf8");

for (const needle of ["wf:transform", "splitText", "fromTo", "timelineControls"]) {
  let from = 0;
  let hits = 0;
  while (hits < 2) {
    const idx = code.indexOf(needle, from);
    if (idx < 0) break;
    hits += 1;
    from = idx + 1;
    console.log(`\n########## ${needle} @${idx} ##########`);
    console.log(code.slice(Math.max(0, idx - 1200), idx + 1200));
  }
  if (!hits) console.log(`\n${needle}: NOT FOUND`);
}