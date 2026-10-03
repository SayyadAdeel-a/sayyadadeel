// When `.button` is hovered, which `.button-normal-text` labels actually move?
//
// This is the open question behind the mobile hover defect. The payload targets
// `.button-normal-text` document-wide (`relationship: "none"`), but the
// reference moves only ~55 split characters per hover — about four labels —
// where a single shared timeline over the whole page moves up to 127, every
// label. The site's own critical stylesheet scopes the same class to
// `[data-wf-component-id="90522a0b-…"]`, which suggests Webflow resolves a
// component's class targets inside that component rather than across the
// document.
//
// If the labels that move all sit inside one component, that is the mechanism,
// and it is what the clone's runtime is missing.
//
// Usage: node scripts/probes/probe-hover-scope.mjs [route] [width]
import { launch, open, ORIGIN, LOCAL, waitForScrollIdle } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/";
const width = Number(process.argv[3] ?? 1440);

/** Install a dense recorder over every `.button-normal-text` leaf on the page. */
const START = () => {
  const r2 = (n) => Math.round(n * 100) / 100;
  const decompose = (t) => {
    if (!t || t === "none") return null;
    const m = /matrix(3d)?\(([^)]+)\)/.exec(t);
    if (!m) return null;
    const v = m[2].split(",").map(Number);
    return v.length > 6 ? v[13] : v[5];
  };
  const labels = [...document.querySelectorAll(".button-normal-text")];
  const meta = labels.map((el) => {
    // Nearest ancestor carrying a Webflow component id, which is the boundary
    // the hypothesis is about.
    let node = el;
    let component = null;
    while (node && node !== document.body) {
      const id = node.getAttribute?.("data-wf-component-id");
      if (id) {
        component = id;
        break;
      }
      node = node.parentElement;
    }
    return {
      chars: [...el.querySelectorAll("span")].filter((s) =>
        s.className?.toString().includes("gsap_split_letter")
      ).length,
      component,
      visible: el.getBoundingClientRect().height > 0,
    };
  });
  const read = () =>
    labels.map((el) =>
      [...el.querySelectorAll("span")]
        .filter((s) => s.className?.toString().includes("gsap_split_letter"))
        .map((c) => decompose(getComputedStyle(c).transform)?.ty ?? 0)
    );

  const frames = [];
  const started = performance.now();
  let running = true;
  const tick = () => {
    frames.push(read());
    if (running && performance.now() - started < 1200) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.__rec = {
    frames,
    stop: () => {
      running = false;
    },
  };
  return meta;
};

const STOP = () => {
  window.__rec?.stop();
  return { frames: window.__rec?.frames ?? [] };
};

const browser = await launch();
for (const [label, base] of [
  ["ref", ORIGIN],
  ["clone", LOCAL],
]) {
  const context = await browser.newContext({
    viewport: { width, height: width < 992 ? 844 : 900 },
  });
  const page = await context.newPage();
  await open(page, base + route);

  const buttons = await page.evaluate(() =>
    [...document.querySelectorAll(".button")]
      .map((el, i) => {
        const rect = el.getBoundingClientRect();
        return {
          i,
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          x: Math.round(rect.x),
          y: Math.round(rect.y + window.scrollY),
        };
      })
      .filter((b) => b.w > 0 && b.h > 0)
  );
  if (!buttons.length) {
    console.log(`\n=== ${label} === no visible .button`);
    await context.close();
    continue;
  }
  const target = page.locator(".button").nth(buttons[0].i);
  await target.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {});
  await waitForScrollIdle(page);
  await page.waitForTimeout(400);
  const box = await target.boundingBox();
  if (!box) {
    await context.close();
    continue;
  }

  const meta = await page.evaluate(START);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(300);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(700);
  const { frames } = await page.evaluate(STOP);

  // Which labels moved at all, and which component do they belong to?
  const moved = meta.map((m, i) => {
    let peak = 0;
    for (const frame of frames) {
      const chars = frame[i] ?? [];
      for (const ty of chars) peak = Math.max(peak, Math.abs(ty));
    }
    return { ...m, peak: Math.round(peak * 10) / 10, moved: peak > 1 };
  });

  const movedLabels = moved.filter((m) => m.moved);
  const components = new Set(
    movedLabels.map((m) => m.component ?? "(document)")
  );
  const visibleLabels = moved.filter((m) => m.visible);

  console.log(`\n=== ${label} ${route} @${width} ===`);
  console.log(
    `  hovering .button[${buttons[0].i}]: ${meta.length} label(s) on the page, ` +
      `${movedLabels.length} moved, ${visibleLabels.length} visible, ` +
      `${movedLabels.reduce((n, m) => n + m.chars, 0)} characters in motion`
  );
  console.log(`  components owning the moved labels: ${[...components].join(", ")}`);
  console.log(
    `  visible labels on the page: ${visibleLabels.length}; ` +
      `visible and moved: ${visibleLabels.filter((m) => m.moved).length}`
  );
  for (const m of moved) {
    console.log(
      `    ${m.moved ? "MOVED  " : "still  "} chars=${String(m.chars).padStart(3)} ` +
        `peak=${String(m.peak).padStart(6)}px visible=${m.visible} ` +
        `component=${m.component ?? "(document)"}`
    );
  }
  await context.close();
}
await browser.close();