// Print the exact bytes of every attribute name on a page's elements, plus what a
// CSS attribute selector matches for each.
//
// Why: `probe-reveal-binding.mjs` reported `[group-fedup-move-pfriend]` matching
// 0 elements while the same element's ancestor chain printed
// `[group-fedup-move-pfriend="ture"]`. One of those two is wrong, and which one
// decides whether a ScrollTrigger binds at all. Webflow writes these hook
// attributes straight from its editor, so a look-alike character (a non-breaking
// hyphen, a Cyrillic homoglyph) would be invisible in a terminal but would make
// every CSS selector miss — while `element.attributes[i].name` still reports the
// name, because that comes from the parsed DOM rather than from a selector.
//
// Usage: node scripts/probe-attr-bytes.mjs [route]
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/";

/** Runs in the page. */
const SCAN = () => {
  const interesting = /fedup|fade|friend|parent|child|slide|marquee|marku/i;
  const seen = new Map(); // attribute name -> { count, codes, sample }
  for (const el of document.querySelectorAll("*")) {
    for (const attr of el.attributes) {
      if (!interesting.test(attr.name) && !interesting.test(attr.value)) continue;
      const existing = seen.get(attr.name) ?? {
        count: 0,
        codes: [...attr.name].map((c) => c.codePointAt(0)),
        valueCodes: [...attr.value].map((c) => c.codePointAt(0)),
        sample: el.className?.toString().slice(0, 50) ?? el.tagName,
      };
      existing.count += 1;
      seen.set(attr.name, existing);
    }
  }

  // For each distinct name, does a CSS attribute selector actually match?
  const selectable = [];
  for (const [name, info] of seen) {
    let matches;
    try {
      matches = document.querySelectorAll(`[${name}]`).length;
    } catch (error) {
      matches = `THROWS: ${error.message}`;
    }
    // And does it match when quoted?
    let quoted;
    try {
      quoted = document.querySelectorAll(`[${name}="${info.valueCodes.length ? String.fromCodePoint(...info.valueCodes) : ""}"]`).length;
    } catch (error) {
      quoted = `THROWS: ${error.message}`;
    }
    selectable.push({
      name,
      count: info.count,
      nameCodes: info.codes,
      value: String.fromCodePoint(...info.valueCodes),
      unquotedMatches: matches,
      quotedMatches: quoted,
      sample: info.sample,
    });
  }
  return selectable;
};

const browser = await launch();
for (const [label, base] of [
  ["ref", ORIGIN],
  ["clone", LOCAL],
]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await open(page, base + route, { settle: false });
  const rows = await page.evaluate(SCAN);
  console.log(`\n=== ${label} ${route} ===`);
  for (const row of rows) {
    const suspicious = row.nameCodes.some((c) => c > 126);
    console.log(
      `  ${suspicious ? "SUSPICIOUS" : "ascii    "} ${JSON.stringify(row.name)} x${row.count}` +
        `  value=${JSON.stringify(row.value)}` +
        `  [attr]matches=${row.unquotedMatches} [attr="v"]matches=${row.quotedMatches}`
    );
    console.log(`      codepoints: ${JSON.stringify(row.nameCodes)}`);
    console.log(`      on: .${row.sample}`);
  }
  await context.close();
}
await browser.close();