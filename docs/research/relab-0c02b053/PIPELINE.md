# Per-page cloning pipeline

The reference is a Webflow export, so every page of the clone is **generated**
from captured source material rather than hand-transcribed. This document
describes the pipeline that turns a live route into TSX components, local
assets and a running interaction payload.

The homepage was built first, by hand, with a bespoke runtime. Everything after
it — the nine static pages, the fourteen CMS detail pages and `/changelog` — is
produced by the pipeline below, which is why 24 pages cost about as much
authoring effort as one.

```bash
node scripts/discover-routes.mjs          # find every route the site publishes
node scripts/capture-pages.mjs <route>…   # HTML + runtime chunks + IX payload
node scripts/build-routes-registry.mjs    # routes.json: path → page key + metadata
node scripts/download-page-assets.mjs     # every asset, into the shared pool
node scripts/extract-page-styles.mjs      # the per-page critical stylesheet
node scripts/convert-page.mjs             # components + app/<route>/page.tsx
npm run build
```

---

## 1. Route discovery

Webflow publishes no sitemap here (it 404s), so routes are discovered from the
links in every served page plus a probe list. `scripts/discover-routes.mjs`
reports the full set, including the CMS detail pages reachable only from the
listing pages.

Result (`docs/research/relab-0c02b053/routes.json`, 25 routes):

```
/                                    /case-studies/brew-blend-launch
/about                               /case-studies/glowskin-launch
/services                            /case-studies/movefit-challenge
/services/campaign-management        /case-studies/nova-ai-assistant
/services/creator-partnerships       /case-studies/urban-streetwear
/services/short-form-video-production /blogs
/case-studies                        /blogs/behind-every-high-performing-influencer-campaign
/blogs/choosing-the-right-kocs-for-your-next-campaign
/blogs/how-to-work-viewers-in-the-first-3-seconds
/blogs/short-video-trends-that-will-dominate-this-year
/blogs/turning-creator-content-into-brand-growth
/blogs/what-consumers-actually-want-to-watch-today
/pricing   /contact   /licenses   /style-guide   /changelog   /404
```

There is **no `/channel-logo` route** — the reference returns 404 for it and no
page contains "channel logo" content. `/licenses` (plural) is the licence page.

## 2. Page keys

Each route gets a collision-resistant key: the path slug plus eight hex digits
of `sha256(path)`, so `/` becomes `root-8a5edab2` and `/about` becomes
`about-979bddc4`. The key names the research folder, the component folder and
the `ix.json` that ships with the page.

## 3. Capture

`scripts/capture-pages.mjs` writes, per page:

| File | Contents |
| --- | --- |
| `live-page.html` | the complete served HTML |
| `webflow-ix2.json` | the decoded IX3 interaction + timeline payload |
| `webflow-js/` | every runtime chunk the page loads |
| `scripts-inline/` | the page's own inline scripts |
| `live-webflow.css` | the (site-wide) stylesheet, for provenance |

The IX payload is extracted by finding `Webflow.interactions.register([…])`
calls in each chunk and evaluating the (minified but literal) argument. A
loader that rewrites `!0`/`!1`/`void 0` back to `true`/`false`/`null` is enough,
because Webflow stores interactions as JSON-shaped literals.

Across the site that yields **463 interactions and 513 timelines**; an inner
page carries 18–20 interactions and 20–22 timelines.

## 4. Assets

`scripts/download-page-assets.mjs` collects every remote URL a page references —
`src`, every `srcset` candidate, `data-poster-url`, `data-video-urls`, `<source>`,
CSS `url()` and the `og:image` — and downloads it into
`public/sites/relab-0c02b053/_pool/`.

