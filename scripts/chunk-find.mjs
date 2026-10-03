// Locate named helper functions inside Webflow's runtime chunk and print them
// in a readable form.
import fs from "node:fs";

const file = process.argv[2] ??
  "docs/research/relab-0c02b053/404-316556f0/webflow-js/webflow.schunk.39b583d8f7fa071d.js";
const code = fs.readFileSync(file, "utf8");

const names = process.argv.slice(3);
for (const name of names) {
  let from = 0;
  let hits = 0;
  while (hits < 2) {
    const idx = code.indexOf(name, from);
    if (idx < 0) break;
    // Only show real definitions (`name:` exports, `name(` method, `name=`).
    const before = code.slice(Math.max(0, idx - 60), idx);
    if (!/[,{]\s*$/.test(before) || true) {
      hits += 1;
      from = idx + 1;
      console.log(`\n########## ${name} @${idx} ##########`);
      console.log(
        code
          .slice(Math.max(0, idx - 200), idx + 1500)
          .replace(/;/g, ";\n")
          .replace(/\{\s*(?=[a-zA-Z_$])/g, "{\n")
      );
    }
  }
  if (!hits) console.log(`\n${name}: NOT FOUND`);
}