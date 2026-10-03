import fs from "node:fs";
import vm from "node:vm";

const dir =
  "docs/research/relab-0c02b053/root-8a5edab2/webflow-js";
const file = fs
  .readdirSync(dir)
  .find((f) => f.startsWith("webflow.a3e096e3"));
const code = fs.readFileSync(`${dir}/${file}`, "utf8");

function sliceBalanced(start) {
  let depth = 0;
  let inStr = null;
  for (let i = start; i < code.length; i++) {
    const ch = code[i];
    if (inStr) {
      if (ch === "\\") { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
    if (ch === "[" || ch === "{" || ch === "(") depth++;
    else if (ch === "]" || ch === "}" || ch === ")") {
      depth--;
      if (depth === 0) return code.slice(start, i + 1);
    }
  }
  return null;
}

// Find every register([...]) call and dump the id types it carries.
const callSites = [];
for (const m of code.matchAll(/register\(\[/g)) {
  const start = m.index + "register(".length;
  const raw = sliceBalanced(start);
  if (!raw) continue;
  const restored = raw
    .replace(/!0/g, "true")
    .replace(/!1/g, "false")
    .replace(/void 0/g, "null");
  let obj;
  try {
    obj = vm.runInNewContext(`(${restored})`, Object.create(null), { timeout: 5000 });
  } catch (e) {
    callSites.push({ at: m.index, error: e.message });
    continue;
  }
  callSites.push({
    at: m.index,
    count: Array.isArray(obj) ? obj.length : -1,
    ids: (Array.isArray(obj) ? obj : [obj]).map((x) => x?.id ?? "?").join(" "),
    nested: Array.isArray(obj)
      ? obj.map((x) => (Array.isArray(x) ? `arr(${x.length})` : "obj")).join(" ")
      : "",
  });
}
console.log(JSON.stringify(callSites, null, 2));