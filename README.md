# Relab — pixel-perfect clone

A Next.js clone of [<https://relab-template.webflow.io/>](https://relab-template.webflow.io/),
a Webflow template. All **25 published routes** are reproduced: the homepage,
nine static pages, `/changelog`, `/404`, and fourteen CMS detail pages (6 blog
posts, 5 case studies, 3 service pages).

```
npm install
npm run build && npm start          # http://localhost:3000
npm run dev                         # development
```

## How it is built

The reference is a Webflow export, so nothing here is hand-drawn. Every page is
**generated from captured source material**:

* the site's own stylesheet is imported **verbatim** as `app/webflow.css`
  (`app/globals.css` only adds Lenis's stylesheet and rewires the four Google
  font families that Webflow references by name);
* every asset — images, all 83 `srcset` candidates per page, videos, the
  favicon set — is downloaded and served locally;
* each page's markup is emitted as TSX components that keep every class name,
  Webflow hook attribute, inline style and text node exactly as captured,
  because the stylesheet depends on all of them;
* each page's animation payload is Webflow's own decoded IX (ix3) data, replayed
  by a faithful interpreter of the engine rather than hand-transcribed
  per page.

The three sections Webflow repeats on every page (header, CTA, footer) differ
only by which links it marked `aria-current="page"`, so they are three shared
components parameterised by the current path rather than 25 copies.

## Layout

```
app/                              one page file per route, each importing its
                                  own critical.css and its ix.json payload
src/components/sites/relab-0c02b053/
  <page-key>/                     that page's sections + interaction payload
  shared/SiteHeader|SiteCta|SiteFooter
  shared/PageInteractions.tsx     runtime entry point
  shared/ix/                      Webflow IX3 interpreter + widget layer
public/sites/relab-0c02b053/      local assets
docs/research/relab-0c02b053/    the auditable record: captured source,
                                  per-page research, and the QA report
scripts/                          the pipeline and the QA harnesses
```

## Documentation

Start with [`docs/research/relab-0c02b053/README.md`](docs/research/relab-0c02b053/README.md).

| Document | Contents |
| --- | --- |
| [PIPELINE.md](docs/research/relab-0c02b053/PIPELINE.md) | how a live route becomes components, assets and a route file |
| [IX3-ENGINE.md](docs/research/relab-0c02b053/IX3-ENGINE.md) | Webflow's interaction engine, reverse-engineered from its own bundle and verified against the live site |
| [PAGE_TOPOLOGY.md](docs/research/relab-0c02b053/PAGE_TOPOLOGY.md) | every route's sections, component mapping and payload size |
| [BEHAVIORS.md](docs/research/relab-0c02b053/BEHAVIORS.md) | the behaviour inventory, generated from the payloads |
| [QA_REPORT.md](docs/research/relab-0c02b053/QA_REPORT.md) | measured parity results |

## QA

The clone is checked against the live reference, not against a snapshot.

```bash
npm run build && npx next start --port 3100 &

npm run verify               # all 25 routes x 3 viewports: DOM, boxes, behaviour
npm run verify:navigation    # every internal link resolves
node scripts/verify-content.mjs   # every route's rendered text matches
node scripts/qa-pixels.mjs        # full-page pixel diff
node scripts/verify-homepage-after-navigation.mjs
```

Each harness opens the reference and the clone in the same browser at the same
viewport, drives the same interactions on both and compares the resulting DOM
state. Results are written to
`docs/research/relab-0c02b053/qa/report.json` and summarised in `QA_REPORT.md`.

## Notes

* The homepage (`src/components/sites/relab-0c02b053/root-8a5edab2/`) and its
  `shared/InteractionsRuntime.tsx` were completed first and are frozen; the
  pipeline never writes to that directory.
* `/404` renders the reference's 404 page but responds with HTTP 404, where the
  reference responds with 200. Next.js treats a `/404` route as its
  not-found boundary.
* The newsletter form posts to Webflow's live endpoint. The clone cannot reach
  it, so it reproduces the observable end state locally: form hidden, success
  message shown.