// Behavioural parity for a single cloned route: drives the interactions the
// page has against both the reference and the clone and compares the resulting
// DOM state.
//
// Usage: node scripts/qa-behavior.mjs --route=/about --width=390 --height=844
import { launch, parseArgs, ORIGIN, LOCAL, open } from "./lib/qa.mjs";
import {
  runBehaviourChecks,
  equal,
  INFORMATIONAL_CHECKS,
} from "./lib/behaviour.mjs";

const args = parseArgs();
const route = typeof args.route === "string" ? args.route : "/";
const width = args.width;
const height = args.height;

async function run(browser, base) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  // An uncaught exception means the runtime broke. A "Failed to load resource"
  // message is network noise: the reference logs one of its own for the Webflow
  // form endpoint, and `/404` legitimately responds with HTTP 404.
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error).slice(0, 200)));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().startsWith("Failed to load resource")
    ) {
      errors.push(message.text().slice(0, 200));
    }
  });
  await open(page, base + route);
  const results = await runBehaviourChecks(page);
  results.errors = [...new Set(errors)];
  await context.close();
  return results;
}

const browser = await launch();
const ref = await run(browser, ORIGIN);
const clone = await run(browser, LOCAL);
await browser.close();

const keys = [...new Set([...Object.keys(ref), ...Object.keys(clone)])];
let mismatches = 0;
let informational = 0;

console.log(`\n===== behaviour: ${route} @ ${width}x${height} =====`);
for (const key of keys) {
  if (INFORMATIONAL_CHECKS.has(key)) {
    informational += 1;
    console.log(`INFO  ${key}`);
    console.log(`        ref  : ${JSON.stringify(ref[key])}`);
    console.log(`        clone: ${JSON.stringify(clone[key])}`);
    continue;
  }
  if (equal(ref[key], clone[key], key)) {
    console.log(`OK    ${key}`);
  } else {
    mismatches += 1;
    console.log(`DIFF  ${key}`);
    console.log(`        ref  : ${JSON.stringify(ref[key])}`);
    console.log(`        clone: ${JSON.stringify(clone[key])}`);
  }
}
console.log(
  `\n${mismatches} mismatch(es) out of ${
    keys.length - INFORMATIONAL_CHECKS.size
  } behaviour checks (${informational} informational)`
);
process.exitCode = mismatches === 0 ? 0 : 1;