/**
 * End-to-end test of the admin editor, against a locally running server.
 *
 * Usage:
 *   node --experimental-strip-types scripts/test-admin.mjs
 *
 * Two things are being proved here.
 *
 * **The security surface.** Wrong passwords refused, cookies signed and HttpOnly,
 * unauthenticated requests never render a page, path traversal rejected, and a
 * save refused outright when publishing is not configured.
 *
 * **The edit seam.** The browser computes an element address by walking the live
 * DOM; the publish route re-resolves that address against the source file. If
 * those two disagree, a save silently rewrites the wrong element — the worst
 * failure this system can have, and one nothing else in the suite would catch.
 * So every kind of edit is driven through the real UI and then replayed through
 * `applyChanges` against the real file, requiring the patch to land on the
 * element that was actually on screen.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { applyChanges, scanElements, nodeKey } from "../lib/admin/codemod.ts";

const require = createRequire(import.meta.url);
await require(  path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright")
);
const { launch } = await import("./lib/qa.mjs");

import path from "node:path";

const BASE = process.env.LOCAL_URL ?? "http://localhost:3100";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "local-test-password";

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

/** Read the address and file the inspector is showing for the current selection. */
async function readSelection(page) {
  const panel = (await page.locator(".adm-panel").innerText()) || "";
  return {
    panel,
    node: (panel.match(/[a-z0-9]+\|[^\s|]+\|\d+/) ?? [])[0] ?? "",
    file: (panel.match(/src\/[\w./-]+\.tsx/) ?? [])[0] ?? "",
  };
}

/**
 * Replay a browser selection through the codemod.
 *
 * This is the assertion that matters: the address the browser produced must
 * resolve to the same element, with the same text, in the actual file.
 */
function patchInSource(file, node, kind, value) {
  const source = readFileSync(file, "utf8");
  const before = scanElements(source).find((e) => nodeKey(e) === node);
  const result = applyChanges(source, [{ file, node, kind, value }]);
  const after = scanElements(result.content).find((e) => nodeKey(e) === node);
  return {
    found: Boolean(before),
    matches: Boolean(before) && Boolean(after),
    count: scanElements(source).filter((e) => nodeKey(e) === node).length,
    originalText: before && before.hasText ? source.slice(before.textStart, before.textEnd) : "",
    newText: after && after.hasText ? result.content.slice(after.textStart, after.textEnd) : "",
    changed: result.changed,
    source,
    patched: result.content,
  };
}

/* --------------------------------------------------------------- auth ---- */

console.log("\nauth");
let cookie = "";
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
  const set = setCookie.find((c) => c.startsWith("relab_admin_session="));
  check("a session cookie is set", Boolean(set));
  check("the cookie is HttpOnly", Boolean(set && /httponly/i.test(set)));
  check("the cookie is SameSite=Lax", Boolean(set && /samesite=lax/i.test(set)));
  check(
    "no token is echoed in the response body",
    !JSON.stringify(right.body).match(/session|sha|hmac/i),
    JSON.stringify(right.body)
  );

  cookie = set ? set.split(";")[0] : "";
  const session = await api("/api/admin/session", { headers: { cookie } });
  check(
    "session reports authenticated",
    session.body?.authenticated === true,
    JSON.stringify(session.body)
  );
  check("no cookie means not authenticated", (await api("/api/admin/session")).body?.authenticated === false);
}

console.log("\nunauthenticated access");
{
  const admin = await api("/admin");
  check(
    "the editor renders the sign-in form, not the page list",
    typeof admin.body === "string" && admin.body.includes("Relab editor")
  );

  // The layout gate alone was not enough: a layout receives children already
  // rendered, so the page was executed and shipped in the flight payload. Proxy
  // runs first, so a redirect is the signal that the gate is in the right place.
  const deep = await fetch(BASE + "/admin/edit/about", { redirect: "manual" });
  check(
    "a deep editor route never renders without a session",
    deep.status >= 300 && deep.status < 400,
    "status " + deep.status
  );

  const publish = await api("/api/admin/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changes: [] }),
  });
  check("publish refuses without a session", publish.status === 401, "status " + publish.status);
}

