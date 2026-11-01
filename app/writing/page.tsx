import type { Metadata } from "next";
import SiteHeader from "@/components/sites/adeel-site/shared/SiteHeader";
import SiteFooter from "@/components/sites/adeel-site/shared/SiteFooter";
import { liveArticles } from "@/lib/articles";
import { siteConfig } from "@/lib/brand";
import "./articles.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Writing & Guides — Sayyad Adeel Ahmad | Web Dev & Automation",
  description:
    "Honest guides on hiring developers, building websites, and automation — written by Sayyad Adeel Ahmad, a developer who learns by building.",
  alternates: { canonical: `${siteConfig.siteUrl}/writing` },
};

export default function WritingIndex() {
  const posts = liveArticles();

  return (
    <>
      <SiteHeader currentPath={"/writing"} />
      <main className="writing-index">
        <div className="w-layout-blockcontainer container w-container">
          <header className="writing-index-header">
            <h1>Writing</h1>
            <p className="text-default">
              Honest guides on hiring web developers, building websites, and
              automation — written in the open, from projects I have actually
              built. Each article answers a question people ask before they
              commission work: what things cost, who to hire, when to build
              rather than buy, and where the hidden effort really lives.
            </p>
            <p className="text-default">
              New guides are published on a schedule. If one helps you decide,
              the practical next step is simple: reach out. Every guide here
              comes from real project experience, and that same experience is
              available for your project.
            </p>
          </header>

          {posts.length === 0 ? (
            <div className="writing-empty">
              <p className="text-default">
                Articles are being written and will appear here on a schedule.
                Come back soon.
              </p>
            </div>
          ) : (
            <div className="writing-list">
              {posts.map((post) => (
                <a key={post.slug} href={`/writing/${post.slug}`} className="writing-card">
                  <div className="writing-card-kicker">
                    <span className="article-cluster">{post.cluster}</span>
                    <span>{post.readingMinutes} min read</span>
                  </div>
                  <h2>{post.title}</h2>
                  <p className="text-default">{post.meta}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter currentPath={"/writing"} />
    </>
  );
}
