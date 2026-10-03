/**
 * Exercises the edit engine against the real generated components.
 *
 * Run with:  node --experimental-strip-types scripts/test-codemod.ts
 *
 * The codemod rewrites production source on every save, so it is verified
 * against the actual shipped markup rather than a synthetic fixture: a wrong
 * match here would quietly replace the wrong headline on a live page.
 */
import { readFileSync } from "node:fs";
import {
  applyChanges,
  listEditableNodes,
  nodeKey,
  scanElements,
} from "../lib/admin/codemod.ts";

const SECTION =
  "src/components/sites/relab-0c02b053/about-979bddc4/AboutHeroSection.tsx";

const source = readFileSync(SECTION, "utf8");

let failures = 0;
function check(name: string, condition: boolean, detail = "") {
  if (!condition) failures += 1;
  console.log("  " + (condition ? "ok  " : "FAIL") + "  " + name + (detail ? "  " + detail : ""));
}

const ORIGINAL = "Where Brands";
const REPLACEMENT = "Where Creators Meet";

console.log("\nscan: " + SECTION);
const elements = scanElements(source);
console.log(
  "  " + elements.length + " elements, " + listEditableNodes(source).length + " addressable\n"
);

console.log("discovery");
const heroTitle = elements.find(
  (e) => e.tag === "h1" && e.className === "h1 hero-text-one"
);
check("finds the h1 by class", !!heroTitle, heroTitle ? "key=" + nodeKey(heroTitle) : "");
check("captures its text", heroTitle?.hasText === true);
check(
  "text span round-trips",
  heroTitle ? source.slice(heroTitle.textStart, heroTitle.textEnd) === ORIGINAL : false,
  heroTitle ? JSON.stringify(source.slice(heroTitle.textStart, heroTitle.textEnd)) : ""
);

const coverImages = elements.filter(
  (e) => e.tag === "img" && e.className === "cover-size-image"
);
const image = coverImages[0];
check("finds images by class", coverImages.length > 0, "count=" + coverImages.length);
check(
  "captures a literal src",
  typeof image?.attributes.find((a) => a.name === "src")?.literal === "string"
);

console.log("\nduplicate class handling");
const ordinals = coverImages.map((e) => e.ordinal);
check(
  "repeated classes get distinct ordinals",
  new Set(ordinals).size === ordinals.length,
  "ordinals=" + ordinals.join(",")
);
check(
  "each repeated image is individually addressable",
  new Set(coverImages.map(nodeKey)).size === coverImages.length
);

console.log("\ntext patch");
{
  const key = nodeKey(heroTitle!);
  const result = applyChanges(source, [
    { file: SECTION, node: key, kind: "text", value: REPLACEMENT },
  ]);
  check("reports one change", result.changed === 1, "changed=" + result.changed);
  check("new text present", result.content.includes(">" + REPLACEMENT + "</h1>"));
  check("old text gone", !result.content.includes(">" + ORIGINAL + "</h1>"));
  const expectedDelta = REPLACEMENT.length - ORIGINAL.length;
  check(
    "only the replaced text changed length",
    result.content.length === source.length + expectedDelta,
    source.length + " -> " + result.content.length + " (expected +" + expectedDelta + ")"
  );
  const again = applyChanges(result.content, [
    { file: SECTION, node: key, kind: "text", value: REPLACEMENT },
  ]);
  check("idempotent", again.changed === 0);
}

console.log("\nsrc patch (first of several identical classes)");
{
  const firstSrc = image!.attributes.find((a) => a.name === "src")!.literal!;
  const secondSrc = coverImages[1].attributes.find((a) => a.name === "src")!.literal!;
  const result = applyChanges(source, [
    { file: SECTION, node: nodeKey(image!), kind: "src", value: "/sites/new-image.avif" },
  ]);
  check("src replaced", result.content.includes('src={"/sites/new-image.avif"}'));
  check("patched image no longer has its old src", !result.content.includes(firstSrc));
  check(
    "a sibling with the same class is untouched",
    result.content.includes(secondSrc)
  );
  check("loading attr preserved", result.content.includes('loading={"lazy"}'));

  // Targeting the second one by ordinal must not touch the first.
  const second = applyChanges(source, [
    { file: SECTION, node: nodeKey(coverImages[1]), kind: "src", value: "/sites/second.avif" },
  ]);
  check("second image patched by ordinal", second.content.includes('src={"/sites/second.avif"}'));
  check("first image still intact", second.content.includes(firstSrc));
}

console.log("\nmultiple patches in one file");
{
  const keys = elements.filter((e) => e.hasText).slice(0, 3).map(nodeKey);
  const result = applyChanges(source, [
    { file: SECTION, node: keys[0], kind: "text", value: "First" },
    { file: SECTION, node: keys[1], kind: "text", value: "Second" },
    { file: SECTION, node: keys[2], kind: "text", value: "Third" },
  ]);
  check("all three applied", result.changed === 3, "changed=" + result.changed);
  check("First present", result.content.includes(">First<"));
  check("Second present", result.content.includes(">Second<"));
  check("Third present", result.content.includes(">Third<"));
}

console.log("\ncontainers are not mistaken for text");
{
  const section = elements.find((e) => e.tag === "section");
  check("a wrapping section has no editable text", section?.hasText === false);
  const paragraph = elements.find((e) => e.tag === "p");
  check("a paragraph does have editable text", paragraph?.hasText === true);
}

console.log("\nfailure modes");
{
  const attempt = (node: string, kind: "text" | "src" | "href", value: string) => {
    try {
      applyChanges(source, [{ file: SECTION, node, kind, value }]);
      return "";
    } catch (error) {
      return (error as Error).name;
    }
  };
  check("unknown node is refused, not guessed", attempt("div|nope|0", "text", "x") === "PatchError");
  check("text edit on an image is refused", attempt(nodeKey(image!), "text", "x") === "PatchError");
  check("href edit on a heading is refused", attempt(nodeKey(heroTitle!), "href", "/x") === "PatchError");
}

console.log("\nescaping");
{
  const result = applyChanges(source, [
    { file: SECTION, node: nodeKey(heroTitle!), kind: "text", value: 'Say "hello"' },
  ]);
  check("quotes in text preserved verbatim", result.content.includes('>Say "hello"</h1>'));
  const roundTrip = scanElements(result.content).find(
    (e) => e.tag === "h1" && e.className === "h1 hero-text-one"
  );
  check(
    "and the patched text scans back identically",
    roundTrip
      ? result.content.slice(roundTrip.textStart, roundTrip.textEnd) === 'Say "hello"'
      : false
  );
}

console.log(
  "\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED") + "\n"
);
process.exitCode = failures === 0 ? 0 : 1;
