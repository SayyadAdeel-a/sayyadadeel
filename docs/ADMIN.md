# The admin editor

`/admin` is a password-only visual editor for the site. Sign in, pick a page,
click any heading, paragraph, image or link, change it, and save. Saving commits
the change to GitHub; Vercel rebuilds the site from that commit.

| URL | What it is |
| --- | --- |
| `/admin` | The page list, and the sign-in form when signed out. |
| `/admin/edit` | The homepage, in the editor. |
| `/admin/edit/<route>` | Any other page, e.g. `/admin/edit/case-studies`. |

It is **additive**. The 25 public routes are byte-for-byte unchanged — verified by
`npm run verify`, which still reports 72/72.

---

## Using it

Hover anything editable and it gets a dashed blue outline plus a small label
naming what it is and which file it lives in. Click it and the outline turns solid
while the inspector opens on the right.

| You want to | Do this |
| --- | --- |
| Change a heading or a small label | Click the words, type in the **Text** box |
| Swap an image | Click it, paste a new address, or use **Upload from this computer** |
| Write alt text | Click the image, edit **Alt text** |
| Change where a link goes | Click anywhere in the link, edit **Link address** |
| Get rid of a selection | Press <kbd>Esc</kbd> |
| Review what you have changed | Click the **N unsaved edits** button |
| Throw everything away | **Discard** |
| Publish | **Save & publish** |
| See the page as visitors do | **Editing off**, or **View live ↗** |

A button label and the link it sits in are *different* elements, so clicking a
button's text gives you both a **Text** box and a **Link address** box. The panel
names the file and address each one saves to, at the bottom.

**Editing off** stops the editor intercepting clicks, so the page behaves exactly
as a visitor sees it — hover states, sliders, tabs, marquees.

### What is editable

Everything in the page body: headings, paragraphs, list items, spans, small
labels, form labels and option text, buttons, links, images, alt text, and
elements nested inside cards and sliders.

Two things are deliberately not offered:

* **Page titles and meta descriptions.** They live in the `metadata` object of the
  page module, and the edit engine reads JSX, not JavaScript objects.
* **Anything whose text or address is computed in code** rather than written as a
  literal — a `className` built with a template literal, an `href` derived from a
  prop. Editing those would be silently overwritten at render time, so the editor
  declines rather than pretending.

If a section turns out not to match its source file, the editor says so in an
amber bar and leaves that section alone. Everything else on the page still works.

---

## Setting it up

Five environment variables. The first three are required; the last two are only
needed for uploading images.

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | The only sign-in secret. No username. |
| `ADMIN_SESSION_SECRET` | HMAC key for the session cookie. Any long random string. Generate one with `openssl rand -base64 32`. |
| `GITHUB_TOKEN` | A fine-grained token with **Contents: read and write** on the repo. |
| `GITHUB_REPO_OWNER` | e.g. `SayyadAdeel-a` |
| `GITHUB_REPO_NAME` | e.g. `sayyadadeel` |
| `GITHUB_BRANCH` | Optional, defaults to `main`. |

Set them in Vercel under **Settings → Environment Variables** for Production,
Preview and Development, then redeploy.

For local work, copy the values into `.env.local` (gitignored) — see
`.env.local.example`.

The dashboard warns at the top if `GITHUB_TOKEN` is missing, rather than letting
you discover it on the first Save.

---

## How it works

### The preview is the real page

`/admin/about` imports and renders the same components `/about` renders, as
children of the editor. Nothing is overridden and no markup is rewritten, so what
you edit is what ships. That is also why the editor cannot drift out of sync with
the site: there is only one copy of the page.

It means the editor cannot add "editable" props to the generated components —
there is nothing to add them to, and adding them would put the admin's concerns
into the public render path.

### A click becomes a source edit

The generated components hard-code their copy as literal JSX, so when you click
a headline the browser has to work out which line of which file to rewrite. Three
tables in `src/generated/admin-registry.ts`, all produced from the site's own
source by `npm run admin:registry`:

1. **`FILE_ROOTS`** — the CSS classes that can begin a component, e.g.
   `about-hero-section` maps to `AboutHeroSection.tsx`.
2. **`FILE_ELEMENTS`** — every addressable element in each file, as
   `tag|first-class|ordinal`, with the properties that can be edited on it.
3. **`FILE_TOTALS`** — how many elements of each shape each file declares. All of
   them, not only the editable ones.

On load the editor walks the live DOM once and resolves each element to its
address, mirroring the source scan exactly, then answers every click from that
map. Only elements present in `FILE_ELEMENTS` are hoverable, so the editor can
never offer something the save would then refuse.

Three details, each of which fixes a real failure:

* **First class, not the whole class string.** Webflow's runtime appends
  `w--current`, `w--tab-active` and `gsap_split_*`, and SplitText replaces
  button labels with per-character spans. Those spans exist in the DOM and not in
  the source, so counting them would shift every ordinal after them.
* **Template literals are read as far as their static prefix.** A className like
  `` className={`nav-link w-inline-block${…}`} `` is computed, but the browser
  still shows `nav-link` first, so that is the identity used. Without this, all
  twelve header nav links were invisible to the editor.
* **The DOM must account for exactly what the file declares.** If React rendered
  conditionally the counts would disagree, and every ordinal after the divergence
  would aim a save at the wrong element. A file that disagrees is dropped from
  the index and reported in an amber bar.

`scripts/test-admin.mjs` asserts the whole round trip: it clicks a real headline
in a real browser, reads the address, resolves it in the actual file, patches it,
and requires the patch to land on that element with that text.
`admin:test-routes` does the same on all 25 pages and requires every address to
be unique.

