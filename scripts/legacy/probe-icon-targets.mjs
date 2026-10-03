// Check whether the `[icon-btn-anim]` elements carry the `data-wf-target`
// payload the continuous mouse-move interaction would resolve through.
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT } from "./lib/page-pipeline.mjs";

const key = process.argv[2] ?? "about-979bddc4";
const html = fs.readFileSync(path.join(ART_ROOT, key, "live-page.html"), "utf8");
const body = html.slice(html.indexOf("<body"), html.indexOf("</body>"));

const anchors = [...body.matchAll(/<a[^>]*icon-btn-anim[^>]*>/g)];
console.log(`${key}: icon-btn-anim anchors = ${anchors.length}`);
for (const a of anchors.slice(0, 3)) console.log("   " + a[0].slice(0, 220));

const withTarget = [...body.matchAll(/<a[^>]*icon-btn-anim[^>]*data-wf-target[^>]*>/g)];
console.log(`   of which carry data-wf-target: ${withTarget.length}`);

const ix = JSON.parse(
  fs.readFileSync(path.join(ART_ROOT, key, "webflow-ix2.json"), "utf8")
);
const continuous = ix.interactions.filter((it) =>
  (it.triggers ?? []).some((t) => t[0] === "wf:mouse-move")
);
for (const it of continuous) {
  console.log(`\n${it.id} trigger target: ${JSON.stringify(it.triggers[0][2])}`);
  console.log(`   scope: ${JSON.stringify(it.scope)}`);
  const need = JSON.stringify(it.triggers[0][2]?.[1]);
  console.log(`   elements whose data-wf-target contains that id list: ${[
    ...body.matchAll(/data-wf-target="([^"]*)"/g),
  ].filter((m) => m[1].includes(need.replace(/[\[\]"]/g, "").slice(0, 40))).length}`);
}