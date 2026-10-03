# Behaviour Bible — Relab Webflow Template

Complete inventory of everything that moves, changes or reacts on the page, and
how each is reproduced in the clone.

Source of truth: the Webflow IX (ix3) payload decoded into `webflow-ix2.json`
(human-readable dump in `IX2-READABLE.md`), the inline scripts in
`scripts-inline/`, and Webflow's own widget runtimes (`w-nav`, `w-slider`,
`w-tabs`, `w-background-video`).

Webflow's breakpoint names are `main` (≥992 px), `medium`, `small` and `tiny`.
`conditionalPlayback: dont-animate` entries are honoured in the clone with an
explicit 992 px check (`gsap.matchMedia`).

Default easing: Webflow's IX engine applies GSAP **`power1.out`** to every
timeline tween that declares none. This was verified empirically against the
live site (see `style-report-*.txt` and the `creatorsMid` behaviour probe).

---

## 1. Smooth scrolling — Lenis

| | |
| --- | --- |
| Library | `lenis@1.1.14` |
| Options | `{ lerp: 0.08 }` |
| Loop | `lenis.raf(time)` inside a `requestAnimationFrame` loop |
| Stylesheet | `lenis@1.1.14/dist/lenis.css`, inlined in `app/globals.css` |

Implementation: `components/SmoothScrollProvider.tsx`.

---

## 2. Global load animations (`wf:load`)

All are infinite ambient loops; the clone uses `gsap.fromTo(..., { repeat: -1 })`.

| Timeline | Targets | From → To | Duration | Extra |
| --- | --- | --- | --- | --- |
| `t-b6a25db9` | `[contain-left-move-child="ture"]` | `y: 0 → 40px` | 4 s | yoyo |
| | `[contain-right-move-child="ture"]` | `y: 0 → -40px` | 4 s | yoyo |
| | `[love-child="ture"]` | `scale: 0.8 → 1` | 1.8 s | yoyo |
| | `[text-box-child="ture"]` | `rotation: 7deg → 0deg` | 4 s | yoyo |
| `t-0e4da051` | `[marku-slide="ture"]` | `xPercent: 0 → -100` | 18 s | linear marquee |
| `t-0552a309` | `[move-opacty="ture"]` | `opacity 1→0`, `scale 1→0.5` | 2 s | yoyo |
| `t-ece8992f` | `[group-fast-move="ture"]` | `scale: 0.7 → 1` | 3 s | yoyo |
| `t-54083a40` | `[group-secend-move="ture"]` | `scale: 1 → 0.7` | 3 s | yoyo |
| `t-41c4b10c` | `.agency-hero-image-wrap.one` | `rotation: 0 → 20deg` | 3 s | yoyo |
| | `.agency-hero-image-wrap.two` | `y: 0 → -20px` | 3 s | yoyo |
| `t-b1014af3` | `.hero-intro-meddle-bg-image` | `rotation: -360deg → 0deg` | 4 s | linear |
| `t-79a8569c` | `[zome-in-zom-out="ture"]` | `scale: 0.8 → 1.1` | 1.5 s | yoyo |
| `t-10e0cf06` | `[move-left-right="ture"]` | `x: 0 → 40px` | 3 s | yoyo |

`[group-fast-move]` and `[group-secend-move]` have no matching elements in the
published page; the clone guards for empty target sets, exactly as the engine
does.

---

## 3. Page intro reveal — `t-70ca57e5` (0.51 s total)

| At | Targets | From | To | Duration |
| --- | --- | --- | --- | --- |
| 0.00 | `.agency-hero-text-wrap` | `opacity 0, y 50px` | `1, 0` | 0.45 s |
| 0.16 | `.agency-dectlies-wrap` | `opacity 0, y 50px` | `1, 0` | 0.45 s |
| 0.26 | `.hero-intro-section` | `opacity 0, y 50px` | `1, 0` | 0.45 s |
| 0.36 | `[id="a60822b7-…"]` | `scale .5, opacity 0` | `1, 1` | 0.6 s |
| 0.36 | `[id="e7772b2d-…"]` | `scale .5, opacity 0` | `1, 1` | 0.4 s |
| 0.40 | `.bg-image-left-wrap` | `scale 0, opacity 0`, origin `0% 100%` | `1, 1` | 0.51 s |
| 0.40 | `.bg-image-right-wrap` | `scale 0, opacity 0`, origin `100% 0%` | `1, 1` | 0.51 s |

