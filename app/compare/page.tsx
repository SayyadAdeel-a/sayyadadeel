import type { Metadata } from "next";
import Link from "next/link";
import comparisons from "@/data/seo/comparisons.json";

export const metadata: Metadata = {
  title: "FieldOS Comparisons | See How FieldOS Compares",
  description: "Compare FieldOS with other field data collection and environmental software platforms. Feature comparisons and recommendations.",
  alternates: {
    canonical: "https://adeelsayyad.tech/compare",
  },
  openGraph: {
    title: "FieldOS Comparisons | See How FieldOS Compares",
    description: "Compare FieldOS with other field data collection and environmental software platforms.",
    url: "https://adeelsayyad.tech/compare",
  },
};

export default function CompareHub() {
  return (
    <main className="min-h-screen bg-[#f5f5f2]">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-sans text-[18px] font-semibold tracking-[-0.36px] text-[#121212]">
          Sayyad Adeel
        </Link>
        <div className="flex items-center gap-6 font-tight text-[14px] text-black/50">
          <Link href="/use-cases" className="hover:text-[#121212] transition-colors">Use Cases</Link>
          <Link href="/glossary" className="hover:text-[#121212] transition-colors">Glossary</Link>
          <Link href="/compare" className="text-[#121212]">Compare</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <nav className="mb-8 font-tight text-[13px] text-black/40">
          <Link href="/" className="hover:text-[#121212]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black/60">Compare</span>
        </nav>

        <div className="relative mb-6 inline-flex items-center gap-2 border border-dashed border-black/10 px-4 py-2">
          <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-black/20" />
          <span className="absolute top-0 right-0 h-2 w-2 border-t border-r border-black/20" />
          <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-black/20" />
          <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-black/20" />
          <span className="text-sm">&#x2726;</span>
          <span className="font-lato text-[13px] font-bold tracking-[-0.39px] text-[#121212]">Compare</span>
        </div>

        <h1 className="mb-4 font-instrument-serif text-[36px] leading-[1.1] tracking-[-1.08px] text-[#121212] md:text-[48px] md:tracking-[-1.44px]">
          FieldOS vs The Competition
        </h1>
        <p className="mb-12 text-[17px] leading-[1.7] tracking-[-0.34px] text-black/60">
          Honest comparisons to help you choose the right field data collection platform for your environmental workflows.
        </p>

        <div className="flex flex-col gap-4">
          {comparisons.map((item) => (
            <Link
              key={item.slug}
              href={`/compare/${item.slug}`}
              className="group rounded-[16px] border border-black/[0.06] bg-white p-6 transition-colors hover:border-black/10"
            >
              <h2 className="mb-2 font-instrument-serif text-[22px] tracking-[-0.66px] text-[#121212]">
                {item.title}
              </h2>
              <p className="text-[15px] leading-[1.6] text-black/50">
                {item.intro}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
