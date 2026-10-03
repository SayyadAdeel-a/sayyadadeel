# Visual QA Report — Relab Clone

Every number below was produced by a script in `scripts/` against the live
reference (`https://relab-template.webflow.io/`) and the production build of the
clone (`npm run build && next start --port 3100`). Nothing here is estimated.

Reproduce with:

```bash
node scripts/rebuild.mjs
node scripts/compare-dom-shape.mjs 1440 900
node scripts/compare-dom.mjs --width=1440 --height=900 --static
node scripts/compare-styles.mjs --width=1440
node scripts/compare-behavior.mjs --width=1440
node scripts/compare-images.mjs 1440 900
node scripts/compare.mjs --width=1440 --height=900 --full
node scripts/diff-images.mjs <ref-full.png> <clone-full.png>
```

---

## 1. DOM structure

`compare-dom-shape.mjs` walks both trees and compares structural paths.

| Viewport | Reference nodes | Clone nodes | Only in reference | Only in clone |
| --- | --- | --- | --- | --- |
| 390×844 | 1588 | 1588 | 0 | 0 |
| 1440×900 | 1691 | 1691 | 0 | 0 |

Getting here required reproducing three pieces of DOM that Webflow's runtime
injects at load, which the static HTML does not contain:

- `<div class="w-slider-aria-label" aria-live="off" aria-atomic="true" data-wf-ignore>` inside every slider mask, plus `id="w-slider-mask-N"` on the mask itself.
- `id="w-tabs-0-data-w-tab-N"` on tab links and `id="w-tabs-0-data-w-pane-N"` on panes.
- `role="region" aria-label="carousel"` on every `.w-slider`.

## 2. Geometry

`compare-dom.mjs` compares the bounding box of every rendered element.
Elements inside a GSAP-animated subtree are excluded (their position depends on
the animation phase; §4 covers those).

| Viewport | Elements | Box mismatches > 1 px |
| --- | --- | --- |
| 1440×900 | 1836 | **0** |
| 768×1024 | 1799 | **0** |
| 390×844 | 1710 | **0** |

Document height:

| Viewport | Reference | Clone |
| --- | --- | --- |
| 1440×900 | 14368 px | 14368 px |
| 768×1024 | 16141 px | 16141 px |
| 390×844 | 14079 px | 14079 px |

## 3. Computed styles

`compare-styles.mjs` compares 214 selectors × 74 computed properties.

| Viewport | Reported differences |
| --- | --- |
| 1440×900 | 47 groups — all on GSAP-animated elements (phase) |
| 768×1024 | 38 groups — all on GSAP-animated elements |
| 390×844 | 34 groups — all on GSAP-animated elements |

No structural, colour, typography or spacing differences remain. The residual
groups are the ambient loops (hero image float, hero-intro ring rotation,
services slide decorations, `[move-opacty]` section icons, `[marku-slide]`
marquee) sampled at different points in their cycles.

Fixes found and applied during this pass:

| Issue | Fix |
| --- | --- |
| `&nbsp;` dropped by React's JSX transform | Decode entities in the converter, preserving U+00A0 |
| Trailing spaces before `<br>` stripped | Emit significant leading/trailing spaces as JSX string expressions |
| Split button labels measured 0.86 px narrow | Match Webflow's SplitText config (`words,chars`, span wrappers, `gsap_split_word++` / `gsap_split_letter++`, forced inline-block) |
| Sticky convergence ran below 992 px | Scope it to `gsap.matchMedia("(min-width: 992px)")`; the `dont-animate` breakpoint rule |
| Scroll reveals fired for the whole page at once | Use `ScrollTrigger.batch` so each element gets its own trigger |
| Converging cards were mis-positioned | Use a `fromTo` timeline with the ScrollTrigger rather than an `onUpdate` callback |
| Images served at the wrong intrinsic size | Download and serve all 83 `srcset` variants, keep `srcset`/`sizes` |

## 4. Behaviour parity

`compare-behavior.mjs` runs the same scripted interactions against both pages and
compares the resulting DOM state.

