import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/brand";

/**
 * sitemap.xml
 *
 * Built from the same `siteConfig.siteUrl` the canonical URLs use, so the two
 * cannot drift. Every URL is absolute, as the protocol requires.
 *
 * `/404` is deliberately absent: a not-found page has no content to index and
 * listing it invites a crawler to index an error.
 *
 * `lastModified` is the build time rather than a hardcoded date, so the sitemap
 * does not claim a freshness the site cannot substantiate. The homepage is
 * weighted highest because it is the whole site; `/contact` is lower priority
 * but still indexable, since a "contact" query is a real one.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: siteConfig.siteUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteConfig.siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];
}