// Verify that internal navigation works: crawl every internal href the clone
// renders and check that it resolves — on the clone and on the reference.
//
// Usage: node scripts/verify-navigation.mjs
import { launch, ORIGIN, LOCAL, open } from "./lib/qa.mjs";

const ROUTES = JSON.parse(
  await import("node:fs").then((fs) =>
    fs.readFileSync("docs/research/relab-0c02b053/routes.json", "utf8")
  )
).routes.map((r) => r.route);

const SKIP_SCHEMES = /^(mailto:|tel:|javascript:|#|\/\/)/i;

/** Resolve an href the way a browser would, against a base URL. */
function normalise(href, base) {
  if (!href || SKIP_SCHEMES.test(href)) return null;
  const url = new URL(href, base);
  if (url.origin !== new URL(base).origin) return null;
  return url.pathname;
}

const browser = await launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

/** Every internal href the clone renders on a route. */
const linksByRoute = new Map();
const errors = [];

for (const route of ROUTES) {
  await open(page, LOCAL + route, { settle: false });
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href"))
      .filter(Boolean)
  );
  const targets = new Set();
  for (const href of links) {
    const resolved = normalise(href, LOCAL + route);
    if (resolved) targets.add(resolved);
  }
  linksByRoute.set(route, [...targets].sort());
}

await context.close();

/** Status of a path on a base URL. */
async function statusOf(base, route) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  let status = 0;
  try {
    const response = await p.goto(base + route, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    status = response ? response.status() : 0;
  } catch (error) {
    status = -1;
    errors.push(`${base}${route}: ${error.message}`);
  }
  await ctx.close();
  return status;
}

const allTargets = new Set();
for (const targets of linksByRoute.values()) {
  for (const t of targets) allTargets.add(t);
}

console.log(`crawled ${ROUTES.length} routes, ${allTargets.size} distinct internal targets\n`);

const rows = [];
for (const target of [...allTargets].sort()) {
  const refStatus = await statusOf(ORIGIN, target);
  const cloneStatus = await statusOf(LOCAL, target);
  const linkedFrom = [...linksByRoute.entries()]
    .filter(([, targets]) => targets.includes(target))
    .map(([route]) => route);
  rows.push({ target, refStatus, cloneStatus, linkedFrom });
  const flag =
    refStatus === cloneStatus || (target === "/404" && refStatus === 200)
      ? "OK  "
      : "DIFF";
  console.log(
    `${flag} ${target.padEnd(56)} reference=${refStatus} clone=${cloneStatus}  linked from ${linkedFrom.length} page(s)`
  );
}

const problems = rows.filter(
  (row) => row.cloneStatus >= 400 && row.target !== "/404"
);

console.log(`\n${rows.length} internal targets checked.`);
if (problems.length) {
  console.log(`\n${problems.length} target(s) fail on the clone:`);
  for (const problem of problems) {
    console.log(
      `  ${problem.target} -> ${problem.cloneStatus} (reference ${problem.refStatus})`
    );
  }
} else {
  console.log("Every internal link resolves on the clone.");
}

if (errors.length) {
  console.log(`\n${errors.length} request error(s):`);
  for (const error of errors.slice(0, 10)) console.log("  " + error);
}

await browser.close();
process.exitCode = problems.length === 0 ? 0 : 1;