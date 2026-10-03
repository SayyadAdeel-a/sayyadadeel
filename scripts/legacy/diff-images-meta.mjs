import fs from "node:fs";

const a = JSON.parse(fs.readFileSync("ref-images-1440.json", "utf8").split("\n--- console ---")[0]);
const b = JSON.parse(fs.readFileSync("clone-images-1440.json", "utf8").split("\n--- console ---")[0]);

console.log(`images: reference=${a.count} clone=${b.count}`);

let diffs = 0;
for (let i = 0; i < Math.min(a.out.length, b.out.length); i++) {
  const x = a.out[i];
  const y = b.out[i];
  const fields = [];
  for (const k of ["cls", "parentCls", "nat", "attr", "rendered", "objectFit", "sizes", "hasSrcset"]) {
    if (String(x[k]) !== String(y[k])) fields.push(`${k}: ref=${x[k]} clone=${y[k]}`);
  }
  if (fields.length) {
    diffs += 1;
    console.log(`\n#${i} src=${x.src}`);
    for (const f of fields) console.log("   " + f);
  }
}
console.log(`\nimages with differences: ${diffs}`);