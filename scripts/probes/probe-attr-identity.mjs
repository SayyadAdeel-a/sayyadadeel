// Resolve, in a single page load and a single evaluate, whether
// `[group-fedup-move-pfriend]` matches anything — and if not, what the real
// attribute name is, codepoint by codepoint.
//
// Why this needs to be airtight: two probes on the same route disagree. One
// reported 5 matches, another 0, and a third saw the attribute in an
// `element.attributes` listing *in the same evaluate* where the selector matched
// nothing. `element.attributes` reads the parsed DOM; `querySelectorAll` goes
// through CSS ident parsing. The two can only disagree if the name contains a
// character that CSS treats differently from the HTML parser — and that
// distinction decides whether a `wf:scroll` ScrollTrigger binds at all, which is
// exactly what the reveal audit is failing on.
//
// Usage: node scripts/probe-attr-identity.mjs [route]
import { launch, open, ORIGIN, LOCAL } from "../lib/qa.mjs";

const route = process.argv[2] ?? "/";

const PROBE_ATTR = "group-fedup-move-pfriend";

/** Runs in the page. */
const IDENTIFY = ({ probe }) => {
  const describe = (name) => ({
    name,
    codepoints: [...name].map((c) => c.codePointAt(0)),
    isAscii: [...name].every((c) => c.codePointAt(0) < 128),
    // Is this string usable as a CSS ident inside an attribute selector?
    cssIdentSafe: /^[A-Za-z_-][A-Za-z0-9_-]*$/.test(name),
  });

  // Every attribute on the page whose name contains "friend".
  const found = new Map();
  for (const el of document.querySelectorAll("*")) {
    for (const attr of el.attributes) {
      if (!attr.name.includes("friend")) continue;
      const key = attr.name;
      if (!found.has(key)) {
        found.set(key, {
          ...describe(key),
          values: new Set(),
          count: 0,
          samples: [],
        });
      }
      const bucket = found.get(key);
      bucket.count += 1;
      bucket.values.add(attr.value);
      if (bucket.samples.length < 3) {
        bucket.samples.push(
          `<${el.tagName.toLowerCase()} class="${el.className?.toString().slice(0, 46) ?? ""}">`
        );
      }
    }
  }

  const attributes = [...found.values()].map((bucket) => ({
    ...bucket,
    values: [...bucket.values],
  }));

  // Now the selector test, for each candidate name, in three forms.
  const selectorResults = attributes.map((bucket) => {
    const bare = (() => {
      try {
        return document.querySelectorAll(`[${bucket.name}]`).length;
      } catch (error) {
        return `THROWS ${error.message}`;
      }
    })();
    const quoted = (() => {
      try {
        return document.querySelectorAll(
          `[${JSON.stringify(bucket.name)}]`
        ).length;
      } catch (error) {
        return `THROWS ${error.message}`;
      }
    })();
    const byAttribute = [...document.querySelectorAll("*")].filter((el) =>
      [...el.attributes].some((a) => a.name === bucket.name)
    ).length;
    return { name: bucket.name, bare, quoted, byAttribute, count: bucket.count };
  });

  return {
    probed: probe,
    attributes,
    selectorResults,
    // Sanity: does the probe string itself behave as a normal attribute name?
    probeSelectorMatches: (() => {
      try {
        return document.querySelectorAll(`[${probe}]`).length;
      } catch (error) {
        return `THROWS ${error.message}`;
      }
    })(),
    probeAsAttributeCount: [...document.querySelectorAll("*")].filter((el) =>
      [...el.attributes].some((a) => a.name === probe)
    ).length,
  };
};

const browser = await launch();
for (const [label, base] of [
  ["ref", ORIGIN],
  ["clone", LOCAL],
]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await open(page, base + route, { settle: false });
  await page.waitForTimeout(1500);
  const out = await page.evaluate(IDENTIFY, { probe: PROBE_ATTR });

  console.log(`\n=== ${label} ${route} ===`);
  console.log(
    `  probe "${out.probed}": querySelectorAll=${out.probeSelectorMatches}, ` +
      `attribute-name scan=${out.probeAsAttributeCount}`
  );
  for (const bucket of out.attributes) {
    console.log(
      `  attribute ${JSON.stringify(bucket.name)} x${bucket.count} ` +
        `values=${JSON.stringify(bucket.values)} ` +
        `ascii=${bucket.isAscii} cssIdentSafe=${bucket.cssIdentSafe}`
    );
    console.log(`      codepoints ${JSON.stringify(bucket.codepoints)}`);
    for (const sample of bucket.samples) console.log(`      on ${sample}`);
  }
  for (const row of out.selectorResults) {
    console.log(
      `  selector check ${JSON.stringify(row.name)}: bare=${row.bare} ` +
        `quoted=${row.quoted} attributeScan=${row.byAttribute} (count=${row.count})`
    );
  }
  await context.close();
}
await browser.close();