import type { Metadata } from "next";
import SiteHeader from "@/components/sites/adeel-site/shared/SiteHeader";
import SiteFooter from "@/components/sites/adeel-site/shared/SiteFooter";
import { liveArticles } from "@/lib/articles";
import { siteConfig } from "@/lib/brand";
import SectionLabel from "@/components/sites/adeel-site/shared/SectionLabel";
import "./articles.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Writing & Guides — Sayyad Adeel Ahmad | Web Dev & Automation",
  description:
    "Honest guides on hiring developers, building websites, and automation — written by freelance web developer Sayyad Adeel Ahmad.",
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
            <SectionLabel>Writing</SectionLabel>
            <h1>Writing</h1>
            <p className="text-default">
              Honest guides on hiring web developers, building websites, and
              automation — written in the open, from projects I have actually
              built. Each article answers a real question people ask before they
              commission work: what things cost, who to hire, when to build
              rather than buy, and where the hidden effort lives. No fluff, no
              jargon — just the straight version of how this work goes.
            </p>
            <p className="text-default">
              This section is for people on both sides of the decision. Business
              owners can use it to form a realistic budget and know what to ask
              for. Founders juggling tools versus custom builds can see when a
              template is enough and when it is not. And developers curious about
              turning a portfolio into paying projects can watch how the two
              sides connect.
            </p>
            <p className="text-default">
              New guides are published on a schedule, so it is worth checking
              back. If one helps you decide, the practical next step is simple:
              reach out. Everything here comes from real project experience, and
              that same experience is available for your own project. Whether you
              are planning your first site or scaling an existing product, the
              goal is the same: give you enough to make an informed decision.
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

          <div className="writing-index-cta">
            <h2 className="h4">Want help with your own build?</h2>
            <p className="text-default">
              I build websites and automation systems and give straight answers on
              what projects actually take. If you have a project in mind, let us
              talk.
            </p>
            <a
              btn-anim={"true"}
              data-wf--button--variant={"base"}
              data-wf-component-id={"90522a0b-8143-769f-2ad2-e28710708494"}
              data-wf-variant-state={"base"}
              href={"/contact"}
              className="button w-inline-block"
            >
              <div className="button-text-wrap">
                <div className="button-hover-text">Start a project</div>
                <div className="button-normal-text">Start a project</div>
              </div>
              <div className="button-icon-box">
                <div button-icon-anin-one={"ture"} className="button-icon-wrap">
                  <img
                    src={"/assets/shared/arrow-1.svg"}
                    loading={"lazy"}
                    alt={"Icon"}
                    className="button-icon"
                  />
                </div>
              </div>
            </a>
          </div>
        </div>
      </main>
      <SiteFooter currentPath={"/writing"} />
    </>
  );
}
