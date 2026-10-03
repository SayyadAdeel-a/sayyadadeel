# HeaderSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/HeaderSection.tsx`
- **Source element:** `<section class="header-section">`
- **Role:** Sticky brand bar and navigation
- **Interaction model:** click-driven (mobile menu)
- **Behaviour reference:** `BEHAVIORS.md §7 (button hover)`, `BEHAVIORS.md §8 (menu toggle)`, `BEHAVIORS.md §10 (w-nav)`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/header-section.html`

## DOM structure

```
<section .header-section>
  <div .navbar.w-nav>
    <div .nav-content-wrap>
      <div .container.w-container>
        <div .nav-inner>
          <a .nav-logo-link.w-nav-brand>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.navbar` - box `1440×76`
  - display: `block`
  - position: `absolute`
  - flexDirection: `row`
  - width: `1440px`
  - height: `76px`
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
  - zIndex: `800`
  - objectFit: `fill`
- `.nav-inner` - box `1360×66`
  - display: `flex`
  - position: `static`
  - flexDirection: `row`
  - justifyContent: `space-between`
  - alignItems: `center`
  - gap: `40px`
  - width: `1360px`
  - height: `66px`
  - minHeight: `0px`
  - padding: `8px 8px 8px 32px`
  - margin: `10px 0px 0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `16px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - letterSpacing: `-0.32px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgba(246, 246, 246, 0.4)`
  - borderRadius: `100px`
  - border: `1px solid rgb(255, 255, 255)`
  - boxShadow: `rgba(255, 255, 255, 0.6) 0px 0px 64px 0px inset`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`
- `.nav-link` - box `42×20`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `41.5156px`
  - height: `20px`
  - maxWidth: `100%`
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
- `.button-icon-box` - box `40×40`
  - display: `flex`
  - position: `static`
  - flexDirection: `row`
  - justifyContent: `center`
  - alignItems: `center`
  - width: `40px`
  - height: `40px`
  - padding: `14px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `18px`
  - fontWeight: `600`
  - lineHeight: `23.94px`
  - letterSpacing: `-0.36px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgb(0, 0, 0)`
  - borderRadius: `100px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `hidden`
  - opacity: `1`
  - objectFit: `fill`
- `.menu-button` - box `0×0`
  - position: `static`
  - flexDirection: `row`
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
- `.hamburger-line-top` - box `0×0`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
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

## Verbatim text content

- About
- Services
- Case Studies
- Blog
- Home
- Pricing
- Contact
- Schedule a Call

## Assets

- `/sites/relab-0c02b053/root-8a5edab2/6a97ffdf201d029d91db3ff5_relab.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a981fcef021f70122389ff5_Arrow_1.svg`

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
