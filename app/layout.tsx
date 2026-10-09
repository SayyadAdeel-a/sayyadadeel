import type { Metadata, Viewport } from "next";
import {
  Averia_Sans_Libre,
  Geist,
  Hanken_Grotesk,
  Inter_Tight,
} from "next/font/google";
import "./webflow.css";
import "./globals.css";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { siteConfig } from "@/lib/brand";
import { buildMetadata, personJsonLd, webSiteJsonLd } from "@/lib/metadata";

// The source site loads these four families through Google's WebFont loader.
// next/font self-hosts the identical font files, so metrics and glyph shapes
// match the reference exactly.
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const averiaSansLibre = Averia_Sans_Libre({
  variable: "--font-averia-sans-libre",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

/**
 * Root metadata.
 *
 * `metadataBase` makes every relative URL in the metadata absolute, which is
 * what lets the share image resolve for LinkedIn, X, WhatsApp and Discord --
 * each of those scrapers needs an absolute https URL and silently drops a
 * relative one. Routes inherit this and override only their own fields via
 * `buildMetadata`.
 *
 * The homepage title and description live here because `/` is the root route and
 * its metadata is not defined in `app/page.tsx`.
 */
export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.fullName} — Learning, Building & Experimenting`,
  description: siteConfig.description,
  path: "/",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: siteConfig.themeColor,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const person = personJsonLd();
  const website = webSiteJsonLd();

  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${averiaSansLibre.variable} ${geist.variable} ${interTight.variable}`}
    >
      <head>
        {/* Structured data, emitted once. Keyed so React can dedupe them. */}
        <script
          type="application/ld+json"
          id="ld-person"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
        />
        <script
          type="application/ld+json"
          id="ld-website"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
        />
        {/* `@id` back-reference so the WebSite node resolves to the Person node. */}
        <link rel="author" href={`${siteConfig.siteUrl}/#person`} />
      </head>
      <body>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}