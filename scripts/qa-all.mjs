// Batch QA: compare every cloned route against the reference at each viewport
// in one pass — structural outline, per-element boxes, scripted behaviour and
// console errors — and write a machine-readable report.
//
// Usage:
//   node scripts/qa-all.mjs                      # every route, 3 viewports
//   node scripts/qa-all.mjs --routes=/about,/blogs --widths=1440
//   node scripts/qa-all.mjs --skip=/             # behaviour only is not a mode
import fs from "node:fs";
import {
  launch,
  open,
  ORIGIN,
  LOCAL,
  parseArgs,
} from "./lib/qa.mjs";
import {
  BOXES,
  OUTLINE,
  compareBoxes,
  runBehaviourChecks,
  equal,
  INFORMATIONAL_CHECKS,
} from "./lib/behaviour.mjs";

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

const args = parseArgs();
const routes = JSON.parse(
  fs.readFileSync("docs/research/relab-0c02b053/routes.json", "utf8")
).routes;

const selectedRoutes = typeof args.routes === "string"
  ? args.routes.split(",").map((r) => r.trim())
  : routes
      .map((r) => r.route)
      .filter((r) => r !== "/");

const selectedViewports =
  typeof args.widths === "string"
    ? args.widths
        .split(",")
        .map((w) => Number(w.trim()))
        .map((width) => VIEWPORTS.find((v) => v.width === width) ?? { width, height: 900 })
    : VIEWPORTS;

const skipBehaviour = args["skip-behaviour"] === true;

const browser = await launch();
const report = { generatedAt: new Date().toISOString(), entries: [] };
let failures = 0;

