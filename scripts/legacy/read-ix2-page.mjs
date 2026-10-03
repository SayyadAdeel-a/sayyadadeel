// Dump an IX payload in the same readable form as read-ix2.mjs, for any page.
//
// Usage: node scripts/read-ix2-page.mjs <page-key> [--head]
import fs from "node:fs";
import path from "node:path";

const ART_ROOT = "docs/research/relab-0c02b053";
const key = process.argv[2];
const headOnly = process.argv.includes("--head");
const file = key
  ? path.join(ART_ROOT, key, "webflow-ix2.json")
  : path.join(ART_ROOT, "root-8a5edab2", "webflow-ix2.json");

const ix = JSON.parse(fs.readFileSync(file, "utf8"));
const { interactions, timelines } = ix;
const byId = new Map(timelines.map((t) => [t.id, t]));

function fmtTarget(t) {
  const [kind, val] = t;
  const meta = t[2] || {};
  const rel = meta.relationship ? ` ${meta.relationship}` : "";
  const fmo = meta.firstMatchOnly ? " firstMatchOnly" : "";
  const filt = meta.filterBy ? ` filterBy=${JSON.stringify(meta.filterBy)}` : "";
  return `${kind}:${JSON.stringify(val)}${rel}${fmo}${filt}`;
}

function fmtTrigger(tr) {
  const [name, cfg] = tr;
  const parts = [];
  for (const [k, v] of Object.entries(cfg || {})) {
    if (k === "targets") parts.push(`${k}=[${v.map(fmtTarget).join(", ")}]`);
    else parts.push(`${k}=${JSON.stringify(v)}`);
  }
  return `${name} { ${parts.join("; ")} }`;
}

let printed = 0;
for (const it of interactions) {
  console.log("############################################################");
  console.log(`INTERACTION ${it.id}`);
  if (it.conditionalPlayback) {
    console.log(`  conditionalPlayback: ${JSON.stringify(it.conditionalPlayback)}`);
  }
  for (const tr of it.triggers) console.log(`  TRIGGER: ${fmtTrigger(tr)}`);
  for (const tid of it.timelineIds) {
    const tl = byId.get(tid);
    if (!tl) {
      console.log(`  TIMELINE ${tid}: (missing)`);
      continue;
    }
    const actions = tl.actions ?? [];
    console.log(`  TIMELINE ${tl.id}  (${actions.length} actions)`);
    for (const a of actions) {
      console.log(
        `    pos=${a.position ?? 0} dur=${a.timing?.duration ?? 0} ease=${JSON.stringify(a.timing?.easing ?? null)} tt=${a.tt ?? "-"}`
      );
      console.log(`      targets: ${(a.targets ?? []).map(fmtTarget).join(" | ")}`);
      if (a.splitText) console.log(`      splitText: ${JSON.stringify(a.splitText)}`);
      if (a.properties) console.log(`      props: ${JSON.stringify(a.properties)}`);
      if (a.style) console.log(`      style: ${JSON.stringify(a.style)}`);
      if (a.text) console.log(`      text: ${JSON.stringify(a.text)}`);
      if (a.scroll) console.log(`      scroll: ${JSON.stringify(a.scroll)}`);
      if (a.classes) console.log(`      classes: ${JSON.stringify(a.classes)}`);
      for (const k of Object.keys(a)) {
        if (
          [
            "id", "targets", "timing", "tt", "properties", "splitText",
            "style", "text", "scroll", "classes", "variables",
          ].includes(k)
        ) {
          continue;
        }
        console.log(`      ${k}: ${JSON.stringify(a[k]).slice(0, 300)}`);
      }
    }
  }
  printed += 1;
  if (headOnly && printed >= 12) break;
}