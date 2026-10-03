// Shared Playwright harness for the per-route QA scripts.
//
// Usage in a QA script:
//   import { launch, collectBoxes, openPair } from "./lib/qa.mjs";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright")
);

export const ORIGIN = "https://relab-template.webflow.io";
export const LOCAL = process.env.LOCAL_URL ?? "http://localhost:3100";

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    route: "/",
    routes: true,
    widths: true,
    width: 1440,
    height: 900,
    tolerance: 1,
    limit: 60,
  };
  for (const raw of argv) {
    const [key, value] = raw.replace(/^--/, "").split("=");
    if (key in args) args[key] = value === undefined ? true : value;
  }
  args.width = Number(args.width);
  args.height = Number(args.height);
  args.tolerance = Number(args.tolerance);
  args.limit = Number(args.limit);
  return args;
}

export async function launch() {
  return chromium.launch({
    executablePath:
      process.env.LOCALAPPDATA +
      "\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
  });
}

/**
 * Load a page and settle it: fonts ready, network idle, the whole document
 * scrolled once so scroll reveals and lazy images have fired, then back to the
 * top. Returns the Playwright page.
 */
export async function open(page, url, { settle = true, attempts = 6 } = {}) {
  // The reference is a third-party host and its DNS fails intermittently —
  // long enough to break a whole sweep if one attempt is all you get. Back off
  // hard rather than fast: a 2s/4s retry was not enough to ride out a blip that
  // lasted a minute, and it cost a 50-route audit everything measured so far.
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const wait = Math.min(20000, 3000 * attempt);
      console.warn(
        `  ${url} unreachable (attempt ${attempt}/${attempts}), retrying in ${wait}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  if (lastError) throw lastError;
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(2200);
  if (settle) {
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 500));
    });
    await page.waitForTimeout(1000);
  }
  return page;
}

/** Structural outline: tag + first two classes, zero-size nodes skipped. */
export const OUTLINE = () => {
  const lines = [];
  const walk = (element, prefix) => {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    const cls =
      element.className?.toString().split(/\s+/).slice(0, 2).join(".") ?? "";
    const path = `${prefix}/${element.tagName.toLowerCase()}${cls ? `.${cls}` : ""}`;
    lines.push(path);
    const kept = [];
    for (const child of element.children) {
      const sub = walk(child, path);
      if (sub !== null) kept.push(sub);
    }
    return kept.length;
  };
  walk(document.body, "");
  return lines;
};

/** Every laid-out element with its document-space box and computed state. */
export const BOXES = () => {
  const out = [];
  const walk = (element) => {
    const cs = getComputedStyle(element);
    if (cs.display === "none" && cs.visibility === "hidden") return;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      for (const child of element.children) walk(child);
      return;
    }
    // A non-`none` matrix means GSAP drives this element; its subtree is
    // phase-dependent and is verified by the behaviour harness instead.
    const animated =
      /^(matrix|matrix3d)\(/.test(cs.transform) && cs.transform !== "none";
    const start = out.length;
    out.push({
      tag: element.tagName.toLowerCase(),
      cls: element.className?.toString().slice(0, 90) ?? "",
      id: element.id ?? "",
      x: Math.round((rect.x + window.scrollX) * 100) / 100,
      y: Math.round((rect.y + window.scrollY) * 100) / 100,
      w: Math.round(rect.width * 100) / 100,
      h: Math.round(rect.height * 100) / 100,
      text: (element.childElementCount === 0 ? element.textContent : "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60),
      animated,
    });
    for (const child of element.children) walk(child);
    if (animated) for (let i = start; i < out.length; i++) out[i].animated = true;
  };
  walk(document.body);
  return out;
};

/**
 * Wait until scrolling has stopped. The reference runs Lenis with a lerp, so
 * `scrollIntoView`/`scrollTo` settle asymptotically; several consecutive
 * identical samples are required before any measurement that depends on an
 * element's viewport rectangle is trustworthy.
 */
export async function waitForScrollIdle(page, timeout = 8000) {
  const started = Date.now();
  let previous = null;
  let stable = 0;
  while (Date.now() - started < timeout) {
    const current = await page.evaluate(() => ({
      y: Math.round(window.scrollY * 100) / 100,
    }));
    if (current.y === previous) {
      stable += 1;
      if (stable >= 4) return current.y;
    } else {
      stable = 0;
    }
    previous = current.y;
    await page.waitForTimeout(120);
  }
  return previous;
}

/**
 * Merge one route-viewport entry into an audit's JSON report.
 *
 * Audits are routinely run over a subset of routes (`--routes=/about`) to
 * re-check something. Writing the report wholesale would discard every other
 * route's result, so a coverage check reading the file would report most of the
 * site as never having been tested. Entries for the same route+viewport are
 * replaced; everything else is kept.
 */
export function mergeReport(file, entry) {
  let existing = { generatedAt: null, entries: [] };
  if (fs.existsSync(file)) {
    try {
      existing = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      existing = { generatedAt: null, entries: [] };
    }
  }
  const entries = (existing.entries ?? []).filter(
    (e) => !(e.route === entry.route && e.viewport === entry.viewport)
  );
  entries.push(entry);
  entries.sort(
    (a, b) => a.route.localeCompare(b.route) || a.viewport.localeCompare(b.viewport)
  );
  fs.writeFileSync(
    file,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), entries },
      null,
      2
    )
  );
}

/** Delete every result for a route, so a re-run cannot leave stale rows. */
export function clearReportRoute(file, route) {
  if (!fs.existsSync(file)) return;
  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  report.entries = (report.entries ?? []).filter((e) => e.route !== route);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
}

/** Open the same route on the reference and on the clone at one viewport. */
export async function openPair(browser, route, width, height, options) {
  const results = {};
  for (const [label, base] of [
    ["ref", ORIGIN],
    ["clone", LOCAL],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await open(page, base + route, options);
    results[label] = { page, context, errors };
  }
  return results;
}
