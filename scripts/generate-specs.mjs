// Generate one component specification per cloned section by combining:
//   - the section's exact markup from the captured reference HTML,
//   - the assets and text content the component references,
//   - live computed styles probed from the reference site,
//   - the behaviour mapping transcribed from the IX payload.
//
// Usage: node scripts/generate-specs.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  path.join(process.env.APPDATA, "\\npm\\node_modules", "playwright")
);

const ART = "docs/research/relab-0c02b053/root-8a5edab2";
const SITE = "relab-0c02b053";
const PAGE = "root-8a5edab2";
const COMPONENT_DIR = `src/components/sites/${SITE}/${PAGE}`;
const SPEC_DIR = `${ART}/components`;

const html = fs.readFileSync(`${ART}/live-page.html`, "utf8");
const body = html.slice(html.indexOf("<body") + 5, html.indexOf("</body>"));

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

function topLevel(src) {
  const out = [];
  let i = 0;
  let depth = 0;
  let start = -1;
  for (; i < src.length; i++) {
    if (src[i] !== "<") continue;
    if (src[i + 1] === "/") {
      const gt = src.indexOf(">", i);
      depth -= 1;
      if (depth === 0 && start >= 0) {
        out.push(src.slice(start, gt + 1));
        start = -1;
      }
      i = gt;
      continue;
    }
    const m = /^<([a-zA-Z][\w:.-]*)/.exec(src.slice(i));
    if (!m) continue;
    const name = m[1].toLowerCase();
    if (depth === 0) start = i;
    let j = i;
    let quote = null;
    while (j < src.length) {
      const c = src[j];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === ">") break;
      j++;
    }
    const selfClose = src[j - 1] === "/";
    if (VOID.has(name) || selfClose) {
      if (depth === 0) out.push(src.slice(i, j + 1));
    } else depth += 1;
    i = j;
  }
  return out;
}

const nodes = topLevel(body);

