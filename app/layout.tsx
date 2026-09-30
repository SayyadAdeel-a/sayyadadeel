import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, Instrument_Serif, Lato } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

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
  metadataBase: new URL("https://adeelsayyad.tech"),
  title: {
    default: "Sayyad Adeel — Independent Builder & Designer",
    template: "%s | Sayyad Adeel",
  },
  description:
    "I design and build digital experiences with AI — websites, products, and experiments. Currently building Sayyad Studio.",
  keywords: [
    "Sayyad Adeel",
    "independent builder",
    "web designer",
    "AI-assisted development",
    "Sayyad Studio",
    "creative technologist",
    "portfolio",
  ],
  authors: [{ name: "Sayyad Adeel" }],
  creator: "Sayyad Adeel",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Sayyad Adeel",
    title: "Sayyad Adeel — Independent Builder & Designer",
    description:
      "I design and build digital experiences with AI — websites, products, and experiments. Currently building Sayyad Studio.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Sayyad Adeel — Independent Builder & Designer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sayyad Adeel — Independent Builder & Designer",
    description:
      "I design and build digital experiences with AI — websites, products, and experiments.",
    images: ["/opengraph-image"],
  },
  robots: {
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
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Sayyad Adeel",
    url: "https://adeelsayyad.tech",
    jobTitle: "Independent Builder & Designer",
    description:
      "Designs and builds digital experiences with AI — websites, products, and experiments. Currently building Sayyad Studio.",
    knowsAbout: [
      "Web design",
      "UI/UX",
      "AI-assisted development",
      "AI agents",
      "Automation",
      "Motion design",
      "Rapid prototyping",
      "Digital products",
    ],
    sameAs: ["https://github.com/adeelsayyad"],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sayyad Adeel",
    url: "https://adeelsayyad.tech",
    description:
      "Portfolio of Sayyad Adeel — independent builder designing and building digital experiences with AI.",
    author: { "@type": "Person", name: "Sayyad Adeel" },
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${instrumentSerif.variable} ${lato.variable} h-full antialiased`}
    >
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-G4C4YM1RPX"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-G4C4YM1RPX');`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-[#f5f5f2] text-[#121212]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
