// Resolve one reveal interaction completely: the raw payload, the DOM it binds
// to, and the selector *as the browser sees it* on both sites.
//
// Why this exists: on `/`, ten `group-fedup-move` elements (`.our-packages-box`,
// `.client-stories-card-box`) are at their natural state in the reference on a
// fresh load but hidden at `opacity: 0; translate(0, 100px)` in the clone. That
// pattern — from-state applied where the reference applies none — is the
// signature of a target set that resolves to nothing on the reference and
// something on the clone, so the question is what each side's selector matches.
//
// Usage: node scripts/probe-reveal-binding.mjs [page-key] [trigger-attr]
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT } from "../lib/page-pipeline.mjs";
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const pageKey = process.argv[2] ?? "root-8a5edab2";
const triggerAttr = process.argv[3] ?? "group-fedup-move-pfriend";
const targetAttr = process.argv[4] ?? "group-fedup-move";

const ix = JSON.parse(
  fs.readFileSync(path.join(ART_ROOT, pageKey, "webflow-ix2.json"), "utf8")
);
const byId = new Map(ix.timelines.map((t) => [t.id, t]));

console.log(`=== payload: interactions targeting [${targetAttr}] ===\n`);
for (const interaction of ix.interactions ?? []) {
  const blob = JSON.stringify(
    interaction.timelineIds.map((id) => byId.get(id))
  );
  if (!blob.includes(`[${targetAttr}`)) continue;
  console.log(`interaction ${interaction.id}`);
  for (const [name, config, target] of interaction.triggers ?? []) {
    console.log(`  trigger ${name}`);
    console.log(`    config ${JSON.stringify(config)}`);
    console.log(`    target ${JSON.stringify(target)}`);
  }
  for (const id of interaction.timelineIds ?? []) {
    const timeline = byId.get(id);
    console.log(`  timeline ${timeline.id} settings=${JSON.stringify(timeline.settings ?? {})}`);
    for (const action of timeline.actions ?? []) {
      console.log(
        `    action tt=${action.tt} targets=${JSON.stringify(action.targets)} ` +
          `timing=${JSON.stringify(action.timing)} props=${JSON.stringify(action.properties["wf:transform"])}`
      );
    }
  }
  console.log();
}

/** Runs in the page: report what the exact selectors match. */
const MATCH = ({ triggerSelector, targetSelector, triggerAttr, targetAttr }) => {
  const triggers = [...document.querySelectorAll(triggerSelector)];
  const targets = [...document.querySelectorAll(targetSelector)];
  const withinCount = triggers.reduce((n, t) => n + t.querySelectorAll(targetSelector).length, 0);
  // Attribute values, verbatim — Webflow hook values are frequently misspelled
  // ("ture") and the misspelling is part of the selector.
  const values = (attr) => {
    const set = new Map();
    for (const el of document.querySelectorAll(`[${attr}]`)) {
      const v = el.getAttribute(attr);
      set.set(v, (set.get(v) ?? 0) + 1);
    }
    return [...set.entries()].map(([v, n]) => `${JSON.stringify(v)} x${n}`);
  };
  return {
    triggerSelector,
    triggerMatches: triggers.length,
    targetSelector,
    targetMatches: targets.length,
    targetsWithinTriggers: withinCount,
    triggerAttrValues: values(triggerAttr),
    targetAttrValues: values(targetAttr),
    // Sample one target and show whether it is inside a trigger element.
    sampleTargetParentChain: targets[0]
      ? (() => {
          const chain = [];
          let node = targets[0].parentElement;
          while (node && chain.length < 12) {
            const attrs = [...node.attributes]
              .filter((a) => /fedup|fade|friend|parent|child/i.test(a.name))
              .map((a) => `${a.name}="${a.value}"`);
            chain.push(
              `.${node.className?.toString().split(/\s+/).slice(0, 2).join(".")}` +
                (attrs.length ? ` [${attrs.join(" ")}]` : "")
            );
            node = node.parentElement;
          }
          return chain;
        })()
      : null,
  };
};

const browser = await launch();
for (const [label, base] of [
  ["ref", ORIGIN],
  ["clone", LOCAL],
]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await open(page, base + "/", { settle: false });
  const out = await page.evaluate(MATCH, {
    triggerSelector: `[${triggerAttr}]`,
    targetSelector: `[${targetAttr}]`,
    triggerAttr,
    targetAttr,
  });
  console.log(`=== ${label} ===`);
  console.log(`  trigger ${out.triggerSelector} matches: ${out.triggerMatches}`);
  console.log(`    values present: ${out.triggerAttrValues.join(", ") || "(none)"}`);
  console.log(`  target  ${out.targetSelector} matches: ${out.targetMatches}`);
  console.log(`    values present: ${out.targetAttrValues.join(", ") || "(none)"}`);
  console.log(`  targets inside a trigger element: ${out.targetsWithinTriggers}`);
  if (out.sampleTargetParentChain) {
    console.log("  first target's ancestor chain:");
    for (const link of out.sampleTargetParentChain) console.log(`    ${link}`);
  }
  await context.close();
}
await browser.close();