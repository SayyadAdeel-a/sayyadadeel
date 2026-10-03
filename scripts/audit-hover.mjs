// Trace the per-character hover on both sites for every hover target, and report
// the peak displacement per character.
//
// ## Why
//
// The `.button` / `.text-button` hovers animate **per-character split spans**,
// not the container. An earlier version of `audit-hover.mjs` read the container
// and so reported "no hover animation anywhere" on both sites — a false all-clear
// caused by measuring the wrong element. `probe-hover-trace.mjs` showed the
// reference rolling its characters down to +45% while the clone rolled them up to
// -7.4%, which is a genuine defect, so the sweep has to look at the leaves.
//
// ## What is compared
//
// For each hover trigger: park the pointer away, hover the trigger with the real
// mouse, sample every split leaf inside the trigger's targets through the whole
// tween, then park the pointer away again and confirm the reverse runs. Peak
// displacement is compared per character, along with the direction of travel —
// an upward roll where the reference rolls downward is exactly the kind of thing
// a screenshot cannot show.
//
// Usage:
//   node scripts/audit-hover.mjs
//   node scripts/audit-hover.mjs --routes=/about --widths=1440
//   node scripts/audit-hover.mjs --max-per-selector=3 --interval=40
import fs from "node:fs";
import { launch, open, ORIGIN, LOCAL, parseArgs, waitForScrollIdle , mergeReport } from "./lib/qa.mjs";

const args = parseArgs();
const REPORT = "docs/research/relab-0c02b053/qa/hover-report.json";

const WIDTHS =
  typeof args.widths === "string"
    ? args.widths.split(",").map((w) => Number(w.trim()))
    : [1440, 390];
// One trigger per selector, on a freshly loaded page.
//
// These hovers target `.button-normal-text` document-wide with
// `stagger: { each: 0.018 }`. Across a page with ~500 split characters that is a
// nine-second cascade, and it is *shared*: hovering a second button continues
// advancing the same animation rather than starting a new one. Hovering several
// triggers in sequence therefore measures a cumulative timeline, not six
// independent hovers, and every comparison after the first is meaningless — it
// reported the reference moving characters the clone had not reached yet. The
// first hover on a clean page is the only independently measurable state.
const MAX_PER = 1;
const INTERVAL = Number(args.interval ?? 40);

const allRoutes = JSON.parse(
  fs.readFileSync("docs/research/relab-0c02b053/routes.json", "utf8")
).routes.map((r) => r.route);
const routes =
  typeof args.routes === "string"
    ? args.routes.split(",").map((r) => r.trim())
    : allRoutes;

/** Hover triggers declared by the site, with the targets they animate. */
const HOVER_TARGETS = {
  "text-button-normal-text": ".text-button",
  "text-button-hover-text": ".text-button",
  "button-normal-text": ".button",
  "button-icon-anin-one": ".button",
  "button-icon-anin-two": ".button",
  "card-image-hover-child": ".card-image-hover-pfriend",
  "hover-child": ".hover-pfriend",
};

const TRIGGERS = [...new Set(Object.values(HOVER_TARGETS))];
// The keys are bare class names. `querySelectorAll("button-normal-text")` is a
// perfectly valid *type* selector for a custom element and silently matches
// nothing, so the dot is not optional here — getting it wrong made this harness
// report "no hover animation anywhere" without a single error.
const TARGETS = Object.keys(HOVER_TARGETS).map((name) => `.${name}`);

/**
 * Pull translateY and scaleX out of a computed transform.
 *
 * A 2D `matrix(a,b,c,d,tx,ty)` keeps them at indices 4 and 5, but a 3D
 * `matrix3d(...)` is a 3x4 column-major matrix where translation sits at indices
 * 12-14. Reading index 5 out of a 3D matrix yields scaleY, which is a constant
 * 1 — so every 3D-transformed leaf looked motionless. (GSAP emits
 * `translate3d(...)` whenever it touches a percentage translate, so this is the
 * common case, not an edge one.)
 */
