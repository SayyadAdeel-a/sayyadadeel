import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import blogPosts from "@/data/seo/blog.json";

type BlogPost = (typeof blogPosts)[number];

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug) as BlogPost | undefined;
  if (!post) return {};
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    openGraph: { title: post.metaTitle, description: post.metaDescription },
    alternates: {
      canonical: `https://adeelsayyad.tech/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug) as BlogPost | undefined;
  if (!post) notFound();

  const relatedPosts = blogPosts.filter(
    (p) => post.relatedSlugs?.includes(p.slug) && p.slug !== post.slug
  ).slice(0, 2);

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.h1,
    description: post.metaDescription,
    author: { "@type": "Person", name: "Sayyad Adeel" },
    publisher: {
      "@type": "Organization",
      name: "Sayyad Adeel",
      url: "https://adeelsayyad.tech",
    },
    datePublished: post.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://adeelsayyad.tech/blog/${post.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="min-h-screen bg-[#f5f5f2]">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <Link href="/" className="font-sans text-[18px] font-semibold tracking-[-0.36px] text-[#121212]">
            Sayyad Adeel
          </Link>
          <div className="flex items-center gap-6 font-tight text-[14px] text-black/50">
            <Link href="/blog" className="hover:text-[#121212] transition-colors">Blog</Link>
            <Link href="/use-cases" className="hover:text-[#121212] transition-colors">Use Cases</Link>
            <Link href="/glossary" className="hover:text-[#121212] transition-colors">Glossary</Link>
            <Link href="/compare" className="hover:text-[#121212] transition-colors">Compare</Link>
          </div>
        </nav>

        <article className="mx-auto max-w-3xl px-6 pb-24">
          <nav className="mb-8 font-tight text-[13px] text-black/40">
            <Link href="/" className="hover:text-[#121212]">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-[#121212]">Blog</Link>
            <span className="mx-2">/</span>
            <span className="text-black/60">{post.title}</span>
          </nav>

          <div className="mb-6 flex items-center gap-3">
            <span className="font-lato text-[12px] font-bold uppercase tracking-[0.5px] text-[#c8ff00]">
              {post.category}
            </span>
            <span className="text-black/20">|</span>
            <time className="font-tight text-[13px] text-black/40" dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </time>
            <span className="text-black/20">|</span>
            <span className="font-tight text-[13px] text-black/40">
              {post.readTime}
            </span>
          </div>

          <h1 className="mb-6 font-instrument-serif text-[36px] leading-[1.1] tracking-[-1.08px] text-[#121212] md:text-[48px] md:tracking-[-1.44px]">
            {post.h1}
          </h1>

          <div className="prose prose-lg max-w-none">
            {post.content.split("\n\n").map((paragraph, i) => {
              if (paragraph.startsWith("## ")) {
                return (
                  <h2 key={i} className="mb-4 mt-12 font-instrument-serif text-[24px] tracking-[-0.72px] text-[#121212]">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
              }
              if (paragraph.startsWith("- ")) {
                const items = paragraph.split("\n").filter((l) => l.startsWith("- "));
                return (
                  <ul key={i} className="mb-6 flex flex-col gap-2">
                    {items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-[15px] leading-[1.6] text-black/60">
                        <span className="mt-1.5 size-[6px] shrink-0 rounded-full bg-[#c8ff00]" />
                        {item.replace("- ", "")}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (paragraph.match(/^\d+\./)) {
                const items = paragraph.split("\n").filter((l) => l.match(/^\d+\./));
                return (
                  <ol key={i} className="mb-6 flex flex-col gap-2 list-decimal list-inside">
                    {items.map((item, j) => (
                      <li key={j} className="text-[15px] leading-[1.6] text-black/60">
                        {item.replace(/^\d+\.\s*/, "")}
                      </li>
                    ))}
                  </ol>
                );
              }
              return (
                <p key={i} className="mb-6 text-[16px] leading-[1.7] text-black/60">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-16 mb-16 flex flex-col items-center gap-4 text-center">
            <a
              href="https://fieldos.adeelsayyad.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[46px] items-center gap-2 rounded-[36px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] px-8 text-[15px] font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-opacity hover:opacity-90"
            >
              Try FieldOS Free
              <svg className="size-[14px]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>

          {/* Related */}
          {relatedPosts.length > 0 && (
            <section>
              <h2 className="mb-4 font-lato text-[13px] font-bold uppercase tracking-[0.5px] text-black/40">
                Related Articles
              </h2>
              <div className="flex flex-col gap-3">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="group flex items-center justify-between rounded-[12px] border border-black/[0.06] bg-white px-6 py-4 transition-colors hover:border-black/10"
                  >
                    <div>
                      <span className="font-lato text-[11px] font-bold uppercase tracking-[0.5px] text-[#c8ff00]">
                        {related.category}
                      </span>
                      <span className="ml-3 font-tight text-[15px] text-[#121212]">{related.title}</span>
                    </div>
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
