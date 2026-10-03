# The admin editor

`/admin` is a password-only visual editor for the site. You sign in, pick a page,
click any heading, paragraph, image or link, change it, and save. Saving commits
the change to GitHub; Vercel rebuilds the site from that commit.

It is **additive**. The 25 public routes are byte-for-byte unchanged — verified by
`npm run verify`, which still reports 72/72.

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

The generated components hard-code their copy as literal JSX, so when you click a
headline the browser has to work out which line of which file to rewrite:

1. **Which file.** Walk up from the clicked element until an ancestor's *first*
   CSS class matches a component root. That class is how a section is identified
   (`about-hero-section` → `AboutHeroSection.tsx`).
2. **Which element.** Count the elements before it, in the same subtree, with the
   same tag and first class. That count is the ordinal.
3. **The address** is `tag|class|ordinal` — the identical form
   `lib/admin/codemod.ts` builds from the file itself.

The first class is used rather than the whole class string because Webflow's
runtime appends `w--current`, `w--tab-active` and `gsap_split_*` classes at
runtime. The first class is the only part that stays stable between the source and
the live DOM.

`scripts/test-admin.mjs` asserts this round trip: it clicks a real headline in a
real browser, reads the address the editor computed, then resolves that address
in the actual file and requires it to be the same headline. Nothing else in the
suite would catch a mismatch here, and a mismatch means a save rewrites the wrong
element.

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
  `metadata` object of the page module, which the codemod does not scan — it reads
  JSX. Everything in the page body is editable.
* **A conditionally rendered element is not safely editable.** The address is
  derived from DOM order; if React rendered only some of them, the ordinal would
  not match the file. The publish step re-resolves against the file and fails
  loudly rather than writing to the wrong element, but the edit will not apply.
* **Editing a split-text label shows the new words unstyled until reload.**
  SplitText replaces button labels with per-character spans at runtime, so the
  preview cannot re-split without a full re-initialisation. The panel says so.
* **Discard reloads the page.** It is the only fully faithful restore: undoing each
  mutation by hand would leave behind everything the site's runtime did in
  response — SplitText spans, a moved slider, a re-measured marquee.
* **An abandoned upload leaves an orphan file** in `public/uploads/`. Harmless,
  and easy to delete.

---

## Tests

```bash
npm run admin:test-codemod      # the edit engine, against a real section
npm run admin:test-codemod-all  # every JSX file in the repo (4,799 elements)
npm run admin:test-e2e          # auth, gating, and a real browser edit
```

`admin:test-e2e` needs the server running (`npx next start --port 3100`) and a
`.env.local`.

Current state: 26/26 codemod checks, 63/63 text nodes round-tripping across the
shared header, footer and CTA, and 25/25 end-to-end checks.

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