"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "../../../generated/prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/validation/auth";
import type { ActionState } from "./types";

export async function updateProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await getCurrentSession();
  if (!auth) {
    return { status: "error", message: "You must be logged in to do that." };
  }

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return { status: "error", fieldErrors };
  }

  try {
    await prisma.playerProfile.update({
      where: { userId: auth.user.id },
      data: { displayName: parsed.data.displayName, bio: parsed.data.bio ?? null },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: "error",
        fieldErrors: { displayName: ["That display name is already taken."] },
      };
    }
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { status: "success", message: "Profile updated." };
}