### Saving

```
editor  →  POST /api/admin/publish
        →  verify session
        →  read each file's current content from GitHub   (not this server's copy)
        →  apply every change with the codemod
        →  one atomic commit
        →  Vercel rebuilds
```

Reading from GitHub rather than the deployed bundle matters: the deployed function
is a build artifact that goes stale the moment anything is committed, so editing
against it would resurrect old content and clobber newer edits.

The commit is all-or-nothing. If any element cannot be resolved uniquely, nothing
is written and the offending element is named in the error. A CMS that half-applies
a save and reports success is worse than one that refuses.

### No database

The store is GitHub. An uploaded image is committed to `public/uploads/` and
referenced by its path like any other asset. There is no object store, no session
table and no ORM; the only state is a signed cookie and the repository itself.

---

## Security

| Concern | How it is handled |
| --- | --- |
| Password storage | `ADMIN_PASSWORD`, server-side only, never sent to the browser. |
| Comparison | Constant-time — no early exit, lengths folded in first. `===` would leak the matching prefix through timing. |
| Session | HMAC-SHA256 signed cookie, `HttpOnly` + `SameSite=Lax` + `Secure` in production. Payload is just an expiry; there is nowhere to keep server-side state without a database. |
| Credential exposure | `GITHUB_TOKEN` is read only inside the publish route. It is never returned, logged or put in a URL. |
| Brute force | In-memory rate limit: 5 failures in 15 minutes locks an origin out for 15. |
| Unauthenticated rendering | `proxy.ts` redirects before the route renders. |
| Path traversal | `isSafeRepoPath` rejects anything outside `src/`, `app/`, `lib/` with an approved extension. |
| Ambiguous edits | The codemod refuses to write when an address does not resolve to exactly one element. |

### Two things worth being straight about

**The rate limiter is best-effort.** It is an in-memory `Map`, so a serverless
isolate is per-instance: a distributed flood gets a fresh budget per instance, and
a cold start resets the counters. That stops the attack it is aimed at — someone
guessing the password from a script on one machine. It is not a defence against a
determined distributed attacker. For that, put Cloudflare rate limiting or a WAF
rule in front of `/api/admin/login`, which is the right place for it anyway.

**`proxy.ts` is a fast rejection, not the security boundary.** It exists so that
unauthenticated requests do not render or transmit a page. `publish` and `upload`
each verify the session again immediately before writing, because that check has
to be next to the data. Next's own guidance is that most security checks belong
close to the data source.

---

## Limits, stated plainly

* **Page titles and meta descriptions are not editable.** They live in the
  `metadata` object of the page module, and the edit engine reads JSX, not
  JavaScript objects. Everything in the page body is editable.
* **A section that does not match its source file is refused, not patched.** If
  React rendered conditionally, DOM order would no longer line up with source
  order and a save could rewrite the wrong element. The editor detects that by
  comparing element counts, drops that section from the index, and says so in an
  amber bar. The publish route re-checks independently and fails loudly rather
  than writing.
* **Computed values are not editable.** A label whose text comes from an
  expression, or a link whose `href` comes from a prop, is left alone: editing it
  would be silently overwritten at render time.
* **Editing a split-text label shows the new words unstyled until reload.**
  SplitText replaces button labels with per-character spans at runtime, so the
  preview cannot re-split without a full re-initialisation. The panel says so.
* **Discard reloads the page.** It is the only fully faithful restore: undoing
  each mutation by hand would leave behind everything the site's runtime did in
  response — SplitText spans, a moved slider, a re-measured marquee.
* **An abandoned upload leaves an orphan file** in `public/uploads/`. Harmless,
  and easy to delete.

---

## Tests

```bash
npm run admin:registry           # regenerate the element index from the source
npm run admin:test-codemod       # the edit engine, against a real section
npm run admin:test-codemod-all   # every JSX file in the repo
npm run admin:test-e2e           # auth, gating, and a real browser edit
npm run admin:test-routes        # all 25 pages, in a real browser
```

The two browser tests need the server running (`npx next start --port 3100`) and
a `.env.local`.

Current state: 29/29 codemod checks; 4,968 elements across 116 files with unique
addresses and 63/63 text nodes round-tripping through the shared header, footer
and CTA; 67/67 end-to-end checks; and 25/25 routes (129 assertions), each opening at its own URL,
rendering the real page, exposing 103–520 editable elements, and resolving every
address unambiguously in its source file.

Run `npm run admin:registry` after adding or renaming a page. The editor reads
the site's own page modules, so it picks the page up either way — but the index
is what says which of its elements are editable.

---

## Files

| Path | What it is |
| --- | --- |
| `proxy.ts` | Rejects unauthenticated requests before rendering. |
| `app/admin/layout.tsx` | The gate and the sign-in fallback. |
| `app/admin/page.tsx` | Page list. |
| `app/admin/[...slug]/page.tsx` | Resolves a route to its page module. |
| `app/admin/admin.css` | Editor chrome. Every rule is `adm-` prefixed. |
| `app/api/admin/*` | Login, logout, session, publish, upload. |
| `lib/admin/codemod.ts` | The edit engine. |
| `lib/admin/auth.ts` | Password check, session signing, rate limit. |
| `lib/admin/github.ts` | The only code that touches a GitHub credential. |
| `src/components/admin/Editor.tsx` | Click resolution, live preview, change list. |
| `src/generated/admin-registry.ts` | Generated: routes and component roots. |
| `scripts/build-admin-registry.mjs` | Regenerates the above. |

If you add a page, run `npm run admin:registry`. The editor picks it up
automatically otherwise — it reads the site's own page modules.