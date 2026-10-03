// Characterise Webflow's IX action `tt` field: for every distinct value, print
// the target kinds, timing and properties it is used with.
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT } from "./lib/page-pipeline.mjs";

const groups = new Map();

for (const dir of fs.readdirSync(ART_ROOT)) {
  const file = path.join(ART_ROOT, dir, "webflow-ix2.json");
  if (!fs.existsSync(file)) continue;
  const ix = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const tl of ix.timelines) {
    for (const a of tl.actions ?? []) {
      const key = String(a.tt);
      if (!groups.has(key)) {
        groups.set(key, { count: 0, samples: [], targetKinds: new Set(), timings: new Set() });
      }
      const g = groups.get(key);
      g.count += 1;
      for (const t of a.targets ?? []) g.targetKinds.add(`${t[0]}${t[2]?.relationship === "within" ? "/within" : ""}${t[2]?.filterBy ? "/trigger-only" : ""}`);
      g.timings.add(JSON.stringify(a.timing ?? {}));
      if (g.samples.length < 6) {
        g.samples.push({
          page: dir,
          tl: tl.id,
          targets: (a.targets ?? []).map((t) => [t[0], t[1], t[2]]),
          timing: a.timing,
          properties: a.properties,
          splitText: a.splitText,
        });
      }
    }
  }
}

for (const [tt, g] of [...groups.entries()].sort()) {
  console.log(`\n########## tt=${tt}  (${g.count} actions) ##########`);
  console.log(`  target kinds: ${[...g.targetKinds].join(", ")}`);
  console.log(`  timings: ${[...g.timings].slice(0, 8).join(" | ")}`);
  for (const s of g.samples) {
    console.log(
      `  - ${s.page} ${s.tl} targets=${JSON.stringify(s.targets)}`
    );
    console.log(`      timing=${JSON.stringify(s.timing)}`);
    console.log(`      props=${JSON.stringify(s.properties)}`);
    if (s.splitText) console.log(`      splitText=${JSON.stringify(s.splitText)}`);
  }
}