import fs from "node:fs";

const h = fs.readFileSync(
  "docs/research/relab-0c02b053/root-8a5edab2/live-page.html",
  "utf8"
);

const styles = new Set(
  [...h.matchAll(/style="([^"]*transform3d[^"]*)"/gi)].map((m) => m[1])
);
for (const s of styles) {
  console.log(JSON.stringify(s.slice(0, 260)));
  console.log(
    "  props:",
    s
      .split(";")
      .map((d) => d.split(":")[0]?.trim())
      .filter(Boolean)
      .join(" | ")
  );
}

console.log("--- maxlength values ---");
console.log(
  [...new Set([...h.matchAll(/maxlength="([^"]*)"/gi)].map((m) => m[0]))].join(
    " "
  )
);
console.log("--- maxLength values ---");
console.log(
  [...new Set([...h.matchAll(/maxLength="([^"]*)"/gi)].map((m) => m[0]))].join(
    " "
  )
);