Webflow CDN filenames embed a content hash, so identical assets across pages
dedupe to the same file: 342 unique URLs, 16 MB, serving all 24 pages (against
12.8 MB for the homepage's own pre-existing directory, which is left untouched).
Each page keeps its own `asset-map.json` (CDN URL → local path) so the converter
stays page-local.

## 5. Critical stylesheet

Each page inlines a `<style>` block in `<head>` that keeps IX-driven elements
hidden until the engine has taken over:

```css
html.w-mod-js:not(.w-mod-ix3):is([fade-up="true"]) { visibility: hidden !important; }
html.w-mod-js:not(.w-mod-ix3) :is( …the full selector list… ) { visibility: hidden !important; }
```

All 24 inner pages emit the **same** 5100-byte block (the homepage's is larger
because it has extra loops and the sticky convergence). `scripts/extract-page-styles.mjs`
verifies there are no conflicts — every hook attribute is hidden on every page
that has it — so the block can be imported as one shared stylesheet without
either page affecting the other.

It becomes `app/<route>/critical.css` and is imported by that route's page. The
homepage does **not** import it: the homepage was completed before this rule was
found and is frozen, so it keeps its pre-existing behaviour (its elements are
visible from first paint and then animate, instead of being hidden until the
runtime is ready). This is the one known deviation on `/`, documented in
`QA_REPORT.md`.

## 6. Conversion

`scripts/convert-page.mjs` parses each page's body into top-level nodes and
emits one TSX component per section.

### Shared shell components

Webflow repeats three sections on every page: `header-section`, `cta-section`
and `footer-section`. Comparing them across all 25 pages gives 14 distinct
variants of each — and the *only* difference is which anchors Webflow marked
`aria-current="page"` / `w--current`:

```
header-section: 14 distinct variants
cta-section:      2 distinct variants
footer-section: 14 distinct variants
  ⇒ every variant differs only by the current-page markers
```

So they are emitted **once** as `SiteHeader` / `SiteCta` / `SiteFooter`, each
taking a `currentPath` prop, and each `<a>`'s marker is derived from it:

```tsx
<a
  href="/about"
  className={`nav-link w-inline-block${currentPath === "/about" ? " w--current" : ""}`}
  aria-current={currentPath === "/about" ? "page" : undefined}
>
```

`aria-current={undefined}` renders no attribute at all, so a non-current link is
byte-identical to the reference.

### Page-specific sections

Everything else becomes a component under
`src/components/sites/relab-0c02b053/<page-key>/`, named from its first class
(`our-team-section` → `OurTeamSection`). The captured markup is emitted
verbatim: class names, Webflow hook attributes (`fade="true"`,
`group-fedup-move="ture"` — note the typo is the hook), inline styles, `srcset`
candidate lists and all text are preserved exactly, because the site's own
stylesheet is imported unmodified and depends on all of them.

Text nodes are decoded up front and emitted inside `{"…"}` when they carry
significant leading or trailing whitespace, and `&nbsp;` survives as `U+00A0`:
JSX drops both otherwise, and the source HTML is minified, so every space in it
is real rendered content.

`app/<route>/page.tsx` assembles the sections as direct children of `<body>` —
no wrapper element is introduced, so the DOM the stylesheet sees is the
reference's — plus the page's metadata and its interaction runtime:

```tsx
import ixPayload from "@/components/sites/relab-0c02b053/about-979bddc4/ix.json";
…
<PageInteractions payload={ixPayload} route="/about" />
```

`app/not-found.tsx` is generated from `/404`, because the reference serves that
exact markup for every unmatched URL (verified: an unknown path returns HTTP 404
with the same 30 450-byte body as `/404`).

## 7. The runtime

`src/components/sites/relab-0c02b053/shared/PageInteractions.tsx` loads GSAP,
ScrollTrigger and SplitText, sets `w-mod-js` / `w-mod-ix` / `w-mod-ix3` on
`<html>` (which is what releases the critical stylesheet), then hands the
page's decoded payload to `shared/ix/runtime.ts`.

That runtime is a faithful interpreter of Webflow's IX3 engine rather than a
hand transcription of each page's animations, so all 24 pages share one
implementation. It is documented in `IX3-ENGINE.md`, and every rule in it was
read out of the reference's own engine bundle or measured against the live
site.

`shared/ix/widgets.ts` covers the widget scripts (`w-tabs`, `w-slider`,
`w-background-video`, `w-form`).

## 8. What is *not* generated

The homepage (`src/components/sites/relab-0c02b053/root-8a5edab2/`) and its
`shared/InteractionsRuntime.tsx` were built before this pipeline existed and are
frozen: `convert-page.mjs` is invoked without `--home` and never touches that
directory. The homepage has its own three sliders, its hero-intro tab script,
the sticky creators convergence and the marketplace bar, none of which the
generic path needs.

## 9. Regenerating

Everything is deterministic: re-running the pipeline reproduces the same
components. `scripts/convert-page.mjs` removes each page's component directory
before regenerating it, so a rename cannot leave a stale file behind, and
`download-page-assets.mjs` skips URLs already in the pool index.