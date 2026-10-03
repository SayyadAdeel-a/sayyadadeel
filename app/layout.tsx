import type { Metadata } from "next";
import {
  Averia_Sans_Libre,
  Geist,
  Hanken_Grotesk,
  Inter_Tight,
} from "next/font/google";
import "./webflow.css";
import "./globals.css";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

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

const SITE = "relab-0c02b053/root-8a5edab2";

/**
 * Absolute base for Open Graph / Twitter card URLs.
 *
 * Next resolves the relative `openGraph.images` and `icons` entries against this.
 * It was hardcoded to the reference site, so on any real deployment every share
 * image URL pointed at Webflow's CDN instead of ours. Set `NEXT_PUBLIC_SITE_URL`
 * in the deployment environment; the fallback keeps local builds working.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://relab-template.webflow.io";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Relab - Webflow HTML Website Template",
  description:
    "Build a modern and professional website with Relab, a polished Webflow template designed for showcasing services, case studies, blogs, and your brand.",
  icons: {
    icon: [
      {
        url: `/sites/${SITE}/6a97fefd59fd4ab25cf4dff3_Favicon.png`,
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: `/sites/${SITE}/6a97fefda3777e169510390b_Favicon.png`,
        sizes: "48x48",
        type: "image/png",
      },
      {
        url: `/sites/${SITE}/6a97fefd2d54802470f7e9e6_Favicon.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: `/sites/${SITE}/6a97fefdc7a2f616fcb1903a_Favicon.png`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: `/sites/${SITE}/6a97fefd1db1932cf683d363_Favicon.png`,
  },
  openGraph: {
    title: "Relab - Webflow HTML Website Template",
    description:
      "Build a modern and professional website with Relab, a polished Webflow template designed for showcasing services, case studies, blogs, and your brand.",
    images: [`/sites/${SITE}/6aad1684503d1bf2692ca802_Thumbnail.jpg`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${averiaSansLibre.variable} ${geist.variable} ${interTight.variable}`}
    >
      <body>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}