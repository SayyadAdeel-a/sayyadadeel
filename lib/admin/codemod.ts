/**
 * The edit engine: maps a DOM element the user clicked back to a precise,
 * verifiable location in a generated `.tsx` file and rewrites exactly one value.
 *
 * ## Why a scanner rather than an AST
 *
 * `typescript` is available as a devDependency but is ~20 MB; importing it from a
 * serverless function to parse four-line JSX would bloat the bundle enormously.
 * The generated components are machine-emitted and extremely regular — literal
 * attributes, no conditionals, no fragments inside sections — so a small
 * purpose-built scanner is both sufficient and far cheaper.
 *
 * ## Why the scanner is safe
 *
 * The dangerous failure mode for a codemod is silently rewriting the wrong
 * element: a CMS page's prices change, or a headline is replaced on a different
 * card. Two properties prevent that here.
 *
 *  1. **Resolution is by identity, not position.** A node is addressed by
 *     `tag|className|ordinal` where the ordinal counts earlier elements in the
 *     file with the same tag *and* class. Position-free, so an unrelated edit
 *     elsewhere in the file cannot shift the target.
 *  2. **Every patch is verified.** `applyChanges` reports how many elements it
 *     rewrote and refuses the file outright if a change cannot be resolved
 *     uniquely. `publish` aborts rather than commit a partial or ambiguous edit.
 *
 * Failures are returned to the browser, not swallowed: an editor that quietly
 * does nothing is worse than one that says it could not find the element.
 */

export type EditKind = "text" | "src" | "href" | "alt";

export interface EditChange {
  /** Repo-relative path, e.g. `src/components/.../AboutHeroSection.tsx`. */
  file: string;
  /** `tag|className|ordinal` — see module docs. */
  node: string;
  kind: EditKind;
  value: string;
}

export interface EditResult {
  file: string;
  content: string;
  changed: number;
}

export class PatchError extends Error {
  // Written out rather than using constructor parameter properties, so the file
  // can be run directly by `node --experimental-strip-types` in the test script.
  readonly file: string;
  readonly node: string;

  constructor(message: string, file: string, node: string) {
    super(message);
    this.name = "PatchError";
    this.file = file;
    this.node = node;
  }
}

interface Attribute {
  name: string;
  /** Literal string contents, for `name="x"` and `name={"x"}`. */
  literal: string | null;
  /** Source span of the whole `name=value` pair. */
  start: number;
  end: number;
}

interface Element {
  tag: string;
  className: string;
  attributes: Attribute[];
  /** Span of the element's inner text, for `text` edits. */
  textStart: number;
  textEnd: number;
  hasText: boolean;
  /** Index among earlier elements in the file with the same tag and class. */
  ordinal: number;
}

const VOID_TAGS = new Set(["img", "br", "hr", "input", "source", "meta", "link"]);

/**
 * Matches one JSX opening tag.
 *
 * Group 1 is the tag name, group 2 the attributes, group 3 the optional
 * self-closing slash. Attribute values may contain `>` inside braces or quotes,
 * which is why the body cannot simply be "anything but `>`".
 */
const OPEN_TAG = /<([a-zA-Z][\w.-]*)((?:[^<>{}]|"[^"]*"|'[^']*'|\{(?:[^}"]|"[^"]*")*\})*?)(\/?)>/g;

/** Decode the two literal forms the generator emits: `"x"` and `{"x"}`. */
function literalValue(raw: string): string | null {
  const bare = raw.trim();
  if (bare.startsWith('"') && bare.endsWith('"')) {
    return bare.slice(1, -1);
  }
  if (bare.startsWith('{"') && bare.endsWith("}")) {
    // Strip only the braces. Taking `slice(2, -1)` would remove the opening
    // quote along with them, and then the inner check could never pass — so
    // every className and literal attribute came back empty.
    const inner = bare.slice(1, -1).trim();
    if (inner.startsWith('"') && inner.endsWith('"')) return inner.slice(1, -1);
  }
  return null;
}

function encodeLiteral(value: string): string {
  return '{"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"}';
}

/** Parse the attributes out of a tag's raw attribute text. */
function parseAttributes(
  rawAttributes: string,
  offset: number
): Attribute[] {
  const attributes: Attribute[] = [];
  const pattern = /([a-zA-Z_][\w-]*)(?:=(\{[^}]*\}|"[^"]*"|'[^']*'))?/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(rawAttributes)) !== null) {
    const [full, name, rawValue] = match;
    if (rawValue === undefined) continue;
    attributes.push({
      name,
      literal: literalValue(rawValue),
      start: offset + match.index,
      end: offset + match.index + full.length,
    });
  }
  return attributes;
}

/**
 * Index of the `>` that closes the tag opened before `from`.
 *
 * Counts nested same-name tags so `<div><div>x</div></div>` resolves correctly.
 * Returns -1 when the element is never closed.
 */
function findClosingTag(source: string, tag: string, from: number): number {
  const openNeedle = "<" + tag;
  const closeNeedle = "</" + tag + ">";
  let depth = 1;
  let cursor = from;

  while (cursor < source.length) {
    const closeAt = source.indexOf(closeNeedle, cursor);
    if (closeAt === -1) return -1;

    // Find any nested open of the same tag before that close.
    let openAt = source.indexOf(openNeedle, cursor);
    while (openAt !== -1 && openAt < closeAt) {
      const next = source[openAt + openNeedle.length];
      // "<div" must be followed by a boundary, so "<divide" does not count.
      if (next !== undefined && /[\s/>]/.test(next)) {
        depth += 1;
        cursor = openAt + openNeedle.length;
        openAt = source.indexOf(openNeedle, cursor);
      } else {
        openAt = source.indexOf(openNeedle, openAt + 1);
      }
    }

    depth -= 1;
    if (depth === 0) return closeAt;
    cursor = closeAt + closeNeedle.length;
  }
  return -1;
}

