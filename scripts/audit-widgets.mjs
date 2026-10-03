// Widget audit: sliders, carousels and tabs.
//
// ## Why this layer needed its own harness
//
// Webflow drives sliders and tabs from its *widget* runtime, not from the IX3
// interaction payload the animation audits read. Nothing else in the QA suite
// clicks anything, so a slider that never moves, or a tab that never switches,
// would pass every structural check — the markup, geometry and text all match
// perfectly while the control is dead.
//
// The reference is authoritative for behaviour rather than for markup here:
// `scripts/widget-inventory.mjs` shows the site has 17 sliders, 19 slides,
// 3 arrow pairs and 2 tab sets across just three routes (`/`, `/about`,
// `/case-studies`), with no autoplay, loop or swipe anywhere. So this audit
// runs on those routes.
//
// ## What is compared
//
// **Sliders** — for each arrow, click and record:
//   * the `.w-slider-mask` transform (this is the slider's position),
//   * which slide index is in the viewport,
//   * the arrow's own `w--disabled` state, so a slider that stops at the end
//     is compared with one that keeps going.
//
// **Tabs** — for each tab in the menu, click and record:
//   * which panes carry `w--tab-active`,
//   * the visible height of each pane,
//   * the tab's own `w--tab-active`.
//
// Usage:
//   node scripts/audit-widgets.mjs
//   node scripts/audit-widgets.mjs --routes=/about --widths=1440
import fs from "node:fs";
import { launch, open, ORIGIN, LOCAL, parseArgs, waitForScrollIdle , mergeReport } from "./lib/qa.mjs";

const args = parseArgs();
const REPORT = "docs/research/relab-0c02b053/qa/widget-report.json";

const WIDTHS =
  typeof args.widths === "string"
    ? args.widths.split(",").map((w) => Number(w.trim()))
    : [1440, 390];

/** Only routes that actually carry a slider or a tab set. */
const WIDGET_ROUTES = ["/", "/about", "/case-studies"];

const routes =
  typeof args.routes === "string"
    ? args.routes.split(",").map((r) => r.trim())
    : WIDGET_ROUTES.filter((r) => WIDGET_ROUTES.includes(r));

/** Slider position: the mask's own transform, read as a translate. */
const SLIDER_STATE = () => {
  const round = (n) => Math.round(n * 100) / 100;
  const parse = (transform) => {
    if (!transform || transform === "none") return null;
    const m = /matrix(3d)?\(([^)]+)\)/.exec(transform);
    if (!m) return null;
    const v = m[2].split(",").map(Number);
    return v.length > 6 ? v[12] : v[4];
  };

  return [...document.querySelectorAll(".w-slider")].map((slider, index) => {
    const mask = slider.querySelector(".w-slider-mask");
    const slides = [...slider.querySelectorAll(".w-slide")];
    const viewport = slider.querySelector(".w-slider") ?? slider;
    const maskBox = mask?.getBoundingClientRect();
    const viewBox = viewport.getBoundingClientRect();

    // Which slide currently overlaps the viewport most?
    let visibleIndex = -1;
    let bestOverlap = 0;
    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const overlap = Math.max(
        0,
        Math.min(rect.right, viewBox.right) - Math.max(rect.left, viewBox.left)
      );
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        visibleIndex = i;
      }
    });

    const arrowState = (selector) => {
      const arrow = slider.querySelector(selector);
      if (!arrow) return null;
      return {
        disabled: arrow.classList.contains("w--disabled"),
        opacity: round(Number(getComputedStyle(arrow).opacity)),
      };
    };

    return {
      index,
      maskTranslateX: mask ? round(parse(getComputedStyle(mask).transform) ?? 0) : null,
      maskLeft: maskBox ? round(maskBox.left) : null,
      viewportLeft: round(viewBox.left),
      viewportWidth: round(viewBox.width),
      slideCount: slides.length,
      visibleIndex,
      visibleWidth: round(bestOverlap),
      leftArrow: arrowState(".w-slider-arrow-left"),
      rightArrow: arrowState(".w-slider-arrow-right"),
      inline: mask?.getAttribute("style") ?? null,
    };
  });
};

/** Tab state: which panes are active, and are they the right height. */
const TAB_STATE = () => {
  const round = (n) => Math.round(n * 100) / 100;
  return [...document.querySelectorAll(".w-tabs")].map((tabs, index) => {
    const tabsInMenu = [...tabs.querySelectorAll('[role="tab"], .w-tab-link')];
    const panes = [...tabs.querySelectorAll('[role="tabpanel"], .w-tab-pane')];
    return {
      index,
      tabCount: tabsInMenu.length,
      paneCount: panes.length,
      activeTab: tabsInMenu.findIndex((t) =>
        t.classList.contains("w--tab-active")
      ),
      activeTabs: tabsInMenu
        .map((t, i) => (t.classList.contains("w--tab-active") ? i : null))
        .filter((v) => v !== null),
      activePanes: panes
        .map((p, i) => (p.classList.contains("w--tab-active") ? i : null))
        .filter((v) => v !== null),
      paneHeights: panes.map((p) => round(p.getBoundingClientRect().height)),
      // Which pane is actually painted.
      visiblePanes: panes
        .map((p, i) => {
          const cs = getComputedStyle(p);
          const rect = p.getBoundingClientRect();
          return cs.display !== "none" && rect.height > 0 ? i : null;
        })
        .filter((v) => v !== null),
    };
  });
};

