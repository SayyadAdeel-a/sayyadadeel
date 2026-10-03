# OurCreatorsSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/OurCreatorsSection.tsx`
- **Source element:** `<section class="our-creators-section">`
- **Role:** Sticky scroll-driven creator cards
- **Interaction model:** scroll-driven (scrubbed convergence)
- **Behaviour reference:** `BEHAVIORS.md §5`, `BEHAVIORS.md §4`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/our-creators-section.html`

## DOM structure

```
<section .our-creators-section>
  <div .our-creators-sticky>
    <div .w-layout-blockcontainer.container>
      <div .our-creators-all-box>
        <div .our-creators-text-wrap>
          <h2 .h2>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.our-creators-section` - box `1440×2250`
  - display: `block`
  - position: `relative`
  - flexDirection: `row`
  - width: `1440px`
  - height: `2250px`
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
  - opacity: `0`
  - transform: `matrix(1, 0, 0, 1, 0, 0)`
  - objectFit: `fill`
- `.our-creators-sticky` - box `1440×900`
  - display: `flex`
  - position: `sticky`
  - flexDirection: `row`
  - justifyContent: `center`
  - alignItems: `center`
  - width: `1440px`
  - height: `900px`
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
- `.box-one` - box `648×312`
  - display: `block`
  - position: `relative`
  - flexDirection: `row`
  - width: `648px`
  - height: `312px`
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
  - transform: `matrix(1, 0, 0, 1, 500, 200)`
  - zIndex: `4`
  - objectFit: `fill`
- `.our-creators-box` - box `648×300`
  - display: `flex`
  - position: `relative`
  - flexDirection: `row`
  - justifyContent: `flex-start`
  - alignItems: `flex-start`
  - width: `648px`
  - height: `300px`
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
- `.our-creators-bg-image-wrap` - box `1360×916`
  - display: `block`
  - position: `absolute`
  - flexDirection: `row`
  - width: `1360px`
  - height: `916px`
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
  - borderRadius: `48px`
  - border: `0px none rgb(0, 0, 0)`
  - overflow: `hidden`
  - opacity: `1`
  - zIndex: `-1`
  - objectFit: `fill`

## Verbatim text content

- Creators
- For Every Brand
- travel
- beauty
- technology
- lifestyle

## Assets

- `/sites/relab-0c02b053/root-8a5edab2/6a9bf1cf4b05f6e1007fb9d8_laptop-code-solid.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a9bf1cf9e9b0b12e670e5a2_magic-solid.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a9bf1cfc4f250946c6faa4a_plane-departure-solid.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a9bf1cfde67bdefa6c21c63_coffee-solid.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6aacba1252be1b17f0f609a1_Vector__5_.svg`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbd5708df2512c96e85ab_Muti-BG-Image-p-1080.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbd5708df2512c96e85ab_Muti-BG-Image-p-1600.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbd5708df2512c96e85ab_Muti-BG-Image-p-2000.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbd5708df2512c96e85ab_Muti-BG-Image-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbd5708df2512c96e85ab_Muti-BG-Image-p-800.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbd5708df2512c96e85ab_Muti-BG-Image.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbef929b487b08266110d_image_2070-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbef929b487b08266110d_image_2070.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbef9438c66dfaba1179c_Rectangle_1727-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbef9438c66dfaba1179c_Rectangle_1727.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbefa7e5bcf9a2f383211_image_19278-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbefa7e5bcf9a2f383211_image_19278.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbefb3fdfdc7b3059f77e_2b8e97ce3ee27275770f618478fb035b_image_2037-p-1080.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbefb3fdfdc7b3059f77e_2b8e97ce3ee27275770f618478fb035b_image_2037-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbefb3fdfdc7b3059f77e_2b8e97ce3ee27275770f618478fb035b_image_2037-p-800.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6a9bbefb3fdfdc7b3059f77e_2b8e97ce3ee27275770f618478fb035b_image_2037.avif`

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
