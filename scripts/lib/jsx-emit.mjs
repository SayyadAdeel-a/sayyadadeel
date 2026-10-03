// HTML node -> JSX emission. Extracted verbatim in behaviour from
// scripts/convert-to-jsx.mjs (the generator that produced the frozen homepage
// components) so every other page is emitted with exactly the same rules:
// class names and Webflow hook attributes survive untouched, and text nodes
// keep their significant leading/trailing spaces and non-breaking spaces.

export const ATTR_MAP = {
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

const DROP_ATTRS = new Set(["imagesrcset"]);

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

/*
 * React's JSX transform drops unknown HTML entities (e.g. `&nbsp;` vanishes),
 * so text nodes are decoded up front. `<` and `>` stay encoded because a bare
 * `<` would be parsed as JSX.
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
  arrowright: "\u2192",
  arrowleft: "\u2190",
  larr: "\u2190",
  rarr: "\u2192",
};

function normalizeText(t) {
  // ASCII whitespace only: U+00A0 is meaningful layout in this design.
  return t.replace(/[\t\n\r\f ]+/g, " ");
}

export function decodeTextEntities(t) {
  return t.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 32) return match;
      if (code === 60 || code === 62) return match;
      return String.fromCodePoint(code);
    }
    const decoded = TEXT_ENTITIES[body.toLowerCase()];
    return decoded ?? match;
  });
}

/**
 * JSX text can hold apostrophes, quotes and ampersands verbatim, but `{` and
 * `}` open an expression and `<` opens a tag.
 *
 * Numeric character references are deliberately not used for the braces: React's
 * JSX transform decodes *named* entities but leaves `&#123;` literal, which is
 * exactly how a previous pass turned every apostrophe in the site into visible
 * `&#39;` text. Braced text therefore goes out as a string expression instead.
 */
function escapeJsxText(t) {
  return t.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function jsxText(t) {
  if (/[{}]/.test(t)) {
    return `{${JSON.stringify(t)}}`;
  }
  const escaped = escapeJsxText(t);
  if (/^ | $/.test(t)) return `{${JSON.stringify(t)}}`;
  return escaped;
}

const PREFIXED_STYLE_KEYS = {
  msTransform: "msTransform",
  WebkitTransform: "WebkitTransform",
  WebkitBoxOrient: "WebkitBoxOrient",
};

function normalizeStyleKey(prop) {
  if (prop.startsWith("--")) return prop;
  const kebab = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (/^[A-Z]/.test(kebab)) {
    const lowered = kebab[0].toLowerCase() + kebab.slice(1);
    if (PREFIXED_STYLE_KEYS[lowered]) return lowered;
    if (lowered.startsWith("webkit") || lowered.startsWith("moz")) {
      return lowered[0].toUpperCase() + lowered.slice(1);
    }
    return lowered;
  }
  return kebab;
}

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

export function createEmitter({ assetMap, missingAssets = new Set() }) {
  function localAssetUrl(remote) {
    if (assetMap[remote]) return assetMap[remote];
    const alt = encodeURI(remote);
    if (assetMap[alt]) return assetMap[alt];
    try {
      const decoded = decodeURIComponent(remote);
      if (assetMap[decoded]) return assetMap[decoded];
    } catch {
      /* not percent-encoded */
    }
    return null;
  }

  function transformAttrs(node, opts = {}) {
    const out = [];
    for (const { name, value } of node.attrs) {
      if (DROP_ATTRS.has(name)) continue;
      if (name === "noscript") continue;

      if (name === "aria-current" && opts.currentProp && node.tag === "a") {
      // Replaced below by the computed value.
      continue;
    }

    if (name === "class" && opts.currentProp && node.tag === "a") {
        const href = node.attrs.find((a) => a.name === "href")?.value ?? null;
        const normalize = (h) => {
          if (h === null) return null;
          if (/^(mailto:|tel:|https?:|\/\/|#)/i.test(h)) return null;
          const clean = h.split("#")[0].split("?")[0].replace(/\/+$/, "");
          return clean === "" ? "/" : clean;
        };
        const route = normalize(href);
        const comparison =
          route === null ? "false" : `${opts.currentProp} === ${JSON.stringify(route)}`;
        // The captured markup carries whichever link the *captured* page
        // marked; the marker is re-derived from `currentPath` instead.
        const baseClass = decodeEntities(value)
          .split(/\s+/)
          .filter((token) => token && token !== "w--current")
          .join(" ");
        out.push([
          "className",
          "`" +
            baseClass.replace(/[`\\]/g, "\\$&").replace(/\$\{/g, "\\${") +
            "${" +
            comparison +
            ' ? " w--current" : ""}`',
        ]);
        out.push(["aria-current", comparison + ' ? "page" : undefined']);
        continue;
      }

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
          out.push([
            ATTR_MAP[name] ?? name,
            JSON.stringify(parts.join(", ")),
          ]);
        }
        continue;
      }

      if (name === "style" && value) {
        const entries = styleObject(value);
        if (entries.length) {
          const body = entries
            .map(([k, v]) => {
              let val = v;
              val = val.replace(/url\(["']?(https?:)?\/\/[^"')]+["']?\)/g, (m2) => {
                const raw = m2
                  .replace(/^url\(["']?/, "")
                  .replace(/["']?\)$/, "");
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
          if (name === "data-poster-url") {
            const vidAttr = node.attrs.find((a) => a.name === "data-video-urls");
            if (vidAttr) {
              const urls = decodeEntities(vidAttr.value).split(",");
              const mp4 = urls
                .map((u) => u.trim())
                .find((u) => u.endsWith(".mp4"));
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
        else if (name.includes("-")) out.push([name, '""']);
        continue;
      }

      const decoded = decodeEntities(value);

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

  function emit(node, indent, lines, opts = {}) {
    const pad = "  ".repeat(indent);
    if (node.type === "text") {
      const t = decodeTextEntities(normalizeText(node.value));
      if (!t) return;
      lines.push(`${pad}${jsxText(t)}`);
      return;
    }
    const attrs = transformAttrs(node, opts);
    const attrText = attrs
      .map(([k, v]) => (v === null ? ` ${k}` : ` ${k}={${v}}`))
      .join("");
    const hasChildren = node.children.length > 0;

    if (!hasChildren) {
      lines.push(`${pad}<${node.tag}${attrText} />`);
      return;
    }

    const onlyText =
      node.children.length === 1 && node.children[0].type === "text";
    if (onlyText) {
      const t = decodeTextEntities(normalizeText(node.children[0].value));
      lines.push(`${pad}<${node.tag}${attrText}>${jsxText(t)}</${node.tag}>`);
      return;
    }

    lines.push(`${pad}<${node.tag}${attrText}>`);
    for (const child of node.children) emit(child, indent + 1, lines, opts);
    lines.push(`${pad}</${node.tag}>`);
  }

  return { emit, transformAttrs, localAssetUrl };
}