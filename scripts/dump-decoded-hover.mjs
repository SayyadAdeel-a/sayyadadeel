// Print the hover interactions as they appear in a page's *decoded* `ix.json`
// — the payload the runtime actually receives — alongside the source payload.
//
// Why: on `.button`, the source payload has two `wf:transform` actions that both
// target `.button-normal-text` (`y: 0% -> -100%` and `y: 100% -> 0%`). The
// reference renders the second one — the chars roll up from below. The clone
// behaves as though only the first was built, so either the decoder dropped an
// action or the two collide at runtime. Comparing the decoded payload with the
// source says which, without a browser.
//
// Usage: node scripts/dump-decoded-hover.mjs <page-dir-or-key>
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT, allRoutes } from "./lib/page-pipeline.mjs";

const wanted = process.argv[2] ?? "root-8a5edab2";

/** Find the generated ix.json for a page key. */
function generatedPath(pageKey) {
  const roots = [
    "src/components/sites/relab-0c02b053",
    "src/components/sites",
  ];
  for (const root of roots) {
    const direct = path.join(root, pageKey, "ix.json");
    if (fs.existsSync(direct)) return direct;
    if (!fs.existsSync(root)) continue;
    for (const dir of fs.readdirSync(root)) {
      const candidate = path.join(root, dir, "ix.json");
      if (fs.existsSync(candidate)) {
        const payload = JSON.parse(fs.readFileSync(candidate, "utf8"));
        if (payload?.pageKey === pageKey) return candidate;
      }
    }
  }
  return null;
}

const entry = allRoutes().find((r) => r.pageKey === wanted);
if (!entry) {
  console.error(`no route with pageKey ${wanted}`);
  process.exit(1);
}

const source = JSON.parse(
  fs.readFileSync(path.join(ART_ROOT, entry.pageKey, "webflow-ix2.json"), "utf8")
);
const decodedPath = generatedPath(entry.pageKey);
if (!decodedPath) {
  console.error(`no generated ix.json for ${wanted}`);
  process.exit(1);
}
const decoded = JSON.parse(fs.readFileSync(decodedPath, "utf8"));

console.log(`route ${entry.route}  pageKey ${entry.pageKey}`);
console.log(`source : ${ART_ROOT}/${entry.pageKey}/webflow-ix2.json`);
console.log(`decoded: ${decodedPath}`);
console.log(
  `interactions: source ${source.interactions?.length ?? 0}, decoded ${
    decoded.interactions?.length ?? 0
  }`
);

const isHover = (i) => (i.triggers ?? []).some(([n]) => n === "wf:hover");

console.log(`\n=== source hover interactions ===`);
for (const i of source.interactions ?? []) {
  if (!isHover(i)) continue;
  const tl = (source.timelines ?? []).find((t) => i.timelineIds?.includes(t.id));
  console.log(`${i.id}: ${tl?.actions?.length ?? 0} action(s)`);
  for (const a of tl?.actions ?? []) {
    const target = a.targets?.[0];
    console.log(
      `    tt=${a.tt} target=${JSON.stringify(target?.[1])} ` +
        `rel=${target?.[2]?.relationship} split=${JSON.stringify(a.splitText ?? null)} ` +
        `props=${JSON.stringify(a.properties?.["wf:transform"])}`
    );
  }
}

console.log(`\n=== decoded hover interactions ===`);
const decodedTimelines = new Map(
  (decoded.timelines ?? []).map((t) => [t.id, t])
);
for (const i of decoded.interactions ?? []) {
  if (!isHover(i)) continue;
  console.log(`${i.id}: controls=${JSON.stringify((i.triggers ?? []).map((t) => t[1]?.control ?? "play"))}`);
  for (const id of i.timelineIds ?? []) {
    const tl = decodedTimelines.get(id);
    console.log(`  timeline ${id}: ${tl?.actions?.length ?? 0} action(s)`);
    for (const a of tl?.actions ?? []) {
      console.log(
        `    tt=${a.tt} target=${JSON.stringify(a.targets?.[0])} ` +
          `split=${JSON.stringify(a.splitText ?? null)} ` +
          `props=${JSON.stringify(a.props ?? a.properties?.["wf:transform"])}`
      );
    }
  }
}