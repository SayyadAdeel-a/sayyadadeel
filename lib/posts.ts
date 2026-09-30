import { readFileSync } from "fs";
import { join } from "path";

export interface Post {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  content: string;
  relatedSlugs?: string[];
}

export function getPosts(): Post[] {
  try {
    const raw = readFileSync(join(process.cwd(), "data", "blog", "posts.json"), "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is Post =>
        typeof p?.slug === "string" &&
        typeof p?.title === "string" &&
        typeof p?.content === "string"
    );
  } catch {
    return [];
  }
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}
