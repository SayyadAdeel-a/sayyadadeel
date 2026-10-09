# Webflow IX3 engine semantics (as observed on this site)

Everything here was derived from two sources, and every rule was verified
against the live reference site rather than guessed:

1. **The engine bundle itself.** The reference loads
   `webflow.schunk.39b583d8f7fa071d.js` (≈207 KB, minified), which contains the
   interaction engine. Module boundaries survive minification, so the relevant
   functions can be read directly:

   | Engine symbol | Module | What it does |
   | --- | --- | --- |
   | `EASING_NAMES` | `3648` | numeric ease index → GSAP ease name |
   | `DEFAULTS.DURATION` | `6213` | `0.5` — duration when an action omits one |
   | `RELATIONSHIP_TYPES` | `6213` | `none`, `within`, `direct-child-of`, `contains`, … |
   | `STANDARD_TRIGGER_ALLOWED_CONTROLS` | `6213` | the ten timeline controls |
   | `ConditionalPlaybackManager` | `7127` | breakpoint / reduced-motion gating |
   | `AnimationCoordinator.togglePlayReverse` | `4054` | the click-toggle control |
   | `AnimationCoordinator.getComponentScopeSelector` | `8968` | component scoping |
   | `buildTimeline` / `buildTweensForAction` | action builder | tween construction |
   | `convertEaseConfigToGSAP` | `3408` | object easings → GSAP strings |
   | `transform.createTweenConfig` | action handler | property-value normalisation |

   Useful readers, all in `scripts/`:
   `ix-ease-table.mjs` (ease table), `ix-ease-usage.mjs` +
   `chunk-window.mjs` (any window of the bundle),
   `ix-conditional-probe.mjs`, `chunk-find.mjs`.

2. **The live site.** `scripts/probe-*.mjs` drive the reference in a real
   browser and report what it actually wrote to the DOM, which is how several
   rules below were pinned down where the bundle is ambiguous (notably
   `immediateRender`, the opacity percentage conversion and the `w-tabs`
   runtime).

The decoded payloads themselves live in
`docs/research/relab-0c02b053/<page-key>/webflow-ix2.json`; use
`scripts/ix-dump-page.mjs <page-key>` for a readable rendering.

---

## 1. Payload shape

```jsonc
{
  "interactions": [
    {
      "id": "i-c8a0a373",
      "scope": { "type": "component", "componentId": "24ca57b6-…" },
      "triggers": [
        [
          "wf:click",
          { "control": "togglePlayReverseFlipEase", "controlType": "standard" },
          // A trigger carries exactly ONE target tuple, spread across
          // positions 2..4 — it is not a list of targets.
          ["wf:class", ["menu-button"], { "relationship": "none", "firstMatchOnly": false }]
        ]
      ],
      "timelineIds": ["t-a4a0eafc"],
      "deleted": false,
      "conditionalPlayback": null
    }
  ],
  "timelines": [
    {
      "id": "t-a4a0eafc",
      "settings": {},                 // { repeat, yoyo } — only load loops use it
      "canvasDuration": null,
      "triggerMetadata": { "role": null, … },
      "actions": [ /* … */ ]
    }
  ]
}
```

`actions[].targets` **is** a list (an action can animate several elements at
once), while `triggers[]` holds a single target. Getting this backwards is the
easiest way to produce a runtime that silently binds nothing.

### Target kinds

| `wf:` kind | Payload value | Resolves to |
| --- | --- | --- |
| `wf:class` | array of fragments, each already a partial selector | concatenated; a fragment not starting with `.`/`#`/`[` gets a leading `.` |
| `wf:attribute` | a **bare selector string** (or a one-element array) | used as-is |
| `wf:selector` | same as `wf:attribute` | used as-is |
| `wf:inst` / `wf:id` | array of Webflow node ids | `#id` **and** `[data-wf-target*='"id0","id1"']` |
| `wf:trigger-only` | `""` | the trigger element |
| `wf:body` | — | `document.body` |

`wf:inst` is the one that needs care: Webflow's node ids are *not* DOM ids.
Elements that carry one are found by `#id`; the rest are matched through the
`data-wf-target` attribute Webflow stamps onto them, whose value embeds the
same id list. The reference's own critical stylesheet uses exactly that
attribute to hide IX-driven elements before the engine starts, e.g.

```css
[data-wf-component-id="24ca57b6-…"]:is(
  [data-wf-target*='["24ca57b6-…","24ca57b6-…cfb1"]']
)
```

### Relationships and component scoping

