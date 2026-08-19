import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

// Without this, Next.js tries to prerender /sitemap.xml at `next build`
// time (it's eligible for static generation since nothing here reads
// request data) — which means every production build would require live
// database connectivity, and a build-time DB hiccup would fail deploys for
// reasons unrelated to the actual code change. Rendering it per-request
// instead keeps build success independent of database reachability.
export const dynamic = "force-dynamic";

const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${appUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${appUrl}/news`, changeFrequency: "daily", priority: 0.8 },
    { url: `${appUrl}/leaderboards`, changeFrequency: "hourly", priority: 0.6 },
    { url: `${appUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${appUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const articles = await prisma.newsArticle.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    select: { slug: true, updatedAt: true },
  });

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${appUrl}/news/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...articleRoutes];
}
