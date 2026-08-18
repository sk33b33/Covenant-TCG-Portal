import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { ArticleForm } from "@/components/dashboard/ArticleForm";
import { getArticleByIdForAdmin } from "@/lib/news";

export const metadata: Metadata = {
  title: "Edit article",
  robots: { index: false },
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleByIdForAdmin(id);
  if (!article) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-parchment">Edit article</h1>
      <Card className="mt-6 p-6">
        <ArticleForm article={article} />
      </Card>
    </div>
  );
}
