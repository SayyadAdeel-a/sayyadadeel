// Print every timeline of a page with its full trigger set, settings and
// actions, so each behaviour can be transcribed exactly.
//
// Usage: node scripts/ix-dump-page.mjs <page-key>
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT } from "./lib/page-pipeline.mjs";

const key = process.argv[2] ?? "about-979bddc4";
const filter = process.argv[3];
const ix = JSON.parse(
  fs.readFileSync(path.join(ART_ROOT, key, "webflow-ix2.json"), "utf8")
);
const byId = new Map(ix.timelines.map((t) => [t.id, t]));

for (const it of ix.interactions) {
  const triggers = it.triggers
    .map(([name, cfg, targets]) => {
      const t = (targets ?? [])
        .map((x) => `${x[0]}${JSON.stringify(x[1])}${x[2]?.relationship === "within" ? " within" : ""}`)
        .join(" , ");
      const extra = cfg?.scrollTriggerConfig
        ? ` scroll=${JSON.stringify(cfg.scrollTriggerConfig)}`
        : "";
      const plugin = cfg?.pluginConfig ? ` plugin=${JSON.stringify(cfg.pluginConfig)}` : "";
      return `${name}[${cfg?.control ?? cfg?.controlType}] -> ${t}${extra}${plugin}`;
    })
    .join("\n        ");
  const cond = it.conditionalPlayback
    ? ` CONDITIONAL=${JSON.stringify(it.conditionalPlayback)}`
    : "";
  const header = `=== ${it.id} ===\n    ${triggers}${cond}`;
  if (filter && !header.includes(filter)) continue;
  console.log(header);
  for (const tid of it.timelineIds ?? []) {
    const tl = byId.get(tid);
    if (!tl) {
      console.log(`    MISSING ${tid}`);
      continue;
    }
    console.log(
      `    TL ${tl.id} settings=${JSON.stringify(tl.settings ?? {})} canvas=${tl.canvasDuration} meta=${JSON.stringify(tl.triggerMetadata ?? {})}`
    );
    for (const a of tl.actions ?? []) {
      const tg = (a.targets ?? [])
        .map((x) => `${x[0]}${JSON.stringify(x[1])} rel=${x[2]?.relationship ?? "none"}${x[2]?.filterBy ? " trigger-only" : ""}`)
        .join(" , ");
      console.log(
        `      tt=${a.tt} pos=${a.timing?.position ?? 0} dur=${a.timing?.duration ?? "-"} ease=${JSON.stringify(a.timing?.ease ?? null)} stagger=${JSON.stringify(a.timing?.stagger ?? null)} repeat=${a.timing?.repeat ?? "-"} yoyo=${a.timing?.yoyo ?? "-"}`
      );
      console.log(`        targets: ${tg}`);
      console.log(
        `        props:   ${JSON.stringify(a.properties)}${a.splitText ? ` split=${JSON.stringify(a.splitText)}` : ""}`
      );
    }
  }
}