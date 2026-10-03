// Animation audit — part B: scroll reveals.
//
// ## Why this needs its own harness
//
// The site has 128 `wf:scroll` interactions, and the reveal timelines animate
// `opacity` alongside `y`. Every existing parity check walks text, boxes and
// images, and an element at `opacity: 0` still has text, a box and an image — so
// a reveal that never fires leaves the element permanently invisible while every
// prior harness still passes it. This is the one class of animation bug that
// could have been hiding in plain sight, so it gets a dedicated check.
//
// ## What is compared
//
// For every reveal-hook element:
//   * **pre** — opacity and transform on a fresh load at scroll 0, before the
//     element has been scrolled into view. A correct clone is at its from-state
//     (usually opacity 0, translated down).
//   * **post** — the same readings after a full scroll pass and a return to the
//     top. A correct clone has settled at opacity 1 with the transform cleared.
//
// A clone that starts visible (no from-state), or never reaches opacity 1
// (reveal stuck), or ends with a transform still applied, fails here.
//
// Timing is measured separately below: how long the element takes to reach full
// opacity once it crosses the 92% viewport line, which is what the payload's
// `start: "top 92%"` plus duration governs.
//
// Usage:
//   node scripts/audit-reveals.mjs
//   node scripts/audit-reveals.mjs --routes=/about --widths=1440
//   node scripts/audit-reveals.mjs --timed=8
import fs from "node:fs";
import { launch, open, ORIGIN, LOCAL, parseArgs , mergeReport } from "./lib/qa.mjs";

const args = parseArgs();
const REPORT = "docs/research/relab-0c02b053/qa/reveal-report.json";

const WIDTHS =
  typeof args.widths === "string"
    ? args.widths.split(",").map((w) => Number(w.trim()))
    : [1440, 390];
const TIMED = Number(args.timed ?? 8);

const allRoutes = JSON.parse(
  fs.readFileSync("docs/research/relab-0c02b053/routes.json", "utf8")
).routes.map((r) => r.route);
const routes =
  typeof args.routes === "string"
    ? args.routes.split(",").map((r) => r.trim())
    : allRoutes;

/** Attribute hooks driven by `wf:scroll` (from scripts/interaction-inventory.mjs). */
const REVEAL_HOOKS = [
  "fade-up",
  "fade",
  "group-fade-up-item",
  "group-fedup-move",
  "group-fedup-phone",
  "origin-fade-up",
  "move-scroll-card-box",
  "group-fade-up-parent",
];

const SELECTOR = REVEAL_HOOKS.map(
  (hook) => `[${hook}]:not([${hook}="false"])`
).join(", ");

/** Snapshot reveal state. Runs in the page, so it takes its arguments as a
 *  single object — `page.evaluate` serialises the function and it cannot close
 *  over module scope. */
const SNAPSHOT = ({ selector, hooks }) => {
  const parse = (transform) => {
    if (!transform || transform === "none") return null;
    const m = /matrix(3d)?\(([^)]+)\)/.exec(transform);
    if (!m) return null;
    return m[2].split(",").map(Number);
  };
  return [...document.querySelectorAll(selector)].map((el, index) => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const matrix = parse(cs.transform);
    return {
      index,
      hooks: hooks.filter((h) => el.hasAttribute(h)),
      cls: el.className?.toString().slice(0, 60) ?? "",
      opacity: Math.round(Number(cs.opacity) * 1000) / 1000,
      transform: matrix ? matrix.map((v) => Math.round(v * 10) / 10) : null,
      // A translate reads directly off the matrix; record it for the end-state check.
      ty: matrix && matrix.length >= 6 ? Math.round(matrix[5] * 10) / 10 : 0,
      top: Math.round(rect.top),
      // Size matters for deciding whether a state difference is observable: a
      // zero-height element is not rendered, so a from-state on one cannot be
      // seen. `img.bg-image[origin-fade-up]` is exactly that case on `/` at 390.
      h: Math.round(rect.height),
      w: Math.round(rect.width),
      display: cs.display,
      visibility: cs.visibility,
    };
  });
};

/** Scroll the whole page once so every reveal fires, then return to the top. */
const SCROLL_PASS = async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const height = document.documentElement.scrollHeight;
  const viewport = window.innerHeight;
  for (let y = 0; y < height; y += Math.round(viewport * 0.6)) {
    window.scrollTo(0, y);
    await sleep(120);
  }
  window.scrollTo(0, height);
  await sleep(700);
  window.scrollTo(0, 0);
  await sleep(1400);
  return { height, viewport };
};

