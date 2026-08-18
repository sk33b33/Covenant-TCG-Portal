import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { getPublishedArticleBySlug } from "@/lib/news";

type PageParams = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: "News" };

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      images: article.heroImageUrl ? [article.heroImageUrl] : undefined,
    },
  };
}

export default async function NewsArticlePage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  return (
    <article>
      <Container className="max-w-3xl py-16">
        <div className="mb-4 flex items-center gap-3">
          {article.category ? <Badge tone="arcane">{article.category}</Badge> : null}
          {article.publishedAt ? (
            <time dateTime={article.publishedAt.toISOString()} className="text-sm text-faint">
              {article.publishedAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          ) : null}
        </div>
        <h1 className="font-display text-balance text-3xl text-parchment sm:text-4xl">
          {article.title}
        </h1>
        {article.author.profile ? (
          <p className="mt-3 text-sm text-muted">By {article.author.profile.displayName}</p>
        ) : null}

        {article.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.heroImageUrl}
            alt=""
            className="mt-8 w-full rounded-lg border border-line object-cover"
          />
        ) : null}

        <div className="prose-covenant mt-10">
          <ReactMarkdown>{article.body}</ReactMarkdown>
        </div>
      </Container>
    </article>
  );
}
