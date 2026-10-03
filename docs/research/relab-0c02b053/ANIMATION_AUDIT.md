# Animation audit

Findings and fixes from an audit of every animation, transition and interactive
effect on the site against the live reference.

## What was audited, and how

The existing parity harness compared DOM outlines, boxes, text, images and
navigation. It could not see three whole classes of defect, because all of them
only exist in states it never sampled:

| Layer | Interactions | Why the old harness missed it |
| --- | --- | --- |
| Continuous motion | 157 `wf:load` | sampled after settling; phase-dependent |
| Scroll reveals | 128 `wf:scroll` | reveals animate `opacity`, which no check read |
| Hover | 153 `wf:hover` | requires a pointer; nothing ever hovered |

Three new harnesses were written, one per layer. Each compares the clone to
`https://relab-template.webflow.io` at 1440 and 390:

```bash
node scripts/interaction-inventory.mjs   # what the site declares
node scripts/audit-motion.mjs            # ambient loops: presence, axes, speed
node scripts/audit-reveals.mjs           # scroll reveals: from-state, end state, timing
node scripts/audit-hover.mjs             # hover: per-character roll, direction, revert
```

`scripts/interaction-inventory.mjs` is the index: it reads every page's decoded
`webflow-ix2.json` and groups all 463 interactions by trigger type, target and
selector, which is what the other three work from. Without it the audits would be
guessing selectors.

## Defects found and fixed

### 1. Text-button hover rolled the wrong way (homepage)

`i-00a50fa3` drives two layers of every `.text-button`:

```
.text-button-normal-text  y ["0%","-100%"]  scale [1,   0.4]
.text-button-hover-text   y ["0%","-100%"]  scale [0.4, 1  ]
```

Both roll **upwards** by 100% of their own height: the normal label leaves
through the top of its clipped wrapper while the hover label — parked one
line-height below by `top: 100%` — rises into the vacated slot.

The clone had the hover layer inverted: parked at `yPercent: -100` and tweened to
`0`, sending the two labels in opposite directions. Measured, every hover
character moved **−44.8px in the reference and +44.8px in the clone**.

Fixed in `shared/InteractionsRuntime.tsx`.

### 2. Button hover barely moved, on every page

`i-34e05c93` puts **two `fromTo` actions on the same channel** at the same
position:

```
y ["0%",  "-100%"]   duration 0.25  stagger each 0.018
y ["100%", "0%"]     duration 0.25  stagger each 0.018
```

GSAP renders same-position children in insertion order, so the second wins and the
label rolls *up* out of a position one line-height below — a peak of ~100% of its
height, then settled at rest.

The homepage modelled these as two `to()` tweens, which drops the `from` values;
both then ran 0 → 0 and the label moved 1-3px where the reference reached 21-24px.
Rewritten as `fromTo`.

### 3. Hover stagger ran across the whole page instead of per label

This was the largest one. For a split-text action Webflow builds **one tween per
split element**, so a `stagger` applies within each element's own characters. The
runtime flattened every matched element's characters into one array.

`.button`'s hover targets `.button-normal-text` document-wide with
`stagger: { each: 0.018 }`, and a page has ~500 split characters. As one tween
that is a nine-second cascade: hovering any button past the first few animated
nothing at all. Measured, characters 406-417 never moved in the clone while the
reference moved them a full 100%.

`splitElements` now returns one group per split element and the timeline builder
emits one tween per group.

### 4. Hover listeners were bound to a single trigger element

For an interaction that is *not* element-scoped, the trigger was resolved to
`resolveTarget(...)[0]` and the listener attached there. `.button`'s hover is
document-wide, so it got one shared timeline with one listener — on whichever
`.button` came first in the document.

At 390 that first button is the off-canvas mobile nav's, and it has **no bounding
box at all** (verified on both sites). Hovering any visible button did nothing.
`bindTrigger` now expands a null trigger to every element it matches.

### 5. Splitting a hidden element could abort the whole runtime

`buildTimeline` runs inside the interaction loop, so a `SplitText` call on an
element with no layout — the `display: none` mobile nav on a phone — could leave
every *later* interaction unbound, and the page would quietly lose animations
while still looking correct. Splitting is now guarded per element.

