import "server-only";

import { prisma } from "@/lib/db";

const PAGE_SIZE = 9;

export async function listPublishedNews(page: number = 1) {
  const safePage = Math.max(1, page);
  const [articles, totalCount] = await Promise.all([
    prisma.newsArticle.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        heroImageUrl: true,
        category: true,
        publishedAt: true,
      },
    }),
    prisma.newsArticle.count({ where: { status: "PUBLISHED", publishedAt: { lte: new Date() } } }),
  ]);

  return { articles, totalCount, pageCount: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) };
}

export async function listLatestNews(limit = 3) {
  return prisma.newsArticle.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      slug: true,
      title: true,
      excerpt: true,
      heroImageUrl: true,
      category: true,
      publishedAt: true,
    },
  });
}

export async function getPublishedArticleBySlug(slug: string) {
  return prisma.newsArticle.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: { author: { select: { profile: { select: { displayName: true } } } } },
  });
}

// --- Admin (draft-inclusive) queries. Callers MUST have already checked
// requireAdmin() — this module applies no authorization itself. ---

export async function listAllNewsForAdmin() {
  return prisma.newsArticle.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
}

export async function getArticleByIdForAdmin(id: string) {
  return prisma.newsArticle.findUnique({ where: { id } });
}
