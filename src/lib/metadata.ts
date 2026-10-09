/**
 * Shared metadata builders.
 *
 * Next merges a route's `metadata` over the root layout's, field by field, but
 * `openGraph` and `twitter` are replaced wholesale rather than deep-merged. So a
 * route that sets only `openGraph.title` would silently lose the image and the
 * site name. Building both objects from one function is what keeps every route
 * carrying the full set.
 *
 * Each route therefore declares only what is genuinely its own -- a title, a
 * description, a path -- and inherits the rest.
 */
import type { Metadata } from "next";
import { siteConfig } from "./brand";

const OG_TYPE = "website";

type RouteMeta = {
  title: string;
  description: string;
  /** Absolute path, with a leading slash and no trailing slash. */
  path: string;
  /** Suppress indexing for the not-found page. */
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  noIndex = false,
}: RouteMeta): Metadata {
  const url = `${siteConfig.siteUrl}${path === "/" ? "" : path}`;
  const ogImage = `${siteConfig.siteUrl}/assets/brand/og-image-1200x630.jpg`;

  return {
    title,
    description,
    keywords: [...siteConfig.keywords],
    authors: [{ name: siteConfig.owner, url: siteConfig.siteUrl }],
    creator: siteConfig.owner,
    publisher: siteConfig.owner,
    applicationName: siteConfig.name,
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    formatDetection: { telephone: false, email: false, address: false },
    category: "technology",
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: OG_TYPE,
      url,
      siteName: siteConfig.name,
      title,
      description,
      locale: siteConfig.locale,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.fullName} — learning, building, experimenting and following curiosity into real projects.`,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@adeelsayyad",
      creator: "@adeelsayyad",
      title,
      description,
      images: [ogImage],
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/assets/brand/icon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/assets/brand/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/assets/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/assets/brand/apple-touch-icon.png", sizes: "180x180" }],
    },
    // Must match the filename Next generates from `app/manifest.ts`, which is
    // `manifest.webmanifest`. Pointing at `site.webmanifest` produces a link tag
    // to a URL that 404s, and browsers fall back to guessing the manifest.
    manifest: "/manifest.webmanifest",
    other: {
      "og:site_name": siteConfig.name,
      "og:locale": siteConfig.locale,
      "twitter:site": "@adeelsayyad",
    },
    robots: noIndex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

/**
 * JSON-LD describing the site owner.
 *
 * Emitted once from the root layout. A `Person` node with `sameAs` is what lets
 * a search engine or a rich-result panel connect the site to his real profiles
 * instead of treating it as an anonymous blog.
 */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    // The WebSite node below and the <link rel="author"> in the layout both
    // point at this, which is what ties the site to the person rather than
    // leaving two unrelated nodes.
    "@id": `${siteConfig.siteUrl}/#person`,
    name: siteConfig.fullName,
    alternateName: [siteConfig.name, siteConfig.shortName],
    url: siteConfig.siteUrl,
    jobTitle: siteConfig.role,
    description: siteConfig.description,
    sameAs: [
      siteConfig.links.github,
      siteConfig.links.linkedin,
      siteConfig.links.instagram,
    ],
  };
}

/** JSON-LD for the site itself: a WebSite node plus the search action. */
export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: siteConfig.fullName,
    url: siteConfig.siteUrl,
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    publisher: { "@id": `${siteConfig.siteUrl}/#person` },
  };
}