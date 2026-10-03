// How fast does a page's autoplaying slider advance on the reference vs the
// clone? The slider's own `aria-live` label is the observable signal.
//
// Usage: node scripts/probe-slider-autoplay.mjs [route] [width]
import { launch, parseArgs, ORIGIN, LOCAL, open } from "../lib/qa.mjs";

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

  const attrs = await page.evaluate(() => {
    const slider = document.querySelector(".w-slider");
    if (!slider) return null;
    return { ...slider.dataset };
  });

  const trace = await page.evaluate(async () => {
    const read = () =>
      document
        .querySelector(".w-slider .w-slider-aria-label")
        ?.textContent ?? null;
    const out = [];
    for (let i = 0; i < 12; i++) {
      out.push({ t: i * 1000, label: read() });
      await new Promise((r) => setTimeout(r, 1000));
    }
    return out;
  });

  console.log(`\n=== ${label} (${route} @${args.width}) ===`);
  console.log(`  data: ${JSON.stringify(attrs)}`);
  for (const row of trace) console.log(`  ${String(row.t).padStart(6)}ms  ${row.label}`);

  await context.close();
}
await browser.close();