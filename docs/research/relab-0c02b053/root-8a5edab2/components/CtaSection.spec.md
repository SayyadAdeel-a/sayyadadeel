# CtaSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/CtaSection.tsx`
- **Source element:** `<section class="cta-section">`
- **Role:** Closing call to action
- **Interaction model:** scroll reveal + button hover
- **Behaviour reference:** `BEHAVIORS.md §4`, `BEHAVIORS.md §7`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/cta-section.html`

## DOM structure

```
<section .cta-section>
  <div .w-layout-blockcontainer.container>
    <div .cta-wrapper>
      <div .cta-wrap>
        <div .cta-text-wrapper>
          <div .cta-text-wrap>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.cta-section` - box `1440×670`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1440px`
  - height: `670px`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `16px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - letterSpacing: `-0.32px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`
- `.cta-wrapper` - box `1360×670`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1360px`
  - height: `670px`
  - minHeight: `0px`
  - padding: `40px 40px 80px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `16px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - letterSpacing: `-0.32px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgb(255, 255, 255)`
  - borderRadius: `40px 40px 0px 0px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`
- `.h2` - box `507×158`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `507.438px`
  - height: `158.406px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `79.2px`
  - fontWeight: `600`
  - lineHeight: `79.2px`
  - letterSpacing: `-4.752px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`
- `.button` - box `213×48`
  - display: `flex`
  - position: `relative`
  - flexDirection: `row`
  - justifyContent: `space-between`
  - alignItems: `center`
  - gap: `24px`
  - width: `212.828px`
  - height: `48px`
  - maxWidth: `100%`
  - minHeight: `0px`
  - padding: `4px 4px 4px 24px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `18px`
  - fontWeight: `600`
  - lineHeight: `23.94px`
  - letterSpacing: `-0.36px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgb(255, 255, 255)`
  - borderRadius: `100px`
  - border: `0px none rgb(0, 0, 0)`
  - boxShadow: `rgba(0, 0, 0, 0.02) 0px 12px 8px 0px, rgba(0, 0, 0, 0.05) 0px 4px 12px 0px`
  - overflow: `hidden`
  - opacity: `1`
  - zIndex: `50`
  - objectFit: `fill`

## Verbatim text content

- Ready To Launch Next Campaign?
- Schedule a Call

## Assets

- `/assets/home/_shared/arrow-1.svg`
- `/assets/home/_shared/image-2037-p-1080.avif`
- `/assets/home/_shared/image-2037-p-500.avif`
- `/assets/home/_shared/image-2037-p-800.avif`
- `/assets/home/_shared/cover-size-image-image-2037.avif`

## Responsive behaviour

Layout is entirely driven by the reference stylesheet, which the clone imports
unmodified, so breakpoints are inherited rather than reimplemented. Measured
document heights match the reference exactly:

| Viewport | Reference | Clone |
| --- | --- | --- |
| 1440×900 | 14368 px | 14368 px |
| 768×1024 | 16141 px | 16141 px |
| 390×844 | 14079 px | 14079 px |

Breakpoints in play: `min-width: 1280px` refinements, `max-width: 991px`,
`max-width: 767px`, and Webflow's `main`/`medium`/`small`/`tiny` names used
by the interaction engine.

## Verification

- Computed-style parity: `node scripts/compare-styles.mjs --width=<w>`
- Behaviour parity: `node scripts/compare-behavior.mjs --width=<w>`
- Pixel parity: `node scripts/compare.mjs --width=<w> --full` then
  `node scripts/diff-images.mjs`
