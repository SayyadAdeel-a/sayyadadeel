import Link from "next/link";
import { readFileSync } from "fs";
import { join } from "path";

function readJson(filename: string): any[] {
  return JSON.parse(readFileSync(join(process.cwd(), "data", "seo", filename), "utf8"));
}

export default function DashboardOverview() {
  const blog = readJson("blog.json");
  const useCases = readJson("use-cases.json");
  const glossary = readJson("glossary.json");
  const comparisons = readJson("comparisons.json");

  const stats = [
    { label: "Blog Posts", count: blog.length, href: "/dashboard/blog", color: "#c8ff00" },
    { label: "Use Cases", count: useCases.length, href: "/dashboard/use-cases", color: "#121212" },
    { label: "Glossary Terms", count: glossary.length, href: "/dashboard/glossary", color: "#666666" },
    { label: "Comparisons", count: comparisons.length, href: "/dashboard/compare", color: "#999999" },
  ];

  return (
    <div>
      <h1 className="mb-2 font-instrument-serif text-[32px] tracking-[-0.96px] text-[#121212]">
        Dashboard
      </h1>
      <p className="mb-8 text-[15px] text-black/50">
        Manage your site content, blog posts, and SEO pages.
      </p>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-[16px] border border-black/[0.06] bg-white p-6 transition-colors hover:border-black/10"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="size-3 rounded-full" style={{ backgroundColor: stat.color }} />
              <span className="font-tight text-[13px] text-black/40">{stat.label}</span>
            </div>
            <p className="font-instrument-serif text-[36px] tracking-[-1.08px] text-[#121212]">
              {stat.count}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Blog Posts */}
        <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-lato text-[13px] font-bold uppercase tracking-[0.5px] text-black/40">
              Recent Blog Posts
            </h2>
            <Link href="/dashboard/blog" className="font-tight text-[13px] text-black/40 hover:text-[#121212]">
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {blog.slice(0, 5).map((post: any) => (
              <Link
                key={post.slug}
                href={`/dashboard/blog?edit=${post.slug}`}
                className="flex items-center justify-between rounded-[8px] px-3 py-2 transition-colors hover:bg-black/[0.03]"
              >
                <span className="font-tight text-[14px] text-[#121212] line-clamp-1">{post.title}</span>
                <span className="shrink-0 font-tight text-[12px] text-black/30">{post.date}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
          <h2 className="mb-4 font-lato text-[13px] font-bold uppercase tracking-[0.5px] text-black/40">
            Quick Actions
          </h2>
          <div className="flex flex-col gap-2">
            <QuickAction href="/dashboard/blog?new=1" label="Create new blog post" />
            <QuickAction href="/dashboard/use-cases?new=1" label="Add new use case" />
            <QuickAction href="/dashboard/glossary?new=1" label="Add glossary term" />
            <QuickAction href="/dashboard/compare?new=1" label="Add comparison" />
            <QuickAction href="/dashboard/links" label="Manage navigation links" />
            <QuickAction href="/" label="View live site" external />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, label, external }: { href: string; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-black/[0.03]"
    >
      <span className="flex size-6 items-center justify-center rounded-[6px] bg-black/[0.04] text-[12px]">
        {external ? "↗" : "+"}
      </span>
      <span className="font-tight text-[14px] text-[#121212]">{label}</span>
    </a>
  );
}
