# OurClientsSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/OurClientsSection.tsx`
- **Source element:** `<section class="our-clients-section">`
- **Role:** Client testimonials in tabs
- **Interaction model:** click-driven tabs + scroll reveal
- **Behaviour reference:** `BEHAVIORS.md §10 (w-tabs)`, `BEHAVIORS.md §4`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/our-clients-section.html`

## DOM structure

```
<section .our-clients-section>
  <div .w-layout-blockcontainer.container>
    <div .our-clients-wrapper>
      <div .our-clients-wrap>
        <div .our-partners-text-wrapper>
          <div .our-partners-text-wrap>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.our-clients-section` - box `1440×840`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1440px`
  - height: `840.078px`
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
- `.display-01` - box `350×177`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `350px`
  - height: `177.125px`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Averia Sans Libre", sans-serif`
  - fontSize: `177.12px`
  - fontWeight: `700`
  - lineHeight: `177.12px`
  - letterSpacing: `-3.5424px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`
- `.tab-link` - box `78×36`
  - display: `flex`
  - position: `relative`
  - flexDirection: `row`
  - justifyContent: `center`
  - alignItems: `center`
  - width: `77.5625px`
  - height: `35.9375px`
  - maxWidth: `100%`
  - padding: `6px 12px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `18px`
  - fontWeight: `400`
  - lineHeight: `23.94px`
  - letterSpacing: `-0.36px`
  - color: `rgb(255, 255, 255)`
  - backgroundColor: `rgb(0, 0, 0)`
  - borderRadius: `100px`
  - border: `0px none rgb(255, 255, 255)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`
- `.tab-pane` - box `927×280`
  - display: `block`
  - position: `relative`
  - flexDirection: `row`
  - width: `927px`
  - height: `279.75px`
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
- `.text-medium` - box `44×24`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `44.2656px`
  - height: `23.9375px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `18px`
  - fontWeight: `400`
  - lineHeight: `23.94px`
  - letterSpacing: `-0.36px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`
- `.featured-brands-image-box` - box `223×80`
  - display: `flex`
  - position: `static`
  - flexDirection: `row`
  - justifyContent: `center`
  - alignItems: `center`
  - width: `222.75px`
  - height: `80px`
  - padding: `40px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `16px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - letterSpacing: `-0.32px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgb(229, 229, 229)`
  - borderRadius: `20px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`

## Verbatim text content

- Trusted Brands
- Schedule a Call
- Beauty
- Fashion
- Lifestyle
- Alex Carter
- Founder of
- relab
- The best campaigns bring together authentic creators, meaningful storytelling, and content audiences choose to watch.
- Virgil Caffier
- Great campaigns start with authentic voices, meaningful stories, and content that people love to engage with.
- Sanna Granqvist

## Assets

- `/sites/relab-0c02b053/root-8a5edab2/6a981fcef021f70122389ff5_Arrow_1.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a9e60ad3812883238ca791d_Logo__3_.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a9e60ad3812883238ca795d_Logo__2_.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a9e60add5457a941f52fe16_logo.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a9e60ade26234b20c2489a8_logo__1_.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a9e62ede26234b20c25a416_Ellipse_2468.avif`
- `/sites/relab-0c02b053/root-8a5edab2/6aa25a61e5426cd7f84f51c5_Ellipse_2468__1_.avif`
- `/sites/relab-0c02b053/root-8a5edab2/6aa25a61f4068703fc2b17c0_Ellipse_2468__3_.avif`

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
