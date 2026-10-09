import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/brand";

/**
 * robots.txt
 *
 * The site is a three-route portfolio, so the sitemap is tiny and every route in
 * it is indexable. The 404 route is disallowed here *and* carries `noindex` in
 * its own metadata: the directive stops a crawler that reads this file, the
 * meta tag covers the ones that reach `/404` by typing it.
 *
 * `host` is emitted alongside `Sitemap` because some crawlers still read it.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/404"],
      },
    ],
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
    host: siteConfig.siteUrl,
  };
}