# SolutionsSliderSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/SolutionsSliderSection.tsx`
- **Source element:** `<section class="selider-section">`
- **Role:** Creator solutions carousel
- **Interaction model:** click/drag carousel + autoplay
- **Behaviour reference:** `BEHAVIORS.md §10 (w-slider)`, `BEHAVIORS.md §2`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/selider-section.html`

## DOM structure

```
<section .selider-section>
  <div .w-layout-blockcontainer.container>
    <div .creators-wrapper>
      <div .creators-wrap>
        <div .text-creats-wrap>
          <div .creators-text-wrap>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.selider-section` - box `1440×932`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1440px`
  - height: `931.938px`
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
- `.services-slider` - box `1360×500`
  - display: `block`
  - position: `relative`
  - flexDirection: `row`
  - width: `1360px`
  - height: `500px`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `64px 0px 0px`
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
- `.services-mask` - box `788×500`
  - display: `block`
  - position: `relative`
  - flexDirection: `row`
  - width: `788px`
  - height: `500px`
  - maxWidth: `788px`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `0px 286px`
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
  - opacity: `0`
  - transform: `matrix(1, 0, 0, 1, 0, 0)`
  - zIndex: `1`
  - objectFit: `fill`
- `.services-slide` - box `788×500`
  - display: `inline-block`
  - position: `relative`
  - flexDirection: `row`
  - width: `788px`
  - height: `500px`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `0px 12px 0px 0px`
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
  - transform: `matrix(1, 0, 0, 1, -800, 0)`
  - objectFit: `fill`
- `.h3` - box `896×72`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `896px`
  - height: `72px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `72px`
  - fontWeight: `600`
  - lineHeight: `72px`
  - letterSpacing: `-4.32px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `0`
  - transform: `matrix(1, 0, 0, 1, 0, 60)`
  - objectFit: `fill`
- `.h5` - box `284×90`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `284px`
  - height: `89.5938px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `32px`
  - fontWeight: `600`
  - lineHeight: `44.8px`
  - letterSpacing: `-1.92px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`
- `.slide-creators-button-wrap` - box `192×48`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `191.875px`
  - height: `48px`
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
- `.left-arrow` - box `114×46`
  - display: `flex`
  - position: `absolute`
  - flexDirection: `row`
  - justifyContent: `flex-start`
  - alignItems: `center`
  - gap: `12px`
  - width: `114px`
  - height: `45.9375px`
  - minHeight: `0px`
  - padding: `10px 20px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `40px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - letterSpacing: `-0.32px`
  - color: `rgb(255, 255, 255)`
  - backgroundColor: `rgb(255, 255, 255)`
  - borderRadius: `100px`
  - border: `1px solid rgba(0, 0, 0, 0.15)`
  - overflow: `hidden`
  - opacity: `0`
  - transform: `matrix(1, 0, 0, 1, 0, 60)`
  - zIndex: `3`
  - objectFit: `fill`
- `.right-arrow` - box `114×46`
  - display: `flex`
  - position: `absolute`
  - flexDirection: `row`
  - justifyContent: `flex-start`
  - alignItems: `center`
  - gap: `12px`
  - width: `114px`
  - height: `45.9375px`
  - minHeight: `0px`
  - padding: `10px 20px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `40px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - letterSpacing: `-0.32px`
  - color: `rgb(255, 255, 255)`
  - backgroundColor: `rgb(255, 255, 255)`
  - borderRadius: `100px`
  - border: `1px solid rgba(0, 0, 0, 0.15)`
  - overflow: `hidden`
  - opacity: `0`
  - transform: `matrix(1, 0, 0, 1, 0, 60)`
  - zIndex: `4`
  - objectFit: `fill`

## Verbatim text content

- Our Services
- Creator Solutions
- Tiktok
- YouTube
- Short-Form Video Production
- Start a Project
- Followers
- Cool!
- Instagram
- Creator Partnerships
- Clients
- Let’s Collab
- Strategy
- Analytics
- Campaign Management
- End-to-end campaign execution including creator outreach, timelines, approvals, publishing, and performance reporting.
- Projects
- Prev
- Next

## Assets

- `/assets/home/_shared/arrow-1.svg`
- `/assets/home/_shared/ellipse-2469.svg`
- `/assets/home/_shared/contain-size-image-image-235.svg`
- `/assets/home/05-solutions-slider/contain-size-image-group-37388.svg`
- `/assets/home/_shared/long-arrow-alt-left-solid.svg`
- `/assets/home/_shared/long-arrow-alt-right-solid.svg`
- `/assets/home/05-solutions-slider/contain-size-image-group-37389.svg`
- `/assets/home/05-solutions-slider/contain-size-image-group-37390.svg`
- `/assets/home/05-solutions-slider/noodle-al-photoroom-1.avif`
- `/assets/home/05-solutions-slider/contain-size-image-image-235.avif`
- `/assets/home/05-solutions-slider/tknot-3-photoroom-1.avif`
- `/assets/home/05-solutions-slider/ring-al-photoroom-1.avif`
- `/assets/home/05-solutions-slider/frame-2147238602-1-p-500.avif`
- `/assets/home/05-solutions-slider/frame-2147238602-1.avif`
- `/assets/home/05-solutions-slider/frame-2147238602-p-500.avif`
- `/assets/home/05-solutions-slider/cover-size-image-frame-2147238602.avif`
- `/assets/home/05-solutions-slider/frame-2147238602-3-p-500.avif`
- `/assets/home/05-solutions-slider/frame-2147238602-3.avif`

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
