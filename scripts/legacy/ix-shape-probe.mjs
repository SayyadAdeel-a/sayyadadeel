// Verify the exact positional shape of `triggers` entries versus `targets`
// entries in the IX payload — they are encoded differently.
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT } from "./lib/page-pipeline.mjs";

const key = process.argv[2] ?? "about-979bddc4";
const ix = JSON.parse(
  fs.readFileSync(path.join(ART_ROOT, key, "webflow-ix2.json"), "utf8")
);

const shapes = new Map();
for (const it of ix.interactions) {
  for (const trigger of it.triggers ?? []) {
    const shape = trigger
      .map((part) => (Array.isArray(part) ? "array" : typeof part))
      .join(",");
    if (!shapes.has(shape)) shapes.set(shape, { count: 0, sample: trigger });
    shapes.get(shape).count += 1;
  }
}
console.log("=== trigger shapes ===");
for (const [shape, info] of shapes) {
  console.log(`${info.count}x  [${shape}]`);
  console.log(`   ${JSON.stringify(info.sample).slice(0, 220)}`);
}

const targetShapes = new Map();
for (const tl of ix.timelines) {
  for (const action of tl.actions ?? []) {
    for (const target of action.targets ?? []) {
      const shape = target
        .map((part) => (Array.isArray(part) ? "array" : typeof part))
        .join(",");
      if (!targetShapes.has(shape)) targetShapes.set(shape, { count: 0, sample: target });
      targetShapes.get(shape).count += 1;
    }
  }
}
console.log("\n=== action target shapes ===");
for (const [shape, info] of targetShapes) {
  console.log(`${info.count}x  [${shape}]`);
  console.log(`   ${JSON.stringify(info.sample).slice(0, 220)}`);
}