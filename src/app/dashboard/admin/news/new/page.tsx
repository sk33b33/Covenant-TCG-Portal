import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { ArticleForm } from "@/components/dashboard/ArticleForm";

export const metadata: Metadata = {
  title: "New article",
  robots: { index: false },
};

export default function NewArticlePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-parchment">New article</h1>
      <Card className="mt-6 p-6">
        <ArticleForm article={null} />
      </Card>
    </div>
  );
}
