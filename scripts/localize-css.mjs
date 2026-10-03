// Rewrite the captured Webflow stylesheet so every CDN asset reference points
// at the locally downloaded copy, and report anything still remote.
import fs from "node:fs";

const ART = "docs/research/relab-0c02b053/root-8a5edab2";
const assetMap = JSON.parse(fs.readFileSync(`${ART}/asset-map.json`, "utf8"));

let css = fs.readFileSync(`${ART}/live-webflow.css`, "utf8");

const unresolved = new Set();
let replaced = 0;

for (const [remote, local] of Object.entries(assetMap)) {
  const variants = new Set([remote, encodeURI(remote)]);
  for (const v of variants) {
    if (!css.includes(v)) continue;
    const parts = css.split(v);
    replaced += parts.length - 1;
    css = parts.join(local);
  }
}

// Anything still pointing at the CDN is a missed asset.
for (const m of css.matchAll(/url\(["']?(https?:)?\/\/[^"')]+["']?\)/g)) {
  unresolved.add(m[0]);
}

fs.writeFileSync("app/webflow.css", css);
console.log("replacements:", replaced);
console.log("unresolved urls:", unresolved.size);
for (const u of unresolved) console.log("  " + u);