async function checkRoute(route, viewport) {
  const pages = {};
  for (const [label, base] of [
    ["ref", ORIGIN],
    ["clone", LOCAL],
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    // An uncaught exception means the runtime broke. A "Failed to load
    // resource" console message is network noise: the reference logs one of its
    // own for the Webflow form endpoint (409), and `/404` legitimately responds
    // with HTTP 404, which the browser logs the same way.
    const pageErrors = [];
    const resourceErrors = [];
    page.on("pageerror", (error) => pageErrors.push(String(error).slice(0, 200)));
    page.on("response", (response) => {
      if (response.status() >= 400) {
        resourceErrors.push(
          `${response.status()} ${response.url().replace(/^https?:\/\//, "").slice(0, 120)}`
        );
      }
    });
    await open(page, base + route);
    pages[label] = { page, context, pageErrors, resourceErrors };
  }

  const outline = {};
  const boxes = {};
  const heights = {};
  for (const label of ["ref", "clone"]) {
    outline[label] = await pages[label].page.evaluate(OUTLINE);
    boxes[label] = await pages[label].page.evaluate(BOXES);
    heights[label] = await pages[label].page.evaluate(
      () => document.body.scrollHeight
    );
  }

  const refSet = new Set(outline.ref);
  const cloneSet = new Set(outline.clone);
  const onlyRef = outline.ref.filter((p) => !cloneSet.has(p));
  const onlyClone = outline.clone.filter((p) => !refSet.has(p));
  const { mismatches, phase } = compareBoxes(
    boxes.ref,
    boxes.clone,
    args.tolerance
  );

  let behaviour = {};
  if (!skipBehaviour) {
    behaviour.ref = await runBehaviourChecks(pages.ref.page);
    behaviour.clone = await runBehaviourChecks(pages.clone.page);
  }

  const behaviourDiffs = [];
  for (const key of new Set([
    ...Object.keys(behaviour.ref ?? {}),
    ...Object.keys(behaviour.clone ?? {}),
  ])) {
    if (INFORMATIONAL_CHECKS.has(key)) continue;
    if (!equal(behaviour.ref?.[key], behaviour.clone?.[key], key)) {
      behaviourDiffs.push({
        key,
        ref: behaviour.ref?.[key],
        clone: behaviour.clone?.[key],
      });
    }
  }

  const entry = {
    route,
    viewport: `${viewport.width}x${viewport.height}`,
    documentHeight: { ref: heights.ref, clone: heights.clone },
    outline: {
      ref: outline.ref.length,
      clone: outline.clone.length,
      onlyRef: onlyRef.slice(0, 12),
      onlyClone: onlyClone.slice(0, 12),
    },
    boxes: {
      ref: boxes.ref.length,
      clone: boxes.clone.length,
      mismatches: mismatches.length,
      ambientPhase: phase.length,
      samples: mismatches.slice(0, 8),
    },
    behaviourDiffs,
    pageErrors: {
      ref: [...new Set(pages.ref.pageErrors)].slice(0, 6),
      clone: [...new Set(pages.clone.pageErrors)].slice(0, 6),
    },
    resourceErrors: {
      ref: [...new Set(pages.ref.resourceErrors)].slice(0, 6),
      clone: [...new Set(pages.clone.resourceErrors)].slice(0, 6),
    },
  };

  const ok =
    entry.documentHeight.ref === entry.documentHeight.clone &&
    onlyRef.length === 0 &&
    onlyClone.length === 0 &&
    mismatches.length === 0 &&
    behaviourDiffs.length === 0 &&
    entry.pageErrors.clone.length === 0;
  entry.pass = ok;
  if (!ok) failures += 1;

  report.entries.push(entry);

  const flag = ok ? "PASS" : "FAIL";
  console.log(
    `${flag}  ${route.padEnd(52)} ${entry.viewport.padEnd(9)} ` +
      `height ${entry.documentHeight.ref}/${entry.documentHeight.clone} ` +
      `outline ${entry.outline.ref}/${entry.outline.clone} ` +
      `boxDiff ${entry.boxes.mismatches} phase ${entry.boxes.ambientPhase} ` +
      `behaviour ${behaviourDiffs.length}`
  );
  if (!ok) {
    for (const only of onlyRef.slice(0, 6)) console.log(`      only-ref  ${only}`);
    for (const only of onlyClone.slice(0, 6)) console.log(`      only-clone ${only}`);
    for (const m of entry.boxes.samples) {
      if (m.kind === "node") {
        console.log(
          `      #${m.i} node ref<${m.a.tag}.${m.a.cls}> clone<${m.b.tag}.${m.b.cls}>`
        );
      } else {
        console.log(
          `      #${m.i} ${m.a.tag}.${m.a.cls} ref(${m.a.x},${m.a.y},${m.a.w},${m.a.h}) clone(${m.b.x},${m.b.y},${m.b.w},${m.b.h})`
        );
      }
    }
    for (const diff of behaviourDiffs) {
      console.log(`      behaviour ${diff.key}`);
      console.log(`        ref  : ${JSON.stringify(diff.ref)?.slice(0, 400)}`);
      console.log(`        clone: ${JSON.stringify(diff.clone)?.slice(0, 400)}`);
    }
    for (const error of entry.pageErrors.clone) {
      console.log(`      page error: ${error}`);
    }
  }

  await pages.ref.context.close();
  await pages.clone.context.close();
}

for (const route of selectedRoutes) {
  for (const viewport of selectedViewports) {
    try {
      await checkRoute(route, viewport);
    } catch (error) {
      failures += 1;
      report.entries.push({
        route,
        viewport: `${viewport.width}x${viewport.height}`,
        pass: false,
        error: String(error),
      });
      console.log(`ERROR ${route} @ ${viewport.width}: ${error.message}`);
    }
    fs.writeFileSync(
      "docs/research/relab-0c02b053/qa/report.json",
      JSON.stringify(report, null, 2)
    );
  }
}

await browser.close();

console.log(
  `\n${report.entries.length - failures}/${report.entries.length} route-viewport combinations pass`
);
console.log("report: docs/research/relab-0c02b053/qa/report.json");
process.exitCode = failures === 0 ? 0 : 1;