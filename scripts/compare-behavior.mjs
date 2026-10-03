// Behavioural parity harness: runs the same scripted interactions against the
// reference and the clone, then compares the resulting DOM state.
//
// Usage: node scripts/compare-behavior.mjs [--width=1440] [--height=900]
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright")
);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const WIDTH = Number(args.width ?? 1440);
const HEIGHT = Number(args.height ?? 900);
const REFERENCE = "https://relab-template.webflow.io/";
const LOCAL = process.env.LOCAL_URL ?? "http://localhost:3100/";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(url) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 200));
  });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await sleep(2600);

  const results = {};

  const snap = (sel, props) =>
    page.evaluate(
      ({ sel, props }) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = getComputedStyle(el);
        const o = {};
        for (const p of props) o[p] = p.startsWith("--") ? cs.getPropertyValue(p) : cs[p];
        return o;
      },
      { sel, props }
    );

  const scrollTo = async (y) => {
    await page.evaluate(async (target) => {
      const step = Math.max(150, Math.round(window.innerHeight * 0.7));
      let cur = window.scrollY;
      while (cur < target) {
        cur = Math.min(target, cur + step);
        window.scrollTo(0, cur);
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 35)));
      }
      window.scrollTo(0, target);
    }, y);
    await sleep(1100);
  };

  /* --- 1. Button hover: label roll + arrow rotation --- */
  const button = await page.$(".nav-button-wrap .button");
  if (button && (await button.isVisible())) {
    await button.hover();
    await sleep(320);
    results.buttonHover = await snap(
      ".nav-button-wrap .button",
      ["transform"]
    );
    results.buttonHoverIcon = await snap(
      ".nav-button-wrap [button-icon-anin-one]",
      ["transform"]
    );
    results.buttonHoverChars = await page.evaluate(() => {
      const first = document.querySelector(
        ".nav-button-wrap .button-normal-text .gsap_split_letter"
      );
      return first ? getComputedStyle(first).transform : null;
    });
    await page.mouse.move(0, 0);
    await sleep(600);
  }

  /* --- 2. Hero intro tabs --- */
  const heroCard2 = await page.$(".hero-intro-card-box:nth-of-type(2)");
  if (heroCard2 && (await heroCard2.isVisible())) {
    await heroCard2.click();
    await sleep(700);
    results.heroTab = await page.evaluate(() => ({
      activeCards: [...document.querySelectorAll(".hero-intro-card-box")].map((c) =>
        c.classList.contains("is-active")
      ),
      hiddenImages: [...document.querySelectorAll(".single-image-wrap")].map((i) =>
        i.classList.contains("is-tab-hidden")
      ),
      visibleOpacity: [...document.querySelectorAll(".single-image-wrap")].map(
        (i) => getComputedStyle(i).opacity
      ),
    }));
  }

  /* --- 3. Our-clients tabs --- */
  const tab3 = await page.$('.w-tab-link[data-w-tab="Tab 3"]');
  if (tab3 && (await tab3.isVisible())) {
    await tab3.click();
    await sleep(600);
    results.clientTabs = await page.evaluate(() => ({
      current: [...document.querySelectorAll(".w-tab-link")].map((l) =>
        l.classList.contains("w--current")
      ),
      activePanes: [...document.querySelectorAll(".w-tab-pane")].map((p) =>
        p.classList.contains("w--tab-active")
      ),
    }));
  }

  /* --- 4. Services slider arrows --- */
  const right = await page.$(".selider-section .right-arrow");
  if (right && (await right.isVisible())) {
    await right.scrollIntoViewIfNeeded();
    await sleep(900);
    await right.click();
    await sleep(1100);
    results.sliderAfterNext = await page.evaluate(() => ({
      transforms: [...document.querySelectorAll(".services-mask .w-slide")].map(
        (s) => getComputedStyle(s).transform
      ),
      transition: document.querySelector(".services-mask .w-slide")
        ?.getAttribute("style"),
      activeDots: [
        ...document.querySelectorAll(".services-slider .w-slider-dot"),
      ].map((d) => d.classList.contains("w-active")),
    }));
    const leftArrow = await page.$(".selider-section .left-arrow");
    if (leftArrow && (await leftArrow.isVisible())) {
      await leftArrow.click();
      await sleep(1100);
      results.sliderAfterPrev = await page.evaluate(() => ({
        transforms: [...document.querySelectorAll(".services-mask .w-slide")].map(
          (s) => getComputedStyle(s).transform
        ),
        activeDots: [
          ...document.querySelectorAll(".services-slider .w-slider-dot"),
        ].map((d) => d.classList.contains("w-active")),
      }));
    }
  }

  /* --- 5. Process slider --- */
  const processNext = await page.$(".process-slider .w-slider-arrow-right");
  if (processNext && (await processNext.isVisible())) {
    await processNext.scrollIntoViewIfNeeded();
    await sleep(800);
    await processNext.click();
    await sleep(900);
    results.processSlider = await page.evaluate(() => ({
      transforms: [...document.querySelectorAll(".process-slider .w-slide")].map(
        (s) => getComputedStyle(s).transform
      ),
      activeDots: [...document.querySelectorAll(".process-slider .w-slider-dot")].map(
        (d) => d.classList.contains("w-active")
      ),
      numeric: document.querySelector(".process-slider .w-slider-nav")?.className,
    }));
  }

  /* --- 6. Card image hover zoom --- */
  const cardHost = await page.$("[card-image-hover-priend]");
  if (cardHost && (await cardHost.isVisible())) {
    await cardHost.scrollIntoViewIfNeeded();
    await sleep(700);
    await cardHost.hover();
    await sleep(800);
    results.cardHover = await snap("[card-image-hover-child='ture']", ["transform"]);
    await page.mouse.move(0, 0);
    await sleep(700);
  }

  /* --- 7. Hover-child scale (hero intro badge) --- */
  const hoverHost = await page.$("[hover-pfriend]");
  if (hoverHost && (await hoverHost.isVisible())) {
    await hoverHost.scrollIntoViewIfNeeded();
    await sleep(600);
    await hoverHost.hover();
    await sleep(800);
    results.hoverChild = await snap("[hover-child='ture']", ["transform"]);
    await page.mouse.move(0, 0);
    await sleep(600);
  }

  /* --- 8. Background video play/pause --- */
  const playBtn = await page.$(".w-backgroundvideo-backgroundvideoplaypausebutton");
  if (playBtn && (await playBtn.isVisible())) {
    await playBtn.scrollIntoViewIfNeeded();
    await sleep(700);
    results.videoBefore = await page.evaluate(() => {
      const v = document.querySelector(".w-background-video video");
      return v ? { paused: v.paused, hasSrc: !!v.currentSrc } : null;
    });
    await playBtn.click();
    await sleep(500);
    results.videoAfter = await page.evaluate(() => {
      const v = document.querySelector(".w-background-video video");
      const play = document.querySelector(".play-state");
      const pause = document.querySelector(".pause-state");
      return {
        paused: v ? v.paused : null,
        playHidden: play ? play.hidden : null,
        pauseHidden: pause ? pause.hidden : null,
      };
    });
    await playBtn.click();
    await sleep(400);
  }

  /* --- 9. Scroll reveals --- */
  await scrollTo(0);
  results.revealsAtTop = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).opacity : null;
    };
    return {
      fadeUpBelowFold: pick(".pricing-section .section-label"),
      groupFedupBelowFold: pick(".our-clients-section .h2"),
    };
  });

  const pricing = await page.$(".pricing-section");
  if (pricing && (await pricing.isVisible())) {
    await pricing.scrollIntoViewIfNeeded();
    await sleep(1500);
    results.revealsAfterScroll = await page.evaluate(() => {
      const pick = (sel) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).opacity : null;
      };
      return {
        pricingLabel: pick(".pricing-section .section-label"),
        clientsHeading: pick(".our-clients-section .h2"),
      };
    });
  }

  /* --- 10. Sticky creators convergence --- */
  const sectionY = await page.evaluate(() => {
    const el = document.querySelector(".our-creators-section");
    return el ? el.getBoundingClientRect().top + window.scrollY : null;
  });
  if (sectionY !== null) {
    await scrollTo(sectionY + 400);
    await sleep(700);
    results.creatorsMid = await page.evaluate(
      () => [
        Math.round(window.scrollY),
        ...["box-one", "box-two", "box-three", "box-four"].map((c) => {
          const el = document.querySelector(`.${c}`);
          return el ? getComputedStyle(el).transform : null;
        }),
      ]
    );
    await scrollTo(sectionY + 1400);
    await sleep(700);
    results.creatorsEnd = await page.evaluate(
      () => [
        Math.round(window.scrollY),
        ...["box-one", "box-two", "box-three", "box-four"].map((c) => {
          const el = document.querySelector(`.${c}`);
          return el ? getComputedStyle(el).transform : null;
        }),
      ]
    );
  }

  /* --- 11. Marquee is animating --- */
  const marquee = await page.evaluate(async () => {
    const el = document.querySelector("[marku-slide='ture']");
    if (!el) return null;
    const first = getComputedStyle(el).transform;
    await new Promise((r) => setTimeout(r, 700));
    const second = getComputedStyle(el).transform;
    return { changed: first !== second };
  });
  results.marquee = marquee;

  /* --- 12. Mobile menu toggle --- */
  if (WIDTH < 992) {
    const burger = await page.$(".menu-button");
    if (burger && (await burger.isVisible())) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(400);
      await burger.click();
      await sleep(800);
      results.menuOpen = await page.evaluate(() => {
        const wrap = document.querySelector(".nav-menu-wrap");
        const inner = document.querySelector(".menu-wrapper");
        const top = document.querySelector(".hamburger-line-top");
        const mid = document.querySelector(".hamburger-line-middle");
        return {
          wrapDisplay: wrap ? getComputedStyle(wrap).display : null,
          innerOpacity: inner ? getComputedStyle(inner).opacity : null,
          topTransform: top ? getComputedStyle(top).transform : null,
          midOpacity: mid ? getComputedStyle(mid).opacity : null,
        };
      });
      await burger.click();
      await sleep(800);
      results.menuClosed = await page.evaluate(() => {
        const wrap = document.querySelector(".nav-menu-wrap");
        const inner = document.querySelector(".menu-wrapper");
        return {
          wrapDisplay: wrap ? getComputedStyle(wrap).display : null,
          innerOpacity: inner ? getComputedStyle(inner).opacity : null,
        };
      });
    }
  }

  results.errors = [...new Set(errors)];
  await context.close();
  return results;
}

const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ??
    process.env.LOCALAPPDATA +
      "\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
});

const ref = await run(REFERENCE);
const clone = await run(LOCAL);
await browser.close();

const keys = [
  ...new Set([...Object.keys(ref), ...Object.keys(clone)]),
];
let mismatches = 0;
for (const k of keys) {
  const a = JSON.stringify(ref[k]);
  const b = JSON.stringify(clone[k]);
  if (a === b) {
    console.log(`OK    ${k}`);
  } else {
    mismatches += 1;
    console.log(`DIFF  ${k}`);
    console.log(`        ref  : ${a}`);
    console.log(`        clone: ${b}`);
  }
}
console.log(
  `\n${mismatches} mismatch(es) out of ${keys.length} behaviour checks @ ${WIDTH}x${HEIGHT}`
);