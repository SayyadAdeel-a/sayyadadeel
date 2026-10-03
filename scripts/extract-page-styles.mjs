// Extract each captured page's critical inline stylesheet(s) and analyse which
// IX hook attributes they hide, so the per-page CSS can be emitted safely.
//
// Usage: node scripts/extract-page-styles.mjs
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT, allRoutes, readPage } from "./lib/page-pipeline.mjs";

const hiddenRe =
  /:is\(\s*\[([a-zA-Z0-9_-]+)(?:=[^\]]*)?\]\s*\)|\.([a-zA-Z0-9_-]+)\s+\.(box-[a-z]+)/g;

const report = [];
const hookPresence = new Map(); // hook -> Set(pageKey)
const hookHidden = new Map(); // hook -> Set(pageKey)

for (const route of allRoutes()) {
  const key = route.pageKey;
  const { head, body } = readPage(key);
  const blocks = [];
  for (const m of head.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    blocks.push({ where: "head", css: m[1] });
  }
  for (const m of body.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    blocks.push({ where: "body", css: m[1] });
  }
  const headBlocks = blocks.filter((b) => b.where === "head");
  const bodyBlocks = blocks.filter((b) => b.where === "body");

  // Hook attributes actually present on the page.
  const present = new Set();
  for (const m of body.matchAll(/\s([a-zA-Z0-9_-]+)="(?:ture|true)"/g)) {
    present.add(m[1]);
  }

  const hidden = new Set();
  for (const b of headBlocks) {
    for (const m of b.css.matchAll(
      /html\.w-mod-js:not\(\.w-mod-ix3\)(?:\s*:is\(([^)]*)\)| >?\s*:is\(([^)]*)\))/g
    )) {
      const list = (m[1] ?? m[2] ?? "").trim();
      if (!list) continue;
      for (const part of list.split(",")) {
        const hook = /\[([a-zA-Z0-9_-]+)/.exec(part)?.[1];
        if (hook) hidden.add(hook);
      }
    }
  }

  for (const h of present) {
    if (!hookPresence.has(h)) hookPresence.set(h, new Set());
    hookPresence.get(h).add(key);
  }
  for (const h of hidden) {
    if (!hookHidden.has(h)) hookHidden.set(h, new Set());
    hookHidden.get(h).add(key);
  }

  const css = headBlocks.map((b) => b.css).join("\n");
  const outDir = path.join(ART_ROOT, key);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "critical.css"), css);

  // Sanity: body-level blocks should be the background-video fallback only.
  const bodyCss = bodyBlocks.map((b) => b.css).join("\n").trim();
  if (bodyCss) fs.writeFileSync(path.join(outDir, "body-styles.css"), bodyCss);

  report.push({
    key,
    route: route.route,
    headStyleBytes: css.length,
    bodyStyleBytes: bodyBlocks.length,
    hooksPresent: [...present].sort(),
    hooksHidden: [...hidden].sort(),
    hiddenNotPresent: [...hidden].filter((h) => !present.has(h)),
    presentNotHidden: [...present].filter((h) => !hidden.has(h)),
  });
}

fs.writeFileSync(
  `${ART_ROOT}/critical-style-report.json`,
  JSON.stringify(report, null, 2)
);

console.log("=== per page ===");
for (const r of report) {
  console.log(
    `${r.route.padEnd(56)} head=${String(r.headStyleBytes).padStart(5)} body=${r.bodyStyleBytes} present=${r.hooksPresent.length} hidden=${r.hooksHidden.length}`
  );
  if (r.hiddenNotPresent.length)
    console.log(`    hidden-but-absent: ${r.hiddenNotPresent.join(", ")}`);
  if (r.presentNotHidden.length)
    console.log(`    present-not-hidden: ${r.presentNotHidden.join(", ")}`);
}

console.log("\n=== hook conflicts (present on one page, hidden on another) ===");
let conflicts = 0;
for (const [hook, hiddenOn] of hookHidden) {
  const presentOn = hookPresence.get(hook);
  if (!presentOn) continue;
  for (const key of presentOn) {
    if (!hiddenOn.has(key)) {
      conflicts += 1;
      console.log(`  ${hook}: present on ${key} but only hidden on other pages`);
    }
  }
}
console.log(`conflicts: ${conflicts}`);

console.log("\n=== distinct body-level style blocks ===");
const bodySet = new Map();
for (const r of report) {
  const f = `${ART_ROOT}/${r.key}/body-styles.css`;
  if (!fs.existsSync(f)) continue;
  const css = fs.readFileSync(f, "utf8").replace(/\s+/g, " ").trim();
  bodySet.set(css, (bodySet.get(css) ?? 0) + 1);
}
for (const [css, n] of bodySet) {
  console.log(`  used by ${n} page(s): ${css.slice(0, 160)}`);
}