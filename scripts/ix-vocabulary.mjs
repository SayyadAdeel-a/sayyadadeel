// Build the complete vocabulary of the Webflow IX payloads across every
// captured page: trigger kinds, control types, target kinds, action types,
// transform channels, easings, breakpoints and plugin configs. This is the
// contract the generic IX runtime has to satisfy.
import fs from "node:fs";
import path from "node:path";

const ART_ROOT = "docs/research/relab-0c02b053";

const tally = new Map();
function bump(label, value) {
  const key = `${label}: ${value}`;
  tally.set(key, (tally.get(key) ?? 0) + 1);
}

function walk(value, fn, pathStr = "") {
  fn(value, pathStr);
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, fn, `${pathStr}[${i}]`));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walk(v, fn, `${pathStr}.${k}`);
  }
}

let pages = 0;
let totals = { interactions: 0, timelines: 0, actions: 0 };

for (const dir of fs.readdirSync(ART_ROOT)) {
  const file = path.join(ART_ROOT, dir, "webflow-ix2.json");
  if (!fs.existsSync(file)) continue;
  pages += 1;
  const ix = JSON.parse(fs.readFileSync(file, "utf8"));
  const byId = new Map(ix.timelines.map((t) => [t.id, t]));
  totals.interactions += ix.interactions.length;
  totals.timelines += ix.timelines.length;

  for (const it of ix.interactions) {
    if (it.conditionalPlayback) {
      walk(it.conditionalPlayback, (v, p) => {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          bump("conditionalPlayback." + p.replace(/\[\d+\]/g, "[*]"), JSON.stringify(v));
        }
      });
    }
    for (const [name, cfg] of it.triggers ?? []) {
      bump("trigger", name);
      for (const k of Object.keys(cfg ?? {})) bump("trigger.cfg", k);
      if (cfg?.pluginConfig) {
        for (const k of Object.keys(cfg.pluginConfig)) bump("trigger.pluginConfig", k);
      }
    }
    for (const tid of it.timelineIds ?? []) {
      const tl = byId.get(tid);
      if (!tl) {
        bump("timeline", "(missing reference)");
        continue;
      }
      totals.actions += (tl.actions ?? []).length;
      for (const a of tl.actions ?? []) {
        bump("action.keys", Object.keys(a).sort().join("+"));
        bump("action.tt", String(a.tt));
        const easing = a.timing?.easing;
        if (easing) {
          bump("easing.type", easing.type);
          if (easing.type === "curve") tally.set("easing.curvePoints: " + JSON.stringify(easing.points), (tally.get("easing.curvePoints: " + JSON.stringify(easing.points)) ?? 0) + 1);
        }
        bump("timing.keys", Object.keys(a.timing ?? {}).sort().join("+"));
        for (const t of a.targets ?? []) {
          bump("target.kind", t[0]);
          bump("target.relationship", t[2]?.relationship ?? "(none)");
          if (t[2]?.filterBy) bump("target.filterBy", JSON.stringify(t[2].filterBy));
          if (t[2]?.firstMatchOnly !== undefined) bump("target.firstMatchOnly", String(t[2].firstMatchOnly));
          if (t[0] === "wf:class") tally.set("target.class: " + JSON.stringify(t[1]), (tally.get("target.class: " + JSON.stringify(t[1])) ?? 0) + 1);
          if (t[0] === "wf:attribute") tally.set("target.attribute: " + JSON.stringify(t[1]), (tally.get("target.attribute: " + JSON.stringify(t[1])) ?? 0) + 1);
        }
        if (a.properties?.["wf:transform"]) {
          for (const k of Object.keys(a.properties["wf:transform"])) bump("transform.channel", k);
        }
        if (a.splitText) {
          bump("splitText.type", a.splitText.type);
          bump("splitText.keys", Object.keys(a.splitText).sort().join("+"));
        }
        if (a.scroll) for (const k of Object.keys(a.scroll)) bump("scroll.key", k);
        if (a.style) for (const k of Object.keys(a.style)) bump("style.key", k);
        if (a.variables) bump("variables", "present");
        if (a.classes) bump("action.classes", "present");
      }
    }
  }
}

console.log(`pages: ${pages}`);
console.log(
  `totals: ${totals.interactions} interactions, ${totals.timelines} timelines, ${totals.actions} actions`
);
console.log("\n===== vocabulary =====");
for (const [k, v] of [...tally.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`  ${String(v).padStart(4)}  ${k}`);
}