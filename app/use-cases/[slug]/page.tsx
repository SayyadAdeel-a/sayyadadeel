import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import useCases from "@/data/seo/use-cases.json";

type UseCase = (typeof useCases)[number];

export async function generateStaticParams() {
  return useCases.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = useCases.find((u) => u.slug === slug) as UseCase | undefined;
  if (!item) return {};
  return {
    title: item.metaTitle,
    description: item.metaDescription,
    openGraph: { title: item.metaTitle, description: item.metaDescription },
    alternates: {
      canonical: `https://adeelsayyad.tech/use-cases/${item.slug}`,
    },
  };
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = useCases.find((u) => u.slug === slug) as UseCase | undefined;
  if (!item) notFound();

  const relatedItems = useCases.filter(
    (u) => u.relatedTerms?.includes(item.slug) && u.slug !== item.slug
  ).slice(0, 3);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.h1,
    description: item.metaDescription,
    author: { "@type": "Person", name: "Sayyad Adeel" },
    publisher: {
      "@type": "Organization",
      name: "FieldOS",
      url: "https://fieldos.adeelsayyad.tech",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://adeelsayyad.tech/use-cases/${item.slug}`,
    },
  };

  const faqSchema = item.faq?.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: item.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <main className="min-h-screen bg-[#f5f5f2]">
        <article className="mx-auto max-w-3xl px-6 py-12 pb-24">
          {/* Breadcrumb */}
          <nav className="mb-8 font-tight text-[13px] text-black/40">
            <Link href="/" className="hover:text-[#121212]">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/use-cases" className="hover:text-[#121212]">Use Cases</Link>
            <span className="mx-2">/</span>
            <span className="text-black/60">{item.title}</span>
          </nav>

          {/* Badge */}
          <div className="relative mb-6 inline-flex items-center gap-2 border border-dashed border-black/10 px-4 py-2">
            <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-black/20" />
            <span className="absolute top-0 right-0 h-2 w-2 border-t border-r border-black/20" />
            <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-black/20" />
            <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-black/20" />
            <span className="text-sm">&#x2726;</span>
            <span className="font-lato text-[13px] font-bold tracking-[-0.39px] text-[#121212]">Use Case</span>
          </div>

          {/* H1 */}
          <h1 className="mb-6 font-instrument-serif text-[36px] leading-[1.1] tracking-[-1.08px] text-[#121212] md:text-[48px] md:tracking-[-1.44px]">
            {item.h1}
          </h1>

          {/* Intro */}
          <p className="mb-10 text-[17px] leading-[1.7] tracking-[-0.34px] text-black/60">
            {item.intro}
          </p>

          {/* Pain Points */}
          <section className="mb-12">
            <h2 className="mb-4 font-instrument-serif text-[24px] tracking-[-0.72px] text-[#121212]">
              The Challenge
            </h2>
            <ul className="flex flex-col gap-3">
              {item.painPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] leading-[1.6] text-black/60">
                  <span className="mt-1.5 size-[6px] shrink-0 rounded-full bg-[#c8ff00]" />
                  {point}
                </li>
              ))}
            </ul>
          </section>

          {/* Features */}
          <section className="mb-12">
            <h2 className="mb-4 font-instrument-serif text-[24px] tracking-[-0.72px] text-[#121212]">
              How FieldOS Helps
            </h2>
            <ul className="flex flex-col gap-3">
              {item.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] leading-[1.6] text-black/60">
                  <span className="mt-1.5 size-[6px] shrink-0 rounded-full bg-[#121212]" />
                  {feature}
                </li>
              ))}
            </ul>
          </section>

          {/* Use Case */}
          <section className="mb-12 rounded-[16px] border border-black/[0.06] bg-white p-8">
            <h2 className="mb-3 font-lato text-[13px] font-bold uppercase tracking-[0.5px] text-black/40">
              In Practice
            </h2>
            <p className="text-[16px] leading-[1.7] text-black/70">
              {item.useCase}
            </p>
          </section>

          {/* FAQ */}
          {item.faq?.length ? (
            <section className="mb-16">
              <h2 className="mb-6 font-instrument-serif text-[24px] tracking-[-0.72px] text-[#121212]">
                Frequently Asked Questions
              </h2>
              <div className="flex flex-col gap-4">
                {item.faq.map((faq, i) => (
                  <details key={i} className="group rounded-[16px] border border-black/[0.06] bg-white p-6">
                    <summary className="cursor-pointer font-tight text-[15px] font-medium text-[#121212] list-none flex items-center justify-between">
                      {faq.question}
                      <svg className="size-[14px] shrink-0 text-black/30 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </summary>
                    <p className="mt-4 text-[15px] leading-[1.7] text-black/60">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {/* CTA */}
          <div className="mb-16 flex flex-col items-center gap-4 text-center">
            <a
              href="https://fieldos.adeelsayyad.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[46px] items-center gap-2 rounded-[36px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] px-8 text-[15px] font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-opacity hover:opacity-90"
            >
              {item.cta}
              <svg className="size-[14px]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <Link href="/" className="font-tight text-[13px] text-black/40 hover:text-[#121212] transition-colors">
              or explore FieldOS features
            </Link>
          </div>

          {/* Related */}
          {relatedItems.length > 0 && (
            <section>
              <h2 className="mb-4 font-lato text-[13px] font-bold uppercase tracking-[0.5px] text-black/40">
                Related
              </h2>
              <div className="flex flex-col gap-3">
                {relatedItems.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/use-cases/${related.slug}`}
                    className="group flex items-center justify-between rounded-[12px] border border-black/[0.06] bg-white px-6 py-4 transition-colors hover:border-black/10"
                  >
                    <span className="font-tight text-[15px] text-[#121212]">{related.title}</span>
                    <svg className="size-[14px] text-black/30 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
    </>
  );
}
