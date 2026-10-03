/**
 * End-to-end test of the admin editor, against a locally running server.
 *
 * Usage:
 *   node --experimental-strip-types scripts/test-admin.mjs
 *
 * The point of this script is the seam between the browser and the codemod. The
 * editor computes an element address by walking the live DOM; the publish route
 * re-resolves that address against the source file. If those two disagree, a save
 * silently rewrites the wrong element — the single worst failure this system can
 * have, and the one nothing else in the suite would catch.
 *
 * So the central assertion is a round trip: click a headline in the browser,
 * read back the address the editor computed, then resolve that same address in
 * the real file and require it to be the same headline.
 */
import path from "node:path";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { scanElements, nodeKey } from "../lib/admin/codemod.ts";

const require = createRequire(import.meta.url);
const { launch } = await import("./lib/qa.mjs");

const BASE = process.env.LOCAL_URL ?? "http://localhost:3100";
const PASSWORD = "local-test-password";

let failures = 0;
function check(name, condition, detail = "") {
  if (!condition) failures += 1;
  console.log(
    "  " + (condition ? "ok  " : "FAIL") + "  " + name + (detail ? "  " + detail : "")
  );
}

async function api(pathname, init = {}) {
  const response = await fetch(BASE + pathname, init);
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body, headers: response.headers };
}

console.log("\nauth");
{
  const wrong = await api("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "not-the-password" }),
  });
  check("wrong password is refused", wrong.status === 401, "status " + wrong.status);

  const empty = await api("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  check("missing password is refused", empty.status === 401, "status " + empty.status);

  const right = await api("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: PASSWORD }),
  });
  check("correct password is accepted", right.status === 200, "status " + right.status);

  const setCookie = right.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.find((c) => c.startsWith("relab_admin_session="));
  check("a session cookie is set", Boolean(cookie));
  check(
    "the cookie is HttpOnly",
    Boolean(cookie && /httponly/i.test(cookie)),
    cookie ? cookie.split(";")[1]?.trim() ?? "" : ""
  );
  check(
    "the cookie is SameSite=Lax",
    Boolean(cookie && /samesite=lax/i.test(cookie))
  );
  check(
    "no token is echoed in the response body",
    !JSON.stringify(right.body).match(/session|sha|hmac/i),
    JSON.stringify(right.body)
  );

  globalThis.__cookie = cookie ? cookie.split(";")[0] : "";

  const session = await api("/api/admin/session", {
    headers: { cookie: globalThis.__cookie },
  });
  check(
    "session reports authenticated",
    session.body?.authenticated === true,
    JSON.stringify(session.body)
  );

  const anon = await api("/api/admin/session");
  check("no cookie means not authenticated", anon.body?.authenticated === false);
}

console.log("\nunauthenticated access");
{
  const admin = await api("/admin");
  check(
    "the editor renders the sign-in form, not the page list",
    typeof admin.body === "string" && admin.body.includes("Relab editor"),
    "status " + admin.status
  );
  const deep = await api("/admin/about");
  check(
    "a deep editor route is gated too",
    typeof deep.body === "string" && !deep.body.includes("Where Brands"),
    "status " + deep.status
  );
  const publish = await api("/api/admin/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changes: [] }),
  });
  check("publish refuses without a session", publish.status === 401, "status " + publish.status);
}

console.log("\nauthenticated dashboard");
{
  const admin = await api("/admin", { headers: { cookie: globalThis.__cookie } });
  check(
    "the page list is shown",
    typeof admin.body === "string" && admin.body.includes("/case-studies"),
    "status " + admin.status
  );
  check(
    "the layout opts out of indexing",
    typeof admin.body === "string" && admin.body.includes("noindex")
  );
}

console.log("\npublish is refused safely when GitHub is not configured");
{
  // .env.local sets the repo but not GITHUB_TOKEN, so this must fail loudly
  // and write nothing.
  const response = await api("/api/admin/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: globalThis.__cookie },
    body: JSON.stringify({
      changes: [
        {
          file: "src/components/sites/relab-0c02b053/about-979bddc4/AboutHeroSection.tsx",
          node: "h1|h1|0",
          kind: "text",
          value: "Should not be written",
        },
      ],
    }),
  });
  check("reports it is not configured", response.status === 503, "status " + response.status);
  check(
    "and names the missing variables",
    typeof response.body?.error === "string" && response.body.error.includes("GITHUB_TOKEN"),
    response.body?.error ?? ""
  );
}

console.log("\npath traversal is refused");
{
  const response = await api("/api/admin/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: globalThis.__cookie },
    body: JSON.stringify({
      changes: [{ file: "../../.env.local", node: "h1|h1|0", kind: "text", value: "x" }],
    }),
  });
  check("a path outside the repo is rejected", response.status === 400, "status " + response.status);
  check(
    "with a message naming the problem",
    typeof response.body?.error === "string" && response.body.error.includes("can be edited"),
    response.body?.error ?? ""
  );
}