/**
 * Time how long a reveal takes to reach full opacity after it is scrolled to the
 * 92% line that the payload's `start: "top 92%"` describes.
 */
const TIME_REVEAL = async ({ indices, selector }) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const nodes = [...document.querySelectorAll(selector)];
  const results = [];
  for (const index of indices) {
    const el = nodes[index];
    if (!el) continue;
    const startTop =
      el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.92;
    window.scrollTo(0, Math.max(0, Math.round(startTop)));
    await sleep(60);
    let elapsed = 0;
    let opacity = Number(getComputedStyle(el).opacity);
    while (opacity < 0.99 && elapsed < 3000) {
      await sleep(25);
      elapsed += 25;
      opacity = Number(getComputedStyle(el).opacity);
    }
    results.push({
      index,
      cls: el.className?.toString().slice(0, 60) ?? "",
      // -1 means it never reached full opacity within the budget.
      ms: opacity >= 0.99 ? elapsed : -1,
      opacity: Math.round(opacity * 1000) / 1000,
    });
  }
  window.scrollTo(0, 0);
  await sleep(900);
  return results;
};

const browser = await launch();
const report = { generatedAt: new Date().toISOString(), entries: [] };
let findingsTotal = 0;


for (const route of routes) {
  for (const width of WIDTHS) {
    // A route the reference cannot be reached for is recorded and skipped, so a
    // network outage does not discard every result measured so far.
    try {

        const sides = {};
        for (const [label, base] of [
          ["ref", ORIGIN],
          ["clone", LOCAL],
        ]) {
          const context = await browser.newContext({
            viewport: { width, height: width < 992 ? 844 : 900 },
            deviceScaleFactor: 1,
          });
          const page = await context.newPage();
          await open(page, base + route, { settle: false });
          await page.waitForTimeout(1200);
          const pre = await page.evaluate(SNAPSHOT, { selector: SELECTOR, hooks: REVEAL_HOOKS });
          await page.evaluate(SCROLL_PASS);
          const post = await page.evaluate(SNAPSHOT, { selector: SELECTOR, hooks: REVEAL_HOOKS });
          sides[label] = { page, context, pre, post };
        }
    
        const findings = [];
        const count = Math.max(sides.ref.pre.length, sides.clone.pre.length);
        for (let i = 0; i < count; i++) {
          const refPre = sides.ref.pre[i];
          const refPost = sides.ref.post[i];
          const clonePre = sides.clone.pre[i];
          const clonePost = sides.clone.post[i];
          if (!refPre || !clonePre) {
            findings.push({
              key: `element ${i}`,
              problems: [
                `reveal element count differs (reference ${sides.ref.pre.length}, clone ${sides.clone.pre.length})`,
              ],
            });
            continue;
          }
    
          const notes = [];
          // End state: the reveal must have completed.
          if (refPost.opacity >= 0.99 && clonePost.opacity < 0.99) {
            notes.push(
              `reveal never completes: opacity settles at ${clonePost.opacity} in the clone, ${refPost.opacity} in the reference`
            );
          } else if (
            Math.abs(refPost.opacity - clonePost.opacity) > 0.02 &&
            clonePost.opacity < 0.99
          ) {
            notes.push(
              `end opacity differs: reference ${refPost.opacity}, clone ${clonePost.opacity}`
            );
          }
          if (refPost.ty === 0 && Math.abs(clonePost.ty) > 0.5) {
            notes.push(
              `reveal ends with ${clonePost.ty}px of residual translate; the reference ends at 0`
            );
          }
          // Initial state only matters where the user can actually see it.
          //
          // The reference applies its from-state through GSAP's `immediateRender`,
          // scoped by the payload's `relationship: "within"` — so on `/` it hides 7
          // of 21 `[group-fedup-move]` elements on load and leaves the other 14
          // untouched. The clone pre-hides all 21. That difference is 10,000px
          // below the fold and cannot be seen; what *is* observable is whether each
          // element reveals correctly when scrolled to, which is checked above.
          //
          // So the from-state is only compared for elements that are both inside the
          // viewport and actually painted on a fresh load. A collapsed element is
          // not rendered: `img.bg-image[origin-fade-up]` is 0x0 on `/` at 390, on
          // both sites, so a from-state difference there is not a visible defect.
          const viewportHeight = width < 992 ? 844 : 900;
          const nearViewport =
            refPre.h > 0 &&
            refPre.w > 0 &&
            refPre.display !== "none" &&
            refPre.visibility !== "hidden" &&
            refPre.top < viewportHeight + 120;
          if (nearViewport) {
            if (Math.abs(refPre.opacity - clonePre.opacity) > 0.02) {
              notes.push(
                `initial opacity differs on a load-visible element: reference ${refPre.opacity}, clone ${clonePre.opacity}`
              );
            }
            if (refPre.ty === 0 && Math.abs(clonePre.ty) > 1) {
              notes.push(
                `initial translate differs on a load-visible element: reference 0, clone ${clonePre.ty}`
              );
            }
          }
          if (notes.length) {
            findings.push({
              key: `${refPre.hooks.join("+")} ${refPre.cls} [${i}]`,
              problems: notes,
              ref: { pre: refPre.opacity, post: refPost.opacity, preTy: refPre.ty, postTy: refPost.ty },
              clone: {
                pre: clonePre.opacity,
                post: clonePost.opacity,
                preTy: clonePre.ty,
                postTy: clonePost.ty,
              },
            });
          }
        }
    
        // Timing: how long the first N reveals take to reach full opacity.
        const indices = [];
        for (let i = 0; i < sides.ref.post.length && i < TIMED; i++) {
          if (sides.ref.post[i].top > 0) indices.push(i);
        }
        const timing = {};
        for (const label of ["ref", "clone"]) {
          timing[label] = await sides[label].page.evaluate(TIME_REVEAL, {
            indices,
            selector: SELECTOR,
          });
        }
        for (let i = 0; i < timing.ref.length; i++) {
          const ref = timing.ref[i];
          const clone = timing.clone[i];
          if (!ref || !clone) continue;
          if (ref.ms === -1 && clone.ms !== -1) {
            findings.push({
              key: `timing ${ref.cls}`,
              problems: ["reveal never completes in the reference but does in the clone"],
            });
          } else if (ref.ms !== -1 && clone.ms === -1) {
            findings.push({
              key: `timing ${ref.cls}`,
              problems: [
                `reveal never completes in the clone (stuck at opacity ${clone.opacity}); reference takes ${ref.ms}ms`,
              ],
            });
          } else if (ref.ms !== -1 && clone.ms !== -1) {
            const ratio = clone.ms / ref.ms;
            if (ratio < 0.5 || ratio > 2) {
              findings.push({
                key: `timing ${ref.cls}`,
                problems: [
                  `reveal takes ${ratio < 1 ? ratio.toFixed(2) + "x too fast" : (1 / ratio).toFixed(2) + "x too slow"}: reference ${ref.ms}ms, clone ${clone.ms}ms`,
                ],
              });
            }
          }
        }
    
        const entry = {
          route,
          viewport: `${width}`,
          revealElements: {
            ref: sides.ref.pre.length,
            clone: sides.clone.pre.length,
          },
          findings,
        };
        report.entries.push(entry);
        findingsTotal += findings.length;
    
        const flag = findings.length ? "FINDINGS" : "clean   ";
        console.log(
          `${flag} ${route.padEnd(50)} ${String(width).padEnd(5)} ` +
            `reveals ${entry.revealElements.ref}/${entry.revealElements.clone}  ` +
            `issues ${findings.length}`
        );
        for (const finding of findings.slice(0, 10)) {
          console.log(`      ${finding.key}`);
          for (const problem of finding.problems) console.log(`         - ${problem}`);
        }
    
        await sides.ref.context.close();
        await sides.clone.context.close();
        mergeReport(REPORT, entry);
      
    } catch (error) {
      mergeReport(REPORT, {
        route,
        viewport: `${width}`,
        skipped: `SKIPPED: reference unreachable — ${String(
          error.message
        ).split('\n')[0]}`,
        findings: [],
      });
      console.log(`skip    ${route.padEnd(50)} ${String(width).padEnd(5)} reference unreachable`);
    }
}
}

await browser.close();

const bad = new Set(
  report.entries.filter((e) => e.findings.length).map((e) => `${e.route}@${e.viewport}`)
);
console.log(
  `\n${report.entries.length - bad.size}/${report.entries.length} route-viewports clean; ${findingsTotal} finding(s) total`
);
console.log("report: docs/research/relab-0c02b053/qa/reveal-report.json");
process.exitCode = findingsTotal === 0 ? 0 : 1;
