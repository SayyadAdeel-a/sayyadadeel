/**
 * The edit engine: maps a DOM element the user clicked back to a precise,
 * verifiable location in a generated `.tsx` file and rewrites exactly one value.
 *
 * ## Why a hand-written scanner rather than an AST
 *
 * `typescript` is available as a devDependency but is ~20 MB; importing it from a
 * serverless function to parse four-line JSX would bloat the bundle enormously.
 * The generated components are machine-emitted and extremely regular, so a small
 * purpose-built scanner is both sufficient and far cheaper.
 *
 * ## Why the scanner is hand-written rather than a regular expression
 *
 * It started as one, and one regex was not enough. A className like
 *
 *     className={`nav-link w-inline-block${currentPath === "/about" ? " w--current" : ""}`}
 *
 * contains a brace inside the attribute value. A pattern that matches `{...}` at
 * one level of nesting stops at the first `}`, which is the one closing `${`, and
 * then cannot continue — so the whole opening tag failed to match and **every
 * element in that tag was invisible**. The symptom was twelve uneditable nav
 * links in `SiteHeader` and a batch of social icons in `SiteFooter`, with no
 * error anywhere. Tracking brace depth by hand is the fix; the scanner below does
 * that and skips quoted and backtick runs, so interpolations are stepped over
 * whole.
 *
 * ## Why the scanner is safe
 *
 * The dangerous failure mode for a codemod is silently rewriting the wrong
 * element: a CMS page's prices change, or a headline is replaced on a different
 * card. Two properties prevent that here.
 *
 *  1. **Resolution is by identity, not position.** A node is addressed by
 *     `tag|class|ordinal` where the ordinal counts earlier elements in the file
 *     with the same tag *and* class. Position-free, so an unrelated edit elsewhere
 *     cannot shift the target.
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
  /** `tag|class|ordinal` — see module docs. */
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
  /** Literal string contents, for `name="x"` and `name={"x"}`. Null if computed. */
  literal: string | null;
  /** Source span of the whole `name=value` pair. */
  start: number;
  end: number;
}

