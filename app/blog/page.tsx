import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog — Building in Public",
  description:
    "What I'm building, experiments with AI, design and build workflows, lessons from project work — written when there's something real to say.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog — Building in Public | Sayyad Adeel",
    description:
      "What I'm building, experiments with AI, and lessons from building with modern tools.",
    url: "/blog",
  },
};

export default function BlogHub() {
  const posts = getPosts();

  return (
    <section className="mx-auto max-w-3xl px-6 py-12 pb-24">
      <nav className="mb-8 font-tight text-[13px] text-black/40">
        <Link href="/" className="hover:text-[#121212]">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-black/60">Blog</span>
      </nav>

      <div className="relative mb-6 inline-flex items-center gap-2 border border-dashed border-black/10 px-4 py-2">
        <span className="absolute top-0 left-0 h-2 w-2 border-t border-l border-black/20" />
        <span className="absolute top-0 right-0 h-2 w-2 border-t border-r border-black/20" />
        <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-black/20" />
        <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-black/20" />
        <span className="text-sm">&#x2726;</span>
        <span className="font-lato text-[13px] font-bold tracking-[-0.39px] text-[#121212]">Blog</span>
      </div>

      <h1 className="mb-4 font-instrument-serif text-[36px] leading-[1.1] tracking-[-1.08px] text-[#121212] md:text-[48px] md:tracking-[-1.44px]">
        Building in public
      </h1>
      <p className="mb-12 text-[17px] leading-[1.7] tracking-[-0.34px] text-black/60">
        What I&apos;m making, experiments with AI and agents, design/build workflows,
        and lessons from project work. An intentionally small blog — written when
        there&apos;s something real to say.
      </p>

      {posts.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-black/10 bg-white/50 p-10 text-center">
          <p className="mb-2 font-instrument-serif text-[22px] tracking-[-0.66px] text-[#121212]">
            Nothing published yet.
          </p>
          <p className="text-[15px] leading-[1.6] text-black/50">
            Notes on building, AI workflows, and design are on the way. In the
            meantime, the <Link href="/#work" className="underline decoration-black/20 underline-offset-4 hover:text-[#121212]">work</Link> speaks for itself.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-[16px] border border-black/[0.06] bg-white p-6 transition-colors hover:border-black/10"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="font-lato text-[12px] font-bold uppercase tracking-[0.5px] text-black/40">
                  {post.category}
                </span>
                <span className="text-black/20">|</span>
                <span className="font-tight text-[13px] text-black/40">
                  {post.readTime}
                </span>
              </div>
              <h2 className="mb-2 font-instrument-serif text-[22px] tracking-[-0.66px] text-[#121212]">
                {post.h1}
              </h2>
              <p className="text-[15px] leading-[1.6] text-black/50">
                {post.excerpt}
              </p>
              <div className="mt-4 flex items-center gap-1.5 font-tight text-[14px] font-medium text-black/60 transition-colors group-hover:text-[#121212]">
                Read more
                <svg className="size-[14px] transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
