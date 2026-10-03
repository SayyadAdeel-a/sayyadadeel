import fs from "node:fs";

const ORIGIN = "https://relab-template.webflow.io";
const ART_ROOT = "docs/research/relab-0c02b053";

console.log("=== 'channel' mentions in captured pages ===");
for (const dir of fs.readdirSync(ART_ROOT)) {
  const file = `${ART_ROOT}/${dir}/live-page.html`;
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const hits = [...html.matchAll(/[^"'\s<>]*channel[^"'\s<>]*/gi)]
    .map((m) => m[0])
    .filter((v, i, arr) => arr.indexOf(v) === i);
  if (hits.length) console.log(`${dir}: ${[...new Set(hits)].slice(0, 12).join(", ")}`);
}

console.log("\n=== 'logo' links across captured pages ===");
const links = new Set();
for (const dir of fs.readdirSync(ART_ROOT)) {
  const file = `${ART_ROOT}/${dir}/live-page.html`;
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  for (const m of html.matchAll(/href="(\/[^"#]*)"/g)) links.add(m[1]);
}
console.log([...links].sort().join("\n"));

console.log("\n=== probing extra candidates ===");
const EXTRA = [
  "/channel-logo", "/channel_logos", "/channels", "/logo", "/brand",
  "/style-guide/channel-logo", "/changelog", "/cookies", "/privacy",
  "/terms", "/faq", "/careers", "/work", "/journal", "/resources",
];
for (const p of EXTRA) {
  try {
    const res = await fetch(ORIGIN + p, {
      headers: { "user-agent": "Mozilla/5.0 clone-research" },
      redirect: "manual",
    });
    const title =
      res.status === 200
        ? (/<title>([^<]*)<\/title>/i.exec(await res.clone().text())?.[1] ?? "")
        : "";
    console.log(`${String(res.status).padEnd(4)} ${p.padEnd(26)} ${title}`);
  } catch (e) {
    console.log(`ERR  ${p}: ${e.message}`);
  }
}