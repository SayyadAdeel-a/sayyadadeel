import fs from "node:fs";
import path from "node:path";

const dir = "scripts";
const keep = new Set([
  // Research extraction (reference analysis pipeline)
  "download-webflow-js.mjs",
  "extract-inline.mjs",
  "extract-ix2.mjs",
  "read-ix2.mjs",
  "collect-variants.mjs",
  "list-sections.mjs",
  "summarize-sections.mjs",
  // Asset pipeline
  "download-assets-relab-0c02b053-root-8a5edab2.mjs",
  "download-variants.mjs",
  "localize-css.mjs",
  "convert-to-jsx.mjs",
  "verify-assets.mjs",
  // Visual + behavioural QA
  "compare.mjs",
  "compare-crop.mjs",
  "compare-styles.mjs",
  "compare-behavior.mjs",
  "compare-images.mjs",
  "diff-images.mjs",
  "rebuild.mjs",
]);

const legacy = path.join(dir, "legacy");
const moved = [];
for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
  if (!file.isFile()) continue;
  if (keep.has(file.name)) continue;
  fs.mkdirSync(legacy, { recursive: true });
  fs.renameSync(path.join(dir, file.name), path.join(legacy, file.name));
  moved.push(file.name);
}
console.log(`moved ${moved.length} diagnostic script(s) to scripts/legacy/`);
for (const m of moved) console.log("  " + m);