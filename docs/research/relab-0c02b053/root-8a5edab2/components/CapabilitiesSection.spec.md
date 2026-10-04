# CapabilitiesSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/CapabilitiesSection.tsx`
- **Source element:** `<section class="capabilities-section">`
- **Role:** Capability list with scroll-driven title stack
- **Interaction model:** scroll-driven title stack
- **Behaviour reference:** `BEHAVIORS.md §6`, `BEHAVIORS.md §4`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/capabilities-section.html`

## DOM structure

```
<section .capabilities-section>
  <div .w-layout-blockcontainer.container>
    <div .capabilities-wrapper>
      <div .capabilities-wrap>
        <div .capabilities-text-wrapper>
          <div .section-labbal-text-wrap>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.capabilities-section` - box `1440×1082`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1440px`
  - height: `1082.34px`
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
- `.our-work-image-wrap` - box `508×0`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `508px`
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
  - borderRadius: `32px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `hidden`
  - opacity: `1`
  - transform: `matrix(1, 0, 0, 1, 0, 0)`
  - objectFit: `fill`
- `.our-work-text-wrap` - box `508×175`
  - display: `flex`
  - position: `absolute`
  - flexDirection: `column`
  - gap: `10px`
  - width: `508px`
  - height: `174.797px`
  - minHeight: `0px`
  - padding: `40px`
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
  - zIndex: `20`
  - objectFit: `fill`
- `.text-title-box` - box `159×34`
  - display: `flex`
  - position: `static`
  - flexDirection: `row`
  - justifyContent: `center`
  - alignItems: `center`
  - width: `158.688px`
  - height: `34px`
  - padding: `6px 10px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `16px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - letterSpacing: `-0.32px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgb(255, 255, 255)`
  - borderRadius: `100px`
  - border: `1px solid rgba(0, 0, 0, 0.15)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`

## Verbatim text content

- Creative Capabilities
- Content That Converts Audiences
- Creator-Led Content
- Authentic short-form videos created by creators your audience already trusts.
- UGC Videos
- Product Reviews
- Unboxing
- Day In Life
- GRWM
- Awareness
- Conversions
- Engagement
- Product Launch
- Community
- Campaign Strategy
- We build campaigns around your goals—from awareness to conversions.

## Assets

- `/assets/home/_shared/ellipse-2469.svg`
- `/assets/home/08-capabilities/frame-2147262240-1.svg`
- `/assets/home/08-capabilities/cover-size-image-frame-2147262414.avif`
- `/assets/home/08-capabilities/cover-size-image-frame-2147262416.avif`

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
