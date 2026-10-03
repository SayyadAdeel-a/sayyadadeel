// Convert the captured Webflow page HTML into per-section React (TSX)
// components, preserving the original DOM structure and class names so the
// site's own Webflow stylesheet (app/webflow.css) applies verbatim.
//
// Usage: node scripts/convert-to-jsx.mjs
import fs from "node:fs";
import path from "node:path";

const ART = "docs/research/relab-0c02b053/root-8a5edab2";
const SITE_KEY = "relab-0c02b053";
const PAGE_KEY = "root-8a5edab2";
const OUT_DIR = `src/components/sites/${SITE_KEY}/${PAGE_KEY}`;

const assetMap = JSON.parse(
  fs.readFileSync(`${ART}/asset-map.json`, "utf8")
);

const html = fs.readFileSync(`${ART}/live-page.html`, "utf8");
const bodyStart = html.indexOf("<body") + "<body".length;
const bodyEnd = html.indexOf("</body>");
const body = html.slice(bodyStart, bodyEnd);

/* ------------------------------------------------------------------ *
 * Minimal HTML tokenizer / tree builder
 * ------------------------------------------------------------------ */

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** Parse a fragment into a node tree: {type:'el'|'text', ...} */
function parseFragment(src) {
  let i = 0;
  const root = { type: "el", tag: "#root", attrs: [], children: [] };
  const stack = [root];

  const pushText = (t) => {
    if (!t) return;
    stack[stack.length - 1].children.push({ type: "text", value: t });
  };

  while (i < src.length) {
    const lt = src.indexOf("<", i);
    if (lt === -1) {
      pushText(src.slice(i));
      break;
    }
    if (lt > i) pushText(src.slice(i, lt));

    if (src.startsWith("<!--", lt)) {
      const end = src.indexOf("-->", lt);
      i = end === -1 ? src.length : end + 3;
      continue;
    }
    if (src.startsWith("<!", lt)) {
      const end = src.indexOf(">", lt);
      i = end === -1 ? src.length : end + 1;
      continue;
    }
    if (src.startsWith("</", lt)) {
      const end = src.indexOf(">", lt);
      const tag = src.slice(lt + 2, end).trim().toLowerCase();
      // Unwind to the matching open tag.
      for (let s = stack.length - 1; s > 0; s--) {
        if (stack[s].tag === tag) {
          stack.length = s;
          break;
        }
      }
      i = end + 1;
      continue;
    }

    // <noscript> blocks are progressive-enhancement fallbacks that break JSX
    // parsing (they contain raw CSS with braces); they are dropped because
    // the clone always runs with JavaScript enabled.
    if (src.startsWith("<noscript>", lt)) {
      const close = src.indexOf("</noscript>", lt);
      i = close === -1 ? src.length : close + "</noscript>".length;
      continue;
    }

    // Open tag: read name then attributes, respecting quoted values.
    const nameMatch = /^<([a-zA-Z][\w:.-]*)/.exec(src.slice(lt));
    if (!nameMatch) {
      pushText("<");
      i = lt + 1;
      continue;
    }
    const tag = nameMatch[1].toLowerCase();
    let j = lt + nameMatch[0].length;
    const attrs = [];
    while (j < src.length) {
      while (j < src.length && /\s/.test(src[j])) j++;
      if (src[j] === ">") break;
      if (src[j] === "/" && src[j + 1] === ">") {
        j++;
        break;
      }
      const aStart = j;
      while (
        j < src.length &&
        !/[\s=>/]/.test(src[j])
      ) {
        j++;
      }
      const attrName = src.slice(aStart, j);
      if (!attrName) {
        j++;
        continue;
      }
      while (j < src.length && /\s/.test(src[j])) j++;
      let value = null;
      if (src[j] === "=") {
        j++;
        while (j < src.length && /\s/.test(src[j])) j++;
        const q = src[j];
        if (q === '"' || q === "'") {
          const close = src.indexOf(q, j + 1);
          value = src.slice(j + 1, close === -1 ? src.length : close);
          j = close === -1 ? src.length : close + 1;
        } else {
          const vStart = j;
          while (j < src.length && !/[\s>]/.test(src[j])) j++;
          value = src.slice(vStart, j);
        }
      }
      attrs.push({ name: attrName.toLowerCase(), value });
    }

    const selfClose = src[j - 1] === "/" || VOID.has(tag);
    const node = { type: "el", tag, attrs, children: [], selfClose };
    stack[stack.length - 1].children.push(node);
    if (!selfClose) stack.push(node);
    i = j + 1;
  }
  return root.children.filter((n) => n.type === "el");
}