`meta.relationship` is one of `RELATIONSHIP_TYPES`. `within` scopes the query to
the trigger element, which is how a hover timeline animates *the* label inside
*that* button.

`interaction.scope.type === "component"` additionally restricts every query to
`[data-wf-component-id="<componentId>"]`.

---

## 2. Building a timeline

The engine's `buildTimeline` walks the actions in order and, for each one,
`buildTweensForAction` constructs the tween:

```js
const hasFrom = Object.keys(i.from ?? {}).length > 0;
const hasTo   = Object.keys(i.to   ?? {}).length > 0;
const tt = e.tt ?? 0;                       // TweenType

if (tt === 1) timeline.from    (targets, { ...config, ...from }, position);
else if (tt === 2) timeline.fromTo(targets, from, { ...config, ...to }, position);
else if (tt === 3) timeline.set (targets, { ...config, ...to }, position);
else              timeline.to   (targets, { ...config, ...to }, position);
```

`tt` is Webflow's `TweenType` enum: `0 = to`, `1 = from`, `2 = fromTo`,
`3 = set`. An action whose tween type needs a side it does not have is skipped.

### Tween config

```js
{
  force3D: true,
  ...(!canMerge && { immediateRender: false }),
  ...(tt !== 3 && { duration: timing.duration ?? 0.5 }),
  ...(timing.repeat    != null && { repeat:    canvasDuration != null && repeat < 0 ? 0 : repeat }),
  ...(timing.repeatDelay != null && { repeatDelay: toSeconds(timing.repeatDelay) }),
  ...(timing.yoyo      != null && { yoyo: timing.yoyo }),
  ...(stagger && { stagger }),
  ...(timing.ease != null && { ease: convertEaseConfigToGSAP(timing.ease) }),
  ...(flipsEase && { easeReverse: true }),
}
```

Five of these rules were confirmed empirically, and three of them differ from
the obvious reading:

* **`immediateRender` is only ever forced to `false`.** The engine computes a
  per-action `canMerge` flag (false when two actions of one timeline write the
  same property for the same target set) and spreads
  `...(!canMerge && { immediateRender: false })`. It never forces `true`, so an
  unflagged action keeps GSAP's own default. This matters:
  - a `set()` (tt 3) therefore does **not** apply itself at build time, which is
    why the mobile menu's `.nav-menu-wrap` has no inline `display` until the
    menu is opened;
  - a competing `fromTo` pair on one property gets `immediateRender: false` on
    the *later* action only — the button label's two tweens both write `y`, and
    the first one must keep rendering so the label rests at `translate(0, 0%)`
    instead of `translate(0, 100%)`.
  - Measured with `scripts/probe-gsap-set.mjs`.

* **`duration` defaults to `0.5`** (`DEFAULTS.DURATION`), not to GSAP's own
  default. Three of the navigation-menu actions omit it.

* **`ease` defaults to GSAP's `power1.out`**, because the engine only sets
  `E.ease` when `timing.ease != null` — and GSAP's default ease *is*
  `power1.out`.

* **`position` is absolute seconds** on the timeline, not a relative offset.
  Ambient loops rely on it: a 4-second tween is placed at `0` and its return
  leg at `3.9`, then the whole timeline repeats forever via
  `timelineDef.settings.repeat = -1`.

* **`easeReverse: true`** is added to every tween of an interaction whose
  control is `reverseFlipEase` or `togglePlayReverseFlipEase`. GSAP then applies
  the mirrored ease when the timeline plays backwards, which is what makes the
  FAQ/accordion collapse read differently from its expand.

### Property normalisation

`transform.createTweenConfig` is the only place values are rewritten. A channel
is `[from, to]` and either side may be `null` ("not specified", and then left
out of that side of the tween):

| Channel | Rule |
| --- | --- |
| `opacity`, `autoAlpha` | a numeric **string** becomes `parseFloat(v) / 100` |
| `xPercent`, `yPercent` | a numeric **string** becomes `parseFloat(v)` |
| `transformOrigin` | a bare string sets both sides; otherwise a string on one side pins the other |
| everything else | passed through verbatim |

Everything else passes through because GSAP already understands `"-100%"`,
`"225deg"`, `"auto"` and plain numbers — Webflow stores `y: ["0%", "-100%"]` for
the label roll and lets GSAP interpret it.

The `opacity` rule is not cosmetic: `gsap.from(el, { opacity: "0%" })` renders
`opacity: 0.001111` at the end of the tween instead of `1`
(`scripts/probe-gsap-opacity.mjs`), because GSAP parses the percentage against
the element. The reference ends at exactly `opacity: 1`, which only happens once
the value has been normalised to a number.

