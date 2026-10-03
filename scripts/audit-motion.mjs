// Animation audit — part A: continuous motion.
//
// For every element the reference drives with an interaction hook (or that a
// Webflow widget moves), sample its transform / opacity / position repeatedly and
// derive a *motion signature*. Then do the same on the clone and compare.
//
// ## Why rates, not absolute positions
//
// An element on an infinite loop is at an arbitrary phase whenever it is
// sampled, and the phase differs between two page loads. Comparing absolute
// positions therefore produces false positives — an earlier version of this
// harness reported a healthy marquee as 4x too slow purely because of that.
//
// Two quantities are phase-invariant and are what this harness compares:
//   * **rate** — pixels (or opacity units) travelled per second, from the total
//     path length over a measured wall-clock window;
//   * **axes** — which transform components move at all, and in which direction.
//
// Amplitude cannot be recovered from a window shorter than one full period, so
// it is deliberately not compared here; a longer-window check lives in
// `probe-motion-period.mjs`.
//
// Usage:
//   node scripts/audit-motion.mjs
//   node scripts/audit-motion.mjs --routes=/about,/services --widths=1440
//   node scripts/audit-motion.mjs --samples=10 --duration=4000
import fs from "node:fs";
import { launch, open, ORIGIN, LOCAL, parseArgs , mergeReport } from "./lib/qa.mjs";

const args = parseArgs();
const REPORT = "docs/research/relab-0c02b053/qa/motion-report.json";

const WIDTHS =
  typeof args.widths === "string"
    ? args.widths.split(",").map((w) => Number(w.trim()))
    : [1440, 390];
const SAMPLES = Number(args.samples ?? 10);
const DURATION = Number(args.duration ?? 4000);

const allRoutes = JSON.parse(
  fs.readFileSync("docs/research/relab-0c02b053/routes.json", "utf8")
).routes.map((r) => r.route);
const routes =
  typeof args.routes === "string"
    ? args.routes.split(",").map((r) => r.trim())
    : allRoutes;

/** Every hook attribute the site uses, plus the widget-driven movers. */
const HOOK_SELECTORS = [
  "btn-anim",
  "button-icon-anin-one",
  "button-icon-anin-two",
  "card-image-hover-child",
  "card-image-hover-pfriend",
  "contain-left-move-child",
  "contain-right-move-child",
  "fade",
  "fade-up",
  "group-fade-up-item",
  "group-fade-up-parent",
  "group-fedup-move",
  "group-fedup-move-pfriend",
  "group-fedup-phone",
  "group-fedup-phone-pfriend",
  "group-fast-move",
  "group-secend-move",
  "hover-pfriend",
  "icon-btn-anim",
  "love-child",
  "marku-slide",
  "menu-bar",
  "menu-bar-toggle",
  "move-left-right",
  "move-scroll-card-box",
  "origin-fade-up-pfriend",
  "slider-click-btn",
  "text-box-child",
  "zome-in-zom-out",
  "w-slide",
  "w-slider-mask",
  "hero-intro-card-box",
  "single-image-wrap",
  "marquee-el",
  "our-creators-box",
  "services-mask",
  "process-slider-mask",
  "about-slider-mask",
  "promotional-image-slider",
  "hamburger-line-top",
  "hamburger-line-middle",
  "hamburger-line-bottom",
  "menu-wrapper",
];

const CANDIDATE_SELECTOR = HOOK_SELECTORS.map(
  (hook) => `[${hook}]:not([${hook}="false"])`
).join(", ");

/**
 * Run in the page. `hooks` is passed in because `page.evaluate` serialises this
 * function, so it cannot close over module scope.
 *
 * Everything is timed with `performance.now()` from inside the page, because
 * reading computed style for ~150 elements is not free and the harness's own
 * wall clock is not a reliable measure of the sampling window.
 */
