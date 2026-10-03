import fs from "node:fs";

// Rewrite the `collect` function inside compare-dom.mjs so animated
// subtrees are flagged without leaving dead code behind.
const file = "scripts/compare-dom.mjs";
let text = fs.readFileSync(file, "utf8");

const start = text.indexOf("const collect = () => {");
const end = text.indexOf("async function run(browser, url)");

if (start === -1 || end === -1) {
  console.log("markers not found");
  process.exit(1);
}

const replacement = `const collect = () => {
  const out = [];
  const walk = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" && cs.visibility === "hidden") return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      for (const child of el.children) walk(child);
      return;
    }
    // A non-\`none\` matrix means GSAP is driving this element; its subtree is
    // phase-dependent and is verified by the behaviour harness instead.
    const animated =
      /^(matrix|matrix3d)\\(/.test(cs.transform) && cs.transform !== "none";
    const start = out.length;
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: el.className?.toString().slice(0, 90) ?? "",
      id: el.id ?? "",
      x: Math.round((r.x + window.scrollX) * 100) / 100,
      y: Math.round((r.y + window.scrollY) * 100) / 100,
      w: Math.round(r.width * 100) / 100,
      h: Math.round(r.height * 100) / 100,
      text: (el.childElementCount === 0 ? el.textContent : "")
        .replace(/\\s+/g, " ")
        .trim()
        .slice(0, 60),
      animated,
    });
    for (const child of el.children) walk(child);
    if (animated) for (let i = start; i < out.length; i++) out[i].animated = true;
  };
  walk(document.body);
  return out;
};

`;

text = text.slice(0, start) + replacement + text.slice(end);
fs.writeFileSync(file, text, "utf8");
console.log("collect() rewritten");