// The scripted interactions the QA harnesses drive, shared by the per-route
// behaviour check and the batch runner.
//
// Each check returns a plain object so two snapshots can be compared
// structurally; transforms are compared with a numeric tolerance.
import { waitForScrollIdle } from "./qa.mjs";

export const MATRIX_TOLERANCE = 0.5;

/*
 * The cursor-tracked icon measures the pointer against the animated element,
 * whose box shifts as the icon is translated, so the two pages can land well
 * under a pixel apart on a ±8px travel. Half a pixel is not a meaningful bar
 * there; a pixel is.
 */
export const TOLERANCE_BY_CHECK = { cursorIcon: 1 };

const MATRIX_RE = /matrix\(([^)]+)\)/;

/** Structural comparison with a numeric tolerance for matrices and numbers. */
export function compare(a, b, tolerance) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (typeof a === "number" || typeof a === "boolean") {
    return Math.abs(Number(a) - Number(b)) <= tolerance;
  }
  if (typeof a === "string") {
    const ma = MATRIX_RE.exec(a);
    const mb = MATRIX_RE.exec(b);
    if (ma && mb) {
      const na = ma[1].split(",").map(Number);
      const nb = mb[1].split(",").map(Number);
      if (na.length !== nb.length) return false;
      return na.every((n, i) => Math.abs(n - nb[i]) <= tolerance);
    }
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((item, i) => compare(item, b[i], tolerance));
  }
  if (typeof a === "object") {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false;
    return ka.every((k) => compare(a[k], b[k], tolerance));
  }
  return false;
}

export function equal(a, b, key) {
  return compare(a, b, TOLERANCE_BY_CHECK[key] ?? MATRIX_TOLERANCE);
}

/** Checks whose outcome depends on an external service, not on the clone. */
export const INFORMATIONAL_CHECKS = new Set(["form", "errors"]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Read computed + inline state for the first match of each selector. */
const PROBE = (selectors) => {
  const out = {};
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (!el) {
      out[selector] = null;
      continue;
    }
    const cs = getComputedStyle(el);
    out[selector] = {
      inline: el.getAttribute("style"),
      display: cs.display,
      opacity: cs.opacity,
      visibility: cs.visibility,
      transform: cs.transform,
      height: cs.height,
    };
  }
  return out;
};

/**
 * Drive every interaction the page has and snapshot the resulting DOM state.
 * `page` must already be loaded and settled.
 */
