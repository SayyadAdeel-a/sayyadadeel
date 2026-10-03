// List the class tokens containing `slider`, `w-form` or `w-tabs` on the given
// captured pages, so the widget layer's requirements are exact.
import fs from "node:fs";
import path from "node:path";
import { ART_ROOT } from "./lib/page-pipeline.mjs";

const keys = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["root-8a5edab2", "about-979bddc4", "contact-4eb95063", "case-studies-cecbd40a"];

for (const key of keys) {
  const html = fs.readFileSync(path.join(ART_ROOT, key, "live-page.html"), "utf8");
  const body = html.slice(html.indexOf("<body"), html.indexOf("</body>"));
  const collect = (needle) => {
    const set = new Set();
    for (const m of body.matchAll(/class="([^"]*)"/g)) {
      for (const c of m[1].split(/\s+/)) if (c.includes(needle)) set.add(c);
    }
    return [...set];
  };
  console.log(`\n### ${key}`);
  console.log(`  slider : ${collect("slider").join(", ") || "(none)"}`);
  console.log(`  w-form : ${collect("w-form").join(", ") || "(none)"}`);
  console.log(`  w-tabs : ${collect("w-tabs").join(", ") || "(none)"}`);
  console.log(`  w-tab  : ${collect("w-tab").join(", ") || "(none)"}`);
  console.log(
    `  data-* widget attrs: ${[
      ...new Set(
        [...body.matchAll(/\s(data-[a-z0-9-]+)=/g)].map((m) => m[1]),
      ),
    ]
      .filter((a) => /^data-(w-|duration|easing|infinite|autoplay|delay|nav|tab)/.test(a))
      .join(", ")}`
  );
}