The two `wf:inst` targets do not exist in the published DOM (verified on the live
site), so those two sub-tweens are inert in both the reference and the clone.

---

## 4. Scroll reveals

All use `ScrollTrigger.batch` (one trigger per element) with
`start: "top 92%"`, playing once on enter — matching
`enter: "play", leave/enterBack/leaveBack: "none"`.

| Timeline | Targets | From | To | Duration |
| --- | --- | --- | --- | --- |
| `t-efff5d92` | `[group-fedup-move="ture"]` | `y 100px, opacity 0` | `0, 1` | 0.45 s |
| `t-84fe2684` | `[fade="true"]` | `opacity 0` | `1` | 0.45 s |
| `t-af1e2fb3` | `[fade-up="true"]` | `opacity 0, y 60px` | `1, 0` | 0.45 s |
| `t-75026cf0` | `[origin-fade-up="true"]` | `opacity 0, scale 0`, origin `100% 0%` | `1, 1` | 0.51 s |
| `t-ce7e5e84` | `[group-fedup-phone="ture"]` | `y 100px` | `0` | 0.7 s |

`t-ce7e5e84` (`start: "top bottom"`) carries
`conditionalPlayback: dont-animate` on the `main` breakpoint, so it only runs
**below 992 px** — where the sticky convergence is disabled.

---

## 5. Sticky creators convergence — `i-edb34fd9` / `t-47bfa973`

- Interaction: `wf:scroll`, `start: "top top"`, `end: "bottom bottom"`, `scrub: 0.8`, `clamp: true`.
- `conditionalPlayback`: `dont-animate` on `medium`/`small`/`tiny` → **desktop only**.
- Timeline (all at position 0, duration 1, default `power1.out`):

| Target | From | To |
| --- | --- | --- |
| `.box-one` | `translate(500px, 200px)` | `translate(100px, 0)` |
| `.box-two` | `translate(-500px, 200px)` | `translate(-100px, 0)` |
| `.box-three` | `translate(450px, -200px)` | `translate(200px, 0)` |
| `.box-four` | `translate(-500px, -150px)` | `translate(-200px, 0)` |

Verified: the clone's box positions match the reference to the pixel at eight
sample scroll positions across the section.

---

## 6. Capabilities title stack — `i-80217074` / `t-5bfbc4bc`

Scroll-driven (`start: "top bottom"`, `end: "bottom top"`, `clamp: true`,
scrub). Inside `[move-scroll-card-box="ture"]`:

| `.text-title-box` variant | From `y` |
| --- | --- |
| `.item-one` | `-100px` |
| `.item-two` | `-100px` |
| `.item-three` | `-150px` |
| `.item-four` | `-230px` |
| `.item-five` | `-230px` |

---

## 7. Hover interactions

| Interaction | Trigger | Target | Behaviour |
| --- | --- | --- | --- |
| `i-00a50fa3` | hover / `reverseFlipEase` (mouseleave) | `.text-button-normal-text` chars | `y 0% → -100%`, `scale 1 → 0.4`, 0.36 s, split by character |
| | | `.text-button-hover-text` chars | `y 0% → -100%`, `scale 0.4 → 1`, 0.36 s |
| `i-34e05c93` | hover / `reverseFlipEase` | `.button-normal-text` chars | two competing tweens, `y 0% → -100%` and `y 100% → 0%`, 0.25 s |
| | | `[button-icon-anin-one]` | `rotation 0 → 45deg`, 0.25 s |
| | | `[button-icon-anin-two]` | `rotation 0 → -45deg`, 0.25 s |
| `i-230919d6` | hover | `[card-image-hover-child="ture"]` | `scale 1 → 1.15`, 0.6 s |
| `i-07015591` | hover | `[hover-child="ture"]` | `scale 1 → 0.8`, 0.6 s |
| `i-fef9e431` | `wf:mouse-move`, resting state 50/50, smoothness 90 | `.icon.icon-button-icon` | `x -8px → 8px`, `y -8px → 8px`, 1 s, following the cursor |

**SplitText configuration.** Webflow's engine splits with
`type: "words,chars"`, `tag: "span"`, `wordsClass: "gsap_split_word++"`,
`charsClass: "gsap_split_letter++"` and then forces
`position: relative; display: inline-block` on every generated node. The clone
uses the identical configuration, which matters: without the inline-block word
wrappers the split label measures 0.86 px narrower than the reference.

