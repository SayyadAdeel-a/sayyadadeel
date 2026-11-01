import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/brand";

/**
 * /.well-known/api-catalog  (RFC 9727)
 *
 * Declares the site's API surface so an agent can discover it without guessing.
 * The catalog is only honest if every link resolves, so it points at two things
 * that are real:
 *
 *   - `service-desc` -> `/openapi.json`, the machine-readable OpenAPI document
 *     describing the one public endpoint (POST /api/contact), served as a static
 *     file from `public/`.
 *   - `service-doc` -> `/docs`, a short human-readable page for the same API.
 *
 * The anchor is the API base URL. `/api` is the prefix under which the relay
 * lives (the concrete operation is `/api/contact`).
 */
export const dynamic = "force-static";

const CATALOG = {
  linkset: [
    {
      anchor: `${siteConfig.siteUrl}/api`,
      "service-desc": [
        {
          href: `${siteConfig.siteUrl}/openapi.json`,
          type: "application/json",
        },
      ],
      "service-doc": [
        {
          href: `${siteConfig.siteUrl}/docs`,
          type: "text/html",
        },
      ],
    },
  ],
};

export function GET() {
  return new NextResponse(JSON.stringify(CATALOG, null, 2), {
    headers: { "content-type": "application/linkset+json; charset=utf-8" },
  });
}