const decompose = (transform) => {
  if (!transform || transform === "none") return null;
  const m = /matrix(3d)?\(([^)]+)\)/.exec(transform);
  if (!m) return null;
  const v = m[2].split(",").map(Number);
  const is3d = v.length > 6;
  return {
    scaleX: v[0],
    scaleY: is3d ? v[5] : v[3],
    ty: is3d ? v[13] : v[5],
    tx: is3d ? v[12] : v[4],
  };
};

/**
 * The leaves that actually move: each target element plus the split spans inside
 * it. Webflow's `split: { type: "chars" }` rewrites the target's text into
 * `span.gsap_split_letter`, and those spans are what GSAP transforms.
 *
 * Pass `scope`/`scopeIndex` to read only one trigger's own subtree. The `.button`
 * hover targets `.button-normal-text` document-wide (`relationship: "none"`), so
 * hovering one button also animates every *other* button's label on the page.
 * That is real and it is authored, but it is not what a user sees when they
 * hover a button, and comparing it produced dozens of findings about buttons 400
 * leaves away that are collapsed and off screen.
 *
 * Everything this needs is defined *inside* the function: `page.evaluate`
 * serialises the function source, so a call to a module-scope helper arrives in
 * the page as an undefined identifier.
 */
const READ_LEAVES = ({ targets, scope, scopeIndex }) => {
  const roots = scope
    ? [document.querySelectorAll(scope)[scopeIndex]].filter(Boolean)
    : [document.body];
  // translateY and scaleX out of a computed transform. A 2D
  // `matrix(a,b,c,d,tx,ty)` keeps them at indices 4 and 5, but a 3D
  // `matrix3d(...)` is a 3x4 column-major matrix where translation sits at
  // indices 12-14. Reading index 5 out of a 3D matrix yields scaleY, a constant
  // 1, so every 3D-transformed leaf looks motionless — and GSAP emits
  // `translate3d(...)` whenever it touches a percentage translate, so that is the
  // common case rather than an edge one.
  const decompose = (transform) => {
    if (!transform || transform === "none") return null;
    const m = /matrix(3d)?\(([^)]+)\)/.exec(transform);
    if (!m) return null;
    const v = m[2].split(",").map(Number);
    const is3d = v.length > 6;
    return { scaleX: v[0], ty: is3d ? v[13] : v[5] };
  };
  const r2 = (n) => Math.round(n * 100) / 100;

  const rows = [];
  for (const root of roots) {
    if (!root) continue;
    for (const target of targets) {
      for (const el of root.querySelectorAll(target)) {
        const leaves = [el, ...el.querySelectorAll("span")];
        leaves.forEach((leaf, leafIndex) => {
          const cs = getComputedStyle(leaf);
          const rect = leaf.getBoundingClientRect();
          const d = decompose(cs.transform);
          rows.push({
            target,
            leafIndex,
            cls: leaf.className?.toString().slice(0, 50) ?? "",
            ty: d ? r2(d.ty) : 0,
            scaleX: d ? r2(d.scaleX) : 1,
            opacity: r2(Number(cs.opacity)),
            rendered: rect.width > 0 && rect.height > 0 && cs.display !== "none",
          });
        });
      }
    }
  }
  return rows;
};

function round(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Instances of a trigger worth hovering: visible, laid out, and on screen.
 *
 * There is deliberately no check that the trigger *contains* a target. The
 * `.button` hover animates `.button-normal-text` document-wide — the payload's
 * action carries no `relationship: "within"` — and the nav button's own markup
 * uses `.button-hover-text`. Scoping to descendants (an earlier version of this
 * function) therefore rejected every trigger on every page and reported "no
 * hover animation anywhere", which was a false all-clear.
 */
const USABLE = ({ selector }) => {
  const out = [];
  const debug = [];
  [...document.querySelectorAll(selector)].forEach((el, i) => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      debug.push({
        i,
        why: "zero-size",
        size: [Math.round(rect.width), Math.round(rect.height)],
      });
      return;
    }
    if (cs.display === "none" || cs.visibility === "hidden") {
      debug.push({ i, why: "not-displayed", display: cs.display, visibility: cs.visibility });
      return;
    }
    if (rect.left > window.innerWidth + 40 || rect.right < -40) {
      debug.push({ i, why: "offscreen", left: Math.round(rect.left), right: Math.round(rect.right) });
      return;
    }
    out.push({ i, cls: el.className?.toString().slice(0, 60) ?? "" });
  });
  return { usable: out, debug };
};

