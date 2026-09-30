import type { MetadataRoute } from "next";
import useCases from "@/data/seo/use-cases.json";
import glossary from "@/data/seo/glossary.json";
import comparisons from "@/data/seo/comparisons.json";
import blogPosts from "@/data/seo/blog.json";

const BASE = "https://adeelsayyad.tech";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/use-cases`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/glossary`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const useCasePages: MetadataRoute.Sitemap = useCases.map((item) => ({
    url: `${BASE}/use-cases/${item.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const glossaryPages: MetadataRoute.Sitemap = glossary.map((item) => ({
    url: `${BASE}/glossary/${item.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const comparisonPages: MetadataRoute.Sitemap = comparisons.map((item) => ({
    url: `${BASE}/compare/${item.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages, ...useCasePages, ...glossaryPages, ...comparisonPages];
}
