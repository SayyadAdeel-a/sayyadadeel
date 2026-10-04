# HeroSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/HeroSection.tsx`
- **Source element:** `<section class="hero-section">`
- **Role:** Display hero
- **Interaction model:** load reveal + infinite ambient loops
- **Behaviour reference:** `BEHAVIORS.md §2`, `BEHAVIORS.md §3`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/hero-section.html`

## DOM structure

```
<section .hero-section>
  <div .w-layout-blockcontainer.container>
    <div .hero-wrapper>
      <div .agency-hero-text-wrap>
        <div .agency-hero-fast-text-wrap>
          <div .agency-hero-image-wrap.one>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.hero-section` - box `1440×572`
  - display: `block`
  - position: `relative`
  - flexDirection: `row`
  - width: `1440px`
  - height: `571.875px`
  - minHeight: `0px`
  - padding: `140px 0px 0px`
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
- `.hero-wrapper` - box `1360×432`
  - display: `flex`
  - position: `relative`
  - flexDirection: `column`
  - justifyContent: `flex-start`
  - alignItems: `center`
  - gap: `30px`
  - width: `1360px`
  - height: `431.875px`
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
- `.agency-hero-text-wrap` - box `950×362`
  - display: `flex`
  - position: `static`
  - flexDirection: `column`
  - gap: `16px`
  - width: `950px`
  - height: `361.875px`
  - maxWidth: `950px`
  - padding: `0px`
  - margin: `0px 205px`
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
  - transform: `matrix(1, 0, 0, 1, 0, 0)`
  - objectFit: `fill`
- `.h1` - box `428×93`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `428.234px`
  - height: `92.875px`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `108px`
  - fontWeight: `600`
  - lineHeight: `92.88px`
  - letterSpacing: `-6.48px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`
- `.text-default` - box `124×40`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `123.594px`
  - height: `40px`
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
- `.agency-dectlies-wrap` - box `524×40`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `524px`
  - height: `40px`
  - maxWidth: `524px`
  - padding: `0px`
  - margin: `0px 418px`
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
  - transform: `matrix(1, 0, 0, 1, 0, 0)`
  - objectFit: `fill`
- `.bg-image` - box `246×211`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `246px`
  - height: `210.844px`
  - maxWidth: `100%`
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
  - overflow: `clip`
  - opacity: `1`
  - objectFit: `cover`
- `.hero-bg-image-wrap` - box `1440×572`
  - display: `block`
  - position: `absolute`
  - flexDirection: `row`
  - width: `1440px`
  - height: `571.875px`
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
  - zIndex: `-1`
  - objectFit: `fill`

## Verbatim text content

- Influencer
- Short Video
- ® Est in 2023 -
- Based in Montreal
- agency
- Trusted by
- 80+ Influencers

## Assets

- `/assets/home/02-hero/grid-1.svg`
- `/assets/home/_shared/contain-size-image-image-278.svg`
- `/assets/home/02-hero/contain-size-image-image-297.svg`
- `/assets/home/02-hero/vector-4.svg`
- `/assets/home/02-hero/vector-3.svg`

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