interface Element {
  tag: string;
  /**
   * The element's identity string.
   *
   * Usually the literal `className`. For a template literal it is the *static
   * prefix* — the text before the first `${` — because that is the part the
   * browser will see as the first class, and it is what lets a computed
   * className still be addressed.
   */
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

const NAME_START = /[A-Za-z_]/;
const NAME_REST = /[\w.-]/;
const SPACE = /\s/;

/** Index just past the `}` matching the `{` at `from`, skipping quoted runs. */
function readBraced(source: string, from: number): number {
  let depth = 0;
  let i = from;
  while (i < source.length) {
    const ch = source[i];
    // Step over whole quoted and backtick runs. A template literal is balanced as
    // a unit, so skipping it wholesale is exactly right and is what makes
    // `${currentPath === "/" ? " w--current" : ""}` harmless.
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i += 1;
      while (i < source.length && source[i] !== quote) i += 1;
      i += 1;
      continue;
    }
    if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return i;
}

/**
 * Read one opening tag starting at `<` (which must be at `from`).
 *
 * Returns null when there is no tag there. `end` is the index just past `>`.
 */
function readTag(
  source: string,
  from: number
): { tag: string; attributes: Attribute[]; selfClosing: boolean; end: number } | null {
  let i = from + 1;
  if (i >= source.length || !NAME_START.test(source[i])) return null;

  const tagStart = i;
  while (i < source.length && NAME_REST.test(source[i])) i += 1;
  const tag = source.slice(tagStart, i);
  const attributes: Attribute[] = [];
  let selfClosing = false;

  while (i < source.length) {
    while (i < source.length && SPACE.test(source[i])) i += 1;
    if (i >= source.length) break;

    if (source[i] === "/" && source[i + 1] === ">") {
      selfClosing = true;
      i += 2;
      break;
    }
    if (source[i] === ">") {
      i += 1;
      break;
    }
    if (source[i] === "/") {
      i += 1;
      continue;
    }
    if (!NAME_START.test(source[i])) {
      i += 1;
      continue;
    }

    const attributeStart = i;
    while (i < source.length && /[\w-]/.test(source[i])) i += 1;
    const name = source.slice(attributeStart, i);

    // Whitespace is allowed around `=`.
    let afterName = i;
    while (afterName < source.length && SPACE.test(source[afterName])) afterName += 1;

    let literal: string | null = null;
    if (source[afterName] === "=") {
      i = afterName + 1;
      while (i < source.length && SPACE.test(source[i])) i += 1;

      const ch = source[i];
      if (ch === '"' || ch === "'") {
        const close = source.indexOf(ch, i + 1);
        literal = close === -1 ? null : source.slice(i + 1, close);
        i = close === -1 ? source.length : close + 1;
      } else if (ch === "{") {
        const close = readBraced(source, i);
        literal = literalValue(source.slice(i, close));
        i = close;
      } else {
        while (i < source.length && !SPACE.test(source[i]) && source[i] !== ">") i += 1;
      }
    } else {
      i = afterName;
    }

    attributes.push({ name, literal, start: attributeStart, end: i });
  }

  return { tag, attributes, selfClosing, end: i };
}

/**
 * The literal value of an attribute, for patching.
 *
 * Strict on purpose: only `"x"` and `{"x"}` count. A template literal is computed
 * — even when it has no interpolation — and `applyChanges` must refuse it rather
 * than write a value that would be overwritten at render time.
 */
function literalValue(raw: string): string | null {
  const bare = raw.trim();
  if (bare.length >= 2 && bare.startsWith('"') && bare.endsWith('"')) {
    return bare.slice(1, -1);
  }
  if (bare.length >= 4 && bare.startsWith('{"') && bare.endsWith('"}')) {
    return bare.slice(2, -2);
  }
  return null;
}

/** Just the value part of a `name=value` attribute span. */
function attributeValue(raw: string): string {
  const equals = raw.indexOf("=");
  return equals === -1 ? "" : raw.slice(equals + 1).trim();
}

/**
 * The identity string for an element's `className`.
 *
 * Accepts template literals, taking the text before the first `${`. That is the
 * prefix the browser sees as the element's first class, so a
 * `` className={`nav-link w-inline-block${…}`} `` element can still be matched
 * against the live DOM — which is the only way it can be edited at all.
 *
 * The className itself is never offered for patching; only text, src, href and
 * alt are, and those stay strict.
 */
function classIdentity(raw: string): string {
  const literal = literalValue(raw);
  if (literal !== null) return literal;

  const bare = raw.trim();
  if (!bare.startsWith("{`")) return "";

  const body = bare.slice(2, bare.endsWith("}") ? -1 : undefined);
  const interpolation = body.indexOf("${");
  // Drop the trailing backtick before splitting, so a fully static template
  // yields its whole contents.
  const staticPart = interpolation === -1 ? body : body.slice(0, interpolation);
  return staticPart.replace(/[`\s]+$/, "");
}

const QUOTE_CHAR = String.fromCharCode(34);
const BACKSLASH = String.fromCharCode(92);

/**
 * Encode a value as a JSX string attribute.
 *
 * Backslashes are escaped before quotes, so a value containing either cannot
 * terminate the literal early. Both characters go through constants rather than
 * being written inline, which keeps them unambiguous in a file that other tools
 * rewrite.
 */
function encodeLiteral(value: string): string {
  const escaped = value
    .split(BACKSLASH)
    .join(BACKSLASH + BACKSLASH)
    .split(QUOTE_CHAR)
    .join(BACKSLASH + QUOTE_CHAR);
  return "{" + QUOTE_CHAR + escaped + QUOTE_CHAR + "}" + QUOTE_CHAR;
}

/** The first CSS class — the only part stable once Webflow starts appending. */
function firstClass(className: string): string {
  const trimmed = className.trim();
  if (!trimmed) return "";
  const end = trimmed.search(/\s/);
  return end === -1 ? trimmed : trimmed.slice(0, end);
}

/**
 * Index of the `</tag>` that closes the element opened before `from`.
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
 * simple text children. Anything else is left unaddressed rather than guessed at,
 * which keeps the scan honest about what it understands.
 */
export function scanElements(source: string): Element[] {
  const elements: Element[] = [];
  const counts = new Map<string, number>();

  let i = 0;
  while (i < source.length) {
    if (source[i] !== "<") {
      i += 1;
      continue;
    }

    const tag = readTag(source, i);
    if (!tag) {
      i += 1;
      continue;
    }

    const classAttribute = tag.attributes.find((a) => a.name === "className");
    const className = classAttribute
      ? classIdentity(attributeValue(source.slice(classAttribute.start, classAttribute.end)))
      : "";

    let textStart = tag.end;
    let textEnd = tag.end;
    let hasText = false;

    if (!tag.selfClosing && !VOID_TAGS.has(tag.tag)) {
      const closeAt = findClosingTag(source, tag.tag, tag.end);
      if (closeAt > tag.end) {
        const inner = source.slice(textStart, closeAt);
        // The generator puts text directly inside an element. Anything holding
        // markup, a brace expression or only whitespace is not editable text —
        // so a container is never mistaken for a headline.
        if (inner.trim().length > 0 && !/[<>{}`]/.test(inner)) {
          textEnd = closeAt;
          hasText = true;
        }
      }
    }

    const identity = tag.tag + "|" + firstClass(className);
    const ordinal = counts.get(identity) ?? 0;
    counts.set(identity, ordinal + 1);

    elements.push({
      tag: tag.tag,
      className,
      attributes: tag.attributes,
      textStart,
      textEnd,
      hasText,
      ordinal,
    });

    i = Math.max(tag.end, i + 1);
  }

  return elements;
}

/** The stable address the browser uses to refer to an element. */
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