// Capture every remaining route of the reference site: HTML, the Webflow
// runtime chunks it loads, its IX interaction payload, and its inline scripts.
//
// Usage: node scripts/capture-pages.mjs [route ...]
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";

const ORIGIN = "https://relab-template.webflow.io";
const ART_ROOT = "docs/research/relab-0c02b053";

const ROUTES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "/about",
      "/services",
      "/case-studies",
      "/blogs",
      "/pricing",
      "/contact",
      "/licenses",
      "/style-guide",
      "/404",
    ];

/** Collision-resistant, readable page key: path slug + 8 hex of sha256. */
function pageKey(pathname) {
  const norm = pathname === "/" ? "/" : pathname.replace(/\/+$/, "") || "/";
  const hash = crypto.createHash("sha256").update(norm).digest("hex").slice(0, 8);
  if (norm === "/") return `root-${hash}`;
  const slug = norm
    .slice(1)
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${slug}-${hash}`;
}

function routeDir(route) {
  const key = pageKey(route);
  return { key, dir: `${ART_ROOT}/${key}` };
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 clone-research" },
  });
  return { status: res.status, text: res.status === 200 ? await res.text() : "" };
}

function sliceBalanced(code, start, onEnd) {
  let depth = 0;
  let inStr = null;
  for (let i = start; i < code.length; i++) {
    const ch = code[i];
    if (inStr) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "[" || ch === "{" || ch === "(") depth++;
    else if (ch === "]" || ch === "}" || ch === ")") {
      depth--;
      if (depth === 0) {
        if (onEnd) onEnd(i);
        return code.slice(start, i + 1);
      }
    }
  }
  return null;
}

/** Decode the IX (ix3) payload registered by a Webflow runtime chunk. */
function decodeIx(code) {
  const interactions = [];
  const timelines = [];
  for (const m of code.matchAll(/register\(\[/g)) {
    const start = m.index + "register(".length;
    let firstEnd = -1;
    const raw = sliceBalanced(code, start, (i) => {
      firstEnd = i;
    });
    if (!raw) continue;
    const raws = [raw];
    let cursor = firstEnd + 1;
    while (cursor < code.length) {
      const ch = code[cursor];
      if (ch === "," || /\s/.test(ch)) {
        cursor++;
        continue;
      }
      if (ch === "[") {
        const next = sliceBalanced(code, cursor, (i) => {
          cursor = i;
        });
        if (!next) break;
        raws.push(next);
      }
      break;
    }
    for (const chunk of raws) {
      const restored = chunk
        .replace(/!0/g, "true")
        .replace(/!1/g, "false")
        .replace(/void 0/g, "null");
      let obj;
      try {
        obj = vm.runInNewContext(`(${restored})`, Object.create(null), {
          timeout: 5000,
        });
      } catch {
        continue;
      }
      for (const entry of Array.isArray(obj) ? obj : [obj]) {
        if (typeof entry?.id !== "string") continue;
        if (entry.id.startsWith("t-")) timelines.push(entry);
        else if (entry.id.startsWith("i-")) interactions.push(entry);
      }
    }
  }
  return { interactions, timelines };
}

const manifest = [];

for (const route of ROUTES) {
  const { key, dir } = routeDir(route);
  fs.mkdirSync(`${dir}/webflow-js`, { recursive: true });
  fs.mkdirSync(`${dir}/scripts-inline`, { recursive: true });

  const page = await fetchText(ORIGIN + route);
  if (page.status !== 200) {
    console.log(`SKIP ${route} -> ${page.status}`);
    continue;
  }
  fs.writeFileSync(`${dir}/live-page.html`, page.text);

  const title = /<title>([^<]*)<\/title>/i.exec(page.text)?.[1] ?? "";
  console.log(`\n${route}  (${key})  ${page.text.length} bytes  "${title}"`);

  // Runtime chunks this page loads.
  const srcs = [...page.text.matchAll(/<script[^>]*\ssrc="([^"]+)"/gi)].map(
    (m) => m[1]
  );
  let interactions = [];
  let timelines = [];
  for (const src of srcs) {
    const url = src.startsWith("http")
      ? src
      : src.startsWith("//")
        ? "https:" + src
        : new URL(src, ORIGIN).href;
    const name = path.basename(new URL(url).pathname) || "script.js";
    const file = `${dir}/webflow-js/${name}`;
    if (!fs.existsSync(file)) {
      try {
        const text = await (await fetch(url)).text();
        fs.writeFileSync(file, text);
      } catch {
        continue;
      }
    }
    const code = fs.readFileSync(file, "utf8");
    const ix = decodeIx(code);
    interactions = interactions.concat(ix.interactions);
    timelines = timelines.concat(ix.timelines);
  }
  fs.writeFileSync(
    `${dir}/webflow-ix2.json`,
    JSON.stringify({ interactions, timelines }, null, 2)
  );
  console.log(
    `  IX: ${interactions.length} interactions, ${timelines.length} timelines`
  );

  // Inline scripts.
  let n = 0;
  for (const m of page.text.matchAll(
    /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
  )) {
    n += 1;
    const code = m[1].trim();
    if (code) fs.writeFileSync(`${dir}/scripts-inline/inline-${n}.js`, code);
  }

  // Stylesheet (shared across the site, but recorded per page for provenance).
  const cssHref = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+\.css)"/i.exec(
    page.text
  )?.[1];
  if (cssHref) {
    const cssUrl = cssHref.startsWith("http") ? cssHref : ORIGIN + cssHref;
    if (!fs.existsSync(`${dir}/live-webflow.css`)) {
      fs.writeFileSync(`${dir}/live-webflow.css`, await (await fetch(cssUrl)).text());
    }
  }

  manifest.push({ route, pageKey: key, bytes: page.text.length, title, interactions: interactions.length, timelines: timelines.length });
}

fs.writeFileSync(
  `${ART_ROOT}/routes-manifest.json`,
  JSON.stringify(manifest, null, 2)
);
console.log(`\nwrote manifest with ${manifest.length} routes`);