const SIGNATURES = async ({ selector, samples, duration, hooks }) => {
  const nodes = [...document.querySelectorAll(selector)];

  const parse = (transform) => {
    if (!transform || transform === "none") return null;
    const m = /matrix(3d)?\(([^)]+)\)/.exec(transform);
    if (!m) return null;
    return m[2].split(",").map(Number);
  };

  // Identity is resolved once, before the sampling loop. Doing it per sample
  // meant ~40 `matches()` calls per element per frame — 60k selector matches
  // across a run, all of it inside the timed window.
  const identity = nodes.map((element) => {
    for (const hook of hooks) {
      if (element.hasAttribute(hook)) return hook;
    }
    const firstClass = element.className?.toString().split(/\s+/)[0];
    return firstClass ?? "?";
  });
  const labels = nodes.map(
    (element) => element.className?.toString().slice(0, 70) ?? ""
  );

  const readAll = () =>
    nodes.map((element) => {
      const cs = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        matrix: parse(cs.transform),
        opacity: Number(cs.opacity),
        left: rect.left,
        top: rect.top,
        w: rect.width,
        h: rect.height,
      };
    });

  const frames = [];
  const step = duration / (samples - 1);
  for (let i = 0; i < samples; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, step));
    frames.push({ t: performance.now(), reads: readAll() });
  }

  return nodes.map((element, index) => {
    const series = frames.map((f) => f.reads[index]);
    // Real elapsed time between consecutive samples. `frames[i].t` is stamped
    // before the read pass, so each delta covers that pass plus the sleep.
    const gaps = [];
    for (let i = 1; i < frames.length; i++) {
      gaps.push((frames[i].t - frames[i - 1].t) / 1000);
    }
    const present = series.map((r) => r.matrix).filter(Boolean);
    const columns = present.length ? Math.max(...present.map((m) => m.length)) : 0;

    /**
     * Rate as the MEDIAN of per-interval speeds, not total path over total
     * time. One stalled interval — a GC pause, a Lenis reflow — adds a single
     * large jump to a total and inflates `path / elapsed` several-fold. That is
     * exactly the false positive this harness produced twice on a perfectly
     * healthy marquee (92 px/s measured in isolation, 483 px/s under load).
     * A median has no such failure mode.
     */
    const medianRates = (values) => {
      const rates = [];
      for (let i = 1; i < values.length; i++) {
        const a = values[i - 1];
        const b = values[i];
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        if (gaps[i - 1] <= 0) continue;
        rates.push(Math.abs(b - a) / gaps[i - 1]);
      }
      if (!rates.length) return 0;
      rates.sort((x, y) => x - y);
      const mid = Math.floor(rates.length / 2);
      return rates.length % 2
        ? rates[mid]
        : (rates[mid - 1] + rates[mid]) / 2;
    };

    // Per-column speed, keeping the real column index so the report can name
    // the axis correctly (matrix column 4 is translateX, not "axis 0").
    const axisRates = [];
    const axisColumns = [];
    const axisSigns = [];
    const axisNet = [];
    for (let c = 0; c < columns; c++) {
      const values = series.map((r) => r.matrix?.[c]);
      const rate = medianRates(values);
      if (rate <= 0.05) continue;
      const presentValues = values.filter((v) => Number.isFinite(v));
      const net = presentValues.length
        ? (presentValues.at(-1) - presentValues[0]) /
          (gaps.reduce((n, v) => n + v, 0) || 1)
        : 0;
      axisRates.push(Math.round(rate * 10) / 10);
      axisColumns.push(c);
      axisNet.push(Math.round(net * 10) / 10);
      axisSigns.push(Math.sign(net));
    }

    const opacities = series.map((r) => r.opacity);
    const opacityRate = medianRates(opacities);
    const lefts = series.map((r) => r.left);
    const leftRate = medianRates(lefts);

    return {
      hook: identity[index],
      cls: labels[index],
      moving: axisRates.length > 0 || opacityRate > 0.005 || leftRate > 3,
      axisCount: axisRates.length,
      axisRates,
      axisColumns,
      axisSigns,
      axisNet,
      opacityRate: Math.round(opacityRate * 1000) / 1000,
      opacitySpread:
        Math.round((Math.max(...opacities) - Math.min(...opacities)) * 1000) / 1000,
      leftRate: Math.round(leftRate * 10) / 10,
      size: `${Math.round(series[0].w)}x${Math.round(series[0].h)}`,
    };
  });
};

