import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/brand";
import { indexableRoutes } from "@/lib/routes";
import { liveArticles } from "@/lib/articles";

/**
 * sitemap.xml
 *
 * Built from `indexableRoutes` rather than from a literal list, so the sitemap
 * and the set of pages the site considers publishable are the same fact. The
 * URLs are then joined with the same `siteConfig.siteUrl` the canonical tags
 * use, so a sitemap URL and a canonical URL cannot disagree about the origin.
 *
 * Every entry is absolute, as the protocol requires, and `/404` never appears --
 * `app/gone/route.ts` and the 301 rules in `next.config.ts` handle the retired
 * template URLs, and none of them belongs in a list of pages worth crawling.
 *
 * `lastModified` is build time rather than a hardcoded date. The site is a
 * static build, so the deploy time is the only freshness claim it can actually
 * substantiate.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages = indexableRoutes.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? siteConfig.siteUrl : `${siteConfig.siteUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // Only articles that are currently live appear; scheduled/draft ones are
  // hidden and must not be advertised to crawlers.
  const articlePages = liveArticles().map((a) => ({
    url: `${siteConfig.siteUrl}/writing/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  return [...pages, ...articlePages];
}
