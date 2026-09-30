import type { Metadata } from "next";
import Link from "next/link";
import useCases from "@/data/seo/use-cases.json";

export const metadata: Metadata = {
  title: "FieldOS Use Cases | Environmental Fieldwork Software",
  description: "Explore how FieldOS serves environmental consulting, site inspections, construction monitoring, and more. Find the workflow that fits your team.",
  alternates: {
    canonical: "https://adeelsayyad.tech/use-cases",
  },
  openGraph: {
    title: "FieldOS Use Cases | Environmental Fieldwork Software",
    description: "Explore how FieldOS serves environmental consulting, site inspections, construction monitoring, and more.",
    url: "https://adeelsayyad.tech/use-cases",
  },
};

export default function UseCasesHub() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12 pb-24">
        <nav className="mb-8 font-tight text-[13px] text-black/40">
          <Link href="/" className="hover:text-[#121212]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black/60">Use Cases</span>
        </nav>

        <div className="relative mb-6 inline-flex items-center gap-2 border border-dashed border-black/10 px-4 py-2">
          <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-black/20" />
          <span className="absolute top-0 right-0 h-2 w-2 border-t border-r border-black/20" />
          <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-black/20" />
          <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-black/20" />
          <span className="text-sm">&#x2726;</span>
          <span className="font-lato text-[13px] font-bold tracking-[-0.39px] text-[#121212]">Use Cases</span>
        </div>

        <h1 className="mb-4 font-instrument-serif text-[36px] leading-[1.1] tracking-[-1.08px] text-[#121212] md:text-[48px] md:tracking-[-1.44px]">
          FieldOS for Every Workflow
        </h1>
        <p className="mb-12 text-[17px] leading-[1.7] tracking-[-0.34px] text-black/60">
          FieldOS adapts to how your team works. Explore use cases across environmental consulting, inspections, monitoring, and compliance.
        </p>

        <div className="flex flex-col gap-4">
          {useCases.map((item) => (
            <Link
              key={item.slug}
              href={`/use-cases/${item.slug}`}
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
  );
}