/** Axis names for readable findings, indexed by real matrix column. */
const AXIS = {
  0: "scaleX",
  1: "skewY",
  2: "scaleY",
  3: "skewX",
  4: "translateX",
  5: "translateY",
  10: "translateZ",
};

/**
 * Compare two signatures. Rates are compared within a factor of 1.6, which is
 * comfortably wider than sampling noise yet far tighter than a real bug (the
 * marquee bug this harness originally chased was 4x).
 */
function compareSignature(a, b) {
  const problems = [];
  if (a.moving && !b.moving) {
    problems.push("moves in the reference but is completely static in the clone");
    return problems;
  }
  if (!a.moving && b.moving) {
    problems.push("moves in the clone but is static in the reference");
    return problems;
  }
  if (!a.moving && !b.moving) return problems;

  const refSum = a.axisRates.reduce((n, v) => n + v, 0);
  const cloneSum = b.axisRates.reduce((n, v) => n + v, 0);

  // How many transform components move.
  if (a.axisCount !== b.axisCount) {
    const missing = a.axisCount - b.axisCount;
    problems.push(
      missing > 0
        ? `${missing} transform component(s) move in the reference but not in the clone (ref ${a.axisCount}, clone ${b.axisCount})`
        : `${-missing} transform component(s) move in the clone but not in the reference (ref ${a.axisCount}, clone ${b.axisCount})`
    );
  }

  if (refSum > 0.5 && cloneSum > 0.5) {
    const ratio = cloneSum / refSum;
    if (ratio < 0.625 || ratio > 1.6) {
      problems.push(
        `speed differs ${ratio < 1 ? "slower" : "faster"} by ${ratio < 1 ? (1 / ratio).toFixed(2) : ratio.toFixed(2)}x ` +
          `(reference ${refSum} px/s, clone ${cloneSum} px/s)`
      );
    }
  } else if (refSum > 2 && cloneSum <= 0.5) {
    problems.push(
      `moves at ${refSum} px/s in the reference but is effectively still in the clone`
    );
  }

  // Direction is deliberately NOT compared here.
  //
  // A yoyo loop travels out and back, so over any window shorter than a full
  // period the apparent direction depends entirely on the phase at which the
  // window opened — testing it in a windowed harness produces pure noise (it
  // did, repeatedly, on the homepage's `contain-*-move-child` loops). Direction,
  // period and amplitude are verified instead by `probe-motion-period.mjs`,
  // which samples at least two full cycles using the durations declared in the
  // IX payload.

  if (a.opacityRate > 0.01 && b.opacityRate <= 0.005) {
    problems.push("opacity pulses in the reference but is constant in the clone");
  }
  if (b.opacityRate > 0.01 && a.opacityRate <= 0.005) {
    problems.push("opacity pulses in the clone but is constant in the reference");
  }
  if (a.leftRate > 6 && b.leftRate <= 2) {
    problems.push(
      `travels horizontally at ${a.leftRate} px/s in the reference but not in the clone`
    );
  }
  return problems;
}

const browser = await launch();
const report = { generatedAt: new Date().toISOString(), entries: [] };
let findingsTotal = 0;
let problemCount = 0;

