import type { NextConfig } from "next";

/**
 * Routes that used to exist on this domain and no longer do.
 *
 * The site was a 25-route Webflow template before it became a three-route
 * portfolio, and Google has the old URLs in its index. Search Console reported
 * 25 pages "Discovered - currently not indexed" and 4 "Page with redirect" at
 * the time of writing, so those URLs are still being crawled on every pass.
 *
 * They fall into two groups, and the distinction is the whole point:
 *
 *   - **Moved.** The route reduction did not delete this content, it folded it
 *     into a section of the homepage. `/about` became the hero intro, `/pricing`
 *     the pricing section, and so on. Those deserve a 301: the destination
 *     genuinely answers the same intent, and passing the small amount of equity
 *     they hold to the page that replaced them is the point of a redirect.
 *
 *   - **Gone.** The template's agency content -- case studies for brands like
 *     Brew Blend and Glowskin, blog posts about KOC campaigns, a style guide, a
 *     licence page. None of it describes this person or this work, and none of
 *     it is coming back. Redirecting it anywhere would be a lie to both Google
 *     and to anyone who follows an old link, so these return 410 Gone, which
 *     tells a crawler to stop asking sooner than a 404 does.
 *
 * Nothing here invents a destination. `/services` has no honest successor --
 * the homepage has a capabilities section but no anchor for it -- so it is in
 * the gone group rather than being pointed at a loose approximation.
 */

/** Old URL -> the homepage section that now carries that content. */
const MOVED = [
  { from: "/about", to: "/#about" },
  { from: "/pricing", to: "/#pricing" },
  { from: "/case-studies", to: "/#featured-work" },
  { from: "/blogs", to: "/#notes" },
] as const;

/**
 * Old URLs with no successor.
 *
 * The nested ones are the template's own articles and case studies; they were
 * never going to survive a rebrand and were not written by this site's owner.
 */
const GONE = [
  "/services",
  "/services/campaign-management",
  "/services/creator-partnerships",
  "/services/short-form-video-production",
  "/style-guide",
  "/licenses",
  "/changelog",
  "/case-studies/brew-blend-launch",
  "/case-studies/glowskin-launch",
  "/case-studies/movefit-challenge",
  "/case-studies/nova-ai-assistant",
  "/case-studies/urban-streetwear",
  "/blogs/behind-every-high-performing-influencer-campaign",
  "/blogs/choosing-the-right-kocs-for-your-next-campaign",
  "/blogs/how-to-work-viewers-in-the-first-3-seconds",
  "/blogs/short-video-trends-that-will-dominate-this-year",
  "/blogs/turning-creator-content-into-brand-growth",
  "/blogs/what-consumers-actually-want-to-watch-today",
] as const;

const nextConfig: NextConfig = {
  async redirects() {
    return MOVED.map(({ from, to }) => ({
      source: from,
      destination: to,
      // 301 rather than `permanent: true`, which Next emits as 308. Both are
      // permanent and Google consolidates signals for either, but 308 preserves
      // the request method and 301 is the code every crawler, redirect checker
      // and SEO report actually recognises. For GET-only page URLs there is
      // nothing method-preserving to protect, so 301 costs nothing and reads
      // correctly in Search Console.
      statusCode: 301,
    }));
  },

  async rewrites() {
    // One handler answers every dead URL, so the 410 body and its navigation
    // live in a single place rather than being restated per route.
    //
    // Listed as an array of single-source rules rather than one rule with an
    // array `source`: Next only accepts a `source` array in this flat form, and
    // one rule per URL is easier to read in `.next/routes-manifest.json`.
    return GONE.map((from) => ({ source: from, destination: "/gone" }));
  },
};

export default nextConfig;