export async function runBehaviourChecks(page) {
  const results = {};
  const probe = (selectors) => page.evaluate(PROBE, selectors);

  /* --- SplitText output produced by the interaction engine --- */
  results.split = await probe([
    ".nav-button-wrap .button-normal-text .gsap_split_letter",
    ".nav-menu-wrap .text-button-normal-text .gsap_split_letter",
    ".menu-wrapper",
    ".nav-menu-wrap",
    ".hamburger-line-top",
    ".hamburger-line-middle",
    ".hamburger-line-bottom",
  ]);

  /* --- Button hover: label roll + arrow rotation --- */
  const button = await page.$(".nav-button-wrap .button");
  if (button && (await button.isVisible())) {
    await button.hover();
    await sleep(700);
    results.buttonHover = await probe([
      ".nav-button-wrap .button-normal-text .gsap_split_letter",
      ".nav-button-wrap [button-icon-anin-one]",
    ]);
    await page.mouse.move(2, 2);
    await sleep(700);
  }

  /* --- Text button hover (mobile menu links) --- */
  const textButton = await page.$(".nav-menu-wrap .text-button");
  if (textButton && (await textButton.isVisible())) {
    await textButton.hover();
    await sleep(700);
    results.textButtonHover = await probe([
      ".nav-menu-wrap .text-button-normal-text .gsap_split_letter",
    ]);
    await page.mouse.move(2, 2);
    await sleep(700);
  }

  /* --- Mobile menu toggle --- */
  const burger = await page.$(".menu-button");
  if (burger && (await burger.isVisible())) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(400);
    const menuSelectors = [
      ".nav-menu-wrap",
      ".menu-wrapper",
      ".hamburger-line-top",
      ".hamburger-line-middle",
      ".hamburger-line-bottom",
    ];
    results.menuBefore = await probe(menuSelectors);
    await burger.click();
    await sleep(800);
    results.menuOpen = await probe(menuSelectors);
    await burger.click();
    await sleep(900);
    results.menuClosed = await probe([".nav-menu-wrap", ".menu-wrapper"]);
  }

  /* --- FAQ / accordion toggle ---
     This template's trigger is `.faq-item` itself (the engine binds to it and
     the header inside it is what a user clicks); the homepage's accordion
     variant uses `.accordion-item-title`. */
  const faq = await page.$(".faq-item, .accordion-item-title");
  if (faq && (await faq.isVisible())) {
    await faq.scrollIntoViewIfNeeded();
    await sleep(700);
    const faqSelectors = [
      ".faq-item .faq-toggle-content",
      ".faq-item .faq-item-icon",
      ".accordion-item-body-wrapper",
      ".accordion-item-title-icon",
    ];
    results.faqBefore = await probe(faqSelectors);
    await faq.click();
    await sleep(900);
    results.faqOpen = await probe(faqSelectors);
    await faq.click();
    await sleep(900);
    results.faqClosed = await probe(faqSelectors);
  }

  /* --- Tabs --- */
  const tab = await page.$(".w-tab-link:not(.w--current)");
  if (tab && (await tab.isVisible())) {
    await tab.scrollIntoViewIfNeeded();
    await sleep(600);
    results.tabsBefore = await page.evaluate(() => ({
      ids: [...document.querySelectorAll(".w-tab-link")].map((l) => l.id),
      paneIds: [...document.querySelectorAll(".w-tab-pane")].map((p) => p.id),
      current: document
        .querySelector(".w-tab-menu")
        ?.getAttribute("data-current"),
    }));
    await tab.click();
    await sleep(700);
    results.tabsAfter = await page.evaluate(() => ({
      current: document
        .querySelector(".w-tab-menu")
        ?.getAttribute("data-current"),
      marks: [...document.querySelectorAll(".w-tab-link")].map((l) =>
        l.classList.contains("w--current")
      ),
      panes: [...document.querySelectorAll(".w-tab-pane")].map((p) => ({
        active: p.classList.contains("w--tab-active"),
        opacity: getComputedStyle(p).opacity,
      })),
    }));
  }

  /* --- Slider arrows --- */
  const next = await page.$(".w-slider-arrow-right");
  if (next && (await next.isVisible())) {
    await next.scrollIntoViewIfNeeded();
    await sleep(800);
    const readSlider = () =>
      page.evaluate(() => {
        const slider = document.querySelector(".w-slider");
        return {
          ariaLive:
            slider?.querySelector(".w-slider-aria-label")?.textContent ?? null,
          dots: [...(slider?.querySelector(".w-slider-nav")?.children ?? [])].map(
            (d) => d.classList.contains("w-active")
          ),
          slideTransforms: [...(slider?.querySelectorAll(".w-slide") ?? [])].map(
            (s) => getComputedStyle(s).transform
          ),
        };
      });
    results.sliderBefore = await page.evaluate(() => {
      const slider = document.querySelector(".w-slider");
      return {
        role: slider?.getAttribute("role"),
        ariaLabel: slider?.getAttribute("aria-label"),
        maskId: slider?.querySelector(".w-slider-mask")?.id ?? null,
        ariaLive:
          slider?.querySelector(".w-slider-aria-label")?.textContent ?? null,
        dots: [...(slider?.querySelector(".w-slider-nav")?.children ?? [])].map(
          (d) => ({
            cls: d.className,
            pressed: d.getAttribute("aria-pressed"),
          })
        ),
        slideTransforms: [...(slider?.querySelectorAll(".w-slide") ?? [])].map(
          (s) => getComputedStyle(s).transform
        ),
      };
    });
    await next.click();
    await sleep(1100);
    results.sliderAfter = await readSlider();
    const prev = await page.$(".w-slider-arrow-left");
    if (prev && (await prev.isVisible())) {
      await prev.click();
      await sleep(1100);
      results.sliderBack = await readSlider();
    }
  }

  /* --- Card image hover zoom --- */
  const cardHost = await page.$("[card-image-hover-pfriend]");
  if (cardHost && (await cardHost.isVisible())) {
    await cardHost.scrollIntoViewIfNeeded();
    await sleep(700);
    await cardHost.hover();
    await sleep(900);
    results.cardHover = await probe(["[card-image-hover-child='ture']"]);
    await page.mouse.move(2, 2);
    await sleep(800);
  }

  /* --- Influencer box hover scale (about) --- */
  const influencerBox = await page.$(".our-influencers-image-text-box");
  if (influencerBox && (await influencerBox.isVisible())) {
    await influencerBox.scrollIntoViewIfNeeded();
    await sleep(700);
    await influencerBox.hover();
    await sleep(900);
    results.influencerHover = await probe([".our-influencers-image-text-box"]);
    await page.mouse.move(2, 2);
    await sleep(800);
  }

  /* --- Slider arrow press --- */
  results.sliderPress = await page.evaluate(async () => {
    const el = document.querySelector("[slider-click-btn='true']");
    if (!el) return null;
    const before = getComputedStyle(el).transform;
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    const during = getComputedStyle(el).transform;
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 500));
    return { before, during, after: getComputedStyle(el).transform };
  });

  /* --- Scroll reveals --- */
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(600);
  results.revealsAtTop = await page.evaluate(() => {
    const pick = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { opacity: cs.opacity, transform: cs.transform };
    };
    return {
      fadeUp: pick("[fade-up='true']"),
      fade: pick("[fade='true']"),
      groupFadeUp: pick("[group-fade-up-item='true']"),
      groupFedup: pick("[group-fedup-move='ture']"),
      groupFedupPhone: pick("[group-fedup-phone='ture']"),
      ctaWrapper: pick(".cta-wrapper"),
    };
  });

  /* --- Cursor-tracked icon, driven with a real pointer path --- */
  results.cursorIcon = await (async () => {
    await page.mouse.move(5, 5);
    await page.evaluate(() => {
      document
        .querySelector("[icon-btn-anim]")
        ?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await waitForScrollIdle(page);
    await sleep(600);
    const box = await page.evaluate(() => {
      const host = document.querySelector("[icon-btn-anim]");
      if (!host) return null;
      const r = host.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (!box || !box.w) return null;
    const read = () =>
      page.evaluate(() =>
        [...document.querySelectorAll("[icon-btn-anim]")].map((host) => {
          const icon = host.querySelector(".icon.icon-button-icon");
          return icon ? getComputedStyle(icon).transform : null;
        })
      );
    const rest = await read();
    await page.mouse.move(box.x - 40, box.y + box.h / 2, { steps: 10 });
    await page.mouse.move(box.x + box.w * 0.15, box.y + box.h / 2, { steps: 20 });
    await sleep(1600);
    const left = await read();
    await page.mouse.move(box.x + box.w * 0.85, box.y + box.h / 2, { steps: 20 });
    await sleep(1600);
    const right = await read();
    return { rest, left, right };
  })();

  /* --- Ambient loops are actually running --- */
  results.ambient = await page.evaluate(async () => {
    const selectors = [
      "[move-opacty='ture']",
      "[group-fast-move='ture']",
      "[group-secend-move='ture']",
      "[contain-left-move-child='ture']",
      "[contain-right-move-child='ture']",
      "[love-child='ture']",
      "[text-box-child='ture']",
      "[marku-slide='ture']",
      "[marquee-slide-left='true']",
      "[marquee-slide-right='true']",
      "[zome-in-zom-out='ture']",
      "[move-left-right='ture']",
    ];
    const snap = () =>
      selectors.map((selector) => {
        const el = document.querySelector(selector);
        if (!el) return { selector, missing: true };
        const cs = getComputedStyle(el);
        return { selector, transform: cs.transform, opacity: cs.opacity };
      });
    const a = snap();
    await new Promise((r) => setTimeout(r, 700));
    const b = snap();
    return selectors
      .map((selector, i) => ({
        selector,
        missing: Boolean(a[i].missing),
        animating: !a[i].missing && a[i].transform !== b[i].transform,
      }))
      .filter((row) => !row.missing);
  });

  /* --- Newsletter form submit (informational: posts to Webflow's endpoint) ---
     The reference's submission reaches Webflow's live form service, which
     answers 200 or 409 depending on the site's quota, and the browser logs a
     network error either way. Neither the status nor the logged error is a
     property of the clone, so both are reported but never diffed. */
  results.form = await page.evaluate(async () => {
    const form = document.querySelector(".w-form form");
    if (!form) return null;
    const done = form.parentElement.querySelector(".w-form-done");
    const input = form.querySelector("input[type=email]");
    if (input) {
      input.value = "test@example.com";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (form.requestSubmit) form.requestSubmit();
    else
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    await new Promise((r) => setTimeout(r, 900));
    return {
      doneDisplay: done ? getComputedStyle(done).display : null,
      formDisplay: getComputedStyle(form).display,
    };
  });

  return results;
}

/** Structural outline: tag + first two classes, zero-size nodes skipped. */
export const OUTLINE = () => {
  const lines = [];
  const walk = (element, prefix) => {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    const cls =
      element.className?.toString().split(/\s+/).slice(0, 2).join(".") ?? "";
    const path = `${prefix}/${element.tagName.toLowerCase()}${cls ? `.${cls}` : ""}`;
    lines.push(path);
    const kept = [];
    for (const child of element.children) {
      const sub = walk(child, path);
      if (sub !== null) kept.push(sub);
    }
    return kept.length;
  };
  walk(document.body, "");
  return lines;
};

/** Every laid-out element with its document-space box and computed state. */
export const BOXES = () => {
  const out = [];
  const walk = (element) => {
    const cs = getComputedStyle(element);
    if (cs.display === "none" && cs.visibility === "hidden") return;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      for (const child of element.children) walk(child);
      return;
    }
    // A non-`none` matrix means GSAP drives this element; its subtree is
    // phase-dependent and is reported separately from the pass/fail set.
    const animated =
      /^(matrix|matrix3d)\(/.test(cs.transform) && cs.transform !== "none";
    const start = out.length;
    out.push({
      tag: element.tagName.toLowerCase(),
      cls: element.className?.toString().slice(0, 90) ?? "",
      id: element.id ?? "",
      x: Math.round((rect.x + window.scrollX) * 100) / 100,
      y: Math.round((rect.y + window.scrollY) * 100) / 100,
      w: Math.round(rect.width * 100) / 100,
      h: Math.round(rect.height * 100) / 100,
      text: (element.childElementCount === 0 ? element.textContent : "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60),
      animated,
    });
    for (const child of element.children) walk(child);
    if (animated) for (let i = start; i < out.length; i++) out[i].animated = true;
  };
  walk(document.body);
  return out;
};

/** Compare two element snapshots, separating real diffs from loop phase. */
export function compareBoxes(refBoxes, cloneBoxes, tolerance) {
  const mismatches = [];
  const phase = [];
  for (let i = 0; i < Math.min(refBoxes.length, cloneBoxes.length); i++) {
    const a = refBoxes[i];
    const b = cloneBoxes[i];
    if (a.tag !== b.tag || a.cls !== b.cls || (a.id !== b.id && a.id)) {
      mismatches.push({ kind: "node", i, a, b });
      continue;
    }
    const d = {
      x: Math.abs(a.x - b.x),
      y: Math.abs(a.y - b.y),
      w: Math.abs(a.w - b.w),
      h: Math.abs(a.h - b.h),
    };
    if (Math.max(d.x, d.y, d.w, d.h) <= tolerance) continue;
    if (a.animated || b.animated) {
      phase.push({ i, d, a, b });
      continue;
    }
    mismatches.push({ kind: "box", i, d, a, b });
  }
  return { mismatches, phase };
}