# TemplateButtons Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/TemplateButtons.tsx`
- **Source element:** `<div class="template-buttons-wrapper">`
- **Role:** Webflow marketplace promo overlay
- **Interaction model:** hover scale (Webflow-owned widget)
- **Behaviour reference:** `BEHAVIORS.md §11`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/template-buttons-wrapper.html`

## DOM structure

```
<div .template-buttons-wrapper>
  <a .template-promotional-button-wrap.w-inline-block>
    <div .all-access-hover-div>
      <div>
    <div .promotional-image-slider.w-slider>
      <div .w-slider-mask>
        <div .w-slide>
          <img .template-promotional-image>
        <div .w-slide>
          <img .template-promotional-image>
        <div .w-slide>
          <img .template-promotional-image>
        <div .w-slide>
          <img .template-promotional-image>
  <a .grab-now-button.w-inline-block>
    <div .grab-now-button-text-wrap>
      <div .promotional-button-text>
      <div .promotional-button-text>
    <div .grab-now-button-icon-wrap>
      <img .grab-now-button-icon>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.template-buttons-wrapper` - box `140×104`
  - display: `flex`
  - position: `fixed`
  - flexDirection: `column`
  - justifyContent: `center`
  - alignItems: `stretch`
  - gap: `8px`
  - width: `140px`
  - height: `104px`
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
  - zIndex: `10`
  - objectFit: `fill`
- `.promotional-button-text` - box `72×18`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `72.1406px`
  - height: `18px`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Hanken Grotesk", sans-serif`
  - fontSize: `14px`
  - fontWeight: `500`
  - lineHeight: `17.9998px`
  - letterSpacing: `-0.32px`
  - color: `rgb(255, 255, 255)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgb(255, 255, 255)`
  - overflow: `visible`
  - opacity: `1`
  - transform: `matrix(1, 0, 0, 1, 0, -18)`
  - objectFit: `fill`

## Verbatim text content

- waidastudio.com
- Grab Now
- Buy For $99

## Assets

- `/sites/relab-0c02b053/root-8a5edab2/6abde47d789ae43102faecb8_thunder.png`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecb2_Slide_207-p-1080.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecb2_Slide_207-p-1600.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecb2_Slide_207-p-500.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecb2_Slide_207-p-800.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecb2_Slide_7.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecbe_Slide_206-p-1080.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecbe_Slide_206-p-1600.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecbe_Slide_206-p-500.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecbe_Slide_206-p-800.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecbe_Slide_6.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecc7_Slide_208-p-1080.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecc7_Slide_208-p-1600.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecc7_Slide_208-p-500.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecc7_Slide_208-p-800.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecc7_Slide_8.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecd0_Slide_205-p-1080.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecd0_Slide_205-p-1600.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecd0_Slide_205-p-500.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecd0_Slide_205-p-800.webp`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6abde47d789ae43102faecd0_Slide_5.webp`

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
