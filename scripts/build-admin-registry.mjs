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

const body = `// GENERATED by scripts/build-admin-registry.mjs — do not edit by hand.
// Regenerate with: node scripts/build-admin-registry.mjs
//
// Three tables the admin editor runs on:
//   ROUTES       every editable page, the module that renders it, its files
//   FILE_ROOTS   the CSS classes that can begin a component, used to attribute
//                a clicked DOM element back to the file that must be rewritten
//   PAGES        lazy loaders, so /admin/about renders the genuine page instead
//                of a reconstruction of it

import type { ComponentType } from "react";

export interface RouteEntry {
  route: string;
  label: string;
  /** Import specifier of the real page module. */
  pageModule: string;
  /** Source files that make up this route, repo-relative. */
  files: string[];
}

export const ROUTES: RouteEntry[] = ${JSON.stringify(entries, null, 2)};

export const FILE_ROOTS: Record<string, string[]> = ${JSON.stringify(fileRoots, null, 2)};

export const PAGES: Record<string, () => Promise<{ default: ComponentType }>> = {
${entries.map((e) => `  ${JSON.stringify(e.route)}: () => import(${JSON.stringify(e.pageModule)}),`).join("\n")}
};

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
    " with root classes"
);

// Warn loudly if a component has no identifiable root: its elements would be
// unattributable and therefore uneditable, which is better to know now.
const withoutRoots = [...componentFiles].filter((f) => !fileRoots[f]);
if (withoutRoots.length) {
  console.log("  no root class: " + withoutRoots.join(", "));
}
for (const entry of entries.slice(0, 4)) {
  console.log("  " + entry.route.padEnd(46) + entry.files.length + " file(s)");
}