/**
 * Generates ASSETS.md: the inventory of every asset, where it lives now, where it
 * came from, what uses it, and whether it duplicates something else.
 *
 * Usage: node scripts/build-assets-doc.mjs
 *
 * ## Where the data comes from
 *
 * Original paths are read from git rather than from the audit JSON, because the
 * migration rewrote that JSON's `oldUrl` fields along with everything else. Git
 * still has the pre-migration tree, and matching blobs by content hash ties each
 * original file to wherever that exact file ended up -- which is the only link
 * that cannot be wrong.
 *
 * Duplicate status is the same hash appearing more than once. Group sizes are
 * reported, but nothing is deleted: a duplicate that is still referenced is a
 * duplicate that is still needed.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const OUT = path.join(ROOT, "ASSETS.md");
const MAX = 1 << 28;

const ASSET_EXT = new Set([
  ".avif", ".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
  ".mp4", ".webm", ".mov", ".woff", ".woff2", ".ttf", ".otf", ".eot",
]);
const SOURCE_EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs", ".css", ".html"]);
const SKIP = new Set(["node_modules", ".next", ".git", ".vercel"]);

/** Carriage returns normalised: autocrlf must not make two files look different. */
const norm = (buf) =>
  createHash("sha256")
    .update(buf.toString("binary").replace(/\r\n/g, "\n").replace(/\r/g, "\n"), "binary")
    .digest("hex");

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

/* ------------------------------------------------------- original paths -- */

/** hash -> original public-relative paths, from the pre-migration commit. */
const originals = new Map();
const listed = execFileSync(
  "git",
  ["ls-tree", "-r", "--name-only", "HEAD", "--", "public"],
  { cwd: ROOT, encoding: "utf8", maxBuffer: MAX }
);
for (const file of listed.split("\n")) {
  if (!file.trim()) continue;
  let buf;
  try {
    buf = execFileSync("git", ["show", "HEAD:" + file], { cwd: ROOT, maxBuffer: MAX });
  } catch {
    continue;
  }
  const list = originals.get(norm(buf)) ?? [];
  list.push(file);
  originals.set(norm(buf), list);
}

/* ------------------------------------------------------------ new paths -- */

const assets = walk(PUBLIC).filter((f) => ASSET_EXT.has(path.extname(f).toLowerCase()));

const records = assets.map((file) => {
  const buf = fs.readFileSync(file);
  const hash = norm(buf);
  const newUrl = "/" + path.relative(PUBLIC, file).replace(/\\/g, "/");
  const from = originals.get(hash) ?? [];
  return {
    newUrl,
    newFile: path.relative(ROOT, file).replace(/\\/g, "/"),
    hash,
    size: buf.length,
    original: from[0] ? "/" + from[0].replace(/\\/g, "/").replace(/^public\//, "") : null,
    originalCount: from.length,
    references: [],
  };
});

/* ------------------------------------------------------------ references -- */

for (const file of walk(ROOT)) {
  if (!SOURCE_EXT.has(path.extname(file).toLowerCase())) continue;
  if (file.startsWith(PUBLIC + path.sep)) continue;
  if (file.endsWith("build-assets-doc.mjs")) continue;

  const relFile = path.relative(ROOT, file).replace(/\\/g, "/");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

  lines.forEach((text, i) => {
    for (const match of text.matchAll(/\/assets\/[A-Za-z0-9._/-]+/g)) {
      const url = match[0].replace(/[.,;)]+$/, "");
      const record = records.find((r) => r.newUrl === url);
      if (record) record.references.push(relFile + ":" + (i + 1));
    }
  });
}

/* ------------------------------------------------------------ duplicates -- */

const byHash = new Map();
for (const record of records) {
  const list = byHash.get(record.hash) ?? [];
  list.push(record);
  byHash.set(record.hash, list);
}

const duplicateGroups = [...byHash.values()].filter((list) => list.length > 1);
for (const group of duplicateGroups) {
  for (const record of group) {
    record.duplicatesWith = group.filter((r) => r !== record).map((r) => r.newUrl);
  }
}

/** A duplicate that nothing references, and whose group has a referenced twin. */
const removable = [];
for (const group of duplicateGroups) {
  const referenced = group.filter((r) => r.references.length > 0);
  const orphans = group.filter((r) => r.references.length === 0);
  // Safe to remove only when at least one copy is still referenced AND the
  // orphan is genuinely unreferenced, not merely a copy we failed to attribute.
  if (referenced.length === 0 || orphans.length === 0) continue;
  const keep = referenced[0];
  for (const orphan of orphans) {
    removable.push({ orphan, keep, size: orphan.size });
  }
}

/* ---------------------------------------------------------------- write -- */

const kb = (n) => (n / 1024).toFixed(1) + " KB";
const total = records.reduce((n, r) => n + r.size, 0);
const referenced = records.filter((r) => r.references.length > 0);
const unreferenced = records.filter((r) => r.references.length === 0);
const reclaimable = removable.reduce((n, r) => n + r.size, 0);

