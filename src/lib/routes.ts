/**
 * The indexable route table.
 *
 * One declaration of what the site publishes, so "what is in the sitemap" and
 * "what the app can serve" are not two facts maintained separately. `app/sitemap.ts`
 * builds from `indexableRoutes`, and `scripts/verify-seo.mjs` walks the actual
 * `page.tsx` files and fails if a route exists that this table has not classified
 * either way -- an unlisted route would otherwise ship indexable without ever
 * reaching Search Console.
 *
 * `/404` is the only excluded route today. It is excluded because it returns
 * HTTP 404 by design and carries `noindex`; listing it would ask a crawler to
 * index an error page.
 *
 * Fragments are deliberately absent. The homepage sections (`#featured-work`,
 * `#notes`, `#process`) are real anchors and the redirects to them preserve the
 * hash, but Google treats a URL with a fragment as a different URL from one
 * without, and a sitemap entry for an anchor never gets its own result.
 */

/** The change frequencies Next accepts in `sitemap.xml`. */
export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type IndexableRoute = {
  /** Absolute path with a leading slash, no trailing slash, `/` for the root. */
  path: string;
  changeFrequency: ChangeFrequency;
  /**
   * 0.0-1.0. Search engines weight it lightly at best, but the homepage really
   * is the whole site and `/contact` really is secondary, so the numbers say so.
   */
  priority: number;
  /** One line on why this page is worth indexing. Checked against the metadata. */
  intent: string;
};

export const indexableRoutes: IndexableRoute[] = [
  {
    path: "/",
    changeFrequency: "monthly",
    priority: 1,
    intent:
      "The portfolio: selected work, notes, process and GitHub. Targets the name.",
  },
  {
    path: "/contact",
    changeFrequency: "yearly",
    priority: 0.6,
    intent: "\"contact\" is a real query with an intent this page answers directly.",
  },
];

/**
 * Page files that exist but must never appear in the sitemap, with the reason.
 *
 * A route listed here is still expected to return `noindex` in its own metadata;
 * this entry only keeps it out of the URL list. `verify-seo.mjs` checks both,
 * because either one alone is the safety net being half-built.
 */
export const excludedRoutes: Record<string, string> = {
  "/404": "Returns HTTP 404 by design and carries noindex.",
  "/docs":
    "API reference for the contact relay, surfaced only so /.well-known/api-catalog's service-doc link resolves. Carries noindex; it is not a page worth ranking.",
};
