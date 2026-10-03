// Decisive test for the `[icon-btn-anim]` continuous mouse-move interaction:
// drive a slow, human-like pointer path across the element and report the
// icon's transform at several offsets, on both the reference and the clone.
import { launch, parseArgs, ORIGIN, LOCAL, open } from "./lib/qa.mjs";

const args = parseArgs();
const route = typeof args.route === "string" ? args.route : "/about";

const browser = await launch();

for (const [label, base] of [
  ["ref", ORIGIN],
  ["clone", LOCAL],
]) {
  const context = await browser.newContext({
    viewport: { width: Number(args.width), height: Number(args.height) },
  });
  const page = await context.newPage();
  const messages = [];
  page.on("pageerror", (e) => messages.push("pageerror: " + e.message.slice(0, 160)));
  page.on("console", (m) => {
    if (m.type() === "error") messages.push("console: " + m.text().slice(0, 160));
  });

  await open(page, base + route);

  // Park the pointer far away, scroll the element into view, wait for Lenis.
  await page.mouse.move(5, 5);
  await page.evaluate(() => {
    document
      .querySelector("[icon-btn-anim]")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await page.waitForTimeout(2000);

  const read = () =>
    page.evaluate(() => {
      const icons = [...document.querySelectorAll("[icon-btn-anim]")];
      return icons.map((host) => {
        const icon = host.querySelector(".icon.icon-button-icon");
        const r = host.getBoundingClientRect();
        return {
          rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width)],
          transform: icon ? getComputedStyle(icon).transform : null,
        };
      });
    });

  const targets = [0.1, 0.5, 0.9];
  const trace = [];
  for (const t of targets) {
    const box = await page.evaluate(() => {
      const host = document.querySelectorAll("[icon-btn-anim]")[0];
      const r = host.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (!box.w) break;
    // Approach from outside the element, then traverse to the sample point.
    await page.mouse.move(box.x - 40, box.y + box.h / 2, { steps: 10 });
    await page.mouse.move(box.x + box.w * t, box.y + box.h / 2, { steps: 25 });
    await page.waitForTimeout(1800);
    trace.push({ t, icons: await read() });
  }

  console.log(`\n=== ${label} ===`);
  for (const row of trace) {
    console.log(`  t=${row.t}`);
    for (const icon of row.icons) {
      console.log(`    rect=${icon.rect.join(",")}  ${icon.transform}`);
    }
  }
  if (messages.length) {
    console.log("  messages:");
    for (const m of [...new Set(messages)].slice(0, 6)) console.log("    " + m);
  }

  await context.close();
}

await browser.close();