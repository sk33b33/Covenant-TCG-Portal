import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { NewsCard } from "@/components/news/NewsCard";
import { EmptyState } from "@/components/ui/DataStates";
import { Button } from "@/components/ui/Button";
import { listPublishedNews } from "@/lib/news";

export const metadata: Metadata = {
  title: "News",
  description: "Official announcements and development updates for Covenant.",
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { articles, pageCount } = await listPublishedNews(page);

  return (
    <Container className="py-16">
      <h1 className="font-display text-4xl text-parchment">News</h1>
      <p className="mt-2 max-w-xl text-muted">
        Official announcements and development updates, straight from the Covenant team.
      </p>

      {articles.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No news yet"
            description="Check back soon — announcements will appear here as soon as they're published."
          />
        </div>
      ) : (
        <>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <NewsCard key={article.slug} article={article} />
            ))}
          </div>

          {pageCount > 1 ? (
            <nav
              className="mt-10 flex items-center justify-center gap-2"
              aria-label="News pagination"
            >
              {page > 1 ? (
                <Button href={`/news?page=${page - 1}`} variant="secondary" size="md">
                  ← Newer
                </Button>
              ) : null}
              <span className="px-3 text-sm text-muted">
                Page {page} of {pageCount}
              </span>
              {page < pageCount ? (
                <Button href={`/news?page=${page + 1}`} variant="secondary" size="md">
                  Older →
                </Button>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </Container>
  );
}
