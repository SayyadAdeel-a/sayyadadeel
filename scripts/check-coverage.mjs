// Coverage check: which of the 25 registered routes does each audit actually
// exercise, and which have a route file.
//
// Usage: node scripts/check-coverage.mjs
import fs from "node:fs";

const registry = JSON.parse(
  fs.readFileSync("docs/research/relab-0c02b053/routes.json", "utf8")
).routes.map((r) => r.route);

/** Every route file Next renders. */
function builtRoutes(dir = "app", out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) builtRoutes(path, out);
    else if (entry.name === "page.tsx" || entry.name === "not-found.tsx") {
      out.push(path.replace(/^app/, "").replace(/\/page\.tsx$/, "") || "/");
    }
  }
  return out;
}

const built = builtRoutes();

console.log(`registry : ${registry.length} routes`);
console.log(`route files: ${built.length} (including not-found)`);

const audits = {
  motion: "qa/motion-report.json",
  reveals: "qa/reveal-report.json",
  hover: "qa/hover-report.json",
  behaviour: "qa/report.json",
};

const table = [];
for (const [name, file] of Object.entries(audits)) {
  const path = `docs/research/relab-0c02b053/${file}`;
  if (!fs.existsSync(path)) {
    table.push({ audit: name, routes: 0, viewports: 0, missing: "no report" });
    continue;
  }
  const report = JSON.parse(fs.readFileSync(path, "utf8"));
  const entries = report.entries ?? [];
  const seen = new Set(entries.map((e) => e.route));
  const missing = registry.filter((r) => !seen.has(r));
  table.push({
    audit: name,
    routes: seen.size,
    viewports: entries.length,
    missing: missing.length ? missing.join(" ") : "none",
  });
}

console.log("");
for (const row of table) {
  console.log(
    `  ${row.audit.padEnd(10)} ${String(row.routes).padStart(3)} routes  ` +
      `${String(row.viewports).padStart(3)} route-viewports  missing: ${row.missing}`
  );
}

const notBuilt = registry.filter((r) => !built.includes(r));
console.log(
  `\nroutes in the registry with no route file: ${
    notBuilt.length ? notBuilt.join(" ") : "none"
  }`
);
const notRegistered = built.filter((r) => !registry.includes(r));
console.log(
  `route files not in the registry: ${
    notRegistered.length ? notRegistered.join(" ") : "none"
  }`
);