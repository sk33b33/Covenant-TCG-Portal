"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "../../../generated/prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import { articleSchema } from "@/lib/validation/news";
import type { ActionState } from "./types";

function fieldErrorsFromZod(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

/**
 * Every action here re-derives the caller's role from the validated
 * session (never from a form field or client claim) — this is the
 * server-side authorization boundary for news management. See docs/AUTH.md
 * ("Never trust a role supplied only by the browser").
 */
async function requireAdminSession() {
  const auth = await getCurrentSession();
  if (!auth || auth.user.role !== "ADMIN") {
    return null;
  }
  return auth;
}

function parseArticleForm(formData: FormData) {
  return articleSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    category: formData.get("category") || undefined,
    heroImageUrl: formData.get("heroImageUrl") || "",
    status: formData.get("status"),
  });
}

export async function createArticleAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireAdminSession();
  if (!auth) {
    return { status: "error", message: "You don't have permission to do that." };
  }

  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const { heroImageUrl, category, status, ...rest } = parsed.data;

  let created;
  try {
    created = await prisma.newsArticle.create({
      data: {
        ...rest,
        category: category || null,
        heroImageUrl: heroImageUrl || null,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        authorId: auth.user.id,
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "error", fieldErrors: { slug: ["That slug is already in use."] } };
    }
    throw error;
  }

  revalidatePath("/news");
  revalidatePath("/dashboard/admin/news");
  redirect(`/dashboard/admin/news/${created.id}`);
}

export async function updateArticleAction(
  articleId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireAdminSession();
  if (!auth) {
    return { status: "error", message: "You don't have permission to do that." };
  }

  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const existing = await prisma.newsArticle.findUnique({
    where: { id: articleId },
    select: { status: true, publishedAt: true },
  });
  if (!existing) {
    return { status: "error", message: "Article not found." };
  }

  const { heroImageUrl, category, status, ...rest } = parsed.data;
  const isNewlyPublished = status === "PUBLISHED" && existing.status !== "PUBLISHED";

  try {
    await prisma.newsArticle.update({
      where: { id: articleId },
      data: {
        ...rest,
        category: category || null,
        heroImageUrl: heroImageUrl || null,
        status,
        publishedAt: isNewlyPublished ? new Date() : existing.publishedAt,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "error", fieldErrors: { slug: ["That slug is already in use."] } };
    }
    throw error;
  }

  revalidatePath("/news");
  revalidatePath(`/news/${parsed.data.slug}`);
  revalidatePath("/dashboard/admin/news");
  return { status: "success", message: "Article saved." };
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  const auth = await requireAdminSession();
  if (!auth) return;

  const articleId = String(formData.get("articleId") ?? "");
  if (!articleId) return;

  await prisma.newsArticle.delete({ where: { id: articleId } }).catch(() => {});

  revalidatePath("/news");
  revalidatePath("/dashboard/admin/news");
  redirect("/dashboard/admin/news");
}
