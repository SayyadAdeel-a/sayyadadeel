import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/brand";

/**
 * robots.txt
 *
 * Served by hand rather than through `MetadataRoute.Robots` because that data
 * model cannot express arbitrary directives. The file otherwise keeps the exact
 * guarantees the old typed version made (and that `verify-seo` checks):
 *
 *   - every crawler allowed (a blanket `Disallow: /` is absent),
 *   - `/404` disallowed,
 *   - `Sitemap` and `Host` announced.
 *
 * The `Content-Signal` line is an emerging, optional convention: unknown
 * directives are ignored by conforming parsers, so it only adds information for
 * agents that understand it. It declares a policy for what AI systems may do
 * with this site's content (train, search, input) rather than leaving the
 * answer to be assumed.
 */
export const dynamic = "force-static";

const RULES = `User-agent: *
Content-Signal: ai-train=yes, search=yes, ai-input=yes
Allow: /
Disallow: /404

Sitemap: ${siteConfig.siteUrl}/sitemap.xml
Host: ${siteConfig.siteUrl}
`;

export function GET() {
  return new NextResponse(RULES, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