const lines = [];
lines.push("# Asset inventory");
lines.push("");
lines.push(
  "Every asset the site serves, where it lives now, where it came from, and what uses it."
);
lines.push("");
lines.push("Generated by `npm run assets:doc`. Do not edit by hand.");
lines.push("");
lines.push("## At a glance");
lines.push("");
lines.push("| | |");
lines.push("| --- | --- |");
lines.push("| Assets | " + records.length + " (" + kb(total) + ") |");
lines.push("| Referenced by the site | " + referenced.length + " |");
lines.push("| Not referenced | " + unreferenced.length + " |");
lines.push("| Distinct contents (SHA-256) | " + byHash.size + " |");
lines.push("| Duplicate groups | " + duplicateGroups.length + " |");
lines.push(
  "| Unreferenced duplicates of a referenced file | " + removable.length +
    " (" + kb(reclaimable) + " reclaimable) |"
);
lines.push("");

lines.push("## How this is organised");
lines.push("");
lines.push("```");
lines.push("public/assets/");
lines.push("  <page>/            assets used by one page only");
lines.push("    NN-<section>/     numbered in the order the section renders");
lines.push("    _shared/          used by several sections of the same page");
lines.push("  shared/            used across pages, or by shared components");
lines.push("```");
lines.push("");
lines.push(
  "Section numbers come from the order the sections appear in each page module, not " +
    "from the alphabet, so `03-hero-intro` really is the third section."
);
lines.push("");
lines.push(
  "Filenames drop Webflow's hash prefix (`6a97ffdf…_Slide_7.webp` becomes `slide-7.webp`) " +
    "and are kebab-cased. Where the original suffix carried no meaning -- `image_2037` -- the " +
    "referring element's own class supplies a role word instead."
);
lines.push("");

lines.push("## Folder summary");
lines.push("");
lines.push("| Folder | Assets |");
lines.push("| --- | --- |");
const folders = new Map();
for (const record of records) {
  const folder = path.dirname(record.newUrl).replace(/^\/assets\/?/, "") || "(root)";
  folders.set(folder, (folders.get(folder) ?? 0) + 1);
}
for (const [folder, count] of [...folders].sort()) {
  lines.push("| `/assets/" + folder + "` | " + count + " |");
}
lines.push("");

lines.push("## Assets with no reference");
lines.push("");
lines.push(
  "Nothing in this list has been deleted. They are reported so a human can decide; the " +
    "hash column shows which file each is a byte-for-byte copy of, and a file is only a " +
    "safe delete when an identical copy is still referenced."
);
lines.push("");
lines.push("| New path | Size | Identical to |");
lines.push("| --- | --- | --- |");
for (const record of unreferenced.sort((a, b) => b.size - a.size)) {
  const twin = record.duplicatesWith?.[0];
  lines.push(
    "| `" + record.newUrl + "` | " + kb(record.size) + " | " +
      (twin ? "`" + twin + "`" : "-- unique content --") + " |"
  );
}
lines.push("");

lines.push("## Duplicates by content hash");
lines.push("");
lines.push(
  "Groups of files whose SHA-256 is identical. These are the same image stored more than " +
    "once, usually once per page that used it. **None have been removed** -- the copies are " +
    "still referenced from different pages, and deleting one would break whichever page " +
    "pointed at it."
);
lines.push("");
lines.push("| Copies | Size each | Hash | Paths |");
lines.push("| --- | --- | --- | --- |");
for (const group of duplicateGroups.sort(
  (a, b) => b.length - a.length || b[0].size - a[0].size
)) {
  lines.push(
    "| " + group.length +
      " | " + kb(group[0].size) +
      " | `" + group[0].hash.slice(0, 12) + "` | " +
      group.map((r) => "`" + r.newUrl + "`").join("<br>") + " |"
  );
}
lines.push("");

lines.push("## Full inventory");
lines.push("");
lines.push("| New path | Original path | Size | Used by | Duplicates |");
lines.push("| --- | --- | --- | --- | --- |");
for (const record of records.sort((a, b) => a.newUrl.localeCompare(b.newUrl))) {
  const used = record.references.length
    ? record.references.map((r) => "`" + r + "`").join("<br>")
    : "_unreferenced_";
  const dupes = record.duplicatesWith?.length ? record.duplicatesWith.length + " identical" : "--";
  lines.push(
    "| `" + record.newUrl + "` | " +
      (record.original ? "`" + record.original + "`" : "_not in git_") + " | " +
      kb(record.size) + " | " + used + " | " + dupes + " |"
  );
}
lines.push("");

lines.push("## Verification");
lines.push("");
lines.push("```bash");
lines.push("node scripts/audit-assets.mjs          # re-audit the current tree");
lines.push("node scripts/asset-integrity.mjs       # nothing lost, added or altered");
lines.push("node scripts/verify-asset-loads.mjs    # load every page, fail on any 404");
lines.push("```");
lines.push("");
lines.push(
  "`asset-integrity` compares every asset against the pre-migration commit by content hash, " +
    "normalising line endings because `core.autocrlf` is on and would otherwise report every " +
    "SVG as changed."
);
lines.push("");

fs.writeFileSync(OUT, lines.join("\n"), "utf8");

console.log("wrote ASSETS.md");
console.log("  " + records.length + " assets, " + byHash.size + " distinct contents");
console.log("  " + referenced.length + " referenced, " + unreferenced.length + " not");
console.log("  " + duplicateGroups.length + " duplicate groups");
console.log("  " + removable.length + " unreferenced duplicates of a referenced file (" + kb(reclaimable) + ")");