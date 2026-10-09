/**
 * Asset audit: where every asset lives, what references it, and what is a
 * duplicate of something else.
 *
 * Usage:
 *   node scripts/audit-assets.mjs            # human-readable report
 *   node scripts/audit-assets.mjs --json     # machine-readable, for the migrate step
 *
 * Read-only. Nothing is moved or rewritten here.
 *
 * ## Why a script and not a grep
 *
 * Assets are referenced from four different places with four different syntaxes,
 * and a single search misses three of them:
 *
 *   JSX/TS     src={"/sites/..."}      in generated components
 *   CSS        url("/sites/...")       in webflow.css, globals.css, critical.css
 *   runtime    string literals in the interaction payloads and page data
 *   markup     srcset, poster, data-src, and CSS custom properties
 *
 * It also has to be careful about what it reports. A path can look referenced and
 * not be — a Webflow `data-wf-*` attribute that happens to contain a slash, or a
 * comment. So every hit is confirmed to be an actual filesystem path before it is
 * called a reference.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const JSON_OUT = process.argv.includes("--json");

/** Extensions that count as assets worth reorganising. */
const ASSET_EXT = new Set([
  ".avif", ".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
  ".mp4", ".webm", ".mov", ".woff", ".woff2", ".ttf", ".otf", ".eot",
]);

/** Directories never walked. */
const SKIP = new Set(["node_modules", ".next", ".git", ".vercel"]);

/* ----------------------------------------------------------------- files -- */

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** Source files that could contain a reference. */
const SOURCE_EXT = new Set([
  ".tsx", ".ts", ".jsx", ".js", ".mjs", ".css", ".json", ".html", ".md",
]);

function isSource(file) {
  return SOURCE_EXT.has(path.extname(file).toLowerCase());
}

/* ------------------------------------------------------------- inventory -- */

const allFiles = walk(ROOT);
const assets = allFiles.filter(
  (file) =>
    file.startsWith(PUBLIC + path.sep) &&
    ASSET_EXT.has(path.extname(file).toLowerCase())
);

/** Every file under public/, including the runtime JS, for completeness. */
const publicFiles = allFiles.filter((file) => file.startsWith(PUBLIC + path.sep));

/** siteRoot is the prefix every site asset shares. */
const SITE_PREFIX = "/sites/adeel-site/";

function toUrl(file) {
  return "/" + path.relative(PUBLIC, file).replace(/\\/g, "/");
}

const byUrl = new Map();
for (const file of assets) byUrl.set(toUrl(file), file);

/* ------------------------------------------------------------ references -- */

/**
 * Every `/sites/adeel-site/...` path mentioned in a source file, with the
 * line it appears on.
 */
const referenceHits = new Map(); // url -> [{file, line, column, context}]

// Only asset paths are of interest. A `.tsx`, `.ts`, `.json` or bare
// directory sharing the prefix is a module import or a prose mention in a
// comment or doc; counting it as an asset reference produces a long tail of
// phantom "dangling" entries.
const isAssetPath = (candidate) =>
  ASSET_EXT.has(path.extname(candidate).toLowerCase());

const sourceFiles = allFiles.filter(
  (file) => isSource(file) && !file.startsWith(PUBLIC + path.sep)
);

for (const file of sourceFiles) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let at = line.indexOf(SITE_PREFIX);
    while (at !== -1) {
      // Take the path up to the first quote, paren, comma or whitespace.
      const rest = line.slice(at);
      const match = rest.match(
        /^\/sites\/relab-0c02b053\/[^\s"'`,)\]}\\}]+/
      );
      const url = match ? match[0] : null;

      // `@/components/sites/adeel-site/...` is a TypeScript import of a
      // component module, not an asset. It shares the prefix, so it has to be
      // excluded explicitly or every page file reports 6 phantom references.
      const isImport = /@\/components\s*$/.test(line.slice(0, at));

      if (url && !isImport && isAssetPath(url)) {
        const list = referenceHits.get(url) ?? [];
        list.push({
          file: path.relative(ROOT, file).replace(/\\/g, "/"),
          line: i + 1,
          column: at + 1,
        });
        referenceHits.set(url, list);
      }
      at = line.indexOf(SITE_PREFIX, at + 1);
    }
  }
}

