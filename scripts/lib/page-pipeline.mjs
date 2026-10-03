// Shared helpers for the per-page clone pipeline: page keys, HTML parsing,
// top-level section splitting and shell-section detection.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const ART_ROOT = "docs/research/relab-0c02b053";
export const SITE_KEY = "relab-0c02b053";

/** Collision-resistant, readable page key: path slug + 8 hex of sha256. */
export function pageKey(pathname) {
  const norm =
    pathname === "/" ? "/" : pathname.replace(/\/+$/, "") || "/";
  const hash = hash8(norm);
  if (norm === "/") return `root-${hash}`;
  const slug = norm
    .slice(1)
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${slug}-${hash}`;
}

function hash8(input) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 8);
}

/** Every published route of the reference site, in nav order. */
export function allRoutes() {
  return JSON.parse(
    fs.readFileSync(`${ART_ROOT}/routes.json`, "utf8")
  ).routes;
}

/** The reverse of pageKey: the site's canonical path for a page directory. */
export function routeForPageKey(key) {
  const routes = allRoutes();
  const hit = routes.find((r) => pageKey(r.route) === key);
  return hit ? hit.route : null;
}

export function artDir(key) {
  return path.join(ART_ROOT, key);
}

export function readPage(key) {
  const dir = artDir(key);
  const html = fs.readFileSync(path.join(dir, "live-page.html"), "utf8");
  const bodyStart = html.indexOf("<body") + "<body".length;
  const bodyEnd = html.indexOf("</body>");
  const body = html.slice(bodyStart, bodyEnd);
  const head = html.slice(html.indexOf("<head"), html.indexOf("</head>"));
  return { html, head, body };
}

/* ------------------------------------------------------------------ *
 * HTML tokenizer / tree builder
 * ------------------------------------------------------------------ */

export const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** Parse a fragment into a node tree of {type:'el'|'text'} nodes. */
export function parseFragment(src) {
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
      for (let s = stack.length - 1; s > 0; s--) {
        if (stack[s].tag === tag) {
          stack.length = s;
          break;
        }
      }
      i = end + 1;
      continue;
    }
    if (src.startsWith("<noscript>", lt)) {
      const close = src.indexOf("</noscript>", lt);
      i = close === -1 ? src.length : close + "</noscript>".length;
      continue;
    }

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
      while (j < src.length && !/[\s=>/]/.test(src[j])) j++;
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
  return root.children;
}

/** First whitespace-delimited token of an element's `class` attribute. */
export function primaryClass(node) {
  const cm = node.attrs.find((a) => a.name === "class");
  return cm && cm.value ? cm.value.trim().split(/\s+/)[0] : "";
}

/** Strip `aria-current` / `w--current` that Webflow added for another route. */
export function clearCurrentMarkers(html) {
  return html
    .replace(/\s+aria-current="page"/g, "")
    .replace(/\sw--current/g, "");
}

/**
 * Webflow marks every anchor whose href points at the current page. This
 * re-applies the markers for `currentPath` on already-generated markup.
 */
export function markCurrentLinks(html, currentPath) {
  return html.replace(/<a\b[^>]*>/g, (tag) => {
    const href = /href="([^"]*)"/.exec(tag)?.[1] ?? null;
    if (href === null) return tag;
    const normalize = (h) => {
      if (!h || /^(mailto:|tel:|https?:|\/\/|#)/i.test(h)) return null;
      const clean = h.split("#")[0].split("?")[0].replace(/\/+$/, "");
      return clean === "" ? "/" : clean;
    };
    const isCurrent = normalize(href) === normalize(currentPath);
    let out = tag.replace(/\s+aria-current="page"/g, "").replace(/\sw--current\b/g, "");
    if (!isCurrent) return out;
    out = out.replace(/\sclass="([^"]*)"/, (m, cls) => ` class="${cls} w--current"`);
    if (!/\sclass="/.test(out)) out = out.replace(/^(<a\b)/, `$1 class="w--current"`);
    return out.replace(/(<a\b[^>]*?)\s*\/?>$/, (m) => {
      return m.replace(/^(<a\b[^>]*?)(>|\/>)$/, (mm, head, tail) =>
        tail === "/>" ? `${head} aria-current="page" />` : `${head} aria-current="page">`
      );
    });
  });
}

/** Human-friendly component name from a section class, e.g. `our-team-section`. */
export function componentNameFor(cls, used) {
  const base = cls
    .replace(/^(w-node-|wf-node-)/, "")
    .replace(/^section$/, "section")
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "") || "Section";
  let name = base.endsWith("Section") ? base : `${base}Section`;
  if (!/^[A-Za-z]/.test(name)) name = `X${name}`;
  let candidate = name;
  let n = 2;
  while (used.has(candidate)) candidate = `${name}${n++}`;
  used.add(candidate);
  return candidate;
}