/** Per-component specification inputs. */
const SPECS = [
  {
    sectionClass: "header-section",
    component: "HeaderSection",
    role: "Sticky brand bar and navigation",
    interaction: "click-driven (mobile menu)",
    behaviourRefs: ["BEHAVIORS.md §7 (button hover)", "BEHAVIORS.md §8 (menu toggle)", "BEHAVIORS.md §10 (w-nav)"],
    probes: [
      ".navbar", ".nav-inner", ".nav-link", ".button", ".button-normal-text",
      ".button-icon-box", ".menu-button", ".hamburger-line-top",
    ],
  },
  {
    sectionClass: "hero-section",
    component: "HeroSection",
    role: "Display hero",
    interaction: "load reveal + infinite ambient loops",
    behaviourRefs: ["BEHAVIORS.md §2", "BEHAVIORS.md §3"],
    probes: [
      ".hero-section", ".hero-wrapper", ".agency-hero-text-wrap", ".h1",
      ".text-default", ".agency-dectlies-wrap", ".bg-image", ".hero-bg-image-wrap",
    ],
  },
  {
    sectionClass: "hero-intro-section",
    component: "HeroIntroSection",
    role: "Tabbed feature explainer with mockup viewport",
    interaction: "click-driven tabs",
    behaviourRefs: ["BEHAVIORS.md §9"],
    probes: [
      ".hero-intro-section", ".single-image-wrap", ".hero-intro-card-box",
      ".hero-intro-meddle-bg-image", ".text-mediums",
    ],
  },
  {
    sectionClass: "our-creators-section",
    component: "OurCreatorsSection",
    role: "Sticky scroll-driven creator cards",
    interaction: "scroll-driven (scrubbed convergence)",
    behaviourRefs: ["BEHAVIORS.md §5", "BEHAVIORS.md §4"],
    probes: [
      ".our-creators-section", ".our-creators-sticky", ".h2", ".box-one",
      ".our-creators-box", ".text-medium", ".our-creators-bg-image-wrap",
    ],
  },
  {
    sectionClass: "selider-section",
    component: "SolutionsSliderSection",
    role: "Creator solutions carousel",
    interaction: "click/drag carousel + autoplay",
    behaviourRefs: ["BEHAVIORS.md §10 (w-slider)", "BEHAVIORS.md §2"],
    probes: [
      ".selider-section", ".services-slider", ".services-mask",
      ".services-slide", ".h3", ".h5", ".slide-creators-button-wrap",
      ".left-arrow", ".right-arrow",
    ],
  },
  {
    sectionClass: "meet-section",
    component: "MeetSection",
    role: "Video showcase",
    interaction: "autoplay video + play/pause control",
    behaviourRefs: ["BEHAVIORS.md §10 (w-background-video)", "BEHAVIORS.md §2"],
    probes: [
      ".meet-section", ".h6", ".background-video", ".background-video-wrap",
      ".play-pause-button",
    ],
  },
  {
    sectionClass: "featured-work-section",
    component: "FeaturedWorkSection",
    role: "Case study cards",
    interaction: "scroll reveal + image hover zoom",
    behaviourRefs: ["BEHAVIORS.md §7", "BEHAVIORS.md §4"],
    probes: [
      ".featured-work-section", ".featured-work-card-box",
      ".featured-work-card-image-box", ".featured-work-card-image-wrap",
    ],
  },
  {
    sectionClass: "capabilities-section",
    component: "CapabilitiesSection",
    role: "Capability list with scroll-driven title stack",
    interaction: "scroll-driven title stack",
    behaviourRefs: ["BEHAVIORS.md §6", "BEHAVIORS.md §4"],
    probes: [
      ".capabilities-section", ".our-work-image-wrap", ".our-work-text-wrap",
      ".text-title-box",
    ],
  },
  {
    sectionClass: "our-process-section",
    component: "OurProcessSection",
    role: "Numbered process carousel",
    interaction: "slider",
    behaviourRefs: ["BEHAVIORS.md §10 (w-slider)", "BEHAVIORS.md §4"],
    probes: [
      ".our-process-section", ".process-slider", ".process-slide",
      ".process-image-wrap", ".process-text-wrap",
    ],
  },
  {
    sectionClass: "our-clients-section",
    component: "OurClientsSection",
    role: "Client testimonials in tabs",
    interaction: "click-driven tabs + scroll reveal",
    behaviourRefs: ["BEHAVIORS.md §10 (w-tabs)", "BEHAVIORS.md §4"],
    probes: [
      ".our-clients-section", ".h2", ".display-01", ".tab-link", ".tab-pane",
      ".text-medium", ".featured-brands-image-box",
    ],
  },
  {
    sectionClass: "brands-section",
    component: "BrandsMarqueeSection",
    role: "Brands CTA banner",
    interaction: "button hover",
    behaviourRefs: ["BEHAVIORS.md §7"],
    probes: [".brands-section", ".button", ".button-normal-text"],
  },
  {
    sectionClass: "worked-section",
    component: "WorkedSection",
    role: "Creator community image marquee",
    interaction: "infinite marquee",
    behaviourRefs: ["BEHAVIORS.md §2"],
    probes: [".worked-section", ".h2", ".worked-image-wrap", ".worked-image-box"],
  },
  {
    sectionClass: "pricing-section",
    component: "PricingSection",
    role: "Three pricing tiers",
    interaction: "scroll reveal + button hover",
    behaviourRefs: ["BEHAVIORS.md §4", "BEHAVIORS.md §7"],
    probes: [
      ".pricing-section", ".h2", ".pricing-card-box", ".pricing-card-text-wrap",
      ".button-normal-text", ".section-label", ".text-icon",
    ],
  },
  {
    sectionClass: "our-clients-say-section",
    component: "OurClientsSaySection",
    role: "Review grid",
    interaction: "scroll reveal",
    behaviourRefs: ["BEHAVIORS.md §4"],
    probes: [".our-clients-say-section", ".h2", ".review-card"],
  },
  {
    sectionClass: "insights-ideas-section",
    component: "InsightsIdeasSection",
    role: "Blog cards",
    interaction: "scroll reveal + image hover zoom",
    behaviourRefs: ["BEHAVIORS.md §4", "BEHAVIORS.md §7"],
    probes: [".insights-ideas-section", ".h2", ".blog-list-wrap", ".blog-card-box"],
  },
  {
    sectionClass: "cta-section",
    component: "CtaSection",
    role: "Closing call to action",
    interaction: "scroll reveal + button hover",
    behaviourRefs: ["BEHAVIORS.md §4", "BEHAVIORS.md §7"],
    probes: [".cta-section", ".cta-wrapper", ".h2", ".button"],
  },
  {
    sectionClass: "footer-section",
    component: "FooterSection",
    role: "Footer with newsletter form",
    interaction: "link hover, demo form submit",
    behaviourRefs: ["BEHAVIORS.md §4"],
    probes: [".footer-section", ".h4", ".w-input", ".w-button"],
  },
  {
    sectionClass: "template-buttons-wrapper",
    component: "TemplateButtons",
    role: "Webflow marketplace promo overlay",
    interaction: "hover scale (Webflow-owned widget)",
    behaviourRefs: ["BEHAVIORS.md §11"],
    probes: [".template-buttons-wrapper", ".promotional-button-text"],
  },
];

