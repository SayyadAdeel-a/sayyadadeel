/**
 * Sweeps every admin route in a real browser.
 *
 * Usage:
 *   node --experimental-strip-types scripts/test-admin-routes.mjs
 *
 * What this catches that a build cannot:
 *
 *   * **Broken URLs.** The first version assembled editor links as
 *     `"/admin" + route.slice(1)`, which produced `/adminabout`, and mapped the
 *     homepage onto `/admin` — the page list. Both compiled, both rendered, and
 *     both were broken. Every card is followed and the resulting URL checked
 *     against the route it claims to be.
 *   * **A page that loads but offers nothing.** Each route is required to expose a
 *     non-zero number of editable elements, which is the symptom of the element
 *     index failing to resolve against a page's particular markup.
 *   * **Addresses that do not survive the trip.** A click is resolved to an
 *     address and then re-resolved in the actual source file, so an index that
 *     disagrees with the file is caught here rather than at save time.
 */
import path from "node:path";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { scanElements, nodeKey } from "../lib/admin/codemod.ts";
import { ROUTES, editorUrl } from "../src/generated/admin-registry.ts";

const require = createRequire(import.meta.url);
await require(path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright"));
const { launch } = await import("./lib/qa.mjs");

const BASE = process.env.LOCAL_URL ?? "http://localhost:3100";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "local-test-password";

let failures = 0;
let warnings = 0;
function check(name, condition, detail = "") {
  if (!condition) failures += 1;
  console.log(
    "  " + (condition ? "ok  " : "FAIL") + "  " + name + (detail ? "  " + detail : "")
  );
}
function note(message) {
  warnings += 1;
  console.log("  warn  " + message);
}

/**
 * Hover forward through likely-editable elements until one lights up.
 *
 * The editor marks the hovered element with `data-adm-hover` rather than drawing
 * an overlay, so this reads the same signal a person sees. Ordered most- to
 * least-likely so a page is usually resolved on the first or second try.
 */
async function findEditable(page, limit = 30) {
  const selectors = [
    "h1",
    "h2",
    "h3",
    "h4",
    "p",
    "img",
    "a",
    "span",
    "li",
    "blockquote",
    "div",
  ];

  for (const selector of selectors) {
    const count = await page.locator(".adm-stage " + selector).count();
    const steps = Math.min(count, Math.max(1, Math.ceil(limit / selectors.length)));
    for (let i = 0; i < steps; i++) {
      const element = page.locator(".adm-stage " + selector).nth(i);
      try {
        await element.hover({ timeout: 3000, force: true });
      } catch {
        continue;
      }
      if ((await page.locator("[data-adm-hover]").count()) > 0) {
        return { selector, index: i };
      }
    }
  }
  return null;
}

const browser = await launch();
const started = Date.now();

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(BASE + "/admin", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector(".adm-card", { timeout: 25000 });

  console.log("\ndashboard links");
  const cards = await page.locator(".adm-card").evaluateAll((nodes) =>
    nodes.map((node) => ({
      href: new URL(node.href).pathname,
      shown: node.querySelector(".adm-card-path")?.textContent ?? "",
    }))
  );

  check("every route has a card", cards.length === ROUTES.length, cards.length + " cards");

  const badLinks = cards.filter((card) => {
    const route = ROUTES.find((r) => editorUrl(r.route) === card.href);
    return !route || card.shown !== card.href;
  });
  check(
    "every card points at a real editor URL and says so",
    badLinks.length === 0,
    badLinks.map((c) => c.href).join(", ")
  );
  check(
    "no missing-slash URLs like /adminabout",
    !cards.some((c) => /\/admin[a-z]/.test(c.href)),
    cards.map((c) => c.href).filter((h) => /\/admin[a-z]/.test(h)).join(", ")
  );
  check(
    "the homepage has its own URL rather than sharing /admin",
    cards.some((c) => c.href === "/admin/edit"),
    cards.find((c) => c.href === "/admin/edit")?.href ?? "missing"
  );

  console.log("\nall " + ROUTES.length + " routes");

  for (const entry of ROUTES) {
    const url = BASE + editorUrl(entry.route);
    let summary = "";

    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForSelector(".adm-bar", { timeout: 20000 });
      await page.waitForSelector(".adm-hint, .adm-panel", { timeout: 20000 });

      // A redirect back to /admin means the session did not survive; a sign-in
      // form means the proxy rejected it.
      if (page.url().includes("/admin") && !page.url().includes("/admin/edit")) {
        check(entry.route, false, "redirected to " + page.url());
        continue;
      }

      const path = new URL(page.url()).pathname;
      check(
        entry.route + "  opens at its own URL",
        path === editorUrl(entry.route),
        path
      );

      const hint = (await page.locator(".adm-hint").innerText().catch(() => "")) || "";
      const count = Number((hint.match(/([\d,]+) editable/) ?? [])[1]?.replace(/,/g, "") ?? "0");
      check(entry.route + "  exposes editable elements", count > 0, count + " elements");

      const warn = await page.locator(".adm-status-warn").count();
      if (warn > 0) {
        note(entry.route + "  " + (await page.locator(".adm-status-warn").innerText()));
      }

      // The page itself must be present, not just the editor chrome.
      const headings = await page.locator(".adm-stage h1, .adm-stage h2").count();
      check(entry.route + "  renders the real page", headings > 0, headings + " headings");

      // Resolve a click back to source.
      const found = await findEditable(page);
      if (!found) {
        check(entry.route + "  a click selects something", false, "no editable element found");
        continue;
      }

      const target = page.locator(".adm-stage " + found.selector).nth(found.index);
      await target.click({ force: true, timeout: 8000 }).catch(() => {});
      await page.waitForSelector(".adm-panel", { timeout: 8000 }).catch(() => {});

      const panel = (await page.locator(".adm-panel").innerText().catch(() => "")) || "";
      const node = (panel.match(/[a-z0-9]+\|[^\s|]+\|\d+/) ?? [])[0];
      const file = (panel.match(/src\/[\w./-]+\.tsx/) ?? [])[0];

      if (!node || !file) {
        check(entry.route + "  selection names a file and address", false, panel.slice(0, 60));
        continue;
      }

      const source = readFileSync(file, "utf8");
      const resolved = scanElements(source).find((e) => nodeKey(e) === node);
      check(
        entry.route + "  address resolves in the source file",
        Boolean(resolved),
        node
      );

      if (resolved) {
        const declared = scanElements(source).filter((e) => nodeKey(e) === node);
        summary = declared.length === 1 ? "unique" : declared.length + " matches";
        check(
          entry.route + "  address is unambiguous",
          declared.length === 1,
          summary
        );
      }

      await page.keyboard.press("Escape");
    } catch (error) {
      check(entry.route, false, String(error).slice(0, 90));
    }
  }

  console.log(
    "\n" +
      (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED") +
      (warnings ? " (" + warnings + " warning(s))" : "") +
      "  in " +
      Math.round((Date.now() - started) / 1000) +
      "s\n"
  );
} finally {
  await browser.close();
}

process.exitCode = failures === 0 ? 0 : 1;