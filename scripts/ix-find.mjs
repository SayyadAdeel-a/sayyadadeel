// Dump every IX interaction on a page whose actions mention a given hook
// attribute or class, with the full action list.
//
// Usage: node scripts/ix-find.mjs <page-key> <needle>
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT } from "./lib/page-pipeline.mjs";

const key = process.argv[2] ?? "root-8a5edab2";
const needle = process.argv[3] ?? "marku-slide";

const ix = JSON.parse(
  fs.readFileSync(path.join(ART_ROOT, key, "webflow-ix2.json"), "utf8")
);
const byId = new Map(ix.timelines.map((t) => [t.id, t]));

let found = 0;
for (const interaction of ix.interactions) {
  const blob = JSON.stringify(interaction.timelineIds?.map((id) => byId.get(id)));
  if (!blob || !blob.includes(needle)) continue;
  found += 1;
  console.log(`\n=== ${interaction.id} ===`);
  for (const [name, config, target] of interaction.triggers ?? []) {
    console.log(
      `  trigger ${name} control=${config.control ?? config.controlType} ` +
        `target=${JSON.stringify(target?.[0])} ${JSON.stringify(target?.[1])}`
    );
  }
  if (interaction.conditionalPlayback) {
    console.log(`  conditionalPlayback ${JSON.stringify(interaction.conditionalPlayback)}`);
  }
  for (const id of interaction.timelineIds ?? []) {
    const timeline = byId.get(id);
    if (!timeline) continue;
    console.log(
      `  TL ${timeline.id} settings=${JSON.stringify(timeline.settings ?? {})} ` +
        `canvas=${timeline.canvasDuration}`
    );
    for (const action of timeline.actions ?? []) {
      const t = action.timing ?? {};
      const targets = (action.targets ?? [])
        .map((x) => `${x[0]}${JSON.stringify(x[1])}${x[2]?.relationship && x[2].relationship !== "none" ? " " + x[2].relationship : ""}`)
        .join(" , ");
      console.log(
        `    tt=${action.tt} pos=${t.position ?? 0} dur=${t.duration ?? "-"} ` +
          `ease=${JSON.stringify(t.ease ?? null)} ` +
          `stagger=${JSON.stringify(t.stagger ?? null)}`
      );
      console.log(`      targets : ${targets}`);
      console.log(
        `      props   : ${JSON.stringify(action.properties?.["wf:transform"])}` +
          (action.splitText ? ` split=${JSON.stringify(action.splitText)}` : "")
      );
    }
  }
}
console.log(`\n${found} interaction(s) reference "${needle}"`);