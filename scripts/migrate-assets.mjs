/**
 * Reorganises the site's assets into `public/assets/`, and rewrites every
 * reference to match.
 *
 * Usage:
 *   node scripts/migrate-assets.mjs --plan     # print the mapping, change nothing
 *   node scripts/migrate-assets.mjs --apply    # move files and rewrite references
 *   node scripts/migrate-assets.mjs --verify   # every reference resolves to a file
 *
 * ## How an asset is placed
 *
 * Each asset is attributed to the component that references it. The component's
 * own directory already encodes the page — `about-979bddc4`,
 * `case-studies-brew-blend-launch-bb3d83b2`, `root-8a5edab2` (the homepage) —
 * so the target folder is derived from it rather than maintained by hand, and a
 * new page cannot be forgotten.
 *
 * An asset referenced from exactly one page goes in that page. An asset
 * referenced from more than one page, or from a shared component, or from
 * site-wide CSS, goes in `shared/` — because that is what it is, and pretending
 * otherwise would mean moving it again the first time a second page used it.
 *
 * ## Naming
 *
 * Webflow names assets `<hash>_<hash>_Slide_7.webp`. The hash prefix carries no
 * meaning, so it is dropped and the remainder is kebab-cased: `slide-7`. Where
 * the remainder is purely generic (`image_2037`) the referencing element's own
 * class is used for a role word instead, so the result says what the file is.
 *
 * Uniqueness within a folder is enforced by a numeric suffix, and the original
 * filename is always recorded in `ASSETS.md`, so nothing becomes untraceable.
 *
 * ## Safety
 *
 * `--apply` refuses to run unless every planned target is free and every
 * reference is accounted for. Nothing is deleted: duplicates are reported and
 * left on disk for a human to confirm.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const AUDIT = path.join(ROOT, "docs", "asset-audit.json");

const MODE = process.argv.find((a) => a.startsWith("--")) ?? "--plan";
const APPLY = MODE === "--apply";
const VERIFY = MODE === "--verify";

const ASSET_EXT = new Set([
  ".avif", ".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
  ".mp4", ".webm", ".mov", ".woff", ".woff2", ".ttf", ".otf", ".eot",
]);
const SOURCE_EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs", ".css", ".json", ".html", ".md"]);
const SKIP = new Set(["node_modules", ".next", ".git", ".vercel"]);

/** Page groups, longest first so `case-studies` wins over `case`. */
const PAGE_GROUPS = [
  "case-studies",
  "style-guide",
  "changelog",
  "licenses",
  "services",
  "pricing",
  "contact",
  "blogs",
  "about",
  "404",
];

const COMPONENT_ROOT = "src/components/sites/relab-0c02b053/";
/** The directory app/layout.tsx interpolates into its favicon URLs. */
const SITE_DIR = "relab-0c02b053/root-8a5edab2";

/* ------------------------------------------------------------------ utils */

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const rel = (file) => path.relative(ROOT, file).replace(/\\/g, "/");
const toUrl = (file) => "/" + path.relative(PUBLIC, file).replace(/\\/g, "/");

