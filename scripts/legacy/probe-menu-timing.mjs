// Sample the clone's navigation-menu animation at several instants after a
// click, to see how its timeline progresses compared with the reference's
// settled end state.
import { launch, parseArgs, ORIGIN, LOCAL, open } from "./lib/qa.mjs";

const args = parseArgs();
const route = typeof args.route === "string" ? args.route : "/about";
const targets = { ref: ORIGIN, clone: LOCAL };

const browser = await launch();
for (const [label, base] of Object.entries(targets)) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await open(page, base + route, { settle: false });
  await page.waitForTimeout(1200);

  const samples = await page.evaluate(async () => {
    const out = [];
    const read = () => {
      const wrap = document.querySelector(".nav-menu-wrap");
      const inner = document.querySelector(".menu-wrapper");
      const top = document.querySelector(".hamburger-line-top");
      return {
        wrapDisplay: wrap ? getComputedStyle(wrap).display : null,
        innerOpacity: inner ? Number(getComputedStyle(inner).opacity).toFixed(4) : null,
        innerTransform: inner ? getComputedStyle(inner).transform : null,
        topTransform: top ? getComputedStyle(top).transform : null,
      };
    };
    out.push({ t: 0, ...read() });
    document.querySelector(".menu-button").click();
    for (const wait of [50, 150, 300, 600, 900, 1400, 2200]) {
      await new Promise((r) => setTimeout(r, wait - (out.at(-1)?.t ?? 0)));
      out.push({ t: wait, ...read() });
    }
    return out;
  });

  console.log(`\n=== ${label} ===`);
  for (const s of samples) {
    console.log(
      `${String(s.t).padStart(5)}ms  wrap=${s.wrapDisplay}  opacity=${s.innerOpacity}  inner=${s.innerTransform}  top=${s.topTransform}`
    );
  }
  await context.close();
}
await browser.close();