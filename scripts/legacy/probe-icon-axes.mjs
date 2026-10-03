// Does the reference's `mouseY` channel respond to vertical pointer movement?
// The icon is hovered at several vertical offsets and its transform reported.
import { launch, parseArgs, ORIGIN, LOCAL, open, waitForScrollIdle } from "./lib/qa.mjs";

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
  await open(page, base + route);
  await page.mouse.move(5, 5);
  await page.evaluate(() => {
    document
      .querySelector("[icon-btn-anim]")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await waitForScrollIdle(page);
  await page.waitForTimeout(600);

  const boxes = await page.evaluate(() => {
    const host = document.querySelector("[icon-btn-anim]");
    const icon = host.querySelector(".icon.icon-button-icon");
    const h = host.getBoundingClientRect();
    const i = icon.getBoundingClientRect();
    return {
      host: [h.x, h.y, h.width, h.height],
      icon: [i.x, i.y, i.width, i.height],
    };
  });
  console.log(`\n=== ${label} ===`);
  console.log(`  host rect: ${boxes.host.join(", ")}`);
  console.log(`  icon rect: ${boxes.icon.join(", ")}`);

  for (const fy of [0.1, 0.5, 0.9]) {
    const box = await page.evaluate(() => {
      const host = document.querySelector("[icon-btn-anim]");
      const icon = host.querySelector(".icon.icon-button-icon");
      const h = host.getBoundingClientRect();
      const i = icon.getBoundingClientRect();
      return {
        hx: h.x,
        hy: h.y,
        hw: h.width,
        hh: h.height,
        ix: i.x,
        iy: i.y,
        iw: i.width,
        ih: i.height,
      };
    });
    // Point at the same *host-relative* vertical position each time.
    const targetX = box.hx + box.hw * 0.5;
    const targetY = box.hy + box.hh * fy;
    await page.mouse.move(box.hx - 40, targetY, { steps: 8 });
    await page.mouse.move(targetX, targetY, { steps: 20 });
    await page.waitForTimeout(1800);
    const transform = await page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector("[icon-btn-anim] .icon.icon-button-icon")
        ).transform
    );
    console.log(
      `  host-fy=${fy}  pointer=(${targetX.toFixed(1)}, ${targetY.toFixed(1)})` +
        `  icon-fy=${((targetY - box.iy) / box.ih).toFixed(4)}  ->  ${transform}`
    );
  }

  await context.close();
}
await browser.close();