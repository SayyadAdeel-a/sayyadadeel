# FeaturedWorkSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/FeaturedWorkSection.tsx`
- **Source element:** `<section class="featured-work-section">`
- **Role:** Case study cards
- **Interaction model:** scroll reveal + image hover zoom
- **Behaviour reference:** `BEHAVIORS.md §7`, `BEHAVIORS.md §4`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/featured-work-section.html`

## DOM structure

```
<section .featured-work-section>
  <div .w-layout-blockcontainer.container>
    <div .featured-work-wrapper>
      <div .featured-work-wrap>
        <div .w-dyn-list>
          <div .featured-collection-list.w-dyn-items>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.featured-work-section` - box `1440×344`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1440px`
  - height: `343.812px`
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
- `.featured-work-card-box` - box `443×344`
  - display: `flex`
  - position: `static`
  - flexDirection: `column`
  - justifyContent: `space-between`
  - alignItems: `flex-start`
  - width: `442.656px`
  - height: `343.812px`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `16px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - letterSpacing: `-0.32px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgb(255, 255, 255)`
  - borderRadius: `40px`
  - border: `1px solid rgb(255, 255, 255)`
  - overflow: `visible`
  - opacity: `0`
  - transform: `matrix(1, 0, 0, 1, 0, 100)`
  - objectFit: `fill`
- `.featured-work-card-image-box` - box `0×0`
  - display: `block`
  - position: `relative`
  - flexDirection: `row`
  - width: `0px`
  - height: `0px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `16px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - letterSpacing: `-0.32px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `40px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `hidden`
  - opacity: `1`
  - objectFit: `fill`
- `.featured-work-card-image-wrap` - box `0×0`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `0px`
  - height: `0px`
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
  - borderRadius: `40px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `hidden`
  - opacity: `1`
  - transform: `matrix(1, 0, 0, 1, 0, 0)`
  - objectFit: `fill`

## Verbatim text content

- Fitness
- YouTube
- GlowSkin Launch
- A creator-first product launch that generated millions of impressions through authentic beauty content.
- Read More
- Urban Streetwear
- Lifestyle creators helped the brand boost engagement and drive awareness with short-form video storytelling.
- MoveFit Challenge
- A multi-platform creator campaign designed to increase community participation and product visibility.

## Assets

- `/sites/relab-0c02b053/root-8a5edab2/6a9d62e8c1a2b5123a02ed40_Vector.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6aa53cb2a0a0a0b60d99c8fa_sparkles-01.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6aa53cc749fe53fce8fc7983_swatch-02.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6aa53cd66e6e05b105594401_bolt.svg`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6aa53173d36b309d88b07d33_Frame_2147262233_2_-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6aa53173d36b309d88b07d33_Frame_2147262233_2_.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6aa531adac93082b8a677f55_Frame_2147262233_1_-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6aa531adac93082b8a677f55_Frame_2147262233_1_.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6aa531dae24fcce9483ab513_Frame_2147262233-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6aa531dae24fcce9483ab513_Frame_2147262233.avif`

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
