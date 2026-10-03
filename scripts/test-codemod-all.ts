/**
 * Runs the edit engine across every JSX file the editor will have to handle.
 *
 * The unit test proves the algorithm on one well-behaved section. This proves it
 * survives the whole codebase — the shared header/footer (which take props and
 * contain `{currentPath}` expressions), page files (fragments, metadata, imports)
 * and every generated section.
 *
 * Run with:  node --experimental-strip-types scripts/test-codemod-all.ts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  applyChanges,
  isSafeRepoPath,
  nodeKey,
  scanElements,
} from "../lib/admin/codemod.ts";

/**
 * Recursive `.tsx` walk.
 *
 * Hand-rolled rather than `fs.globSync`: the installed `@types/node` does not
 * declare it, and this keeps the script runnable on any Node that can strip
 * types.
 */
function findTsx(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) findTsx(full, found);
    else if (entry.endsWith(".tsx")) found.push(full);
  }
  return found;
}

const roots = ["app", "src", "components"].filter((dir) =>
  statSync(path.resolve(dir), { throwIfNoEntry: false })?.isDirectory()
);

const files = roots
  .flatMap((dir) => findTsx(dir))
  // Repo-relative, forward slashes: the paths below are written with `/` and
  // Windows joins produce `\`.
  .map((f) => path.relative(process.cwd(), f).replace(/\\/g, "/"));

let failures = 0;
let totalElements = 0;
let totalText = 0;
let totalImages = 0;
let totalLinks = 0;

console.log("\nscanning " + files.length + " files\n");

for (const file of files) {
  const source = readFileSync(file, "utf8");
  let elements;
  try {
    elements = scanElements(source);
  } catch (error) {
    failures += 1;
    console.log("  FAIL  " + file + " threw " + (error as Error).message);
    continue;
  }

  totalElements += elements.length;
  const texts = elements.filter((e) => e.hasText);
  const images = elements.filter((e) => e.tag === "img");
  const links = elements.filter((e) => e.tag === "a");
  totalText += texts.length;
  totalImages += images.length;
  totalLinks += links.length;

  // Every element's key must be unique within its file, otherwise an edit could
  // resolve to two different nodes.
  const keys = elements.map(nodeKey);
  const unique = new Set(keys);
  if (unique.size !== keys.length) {
    failures += 1;
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    console.log(
      "  FAIL  " + file + " has " + (keys.length - unique.size) + " duplicate key(s): " +
        [...new Set(dupes)].slice(0, 3).join(", ")
    );
  }

  // A text span must always contain exactly the element's own text — never a
  // neighbour's, and never markup.
  for (const element of texts) {
    const inner = source.slice(element.textStart, element.textEnd);
    if (inner.trim().length === 0 || /[<>{}]/.test(inner)) {
      failures += 1;
      console.log(
        "  FAIL  " + file + " text span for " + nodeKey(element) + " is not clean text: " +
          JSON.stringify(inner.slice(0, 40))
      );
      break;
    }
  }
}

console.log(
  "  elements " + totalElements +
    "   text " + totalText +
    "   images " + totalImages +
    "   links " + totalLinks
);

// Round-trip every text node in a spread of real files: patch it, rescan, and
// require the new text back exactly.
console.log("\nround-trip text edits");
const sample = [
  "src/components/sites/relab-0c02b053/about-979bddc4/AboutHeroSection.tsx",
  "src/components/sites/relab-0c02b053/shared/SiteHeader.tsx",
  "src/components/sites/relab-0c02b053/shared/SiteFooter.tsx",
  "src/components/sites/relab-0c02b053/shared/SiteCta.tsx",
  "app/about/page.tsx",
];

for (const file of sample) {
  if (!files.includes(file)) {
    console.log("  skip  " + file + " (not found)");
    continue;
  }
  const source = readFileSync(file, "utf8");
  const texts = scanElements(source).filter((e) => e.hasText);
  let ok = 0;
  const broken: string[] = [];

  for (const element of texts) {
    const before = source.slice(element.textStart, element.textEnd);
    const value = before + " EDITED";
    const patched = applyChanges(source, [
      { file, node: nodeKey(element), kind: "text", value },
    ]);
    const rescan = scanElements(patched.content).find(
      (e) => nodeKey(e) === nodeKey(element)
    );
    const after = rescan ? patched.content.slice(rescan.textStart, rescan.textEnd) : null;
    if (after === value) ok += 1;
    else broken.push(nodeKey(element) + " -> " + JSON.stringify(after));
  }

  if (broken.length) {
    failures += broken.length;
    console.log("  FAIL  " + file + "  " + (texts.length - ok) + "/" + texts.length + " broken");
    for (const b of broken.slice(0, 3)) console.log("          " + b);
  } else {
    console.log("  ok    " + file + "  " + ok + "/" + texts.length + " text nodes");
  }
}

console.log("\npath safety");
for (const [label, path, expected] of [
  ["normal path", "src/components/a/B.tsx", true],
  ["parent traversal", "../../etc/passwd", false],
  ["absolute path", "/etc/passwd", false],
  ["backslash", "src\\a\\b.tsx", false],
  ["unsupported extension", "src/a.exe", false],
  ["empty", "", false],
] as [string, string, boolean][]) {
  const actual = isSafeRepoPath(path);
  if (actual !== expected) failures += 1;
  console.log("  " + (actual === expected ? "ok  " : "FAIL") + "  " + label);
}

console.log(
  "\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED") + "\n"
);
process.exitCode = failures === 0 ? 0 : 1;