/**
 * Scan JSX source into a flat, ordered list of elements with their text spans.
 *
 * Only what the generator actually emits is supported — literal attributes and
 * simple text children. Anything else is left unaddressed rather than guessed
 * at, which keeps the scan honest about what it understands.
 */
export function scanElements(source: string): Element[] {
  const elements: Element[] = [];
  const counts = new Map<string, number>();

  OPEN_TAG.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = OPEN_TAG.exec(source)) !== null) {
    const full = match[0];
    const tag = match[1];
    const rawAttributes = match[2];
    const selfClosing = match[3] === "/";
    const start = match.index;

    // Index of this tag's closing `>`. A self-closing tag ends `/>` so `>` is one
    // back; a normal tag ends `>` so it is the last character. Getting this off
    // by one put the text span *on* the `>`, and every element then looked like
    // it contained markup and so had no editable text.
    const attributesEnd = start + full.length - 1 - (selfClosing ? 1 : 0);
    const attributes = parseAttributes(rawAttributes, start + 1 + tag.length);
    const className =
      attributes.find((a) => a.name === "className")?.literal ?? "";

    let textStart = attributesEnd + 1;
    let textEnd = attributesEnd;
    let hasText = false;

    if (!selfClosing && !VOID_TAGS.has(tag)) {
      const closeAt = findClosingTag(source, tag, attributesEnd + 1);
      if (closeAt > attributesEnd) {
        const inner = source.slice(textStart, closeAt);
        // The generator puts text directly inside an element. Anything holding
        // markup, a brace expression or only whitespace is not editable text —
        // so a container is never mistaken for a headline.
        if (inner.trim().length > 0 && !/[<>{}]/.test(inner)) {
          textEnd = closeAt;
          hasText = true;
        }
      }
    }

    const identity = tag + "|" + firstClass(className);
    const ordinal = counts.get(identity) ?? 0;
    counts.set(identity, ordinal + 1);

    elements.push({ tag, className, attributes, textStart, textEnd, hasText, ordinal });
  }

  return elements;
}

/** The stable address the browser uses to refer to an element. */
/** The stable part of an element's identity: its first CSS class. */
function firstClass(className: string): string {
  const trimmed = className.trim();
  if (!trimmed) return "";
  const end = trimmed.search(/\s/);
  return end === -1 ? trimmed : trimmed.slice(0, end);
}

export function nodeKey(element: Element): string {
  return element.tag + "|" + firstClass(element.className) + "|" + element.ordinal;
}

/** Every editable address in a file, for building the client's element index. */
export function listEditableNodes(source: string): string[] {
  return scanElements(source)
    .filter((element) => element.hasText || element.attributes.length > 0)
    .map(nodeKey);
}

/**
 * Apply every change for one file.
 *
 * Patches are applied back-to-front so earlier offsets stay valid while later
 * ones are rewritten.
 */
export function applyChanges(source: string, changes: EditChange[]): EditResult {
  const file = changes[0]?.file ?? "";
  if (changes.length === 0) {
    return { file, content: source, changed: 0 };
  }

  const byKey = new Map(scanElements(source).map((e) => [nodeKey(e), e]));

  interface Patch {
    start: number;
    end: number;
    replacement: string;
  }
  const patches: Patch[] = [];

  for (const change of changes) {
    const element = byKey.get(change.node);
    if (!element) {
      throw new PatchError(
        "Could not find that element (" +
          change.node +
          ") in " +
          change.file +
          ". It may have changed since this page was loaded — reload and try again.",
        change.file,
        change.node
      );
    }

    if (change.kind === "text") {
      if (!element.hasText) {
        throw new PatchError(
          "That element has no editable text (" + change.node + ").",
          change.file,
          change.node
        );
      }
      if (source.slice(element.textStart, element.textEnd) === change.value) continue;
      patches.push({
        start: element.textStart,
        end: element.textEnd,
        replacement: change.value,
      });
      continue;
    }

    const attribute = element.attributes.find((a) => a.name === change.kind);
    if (!attribute) {
      throw new PatchError(
        "That element has no " + change.kind + " attribute (" + change.node + ").",
        change.file,
        change.node
      );
    }
    if (attribute.literal === change.value) continue;
    if (attribute.literal === null) {
      throw new PatchError(
        "That element's " +
          change.kind +
          " is computed rather than a literal, so it cannot be edited safely (" +
          change.node +
          ").",
        change.file,
        change.node
      );
    }

    // Rewrite only the value, preserving the attribute name.
    const full = source.slice(attribute.start, attribute.end);
    const equalsAt = full.indexOf("=");
    patches.push({
      start: attribute.start + equalsAt + 1,
      end: attribute.end,
      replacement: encodeLiteral(change.value),
    });
  }

  if (patches.length === 0) {
    return { file, content: source, changed: 0 };
  }

  // Drop duplicate spans, then apply from the end so offsets stay valid.
  const seen = new Set<string>();
  const ordered = patches
    .filter((patch) => {
      const key = patch.start + ":" + patch.end;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.start - a.start);

  let content = source;
  for (const patch of ordered) {
    content =
      content.slice(0, patch.start) + patch.replacement + content.slice(patch.end);
  }

  return { file, content, changed: ordered.length };
}

/** Guard against a client posting a path outside the repository. */
export function isSafeRepoPath(file: string): boolean {
  return (
    file.length > 0 &&
    !file.startsWith("/") &&
    !file.includes("..") &&
    !file.includes("\\") &&
    /^[\w./@-]+\.(tsx|ts|css|json|md)$/.test(file)
  );
}