/* ------------------------------------------------------------------ *
 * Attribute transformation
 * ------------------------------------------------------------------ */

const ATTR_MAP = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  srcset: "srcSet",
  imagesrcset: "imageSrcSet",
  playsinline: "playsInline",
  autoplay: "autoPlay",
  allowfullscreen: "allowFullScreen",
  crossorigin: "crossOrigin",
  referrerpolicy: "referrerPolicy",
  autocomplete: "autoComplete",
  contenteditable: "contentEditable",
  spellcheck: "spellCheck",
  maxlength: "maxLength",
  minlength: "minLength",
  readonly: "readOnly",
  novalidate: "noValidate",
  autofocus: "autoFocus",
  enterkeyhint: "enterKeyHint",
  fetchpriority: "fetchPriority",
  colspan: "colSpan",
  rowspan: "rowSpan",
};

const BOOLEAN_ATTRS = new Set([
  "allowfullscreen", "autofocus", "autoplay", "checked", "controls",
  "default", "defer", "disabled", "formnovalidate", "hidden", "inert",
  "ismap", "itemscope", "loop", "multiple", "muted", "nomodule",
  "novalidate", "open", "playsinline", "readonly", "required", "reversed",
  "selected",
]);

// Attributes that must be dropped: they reference remote CDN variants that we
// replace with locally downloaded copies.
const DROP_ATTRS = new Set(["imagesrcset"]);

// HTML attributes React types as numbers.
const NUMERIC_ATTRS = new Set([
  "maxlength", "minlength", "size", "rows", "cols", "tabindex", "width",
  "height", "span", "start",
]);

const decodeEntities = (s) =>
  s
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#39;", "'");

function localAssetUrl(remote) {
  if (assetMap[remote]) return assetMap[remote];
  // Try percent-encoding variants of the same URL.
  const alt = encodeURI(remote);
  if (assetMap[alt]) return assetMap[alt];
  const decoded = decodeURIComponent(remote);
  if (assetMap[decoded]) return assetMap[decoded];
  return null;
}

const missingAssets = new Set();

function styleObject(styleStr) {
  const cleaned = decodeEntities(styleStr);
  const entries = [];
  for (const decl of cleaned.split(";")) {
    const t = decl.trim();
    if (!t) continue;
    const ci = t.indexOf(":");
    if (ci === -1) continue;
    const prop = t.slice(0, ci).trim();
    const val = t.slice(ci + 1).trim();
    if (!prop || !val) continue;
    entries.push([normalizeStyleKey(prop), val]);
  }
  return entries;
}

const PREFIXED_STYLE_KEYS = {
  msTransform: "msTransform",
  WebkitTransform: "WebkitTransform",
  WebkitBoxOrient: "WebkitBoxOrient",
};

/**
 * Normalize a CSS property name for React's inline-style objects.
 * Webflow emits some vendor-prefixed properties as `MsTransform`.
 */
function normalizeStyleKey(prop) {
  if (prop.startsWith("--")) return prop;
  const kebab = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (/^[A-Z]/.test(kebab)) {
    // e.g. `MsTransform` -> `msTransform`
    const lowered = kebab[0].toLowerCase() + kebab.slice(1);
    if (PREFIXED_STYLE_KEYS[lowered]) return lowered;
    if (lowered.startsWith("webkit") || lowered.startsWith("moz")) {
      return lowered[0].toUpperCase() + lowered.slice(1);
    }
    return lowered;
  }
  return kebab;
}

