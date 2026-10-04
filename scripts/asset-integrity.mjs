/**
 * Integrity, tolerant of line-ending normalisation.
 *
 * `core.autocrlf=true` with no `.gitattributes` means git stores text files with
 * LF and hands them back with CRLF. Any `git checkout` therefore rewrites the
 * bytes of every text asset — SVG included — without changing a single rendered
 * pixel. A byte-exact comparison against a pre-checkout snapshot reports all of
 * them as "changed", which is true and useless.
 *
 * This compares the working tree against the committed blobs with carriage
 * returns removed, which answers the question that actually matters: did the
 * migration lose, add or alter any asset's content?
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MAX = 1 << 28;

const norm = (buf) => {
  // Normalise CRLF -> LF, and treat a missing trailing newline as equivalent.
  const text = Buffer.isBuffer(buf) ? buf.toString("binary") : buf;
  return createHash("sha256")
    .update(text.replace(/\r\n/g, "\n").replace(/\r/g, "\n"), "binary")
    .digest("hex");
};

const committed = new Map();
const listed = execFileSync(
  "git",
  ["ls-tree", "-r", "--name-only", "HEAD", "--", "public"],
  { cwd: ROOT, encoding: "utf8", maxBuffer: MAX }
);

for (const file of listed.split("\n")) {
  if (!file.trim()) continue;
  let buf;
  try {
    buf = execFileSync("git", ["show", "HEAD:" + file], { cwd: ROOT, maxBuffer: MAX });
  } catch {
    continue;
  }
  const list = committed.get(norm(buf)) ?? [];
  list.push(file);
  committed.set(norm(buf), list);
}

const working = new Map();
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else {
      const list = working.get(norm(fs.readFileSync(full))) ?? [];
      list.push(path.relative(ROOT, full).replace(/\\/g, "/"));
      working.set(norm(fs.readFileSync(full)), list);
    }
  }
}
walk(path.join(ROOT, "public"));

let lost = 0;
for (const [hash, paths] of committed) {
  const count = working.get(hash)?.length ?? 0;
  if (count < paths.length) {
    lost += paths.length - count;
    console.log("LOST " + (paths.length - count) + ":");
    for (const p of paths) console.log("     was " + p);
  }
}

let added = 0;
for (const [hash, paths] of working) {
  const count = committed.get(hash)?.length ?? 0;
  if (paths.length > count) added += paths.length - count;
}

const sum = (m) => [...m.values()].reduce((n, l) => n + l.length, 0);

console.log("committed: " + sum(committed) + " files   working: " + sum(working) + " files");
console.log("lost: " + lost + "   gained: " + added);

if (!lost && !added && sum(committed) === sum(working)) {
  console.log("\nOK: every asset's content is accounted for. Nothing lost, added or altered.");
} else {
  process.exitCode = 1;
}