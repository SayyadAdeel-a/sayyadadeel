// Extract Webflow IX (ix3 engine) interaction + timeline payloads from the
// site's Webflow runtime chunks into a single auditable JSON artifact.
import fs from "node:fs";
import vm from "node:vm";

const dir =
  "docs/research/relab-0c02b053/root-8a5edab2/webflow-js";
const out =
  "docs/research/relab-0c02b053/root-8a5edab2/webflow-ix2.json";

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

const interactions = [];
const timelines = [];

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith(".js")) continue;
  const code = fs.readFileSync(`${dir}/${file}`, "utf8");
  const re = /register\(\[/g;
  for (const m of code.matchAll(re)) {
    const start = m.index + "register(".length; // index of "["

    // register() receives two sibling arrays: [interactions] and [timelines].
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
      const list = Array.isArray(obj) ? obj : [obj];
      for (const entry of list) {
        if (typeof entry?.id !== "string") continue;
        if (entry.id.startsWith("t-")) timelines.push(entry);
        else if (entry.id.startsWith("i-")) interactions.push(entry);
      }
    }
  }
}

const payload = { interactions, timelines };
fs.writeFileSync(out, JSON.stringify(payload, null, 2));
console.log("interactions:", interactions.length);
console.log("timelines:", timelines.length);
console.log("timeline ids:", timelines.map((t) => t.id).join(" "));