function transformAttrs(node) {
  const out = [];
  for (const { name, value } of node.attrs) {
    if (DROP_ATTRS.has(name)) continue;

    if (name === "noscript") continue;

    // Responsive candidate lists are rewritten to their local copies so the
    // browser picks the same variant — and therefore the same intrinsic
    // dimensions — as the reference at every breakpoint.
    if ((name === "srcset" || name === "imagesrcset") && value) {
      const parts = decodeEntities(value)
        .split(",")
        .map((part) => {
          const trimmed = part.trim();
          if (!trimmed) return null;
          const spaceAt = trimmed.search(/\s/);
          const url = spaceAt === -1 ? trimmed : trimmed.slice(0, spaceAt);
          const descriptor = spaceAt === -1 ? "" : trimmed.slice(spaceAt);
          const local = localAssetUrl(url);
          if (!local) {
            missingAssets.add(url);
            return trimmed;
          }
          return `${local}${descriptor}`;
        })
        .filter(Boolean);
      if (parts.length) {
        out.push([ATTR_MAP[name] ?? name, JSON.stringify(parts.join(", "))]);
      }
      continue;
    }

    if (name === "style" && value) {
      const entries = styleObject(value);
      if (entries.length) {
        const body = entries
          .map(([k, v]) => {
            let val = v;
            // Rewrite CDN URLs inside url() values.
            val = val.replace(/url\(["']?(https?:)?\/\/[^"')]+["']?\)/g, (m2) => {
              const raw = m2.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
              const local = localAssetUrl(
                raw.startsWith("//") ? "https:" + raw : raw
              );
              return local ? `url("${local}")` : m2;
            });
            return /^[a-zA-Z$_][\w$]*$/.test(k)
              ? `${k}: ${JSON.stringify(val)}`
              : `${JSON.stringify(k)}: ${JSON.stringify(val)}`;
          })
          .join(", ");
        out.push(["style", `{ ${body} }`]);
      }
      continue;
    }

    if (name === "data-video-urls" && value) {
      // Comma-separated CDN URLs -> local copies.
      const parts = decodeEntities(value).split(",").map((u) => {
        const t = u.trim();
        const local = localAssetUrl(t);
        return local ?? t;
      });
      out.push([name, JSON.stringify(parts.join(","))]);
      continue;
    }

    if ((name === "src" || name === "data-poster-url") && value) {
      const decoded = decodeEntities(value);
      if (/^https?:/.test(decoded) || decoded.startsWith("//")) {
        const local = localAssetUrl(
          decoded.startsWith("//") ? "https:" + decoded : decoded
        );
        if (local) {
          out.push([ATTR_MAP[name] ?? name, JSON.stringify(local)]);
          continue;
        }
        // Remote media that has no local copy: try the video URL attribute.
        if (name === "data-poster-url") {
          const vidAttr = node.attrs.find((a) => a.name === "data-video-urls");
          if (vidAttr) {
            const urls = decodeEntities(vidAttr.value).split(",");
            const mp4 = urls.map((u) => u.trim()).find((u) => u.endsWith(".mp4"));
            if (mp4) {
              const vlocal = localAssetUrl(mp4);
              if (vlocal) {
                out.push([name, JSON.stringify(vlocal)]);
                continue;
              }
            }
          }
        }
        missingAssets.add(decoded);
        out.push([ATTR_MAP[name] ?? name, JSON.stringify(decoded)]);
        continue;
      }
      out.push([ATTR_MAP[name] ?? name, JSON.stringify(decoded)]);
      continue;
    }

    if (value === null || value === "") {
      if (BOOLEAN_ATTRS.has(name)) out.push([ATTR_MAP[name] ?? name, null]);
      else if (/^data-|^[a-z]+-[a-z-]+$/.test(name) || name.includes("-")) {
        // Keep custom hook attributes with an explicit empty value.
        out.push([name, '""']);
      }
      continue;
    }

    const decoded = decodeEntities(value);

    // Numeric HTML attributes must be numbers in JSX.
    if (NUMERIC_ATTRS.has(name)) {
      const n = Number(decoded);
      if (Number.isFinite(n)) {
        out.push([ATTR_MAP[name] ?? name, String(n)]);
        continue;
      }
    }

    out.push([ATTR_MAP[name] ?? name, JSON.stringify(decoded)]);
  }
  return out;
}

/*
 * React's JSX transform drops unknown HTML entities (e.g. `&nbsp;` vanishes),
 * so text nodes are decoded up front. `<` and `>` are deliberately left
 * encoded because a bare `<` would be parsed as JSX.
 */
const TEXT_ENTITIES = {
  nbsp: "\u00a0",
  copy: "\u00a9",
  reg: "\u00ae",
  trade: "\u2122",
  amp: "&",
  quot: '"',
  apos: "'",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201c",
  rdquo: "\u201d",
  ndash: "\u2013",
  mdash: "\u2014",
  hellip: "\u2026",
  bull: "\u2022",
  middot: "\u00b7",
  times: "\u00d7",
  deg: "\u00b0",
  euro: "\u20ac",
  pound: "\u00a3",
  yen: "\u00a5",
  sect: "\u00a7",
  para: "\u00b6",
  dagger: "\u2020",
  laquo: "\u00ab",
  raquo: "\u00bb",
  lsaquo: "\u2039",
  rsaquo: "\u203a",
  minus: "\u2212",
  plusmn: "\u00b1",
  frac12: "\u00bd",
  check: "\u2713",
};

/*
 * Collapse only ASCII whitespace. U+00A0 (non-breaking space) is meaningful
 * layout in this design and must survive, so `\\s` cannot be used here.
 * Leading/trailing spaces are preserved too: the source HTML is minified, so
 * every space in it is real rendered content.
 */
function normalizeText(t) {
  return t.replace(/[\t\n\r\f ]+/g, " ");
}

