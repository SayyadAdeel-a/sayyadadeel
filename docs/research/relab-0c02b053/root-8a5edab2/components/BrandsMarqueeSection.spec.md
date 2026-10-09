# BrandsMarqueeSection Specification

## Overview

- **Target file:** `src/components/sites/adeel-site/root-8a5edab2/BrandsMarqueeSection.tsx`
- **Source element:** `<section class="brands-section">`
- **Role:** Brands CTA banner
- **Interaction model:** button hover
- **Behaviour reference:** `BEHAVIORS.md §7`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/brands-section.html`

## DOM structure

```
<section .brands-section>
  <div .w-layout-blockcontainer.container>
    <div .our-projects-wrapper>
      <div .our-projects-wrap>
        <div .our-projects-text-wrap>
          <div .our-projects-name-text.display-five>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.brands-section` - box `1440×379`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1440px`
  - height: `379.203px`
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
  - overflow: `hidden`
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
- `.button-normal-text` - box `121×24`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `120.828px`
  - height: `23.9375px`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `18px`
  - fontWeight: `600`
  - lineHeight: `23.94px`
  - letterSpacing: `-0.36px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`

## Verbatim text content

- relab
- Ready To Grow
- With Short Videos?
- Schedule a Call

## Assets

- `/assets/home/_shared/arrow-1.svg`

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
