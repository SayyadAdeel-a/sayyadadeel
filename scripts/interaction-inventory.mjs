// Interaction inventory: every trigger in every page's decoded IX payload,
// grouped by trigger type and target, plus the timeline shapes they drive.
//
// This is the checklist for the interaction sweep. `audit-motion.mjs` only
// proves that *continuous* motion runs; this file says what everything else is
// supposed to do, so the click / hover / scroll-reveal audit has an authoritative
// list to work from instead of whatever selectors happen to be guessed.
//
// Usage: node scripts/interaction-inventory.mjs
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT, allRoutes } from "./lib/page-pipeline.mjs";

const TRIGGER_SHAPES = new Map(); // trigger -> { count, pages:Set, targets:Set }
const ACTION_KINDS = new Map(); // property key -> { count, values:Set }
/** hook/selector -> { triggers:Set, pages:Set, actions:number } */
const BY_SELECTOR = new Map();
let totalInteractions = 0;

/** Pull the hook names out of a Webflow target tuple such as
 *  `["wf:attribute", ['[fade-up="true"]'], {...}]` or `["wf:class", ["btn-anim"], {...}]`.
 *
 *  The selector list is always element 1 of the tuple; element 0 is the
 *  selector *kind*. */
function hooksOfTarget(target) {
  const kind = target?.[0];
  // Shape gotcha: `wf:attribute` targets carry a bare string in slot 1, while
  // `wf:class` targets carry an array. Normalise before matching.
  const list = (Array.isArray(target?.[1]) ? target[1] : [target?.[1]]).filter(
    (x) => typeof x === "string"
  );
  const hooks = [];
  for (const selector of list) {
    if (kind === "wf:attribute") {
      // `[fade-up="true"]` -> `fade-up`
      const attr = /^\[([a-z][a-z0-9-]*)=/.exec(selector);
      if (attr) hooks.push(attr[1]);
    } else if (kind === "wf:class") {
      // `btn-anim` -> `.btn-anim` (Webflow stores class selectors bare)
      if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(selector)) hooks.push("." + selector);
    }
  }
  return hooks;
}

function note(target, trigger, route) {
  for (const hook of hooksOfTarget(target)) {
    if (!BY_SELECTOR.has(hook)) {
      BY_SELECTOR.set(hook, { triggers: new Set(), pages: new Set(), count: 0 });
    }
    const bucket = BY_SELECTOR.get(hook);
    bucket.triggers.add(trigger);
    bucket.pages.add(route);
    bucket.count += 1;
  }
}

for (const entry of allRoutes()) {
  const file = path.join(ART_ROOT, entry.pageKey, "webflow-ix2.json");
  if (!fs.existsSync(file)) continue;
  const ix = JSON.parse(fs.readFileSync(file, "utf8"));

  for (const interaction of ix.interactions ?? []) {
    totalInteractions += 1;
    const triggerNames = [];
    for (const [name, config, target] of interaction.triggers ?? []) {
      triggerNames.push(name);
      if (!TRIGGER_SHAPES.has(name)) {
        TRIGGER_SHAPES.set(name, { count: 0, pages: new Set(), targets: new Set() });
      }
      const bucket = TRIGGER_SHAPES.get(name);
      bucket.count += 1;
      bucket.pages.add(entry.route);
      bucket.targets.add(String(target?.[0] ?? "self"));
      note(target, name, entry.route);
      void config;
    }

    const byId = new Map((ix.timelines ?? []).map((t) => [t.id, t]));
    for (const id of interaction.timelineIds ?? []) {
      const timeline = byId.get(id);
      if (!timeline) continue;
      for (const action of timeline.actions ?? []) {
        for (const target of action.targets ?? []) {
          note(target, triggerNames.join("+") || "?", entry.route);
        }
        for (const key of Object.keys(action.properties ?? {})) {
          if (!ACTION_KINDS.has(key)) {
            ACTION_KINDS.set(key, { count: 0, values: new Set() });
          }
          const bucket = ACTION_KINDS.get(key);
          bucket.count += 1;
          const value = JSON.stringify(action.properties[key]);
          if (bucket.values.size < 6) bucket.values.add(value.slice(0, 90));
        }
      }
    }
  }
}

console.log(`=== triggers across ${allRoutes().length} pages (${totalInteractions} interactions) ===\n`);
for (const [name, bucket] of [...TRIGGER_SHAPES.entries()].sort(
  (a, b) => b[1].count - a[1].count
)) {
  console.log(`  ${String(bucket.count).padStart(4)}x  ${name}`);
  console.log(`        on ${bucket.pages.size} page(s): ${[...bucket.pages].join(" ")}`);
  console.log(`        targets: ${[...bucket.targets].slice(0, 4).join(" | ")}`);
}

console.log(`\n=== animated properties (${ACTION_KINDS.size} distinct) ===\n`);
for (const [key, bucket] of [...ACTION_KINDS.entries()].sort(
  (a, b) => b[1].count - a[1].count
)) {
  console.log(`  ${String(bucket.count).padStart(4)}x  ${key}`);
  for (const value of bucket.values) console.log(`          ${value}`);
}

console.log(`\n=== hooks by trigger (${BY_SELECTOR.size} selectors) ===\n`);
const grouped = new Map();
for (const [hook, bucket] of BY_SELECTOR) {
  const key = [...bucket.triggers].sort().join("+");
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key).push(`${hook} (${bucket.pages.size}p)`);
}
for (const [key, hooks] of [...grouped.entries()].sort()) {
  console.log(`  ${key}`);
  console.log(`      ${hooks.join("  ")}`);
}

fs.writeFileSync(
  `${ART_ROOT}/generated/interaction-inventory.json`,
  JSON.stringify(
    {
      totalInteractions,
      triggers: Object.fromEntries(
        [...TRIGGER_SHAPES.entries()].map(([k, v]) => [
          k,
          { count: v.count, pages: [...v.pages], targets: [...v.targets] },
        ])
      ),
      properties: Object.fromEntries(
        [...ACTION_KINDS.entries()].map(([k, v]) => [
          k,
          { count: v.count, values: [...v.values] },
        ])
      ),
      bySelector: Object.fromEntries(
        [...BY_SELECTOR.entries()].map(([k, v]) => [
          k,
          { triggers: [...v.triggers], pages: [...v.pages], count: v.count },
        ])
      ),
    },
    null,
    2
  )
);
console.log(`\nwrote ${ART_ROOT}/generated/interaction-inventory.json`);
