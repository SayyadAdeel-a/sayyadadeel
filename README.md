# Adeel Site

The personal portfolio of **Sayyad Adeel Ahmad** — a student who learns by
building. Three routes, one page of projects, experiments, notes and the
curiosity that connects them.

Live at <https://adeelsayyad.tech>.

| Route | What it is |
| --- | --- |
| `/` | The homepage: the whole portfolio. |
| `/contact` | Contact form and details. |
| `/404` | Not-found page. |

## Running it

```
npm install
npm run build && npm start          # http://localhost:3000
npm run dev                         # development
npm run check                       # lint + typecheck + build
```

## How it is put together

The layout, typography and motion are a faithful reproduction of a Webflow
template, re-authored as React components under
`src/components/sites/adeel-site/`:

| Directory | Contents |
| --- | --- |
| `root-8a5edab2/` | the 17 homepage sections, hand-authored |
| `contact-4eb95063/` | the contact page |
| `404-316556f0/` | the not-found page |
| `shared/` | header, footer, CTA and the interaction runtime used by the secondary routes |

`src/lib/brand.ts` is the single source of truth for the site name, owner,
canonical origin and social profiles. `src/lib/metadata.ts` builds every route's
metadata from it, so rebranding is one edit rather than a sweep through the page
files. `public/assets/brand/` holds the wordmark, icons and share image.

## Configuration

Two environment variables, both optional. The site builds, runs and passes
`npm run check` without either; they only decide where the contact form
delivers and where its booking buttons point. See `.env.example`.

| Variable | Effect when unset |
| --- | --- |
| `FORMSPREE_FORM_ID` | `POST /api/contact` answers 503 and tells the visitor to email instead. It never reports a submission as sent when it was not. |
| `NEXT_PUBLIC_CALENDAR_BOOKING_URL` | The "Let's Talk" buttons fall back to `/contact` and withhold `target="_blank"`. |

Submissions are validated, length-capped and relayed to Formspree by
`app/api/contact/route.ts`. Nothing is stored: no database, no submission log.
`src/lib/contact-validation.ts` holds the field rules and the spam checks, and
comments there explain which signals reject a submission outright and which are
only logged — the split exists because a false rejection silently loses a real
enquiry.

## Provenance

The clone's history -- what was captured from where, and which Webflow
interactions were reverse-engineered -- is kept in `docs/research/` and in the
`scripts/` QA harness. Those paths still carry the original template's
identifier because they name where the code came from, not whose site it is.

## Old URLs

The site was a 25-route agency template before it became a three-route
portfolio, and search engines still hold those URLs. They are answered in
`next.config.ts`, in two groups:

| Old URL | Response |
| --- | --- |
| `/about`, `/pricing`, `/case-studies`, `/blogs` | 301 to the homepage section that now carries that content: `/#about`, `/#pricing`, `/#featured-work`, `/#notes` |
| `/services`, `/style-guide`, `/licenses`, `/changelog` and their children, the template's 5 case studies and 6 blog posts | 410 Gone, via `app/gone/route.ts` |

The first group moved: the route reduction folded that content into homepage
sections, so each redirect points at its actual successor. The second group is
gone -- the template's case studies for brands like Brew Blend and Glowskin and
its posts about KOC campaigns describe something that no longer exists here, and
no honest destination can be given them. 410 rather than 404 so crawlers drop
them sooner than they drop a merely missing page.

A URL that was never part of the template still returns an ordinary 404.
