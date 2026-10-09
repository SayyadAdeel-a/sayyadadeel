# WorkedSection Specification

## Overview

- **Target file:** `src/components/sites/adeel-site/root-8a5edab2/WorkedSection.tsx`
- **Source element:** `<section class="worked-section">`
- **Role:** Creator community image marquee
- **Interaction model:** infinite marquee
- **Behaviour reference:** `BEHAVIORS.md §2`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/worked-section.html`

## DOM structure

```
<section .worked-section>
  <div .worked-text-name-wrap>
    <h2 .h2>
      <br>
  <div .worked-image-text-wrapper>
    <div .big-text-wrap>
      <div .big-text>
    <div .worked-image-wrapper>
      <div .worked-image-wrap>
        <div .worked-image-box.worked-image-one>
          <img .cover-size-image>
        <div .worked-image-box.worked-image-two>
          <img .cover-size-image>
        <div .worked-image-box.worked-image-three>
          <img .cover-size-image>
        <div .worked-image-box.worked-image-four>
          <img .cover-size-image>
      <div .worked-image-wrap>
        <div .worked-image-box.worked-image-one>
          <img .cover-size-image>
        <div .worked-image-box.worked-image-two>
          <img .cover-size-image>
        <div .worked-image-box.worked-image-three>
          <img .cover-size-image>
        <div .worked-image-box.worked-image-four>
          <img .cover-size-image>
      <div .worked-image-wrap>
        <div .worked-image-box.worked-image-one>
          <img .cover-size-image>
        <div .worked-image-box.worked-image-two>
          <img .cover-size-image>
        <div .worked-image-box.worked-image-three>
          <img .cover-size-image>
        <div .worked-image-box.worked-image-four>
          <img .cover-size-image>
    <div .text-dectli-wrap>
      <div .worked-text-dectlies-wrap>
        <div .text-medium.rbg10>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.worked-section` - box `1392×772`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1392px`
  - height: `772.219px`
  - minHeight: `0px`
  - padding: `120px 0px`
  - margin: `0px 24px`
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
- `.worked-image-wrap` - box `36×0`
  - display: `flex`
  - position: `static`
  - flexDirection: `row`
  - justifyContent: `flex-start`
  - alignItems: `flex-start`
  - gap: `12px`
  - gridTemplateColumns: `1fr 1fr 1fr 1fr`
  - width: `36px`
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
  - borderRadius: `0px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - transform: `matrix(1, 0, 0, 1, -10.04, 0)`
  - objectFit: `fill`
- `.worked-image-box` - box `0×0`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `0px`
  - height: `0px`
  - maxWidth: `330px`
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
  - transform: `matrix(1, 0, 0, 1, 0, 130)`
  - objectFit: `fill`

## Verbatim text content

- Creator
- Community
- listen($)

## Assets

- `/assets/home/12-worked/image-2042-1-p-500.avif`
- `/assets/home/12-worked/image-2042-1.avif`
- `/assets/home/12-worked/image-2042-p-500.avif`
- `/assets/home/12-worked/cover-size-image-image-2042.avif`
- `/assets/home/12-worked/image-2040-p-500.avif`
- `/assets/home/12-worked/cover-size-image-image-2040.avif`
- `/assets/home/12-worked/image-2043-p-500.avif`
- `/assets/home/12-worked/cover-size-image-image-2043.avif`

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
