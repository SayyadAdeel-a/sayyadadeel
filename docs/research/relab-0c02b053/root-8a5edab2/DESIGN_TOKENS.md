# Design Tokens — Relab Webflow Template

All values are read from the reference's own stylesheet
(`relab-template.webflow.shared.0356be2f0.css`), which the clone imports
unmodified. The variables below are Webflow's design-token custom properties,
grouped for readability.

## Typography

| Role | Custom property | Value |
| --- | --- | --- |
| Body | `--_typography---font-family--body-font` | `"Hanken Grotesk", sans-serif` |
| Display / accent | `--_typography---font-family--headding-font` | `"Averia Sans Libre", sans-serif` |
| Secondary | `--_typography---font-family--third-font` | `"Inter Tight", sans-serif` |
| Tertiary | `--_typography---font-family--four-font` | `Geist, sans-serif` |

`app/globals.css` re-points those four custom properties at the `next/font`
families loaded in `app/layout.tsx` (same Google Fonts files, self-hosted), so
the clone renders with byte-identical font data. The Google Fonts weights the
page loads are:

- Averia Sans Libre 300, 400, 700
- Geist 400, 500, 600, 700, 800, 900
- Hanken Grotesk 400, 500, 600, 700, 800, 900
- Inter Tight 100–900

### Scale

| Token | Size | Line height | Weight | Tracking |
| --- | --- | --- | --- | --- |
| `--_typography---h1--font-size` | `clamp(60px, 7.5cqw, 112px)` | `.86em` | 600 | `--_typography---letter-spacing--larges` |
| `--_typography---h2--font-size` | `clamp(48px, 5.5cqw, 88px)` | `1em` | 600 | larges |
| `--_typography---h3--font-size` | `clamp(42px, 5cqw, 72px)` | `1em` | 600 | larges |
| `--_typography---h4--font-size` | `clamp(34px, 4.2cqw, 56px)` | `1em` | 600 | larges |
| `--_typography---h5--font-size` | `clamp(26px, 2.5cqw, 32px)` | `1.4em` | 600 | larges |
| `--_typography---h6--font-size` | `24px` | `1.25em` | 600 | large |
| `--_typography---text-medium--font-size` | `18px` | `1.33em` | 400 | default |
| `--_typography---text-default--font-size` | `16px` | `1.25em` | 400 | default |

## Colour

| Token | Value | Use |
| --- | --- | --- |
| `--color--body` | `#eee` | Page background |
| `--color--black` | `#000` | Text |
| `--color--white` | `#fff` | Cards |
| `--rgb--rgb-8` | `#000000b3` | Muted text |
| `--rgb--rgb-10` | `#00000080` | Faint text |
| `--rgb--rgb-5` | `#ffffffb3` | Inverse muted |
| `--accent-color--accent-1` | `#575757` | Secondary surface |
| `--accent-color--accent-2` | `#f2f2f2` | Tertiary surface |

Category accents found in the design: yellow `#FFD829`, lime `#BAFC31`,
aqua `#31FCEB`, orange `#FB8626`. Dark surfaces (footer, CTA cards):
`#1B1B1B` and `#000`.

## Spacing

`--_responsive---element-spacing--spacing-1x` = 4 px, stepping by 4 px to
`spacing-28x` = 112 px. Section padding uses
`--_responsive---section-padding--xlarge` = 140 px and
`--_responsive---section-padding--medium`.

## Radii

- Pills / badges / buttons: `9999px`
- Cards: 16–24 px (`--_responsive---border-radius--radius-13x` … `radius-14x`)
- Large containers: 24–32 px

## Layout

| Token | Value |
| --- | --- |
| `--_responsive---container--max-width` | `1472px` |
| `--_responsive---container--padding-x` | `40px` |
| `--_responsive---full-size` | `100%` |

## Breakpoints

| Name | Range |
| --- | --- |
| `main` (default) | ≥ 992 px |
| `medium` | 768–991 px |
| `small` | ≤ 767 px |
| `tiny` | ≤ 479 px |

The stylesheet also contains `min-width: 1280px` refinements (for example
`.meet-creators-wrapper { max-width: 1140px; margin-inline: auto }`).
Webflow's IX engine only knows the four names above, which is why the clone gates
animation behaviour on the 992 px boundary.

## Animation

- Default timeline ease: GSAP `power1.out` (verified against the live site).
- Interactive transitions: `power1.out`, `0.2 s` – `0.36 s`.
- Hero tab switch: `power2.inOut` / `power2.out`, `0.35 s` (page-authored).
- Slider: CSS transition on `transform`, `data-duration` ms, eased per `data-easing`.
- Smooth scroll: Lenis `lerp: 0.08`.
- Scroll scrub: `0.8` for the creators convergence, `true` for the capabilities title stack.