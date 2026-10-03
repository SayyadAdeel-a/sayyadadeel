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

- `/sites/relab-0c02b053/root-8a5edab2/6a97e757adfa59f93a89009c_6a9d14081c9ddcceb78cfdf6_6194923-uhd_2160_3840_25fps_mp4.mp4`
- `/sites/relab-0c02b053/root-8a5edab2/6a97e757adfa59f93a89009c_6a9d14081c9ddcceb78cfdf6_6194923-uhd_2160_3840_25fps_poster.0000000.jpg`
- `/sites/relab-0c02b053/root-8a5edab2/6a97e757adfa59f93a89009c_6a9d14081c9ddcceb78cfdf6_6194923-uhd_2160_3840_25fps_poster.0000000.jpg\`
- `/sites/relab-0c02b053/root-8a5edab2/6a97e757adfa59f93a89009c_6a9d14081c9ddcceb78cfdf6_6194923-uhd_2160_3840_25fps_webm.webm`
- `/sites/relab-0c02b053/root-8a5edab2/6a9952da586a2d690f16ff9a_image_278.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a9d40178425ed54cd3199ac_5b8d29ed202f8fcf39f0a11139982243_donut_al.avif`
- `/sites/relab-0c02b053/root-8a5edab2/6a9d57c28ee8b6a8e9d0d750_pause-1006-svgrepo-com_1.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a9d57c2a3c413ee4bec3e71_play-1003-svgrepo-com_1.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6ab603f4190608bdb7bfd0b1_Video.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6ab603f4e1ecabf92771b4e1_Image.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6ab603f4e1ecabf92771b4e4_Audio.svg`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9d13f11c9ddcceb78cfb5e_image_2038-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9d13f11c9ddcceb78cfb5e_image_2038.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9d13f5babd2d89b51206c9_image_19280-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9d13f5babd2d89b51206c9_image_19280.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9d13f8fc68284afd3623b2_image_19279-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9d13f8fc68284afd3623b2_image_19279.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9d13fdc43fc4573e5b79ff_image_2070_1_-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9d13fdc43fc4573e5b79ff_image_2070_1_.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9d14b2a8bc9403cd5b8ae0_10px_Flip_White-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9d14b2a8bc9403cd5b8ae0_10px_Flip_White.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9d3fd4c1e7334b7e96e2bc_6eaf063adf651c42f459272b64839b71_object_4_-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9d3fd4c1e7334b7e96e2bc_6eaf063adf651c42f459272b64839b71_object_4_.avif`

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
