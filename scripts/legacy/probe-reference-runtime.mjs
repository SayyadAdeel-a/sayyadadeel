// Probe the live reference site for the runtime details the minified engine
// leaves ambiguous: the SplitText class names it generates, whether the
// text-button character roll is disabled on the `main` breakpoint, the inline
// styles the engine writes at registration, and how each control type behaves.
//
// Usage: node scripts/probe-reference-runtime.mjs [route] [width]
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright")
);

const ORIGIN = "https://relab-template.webflow.io";
const route = process.argv[2] ?? "/";
const width = Number(process.argv[3] ?? 1440);
const height = width < 992 ? 844 : 900;

const browser = await chromium.launch({
  executablePath:
    process.env.LOCALAPPDATA +
    "\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
});
const ctx = await browser.newContext({ viewport: { width, height } });
const page = await ctx.newPage();
await page.goto(ORIGIN + route, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(2500);

const report = {};

report.htmlClasses = await page.evaluate(() => ({
  hasWModJs: document.documentElement.classList.contains("w-mod-js"),
  hasWModIx3: document.documentElement.classList.contains("w-mod-ix3"),
  classes: [...document.documentElement.classList],
  dataWfTargetCount: document.querySelectorAll("[data-wf-target]").length,
  wfTargetSample: [...document.querySelectorAll("[data-wf-target]")]
    .slice(0, 4)
    .map((e) => ({
      cls: e.className?.toString().slice(0, 60),
      attr: e.getAttribute("data-wf-target")?.slice(0, 120),
    })),
}));

// SplitText output: hover a text button and a button and dump the generated DOM.
report.splitText = await page.evaluate(async () => {
  const out = {};
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const tb = document.querySelector(".text-button");
  if (tb) {
    const before = tb.innerHTML.slice(0, 200);
    tb.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
    await sleep(120);
    const label = tb.querySelector(".text-button-normal-text");
    out.textButtonBefore = before;
    out.textButtonHtml = label ? label.innerHTML.slice(0, 400) : null;
    out.textButtonSpanClasses = label
      ? [...label.querySelectorAll("span")].slice(0, 6).map((s) => ({
          cls: s.className,
          style: s.getAttribute("style"),
          txt: s.textContent,
        }))
      : null;
    out.textButtonTransform = label
      ? getComputedStyle(label).transform
      : null;
    tb.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    await sleep(500);
  }
  const btn = document.querySelector(".button");
  if (btn) {
    const label = btn.querySelector(".button-normal-text");
    out.buttonHtmlBefore = label ? label.innerHTML.slice(0, 200) : null;
    btn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
    await sleep(120);
    out.buttonHtml = label ? label.innerHTML.slice(0, 400) : null;
    out.buttonSpanClasses = label
      ? [...label.querySelectorAll("span")].slice(0, 6).map((s) => ({
          cls: s.className,
          style: s.getAttribute("style"),
          txt: s.textContent,
        }))
      : null;
    btn.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    await sleep(500);
  }
  return out;
});

// Elements the engine gave an initial inline transform/opacity at load time.
report.inlineAtLoad = await page.evaluate(() =>
  [...document.querySelectorAll("[style]")]
    .map((e) => ({
      cls: (e.className?.toString() ?? "").slice(0, 70),
      style: e.getAttribute("style").slice(0, 140),
    }))
    .filter((r) => /transform|opacity|display|visibility/.test(r.style))
    .slice(0, 40)
);

// Scroll-triggered reveals: capture computed state of a known hook.
report.reveals = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      sel,
      opacity: cs.opacity,
      transform: cs.transform,
      visibility: cs.visibility,
      inline: el.getAttribute("style") ?? null,
    };
  };
  const sels = [
    "[fade-up='true']",
    "[fade='true']",
    "[group-fade-up-item='true']",
    "[group-fedup-move='ture']",
    "[card-image-hover-child='ture']",
    "[move-opacty='ture']",
  ];
  const before = sels.map(pick);
  const step = Math.round(window.innerHeight * 0.8);
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await sleep(40);
  }
  await sleep(1200);
  const after = sels.map(pick);
  return { before, after };
});

// FAQ / accordion toggle behaviour.
report.faq = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const trigger =
    document.querySelector(".faq-toggle") ??
    document.querySelector("[accordion-item-title]");
  if (!trigger) return null;
  const scope = trigger.parentElement;
  const content =
    scope.querySelector(".faq-toggle-content") ??
    scope.querySelector(".accordion-item-body-wrapper");
  const icon = trigger.querySelector(".faq-item-icon") ?? trigger.querySelector(".accordion-item-title-icon");
  const snap = (tag) => ({
    tag,
    contentInline: content?.getAttribute("style") ?? null,
    contentH: content ? getComputedStyle(content).height : null,
    iconTransform: icon ? getComputedStyle(icon).transform : null,
  });
  const before = snap("before");
  trigger.click();
  await sleep(120);
  const mid = snap("open+120ms");
  await sleep(600);
  const open = snap("open");
  trigger.click();
  await sleep(150);
  const closing = snap("close+150ms");
  await sleep(600);
  return { before, mid, open, closing, after: snap("closed") };
});

// Slider DOM stamped by the widget runtime.
report.widgets = await page.evaluate(() => ({
  sliders: [...document.querySelectorAll(".w-slider")].map((s) => ({
    role: s.getAttribute("role"),
    ariaLabel: s.getAttribute("aria-label"),
    maskId: s.querySelector(".w-slider-mask")?.id ?? null,
    ariaLive: s.querySelector(".w-slider-aria-label")
      ? {
          cls: s.querySelector(".w-slider-aria-label").className,
          text: s.querySelector(".w-slider-aria-label").textContent,
          attrs: [...s.querySelector(".w-slider-aria-label").attributes].map(
            (a) => `${a.name}=${a.value}`
          ),
        }
      : null,
    navDots: [...(s.querySelector(".w-slider-nav")?.children ?? [])].map((c) => ({
      cls: c.className,
      text: c.textContent,
      style: c.getAttribute("style"),
      pressed: c.getAttribute("aria-pressed"),
    })),
    firstSlideStyle: s.querySelector(".w-slide")?.getAttribute("style") ?? null,
  })),
  tabs: [...document.querySelectorAll(".w-tabs")].map((t) => ({
    links: [...t.querySelectorAll(".w-tab-link")].map((l) => ({
      id: l.id,
      cls: l.className,
    })),
    panes: [...t.querySelectorAll(".w-tab-pane")].map((p) => ({
      id: p.id,
      cls: p.className,
    })),
    menuCurrent: t.querySelector(".w-tab-menu")?.getAttribute("data-current") ?? null,
  })),
}));

// Ambient loops: sample an element the page loops forever on, twice, to confirm
// the property that changes and its current phase.
report.ambient = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const sels = [
    "[move-opacty='ture']",
    "[contain-left-move-child='ture']",
    "[love-child='ture']",
    "[marku-slide='ture']",
    "[group-fast-move='ture']",
    "[group-secend-move='ture']",
    "[zome-in-zom-out='ture']",
    "[move-left-right='ture']",
    "[text-box-child='ture']",
  ];
  const snap = () =>
    sels.map((s) => {
      const el = document.querySelector(s);
      if (!el) return { s, missing: true };
      const cs = getComputedStyle(el);
      return { s, transform: cs.transform, opacity: cs.opacity };
    });
  const a = snap();
  await sleep(500);
  const b = snap();
  return { a, b };
});

await ctx.close();
await browser.close();

console.log(JSON.stringify(report, null, 2));