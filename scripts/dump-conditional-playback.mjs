// Print `conditionalPlayback` for the hover interactions, plus how many elements
// each one would bind to.
//
// Why: after fixing the single-element trigger binding, `.button` hover on mobile
// still did nothing on any button, while the same interaction worked at 1440.
// `.button[0]` has no box at 390 on either site — it is the off-canvas mobile nav
// button — which is what made the old binding dead there. The remaining failure
// has to be in how the interaction is constructed for that breakpoint, and
// `conditionalPlayback` is the mechanism that varies construction per breakpoint.
//
// Usage: node scripts/dump-conditional-playback.mjs [page-key]
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT } from "./lib/page-pipeline.mjs";

const pageKey = process.argv[2] ?? "about-979bddc4";
const ix = JSON.parse(
  fs.readFileSync(path.join(ART_ROOT, pageKey, "webflow-ix2.json"), "utf8")
);

console.log(`=== ${pageKey}: conditionalPlayback ===\n`);
let withRules = 0;
for (const interaction of ix.interactions ?? []) {
  const triggers = interaction.triggers ?? [];
  const isHover = triggers.some(([n]) => n === "wf:hover");
  const rules = interaction.conditionalPlayback;
  if (!rules?.length) continue;
  withRules += 1;
  const triggerTargets = triggers.map((t) => JSON.stringify(t[2]?.[1]));
  console.log(`${interaction.id}  hover=${isHover ? "yes" : "no"}`);
  console.log(`  triggers: ${triggerTargets.join(" | ")}`);
  console.log(`  rules: ${JSON.stringify(rules)}`);
  const byId = new Map(ix.timelines.map((t) => [t.id, t]));
  for (const id of interaction.timelineIds ?? []) {
    for (const action of byId.get(id)?.actions ?? []) {
      console.log(`  action target: ${JSON.stringify(action.targets?.[0])}`);
    }
  }
  console.log();
}
console.log(`${withRules} interaction(s) have conditionalPlayback rules`);