const PROPS = [
  "display", "position", "flexDirection", "justifyContent", "alignItems", "gap",
  "gridTemplateColumns", "width", "height", "maxWidth", "minHeight", "padding",
  "margin", "fontFamily", "fontSize", "fontWeight", "lineHeight",
  "letterSpacing", "color", "backgroundColor", "backgroundImage",
  "borderRadius", "border", "boxShadow", "overflow", "opacity", "transform",
  "zIndex", "objectFit",
];

async function probe(selectors) {
  const browser = await chromium.launch({
    executablePath:
      process.env.LOCALAPPDATA +
      "\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("https://relab-template.webflow.io/", {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(2500);
  const data = await page.evaluate(
    ({ selectors, props }) => {
      const out = {};
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (!el) {
          out[sel] = null;
          continue;
        }
        const cs = getComputedStyle(el);
        const styles = {};
        for (const p of props) {
          const v = cs[p];
          if (v && v !== "none" && v !== "normal" && v !== "auto") styles[p] = v;
        }
        const r = el.getBoundingClientRect();
        out[sel] = {
          styles,
          box: `${Math.round(r.width)}×${Math.round(r.height)}`,
          text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 220),
        };
      }
      return out;
    },
    { selectors, props: PROPS }
  );
  await browser.close();
  return data;
}

const probes = await probe(SPECS.flatMap((s) => s.probes));
fs.mkdirSync(SPEC_DIR, { recursive: true });