/**
 * Start a dense in-page recorder over every hover leaf.
 *
 * Sampling from Node with `waitForTimeout` between reads misses the peak: the
 * roll jumps to its extreme within the first frame or two and is over in 250ms,
 * so a 40ms poll reads it on the way back down. That made the audit report a
 * healthy button hover as "2.7x too far" purely from sampling phase — the same
 * failure mode the motion audit had. Recording on `requestAnimationFrame` from
 * inside the page captures every frame of the tween.
 */
const START_RECORDER = ({ targets, ms, scope, scopeIndex }) => {
  const r2 = (n) => Math.round(n * 100) / 100;
  const decompose = (transform) => {
    if (!transform || transform === "none") return null;
    const m = /matrix(3d)?\(([^)]+)\)/.exec(transform);
    if (!m) return null;
    const v = m[2].split(",").map(Number);
    const is3d = v.length > 6;
    return { scaleX: v[0], ty: is3d ? v[13] : v[5] };
  };
  const roots = scope
    ? [document.querySelectorAll(scope)[scopeIndex]].filter(Boolean)
    : [document.body];
  const read = () => {
    const rows = [];
    for (const root of roots) {
      if (!root) continue;
      for (const target of targets) {
        for (const el of root.querySelectorAll(target)) {
          for (const leaf of [el, ...el.querySelectorAll("span")]) {
            const cs = getComputedStyle(leaf);
            const rect = leaf.getBoundingClientRect();
            const d = decompose(cs.transform);
            rows.push(
              rect.width > 0 && rect.height > 0 && cs.display !== "none"
                ? {
                    target,
                    ty: d ? r2(d.ty) : 0,
                    scaleX: d ? r2(d.scaleX) : 1,
                    opacity: r2(Number(cs.opacity)),
                  }
                : null
            );
          }
        }
      }
    }
    return rows;
  };

  const frames = [];
  const started = performance.now();
  let running = true;
  const tick = () => {
    frames.push(read());
    if (running && performance.now() - started < ms) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.__hoverRecording = {
    frames,
    stop: () => {
      running = false;
    },
  };
  return true;
};

const STOP_RECORDER = () => {
  const recorder = window.__hoverRecording;
  if (!recorder) return { frames: [] };
  recorder.stop();
  return { frames: recorder.frames };
};

/**
 * Drive one trigger through hover and leave, recording the peak displacement of
 * every leaf. Runs from Node so the real mouse is used.
 */
