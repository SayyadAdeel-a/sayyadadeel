// How does Webflow's tab runtime show/hide panes? Probe display, opacity,
// visibility and the `data-current` attribute before and after a tab click, on
// both the reference and the clone.
import { launch, parseArgs, ORIGIN, LOCAL, open } from "./lib/qa.mjs";

const args = parseArgs();
const route = typeof args.route === "string" ? args.route : "/case-studies";

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

  const read = () =>
    page.evaluate(() => {
      const readPane = (pane) => {
        const cs = getComputedStyle(pane);
        return {
          cls: pane.className,
          inline: pane.getAttribute("style"),
          display: cs.display,
          opacity: cs.opacity,
          visibility: cs.visibility,
          height: cs.height,
        };
      };
      return {
        menuCurrent: document
          .querySelector(".w-tab-menu")
          ?.getAttribute("data-current"),
        menuInline: document
          .querySelector(".w-tab-menu")
          ?.getAttribute("style"),
        links: [...document.querySelectorAll(".w-tab-link")].map((l) => ({
          cls: l.className,
          inline: l.getAttribute("style"),
          current: l.getAttribute("aria-current"),
        })),
        panes: [...document.querySelectorAll(".w-tab-pane")].map(readPane),
      };
    });

  const before = await read();
  const tab = await page.$(".w-tab-link:not(.w--current)");
  if (tab) {
    await tab.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await tab.click();
    await page.waitForTimeout(900);
  }
  const after = await read();

  console.log(`\n=== ${label} (${route} @${args.width}) ===`);
  console.log("before:", JSON.stringify(before, null, 1));
  console.log("after :", JSON.stringify(after, null, 1));

  await context.close();
}
await browser.close();