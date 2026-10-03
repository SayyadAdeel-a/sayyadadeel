// Print the raw JSON of individual interactions so no field is missed when
// writing the generic IX runtime.
//
// Usage: node scripts/ix-dump-raw.mjs <page-key> <interaction-id>
import fs from "node:fs";
import path from "node:path";

const ART_ROOT = "docs/research/relab-0c02b053";
const [key, id] = process.argv.slice(2);
const ix = JSON.parse(
  fs.readFileSync(path.join(ART_ROOT, key, "webflow-ix2.json"), "utf8")
);

if (id) {
  const it = ix.interactions.find((i) => i.id === id);
  console.log(JSON.stringify(it, null, 2));
  const byId = new Map(ix.timelines.map((t) => [t.id, t]));
  for (const tid of it?.timelineIds ?? []) {
    console.log(`\n--- timeline ${tid} ---`);
    console.log(JSON.stringify(byId.get(tid), null, 2));
  }
} else {
  // Every distinct top-level interaction field, with one example value each.
  const fields = new Map();
  for (const it of ix.interactions) {
    for (const [k, v] of Object.entries(it)) {
      if (!fields.has(k)) fields.set(k, v);
    }
  }
  console.log(`interaction fields: ${[...fields.keys()].join(", ")}\n`);
  for (const [k, v] of fields) {
    console.log(`### ${k}\n${JSON.stringify(v, null, 2).slice(0, 2500)}\n`);
  }
  const tfields = new Map();
  for (const t of ix.timelines) {
    for (const [k, v] of Object.entries(t)) {
      if (!tfields.has(k)) tfields.set(k, v);
    }
  }
  console.log(`timeline fields: ${[...tfields.keys()].join(", ")}`);
  for (const [k, v] of tfields) {
    console.log(`### ${k}\n${JSON.stringify(v, null, 2).slice(0, 1200)}\n`);
  }
  const afields = new Map();
  for (const t of ix.timelines) {
    for (const a of t.actions ?? []) {
      for (const [k, v] of Object.entries(a)) {
        if (!afields.has(k)) afields.set(k, v);
      }
    }
  }
  console.log(`action fields: ${[...afields.keys()].join(", ")}`);
  for (const [k, v] of afields) {
    console.log(`### ${k}\n${JSON.stringify(v, null, 2).slice(0, 900)}\n`);
  }
}