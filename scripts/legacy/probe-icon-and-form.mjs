// Compare the two remaining behavioural questions against the reference:
// the cursor-tracked icon (`[icon-btn-anim]`) and the newsletter form submit.
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
  await open(page, base + route);

  /* --- cursor-tracked icon, with a real pointer move --- */
  await page.evaluate(() => {
    document
      .querySelector("[icon-btn-anim]")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await page.waitForTimeout(1500);
  const box = await page.evaluate(() => {
    const host = document.querySelector("[icon-btn-anim]");
    if (!host) return null;
    const r = host.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  let cursor = null;
  if (box) {
    await page.waitForTimeout(600);
    const before = await page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector("[icon-btn-anim] .icon.icon-button-icon")
        ).transform
    );
    await page.mouse.move(box.x + box.w * 0.5, box.y + box.h * 0.5);
    await page.waitForTimeout(300);
    const centre = await page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector("[icon-btn-anim] .icon.icon-button-icon")
        ).transform
    );
    await page.mouse.move(box.x + box.w * 0.95, box.y + box.h * 0.95, { steps: 8 });
    await page.waitForTimeout(1500);
    const corner = await page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector("[icon-btn-anim] .icon.icon-button-icon")
        ).transform
    );
    await page.mouse.move(box.x + box.w * 0.05, box.y + box.h * 0.05, { steps: 8 });
    await page.waitForTimeout(1500);
    const other = await page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector("[icon-btn-anim] .icon.icon-button-icon")
        ).transform
    );
    cursor = { before, centre, corner, other };
  }

  /* --- newsletter form submit, with a long wait --- */
  const form = await page.evaluate(async () => {
    const f = document.querySelector(".w-form form");
    if (!f) return null;
    const done = f.parentElement.querySelector(".w-form-done");
    const fail = f.parentElement.querySelector(".w-form-fail");
    const read = () => ({
      done: done ? getComputedStyle(done).display : null,
      fail: fail ? getComputedStyle(fail).display : null,
      form: getComputedStyle(f).display,
    });
    const before = read();
    const input = f.querySelector("input[type=email]");
    if (input) {
      input.value = "test@example.com";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 2500));
    return { before, after: read() };
  });

  console.log(`\n=== ${label} (${route} @${args.width}) ===`);
  console.log("cursorIcon:", JSON.stringify(cursor));
  console.log("form      :", JSON.stringify(form));

  await context.close();
}

await browser.close();