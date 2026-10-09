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

## Provenance

The clone's history -- what was captured from where, and which Webflow
interactions were reverse-engineered -- is kept in `docs/research/` and in the
`scripts/` QA harness. Those paths still carry the original template's
identifier because they name where the code came from, not whose site it is.