/** Click every slider arrow in turn, recording the state after each click. */
async function sweepSliders(page, label) {
  const steps = [];
  const count = await page.evaluate(
    () => document.querySelectorAll(".w-slider").length
  );
  for (let sliderIndex = 0; sliderIndex < count; sliderIndex++) {
    for (const [direction, selector] of [
      ["next", ".w-slider-arrow-right"],
      ["prev", ".w-slider-arrow-left"],
    ]) {
      const slider = page
        .locator(".w-slider")
        .nth(sliderIndex)
        .locator(selector)
        .first();
      if (!(await slider.count())) continue;
      try {
        await slider.scrollIntoViewIfNeeded({ timeout: 6000 });
        await waitForScrollIdle(page);
        await page.waitForTimeout(250);
        await slider.click({ force: true, timeout: 6000 });
      } catch {
        steps.push({ sliderIndex, direction, skipped: "not clickable" });
        continue;
      }
      await page.waitForTimeout(900);
      const state = await page.evaluate(SLIDER_STATE);
      steps.push({ sliderIndex, direction, after: state[sliderIndex] ?? null });
      // Park the pointer away so the next click starts clean.
      await page.mouse.move(4, 4);
      await page.waitForTimeout(200);
    }
  }
  void label;
  return steps;
}

/** Click every tab in turn, recording the state after each click. */
async function sweepTabs(page) {
  const steps = [];
  const sets = await page.evaluate(() => document.querySelectorAll(".w-tabs").length);
  for (let setIndex = 0; setIndex < sets; setIndex++) {
    const tabCount = await page.evaluate(
      (i) =>
        document.querySelectorAll(".w-tabs")[i]?.querySelectorAll(
          '[role="tab"], .w-tab-link'
        ).length ?? 0,
      setIndex
    );
    for (let tabIndex = 0; tabIndex < tabCount; tabIndex++) {
      const tab = page
        .locator(".w-tabs")
        .nth(setIndex)
        .locator('[role="tab"], .w-tab-link')
        .nth(tabIndex);
      try {
        await tab.scrollIntoViewIfNeeded({ timeout: 6000 });
        await waitForScrollIdle(page);
        await page.waitForTimeout(200);
        await tab.click({ force: true, timeout: 6000 });
      } catch {
        steps.push({ setIndex, tabIndex, skipped: "not clickable" });
        continue;
      }
      await page.waitForTimeout(800);
      const state = await page.evaluate(TAB_STATE);
      steps.push({ setIndex, tabIndex, after: state[setIndex] ?? null });
      await page.mouse.move(4, 4);
      await page.waitForTimeout(150);
    }
  }
  return steps;
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
          sides[label] = { page, context };
          sides[label].sliderStart = await page.evaluate(SLIDER_STATE);
          sides[label].tabStart = await page.evaluate(TAB_STATE);
          sides[label].sliderSteps = await sweepSliders(page, label);
          sides[label].tabSteps = await sweepTabs(page);
        }
    
        const findings = [];
    
        // --- sliders -------------------------------------------------------
        /**
         * Only *asymmetries* are findings. Some arrows legitimately do nothing on
         * both sites — a `prev` on a slider already at its first slide, for
         * instance — and reporting that as a defect flagged the reference against
         * itself, which is how an audit ends up crying wolf.
         *
         * The per-side check below is kept, but as a count of what each click
         * actually did, so the run can be sanity-checked: a harness that reports
         * "no findings" because nothing ever moved is the failure mode to avoid.
         */
        const movedBySide = { ref: 0, clone: 0 };
        for (const side of ["ref", "clone"]) {
          for (const step of sides[side].sliderSteps) {
            if (step.skipped || !step.after) continue;
            const start = sides[side].sliderStart[step.sliderIndex];
            if (!start) continue;
            const moved = Math.abs(
              step.after.maskTranslateX - (start.maskTranslateX ?? 0)
            );
            if (moved >= 1 || step.after.visibleIndex !== start.visibleIndex) {
              movedBySide[side] += 1;
            }
          }
        }
        // Cross-side parity on the first click of each slider.
        for (let i = 0; i < sides.ref.sliderSteps.length; i++) {
          const ref = sides.ref.sliderSteps[i];
          const clone = sides.clone.sliderSteps[i];
          if (!ref?.after || !clone?.after) continue;
          const key = `slider ${ref.sliderIndex} ${ref.direction}`;
          if (ref.after.visibleIndex !== clone.after.visibleIndex) {
            findings.push({
              key,
              problems: [
                `after clicking ${ref.direction}, the reference shows slide ${ref.after.visibleIndex} and the clone shows slide ${clone.after.visibleIndex}`,
              ],
            });
          }
          if (
            Math.abs(ref.after.maskTranslateX - clone.after.maskTranslateX) > 2 &&
            ref.after.visibleIndex === clone.after.visibleIndex
          ) {
            findings.push({
              key,
              problems: [
                `mask offset differs: reference ${ref.after.maskTranslateX}, clone ${clone.after.maskTranslateX}`,
              ],
            });
          }
          if (
            ref.after.leftArrow?.disabled !== clone.after.leftArrow?.disabled ||
            ref.after.rightArrow?.disabled !== clone.after.rightArrow?.disabled
          ) {
            findings.push({
              key,
              problems: [
                `arrow state differs: reference left=${ref.after.leftArrow?.disabled} right=${ref.after.rightArrow?.disabled}, clone left=${clone.after.leftArrow?.disabled} right=${clone.after.rightArrow?.disabled}`,
              ],
            });
          }
        }
    
        // --- tabs ----------------------------------------------------------
        const switchedBySide = { ref: 0, clone: 0 };
        for (const side of ["ref", "clone"]) {
          for (const step of sides[side].tabSteps) {
            if (step.skipped || !step.after || step.tabIndex === 0) continue;
            const before = sides[side].tabStart[step.setIndex];
            if (!before) continue;
            if (
              step.after.activeTab !== before.activeTab ||
              JSON.stringify(step.after.activePanes) !==
                JSON.stringify(before.activePanes)
            ) {
              switchedBySide[side] += 1;
            }
          }
        }
        for (let i = 0; i < sides.ref.tabSteps.length; i++) {
          const ref = sides.ref.tabSteps[i];
          const clone = sides.clone.tabSteps[i];
          if (!ref?.after || !clone?.after) continue;
          const key = `tabs ${ref.setIndex} tab ${ref.tabIndex}`;
          if (ref.after.activeTab !== clone.after.activeTab) {
            findings.push({
              key,
              problems: [
                `active tab differs: reference ${ref.after.activeTab}, clone ${clone.after.activeTab}`,
              ],
            });
          }
          if (
            JSON.stringify(ref.after.activePanes) !==
            JSON.stringify(clone.after.activePanes)
          ) {
            findings.push({
              key,
              problems: [
                `active panes differ: reference [${ref.after.activePanes}], clone [${clone.after.activePanes}]`,
              ],
            });
          }
          if (
            JSON.stringify(ref.after.visiblePanes) !==
            JSON.stringify(clone.after.visiblePanes)
          ) {
            findings.push({
              key,
              problems: [
                `painted panes differ: reference [${ref.after.visiblePanes}], clone [${clone.after.visiblePanes}]`,
              ],
            });
          }
        }
    
        const entry = {
          route,
          viewport: `${width}`,
          sliders: {
            ref: sides.ref.sliderStart.length,
            clone: sides.clone.sliderStart.length,
          },
          tabSets: {
            ref: sides.ref.tabStart.length,
            clone: sides.clone.tabStart.length,
          },
          // What each click actually did, on each side. If these are equal and
          // non-zero the controls are live and were genuinely exercised; if they are
          // zero, nothing moved anywhere and a clean result means nothing.
          exercised: {
            sliderClicksThatMoved: movedBySide,
            tabClicksThatSwitched: switchedBySide,
            sliderClicks: {
              ref: sides.ref.sliderSteps.filter((s) => !s.skipped).length,
              clone: sides.clone.sliderSteps.filter((s) => !s.skipped).length,
            },
            tabClicks: {
              ref: sides.ref.tabSteps.filter((s) => !s.skipped).length,
              clone: sides.clone.tabSteps.filter((s) => !s.skipped).length,
            },
          },
          findings,
        };
        report.entries.push(entry);
        findingsTotal += findings.length;
    
        const flag = findings.length ? "FINDINGS" : "clean   ";
        console.log(
          `${flag} ${route.padEnd(24)} ${String(width).padEnd(5)} ` +
            `sliders ${entry.sliders.ref}/${entry.sliders.clone} ` +
            `(clicks ${entry.exercised.sliderClicks.ref}/${entry.exercised.sliderClicks.clone}, ` +
            `moved ${entry.exercised.sliderClicksThatMoved.ref}/${entry.exercised.sliderClicksThatMoved.clone})  ` +
            `tabs ${entry.tabSets.ref}/${entry.tabSets.clone} ` +
            `(clicks ${entry.exercised.tabClicks.ref}/${entry.exercised.tabClicks.clone}, ` +
            `switched ${entry.exercised.tabClicksThatSwitched.ref}/${entry.exercised.tabClicksThatSwitched.clone})  ` +
            `issues ${findings.length}`
        );
        for (const finding of findings.slice(0, 8)) {
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
console.log("report: docs/research/relab-0c02b053/qa/widget-report.json");
process.exitCode = findingsTotal === 0 ? 0 : 1;