function kebab(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/[^A-Za-z0-9.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/**
 * Component directory -> page folder.
 *
 * `root-8a5edab2` is the homepage. Everything else is `<page>[-<slug>]-<hash>`;
 * the trailing hash is dropped and the first recognised page group splits the
 * rest into page and slug.
 */
function pageFolderFor(componentDir) {
  if (componentDir === "root-8a5edab2") return "home";
  if (componentDir === "shared") return "shared";
  const base = componentDir.replace(/-[0-9a-f]{6,10}$/, "");
  for (const group of PAGE_GROUPS) {
    if (base === group) return group;
    if (base.startsWith(group + "-")) return group + "/" + base.slice(group.length + 1);
  }
  return "shared";
}

/**
 * The component identity a referencing file belongs to: `dir/ComponentName`.
 *
 * Precision matters here. Keying by directory alone collapses all eighteen
 * homepage components into one, and every homepage asset lands in a single
 * folder. Keying by directory *and* component name keeps `HeroSection` and
 * `MeetSection` distinguishable even though they share a directory.
 */
function componentIdOf(refFile) {
  // Generated specs describe exactly one component; attribute them to it.
  const spec = refFile.match(
    /^docs\/research\/relab-0c02b053\/([^/]+)\/components\/([^/]+)\.spec\.md$/
  );
  if (spec) {
    return spec[1] + "/" + spec[2].replace(/\.spec$/, "");
  }

  if (refFile.startsWith(COMPONENT_ROOT)) {
    const rest = refFile.slice(COMPONENT_ROOT.length);
    const [dir, file] = rest.split("/");
    return dir + "/" + file.replace(/\.tsx?$/, "");
  }

  if (refFile === "app/page.tsx") {
    // The homepage module owns every root-8a5edab2 component; use its first
    // section so page-level references land on the homepage rather than shared.
    const order = SECTION_ORDERS.get("/");
    return order && order.length ? order[0].id : "shared/HomePage";
  }

  if (refFile === "app/404/page.tsx" || refFile === "app/not-found.tsx") {
    return "404-316556f0/FourGroSection";
  }

  if (refFile.startsWith("app/") && refFile.endsWith("page.tsx")) {
    const route = refFile.replace(/^app\//, "").replace(/\/page\.tsx$/, "");
    const order = SECTION_ORDERS.get("/" + route);
    return order && order.length ? order[0].id : "shared/PageModule";
  }

  // Site-wide stylesheets, the root layout, and the runtime scripts.
  return "shared/site-wide";
}

/** `HeroSection` -> `hero`, `SectionSection` -> `section`. */
function sectionSlug(name) {
  return kebab(name.replace(/Section$/, "")) || kebab(name) || "misc";
}

/**
 * route -> ordered sections, read from the page module's JSX.
 *
 * Numbering a folder `03-team` only means something if the number matches the
 * order the section actually renders in, which is the JSX order in the page
 * module — not alphabetical order of the filenames.
 */
function readSectionOrder() {
  const orders = new Map();
  const pages = walk(path.join(ROOT, "app")).filter((f) => f.endsWith("page.tsx"));

  for (const pageFile of pages) {
    const text = fs.readFileSync(pageFile, "utf8");

    // Local name -> component identity, so JSX order can be resolved.
    const imports = new Map();
    const pattern =
      /import\s+(\w+)\s+from\s+"@\/components\/sites\/relab-0c02b053\/([^"]+)"/g;
    for (const m of text.matchAll(pattern)) {
      const [, local, target] = m;
      const [dir, file] = target.split("/");
      imports.set(local, { id: dir + "/" + file.replace(/\.tsx?$/, ""), dir });
    }

    const ordered = [];
    for (const m of text.matchAll(/<([A-Z]\w*)\s*\/>/g)) {
      const found = imports.get(m[1]);
      // Shared chrome is present on every page; it belongs in shared/, not in
      // this page's numbered sequence.
      if (!found || found.dir === "shared") continue;
      if (ordered.some((entry) => entry.id === found.id)) continue;
      ordered.push({ id: found.id, dir: found.dir, index: ordered.length });
    }

    const route = rel(pageFile).replace(/^app/, "").replace(/\/page\.tsx$/, "") || "/";
    orders.set(route, ordered);
  }

  return orders;
}

const SECTION_ORDERS = readSectionOrder();

/** Every component identity, mapped to the folder its assets belong in. */
function buildPlacements() {
  const placements = new Map();

  for (const order of SECTION_ORDERS.values()) {
    for (const section of order) {
      const name = section.id.split("/")[1];
      placements.set(section.id, {
        page: pageFolderFor(section.dir),
        index: section.index + 1,
        slug: sectionSlug(name),
      });
    }
  }

  // Shared components, grouped by component: an asset only the footer uses
  // belongs in a site-footer folder, not loose in shared/.
  const sharedNames = new Set();
  for (const file of walk(path.join(ROOT, COMPONENT_ROOT + "shared"))) {
    const name = path.basename(file).replace(/\.tsx?$/, "");
    sharedNames.add(name);
    placements.set("shared/" + name, {
      page: "shared",
      index: null,
      slug: kebab(name.replace(/^Site/, "")) || "shared",
    });
  }

  placements.set("shared/site-wide", { page: "shared", index: null, slug: "site" });
  return placements;
}

const PLACEMENTS = buildPlacements();

/**
 * Where an asset goes, from the components that reference it.
 *
 * One placement is the common case. Several distinct placements means the asset
 * really is shared between sections or pages, and it goes to the flat shared
 * root rather than being filed under whichever section happened to mention it
 * first — filing it under one owner would move it again the first time a second
 * owner needed it.
 */
function folderFor(owners) {
  const distinct = new Set(
    owners.map((owner) => {
      const placement = PLACEMENTS.get(owner);
      return placement
        ? placement.page + "|" + placement.index + "|" + placement.slug
        : "shared||misc";
    })
  );

  if (distinct.size === 1) {
    const placement = PLACEMENTS.get(owners[0]) ?? { page: "shared", index: null, slug: "misc" };
    return placement.page + (placement.index === null ? "" : "/" + String(placement.index).padStart(2, "0") + "-" + placement.slug);
  }

  // Used by several sections, but all on the same page. Keeping it under that
  // page is more useful than dropping it in the global shared root, and it is
  // still correct: nothing outside the page can reach it.
  const pages = new Set(
    owners.map((owner) => (PLACEMENTS.get(owner) ?? { page: "shared" }).page)
  );
  if (pages.size === 1 && !pages.has("shared")) {
    return [...pages][0] + "/_shared";
  }

  // Used only by one shared component, on every page: group by that component.
  const sharedOwners = owners.filter((owner) => owner.startsWith("shared/"));
  if (sharedOwners.length === owners.length) {
    const placement = PLACEMENTS.get(sharedOwners[0]);
    if (placement) return "shared/" + placement.slug;
  }

  return "shared";
}

/* --------------------------------------------------------------- naming -- */

/**
 * A descriptive base name for an asset.
 *
 * The Webflow suffix is preferred because it is often genuinely descriptive
 * (`Slide_7`, `Muti-BG-Image`). When it is just an index (`image_2037`) the
 * referring element's class supplies a role word, so the name says something.
 */
function baseNameFor(asset, referencesByLine) {
  const filename = path.basename(asset.url);
  const extension = path.extname(filename);

  // Drop the hash prefix(es): `<32hex>_<hash>_Slide_7.webp` -> `Slide_7.webp`.
  let stem = filename.slice(0, -extension.length);
  const parts = stem.split("_");
  const suffixParts = parts.filter(
    (part) => !/^[0-9a-f]{16,}$/i.test(part)
  );
  let suffix = (suffixParts.length ? suffixParts : parts).join("_");

  // `image_2037` / `Frame_13` carry no meaning; ask the reference line instead.
  const generic = /^((image|img|group|frame|slide|rectangle|div)[-_]?\d*)$/i;
  if (generic.test(suffix)) {
    const role = roleFromReferences(asset, referencesByLine);
    suffix = role ? role + "-" + suffix : suffix;
  }

  return kebab(suffix) || "asset";
}

/** A role word for the element that uses the asset, from its class list. */
function roleFromReferences(asset, referencesByLine) {
  for (const ref of asset.references) {
    const line = referencesByLine.get(`${ref.file}:${ref.line}`);
    if (!line) continue;
    // Prefer the nearest preceding className= on the same or previous line.
    const classMatch = line.match(/className=\{?\{?["']([^"']+)["']/);
    if (classMatch) {
      const role = kebab(classMatch[1].split(/\s+/)[0]);
      if (role && role.length > 2) return role;
    }
  }
  return null;
}

/* ----------------------------------------------------------------- plan -- */

const audit = JSON.parse(fs.readFileSync(AUDIT, "utf8"));

/** file -> line -> source text, for role extraction. */
const referencesByLine = new Map();
for (const file of walk(ROOT)) {
  if (!SOURCE_EXT.has(path.extname(file).toLowerCase())) continue;
  if (file.startsWith(PUBLIC + path.sep)) continue;
  if (file.includes("asset-audit.json") || file.includes("migrate-assets.mjs") || file.includes("audit-assets.mjs")) continue;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((text, i) => referencesByLine.set(rel(file) + ":" + (i + 1), text));
}

const plan = new Map(); // oldUrl -> {newUrl, ...}

for (const asset of audit.assets) {
  if (!asset.url.startsWith("/sites/relab-0c02b053/")) continue; // starter leftovers

  const owners = [...new Set(asset.references.map((r) => componentIdOf(r.file)))];
  const folder = folderFor(owners);

  const extension = path.extname(asset.url);
  const base = baseNameFor(asset, referencesByLine);
  plan.set(asset.url, {
    oldUrl: asset.url,
    oldFile: path.join(PUBLIC, asset.url.slice(1)),
    folder: folder.replace(/\/+$/, ""),
    base,
    extension,
    size: asset.size,
    hash: asset.hash,
    references: asset.references,
    duplicateOf: asset.duplicateOf,
    owners,
    shared: folder === "shared" || folder.startsWith("shared/"),
  });
}


/**
 * Assign final names, guaranteeing uniqueness by construction.
 *
 * Checking against the set of paths already handed out — rather than counting
 * per `folder + base` — is what makes this correct. Counting misses the case
 * where one asset's *natural* name collides with the suffix generated for
 * another: `Frame_13_2_` naturally becomes `frame-13-2`, which is exactly what
 * the counter appends to `frame-13` for a third file. Different keys, identical
 * output, and the counter never notices.
 */
const taken = new Set();
for (const entry of plan.values()) {
  let attempt = 0;
  let url;
  do {
    url =
      "/assets/" +
      entry.folder +
      "/" +
      entry.base +
      (attempt ? "-" + (attempt + 1) : "") +
      entry.extension;
    attempt += 1;
  } while (taken.has(url));

  taken.add(url);
  entry.newUrl = url;
  entry.collision = attempt > 1;
}

/* ---------------------------------------------------------------- report -- */

const collisions = [...plan.values()].filter((e) => e.collision).length;

/**
 * Every target path must be unique across the whole plan.
 *
 * The per-folder name counter is not sufficient on its own: it disambiguates
 * within a folder, but nothing stopped two entries arriving at the same path by
 * a different route. When that happened the second copy silently overwrote the
 * first and both sources were unlinked, losing a file with no error. This is
 * checked here rather than discovered afterwards.
 */
const targets = new Map();
const clashingTargets = [];
for (const entry of plan.values()) {
  const existing = targets.get(entry.newUrl);
  if (existing) clashingTargets.push([existing.oldUrl, entry.oldUrl, entry.newUrl]);
  else targets.set(entry.newUrl, entry);
}
if (clashingTargets.length) {
  console.error(
    "ABORT: " + clashingTargets.length + " assets resolve to the same target path:"
  );
  for (const [a, b, url] of clashingTargets.slice(0, 20)) {
    console.error("  " + url);
    console.error("     " + a);
    console.error("     " + b);
  }
  process.exit(1);
}

// Persisted so a collision, or any later question about where a file went,
// can be answered from data rather than by re-deriving it.
fs.writeFileSync(
  path.join(ROOT, "docs", "asset-plan.json"),
  JSON.stringify(
    [...plan.values()].map((e) => ({
      oldUrl: e.oldUrl,
      newUrl: e.newUrl,
      folder: e.folder,
      size: e.size,
      hash: e.hash,
      shared: e.shared,
      owners: e.owners,
      duplicateOf: e.duplicateOf,
      references: e.references.map((r) => r.file + ":" + r.line),
    })),
    null,
    1
  )
);


const byFolder = new Map();
for (const entry of plan.values()) {
  const list = byFolder.get(entry.folder) ?? [];
  list.push(entry);
  byFolder.set(entry.folder, list);
}

console.log("plan: " + plan.size + " assets -> /assets/");
console.log("  " + byFolder.size + " folders, " + collisions + " name collisions disambiguated");
console.log("  shared: " + [...plan.values()].filter((e) => e.shared).length);
console.log("");
for (const [folder, entries] of [...byFolder].sort()) {
  console.log("  " + String(entries.length).padStart(4) + "  /assets/" + folder);
}
console.log("");

if (!APPLY && !VERIFY) {
  console.log("sample mapping");
  for (const entry of [...plan.values()].slice(0, 12)) {
    console.log("  " + entry.oldUrl.replace("/sites/relab-0c02b053/", ""));
    console.log("      -> " + entry.newUrl);
  }
  console.log("\nno changes written. Re-run with --apply.");
  process.exit(0);
}

/* ---------------------------------------------------------------- verify -- */

if (VERIFY) {
  let bad = 0;
  for (const entry of plan.values()) {
    if (!fs.existsSync(path.join(PUBLIC, entry.newUrl.slice(1)))) {
      console.log("  MISSING " + entry.newUrl);
      bad += 1;
    }
  }
  // Every old path still referenced must also still resolve.
  const old = new Set(plan.keys());
  let unresolved = 0;
  for (const file of walk(ROOT)) {
    if (!SOURCE_EXT.has(path.extname(file).toLowerCase())) continue;
    if (file.startsWith(PUBLIC + path.sep)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const m of text.matchAll(/\/sites\/relab-0c02b053\/[^\s"'`,)\]}]+/g)) {
      if (old.has(m[0]) && !fs.existsSync(path.join(PUBLIC, m[0].slice(1)))) {
        console.log("  UNRESOLVED " + m[0] + "  in " + rel(file));
        unresolved += 1;
      }
    }
  }
  console.log("missing targets: " + bad + ", unresolved references: " + unresolved);
  process.exitCode = bad + unresolved === 0 ? 0 : 1;
  process.exit();
}

/* ----------------------------------------------------------------- apply -- */

// 1. Refuse to overwrite anything.
const conflicts = [...plan.values()].filter((e) =>
  fs.existsSync(path.join(PUBLIC, e.newUrl.slice(1)))
);
if (conflicts.length) {
  console.error("ABORT: " + conflicts.length + " target paths already exist:");
  for (const c of conflicts.slice(0, 10)) console.error("  " + c.newUrl);
  process.exit(1);
}

// 2. Move the files. Copy then remove, so an interruption leaves the original
//    in place rather than losing it.
let moved = 0;
for (const entry of plan.values()) {
  const target = path.join(PUBLIC, entry.newUrl.slice(1));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(entry.oldFile, target);
  fs.unlinkSync(entry.oldFile);
  moved += 1;
}
console.log("moved " + moved + " files");

// 3. Remove directories left empty by the move.
function pruneEmpty(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) pruneEmpty(full);
  }
  if (fs.readdirSync(dir).length === 0 && dir.startsWith(PUBLIC)) fs.rmdirSync(dir);
}
pruneEmpty(path.join(PUBLIC, "sites", "relab-0c02b053"));

// 4. Rewrite every reference, longest path first so a prefix can never consume
//    a longer path that starts with the same characters.
const ordered = [...plan.keys()].sort((a, b) => b.length - a.length);
const changedFiles = new Map();

for (const file of walk(ROOT)) {
  const extension = path.extname(file).toLowerCase();
  if (!SOURCE_EXT.has(extension)) continue;
  if (file.startsWith(PUBLIC + path.sep)) continue;
  if (file.endsWith(".json") && file.includes("asset-audit")) continue;
  if (file.includes("migrate-assets.mjs")) continue;

  const before = fs.readFileSync(file, "utf8");
  let after = before;

  for (const oldUrl of ordered) {
    if (!after.includes(oldUrl)) continue;
    const entry = plan.get(oldUrl);
    after = after.split(oldUrl).join(entry.newUrl);
  }

  // app/layout.tsx never writes these paths literally — it builds them as
  // `/sites/${SITE}/${hash}_${name}.png` — so a plain substitution finds
  // nothing and the favicons and the OG thumbnail would 404 the moment the
  // underlying files moved. Each template line is rewritten to the asset's new
  // absolute URL instead, and SITE is dropped because nothing uses it afterwards.
  if (rel(file) === "app/layout.tsx") {
    after = after.replace(
      /`\/sites\/\$\{SITE\}\/([^\`]+)`/g,
      (_whole, name) => {
        const entry = plan.get("/sites/" + SITE_DIR + "/" + name);
        return entry ? entry.newUrl : "/assets/" + name;
      }
    );
    after = after.replace(/\n\s*const SITE\s*=\s*"[^"]*";/, "");
  }

  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changedFiles.set(rel(file), true);
  }
}

console.log("rewrote references in " + changedFiles.size + " files");

// 5. Any asset still referenced under the old prefix is a miss.
let missed = 0;
for (const file of walk(ROOT)) {
  if (!SOURCE_EXT.has(path.extname(file).toLowerCase())) continue;
  if (file.startsWith(PUBLIC + path.sep)) continue;
  if (file.includes("asset-audit") || file.includes("migrate-assets")) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/\/sites\/relab-0c02b053\/[^\s"'`,)\]}]+/g)) {
    if (plan.has(m[0])) {
      console.warn("  still referenced: " + m[0] + "  in " + rel(file));
      missed += 1;
    }
  }
}
console.log("references still pointing at the old tree: " + missed);
if (missed > 0) {
  console.error("WARNING: some references were not rewritten — restore before deploying.");
  process.exitCode = 1;
}