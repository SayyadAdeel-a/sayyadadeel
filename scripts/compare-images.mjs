// Compare every <img> on the reference and the clone: intrinsic size,
// rendered size, srcset/sizes attributes and object-fit.
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright")
);

const width = Number(process.argv[2] ?? 1440);
const height = Number(process.argv[3] ?? 900);

const probe = () =>
  JSON.stringify(
    Array.from(document.querySelectorAll("img")).map((img) => {
      const cs = getComputedStyle(img);
      const r = img.getBoundingClientRect();
      return {
        cls: img.className,
        parentCls: img.parentElement?.className,
        nat: `${img.naturalWidth}x${img.naturalHeight}`,
        attr: img.getAttribute("width")
          ? `${img.getAttribute("width")}x${img.getAttribute("height")}`
          : null,
        rendered: `${Math.round(r.width * 100) / 100}x${Math.round(r.height * 100) / 100}`,
        objectFit: cs.objectFit,
        sizes: img.getAttribute("sizes"),
        hasSrcset: img.hasAttribute("srcset"),
        srcset: img.getAttribute("srcset"),
        file: (img.currentSrc || img.src).split("/").pop(),
      };
    })
  );

async function collect(browser, url) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(2500);
  const list = JSON.parse(await page.evaluate(probe));
  await ctx.close();
  return list;
}

const browser = await chromium.launch({
  executablePath:
    process.env.LOCALAPPDATA +
    "\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
});
const ref = await collect(browser, "https://relab-template.webflow.io/");
const clone = await collect(
  browser,
  process.env.LOCAL_URL ?? "http://localhost:3100/"
);
await browser.close();

console.log(`viewport ${width}x${height}`);
console.log(`images: reference=${ref.length} clone=${clone.length}`);

let diffs = 0;
for (let i = 0; i < Math.min(ref.length, clone.length); i++) {
  const x = ref[i];
  const y = clone[i];
  const fields = [];
  for (const k of ["nat", "attr", "rendered", "objectFit", "sizes"]) {
    if (String(x[k]) !== String(y[k])) {
      fields.push(`${k}: ref=${x[k]} clone=${y[k]}`);
    }
  }
  if (fields.length) {
    diffs += 1;
    console.log(`\n#${i} ${x.cls || "(no class)"}  [${x.parentCls}]`);
    for (const f of fields) console.log("   " + f);
  }
}
console.log(`\nimages with differences: ${diffs}`);

const refSrcset = ref.filter((i) => i.hasSrcset).length;
console.log(`images with srcset on reference: ${refSrcset}`);