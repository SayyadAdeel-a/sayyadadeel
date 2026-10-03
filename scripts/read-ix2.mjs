import fs from "node:fs";

const ix = JSON.parse(
  fs.readFileSync(
    "docs/research/relab-0c02b053/root-8a5edab2/webflow-ix2.json",
    "utf8"
  )
);
const [interactions, timelines] = [
  ix.interactions,
  ix.timelines,
];
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
    if (k === "targets") {
      parts.push(`${k}=[${v.map(fmtTarget).join(", ")}]`);
    } else {
      parts.push(`${k}=${JSON.stringify(v)}`);
    }
  }
  return `${name} { ${parts.join("; ")} }`;
}

for (const it of interactions) {
  console.log("############################################################");
  console.log(`INTERACTION ${it.id}`);
  console.log(`  conditionalPlayback: ${JSON.stringify(it.conditionalPlayback ?? null)}`);
  for (const tr of it.triggers) {
    console.log(`  TRIGGER: ${fmtTrigger(tr)}`);
  }
  for (const tid of it.timelineIds) {
    const tl = byId.get(tid);
    if (!tl) {
      console.log(`  TIMELINE ${tid}: (missing)`);
      continue;
    }
    const tlActions = tl.actions ?? [];
    console.log(`  TIMELINE ${tl.id}  (${tlActions.length} actions)`);
    for (const a of tlActions) {
      const t = a.targets.map(fmtTarget).join(" | ");
      console.log(
        `    pos=${a.position ?? 0} dur=${a.timing?.duration ?? 0} ease=${a.timing?.easing ?? "-"} tt=${a.tt ?? "-"}`
      );
      console.log(`      targets: ${t}`);
      if (a.splitText) console.log(`      splitText: ${JSON.stringify(a.splitText)}`);
      if (a.properties) {
        console.log(`      props: ${JSON.stringify(a.properties)}`);
      }
      if (a.style) {
        console.log(`      style: ${JSON.stringify(a.style)}`);
      }
      if (a.text) console.log(`      text: ${JSON.stringify(a.text)}`);
      if (a.scroll) console.log(`      scroll: ${JSON.stringify(a.scroll)}`);
      if (a.classes) console.log(`      classes: ${JSON.stringify(a.classes)}`);
      if (a.variables) console.log(`      variables: ${JSON.stringify(a.variables)}`);
      for (const k of Object.keys(a)) {
        if (
          [
            "id", "targets", "timing", "tt", "properties", "splitText", "style",
            "text", "scroll", "classes", "variables",
          ].includes(k)
        ) {
          continue;
        }
        console.log(`      ${k}: ${JSON.stringify(a[k]).slice(0, 400)}`);
      }
    }
  }
}