| Check | 1440 | 768 | 390 |
| --- | --- | --- | --- |
| Button hover: label transform | ✅ | — | — |
| Button hover: arrow rotation | ✅ | — | — |
| Button hover: split-character transform | ✅ | — | — |
| Hero intro tab switch | ✅ | ✅ | ✅ |
| Our-clients tab switch | ✅ | ✅ | ✅ |
| Services slider: next / prev | ✅ | ✅ | ✅ |
| Process slider | ✅ | ✅ | ✅ |
| Card image hover zoom | ✅ | ✅ | — |
| Hero intro badge hover | ✅ | — | — |
| Background video autoplay + play/pause | ✅ | ✅ | ✅ |
| Scroll reveals (before / after) | ✅ | ✅ | ✅ |
| Sticky convergence, mid-section | ✅ | ✅ | ✅ |
| Sticky convergence, end-of-section | ✅ | ✅ | ✅ |
| Infinite marquee is animating | ✅ | ✅ | ✅ |
| Mobile menu open / close | — | ✅ | ✅ |
| Console errors | ✅ | ✅ | ✅ |

**0 mismatches at all three breakpoints.**

Two behaviours were reverse-engineered from measurement rather than from the
extracted payload, because the payload alone was ambiguous:

- **Default easing.** Webflow's engine applies GSAP `power1.out` to timeline
  tweens that declare none. Verified by sampling the sticky convergence at eight
  scroll positions: the reference's progress curve fits `1 − (1−p)²` exactly,
  which is `power1.out`.
- **Button label roll.** `t-7b5113cd` drives `.button-normal-text` with two
  competing tweens on `y`. The reference's observable behaviour is that the
  label settles back at rest after a 0.25 s staggered roll, and the arrow icon
  rotates to 45°; the clone reproduces that by construction.

## 5. Image metadata

`compare-images.mjs` compares every `<img>`'s intrinsic size, rendered size,
`object-fit` and `sizes`.

200 images on both pages, **0 intrinsic-size differences**, and the only
`rendered` differences are the images inside GSAP-animated wrappers (phase).

## 6. Pixel diff

`compare.mjs` + `diff-images.mjs` over full-page captures.

| Viewport | Mean abs delta | Pixels differing > 64 (of 3 channels) |
| --- | --- | --- |
| 1440×14368 | 0.142 | 29 113 (0.141 %) |
| 768×16141 | 0.318 | 37 070 (0.299 %) |
| 390×14079 | 0.347 | 22 480 (0.409 %) |

Every band above 1 % difference sits in the hero / hero-intro band, where the
ambient loops run on independent clocks. See the `diff-full.png` masks.

## 7. Known, unavoidable differences

1. **Ambient animation phase.** Six infinite loops (hero image float, hero-intro
   ring rotation, services slide decorations, `[move-opacty]` section icons,
   `[love-child]`, `[marku-slide]` marquee) start when the page loads. Two
   separate browser sessions never reach the same phase, so a still screenshot
   taken at an arbitrary moment will always show those elements a few pixels
   apart. Scrolling the page makes them agree.
2. **Autoplaying video.** The Meet section video is a different frame in each
   capture.
3. **Webflow marketplace promo.** `.template-buttons-wrapper` is injected by
   Webflow into every published template. Its structure, position, size and
   styling match exactly, but its promo copy and thumbnail are fetched from
   Webflow and rotate server-side — the live site served "304+ Templates" during
   one capture and "All-Access Bundle" during another. No static clone can track
   that.
4. **Sub-pixel text rendering.** A ~1 px glyph offset remains in a few text runs
   inside the hero-intro cards at 390 px. The fonts, weights, tracking and layout
   boxes are identical (§2, §3); this is Chromium's rasteriser landing the same
   glyph run on a different sub-pixel boundary between sessions.

## 8. Build

```
npx tsc --noEmit        clean
npx eslint app src     clean
npm run build          ✓ Compiled successfully, 4 static routes
```

`npm run build` reports two routes: `/` (the clone) and `/_not-found`.