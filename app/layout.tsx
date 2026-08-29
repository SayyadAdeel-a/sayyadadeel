import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Inter_Tight, Instrument_Serif, Lato } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f5f5f2",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Sayyad Adeel — Builder & AI Engineer",
    template: "%s | Sayyad Adeel",
  },
  description:
    "I build AI-powered software for real-world problems. From environmental field operations to intelligent workflows — I design and build tools that turn complicated work into simple systems.",
  keywords: [
    "Sayyad Adeel",
    "AI engineer",
    "software builder",
    "FieldOS",
    "environmental field operations",
    "web developer",
    "full-stack developer",
  ],
  authors: [{ name: "Sayyad Adeel" }],
  creator: "Sayyad Adeel",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://adeelsayyad.tech",
    siteName: "Sayyad Adeel",
    title: "Sayyad Adeel — Builder & AI Engineer",
    description:
      "I build AI-powered software for real-world problems. From environmental field operations to intelligent workflows.",
    images: [
      {
        url: "https://adeelsayyad.tech/og.png",
        width: 1200,
        height: 630,
        alt: "Sayyad Adeel — Builder & AI Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sayyad Adeel — Builder & AI Engineer",
    description:
      "I build AI-powered software for real-world problems. From environmental field operations to intelligent workflows.",
    images: ["https://adeelsayyad.tech/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://adeelsayyad.tech",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${interTight.variable} ${instrumentSerif.variable} ${lato.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/originkit/hero-20/building.webp" imageSizes="(max-width: 768px) 100vw, 50vw" />
        <link rel="preload" as="image" href="/originkit/hero-20/mobile-hero.webp" imageSizes="(max-width: 768px) 100vw, 50vw" />
      </head>
      <body className="min-h-full flex flex-col bg-[#f5f5f2] text-[#121212]">
        {children}
      </body>
    </html>
  );
}
