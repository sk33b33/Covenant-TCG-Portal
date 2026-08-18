"use client";

import { useActionState } from "react";
import { createArticleAction, updateArticleAction, deleteArticleAction } from "@/lib/actions/admin-news";
import { initialActionState, type ActionState } from "@/lib/actions/types";
import { FieldGroup, FieldErrors, Input, Label, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";
import { Button } from "@/components/ui/Button";

type ArticleDefaults = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string | null;
  heroImageUrl: string | null;
  status: "DRAFT" | "PUBLISHED";
};

export function ArticleForm({ article }: { article: ArticleDefaults | null }) {
  const action = article?.id
    ? (updateArticleAction.bind(null, article.id) as (
        prevState: ActionState,
        formData: FormData,
      ) => Promise<ActionState>)
    : createArticleAction;

  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormMessage status="error" message={state.status === "error" ? state.message : undefined} />
      <FormMessage
        status="success"
        message={state.status === "success" ? state.message : undefined}
      />

      <FieldGroup className="mb-0">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={article?.title} required maxLength={160} />
        <FieldErrors errors={state.fieldErrors?.title} />
      </FieldGroup>

      <FieldGroup className="mb-0">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" defaultValue={article?.slug} required maxLength={160} />
        <p className="mt-1.5 text-xs text-faint">Lowercase letters, numbers, and hyphens only.</p>
        <FieldErrors errors={state.fieldErrors?.slug} />
      </FieldGroup>

      <FieldGroup className="mb-0">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={article?.excerpt} required maxLength={280} />
        <FieldErrors errors={state.fieldErrors?.excerpt} />
      </FieldGroup>

      <FieldGroup className="mb-0">
        <Label htmlFor="body">Body (Markdown)</Label>
        <Textarea id="body" name="body" rows={12} defaultValue={article?.body} required />
        <FieldErrors errors={state.fieldErrors?.body} />
      </FieldGroup>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldGroup className="mb-0">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" defaultValue={article?.category ?? ""} maxLength={60} />
          <FieldErrors errors={state.fieldErrors?.category} />
        </FieldGroup>

        <FieldGroup className="mb-0">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={article?.status ?? "DRAFT"}
            className="w-full rounded-md border border-line bg-panel px-3.5 py-2.5 text-base text-parchment focus-visible:border-gold/70 focus-visible:outline-2 focus-visible:outline-gold-bright"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </FieldGroup>
      </div>

      <FieldGroup className="mb-0">
        <Label htmlFor="heroImageUrl">Hero image URL (optional)</Label>
        <Input id="heroImageUrl" name="heroImageUrl" type="url" defaultValue={article?.heroImageUrl ?? ""} />
        <FieldErrors errors={state.fieldErrors?.heroImageUrl} />
      </FieldGroup>

      <div className="flex items-center justify-between pt-2">
        <SubmitButton pendingLabel="Saving…">
          {article?.id ? "Save changes" : "Create article"}
        </SubmitButton>

        {article?.id ? (
          <form
            action={deleteArticleAction}
            onSubmit={(event) => {
              if (!confirm("Delete this article? This can't be undone.")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="articleId" value={article.id} />
            <Button type="submit" variant="danger" size="md">
              Delete
            </Button>
          </form>
        ) : null}
      </div>
    </form>
  );
}