/**
 * References assembled at runtime rather than written literally.
 *
 * `app/layout.tsx` builds its favicon and OG URLs from
 * `` `/sites/${SITE}/${hash}_${name}.png` ``, so a literal-path scan sees the
 * template and misses the files entirely. Those files are real and referenced,
 * and calling them unused would have got them deleted.
 */
function findTemplateReferences() {
  const results = [];

  const layout = path.join(ROOT, "app", "layout.tsx");
  if (!fs.existsSync(layout)) return results;

  const text = fs.readFileSync(layout, "utf8");
  const site = text.match(/const SITE\s*=\s*"([^"]+)"/);
  if (!site) return results;

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    // Each template line names one file: url: `/sites/${SITE}/<name>`
    for (const template of lines[i].matchAll(
      /`\/sites\/\$\{SITE\}\/([^`]+)`/g
    )) {
      const url = "/sites/" + site[1] + "/" + template[1];
      results.push({ url, file: "app/layout.tsx", line: i + 1, column: 1 });
    }
  }
  return results;
}

for (const hit of findTemplateReferences()) {
  const list = referenceHits.get(hit.url) ?? [];
  list.push({ file: hit.file, line: hit.line, column: hit.column });
  referenceHits.set(hit.url, list);
}

/** References to files that are not on disk. */
const dangling = [];
for (const [url, hits] of referenceHits) {
  if (!byUrl.has(url)) dangling.push({ url, hits });
}

/* ------------------------------------------------------------ duplicates -- */

function hashOf(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const byHash = new Map(); // hash -> [file]
for (const file of assets) {
  const hash = hashOf(file);
  const list = byHash.get(hash) ?? [];
  list.push(file);
  byHash.set(hash, list);
}

const duplicateGroups = [];
for (const [hash, files] of byHash) {
  if (files.length > 1) {
    duplicateGroups.push({
      hash,
      size: fs.statSync(files[0]).size,
      urls: files.map(toUrl),
    });
  }
}
duplicateGroups.sort((a, b) => b.urls.length - a.urls.length || b.size - a.size);

/* ---------------------------------------------------------------- report -- */

/** How many times each asset is referenced, and from where. */
const referenced = new Set([...referenceHits.keys()].filter((u) => byUrl.has(u)));
const unreferenced = assets.filter((file) => !referenced.has(toUrl(file)));

/** Files under public/ that are neither assets nor referenced — e.g. the runtime. */
const otherPublic = publicFiles.filter((file) => !ASSET_EXT.has(path.extname(file).toLowerCase()));

if (JSON_OUT) {
  const report = {
    sitePrefix: SITE_PREFIX,
    assetCount: assets.length,
    referencedCount: referenced.size,
    unreferencedCount: unreferenced.length,
    duplicateGroups: duplicateGroups.length,
    duplicateFiles: duplicateGroups.reduce((n, g) => n + g.urls.length, 0),
    reclaimableBytes: duplicateGroups.reduce(
      (n, g) => n + g.size * (g.urls.length - 1),
      0
    ),
    assets: assets.map((file) => {
      const url = toUrl(file);
      const hash = hashOf(file);
      return {
        url,
        file: path.relative(ROOT, file).replace(/\\/g, "/"),
        size: fs.statSync(file).size,
        hash,
        references: referenceHits.get(url) ?? [],
        duplicateOf:
          duplicateGroups.find((g) => g.urls.includes(url))?.urls.filter((u) => u !== url) ?? [],
      };
    }),
    dangling,
    otherPublic: otherPublic.map((file) => ({
      url: toUrl(file),
      size: fs.statSync(file).size,
    })),
  };
  fs.writeFileSync(
    path.join(ROOT, "docs", "asset-audit.json"),
    JSON.stringify(report, null, 2)
  );
  console.log("wrote docs/asset-audit.json");
  console.log(
    "  " + report.assetCount + " assets, " + report.referencedCount + " referenced, " +
    report.unreferencedCount + " unreferenced"
  );
  console.log(
    "  " + report.duplicateGroups + " duplicate groups covering " + report.duplicateFiles +
    " files, " + (report.reclaimableBytes / 1024 / 1024).toFixed(1) + " MB reclaimable"
  );
  if (report.dangling.length) console.log("  DANGLING: " + report.dangling.length);
} else {
  console.log("\nasset inventory");
  console.log("  " + SITE_PREFIX + "**");
  console.log("  " + assets.length + " asset files, " + (assets.reduce((n, f) => n + fs.statSync(f).size, 0) / 1024 / 1024).toFixed(1) + " MB");
  console.log("  " + referenced.size + " referenced, " + unreferenced.length + " unreferenced");
  console.log("  " + otherPublic.length + " non-asset files under public/ (runtime, data)");

  console.log("\nby folder");
  const byFolder = new Map();
  for (const file of assets) {
    const dir = path.dirname(path.relative(PUBLIC, file)).replace(/\\/g, "/");
    byFolder.set(dir, (byFolder.get(dir) ?? 0) + 1);
  }
  for (const [dir, count] of [...byFolder].sort((a, b) => b[1] - a[1])) {
    console.log("  " + String(count).padStart(4) + "  " + dir);
  }

  console.log("\nby extension");
  const byExt = new Map();
  for (const file of assets) {
    const ext = path.extname(file).toLowerCase();
    byExt.set(ext, (byExt.get(ext) ?? 0) + 1);
  }
  for (const [ext, count] of [...byExt].sort((a, b) => b[1] - a[1])) {
    console.log("  " + String(count).padStart(4) + "  " + ext);
  }

  console.log("\nreference sources");
  const byFile = new Map();
  for (const [url, hits] of referenceHits) {
    for (const hit of hits) {
      byFile.set(hit.file, (byFile.get(hit.file) ?? 0) + 1);
    }
  }
  for (const [file, count] of [...byFile].sort((a, b) => b[1] - a[1])) {
    console.log("  " + String(count).padStart(4) + "  " + file);
  }

  console.log("\nduplicates by content hash");
  if (!duplicateGroups.length) console.log("  none");
  for (const group of duplicateGroups.slice(0, 12)) {
    console.log(
      "  " + group.urls.length + "x  " +
      (group.size / 1024).toFixed(1) + " KB  " +
      group.hash.slice(0, 12) + "  " + group.urls[0].replace(SITE_PREFIX, "")
    );
  }
  if (duplicateGroups.length > 12) console.log("  ... and " + (duplicateGroups.length - 12) + " more groups");
  const reclaimable = duplicateGroups.reduce((n, g) => n + g.size * (g.urls.length - 1), 0);
  console.log("  total reclaimable: " + (reclaimable / 1024 / 1024).toFixed(1) + " MB");

  console.log("\nunreferenced assets");
  if (!unreferenced.length) console.log("  none");
  for (const file of unreferenced.slice(0, 15)) {
    console.log("  " + toUrl(file).replace(SITE_PREFIX, ""));
  }
  if (unreferenced.length > 15) console.log("  ... and " + (unreferenced.length - 15) + " more");

  console.log("\ndangling references (path in code, no file)");
  if (!dangling.length) console.log("  none");
  for (const entry of dangling.slice(0, 15)) {
    console.log("  " + entry.url.replace(SITE_PREFIX, "") + "  <- " + entry.hits[0].file + ":" + entry.hits[0].line);
  }
  if (dangling.length > 15) console.log("  ... and " + (dangling.length - 15) + " more");

  console.log(
    "\nnon-asset files under public/\n  " +
    otherPublic.map((f) => path.basename(f)).sort().join(", ").slice(0, 400)
  );
  console.log("");
}