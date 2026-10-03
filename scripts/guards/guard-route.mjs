// Wrap the per-route-viewport body of an audit so an unreachable reference is
// recorded as skipped instead of aborting the sweep.
//
// Why: `open()` now retries a failing `page.goto` six times with escalating
// backoff, but DNS at the reference can stay down for longer than that. When it
// does, the audit threw out of the route loop and every result measured so far
// was lost — a 50-route sweep reduced to nothing by a network problem that has
// nothing to do with the clone.
//
// Usage: node scripts/guards/guard-route.mjs <audit-script.mjs>
// Patches the file in place: the `for (const width of WIDTHS) {` body is
// wrapped in a try/catch that writes a skipped entry and continues.
import fs from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/guards/guard-route.mjs <audit-script.mjs>");
  process.exit(1);
}

let text = fs.readFileSync(file, "utf8");
if (text.includes("SKIPPED: reference unreachable")) {
  console.log(`${file} already guarded`);
  process.exit(0);
}

const anchor = "  for (const width of WIDTHS) {";
const index = text.indexOf(anchor);
if (index === -1) {
  console.error(`${file}: could not find the width loop to guard`);
  process.exit(1);
}

const bodyStart = index + anchor.length;
const indent = "    ";

// Find the matching close brace of the width loop.
let depth = 1;
let i = bodyStart;
while (i < text.length && depth > 0) {
  const ch = text[i];
  if (ch === "{") depth += 1;
  else if (ch === "}") depth -= 1;
  i += 1;
}
const bodyEnd = i - 1; // index of the loop's closing brace
const body = text.slice(bodyStart, bodyEnd);

const guarded =
  "\n" +
  indent +
  "// A route the reference cannot be reached for is recorded and skipped, so a\n" +
  indent +
  "// network outage does not discard every result measured so far.\n" +
  indent +
  "try {\n" +
  body.replace(/\n/g, "\n" + indent) +
  "\n" +
  indent +
  "} catch (error) {\n" +
  indent +
  '  mergeReport(REPORT, {\n' +
  indent +
  "    route,\n" +
  indent +
  '    viewport: `${width}`,\n' +
  indent +
  '    skipped: `SKIPPED: reference unreachable — ${String(\n' +
  indent +
  "      error.message\n" +
  indent +
  "    ).split('\\n')[0]}`,\n" +
  indent +
  "    findings: [],\n" +
  indent +
  "  });\n" +
  indent +
  `  console.log(\`skip    \${route.padEnd(50)} \${String(width).padEnd(5)} reference unreachable\`);\n` +
  indent +
  "}\n";

text = text.slice(0, bodyStart) + guarded + text.slice(bodyEnd);
fs.writeFileSync(file, text);
console.log(`guarded ${file}`);