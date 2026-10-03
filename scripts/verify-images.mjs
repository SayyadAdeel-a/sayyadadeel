// Image parity across every cloned route: intrinsic size, rendered size,
// object-fit, `sizes`, and the candidate the browser actually selected.
//
// The clone serves local copies of every `srcset` variant so the browser picks
// the same candidate — and therefore the same intrinsic dimensions — as the
// reference at each viewport. This asserts that.
//
// Usage: node scripts/verify-images.mjs [--widths=1440,390]
import { launch, open, ORIGIN, LOCAL, parseArgs } from "./lib/qa.mjs";

const args = parseArgs();
const WIDTHS =
  typeof args.widths === "string"
    ? args.widths.split(",").map((w) => Number(w.trim()))
    : [1440, 390];

const routes = JSON.parse(
  await import("node:fs").then((fs) =>
    fs.readFileSync("docs/research/relab-0c02b053/routes.json", "utf8")
  )
).routes.map((r) => r.route);

/**
 * Image parity across every cloned route: which asset the browser selected, its
 * intrinsic size, `sizes`, the number of `srcset` candidates, `object-fit`, and
 * the rendered box.
 *
 * The clone serves local copies of every `srcset` variant so the browser picks
 * the same candidate — and therefore the same intrinsic dimensions — as the
 * reference at each viewport. This asserts that.
 *
 * `rendered` is only compared strictly for images that are not inside a
 * transformed ancestor; the rest sit at an arbitrary point of an infinite
 * ambient loop and are reported separately, exactly as the box comparison does.
 *
 * Usage: node scripts/verify-images.mjs [--widths=1440,390]
 */
const PROBE = () => {
  /**
   * An image rendered inside a transformed ancestor sits at an arbitrary point
   * of whatever animation drives that ancestor, so its *rendered* size is a
   * sampling artefact rather than a fidelity defect. An infinite ambient loop
   * is the usual cause on this site.
   *
   * Inlined because `page.evaluate` serialises this function, so it cannot close
   * over module scope.
   */
  const isIdentity = (transform) =>
    !transform ||
    transform === "none" ||
    /^matrix(3d)?\((1,\s*0,\s*0,?.*1,\s*0,\s*0)\)$/.test(transform.replace(/\s+/g, ""));

  const insideTransform = (element) => {
    let node = element;
    while (node && node !== document.documentElement) {
      if (!isIdentity(getComputedStyle(node).transform)) return true;
      node = node.parentElement;
    }
    return false;
  };

  return Array.from(document.querySelectorAll("img")).map((img) => {
    const cs = getComputedStyle(img);
    const rect = img.getBoundingClientRect();
    // Webflow puts a 24-hex content hash at the front of every asset filename,
    // which is the asset's real identity. The pool sanitises `%20` to `_` for
    // local paths, so comparing whole basenames would flag every space.
    const basename = (img.currentSrc || img.src).split("/").pop() ?? "";
    const asset = /^[0-9a-f]{24}_/.exec(basename)
      ? basename.slice(0, 25)
      : basename.replace(/-\d+x\d+(?=\.[a-z]+$)/i, "");
    return {
      cls: img.className?.toString().slice(0, 60) ?? "",
      natural: `${img.naturalWidth}x${img.naturalHeight}`,
      rendered: `${Math.round(rect.width * 100) / 100}x${
        Math.round(rect.height * 100) / 100
      }`,
      objectFit: cs.objectFit,
      sizes: img.getAttribute("sizes"),
      candidateCount: (img.getAttribute("srcset") ?? "")
        .split(",")
        .filter(Boolean).length,
      asset,
      phaseDependent: insideTransform(img),
    };
  });
};

async function collect(browser, base, route, width) {
  const context = await browser.newContext({
    viewport: { width, height: width < 992 ? 844 : 900 },
  });
  const page = await context.newPage();
  await open(page, base + route);
  const list = await page.evaluate(PROBE);
  await context.close();
  return list;
}

const browser = await launch();
let failures = 0;

for (const route of routes) {
  for (const width of WIDTHS) {
    const ref = await collect(browser, ORIGIN, route, width);
    const clone = await collect(browser, LOCAL, route, width);
    const diffs = [];
    const loopPhase = [];
    if (ref.length !== clone.length) {
      diffs.push(`count: ref=${ref.length} clone=${clone.length}`);
    }
    for (let i = 0; i < Math.min(ref.length, clone.length); i++) {
      const a = ref[i];
      const b = clone[i];
      const fields = [];
      for (const k of [
        "natural",
        "rendered",
        "objectFit",
        "sizes",
        "asset",
        "candidateCount",
      ]) {
        if (String(a[k]) !== String(b[k])) fields.push(`${k}: ref=${a[k]} clone=${b[k]}`);
      }
      if (!fields.length) continue;
      // An image inside a transformed ancestor renders at an arbitrary point of
      // an infinite ambient loop; report it, but do not fail on it.
      if (a.phaseDependent && fields.every((f) => f.startsWith("rendered:"))) {
        loopPhase.push(`#${i} ${a.cls}: ${fields.join("; ")}`);
        continue;
      }
      diffs.push(`#${i} ${a.cls}: ${fields.join("; ")}`);
    }
    const ok = diffs.length === 0;
    if (!ok) failures += 1;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${route.padEnd(50)} ${String(width).padEnd(5)} ` +
        `images=${String(ref.length).padStart(3)} differences=${diffs.length}` +
        (loopPhase.length ? ` loop-phase=${loopPhase.length}` : "")
    );
    for (const diff of diffs.slice(0, 8)) console.log(`      ${diff}`);
  }
}

await browser.close();
console.log(
  `\n${failures === 0 ? "every image matches" : `${failures} route-viewport combination(s) differ`}`
);
process.exitCode = failures === 0 ? 0 : 1;