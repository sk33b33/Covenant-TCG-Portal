import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export type NewsCardArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  publishedAt: Date | null;
  heroImageUrl?: string | null;
};

export function NewsCard({ article }: { article: NewsCardArticle }) {
  return (
    <Card className="group relative flex h-full flex-col overflow-hidden p-5 transition-colors hover:border-gold/50">
      {article.heroImageUrl ? (
        // Plain <img>, not next/image: hero URLs are admin-supplied and
        // arbitrary, so routing them through Next's image optimizer would
        // mean the server fetching a URL an admin (or a compromised admin
        // account) chose — a self-inflicted SSRF surface not worth the
        // optimization for user-supplied URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.heroImageUrl}
          alt=""
          className="-mx-5 -mt-5 mb-4 h-36 w-[calc(100%+2.5rem)] object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="mb-3 flex items-center gap-2">
        {article.category ? <Badge tone="arcane">{article.category}</Badge> : null}
        {article.publishedAt ? (
          <time dateTime={article.publishedAt.toISOString()} className="text-xs text-faint">
            {article.publishedAt.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        ) : null}
      </div>
      <h3 className="font-display text-lg text-parchment group-hover:text-gold-bright">
        <Link href={`/news/${article.slug}`} className="after:absolute after:inset-0">
          {article.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{article.excerpt}</p>
      <span className="mt-4 text-sm font-medium text-gold">Read more →</span>
    </Card>
  );
}
