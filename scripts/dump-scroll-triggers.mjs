// Dump the complete raw JSON of every `wf:scroll` interaction on a page,
// including the ScrollTrigger config in full.
//
// Why: the reveal audit found `img.bg-image[origin-fade-up]` at `scale(0,0);
// opacity: 0` in the reference and at its end state in the clone, and the
// reference's live ScrollTrigger registry showed it being *scrubbed* by
// `.bg-image-left-wrap` at progress 0.457. A scrub means the element's state is
// a pure function of scroll position — so it must be re-evaluated continuously,
// not set once. The payload's `scrollTriggerConfig` is the only place that says
// whether `scrub` is set, and `ix-find.mjs` prints only a summary of it.
//
// Usage: node scripts/dump-scroll-triggers.mjs [page-key]
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT } from "./lib/page-pipeline.mjs";

const pageKey = process.argv[2] ?? "root-8a5edab2";
const ix = JSON.parse(
  fs.readFileSync(path.join(ART_ROOT, pageKey, "webflow-ix2.json"), "utf8")
);
const byId = new Map(ix.timelines.map((t) => [t.id, t]));

const scrubbed = [];
const plain = [];

for (const interaction of ix.interactions ?? []) {
  for (const [name, config, target] of interaction.triggers ?? []) {
    if (name !== "wf:scroll") continue;
    const record = { interaction: interaction.id, config, target };
    const scrub = config?.scrollTriggerConfig?.scrub;
    if (scrub !== null && scrub !== undefined) scrubbed.push(record);
    else plain.push(record);
  }
}

console.log(`=== ${pageKey} ===`);
console.log(`wf:scroll interactions: ${scrubbed.length + plain.length}`);
console.log(`  with a scrub (position-driven): ${scrubbed.length}`);
console.log(`  without a scrub (enter/leave):   ${plain.length}\n`);

for (const record of scrubbed) {
  console.log(`--- SCRUBBED ${record.interaction} ---`);
  console.log(`  trigger target : ${JSON.stringify(record.target)}`);
  console.log(`  config         : ${JSON.stringify(record.config)}`);
  for (const id of
    (ix.interactions.find((i) => i.id === record.interaction)?.timelineIds ?? [])
  ) {
    const timeline = byId.get(id);
    console.log(`  timeline ${timeline.id} settings=${JSON.stringify(timeline.settings ?? {})}`);
    for (const action of timeline.actions ?? []) {
      console.log(
        `    tt=${action.tt} timing=${JSON.stringify(action.timing)} ` +
          `props=${JSON.stringify(action.properties["wf:transform"])}`
      );
      for (const t of action.targets ?? []) {
        console.log(`      target ${JSON.stringify(t)}`);
      }
    }
  }
  console.log();
}

console.log(`--- the ${plain.length} non-scrubbed ones (trigger -> target) ---`);
for (const record of plain) {
  const cfg = record.config?.scrollTriggerConfig ?? {};
  console.log(
    `  ${record.interaction}  start=${cfg.start} end=${cfg.end} ` +
      `enter=${cfg.enter} leave=${cfg.leave} enterBack=${cfg.enterBack} leaveBack=${cfg.leaveBack}`
  );
  console.log(`      target ${JSON.stringify(record.target)}`);
}