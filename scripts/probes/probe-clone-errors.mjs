// Load a cloned route in a real browser and dump every console message and
// page error with its stack, so runtime faults can be diagnosed from QA.
//
// Usage: node scripts/probe-clone-errors.mjs [--route=/about]
import { launch, parseArgs, LOCAL, open } from "../lib/qa.mjs";

const args = parseArgs();
const route = typeof args.route === "string" ? args.route : "/about";

const browser = await launch();
const context = await browser.newContext({
  viewport: { width: Number(args.width), height: Number(args.height) },
});
const page = await context.newPage();

const messages = [];
page.on("console", (m) => {
  messages.push({ type: m.type(), text: m.text(), loc: m.location() });
});
page.on("pageerror", (e) => {
  messages.push({
    type: "pageerror",
    text: e.message,
    stack: e.stack ? e.stack.slice(0, 2500) : null,
  });
});

await open(page, LOCAL + route, { settle: false });
await page.waitForTimeout(2500);

const state = await page.evaluate(() => ({
  htmlClasses: [...document.documentElement.classList],
  splitWords: document.querySelectorAll(".gsap_split_word").length,
  splitLetters: document.querySelectorAll(".gsap_split_letter").length,
  gsapRegistered: Boolean(window.gsap),
  scrollTriggerCount: window.ScrollTrigger
    ? window.ScrollTrigger.getAll().length
    : null,
  inlineStyled: [...document.querySelectorAll("[style]")]
    .filter((e) => /transform|opacity/.test(e.getAttribute("style") ?? ""))
    .slice(0, 12)
    .map((e) => ({
      cls: (e.className?.toString() ?? "").slice(0, 60),
      style: (e.getAttribute("style") ?? "").slice(0, 120),
    })),
}));

console.log(`=== ${route} ===`);
console.log(JSON.stringify(state, null, 2));
console.log("\n=== console ===");
for (const m of messages) {
  console.log(`[${m.type}] ${m.text}`);
  if (m.stack) console.log(m.stack);
  if (m.loc?.url) console.log(`   at ${m.loc.url}:${m.loc.lineNumber}`);
}

await context.close();
await browser.close();