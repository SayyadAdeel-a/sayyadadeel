# Probe scripts

Single-purpose diagnostics written while auditing animations. Each answers one
question that a batch harness could not, and each is kept because the next person
to touch this code will hit the same question.

Run them as `node scripts/<name>.mjs [route] [width] [args]`. They all read the
live reference and the local clone and print a side-by-side comparison.

| Script | Question it answers |
| --- | --- |
| `probe-motion-series.mjs` | What is an element's actual transform, sample by sample? The instrument of last resort when a rate comparison disagrees. |
| `probe-audit-repro.mjs` | Reproduce `audit-motion`'s sampling loop verbatim and dump raw frames, to tell a real difference from a harness artefact. |
| `probe-marquee.mjs` | Geometry, travel rate and implied loop width of a `[marku-slide]` marquee. |
| `probe-reveal-init.mjs` | Is a reveal element at its from-state on a fresh load, with zero scrolling? |
| `probe-reveal-one.mjs` | Everything about one reveal element: from-state, payload, ScrollTrigger registry, whether it is painted. |
| `probe-reveal-binding.mjs` | What does a reveal interaction bind to — the payload, and what each side's selector actually matches. |
| `probe-trigger-lookup.mjs` | Which ancestor carries a trigger hook, and what each lookup method returns for it. |
| `probe-attr-bytes.mjs` | The exact codepoints of every hook attribute name — catches look-alike characters that defeat CSS selectors. |
| `probe-attr-identity.mjs` | Whether `[hook]` matches, by three independent methods, in one page load. |
| `probe-hook-timeline.mjs` | When hook attributes appear after load, and whether they are in the served HTML. |
| `probe-hover-one.mjs` | Does hovering one trigger move anything, and what is the page's hover census? |
| `probe-hover-trace.mjs` | Every distinct state of every split leaf through a hover, frame by frame. |
| `probe-hover-env.mjs` | Does the browser advertise hover capability, and does a real-mouse hover do anything? |
| `probe-hover-leave.mjs` | Does a button label survive a hover — i.e. is it still visible afterwards? |
| `probe-button-layers.mjs` | Which of a button's two labels is on top at rest. |
| `probe-slider-autoplay.mjs` | Slider autoplay timing and direction. |
| `probe-clone-errors.mjs` | Console and page errors on the clone. |
| `probe-current-links.mjs` | Which nav links are marked current. |
| `probe-ambient-baseline.mjs` | How much the reference's own ambient loops drift between reloads — the noise floor. |

## Why so many

Each one exists because a batch harness gave a confident **wrong** answer, and the
only way to tell a real difference from an artefact was to look at the raw thing.
The list of traps that produced those wrong answers is at the end of
`../ANIMATION_AUDIT.md`; each probe is the tool that closes one of them.