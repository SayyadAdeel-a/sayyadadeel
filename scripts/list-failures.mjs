// List the failing entries in an audit/QA report, defensively.
//
// The reports have slightly different shapes (`qa-all` nests height and outline,
// the audits do not), and one malformed entry should not stop the listing.
//
// Usage: node scripts/list-failures.mjs [report.json]
import fs from "node:fs";

const file =
  process.argv[2] ?? "docs/research/relab-0c02b053/qa/report.json";
const report = JSON.parse(fs.readFileSync(file, "utf8"));
const entries = report.entries ?? [];

const failing = entries.filter((e) => e.pass === false || e.status === "FAIL");
console.log(`${file}: ${failing.length} failing of ${entries.length}\n`);

for (const entry of failing) {
  const height = entry.documentHeight ?? {};
  const outline = entry.outline ?? {};
  const boxes = entry.boxes ?? {};
  console.log(
    `${entry.route}  ${entry.viewport}\n` +
      `   height      ${height.ref ?? "?"} / ${height.clone ?? "?"}\n` +
      `   outline     ${outline.ref ?? "?"} / ${outline.clone ?? "?"}` +
      `   (only ref ${(outline.onlyRef ?? []).length}, only clone ${
        (outline.onlyClone ?? []).length
      })\n` +
      `   box diff    ${boxes.mismatches ?? "?"}\n` +
      `   behaviour   ${(entry.behaviourDiffs ?? []).length} diff(s)\n` +
      `   page errors ${(entry.pageErrors ?? []).length}`
  );
  for (const diff of (outline.onlyRef ?? []).slice(0, 6)) {
    console.log(`     only in reference: ${diff}`);
  }
  for (const diff of (outline.onlyClone ?? []).slice(0, 6)) {
    console.log(`     only in clone:     ${diff}`);
  }
  for (const diff of (entry.behaviourDiffs ?? []).slice(0, 6)) {
    console.log(`     behaviour: ${JSON.stringify(diff)}`);
  }
  console.log("");
}