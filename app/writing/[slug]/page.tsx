import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/sites/adeel-site/shared/SiteHeader";
import SiteFooter from "@/components/sites/adeel-site/shared/SiteFooter";
import { getArticle, isLive, type ArticleBlock } from "@/lib/articles";
import { siteConfig } from "@/lib/brand";
import "../articles.css";

export const dynamic = "force-dynamic";

function Block({ block }: { block: ArticleBlock }) {
  switch (block.t) {
    case "h2":
      return <h2>{block.x}</h2>;
    case "ul":
      return (
        <ul>
          {block.x.map((li, i) => (
            <li key={i}>{li}</li>
          ))}
        </ul>
      );
    case "quote":
      return <blockquote>{block.x}</blockquote>;
    default:
      return <p>{block.x}</p>;
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article || !isLive(article)) notFound();

  const date = new Date(article.publishedAt);
  const dateLabel = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <SiteHeader currentPath={"/writing"} />
      <main className="writing-article">
        <div className="w-layout-blockcontainer container w-container">
          <article className="article-shell">
            <header className="article-header">
              <div className="article-kicker">
                <span className="article-cluster">{article.cluster}</span>
              </div>
              <h1>{article.title}</h1>
              <div className="article-meta">
                <span>{dateLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{article.readingMinutes} min read</span>
              </div>
            </header>
            <div className="article-body">
              {article.body.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>
            <aside className="article-cta">
              <h2>Found this useful?</h2>
              <p>
                I build websites and automation systems and write honestly about
                what they actually take. If you have a project in mind, let us
                talk.
              </p>
              <a btn-anim={"true"} data-wf--button--variant={"base"} data-wf-component-id={"90522a0b-8143-769f-2ad2-e28710708494"} data-wf-variant-state={"base"} href={"/contact"} className="button w-inline-block">
                <div className="button-text-wrap">
                  <div className="button-hover-text">Start a conversation</div>
                  <div className="button-normal-text">Start a conversation</div>
                </div>
                <div className="button-icon-box">
                  <div button-icon-anin-one={"ture"} className="button-icon-wrap">
                    <img src={"/assets/shared/arrow-1.svg"} loading={"lazy"} alt={"Icon"} className="button-icon" />
                  </div>
                </div>
              </a>
            </aside>
          </article>
        </div>
      </main>
      <SiteFooter currentPath={"/writing"} />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article || !isLive(article)) {
    return { robots: { index: false, follow: false } };
  }
  const url = `${siteConfig.siteUrl}/writing/${article.slug}`;
  const ogImage = `${siteConfig.siteUrl}/assets/brand/og-image-1200x630.jpg`;
  return {
    title: article.title,
    description: article.meta,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.meta,
      url,
      type: "article",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@adeelsayyad",
      creator: "@adeelsayyad",
      title: article.title,
      description: article.meta,
      images: [ogImage],
    },
    authors: [{ name: siteConfig.owner }],
  };
}
