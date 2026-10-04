# FooterSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/FooterSection.tsx`
- **Source element:** `<section class="footer-section">`
- **Role:** Footer with newsletter form
- **Interaction model:** link hover, demo form submit
- **Behaviour reference:** `BEHAVIORS.md §4`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/footer-section.html`

## DOM structure

```
<section .footer-section>
  <div .w-layout-blockcontainer.container>
    <div .footer-wrapper>
      <div .footer-wrap>
        <div .footer-top-text-wrapper>
          <div .footer-logo-wrap>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.footer-section` - box `1440×631`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1440px`
  - height: `631px`
  - minHeight: `0px`
  - padding: `0px 0px 24px`
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
- `.h4` - box `340×112`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `340px`
  - height: `112px`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `56px`
  - fontWeight: `600`
  - lineHeight: `56px`
  - letterSpacing: `-3.36px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`
- `.w-input` - box `300×56`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `300px`
  - height: `56px`
  - minHeight: `0px`
  - padding: `20px 52px 20px 20px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `14px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - color: `rgb(51, 51, 51)`
  - backgroundColor: `rgb(255, 255, 255)`
  - borderRadius: `100px`
  - border: `1px solid rgba(0, 0, 0, 0.15)`
  - overflow: `clip`
  - opacity: `1`
  - objectFit: `fill`
- `.w-button` - box `48×48`
  - display: `block`
  - position: `absolute`
  - flexDirection: `row`
  - width: `48px`
  - height: `48px`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `16px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - color: `rgb(255, 255, 255)`
  - backgroundColor: `rgb(56, 152, 236)`
  - borderRadius: `0px`
  - border: `0px none rgb(255, 255, 255)`
  - overflow: `clip`
  - opacity: `0`
  - zIndex: `100`
  - objectFit: `fill`

## Verbatim text content

- Content That Drives Real Growth.
- Fill The Form
- Newsletter
- Thank you! Your submission has been received!
- Oops! Something went wrong while submitting the form.
- Contact
- hello@relabstudio.com
- +1 (415) 902 3814
- Links
- Home
- About
- Services
- Case Studies
- Blog
- Pricing
- Utility
- Style Guide
- License
- Changelog

## Assets

- `/assets/home/17-footer/frame-1.svg`
- `/assets/home/_shared/relab.svg`
- `/assets/home/_shared/arrow-1.svg`
- `/assets/home/17-footer/negative.svg`
- `/assets/home/17-footer/original.svg`
- `/assets/home/17-footer/original-2.svg`

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
