# One-off research and diagnostic scripts

These are the throwaway probes written while reverse-engineering the reference
site and chasing individual parity bugs. They are kept because they are the
*evidence* behind the rules in
`../docs/research/relab-0c02b053/IX3-ENGINE.md` — each one pins down a single
behaviour by measuring it, so any claim in that document can be re-checked.

They are not part of the pipeline and nothing else imports them.

## Engine reverse-engineering

| Script | What it established |
| --- | --- |
| `ix-ease-table.mjs` | the numeric ease index → GSAP ease name table, read out of `EASING_NAMES` in the engine bundle |
| `ix-ease-usage.mjs` | windows of the bundle around `wf:transform`, `splitText`, `fromTo` — how a tween is actually constructed |
| `ix-conditional-probe.mjs` | `ConditionalPlaybackManager`, and that `dont-animate` means "jump to the end state", not "skip" |
| `ix-tt-probe.mjs` | `tt` is Webflow's `TweenType` (`0 to`, `1 from`, `2 fromTo`, `3 set`) |
| `ix-repeat-map.mjs` | `timelineDef.settings.repeat` is only ever `-1`, and only on `wf:load` interactions |
| `ix-timings.mjs` | every distinct `timing` object across the site |
| `ix-shape-probe.mjs` | `triggers[]` holds a **single** target tuple while `actions[].targets` is a **list** |
| `probe-gsap-set.mjs` | when a zero-duration `set()` renders, and that reversing a timeline only restores it if the timeline has a sibling tween |
| `probe-gsap-opacity.mjs` | `gsap.from(el, { opacity: "0%" })` lands on `0.001111`, not `1` — which is why the engine normalises the value |

## Route discovery

| Script | What it established |
| --- | --- |
| `find-channel-logo.mjs` | there is no `/channel-logo` route, and no page contains "channel logo" content |
| `compare-shell.mjs` | the repeated header/cta/footer sections differ **only** by their `aria-current` markers, which is what makes three shared components exact |

## Parity bug probes

| Script | Bug it pinned down |
| --- | --- |
| `probe-reference-runtime.mjs` | the SplitText class names Webflow generates, the inline styles the engine writes at load, and the slider/tabs DOM it stamps |
| `probe-reference-menu.mjs` | the navigation menu's exact closed / open / closed inline state |
| `probe-menu-timing.mjs` | the menu timeline's progress curve, sampled against the reference |
| `probe-clone-menu.mjs` | that the clone's menu was not responding to clicks at all |
| `probe-tabs.mjs` | that the `w-tabs` runtime never writes `data-current` and clears the outgoing pane's inline styles |
| `probe-icon-targets.mjs` | that `[icon-btn-anim]` is a `wf:attribute` trigger, not `wf:inst` |
| `probe-icon-and-form.mjs` | the cursor-tracked icon and the newsletter form's end state |
| `probe-icon-motion.mjs` | that the cursor-tracked icon *does* follow the pointer (earlier probes had been moving the pointer to a stale rect) |
| `probe-icon-axes.mjs` | that the pointer ratio is measured against the animated element's box |
| `probe-faq.mjs` | that the FAQ trigger is `.faq-item`, not `.faq-toggle` — the QA harness's selector was matching nothing, so the accordion was silently untested |
| `probe-slider-autoplay.mjs` | that the autoplaying slider advances identically on both sides, given the same `data-*` configuration |

## Probes that stayed top-level

These earn their place because the QA harnesses call them, or because they are the
first thing to reach for when a page misbehaves.

| Script | What it is for |
| --- | --- |
| `probe-ambient-baseline.mjs` | establishes the noise floor for the pixel comparison: it captures the *reference* four times and diffs it against itself, so a clone-vs-reference difference can be judged against what the reference manages against its own reloads. Cited in `QA_REPORT.md`. |
| `probe-clone-errors.mjs` | loads a cloned route and dumps every console message and page error with its stack — the first thing to run when a page renders but misbehaves |