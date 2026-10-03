# InsightsIdeasSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/InsightsIdeasSection.tsx`
- **Source element:** `<section class="insights-ideas-section">`
- **Role:** Blog cards
- **Interaction model:** scroll reveal + image hover zoom
- **Behaviour reference:** `BEHAVIORS.md §4`, `BEHAVIORS.md §7`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/insights-ideas-section.html`

## DOM structure

```
<section .insights-ideas-section>
  <div .w-layout-blockcontainer.container>
    <div .insights-ideas-wrapper>
      <div .insights-ideas-wrap>
        <div .insights-ideas-left-wrapper>
          <div .insights-ideas-left-text-wrap>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.insights-ideas-section` - box `1440×576`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1440px`
  - height: `576px`
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
- `.blog-list-wrap` - not present
- `.blog-card-box` - not present

## Verbatim text content

- Blog
- Insights From The Creator Economy
- View All Posts
- Creator Strategy
- How To Work Viewers In The First 3 Seconds
- Influencer Marketing
- Choosing The Right KOCs For Your Next Campaign

## Assets

- `/sites/relab-0c02b053/root-8a5edab2/6a981fcef021f70122389ff5_Arrow_1.svg`
- `/sites/relab-0c02b053/root-8a5edab2/6a982a5cacb93b89817e14cf_Ellipse_2469.svg`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6aa63490df53d8544603abca_image_19269-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6aa63490df53d8544603abca_image_19269.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6aa634ac8a03456c2a490dc9_Frame_2147262476_2_-p-500.avif`
- `/sites/relab-0c02b053/root-8a5edab2/variants/6aa634ac8a03456c2a490dc9_Frame_2147262476_2_.avif`

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
