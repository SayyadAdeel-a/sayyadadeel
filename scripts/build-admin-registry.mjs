/**
 * Generates `src/generated/admin-registry.ts` from the site's own route modules.
 *
 * The admin editor needs two things that must never drift from the real site:
 *
 *   1. **The page module for each route**, so `/admin/about` can render the
 *      genuine page rather than a reconstruction of it.
 *   2. **The root CSS class of each component file**, so a clicked DOM element
 *      can be traced back to the one file that has to be rewritten.
 *
 * Both are derived from the source, so adding or renaming a page updates the
 * editor automatically. Nothing here is hand-maintained.
 *
 * Import specifiers are resolved through the `@/*` alias declared in
 * tsconfig.json rather than against the repo root, because `@/components/...`
 * means `src/components/...`.
 *
 * Usage: node scripts/build-admin-registry.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
// The same scanner the browser editor and the publish route use. Sharing it is
// the point: an element the registry calls editable is exactly an element
// `applyChanges` can rewrite, so the editor can never offer something that will
// be refused at save time.
import { scanElements, nodeKey } from "../lib/admin/codemod.ts";

const ROOT = process.cwd();
const APP = path.join(ROOT, "app");
const OUT = path.join(ROOT, "src", "generated", "admin-registry.ts");

/** Read the `@/*` alias bases out of tsconfig, in declaration order. */
function aliasBases() {
  try {
    const tsconfig = JSON.parse(readFileSync(path.join(ROOT, "tsconfig.json"), "utf8"));
    const paths = tsconfig?.compilerOptions?.paths ?? {};
    const bases = [];
    for (const [pattern, targets] of Object.entries(paths)) {
      if (!pattern.endsWith("/*")) continue;
      const prefix = pattern.slice(0, -1); // "@/"
      for (const target of targets) {
        bases.push({ prefix, dir: path.resolve(ROOT, target.slice(0, -1)) });
      }
    }
    // tsconfig lists `./src/*` before `./*`, so src wins.
    return bases;
  } catch {
    return [{ prefix: "@/", dir: path.join(ROOT, "src") }];
  }
}

const ALIASES = aliasBases();

/** Every `app/**\/page.tsx`, keyed by the route it serves. */
function findPageFiles(dir = APP, base = "") {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // `app/admin` and `app/api` are the editor's own surface, not site pages.
      if (["admin", "api"].includes(entry.name)) continue;
      found.push(...findPageFiles(full, base + "/" + entry.name));
    } else if (entry.name === "page.tsx") {
      found.push({ route: base || "/", file: full });
    }
  }
  return found;
}

function importedSpecifiers(file) {
  const source = readFileSync(file, "utf8");
  const specifiers = new Set();
  const pattern = /from\s+"([^"]+)"/g;
  let match;
  while ((match = pattern.exec(source)) !== null) specifiers.add(match[1]);
  return [...specifiers];
}

/** Resolve an aliased specifier to a repo-relative path, if it is a real file. */
function resolveImport(specifier) {
  const alias = ALIASES.find((entry) => specifier.startsWith(entry.prefix));
  if (!alias) return null;
  const base = path.join(alias.dir, specifier.slice(alias.prefix.length));
  for (const candidate of [base + ".tsx", base + ".ts", base + ".json"]) {
    if (existsSync(candidate)) return path.relative(ROOT, candidate).replace(/\\/g, "/");
  }
  for (const index of ["index.tsx", "index.ts"]) {
    const candidate = path.join(base, index);
    if (existsSync(candidate)) return path.relative(ROOT, candidate).replace(/\\/g, "/");
  }
  return null;
}

/**
 * The classes that can be the outermost element of a component.
 *
 * A generated section opens with a single element, so its first `className`
 * literal is that root. Shared components may branch (a desktop and a mobile
 * header, say), so the first few distinct literals are all candidates — the
 * editor accepts a click inside any of them.
 *
 * Only `classList[0]` is ever compared against these, which keeps a nested
 * element that merely *contains* the word from claiming ownership of the file.
 */
function rootClasses(file, limit = 4) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  const classes = [];

  for (let i = 0; i < lines.length; i++) {
    // Two-space indent is the component's own return, not one nested inside a
    // callback or a helper.
    if (!/^ {2}return\s*\(/.test(lines[i])) continue;

    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j];
      if (/^ {2}\S/.test(line)) break; // walked back out of the return block
      if (!/<[a-zA-Z][\w.-]*\s/.test(line)) continue;
      const className = line.match(/className=\{"([^"]*)"\}/);
      const first = className ? className[1].trim().split(/\s+/)[0] : null;
      if (first && !classes.includes(first)) classes.push(first);
      break; // only the first element of this return
    }
  }

  return classes.slice(0, limit);
}