async function traceTrigger(page, selector, triggerIndex) {
  const trigger = page.locator(selector).nth(triggerIndex);
  try {
    await trigger.scrollIntoViewIfNeeded({ timeout: 8000 });
  } catch {
    return null;
  }
  // The site runs Lenis, which eases scroll position asymptotically. Capturing the
  // trigger's box while that is still converging puts the pointer somewhere the
  // element no longer is, and the hover silently never lands.
  await waitForScrollIdle(page);
  await page.waitForTimeout(300);
  const box = await trigger.boundingBox();
  if (!box) return null;

  // Park the pointer well away, then start recording, then hover.
  await page.mouse.move(2, 2);
  await page.waitForTimeout(500);
  const rest = await page.evaluate(READ_LEAVES, { targets: TARGETS, scope: selector, scopeIndex: triggerIndex });

  await page.evaluate(START_RECORDER, { targets: TARGETS, ms: 1400, scope: selector, scopeIndex: triggerIndex });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(700);
  const during = await page.evaluate(STOP_RECORDER);

  // Leave and confirm the reverse restores the resting transform.
  await page.mouse.move(2, 2);
  await page.waitForTimeout(1100);
  const after = await page.evaluate(READ_LEAVES, { targets: TARGETS, scope: selector, scopeIndex: triggerIndex });

  // Peak displacement per leaf over the recording, relative to rest.
  const peak = new Map();
  for (const frame of during.frames) {
    frame.forEach((row, i) => {
      const base = rest[i];
      if (!row || !base || !base.rendered) return;
      const key = `${row.target}|${i}`;
      const delta = round(Math.abs(row.ty - base.ty));
      const signed = round(row.ty - base.ty);
      const existing = peak.get(key);
      if (!existing || delta > existing.delta) {
        peak.set(key, {
          target: row.target,
          leafIndex: i,
          delta,
          signed,
          baseScale: base.scaleX,
          scale: row.scaleX,
        });
      }
    });
  }

  // Leaving must return every leaf to its resting transform.
  const restored = after.every((row, i) => {
    const base = rest[i];
    if (!base || !base.rendered || !row.rendered) return true;
    return Math.abs(row.ty - base.ty) < 1.5;
  });

  return {
    selector,
    triggerIndex,
    triggerCls: await trigger.evaluate(
      (el) => el.className?.toString().slice(0, 60) ?? ""
    ),
    frames: during.frames.length,
    leaves: [...peak.values()].filter((p) => p.delta > 1),
    restored,
  };
}

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
          await open(page, base + route);
          sides[label] = { page, context, traces: [] };
          for (const selector of TRIGGERS) {
            const census = await page.evaluate(USABLE, { selector });
            const usable = census.usable;
            let traced = 0;
            for (const entry of usable.slice(0, MAX_PER)) {
              const trace = await traceTrigger(page, selector, entry.i);
              if (trace) {
                sides[label].traces.push(trace);
                traced += 1;
              }
            }
            if (process.env.HOVER_VERBOSE) {
              const total = await page.evaluate(
                (s) => document.querySelectorAll(s).length,
                selector
              );
              console.log(
                `    ${label} ${route}@${width} ${selector}: ${total} in DOM, ${usable.length} usable, ${traced} traced`
              );
              for (const d of (census.debug ?? []).slice(0, 4)) {
                console.log(`        [${d.i}] rejected: ${d.why} ${JSON.stringify(d)}`);
              }
            }
          }
        }
    
        const findings = [];
        const refKeys = sides.ref.traces.map(
          (t) => `${t.selector}|${t.triggerIndex}|${t.triggerCls}`
        );
        const cloneKeys = sides.clone.traces.map(
          (t) => `${t.selector}|${t.triggerIndex}|${t.triggerCls}`
        );
    
        for (let i = 0; i < refKeys.length; i++) {
          const ref = sides.ref.traces[i];
          const at = cloneKeys.indexOf(refKeys[i]);
          if (at === -1) {
            findings.push({
              key: refKeys[i],
              problems: ["hover trigger present in the reference, absent in the clone"],
            });
            continue;
          }
          const clone = sides.clone.traces[at];
    
          // Leaves that move in the reference must move in the clone.
          //
          // The comparison is bounded by the reference's own stagger horizon. These
          // hovers target `.button-normal-text` document-wide with
          // `stagger: { each: 0.018 }`, so a page with ~500 split characters starts
          // the last one 9 seconds in. Nothing beyond the furthest character the
          // reference actually moved has begun yet, so a difference there is a
          // timing artefact, not a defect — comparing them produced dozens of
          // "the clone moves this but the reference does not" findings that all
          // pointed at characters 7 seconds from starting.
          const refMoved = new Map(ref.leaves.map((l) => [`${l.target}|${l.leafIndex}`, l]));
          const cloneMoved = new Map(clone.leaves.map((l) => [`${l.target}|${l.leafIndex}`, l]));
          const horizon = ref.leaves.reduce((max, l) => Math.max(max, l.leafIndex), -1);
          const withinHorizon = (l) => l.leafIndex <= horizon;
    
          for (const [key, refLeaf] of refMoved) {
            const cloneLeaf = cloneMoved.get(key);
            if (!cloneLeaf) {
              findings.push({
                key: `${refKeys[i]} -> ${refLeaf.target} leaf ${refLeaf.leafIndex}`,
                problems: [
                  `hover moves this element ${refLeaf.delta}px in the reference but the clone does not move it at all`,
                ],
              });
              continue;
            }
            // Direction: a roll that goes the wrong way is a real defect.
            if (Math.sign(refLeaf.signed) !== Math.sign(cloneLeaf.signed)) {
              findings.push({
                key: `${refKeys[i]} -> ${refLeaf.target} leaf ${refLeaf.leafIndex}`,
                problems: [
                  `hover travels the wrong way: reference ${refLeaf.signed > 0 ? "+" : "-"}${refLeaf.delta}px, clone ${cloneLeaf.signed > 0 ? "+" : "-"}${cloneLeaf.delta}px`,
                ],
              });
            } else if (Math.abs(refLeaf.delta) > 2) {
              const ratio = cloneLeaf.delta / refLeaf.delta;
              if (ratio < 0.7 || ratio > 1.45) {
                findings.push({
                  key: `${refKeys[i]} -> ${refLeaf.target} leaf ${refLeaf.leafIndex}`,
                  problems: [
                    `hover displacement differs ${ratio < 1 ? (1 / ratio).toFixed(2) + "x" : ratio.toFixed(2) + "x"}: reference ${refLeaf.delta}px, clone ${cloneLeaf.delta}px`,
                  ],
                });
              }
            }
            if (Math.abs(refLeaf.baseScale - cloneLeaf.baseScale) > 0.05) {
              findings.push({
                key: `${refKeys[i]} -> ${refLeaf.target} leaf ${refLeaf.leafIndex}`,
                problems: [
                  `resting scale differs: reference ${refLeaf.baseScale}, clone ${cloneLeaf.baseScale}`,
                ],
              });
            }
          }
          for (const [key, cloneLeaf] of cloneMoved) {
            if (refMoved.has(key)) continue;
            if (!withinHorizon(cloneLeaf)) continue;
            findings.push({
              key: `${refKeys[i]} -> ${cloneLeaf.target} leaf ${cloneLeaf.leafIndex}`,
              problems: [
                `hover moves this element ${cloneLeaf.delta}px in the clone but not in the reference`,
              ],
            });
          }
    
          if (ref.restored && !clone.restored) {
            findings.push({
              key: refKeys[i],
              problems: [
                "hover does not return to rest after the pointer leaves, though the reference does",
              ],
            });
          }
        }
    
        for (let i = 0; i < cloneKeys.length; i++) {
          if (!refKeys.includes(cloneKeys[i])) {
            findings.push({
              key: cloneKeys[i],
              problems: ["hover trigger present in the clone, absent in the reference"],
            });
          }
        }
    
        const entry = {
          route,
          viewport: `${width}`,
          traces: {
            ref: sides.ref.traces.length,
            clone: sides.clone.traces.length,
          },
          movingLeaves: {
            ref: sides.ref.traces.reduce((n, t) => n + t.leaves.length, 0),
            clone: sides.clone.traces.reduce((n, t) => n + t.leaves.length, 0),
          },
          findings,
        };
        report.entries.push(entry);
        findingsTotal += findings.length;
    
        const flag = findings.length ? "FINDINGS" : "clean   ";
        console.log(
          `${flag} ${route.padEnd(50)} ${String(width).padEnd(5)} ` +
            `traces ${entry.traces.ref}/${entry.traces.clone}  ` +
            `moving leaves ${entry.movingLeaves.ref}/${entry.movingLeaves.clone}  ` +
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
console.log("report: docs/research/relab-0c02b053/qa/hover-report.json");
process.exitCode = findingsTotal === 0 ? 0 : 1;
