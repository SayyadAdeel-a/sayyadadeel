// Report the FAQ / accordion markup on a page, and whether the QA harness's
// selectors actually match it.
//
// Usage: node scripts/probe-faq.mjs <page-key>
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT, readPage } from "./lib/page-pipeline.mjs";

const key = process.argv[2] ?? "services-3b1aeccb";
const { body } = readPage(key);

const groups = new Map();
for (const m of body.matchAll(/class="([^"]*(?:faq|accordion)[^"]*)"/gi)) {
  for (const c of m[1].split(/\s+/)) {
    if (!/faq|accordion/i.test(c)) continue;
    groups.set(c, (groups.get(c) ?? 0) + 1);
  }
}
console.log(`${key} — faq/accordion classes:`);
for (const [cls, count] of [...groups].sort()) {
  console.log(`  ${String(count).padStart(3)}x  ${cls}`);
}

console.log("\nQA harness selectors:");
for (const selector of [
  ".faq-toggle",
  "[accordion-item-title]",
  ".faq-item .faq-toggle-content",
  ".faq-item .faq-item-icon",
  "[accordion-item-body-wrapper]",
  ".accordion-item-title-icon",
]) {
  const escaped = selector.replace(/[[\]"']/g, "\\$&");
  const count = (body.match(new RegExp(escaped.replace(/\./g, "\\."), "g")) ?? [])
    .length;
  console.log(`  ${String(count).padStart(3)}x  ${selector}`);
}

// Show one FAQ item's markup so the structure is unambiguous.
const start = body.search(/class="[^"]*faq-section/);
if (start >= 0) {
  const section = body.slice(start, start + 2600);
  console.log("\nfirst 2.6 kB of the FAQ section:");
  console.log(section.replace(/></g, ">\n<"));
}

const ix = JSON.parse(
  fs.readFileSync(path.join(ART_ROOT, key, "webflow-ix2.json"), "utf8")
);
console.log("\nfaq/accordion interactions:");
for (const interaction of ix.interactions) {
  const json = JSON.stringify(interaction);
  if (!/faq|accordion/.test(json)) continue;
  console.log(`  ${interaction.id}: ${JSON.stringify(interaction.triggers?.[0]?.[2])}`);
}