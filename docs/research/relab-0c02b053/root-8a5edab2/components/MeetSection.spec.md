# MeetSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/MeetSection.tsx`
- **Source element:** `<section class="meet-section">`
- **Role:** Video showcase
- **Interaction model:** autoplay video + play/pause control
- **Behaviour reference:** `BEHAVIORS.md §10 (w-background-video)`, `BEHAVIORS.md §2`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/meet-section.html`

## DOM structure

```
<section .meet-section>
  <div .w-layout-blockcontainer.container>
    <div .meet-wrapper>
      <div .meet-wrap>
        <div .meet-header-wrap>
          <div .hero-intro-left-wrap>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.meet-section` - box `1440×1503`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1440px`
  - height: `1503.25px`
  - minHeight: `0px`
  - padding: `0px 0px 120px`
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
- `.h6` - box `129×24`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `128.516px`
  - height: `24px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `24px`
  - fontWeight: `600`
  - lineHeight: `24px`
  - letterSpacing: `-0.96px`
  - color: `rgb(0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`
- `.background-video` - box `364×564`
  - display: `block`
  - position: `relative`
  - flexDirection: `row`
  - width: `364px`
  - height: `564px`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `16px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - letterSpacing: `-0.32px`
  - color: `rgb(255, 255, 255)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgb(255, 255, 255)`
  - overflow: `hidden`
  - opacity: `1`
  - objectFit: `fill`
- `.background-video-wrap` - box `364×564`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `364px`
  - height: `564px`
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
  - objectFit: `fill`
- `.play-pause-button` - box `46×46`
  - display: `block`
  - position: `absolute`
  - flexDirection: `row`
  - width: `46px`
  - height: `46px`
  - minHeight: `0px`
  - padding: `12px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `16px`
  - fontWeight: `400`
  - lineHeight: `20px`
  - color: `rgb(255, 255, 255)`
  - backgroundColor: `rgb(0, 0, 0)`
  - borderRadius: `100%`
  - border: `0px none rgb(255, 255, 255)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`

## Verbatim text content

- 1B+
- We transform creator content into platform-optimized videos for social.
- Views Generated
- Trusted by
- 80+ Influencers
- UGC Videos
- Product Reviews
- Day In Life

## Assets

- `/assets/home/06-meet/6194923-uhd-2160-3840-25fps-mp4.mp4`
- `/assets/home/06-meet/6194923-uhd-2160-3840-25fps-poster.0000000.jpg`
- `/assets/home/06-meet/6194923-uhd-2160-3840-25fps-poster.0000000.jpg\`
- `/assets/home/06-meet/6194923-uhd-2160-3840-25fps-webm.webm`
- `/assets/home/_shared/contain-size-image-image-278.svg`
- `/assets/home/_shared/donut-al.avif`
- `/assets/home/06-meet/pause-1006-svgrepo-com-1.svg`
- `/assets/home/06-meet/play-1003-svgrepo-com-1.svg`
- `/assets/home/06-meet/video.svg`
- `/assets/home/06-meet/contain-size-image-image.svg`
- `/assets/home/06-meet/audio.svg`
- `/assets/home/06-meet/image-2038-p-500.avif`
- `/assets/home/06-meet/cover-size-image-image-2038.avif`
- `/assets/home/06-meet/image-19280-p-500.avif`
- `/assets/home/06-meet/cover-size-image-image-19280.avif`
- `/assets/home/06-meet/image-19279-p-500.avif`
- `/assets/home/06-meet/cover-size-image-image-19279.avif`
- `/assets/home/06-meet/image-2070-1-p-500.avif`
- `/assets/home/06-meet/image-2070-1.avif`
- `/assets/home/06-meet/10px-flip-white-p-500.avif`
- `/assets/home/06-meet/10px-flip-white.avif`
- `/assets/home/_shared/object-4-p-500.avif`
- `/assets/home/_shared/object-4.avif`

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