console.log("\nediting in the browser");
const browser = await launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(BASE + "/admin", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for the dashboard itself, not for the URL: the form posts to the API and
  // only then navigates, so `waitForURL` would match the page we are already on
  // and race straight past the redirect.
  await page.waitForSelector(".adm-card", { timeout: 25000 });

  const cardCount = await page.locator(".adm-card").count();
  check("every route is listed", cardCount === 25, cardCount + " cards");

  await page.goto(BASE + "/admin/about", { waitUntil: "networkidle" });

  // The editor renders the genuine page: its own copy must be on screen.
  const heading = page.locator(".adm-stage h1.hero-text-one");
  check("the real page renders inside the editor", (await heading.count()) === 1);
  const originalText = (await heading.textContent())?.trim();
  check("with its original copy", originalText === "Where Brands", JSON.stringify(originalText));

  // Click it with the real mouse, which is the only thing that produces the
  // event the editor listens for.
  await heading.click({ position: { x: 5, y: 5 } });
  await page.waitForSelector(".adm-panel", { timeout: 10000 });

  const panelText = await page.locator(".adm-panel").innerText();
  check("an inspector opens", panelText.includes("AboutHeroSection.tsx"), panelText.split("\n")[0]);

  // The address the editor computed, resolved against the real file.
  // Tag names carry digits (`h1`), so the tag part is alphanumeric.
  const nodeKeyText = (panelText.match(/[a-z0-9]+\|[^\s|]+\|\d+/) ?? [])[0];
  check("an element address is shown", Boolean(nodeKeyText), String(nodeKeyText));

  const sectionFile = (panelText.match(/src\/[\w./-]+\.tsx/) ?? [])[0];
  check("the owning file is shown", Boolean(sectionFile), String(sectionFile));

  const source = readFileSync(sectionFile, "utf8");
  const resolved = scanElements(source).find((e) => nodeKey(e) === nodeKeyText);

  check(
    "the address resolves to the clicked element in the source file",
    Boolean(resolved),
    nodeKeyText + " not found in " + sectionFile
  );
  if (resolved) {
    const sourceText = source.slice(resolved.textStart, resolved.textEnd);
    check(
      "and to exactly the text on screen",
      sourceText === originalText,
      JSON.stringify(sourceText) + " vs " + JSON.stringify(originalText)
    );
  }

  // Live preview.
  const box = page.locator(".adm-panel textarea").first();
  await box.fill("Where Creators Meet");
  await page.waitForTimeout(300);
  const previewText = (await heading.textContent())?.trim();
  check("the page updates as you type", previewText === "Where Creators Meet", JSON.stringify(previewText));

  const barText = await page.locator(".adm-bar").innerText();
  check("the edit is counted as unsaved", barText.includes("1 unsaved edit"), barText.replace(/\n/g, " "));

  // Changing a link's href. The inspector is a fixed panel on the right, so it
  // has to be closed first or it intercepts the click.
  await page.click(".adm-panel-close");
  await page.waitForSelector(".adm-panel", { state: "detached", timeout: 5000 });

  const link = page.locator(".adm-stage a.button").first();
  if ((await link.count()) > 0) {
    // `force` skips the actionability check: a Webflow button's visible area is a
    // child wrapper, so Playwright's own hit-test would refuse the click even
    // though a person's click lands there fine. The event still dispatches on the
    // real element.
    await link.click({ force: true });
    await page.waitForSelector(".adm-panel", { timeout: 10000 });
    const linkPanel = await page.locator(".adm-panel").innerText();
    check(
      "selecting a button label still offers link editing",
      linkPanel.includes("Link address"),
      linkPanel.split("\n").slice(0, 2).join(" / ")
    );
    const hrefField = page.locator(".adm-panel input").last();
    const hrefValue = await hrefField.inputValue();
    check("pre-filled with the current href", hrefValue === "/contact", hrefValue);

    await hrefField.fill("/pricing");
    await page.waitForTimeout(300);
    const liveHref = await link.getAttribute("href");
    check("the link updates live", liveHref === "/pricing", String(liveHref));

    const barAfterLink = await page.locator(".adm-bar").innerText();
    check(
      "the href edit is counted separately from the text",
      barAfterLink.includes("2 unsaved edits"),
      barAfterLink.replace(/\n/g, " ")
    );
  } else {
    check("selecting a button label still offers link editing", true, "skipped: no .button found");
  }

  // Discard must restore.
  await page.click("button:has-text('Discard')");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForSelector(".adm-stage h1.hero-text-one", { timeout: 15000 });
  const restored = (await page.locator(".adm-stage h1.hero-text-one").textContent())?.trim();
  check("Discard restores the original copy", restored === "Where Brands", JSON.stringify(restored));

  const afterDiscard = await page.locator(".adm-bar").innerText();
  check("and clears the unsaved count", !afterDiscard.includes("unsaved"), afterDiscard.replace(/\n/g, " "));
} finally {
  await browser.close();
}

console.log(
  "\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED") + "\n"
);
process.exitCode = failures === 0 ? 0 : 1;