---

## 8. Click interactions

| Interaction | Trigger | Behaviour |
| --- | --- | --- |
| `i-c8a0a373` / `t-a4a0eafc` | `.menu-button` | Navbar menu toggle. Shows `.nav-menu-wrap`, rotates `.hamburger-line-top` to `y 6px / 45deg`, `.hamburger-line-bottom` to `y -10px / -45deg`, hides `.hamburger-line-middle`, and reveals `.menu-wrapper` from `opacity 0 / y 50px`. |
| `i-e07f66d1` / `t-f2b5701b` | `.faq-toggle` | `.faq-toggle-content` `height 0 → auto` (0.35 s) and `.faq-item-icon` `rotation 0 → 225deg`. |
| `i-7c519911` / `t-0c724ebe` | `[accordion-item-title]` | `.accordion-item-body-wrapper` `height 0 → auto`, `.accordion-item-title-icon` `rotation → 180deg`. |
| `i-8181fa36` / `t-e78f85d1` | `[slider-click-btn="true"]` | `scale 1 → 0.9` for 0.2 s on press. |

---

## 9. Hero intro tabs (page-authored script, `scripts-inline/inline-09.js`)

Not a Webflow interaction — a hand-written script.

- **Interaction model:** click-driven tabs.
- The script injects three CSS rules (`.hero-intro-card-box { cursor: pointer }`,
  `.hero-intro-card-box.is-active { border-color: #000 !important }`,
  `.single-image-wrap.is-tab-hidden { visibility: hidden !important; pointer-events: none !important }`)
  — reproduced verbatim in `app/globals.css`.
- It removes the inline `height` from `.hero-intro-meddle-image-wrap`.
- Clicking `.hero-intro-card-box` at index *i*: outgoing image
  `opacity → 0, scale → 1.02` over 0.35 s `power2.inOut`; incoming image
  `opacity → 1, scale → 1` over 0.35 s `power2.out`, starting at
  `scale 0.97 / zIndex 3`; on completion the outgoing image is hidden and reset
  to `scale 1 / zIndex 1`, the incoming is left at `zIndex 2`.
- Card 0 is active on load.

---

## 10. Webflow widgets

### `.w-tabs` — "Trusted Brands"

`data-duration-in="300"`, `data-duration-out="100"`. Clicking a `.w-tab-link`
moves `w--current` to it and sets `w--tab-active` on the `.w-tab-pane` whose
`data-w-tab` matches, with `transition: all, opacity <n>ms` and
`opacity: 1 / 0`.

### `.w-slider` — three sliders on the page

| Slider | Slides | Duration | Easing | Autoplay | Infinite |
| --- | --- | --- | --- | --- | --- |
| `.services-slider` | 6 | 800 ms | `ease-out-cubic` → `cubic-bezier(.215,.61,.355,1)` | 1 s, limit 1 | yes |
| `.process-slider` | 3 | 500 ms | `ease` | no | yes |
| `.promotional-image-slider` (template bar) | 4 | — | — | no | yes |

The ix3 slider runtime writes, on **every** slide:

```
transition: all, transform <duration>ms <easing>;
transform: translateX(-<index × stride>px);
opacity: 1;
```

where `stride = slide width + slide margins`. Navigation dots are generated at
runtime (`w-slider-dot`, `aria-pressed`, `role="button"`, `data-wf-ignore`,
`data-nav-spacing` margins); the nav also gains `role="region"` and
`aria-label="carousel"`. Swipe/drag is enabled (`data-disable-swipe="false"`).

### `.w-background-video` — Meet section

Autoplaying, looping, muted `playsInline` video with the poster as
`background-image`, plus a play/pause button that toggles the `.play-state` /
`.pause-state` icons.

### `.w-nav` — Header

`data-collapse="medium"`: the menu button is hidden above 992 px and the
`.nav-menu-wrap` dropdown is only interactive below that breakpoint.

---

## 11. The Webflow marketplace bar

`.template-buttons-wrapper` is Webflow's own marketplace promo injected into
every published template. Its markup is cloned verbatim, including its hover
scale (`scale 1 → 0.8`). The promo **copy and thumbnail rotate** server-side on
Webflow's side (the live site served "304+ Templates" during one capture and
"All-Access Bundle" during another), so that one widget cannot be matched
pixel-for-pixel by any static clone. Structure, position, size and styling match.