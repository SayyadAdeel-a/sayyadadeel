# PricingSection Specification

## Overview

- **Target file:** `src/components/sites/relab-0c02b053/root-8a5edab2/PricingSection.tsx`
- **Source element:** `<section class="pricing-section">`
- **Role:** Three pricing tiers
- **Interaction model:** scroll reveal + button hover
- **Behaviour reference:** `BEHAVIORS.md §4`, `BEHAVIORS.md §7`
- **Reference markup:** `docs/research/relab-0c02b053/root-8a5edab2/sections/pricing-section.html`

## DOM structure

```
<section .pricing-section>
  <div .w-layout-blockcontainer.container>
    <div .pricing-wrapper>
      <div .pricing-wrap>
        <div .campaign-packages-header-wrap>
          <div .section-labbal-text-wrap>
```

## Computed styles measured on the reference

Probed at 1440x900 after the page settled.

- `.pricing-section` - box `1440×782`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `1440px`
  - height: `782.281px`
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
- `.pricing-card-box` - not present
- `.pricing-card-text-wrap` - not present
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
- `.section-label` - box `132×36`
  - display: `flex`
  - position: `static`
  - flexDirection: `row`
  - justifyContent: `flex-start`
  - alignItems: `center`
  - gap: `8px`
  - width: `132.484px`
  - height: `35.9375px`
  - maxWidth: `100%`
  - minHeight: `0px`
  - padding: `5px 11px`
  - margin: `0px`
  - fontFamily: `"Inter Tight", sans-serif`
  - fontSize: `18px`
  - fontWeight: `600`
  - lineHeight: `23.94px`
  - letterSpacing: `-0.36px`
  - color: `rgba(0, 0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `100px`
  - border: `1px solid rgb(0, 0, 0)`
  - overflow: `visible`
  - opacity: `1`
  - objectFit: `fill`
- `.text-icon` - box `0×0`
  - display: `block`
  - position: `static`
  - flexDirection: `row`
  - width: `0px`
  - height: `0px`
  - maxWidth: `100%`
  - minHeight: `0px`
  - padding: `0px`
  - margin: `0px`
  - fontFamily: `"Inter Tight", sans-serif`
  - fontSize: `18px`
  - fontWeight: `600`
  - lineHeight: `23.94px`
  - letterSpacing: `-0.36px`
  - color: `rgba(0, 0, 0, 0)`
  - backgroundColor: `rgba(0, 0, 0, 0)`
  - borderRadius: `0px`
  - border: `0px none rgba(0, 0, 0, 0)`
  - overflow: `clip`
  - opacity: `0.7399`
  - transform: `matrix(0.87, 0, 0, 0.87, 0, 0)`
  - objectFit: `fill`

## Verbatim text content

- Pricing Plans
- Find The Right
- Campaign
- Starter Campaign
- $2,500
- /campaign
- What&#x27;s included
- Creator sourcing (3–5 creators)
- 3–5 vetted creators
- Campaign strategy
- Creative brief
- Content coordination
- Performance report
- Start a Project
- Growth Campaign
- $5,000
- Everything in Starter
- 10–15 creators
- TikTok, Instagram YouTube
- Campaign management
- Weekly reporting
- Content optimization
- Enterprise Partner
- Custom
- Unlimited creator sourcing
- Dedicated account manager
- Full campaign strategy
- Paid media support
- Advanced analytics
- Priority support

## Assets

- `/assets/home/_shared/ellipse-2469.svg`
- `/assets/home/13-pricing/plus-solid.svg`
- `/assets/home/13-pricing/arrow-1.svg`

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
