"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ContentEditor, type FieldConfig } from "@/components/cms/content-editor";

const BLOG_FIELDS: FieldConfig[] = [
  { key: "slug", label: "URL Slug", type: "slug", required: true },
  { key: "title", label: "Title", type: "text", required: true },
  { key: "h1", label: "H1 Heading", type: "text", required: true },
  { key: "metaTitle", label: "Meta Title", type: "text" },
  { key: "metaDescription", label: "Meta Description", type: "textarea" },
  { key: "excerpt", label: "Excerpt", type: "textarea" },
  { key: "content", label: "Content (Markdown)", type: "textarea", placeholder: "Use ## for headings, - for lists, **bold**, *italic*" },
  { key: "category", label: "Category", type: "text" },
  { key: "readTime", label: "Read Time", type: "text", placeholder: "e.g. 8 min read" },
  { key: "date", label: "Publish Date", type: "date" },
];

interface BlogPost {
  slug: string;
  title: string;
  [key: string]: any;
}

export default function BlogManager() {
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");
  const isNew = searchParams.get("new") === "1";

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selected, setSelected] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (editSlug && posts.length) {
      const post = posts.find((p) => p.slug === editSlug);
      if (post) setSelected(post);
    }
  }, [editSlug, posts]);

  useEffect(() => {
    if (isNew) setSelected(null);
  }, [isNew]);

  const fetchPosts = async () => {
    const res = await fetch("/api/cms?type=blog");
    if (res.ok) {
      setPosts(await res.json());
    }
    setLoading(false);
  };

  const handleSave = async (data: any) => {
    const method = selected ? "PUT" : "POST";
    const res = await fetch("/api/cms", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "blog", slug: selected?.slug, data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Save failed");
    }
    await fetchPosts();
  };

  const handleDelete = async () => {
    if (!selected) return;
    const res = await fetch(`/api/cms?type=blog&slug=${selected.slug}`, { method: "DELETE" });
    if (res.ok) {
      setSelected(null);
      await fetchPosts();
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-instrument-serif text-[28px] tracking-[-0.84px] text-[#121212]">
            Blog Posts
          </h1>
          <p className="font-tight text-[14px] text-black/40">{posts.length} posts</p>
        </div>
        <button
          onClick={() => setSelected(null)}
          className="h-[38px] rounded-[10px] border border-black bg-[linear-gradient(180deg,#4d4d4d_0%,#0a0a0a_100%)] px-5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          + New Post
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* List */}
        <div className="flex flex-col gap-1 rounded-[16px] border border-black/[0.06] bg-white p-3">
          {loading ? (
            <p className="px-3 py-4 text-[13px] text-black/30">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="px-3 py-4 text-[13px] text-black/30">No posts yet</p>
          ) : (
            posts.map((post) => (
              <button
                key={post.slug}
                onClick={() => setSelected(post)}
                className={`flex flex-col items-start rounded-[8px] px-3 py-2.5 text-left transition-colors ${
                  selected?.slug === post.slug
                    ? "bg-black/[0.05]"
                    : "hover:bg-black/[0.02]"
                }`}
              >
                <span className="font-tight text-[13px] text-[#121212] line-clamp-1">{post.title}</span>
                <span className="font-tight text-[11px] text-black/30">{post.date} · {post.category}</span>
              </button>
            ))
          )}
        </div>

        {/* Editor */}
        <div className="rounded-[16px] border border-black/[0.06] bg-white p-6">
          <ContentEditor
            type="blog"
            item={selected}
            onSave={handleSave}
            onDelete={selected ? handleDelete : undefined}
            fields={BLOG_FIELDS}
          />
        </div>
      </div>
    </div>
  );
}