> While fixing #4, a first attempt put the trigger expansion in the interaction
> loop rather than in `bindTrigger`. `wf:load` triggers carry **no** target, so the
> `continue` skipped them and **every ambient loop on every generated page stopped**
> (`moving 9/0` in the motion audit). Caught by the motion sweep within minutes —
> which is the argument for having that harness at all.

## Verified clean

* `audit-motion.mjs` — **50/50** route-viewports, 0 findings. Every ambient loop
  the reference runs, the clone runs, on the same axes, at the same speed.
* `audit-reveals.mjs` — **49/50** clean; the single exception is `/pricing` at
  390, which flips between runs (see below).
* `audit-hover.mjs` — clean at 1440 on every route.
* `audit-widgets.mjs` — **6/6** clean.
* `qa-all.mjs` — see "Reading the last qa-all run" below.
* `npm run check` — lint, typecheck and build clean; 28 routes prerender static.

## Route coverage

`scripts/check-coverage.mjs` compares the route registry against each report, so
a gap cannot hide behind a targeted re-run. Two gaps it surfaced, both now
closed:

* the hover audit had only reached **16 of 25** routes; the remaining 9
  (`/pricing`, `/contact`, `/licenses`, `/style-guide`, `/changelog`, `/404` and
  three blog posts) were swept and all show the same result as the rest —
  clean at 1440, the known defect at 390;
* reports were **overwritten** by targeted re-runs, so a coverage check read the
  last run's routes and reported most of the site as untested. The audits now
  merge into their report via `mergeReport`, replacing only the route-viewport
  being re-measured.

`/` is absent from `qa-all` by design: the homepage is frozen and is verified by
the legacy harnesses instead.

## Reading the last qa-all run

It reports **68/72**. Neither failure is a clone defect:

* **`/404` at all three viewports** — the reference could not be reached:
  `net::ERR_NAME_NOT_RESOLVED` three times in a row. The route is fine
  (`https://relab-template.webflow.io/404` returns 200 when fetched directly).
  `qa-route` on it in isolation still reports FAIL for the long-standing,
  documented reason: the clone returns HTTP 404 from Next's not-found boundary
  where the reference returns 200.
* **`/case-studies` at 390** — the **reference's** Webflow runtime had not
  initialised when it was sampled. The evidence is in the report itself: the
  reference's split letters are `null` (SplitText never ran) and its tab ids are
  `["", "", ""]`, while the clone's are fully populated. Run in isolation the
  route **passes**.

Both came from running audits against the same local server while `qa-all` was
in flight. The audits now retry a failed `page.goto`, which recovered the routes
that failed transiently.

## Sliders, carousels and tabs

Webflow drives these from its **widget** runtime, not from the IX3 payload, so no
previous check touched them — a slider that never moves or a tab that never
switches passes every structural test, because the markup, geometry and text all
match perfectly while the control is dead.

`scripts/widget-inventory.mjs` scoped the work: the site has **17 sliders, 19
slides, 3 arrow pairs and 2 tab sets, on only three routes** (`/`, `/about`,
`/case-studies`), with **no autoplay, loop or swipe anywhere**. So this is a
small, closed problem rather than a site-wide one.

`scripts/audit-widgets.mjs` clicks every arrow and every tab on both sites and
compares the slider mask's own transform, which slide is in the viewport, which
panes carry `w--tab-active`, and each arrow's `w--disabled` state.

**Result: 6/6 route-viewports clean**, and the controls are demonstrably live —
the homepage's sliders moved and its tabs switched identically on both sides
(`clicks 4/4, moved 1/1`, `clicks 3/3, switched 2/2`). `/about`'s slider carries
`display-none` on its arrows and nav **in the reference**, so it intentionally has
no controls; that is parity, not a gap.

The audit reports asymmetries only. An earlier version also flagged arrows that
"did not move", which flagged the reference against itself — a `prev` on a slider
already at its first slide does nothing on both sites. Each run now prints how
many clicks actually moved and how many tabs actually switched, because a harness
that reports "no findings" because nothing moved anywhere is the failure mode to
avoid.

## Regression introduced and fixed during this pass

