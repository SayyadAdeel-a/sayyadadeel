# Page Topology — Relab Webflow Template

- **Origin:** `https://relab-template.webflow.io/`
- **Destination route:** `/` (`app/page.tsx`)
- **Site key:** `relab-0c02b053` · **Page key:** `root-8a5edab2`
- **Total document height:** 14368 px @1440×900, 16141 px @768×1024, 14079 px @390×844 — identical to the reference at every breakpoint tested.
- **Smooth scroll:** Lenis 1.1.14, `lerp: 0.08`
- **Stylesheet:** the site's own `relab-template.webflow.shared.0356be2f0.css`, byte-for-byte, imported as `app/webflow.css`.

## Why the DOM is identical

The clone is generated directly from the captured HTML rather than
hand-transcribed. `scripts/convert-to-jsx.mjs` parses `live-page.html` and emits
one React component per top-level element, preserving every class, attribute
and text node. This is why the layout matches exactly: there is one stylesheet
(Webflow's) and one markup tree (Webflow's), and React only supplies behaviour.

Consequences worth knowing:

- Webflow's IX hooks (`fade-up="ture"`, `contain-left-move-child`, …) are kept as
  attributes, because the runtime targets them by attribute selector.
- `data-wf-*` attributes and `data-wf-component-id` values are kept so variant
  rules (`data-wf-variant-state`) resolve identically.
- `srcset`/`sizes` are preserved and rewritten to locally downloaded candidates,
  which is what keeps intrinsic image dimensions identical at each breakpoint.
- `<noscript>` fallbacks are dropped (they only matter with JS disabled).
- Webflow's Wix-style `w-container` / `w-slider` / `w-tabs` classes are kept and
  their behaviour is reimplemented in
  `src/components/sites/relab-0c02b053/shared/InteractionsRuntime.tsx`.

## Section order (top to bottom)

| # | Element | Component | Height @1440 | Interaction model |
| --- | --- | --- | --- | --- |
| 0 | `section.header-section` | `HeaderSection` | 76 px, `position: absolute`, `z-index: 800` | click-driven mobile menu |
| 1 | `section.hero-section` | `HeroSection` | ~572 px | load reveal + ambient loops |
| 2 | `section.hero-intro-section` | `HeroIntroSection` | ~659 px | click-driven tabs |
| 3 | `section.our-creators-section` | `OurCreatorsSection` | 2250 px with a `position: sticky` inner layer | scroll-scrubbed convergence (desktop only) |
| 4 | `section.selider-section` | `SolutionsSliderSection` | ~932 px | click/drag carousel + autoplay |
| 5 | `section.meet-section` | `MeetSection` | ~1503 px | autoplay video + play/pause |
| 6 | `section.featured-work-section` | `FeaturedWorkSection` | ~344 px | scroll reveal + image hover zoom |
| 7 | `section.capabilities-section` | `CapabilitiesSection` | ~1082 px | scroll-scrubbed title stack |
| 8 | `section.our-process-section` | `OurProcessSection` | ~772 px | slider |
| 9 | `section.our-clients-section` | `OurClientsSection` | ~840 px | tabs + scroll reveal |
| 10 | `section.brands-section` | `BrandsMarqueeSection` | ~379 px | button hover |
| 11 | `section.worked-section` | `WorkedSection` | ~772 px | 18 s infinite marquee |
| 12 | `section.pricing-section` | `PricingSection` | ~782 px | scroll reveal + button hover |
| 13 | `section.our-clients-say-section` | `OurClientsSaySection` | ~1598 px | scroll reveal |
| 14 | `section.insights-ideas-section` | `InsightsIdeasSection` | ~576 px | scroll reveal + image hover |
| 15 | `section.cta-section` | `CtaSection` | ~670 px | scroll reveal + button hover |
| 16 | `section.footer-section` | `FooterSection` | ~631 px | link hover, newsletter form |
| 17 | `div.template-buttons-wrapper` | `TemplateButtons` | fixed overlay | Webflow marketplace promo + hover |

## Page-level layout

- The header is the only `position: absolute` element; everything else flows.
- `.our-creators-sticky` is the only `position: sticky` element
  (`top: 0`, `height: 100vh` ≥992 px, `height: auto` below 767 px).
- The scroll container is the document; Lenis drives it.
- `InteractionsRuntime` is mounted once, after every section, and owns all
  behaviour. It is a single client component so no section needs to be a client
  boundary.

## Layering (z-index)

| Element | z-index |
| --- | --- |
| `.header-section` / `.navbar` | 800 |
| `.nav-menu-wrap` (mobile dropdown) | 778 |
| `.w-slider-nav` | 2 |
| `.w-slider-mask` | 1 |