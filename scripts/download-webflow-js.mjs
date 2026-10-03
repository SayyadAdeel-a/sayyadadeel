import fs from "node:fs";
import path from "node:path";

const ART =
  "docs/research/relab-0c02b053/root-8a5edab2";
const outDir = path.join(ART, "webflow-js");
fs.mkdirSync(outDir, { recursive: true });

const html = fs.readFileSync(path.join(ART, "live-page.html"), "utf8");
const srcs = [
  ...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/gi),
].map((m) => m[1]);

for (const src of srcs) {
  const url = src.startsWith("http")
    ? src
    : src.startsWith("//")
      ? "https:" + src
      : new URL(src, "https://relab-template.webflow.io").href;
  const name = path.basename(new URL(url).pathname) || "script.js";
  const file = path.join(outDir, name);
  if (fs.existsSync(file)) continue;
  try {
    const res = await fetch(url);
    const text = await res.text();
    fs.writeFileSync(file, text);
    console.log(`saved ${name} (${text.length})`);
  } catch (e) {
    console.log(`FAIL ${name}: ${e.message}`);
  }
}