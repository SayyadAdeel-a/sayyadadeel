// Print the raw JSON of the hover interactions, unabridged.
//
// Why: the hover audit found every split leaf travelling in the opposite
// direction on the clone. `ix-find.mjs` prints a summary and truncates after a
// couple of actions, which is not enough to see the difference between the two
// hovers on `.button` / `.text-button` (they share an interaction id and differ
// only in the details).
//
// Usage: node scripts/dump-hover-payload.mjs [page-key]
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT } from "./lib/page-pipeline.mjs";

const pageKey = process.argv[2] ?? "root-8a5edab2";
const ix = JSON.parse(
  fs.readFileSync(path.join(ART_ROOT, pageKey, "webflow-ix2.json"), "utf8")
);
const byId = new Map(ix.timelines.map((t) => [t.id, t]));

for (const interaction of ix.interactions ?? []) {
  const triggers = interaction.triggers ?? [];
  if (!triggers.some(([name]) => name === "wf:hover")) continue;
  console.log(`\n================ ${interaction.id} ================`);
  console.log("triggers:");
  for (const t of triggers) {
    console.log(`  ${JSON.stringify(t[0])} config=${JSON.stringify(t[1])}`);
    console.log(`      target=${JSON.stringify(t[2])}`);
  }
  for (const id of interaction.timelineIds ?? []) {
    const timeline = byId.get(id);
    console.log(`timeline ${timeline.id} settings=${JSON.stringify(timeline.settings ?? {})}`);
    for (const action of timeline.actions ?? []) {
      console.log(`  actionTypeId=${action.actionTypeId ?? "?"} tt=${action.tt}`);
      console.log(`    timing    ${JSON.stringify(action.timing)}`);
      console.log(`    targets   ${JSON.stringify(action.targets)}`);
      console.log(`    splitText ${JSON.stringify(action.splitText ?? null)}`);
      console.log(`    props     ${JSON.stringify(action.properties["wf:transform"])}`);
    }
  }
}