console.log("\ndashboard");
{
  const admin = await api("/admin", { headers: { cookie } });
  check("the page list is shown", typeof admin.body === "string" && admin.body.includes("/case-studies"));
  check("the layout opts out of indexing", String(admin.body).includes("noindex"));
}

console.log("\npublish is refused safely when GitHub is not configured");
{
  const response = await api("/api/admin/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
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
    String(response.body?.error).includes("GITHUB_TOKEN"),
    response.body?.error ?? ""
  );
}

console.log("\nmalformed requests are rejected before anything else");
{
  const traversal = await api("/api/admin/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      changes: [{ file: "../../.env.local", node: "h1|h1|0", kind: "text", value: "x" }],
    }),
  });
  check(
    "a path outside the repo is rejected",
    traversal.status === 400,
    "status " + traversal.status
  );
  check(
    "with a message naming the problem",
    String(traversal.body?.error).includes("can be edited"),
    traversal.body?.error ?? ""
  );

  const badKind = await api("/api/admin/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      changes: [{ file: "app/about/page.tsx", node: "h1|h1|0", kind: "style", value: "x" }],
    }),
  });
  check("an unknown property is rejected", badKind.status === 400, "status " + badKind.status);
}

/* ------------------------------------------------------------- browser --- */

console.log("\nediting in the browser");
const browser = await launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(BASE + "/admin", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector(".adm-card", { timeout: 25000 });

  check("every route is listed", (await page.locator(".adm-card").count()) === 25);

  await page.goto(BASE + "/admin/edit/about", { waitUntil: "networkidle" });

  const heading = page.locator(".adm-stage h1.hero-text-one");
  check("the real page renders inside the editor", (await heading.count()) === 1);
  const originalText = (await heading.textContent())?.trim();
  check("with its original copy", originalText === "Where Brands", JSON.stringify(originalText));

  /* -- hover affordance -- */
  console.log("\n  hover");
  await heading.hover({ force: true });
  check(
    "hovering marks the element",
    (await page.locator("[data-adm-hover]").count()) === 1
  );
  const badge = await page.locator(".adm-badge").innerText().catch(() => "");
  check(
    "and shows what it is",
    badge.includes("AboutHeroSection.tsx"),
    badge.replace(/\n/g, " ")
  );
  const outline = await heading.evaluate(
    (el) => getComputedStyle(el).outlineStyle + " " + getComputedStyle(el).outlineColor
  );
  check("with a visible outline", outline.startsWith("dashed"), outline);

  /* -- heading text -- */
  console.log("\n  heading text");
  await heading.click({ force: true });
  await page.waitForSelector(".adm-panel", { timeout: 10000 });
  check(
    "selecting marks the element",
    (await page.locator("[data-adm-selected]").count()) === 1
  );

  const h1 = await readSelection(page);
  check("the inspector names the file", h1.file.endsWith("AboutHeroSection.tsx"), h1.file);
  check("and an address", h1.node === "h1|h1|0", h1.node);
  check("and offers a text field", h1.panel.includes("Text"));

  const replay = patchInSource(h1.file, h1.node, "text", "Where Creators Meet");
  check("the address resolves in the source file", replay.found);
  check("and is unambiguous", replay.count === 1, replay.count + " matches");
  check(
    "to exactly the text on screen",
    replay.originalText === originalText,
    JSON.stringify(replay.originalText)
  );
  check("a patch rewrites exactly that element", replay.changed === 1, "changed " + replay.changed);
  check(
    "and nothing else",
    replay.newText === "Where Creators Meet" &&
      !replay.patched.includes(">Where Brands</h1>"),
    JSON.stringify(replay.newText)
  );

  await page.locator(".adm-panel textarea").first().fill("Where Creators Meet");
  await page.waitForTimeout(250);
  check(
    "the page updates as you type",
    (await heading.textContent())?.trim() === "Where Creators Meet"
  );
  const bar = await page.locator(".adm-bar").innerText();
  check("the edit is counted as unsaved", bar.includes("1 unsaved edit"), bar.replace(/\n/g, " "));

  /* -- a div-based small label, the case the old tag list excluded -- */
  console.log("\n  small labels rendered as div");
  await page.click(".adm-panel-close");
  await page.waitForSelector(".adm-panel", { state: "detached" });

  // Webflow renders much of its copy as `div` — this one is
  // `<div className={"h1 hero-text-two"}>& Creators</div>` — so a selector list of
  // h1/p/li/a/img/span could never reach it. Targeting it by class keeps the
  // assertion about this element specifically rather than about whatever happened
  // to be under the pointer.
  const divLabel = page.locator(".adm-stage div.h1.hero-text-two").first();
  check("a div-rendered label exists", (await divLabel.count()) === 1);

  const divText = ((await divLabel.textContent()) ?? "").trim();
  await divLabel.hover({ force: true });
  check("and is hoverable", (await page.locator("[data-adm-hover]").count()) === 1);

  await divLabel.click({ force: true });
  await page.waitForSelector(".adm-panel", { timeout: 10000 });
  const divSel = await readSelection(page);
  check("and selectable", divSel.node === "div|h1|0", divSel.node);

  if (divSel.node && divSel.file) {
    const divReplay = patchInSource(divSel.file, divSel.node, "text", "Edited label");
    check(
      "its address resolves to the label on screen",
      divReplay.originalText === divText,
      JSON.stringify(divReplay.originalText) + " vs " + JSON.stringify(divText)
    );
    check("and is unambiguous", divReplay.count === 1, divReplay.count + " matches");
    check("with real copy to edit", divReplay.originalText.length > 0);
  }

  // Nothing is typed here, so the pending count is unaffected by this section.

  /* -- an image -- */
  console.log("\n  images");
  await page.click(".adm-panel-close");
  await page.waitForSelector(".adm-panel", { state: "detached" });

  const image = page.locator(".adm-stage img").first();
  const originalSrc = await image.getAttribute("src");
  await image.hover({ force: true });
  check("an image is hoverable", (await page.locator("[data-adm-hover]").count()) === 1);
  await image.click({ force: true });
  await page.waitForSelector(".adm-panel", { timeout: 10000 });

  const imgSel = await readSelection(page);
  check("the inspector offers an image field", imgSel.panel.includes("Image address"));
  check(
    "pre-filled with the current address",
    (await page.locator(".adm-panel input").first().inputValue()) === originalSrc,
    originalSrc?.slice(-40)
  );

  if (imgSel.node && imgSel.file) {
    const imgReplay = patchInSource(imgSel.file, imgSel.node, "src", "/sites/replacement.avif");
    check("its src address resolves", imgReplay.found, imgSel.node);
    check("and is unambiguous", imgReplay.count === 1, imgReplay.count + " matches");
    check(
      "a patch rewrites only that src",
      imgReplay.patched.includes('src={"/sites/replacement.avif"}') &&
        !imgReplay.patched.includes('src={"' + originalSrc + '"}'),
      "changed " + imgReplay.changed
    );
  }

  await page.locator(".adm-panel input").first().fill("/sites/replacement.avif");
  await page.waitForTimeout(200);
  check(
    "the image updates live",
    (await image.getAttribute("src")) === "/sites/replacement.avif"
  );

  /* -- a link, reached through its visible label -- */
  console.log("\n  links");
  await page.click(".adm-panel-close");
  await page.waitForSelector(".adm-panel", { state: "detached" });

  const link = page.locator(".adm-stage a.button").first();
  await link.click({ force: true });
  await page.waitForSelector(".adm-panel", { timeout: 10000 });
  const linkSel = await readSelection(page);
  check(
    "clicking a button label offers link editing",
    linkSel.panel.includes("Link address"),
    linkSel.panel.split("\n").slice(0, 2).join(" / ")
  );

  const hrefField = page.locator(".adm-panel input").last();
  const originalHref = await hrefField.inputValue();
  check("pre-filled with the current href", originalHref.length > 0, originalHref);

  // The href lives on the anchor, a different node in the source than the label
  // that was clicked. The panel names it, so the address can be replayed.
  const linkNode = (linkSel.panel.match(/a\|[^\s|]+\|\d+/) ?? [])[0];
  check("the panel names the anchor's own address", Boolean(linkNode), String(linkNode));
  if (linkNode && linkSel.file) {
    const linkReplay = patchInSource(linkSel.file, linkNode, "href", "/pricing");
    check("its href address resolves", linkReplay.found, linkNode);
    check("and is unambiguous", linkReplay.count === 1, linkReplay.count + " matches");
    check("a patch touches exactly one attribute", linkReplay.changed === 1);

    // Re-scan the patched file and read the attribute back, rather than searching
    // the text for the new href: `/contact` is on several links in this file, so
    // a substring check would pass or fail for the wrong reason.
    const after = scanElements(linkReplay.patched).find((e) => nodeKey(e) === linkNode);
    const hrefNow = after?.attributes.find((a) => a.name === "href")?.literal;
    check("and the anchor's href really changed", hrefNow === "/pricing", String(hrefNow));
  }

  await hrefField.fill("/pricing");
  await page.waitForTimeout(200);
  check("the link updates live", (await link.getAttribute("href")) === "/pricing");

  const bar2 = await page.locator(".adm-bar").innerText();
  check(
    "text, image and href edits are counted separately",
    bar2.includes("3 unsaved edits"),
    bar2.replace(/\n/g, " ")
  );

  /* -- deselect, and the change list -- */
  console.log("\n  deselect and the change list");
  await page.keyboard.press("Escape");
  check("Escape closes the inspector", (await page.locator(".adm-panel").count()) === 0);
  check("and clears the selection marker", (await page.locator("[data-adm-selected]").count()) === 0);

  await page.click("button:has-text('unsaved')");
  await page.waitForSelector(".adm-changes", { timeout: 5000 });
  const changeRows = await page.locator(".adm-changes li").count();
  check("the change list shows all three", changeRows === 3, changeRows + " rows");

  /* -- edit mode off -- */
  console.log("\n  edit mode");
  await page.click("button:has-text('Editing on')");
  check("the toggle flips", (await page.locator(".adm-stage.adm-editing").count()) === 0);
  await heading.hover({ force: true });
  check(
    "no hover affordance while off",
    (await page.locator("[data-adm-hover]").count()) === 0
  );
  await page.click("button:has-text('Editing off')");
  check("and back on", (await page.locator(".adm-stage.adm-editing").count()) === 1);

  /* -- discard -- */
  console.log("\n  discard");
  await page.click("button:has-text('Discard')");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForSelector(".adm-stage h1.hero-text-one", { timeout: 20000 });
  check(
    "Discard restores the original copy",
    (await page.locator(".adm-stage h1.hero-text-one").textContent())?.trim() === "Where Brands"
  );
  check(
    "and the image",
    (await page.locator(".adm-stage img").first().getAttribute("src")) === originalSrc
  );
  const afterDiscard = await page.locator(".adm-bar").innerText();
  check("and clears the unsaved count", !afterDiscard.includes("unsaved"), afterDiscard.replace(/\n/g, " "));
} finally {
  await browser.close();
}

console.log(
  "\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED") + "\n"
);
process.exitCode = failures === 0 ? 0 : 1;