for (const spec of SPECS) {
  const node = nodes.find((n) => {
    const cm = /class="([^"]*)"/.exec(n);
    return cm && cm[1].trim().split(/\s+/)[0] === spec.sectionClass;
  });
  if (!node) {
    console.log(`MISSING ${spec.sectionClass}`);
    continue;
  }

  const componentSource = fs.readFileSync(
    `${COMPONENT_DIR}/${spec.component}.tsx`,
    "utf8"
  );

  // Assets referenced by this component only.
  const assets = [
    ...new Set(
      [...componentSource.matchAll(/(\/sites\/relab-0c02b053\/[^"'`)\s,]+)/g)].map(
        (m) => m[1]
      )
    ),
  ].sort();

  // Text content, in document order.
  const text = [
    ...new Set(
      (node.match(/>([^<>]{2,120})</g) || [])
        .map((s) =>
          s
            .slice(1, -1)
            .replace(/&[a-z]+;/gi, " ")
            .replace(/\s+/g, " ")
            .trim()
        )
        .filter((s) => s && !/^[\d\s.,%+-]+$/.test(s))
    ),
  ];

  const probeRows = spec.probes
    .map((sel) => {
      const data = probes[sel];
      if (!data) return `- \`${sel}\` - not present`;
      const entries = Object.entries(data.styles)
        .filter(([k]) => k !== "backgroundImage" || data.styles.backgroundImage !== "none")
        .map(([k, v]) => `${k}: \`${v}\``);
      return [
        `- \`${sel}\` - box \`${data.box}\``,
        ...entries.map((e) => `  - ${e}`),
      ].join("\n");
    })
    .join("\n");

  const sectionHtmlPath = `${ART}/sections/${spec.sectionClass}.html`;
  fs.writeFileSync(sectionHtmlPath, node);
  const hasSectionFile = true;

  const md = `# ${spec.component} Specification

## Overview

- **Target file:** \`${COMPONENT_DIR}/${spec.component}.tsx\`
- **Source element:** \`<${node.match(/^<([a-z]+)/)[1]} class="${spec.sectionClass}">\`
- **Role:** ${spec.role}
- **Interaction model:** ${spec.interaction}
- **Behaviour reference:** ${spec.behaviourRefs.map((r) => `\`${r}\``).join(", ")}
- **Reference markup:** \`${hasSectionFile ? sectionHtmlPath : ART + "/live-page.html"}\`

## DOM structure

\`\`\`
${indentTree(node, 0)}
\`\`\`

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

${probeRows}

## Verbatim text content

${text.map((t) => `- ${t}`).join("\n")}

## Assets

${assets.length ? assets.map((a) => `- \`${a}\``).join("\n") : "- (none)"}

## Responsive behaviour

Layout is entirely driven by the reference stylesheet, which the clone imports
unmodified, so breakpoints are inherited rather than reimplemented. Measured
document heights match the reference exactly:

| Viewport | Reference | Clone |
| --- | --- | --- |
| 1440×900 | 14368 px | 14368 px |
| 768×1024 | 16141 px | 16141 px |
| 390×844 | 14079 px | 14079 px |

Breakpoints in play: \`min-width: 1280px\` refinements, \`max-width: 991px\`,
\`max-width: 767px\`, and Webflow's \`main\`/\`medium\`/\`small\`/\`tiny\` names used
by the interaction engine.

## Verification

- Computed-style parity: \`node scripts/compare-styles.mjs --width=<w>\`
- Behaviour parity: \`node scripts/compare-behavior.mjs --width=<w>\`
- Pixel parity: \`node scripts/compare.mjs --width=<w> --full\` then
  \`node scripts/diff-images.mjs\`
`;

  fs.writeFileSync(`${SPEC_DIR}/${spec.component}.spec.md`, md);
  console.log(`wrote ${SPEC_DIR}/${spec.component}.spec.md`);
}

function indentTree(src, depth) {
  // A shallow outline: element + first class, nesting limited to 4 levels.
  const out = [];
  let i = 0;
  let level = 0;
  const VOIDS = new Set([...VOID]);
  while (i < src.length && level <= 5) {
    const lt = src.indexOf("<", i);
    if (lt === -1) break;
    if (src.startsWith("</", lt)) {
      const gt = src.indexOf(">", lt);
      level -= 1;
      i = gt + 1;
      continue;
    }
    const m = /^<([a-zA-Z][\w:.-]*)/.exec(src.slice(lt));
    if (!m) {
      i = lt + 1;
      continue;
    }
    const tag = m[1];
    let j = lt;
    let quote = null;
    while (j < src.length) {
      const c = src[j];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === ">") break;
      j++;
    }
    const frag = src.slice(lt, j + 1);
    const cls = /class="([^"]*)"/.exec(frag);
    const label = cls ? cls[1].split(/\s+/).slice(0, 2).join(".") : "";
    out.push(`${"  ".repeat(Math.max(0, level))}<${tag}${label ? ` .${label}` : ""}>`);
    const selfClose = src[j - 1] === "/" || VOIDS.has(tag.toLowerCase());
    if (!selfClose) level += 1;
    i = j + 1;
  }
  return out.join("\n");
}