Values that are functions, or strings starting with `+=`, `-=` or `random(`,
are left alone.

---

## 3. Easings

`timing.ease` is either an index into this table or an object. The table is
`EASING_NAMES`, transcribed verbatim from the bundle:

| | | | | | | |
| --- | --- | --- | --- | --- | --- | --- |
| 0 `none` | 1 `power1.in` | 2 `power1.out` | 3 `power1.inOut` | 4 `power2.in` | 5 `power2.out` | 6 `power2.inOut` |
| 7 `power3.in` | 8 `power3.out` | 9 `power3.inOut` | 10 `power4.in` | 11 `power4.out` | 12 `power4.inOut` | 13 `back.in` |
| 14 `back.out` | 15 `back.inOut` | 16 `bounce.in` | 17 `bounce.out` | 18 `bounce.inOut` | 19 `circ.in` | 20 `circ.out` |
| 21 `circ.inOut` | 22 `elastic.in` | 23 `elastic.out` | 24 `elastic.inOut` | 25 `expo.in` | 26 `expo.out` | 27 `expo.inOut` |
| 28 `sine.in` | 29 `sine.out` | 30 `sine.inOut` | | | | |

This site only uses indices **0, 1, 2, 6 and 25** — `none`, `power1.in`,
`power1.out`, `power2.inOut` and `expo.in`.

Object easings become GSAP strings: `back.${curve}(${power})`,
`elastic.${curve}(${amplitude}, ${period})`, `steps(${stepCount})`,
`slow(...)`, `expoScale(...)`. This site uses one, `{ type: "back", curve:
"out", power: 1.7 }` → `back.out(1.7)`.

`timing.stagger` maps almost straight onto GSAP's own config, with `each` and
`amount` passed through `toSeconds` (a `"250ms"` string becomes `0.25`).

---

## 4. Triggers

| Trigger | Events | Timeline scope |
| --- | --- | --- |
| `wf:load` | fires once after registration | one timeline, global |
| `wf:hover` | `mouseenter`, or `mouseleave` when `pluginConfig.type === "mouseleave"` | one timeline **per trigger element** |
| `wf:click` | `click` | one timeline per trigger element |
| `wf:scroll` | a ScrollTrigger per trigger element | one timeline per trigger element |
| `wf:mouse-move` | continuous channel, no event of its own | one channel set per trigger element |

A timeline is built per trigger element whenever any of its actions resolves
relative to a trigger (`wf:trigger-only`, a `within` relationship, or a
`filterBy`). Otherwise a single shared timeline is built and every trigger
listens on the element its own target resolves to.

### Controls

`control` is one of `restart`, `play`, `reverse`, `reverseFlipEase`, `pause`,
`resume`, `togglePlayReverse`, `togglePlayReverseFlipEase`, `stop`, `none`;
`standard` triggers default to `restart`.

`togglePlayReverse` is worth quoting exactly, because the obvious ordering is
wrong — `progress() === 1` **reverses**:

```js
const p = timeline.progress();
if (p === 0) timeline.play();
else if (p === 1) timeline.reverse();
else if (timeline.reversed()) timeline.play();
else timeline.reverse();
```

Reversing a timeline that contains a zero-duration `set()` at position 0
restores the element's original value **only if the timeline also contains a
sibling tween** — which is why the navigation menu (which sets `display` and
then tweens the hamburger lines) closes correctly, while a timeline containing
nothing but a `set()` would leave its value applied.

### Scroll triggers

`scrollTriggerConfig` is `{ clamp, start, end, scrub, enter, leave, enterBack,
leaveBack }`. This site uses three distinct configurations:

```jsonc
{ "clamp": false, "start": "top 92%", "end": "bottom top", "scrub": null,
  "enter": "play", "leave": "none", "enterBack": "none", "leaveBack": "none" }
{ "clamp": true,  "start": "top bottom", "end": "bottom top", "scrub": null,
  "enter": "play", "leave": "none", "enterBack": "none", "leaveBack": "none" }
{ "clamp": true,  "start": "top top", "end": "bottom bottom", "scrub": 0.8,
  "enter": "play", "leave": "none", "enterBack": "none", "leaveBack": "none" }
```

`enter: "play"` with every other action `"none"` means *play once*: the timeline
stays at its end afterwards and `play()` on an exhausted timeline is a no-op, so
scrolling back up and down again does not replay it. A `scrub` value turns the
interaction into a scrubbed ScrollTrigger instead of enter/leave callbacks —
that variant only appears on the homepage.