function labelFor(route) {
  if (route === "/") return "Home";
  const segments = route.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  return last
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const pages = findPageFiles();
const entries = [];
const fileRoots = {};
const specifiersByFile = {};

for (const page of pages) {
  const pageFile = "app" + (page.route === "/" ? "/page.tsx" : page.route + "/page.tsx");
  const files = new Set([pageFile]);

  for (const specifier of importedSpecifiers(page.file)) {
    const resolved = resolveImport(specifier);
    if (resolved) files.add(resolved);
  }

  for (const file of files) {
    if (specifiersByFile[file]) continue;
    // Transitive: a section may itself import shared components.
    specifiersByFile[file] = [];
    if (existsSync(path.join(ROOT, file))) {
      for (const specifier of importedSpecifiers(path.join(ROOT, file))) {
        const resolved = resolveImport(specifier);
        if (resolved && files.has(resolved)) specifiersByFile[file].push(resolved);
      }
    }
  }

  entries.push({
    route: page.route,
    label: labelFor(page.route),
    pageModule: "@/app" + (page.route === "/" ? "/page" : page.route + "/page"),
    files: [...files].sort(),
  });
}

entries.sort((a, b) =>
  a.route === "/" ? -1 : b.route === "/" ? 1 : a.route.localeCompare(b.route)
);

// A file can appear on several routes; only its component files have root
// classes to index.
const componentFiles = new Set();
for (const entry of entries) {
  for (const file of entry.files) {
    if (file.startsWith("src/") && file.endsWith(".tsx")) componentFiles.add(file);
  }
}

for (const file of [...componentFiles].sort()) {
  const classes = rootClasses(path.join(ROOT, file));
  if (classes.length) fileRoots[file] = classes;
}

/**
 * Every addressable element in every component file, with what can be edited.
 *
 * The editor previously decided what was selectable from a hard-coded tag list
 * (`h1,h2,p,li,a,img,span,blockquote`), which silently excluded a large part of a
 * Webflow page — Webflow renders much of its copy as `div`, so labels and button
 * captions were unselectable. And it could not tell the difference between an
 * element that is genuinely editable and one whose text comes from a computed
 * expression, which the codemod refuses to rewrite.
 *
 * This index is the answer: it is produced by the same scanner that performs the
 * patch, so "the editor offers it" and "the codemod can rewrite it" are the same
 * statement. `cap` is the set of editable properties; an element with an empty
 * set is not offered at all.
 */
const fileElements = {};
const fileTotals = {};
let totalEditable = 0;
let totalScanned = 0;

for (const file of [...componentFiles].sort()) {
  const elements = scanElements(readFileSync(path.join(ROOT, file), "utf8"));
  const rows = [];
  const totals = {};

  for (const element of elements) {
    // Ordinals run over *every* element in the file, editable or not, so the
    // totals have to count the same way — otherwise a class shared between an
    // editable and a non-editable element makes the two disagree, and the
    // mismatch reads as conditional rendering.
    const prefix = nodeKey(element).slice(0, nodeKey(element).lastIndexOf("|"));
    totals[prefix] = (totals[prefix] ?? 0) + 1;
    totalScanned += 1;

    const cap = [];
    if (element.hasText) cap.push("text");
    for (const kind of ["src", "href", "alt"]) {
      const attribute = element.attributes.find((a) => a.name === kind);
      // Only literal attributes are editable. A computed one (`href={x}`) is
      // refused by `applyChanges`, so it must be refused here too rather than
      // failing later, in front of the operator.
      if (attribute && attribute.literal !== null) cap.push(kind);
    }
    if (cap.length === 0) continue;
    rows.push({ n: nodeKey(element), c: cap });
    totalEditable += 1;
  }

  if (rows.length) fileElements[file] = rows;
  if (Object.keys(totals).length) fileTotals[file] = totals;
}

const body = `// GENERATED by scripts/build-admin-registry.mjs — do not edit by hand.
// Regenerate with: npm run admin:registry
//
// Four tables the admin editor runs on:
//   ROUTES        every editable page, the module that renders it, its files
//   FILE_ROOTS    the CSS classes that can begin a component, used to attribute
//                 a clicked DOM element back to the file that must be rewritten
//   FILE_ELEMENTS every addressable element per file, and which of its
//                 properties can be edited
//   PAGES         lazy loaders, so /admin/edit/about renders the genuine page
//                 instead of a reconstruction of it

import type { ComponentType } from "react";

export interface RouteEntry {
  route: string;
  label: string;
  /** Import specifier of the real page module. */
  pageModule: string;
  /** Source files that make up this route, repo-relative. */
  files: string[];
}

/** Properties that can be edited on an element. */
export type EditableProperty = "text" | "src" | "href" | "alt";

export interface EditableNode {
  /** \`tag|first-class|ordinal\` — the address the codemod resolves. */
  n: string;
  /** Editable properties on this element. */
  c: EditableProperty[];
}

export const ROUTES: RouteEntry[] = ${JSON.stringify(entries, null, 2)};

export const FILE_ROOTS: Record<string, string[]> = ${JSON.stringify(fileRoots, null, 2)};

export const FILE_ELEMENTS: Record<string, EditableNode[]> = ${JSON.stringify(fileElements)};

/**
 * How many elements of each \`tag|first-class\` a file declares — *all* of them,
 * not only the editable ones.
 *
 * The editor counts matching elements in the live DOM to derive an ordinal, and
 * that count can only differ from the source's if React rendered something
 * conditionally. Comparing against this total lets the editor drop a file it
 * cannot address safely, instead of aiming saves at the wrong elements.
 *
 * It must count non-editable elements too: ordinals are assigned over the whole
 * file, so a class shared between an editable and a plain element would otherwise
 * make the two sides disagree and every file look conditionally rendered.
 */
export const FILE_TOTALS: Record<string, Record<string, number>> = ${JSON.stringify(fileTotals)};

export const PAGES: Record<string, () => Promise<{ default: ComponentType }>> = {
${entries.map((e) => `  ${JSON.stringify(e.route)}: () => import(${JSON.stringify(e.pageModule)}),`).join("\n")}
};

/** The address of this route in the editor: "/" -> /admin/edit, "/about" -> /admin/edit/about. */
export function editorUrl(route: string): string {
  return route === "/" ? "/admin/edit" : "/admin/edit/" + route.slice(1);
}

export function routeFiles(route: string): string[] {
  return ROUTES.find((entry) => entry.route === route)?.files ?? [];
}

/** Routes affected by a change to this file. */
export function routesUsingFile(file: string): string[] {
  return ROUTES.filter((entry) => entry.files.includes(file)).map((entry) => entry.route);
}

/** The file whose root class matches this element's first class, if any. */
export function fileForRootClass(className: string): string | null {
  for (const [file, classes] of Object.entries(FILE_ROOTS)) {
    if (classes.includes(className)) return file;
  }
  return null;
}
`;

writeFileSync(OUT, body, "utf8");

console.log(
  "wrote src/generated/admin-registry.ts  " +
    entries.length +
    " routes, " +
    componentFiles.size +
    " component files, " +
    Object.keys(fileRoots).length +
    " with root classes, " +
    totalEditable +
    " editable of " +
    totalScanned +
    " elements"
);

// Warn loudly if a component has no identifiable root: its elements would be
// unattributable and therefore uneditable, which is better to know now.
const withoutRoots = [...componentFiles].filter((f) => !fileRoots[f]);
if (withoutRoots.length) {
  console.log("  no root class: " + withoutRoots.join(", "));
}

// The inverse matters just as much: a file with roots but no addressable elements
// is a section whose every string is computed, so nothing in it can be edited.
const silent = [...componentFiles].filter(
  (f) => fileRoots[f] && !fileElements[f]
);
if (silent.length) {
  console.log(
    "  nothing editable (all copy is computed): " + silent.length + " file(s)"
  );
}

// Per-route totals, so a route that offers almost nothing is visible before
// someone wonders why.
const perRoute = entries
  .map((entry) => ({
    route: entry.route,
    count: entry.files.reduce(
      (total, file) => total + (fileElements[file]?.length ?? 0),
      0
    ),
  }))
  .sort((a, b) => a.count - b.count);

console.log(
  "  fewest editable elements: " +
    perRoute
      .slice(0, 3)
      .map((entry) => entry.route + " (" + entry.count + ")")
      .join(", ")
);
for (const entry of entries.slice(0, 4)) {
  console.log("  " + entry.route.padEnd(46) + entry.files.length + " file(s)");
}