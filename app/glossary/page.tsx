import type { Metadata } from "next";
import Link from "next/link";
import glossary from "@/data/seo/glossary.json";

export const metadata: Metadata = {
  title: "Environmental Fieldwork Glossary | Key Terms Explained",
  description: "Understand environmental fieldwork terminology — Phase I assessments, compliance, monitoring, data collection, and more.",
};

export default function GlossaryHub() {
  return (
    <main className="min-h-screen bg-[#f5f5f2]">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-sans text-[18px] font-semibold tracking-[-0.36px] text-[#121212]">
          Sayyad Adeel
        </Link>
        <div className="flex items-center gap-6 font-tight text-[14px] text-black/50">
          <Link href="/use-cases" className="hover:text-[#121212] transition-colors">Use Cases</Link>
          <Link href="/glossary" className="text-[#121212]">Glossary</Link>
          <Link href="/compare" className="hover:text-[#121212] transition-colors">Compare</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <nav className="mb-8 font-tight text-[13px] text-black/40">
          <Link href="/" className="hover:text-[#121212]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black/60">Glossary</span>
        </nav>

        <div className="relative mb-6 inline-flex items-center gap-2 border border-dashed border-black/10 px-4 py-2">
          <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-black/20" />
          <span className="absolute top-0 right-0 h-2 w-2 border-t border-r border-black/20" />
          <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-black/20" />
          <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-black/20" />
          <span className="text-sm">&#x2726;</span>
          <span className="font-lato text-[13px] font-bold tracking-[-0.39px] text-[#121212]">Glossary</span>
        </div>

        <h1 className="mb-4 font-instrument-serif text-[36px] leading-[1.1] tracking-[-1.08px] text-[#121212] md:text-[48px] md:tracking-[-1.44px]">
          Environmental Fieldwork Terms
        </h1>
        <p className="mb-12 text-[17px] leading-[1.7] tracking-[-0.34px] text-black/60">
          Clear definitions of the terminology used in environmental consulting, field data collection, and compliance reporting.
        </p>

        <div className="flex flex-col gap-3">
          {glossary.map((item) => (
            <Link
              key={item.slug}
              href={`/glossary/${item.slug}`}
              className="group flex items-center justify-between rounded-[12px] border border-black/[0.06] bg-white px-6 py-5 transition-colors hover:border-black/10"
            >
              <div>
                <h2 className="font-instrument-serif text-[20px] tracking-[-0.6px] text-[#121212]">
                  {item.h1}
                </h2>
                <p className="mt-1 text-[14px] leading-[1.5] text-black/40 line-clamp-1">
                  {item.definition}
                </p>
              </div>
              <svg className="size-[14px] shrink-0 text-black/30 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