### Continuous (mouse-move) channels

A `wf:mouse-move` trigger carries `pluginConfig.restingState = { x: 50, y: 50 }`
(percentages) and `pluginConfig.smoothness = 90`. Its timelines are tagged with
`triggerMetadata.role = "mouseX" | "mouseY" | "interval"`, and each animates one
channel between a pair of values:

```jsonc
{ "tt": 2, "timing": { "duration": 1, "position": 0, "ease": 0 },
  "targets": [["wf:class", ["icon.icon-button-icon"],
               { "relationship": "within", "filterBy": ["wf:trigger-only", ""] }]],
  "properties": { "wf:transform": { "x": ["-8px", "8px"] } } }
```

The value is `interpolate(from, to, pointerRatio)`, tweened with the declared
duration and ease (`none` here). Three behaviours were measured rather than
assumed:

* The **resting position is written as an explicit transform** at bind time —
  `translate(0, 0)` — not left at the channel's start value. Building these
  timelines eagerly instead would leave every icon at `translate(-8px, -8px)`,
  which the reference never shows.
* The pointer ratio is measured against the **animated element**, not the
  trigger it listens on.
* The box is **held for the duration of the hover** rather than re-read on
  every move, so a tracked icon stays locked to the pointer.

---

## 5. Conditional playback

`interaction.conditionalPlayback` is a list of
`{ type, behavior, breakpoints }` rules. `buildConditionsObject` turns
`type: "breakpoint"` into `gsap.matchMedia` queries:

| Breakpoint | Query |
| --- | --- |
| `tiny` | `(max-width: 479px) and (min-width: 0px)` |
| `small` | `(max-width: 767px) and (min-width: 480px)` |
| `medium` | `(max-width: 991px) and (min-width: 768px)` |
| `main` | `(min-width: 992px)` |

`evaluateConditions` collects the rules whose query currently matches and then:

```js
const dontAnimate = matched.find((m) => m.condition.behavior === "dont-animate");
return dontAnimate
  ? { behavior: "dont-animate", … }
  : { behavior: matched[0].behavior, … };
```

The name is misleading: **`dont-animate` does not skip the interaction**, and it
certainly is not "desktop off". `setupConditionalContext` calls its `apply`
callback for *any* resolved behaviour, and the behaviour is what tells the
trigger strategy to jump straight to the end state instead of animating. On this
site the single rule is
`{ type: "breakpoint", behavior: "dont-animate", breakpoints: ["main"] }` on the
mobile-only `[group-fedup-phone]` reveal, which is why that reveal snaps to its
final position at ≥992 px and animates below it.

For a `wf:load` interaction the first match-media invocation is skipped, so
load timelines are only ever built for the context that was current when the
engine initialised.

---

## 6. Widgets the engine does *not* drive

These are separate Webflow scripts, not IX, and are reimplemented in
`src/components/sites/adeel-site/shared/ix/widgets.ts`.

### `w-tabs`

Measured against the reference with `scripts/probe-tabs.mjs`:

* The runtime stamps `w-tabs-<set>-data-w-tab-<n>` / `…-data-w-pane-<n>` ids.
* Clicking a link toggles `w--current` on the links and `w--tab-active` on the
  panes; the stylesheet keys pane `display` off `w--tab-active`, so inactive
  panes become `display: none` with **no inline opacity of their own**.
* The incoming pane gets `transition: all, opacity <data-duration-in>ms` and its
  opacity animates to `1`. The outgoing pane gets
  `transition: all, opacity <data-duration-out>ms`, and after that transition
  its inline styles are cleared (leaving `style=""`) and the class removed.
* `data-current` on the menu is **never** written by the runtime. The
  `data-current="Tab 1"` in the source markup sits on the `.w-tabs` container,
  not on the `.w-tab-menu`, and the runtime does not touch it.

### `w-slider`

`role="region"`, `aria-label="carousel"` on the slider; an id of the form
`w-slider-mask-<n>` on each mask; and a `<div class="w-slider-aria-label"
aria-live="off" aria-atomic="true" data-wf-ignore>` appended to every mask,
whose text tracks `Slide <n> of <total>.` Nav dots are generated from the slide
count with `aria-pressed` and `role="button"`.

### `w-form`

The reference hosts a real Webflow form endpoint. Submitting from the clone
cannot reach it, so the observable end state is reproduced locally: the `<form>`
is hidden and `.w-form-done` is shown.