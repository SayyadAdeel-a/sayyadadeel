// Focused probe: does clicking the clone's `.menu-button` drive the navigation
// timeline, and what state do the hamburger lines end up in?
import { launch, parseArgs, LOCAL, open } from "./lib/qa.mjs";

const args = parseArgs();
const route = typeof args.route === "string" ? args.route : "/about";

const browser = await launch();
const context = await browser.newContext({
  viewport: { width: Number(args.width), height: Number(args.height) },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await open(page, LOCAL + route, { settle: false });
await page.waitForTimeout(1500);

const before = await page.evaluate(() => {
  const read = (selector) => {
    const el = document.querySelector(selector);
    return el ? { inline: el.getAttribute("style"), display: getComputedStyle(el).display } : null;
  };
  const burger = document.querySelector(".menu-button");
  return {
    burgerExists: Boolean(burger),
    burgerVisible: burger ? getComputedStyle(burger).display !== "none" : null,
    burgerRect: burger ? burger.getBoundingClientRect().toJSON() : null,
    lines: {
      top: read(".hamburger-line-top"),
      middle: read(".hamburger-line-middle"),
      bottom: read(".hamburger-line-bottom"),
    },
    lineIds: [...document.querySelectorAll(".hamburger-line-top,.hamburger-line-middle,.hamburger-line-bottom")].map(
      (el) => ({ cls: el.className, id: el.id, target: (el.getAttribute("data-wf-target") ?? "").slice(0, 90) })
    ),
    dataWfTargetMatch: document.querySelectorAll(
      `[data-wf-target*='"24ca57b6-65bd-90cf-29f6-88f79a1acfa1","24ca57b6-65bd-90cf-29f6-88f79a1acfb1"']`
    ).length,
    wrap: read(".nav-menu-wrap"),
    menuWrapper: read(".menu-wrapper"),
  };
});

const clicked = await page.evaluate(async () => {
  const burger = document.querySelector(".menu-button");
  burger.click();
  await new Promise((r) => setTimeout(r, 900));
  const read = (selector) => {
    const el = document.querySelector(selector);
    return el ? { inline: el.getAttribute("style"), display: getComputedStyle(el).display } : null;
  };
  return {
    wrap: read(".nav-menu-wrap"),
    menuWrapper: read(".menu-wrapper"),
    top: read(".hamburger-line-top"),
    middle: read(".hamburger-line-middle"),
    bottom: read(".hamburger-line-bottom"),
  };
});

console.log("before:", JSON.stringify(before, null, 2));
console.log("after click:", JSON.stringify(clicked, null, 2));
console.log("errors:", errors);

await context.close();
await browser.close();