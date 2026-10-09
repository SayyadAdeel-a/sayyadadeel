# OurClientsSaySection Specification

## Overview

- **Target file:** `src/components/sites/adeel-site/root-8a5edab2/OurClientsSaySection.tsx`
- **Source element:** `<section class="our-clients-say-section">`
- **Role:** Review grid
- **Interaction model:** scroll reveal
- **Behaviour reference:** `BEHAVIORS.md §4`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/our-clients-say-section.html`

## DOM structure

```
<section .our-clients-say-section>
  <div .w-layout-blockcontainer.container>
    <div .our-clients-say-wrapper>
      <div .our-clients-say-wrap>
        <div .our-clients-say-icon-wrap>
          <img .contain-size-image>
        <div .loved-by-creators-wrapper>
          <div .loved-by-creators-wrap>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.our-clients-say-section` - box `1440×1598`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1440px`
  - height: `1597.84px`
  - minHeight: `0px`
  - padding: `120px 0px`
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
- `.review-card` - not present

## Verbatim text content

- Results
- Stories
- Trusted By Brands That Want More Than Views
- Emma Wilson
- of
- Glow Cosmetics
- David Kim
- Urban Supply
- Sophia Martinez
- PureFit
- John Smith
- Nova Labs
- Olivia Brown
- Bloom Studio
- Ava Thompson
- Mellow Drinks
- Noah Anderson
- Peak Nutrition
- Liam Walker
- Motion Apparel

## Assets

- `/assets/home/14-our-clients-say/rectangle-1742-4.avif`
- `/assets/home/14-our-clients-say/rectangle-1742-5.avif`
- `/assets/home/14-our-clients-say/rectangle-1742-7.avif`
- `/assets/home/14-our-clients-say/rectangle-1742-6.avif`
- `/assets/home/14-our-clients-say/rectangle-1742-2.avif`
- `/assets/home/14-our-clients-say/rectangle-1742-3.avif`
- `/assets/home/14-our-clients-say/contain-size-image-rectangle-1742.avif`
- `/assets/home/14-our-clients-say/rectangle-1742-1.avif`
- `/assets/home/14-our-clients-say/contain-size-image-group-37387.svg`
- `/assets/home/14-our-clients-say/contain-size-image-frame-2147262259.svg`

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