for (const route of routes) {
  for (const width of WIDTHS) {
    // A route the reference cannot be reached for is recorded and skipped, so a
    // network outage does not discard every result measured so far.
    try {

        const pages = {};
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
          // The homepage's sticky creators section is driven by a *scrubbed*
          // ScrollTrigger (`scrub: 0.8`), so its progress keeps easing after the
          // scroll settles. Left alone, every descendant reports a different
          // transform on each load and the comparison drowns in noise — so give the
          // scrub time to converge before sampling.
          await page.waitForTimeout(2500);
          pages[label] = { page, context };
        }
    
        const signatures = {};
        for (const label of ["ref", "clone"]) {
          signatures[label] = await pages[label].page.evaluate(SIGNATURES, {
            selector: CANDIDATE_SELECTOR,
            samples: SAMPLES,
            duration: DURATION,
            hooks: HOOK_SELECTORS,
          });
        }
    
        /** Align the two lists by hook + class + occurrence index. */
        const index = (list) => {
          const counters = new Map();
          return list.map((sig) => {
            const base = `${sig.hook}|${sig.cls}`;
            const n = counters.get(base) ?? 0;
            counters.set(base, n + 1);
            return `${base}|${n}`;
          });
        };
        const refKeys = index(signatures.ref);
        const cloneKeys = index(signatures.clone);
    
        const findings = [];
        for (let i = 0; i < signatures.ref.length; i++) {
          const refSig = signatures.ref[i];
          const cloneAt = cloneKeys.indexOf(refKeys[i]);
          if (cloneAt === -1) {
            findings.push({
              key: refKeys[i],
              hook: refSig.hook,
              problems: ["element present in the reference, absent in the clone"],
            });
            continue;
          }
          const cloneSig = signatures.clone[cloneAt];
          const problems = compareSignature(refSig, cloneSig);
          if (problems.length) {
            findings.push({
              key: refKeys[i],
              hook: refSig.hook,
              problems,
              ref: refSig,
              clone: cloneSig,
            });
          }
        }
        for (let i = 0; i < signatures.clone.length; i++) {
          if (!refKeys.includes(cloneKeys[i])) {
            findings.push({
              key: cloneKeys[i],
              hook: signatures.clone[i].hook,
              problems: ["element present in the clone, absent in the reference"],
            });
          }
        }
    
        const entry = {
          route,
          viewport: `${width}`,
          candidates: {
            ref: signatures.ref.length,
            clone: signatures.clone.length,
          },
          moving: {
            ref: signatures.ref.filter((s) => s.moving).length,
            clone: signatures.clone.filter((s) => s.moving).length,
          },
          findings,
        };
        report.entries.push(entry);
        problemCount += findings.length;
    
        const flag = findings.length ? "FINDINGS" : "clean   ";
        console.log(
          `${flag} ${route.padEnd(50)} ${String(width).padEnd(5)} ` +
            `candidates ${entry.candidates.ref}/${entry.candidates.clone}  ` +
            `moving ${entry.moving.ref}/${entry.moving.clone}  ` +
            `issues ${findings.length}`
        );
        for (const finding of findings.slice(0, 12)) {
          console.log(`      ${finding.hook}  ${finding.key}`);
          for (const problem of finding.problems) console.log(`         - ${problem}`);
          if (finding.ref?.axisRates) {
            const fmt = (sig) =>
              `axes=${sig.axisCount} ` +
              `${sig.axisRates
                .map(
                  (r, i) =>
                    `${AXIS[sig.axisColumns[i]] ?? `col${sig.axisColumns[i]}`}:${r}px/s ${
                      sig.axisSigns[i] > 0 ? "+" : "-"
                    }`
                )
                .join(", ")} ` +
              `opacityRate=${sig.opacityRate}/s leftRate=${sig.leftRate}px/s`;
            console.log(`         ref  : ${fmt(finding.ref)}`);
            console.log(`         clone: ${fmt(finding.clone)}`);
          }
        }
    
        await pages.ref.context.close();
        await pages.clone.context.close();
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

const routesWithFindings = new Set(
  report.entries
    .filter((e) => e.findings.length)
    .map((e) => `${e.route}@${e.viewport}`)
);
console.log(
  `\n${report.entries.length - routesWithFindings.size}/${report.entries.length} route-viewports clean; ` +
    `${problemCount} finding(s) total`
);
console.log("report: docs/research/relab-0c02b053/qa/motion-report.json");
process.exitCode = problemCount === 0 ? 0 : 1;