function decodeTextEntities(t) {
  return t.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 32) return match;
      if (code === 60 || code === 62) return match; // keep < > encoded
      return String.fromCodePoint(code);
    }
    const decoded = TEXT_ENTITIES[body.toLowerCase()];
    return decoded ?? match;
  });
}

function escapeJsxText(t) {
  return t
    .replace(/[{}]/g, (c) => (c === "{" ? "&#123;" : "&#125;"))
    .replaceAll("'", "&#39;")
    .replaceAll('"', "&quot;");
}

/**
 * JSX trims whitespace at the end of every text line, so significant leading /
 * trailing spaces have to be emitted inside a string expression instead.
 */
function jsxText(t) {
  const escaped = escapeJsxText(t);
  if (/^ | $/.test(t)) return `{${JSON.stringify(escaped)}}`;
  return escaped;
}

function emit(node, indent, lines) {
  const pad = "  ".repeat(indent);
  if (node.type === "text") {
    const t = decodeTextEntities(normalizeText(node.value));
    if (!t) return;
    lines.push(`${pad}${jsxText(t)}`);
    return;
  }
  const attrs = transformAttrs(node);
  // JSX string literals do not support backslash escapes, so every string
  // attribute value is emitted inside an expression container.
  const attrText = attrs
    .map(([k, v]) => (v === null ? ` ${k}` : ` ${k}={${v}}`))
    .join("");
  const hasChildren = node.children.length > 0;

  if (!hasChildren) {
    lines.push(`${pad}<${node.tag}${attrText} />`);
    return;
  }

  // Collapse to one line when the subtree is short text.
  const onlyText =
    node.children.length === 1 && node.children[0].type === "text";
  if (onlyText) {
    const t = decodeTextEntities(normalizeText(node.children[0].value));
    lines.push(
      `${pad}<${node.tag}${attrText}>${jsxText(t)}</${node.tag}>`
    );
    return;
  }

  lines.push(`${pad}<${node.tag}${attrText}>`);
  for (const child of node.children) emit(child, indent + 1, lines);
  lines.push(`${pad}</${node.tag}>`);
}

/* ------------------------------------------------------------------ *
 * Section -> component mapping
 * ------------------------------------------------------------------ */

const COMPONENTS = [
  ["header-section", "HeaderSection"],
  ["hero-section", "HeroSection"],
  ["hero-intro-section", "HeroIntroSection"],
  ["our-creators-section", "OurCreatorsSection"],
  ["selider-section", "SolutionsSliderSection"],
  ["meet-section", "MeetSection"],
  ["featured-work-section", "FeaturedWorkSection"],
  ["capabilities-section", "CapabilitiesSection"],
  ["our-process-section", "OurProcessSection"],
  ["our-clients-section", "OurClientsSection"],
  ["brands-section", "BrandsMarqueeSection"],
  ["worked-section", "WorkedSection"],
  ["pricing-section", "PricingSection"],
  ["our-clients-say-section", "OurClientsSaySection"],
  ["insights-ideas-section", "InsightsIdeasSection"],
  ["cta-section", "CtaSection"],
  ["footer-section", "FooterSection"],
  ["template-buttons-wrapper", "TemplateButtons"],
];

const topLevel = parseFragment(body);
const sections = new Map();
for (const node of topLevel) {
  const cm = node.attrs.find((a) => a.name === "class");
  const cls = cm ? cm.value.trim().split(/\s+/)[0] : "";
  sections.set(cls, node);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const CLIENT_SECTIONS = new Set([
  "HeaderSection",
  "HeroIntroSection",
  "SolutionsSliderSection",
  "MeetSection",
  "OurProcessSection",
  "OurClientsSection",
]);

for (const [sectionClass, componentName] of COMPONENTS) {
  const node = sections.get(sectionClass);
  if (!node) {
    console.log(`MISSING SECTION: ${sectionClass}`);
    continue;
  }
  const lines = [];
  emit(node, 2, lines);
  const body$ = lines.join("\n");
  const useClient = CLIENT_SECTIONS.has(componentName)
    ? '"use client";\n\n'
    : "";
  const file = path.join(OUT_DIR, `${componentName}.tsx`);
  fs.writeFileSync(
    file,
    `${useClient}export default function ${componentName}() {\n  return (\n${body$}\n  );\n}\n`
  );
  console.log(`wrote ${file} (${body$.length} chars of JSX)`);
}

if (missingAssets.size) {
  console.log(`\nMISSING ASSETS (${missingAssets.size}):`);
  for (const u of missingAssets) console.log("  " + u);
} else {
  console.log("\nAll remote assets resolved to local files.");
}