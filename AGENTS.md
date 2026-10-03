<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Relab clone — working notes

A pixel-perfect clone of <https://relab-template.webflow.io/>. Read
`README.md` first, then `docs/research/relab-0c02b053/README.md`.

## The admin editor

`/admin` is a password-only visual editor. It renders the real page components as
children of the editor and rewrites the generated `.tsx` source when you save,
committing to GitHub for Vercel to deploy. **Read `docs/ADMIN.md` before touching
`lib/admin/`, `src/components/admin/` or `proxy.ts`.**

Adding a page? Run `npm run admin:registry` so the editor knows about it.

`lib/admin/codemod.ts` rewrites production source on every save. It resolves an
element by identity (`tag|first-class|ordinal`), never by position, and refuses the
whole file when an address does not match exactly one element. If you change it,
run `npm run admin:test` — the tests exercise it against the real generated
components, because a wrong match would quietly replace the wrong headline on a
live page.

## Do not

* **Do not regenerate the homepage.** `src/components/sites/relab-0c02b053/root-8a5edab2/`
  and `shared/InteractionsRuntime.tsx` were hand-authored and are frozen.
  `scripts/convert-page.mjs` runs without `--home` and never touches that
  directory. The rest of the site is generated.
* **Do not edit generated components by hand.** Change
  `scripts/convert-page.mjs` / `scripts/lib/jsx-emit.mjs` and re-run
  `npm run pipeline:convert`. It wipes and rewrites each page's directory.
  (The admin editor writes to these files, but only through
  `lib/admin/codemod.ts`, which verifies every patch.)
* **Do not add props to generated components for the editor's benefit.** The
  editor edits the page in place precisely so the public render path stays
  untouched. `npm run verify` compares all 25 routes against the reference and is
  the gate that this stays true.
* **Do not import Tailwind.** `app/webflow.css` is Webflow's own stylesheet and
  Tailwind's preflight would reset the base styles the clone depends on.
* **Do not "fix" `aria-current`, `w--current`, `w--tab-active` or the
  `gsap_split_*` classes.** They are part of the reference DOM, stamped by
  Webflow's runtime. The QA harnesses compare them.

## Verifying a change

Every claim about parity is checked against the live reference:

```bash
npm run build && npx next start --port 3100 &
npm run verify               # 25 routes x 1440/768/390: DOM outline, boxes, behaviour
node scripts/verify-content.mjs
node scripts/verify-navigation.mjs
node scripts/verify-homepage-after-navigation.mjs
node scripts/qa-pixels.mjs

npm run audit:all            # animations: inventory + motion + reveals + hover
```

`npm run verify` cannot see three classes of defect, because they only exist in
states it never samples: ambient loops (compared after settling), scroll reveals
(they animate `opacity`, which nothing reads) and hover (needs a pointer). The
`audit:*` scripts exist for those and should be run after any change to
`shared/ix/runtime.ts` or the homepage runtime. See
`docs/research/relab-0c02b053/ANIMATION_AUDIT.md`.

`npm run check` runs lint + typecheck + build. `npm run verify` needs the server
on port 3100 and network access to the reference.

## Where the answers are

| Question | File |
| --- | --- |
| How is a page generated? | `docs/research/relab-0c02b053/PIPELINE.md` |
| What does Webflow's interaction engine actually do? | `docs/research/relab-0c02b053/IX3-ENGINE.md` |
| What is on each route? | `docs/research/relab-0c02b053/PAGE_TOPOLOGY.md` |
| What animates, where? | `docs/research/relab-0c02b053/BEHAVIORS.md` |
| What was measured? | `docs/research/relab-0c02b053/QA_REPORT.md` |
| What animates, and what was wrong with it? | `docs/research/relab-0c02b053/ANIMATION_AUDIT.md` |
| How does the admin editor work? | `docs/ADMIN.md` |
| Why does the code look like this? | `scripts/legacy/README.md` |

## Webflow gotchas already hit

* `triggers[]` carries a **single** target tuple; `actions[].targets` is a
  **list**. Getting this backwards silently binds nothing.
* `wf:inst` targets are Webflow node ids, not DOM ids — they resolve through
  the `data-wf-target` attribute.
* `tt` is the tween type (`0 to`, `1 from`, `2 fromTo`, `3 set`).
* Webflow's `immediateRender` flag is only ever forced to `false`; leaving it
  unset is what keeps a `set()` from applying before its trigger fires.
* `conditionalPlayback` with `dont-animate` means "jump to the end state", not
  "do not run".
* React's JSX transform decodes named entities but **not** numeric character
  references, so `&#39;` renders literally. Apostrophes stay bare in JSX text.
* Hook attributes often contain typos — `group-fedup-move="ture"`,
  `card-image-hover-pfriend` is `p` + `friend`. They are selectors; copy them
  exactly.
* A `fromTo` action never writes its resting transform, because the engine leaves
  `immediateRender` unset. If you build one of these with GSAP's default
  `immediateRender`, it applies the *from* state at load — which parked every
  button label at `translate(0%, 100%)`, invisible inside its clipped wrapper.
* Webflow builds **one tween per split element**, so a `stagger` on a split-text
  action is per element. Flattening every matched element's characters into one
  tween turns `.button`'s hover into a nine-second cascade where most buttons do
  nothing at all.
* A trigger that is not element-scoped must bind to **every** element it matches.
  Resolving to the first leaves the listener on whichever element happens to come
  first in the document — at 390 that is the mobile nav's button, which has no
  bounding box.
* `wf:load` triggers carry **no** target. Code that skips a null target must not
  be on the path that queues them, or every ambient loop silently stops.
* Comparing animated state is full of phase traps. Compare **rates** (median of
  per-interval speeds), never absolute positions; read the elements that actually
  move (per-character split spans, not the container); use the real mouse; and
  wait for Lenis scroll to settle before capturing a box. Each of these produced
  a confident false positive first — the details are in `ANIMATION_AUDIT.md`.
