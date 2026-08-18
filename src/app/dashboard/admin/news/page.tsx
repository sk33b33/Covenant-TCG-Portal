import type { Metadata } from "next";
import Link from "next/link";
import { listAllNewsForAdmin } from "@/lib/news";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/DataStates";

export const metadata: Metadata = {
  title: "Manage news",
  robots: { index: false },
};

export default async function AdminNewsListPage() {
  const articles = await listAllNewsForAdmin();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-parchment">Manage news</h1>
        <Button href="/dashboard/admin/news/new">New article</Button>
      </div>

      {articles.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No articles yet" description="Create your first announcement." />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Card className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/admin/news/${article.id}`}
                    className="font-medium text-parchment hover:text-gold-bright"
                  >
                    {article.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-faint">/news/{article.slug}</p>
                </div>
                <Badge tone={article.status === "PUBLISHED" ? "success" : "neutral"}>
                  {article.status === "PUBLISHED" ? "Published" : "Draft"}
                </Badge>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
