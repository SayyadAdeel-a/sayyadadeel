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

/**
 * The homepage title and description, exported so the `<title>` and the
 * `ProfilePage` node that describes the same page cannot drift apart.
 *
 * The homepage's metadata lives in `app/layout.tsx` because `/` is the root
 * route and `app/page.tsx` does not declare its own, so without these constants
 * the title would be written in one file and repeated in another.
 */
export const HOME_TITLE = `${siteConfig.fullName} — Learning, Building & Experimenting`;
export const HOME_DESCRIPTION = siteConfig.description;

/** Absolute URL for a route path, `/` meaning the site root. */
function absoluteUrl(path: string): string {
  return `${siteConfig.siteUrl}${path === "/" ? "" : path}`;
}

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
    // Without this the node is anonymous and the `isPartOf` references from the
    // per-route page nodes below resolve to nothing -- Google links a graph
    // through `@id`, not by guessing that two nodes describe the same site.
    "@id": `${siteConfig.siteUrl}/#website`,
    name: siteConfig.name,
    alternateName: siteConfig.fullName,
    url: siteConfig.siteUrl,
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    publisher: { "@id": `${siteConfig.siteUrl}/#person` },
  };
}

/**
 * Per-route structured data.
 *
 * The root layout emits `Person` and `WebSite` once for every route. These add
 * the node describing *that* page, so each one carries its own `@id` and points
 * back at the site and the person rather than standing alone.
 *
 * Deliberately modest: this site earns no rich result from schema, so the only
 * job here is to make the graph unambiguous -- which page, which person, which
 * site. Nothing is asserted that is not visible on the page.
 *
 * `name` and `description` are passed in from the same values given to
 * `buildMetadata`, so the title tag and the structured data always agree.
 */
type PageJsonLd = {
  path: string;
  type: "ProfilePage" | "ContactPage";
  name: string;
  description: string;
};

export function pageJsonLd({ path, type, name, description }: PageJsonLd) {
  const url = absoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}/#page`,
    url,
    name,
    description,
    inLanguage: siteConfig.language,
    isPartOf: { "@id": `${siteConfig.siteUrl}/#website` },
    // One reference rather than `about` as well: for both node types the person
    // is the subject, and repeating it under two properties reads like padding.
    mainEntity: { "@id": `${siteConfig.siteUrl}/#person` },
  };
}