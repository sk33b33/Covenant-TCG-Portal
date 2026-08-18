import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const articleSchema = z.object({
  title: z.string().trim().min(3, "Title is required.").max(160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug is required.")
    .max(160)
    .regex(slugPattern, "Use lowercase letters, numbers, and hyphens only."),
  excerpt: z.string().trim().min(1, "Excerpt is required.").max(280),
  body: z.string().trim().min(1, "Body is required."),
  category: z.string().trim().max(60).optional(),
  heroImageUrl: z.union([z.httpUrl("Enter a valid http(s) URL."), z.literal("")]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});