The per-group tween change (#3) initially applied to **every** action, turning one
tween over N targets into N tweens. That changed how a `stagger` is distributed
and left a `[fade-up]` element revealed on load at 390 on `/pricing`, where the
reference keeps it hidden. `splitElements` now returns a single group holding all
targets unless the action is genuinely a split-text action, which restores the
original behaviour while keeping the fix for #3.

## Open defect

### 1. Button hover does not animate at 390 on the 24 generated pages

Reproducible on every one of them, and the split is perfectly clean: **24/24
routes fail at 390, 24/24 pass at 1440.** Hovering a visible `.button` leaves its
label at exactly `0` while the reference reaches a full 100% of its height
(17.7px of a 19px character on `/about`, 22.8px of a 24px character on
`/contact`). The homepage is unaffected at both widths.

Ruled out:

* the single-element binding (#4, now fixed — necessary but not sufficient);
* `SplitText` throwing on a hidden element (#5, now guarded — also necessary but
  not sufficient);
* `immediateRender` — confirmed correct in both directions;
* the target set — the visible label is split and its characters are in the DOM
  with the right height;
* the trigger expansion — `resolveTarget` returns all 18 `.button` elements at
  both widths, and listeners are attached to each.

Since the label's characters *are* split, `splitElements` did process that
element, so a group exists and the timeline contains it — yet `restart()` does not
move it. The remaining question is why the timeline is inert at 390 only. The
strongest untested lead is that the timeline is shared across every
`.button-normal-text` on the page, and the reference evidently does not behave
that way: at 1440 the reference moves ~55 characters per hover (about four
labels) where the shared clone timeline moves up to 127 (every label). The
homepage builds **one timeline per `.button`** and works at both widths, so
splitting the interaction per trigger element — as the homepage does — is the
change to try. It was not verified within the time available and **has not been
applied**.

### 2. `/pricing` at 390 — one reveal element, non-deterministic

`.pricing-plans-dectlies-box`, a `[fade-up]`, sits at exactly the `top 92%`
ScrollTrigger boundary at that width, so whether it has fired when the page is
first sampled varies between runs. The audit reports "initial opacity differs on
a load-visible element: reference 0, clone 1" in some runs and clean in others —
it appeared in the full 50-route sweep and not in an isolated re-run of the same
route seconds later.

The element reveals correctly once scrolled to on both sides, so this reads as a
sampling-boundary artefact rather than a visible defect. It is still a real
ambiguity at that width, and it wants a decision: either move the trigger
boundary or widen the tolerance for elements sitting within a few pixels of it.

## Harness notes worth keeping

Every one of these produced a confident false result before it produced a true
one. They are recorded because the failure mode is silence, not an error.

* **Compare rates, not positions.** An element on an infinite loop is at an
  arbitrary phase whenever sampled, and the phase differs between two page loads.
  Absolute positions made a healthy marquee look 4x too slow.
* **Use the median of per-interval rates, not `path / elapsed`.** One stalled
  interval — a GC pause, a Lenis reflow — inflates a total several-fold. The same
  marquee measured 92px/s in isolation and 483px/s under load.
* **Read the elements that move.** `.button` hover animates per-character split
  spans. Reading the container reports "no hover animation anywhere".
* **Selectors need their dot.** `querySelectorAll("button-normal-text")` is a
  valid *type* selector for a custom element and silently matches nothing.
* **Use the real mouse.** Synthetic `mouseenter`/`pointerenter` fired nothing on
  either site.
* **Wait for scroll idle before capturing a box.** Lenis eases scroll
  asymptotically; a box captured mid-ease points the mouse at empty space.
* **Watch for the Lenis cursor.** The site drives the cursor with `wf:mouse-move`;
  `boundingBox` does not move it, but a stale cursor changes which element a
  hover lands on. Avoid mouse-driven geometry near the top of the page.
* **Compare what a user can see.** A from-state 10,000px below the fold, or on a
  `0x0` element, is not a defect. Both were reported as ones until the check
  learned about geometry.
* **`page.evaluate` serialises the function.** No module-scope closure; helpers
  must be defined inside. And a property attached to a returned array
  (`result.debug = ...`) is silently dropped by JSON serialisation.
* **`wf:attribute` targets carry a bare string in slot 1; `wf:class` targets
  carry an array.** Normalise before matching.