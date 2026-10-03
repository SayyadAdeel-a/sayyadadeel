# OurProcessSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/OurProcessSection.tsx`
- **Source element:** `<section class="our-process-section">`
- **Role:** Numbered process carousel
- **Interaction model:** slider
- **Behaviour reference:** `BEHAVIORS.md §10 (w-slider)`, `BEHAVIORS.md §4`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/our-process-section.html`

## DOM structure

```
<section .our-process-section>
  <div .w-layout-blockcontainer.container>
    <div .our-process-wrapper>
      <div .our-process-wrap>
        <div .card-slider-text-wrapper>
          <div .our-process-text-box>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.our-process-section` - box `1440×772`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1440px`
  - height: `772px`
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
- `.process-slider` - box `1280×510`
  - display: `block`
  - position: `relative`
  - flexDirection: `row`
  - width: `1280px`
  - height: `510px`
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
  - zIndex: `10`
  - objectFit: `fill`
- `.process-slide` - not present
- `.process-image-wrap` - not present
- `.process-text-wrap` - not present

## Verbatim text content

- Our Process
- How We Turn Ideas Into Results
- STEP 01
- 01/03
- Strategy Discovery
- We begin by understanding your brand, audience, campaign goals and market needs.
- STEP 02
- 02/03
- Creator Collaboration
- We connect brands with trusted creators who can tell authentic stories.
- STEP 03
- 03/03
- Performance Growth
- Campaigns are continuously optimized through data, insights, and platform expertise.
- Prev
- Next

## Assets

- `/sites/relab-0c02b053/root-8a5edab2/6a982a5cacb93b89817e14cf_Ellipse_2469.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a9c23c3a86641bfcf710852_long-arrow-alt-left-solid.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a9c256ef9146d40be4e7c53_long-arrow-alt-right-solid.svg`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9e5354e26234b20c1de9d3_Office_Collaboration_1_1_1_-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9e5354e26234b20c1de9d3_Office_Collaboration_1_1_1_.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9e53552a3101e6e4d16c5a_Windowsill_Still_Life_1_1_-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9e53552a3101e6e4d16c5a_Windowsill_Still_Life_1_1_.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9e5355eb4856bd2a825030_Glasses_and_Desk_Items_1_1_-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9e5355eb4856bd2a825030_Glasses_and_Desk_Items_1_1_-p-800.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9e5355eb4856bd2a825030_Glasses_and_Desk_Items_1_1_.avif`

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
