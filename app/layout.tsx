import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    url: "https://adeelsawyad.tech",
    siteName: "Sayyad Adeel",
    title: "Sayyad Adeel — Builder & AI Engineer",
    description:
      "I build AI-powered software for real-world problems. From environmental field operations to intelligent workflows.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sayyad Adeel — Builder & AI Engineer",
    description:
      "I build AI-powered software for real-world problems. From environmental field operations to intelligent workflows.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f5f5f2] text-[#121212]">
        {children}
      </body>
    </html>
  );
}
