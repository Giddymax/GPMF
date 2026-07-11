import type { MetadataRoute } from "next";

import { getPublishedPosts } from "@/lib/data/public";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://grainypalacefinancial.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();

  const staticRoutes = [
    "",
    "/about",
    "/products",
    "/products/savings",
    "/products/daily-susu",
    "/products/fixed-deposit",
    "/products/loans",
    "/apply",
    "/news",
    "/contact",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const newsRoutes = posts.map((post) => ({
    url: `${SITE_URL}/news/${post.slug}`,
    lastModified: post.published_at ? new Date(post.published_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...newsRoutes];
}
