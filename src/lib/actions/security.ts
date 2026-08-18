"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { revokeSessionForUser, revokeOtherSessionsForUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { changePasswordSchema } from "@/lib/validation/auth";
import type { ActionState } from "./types";

export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await getCurrentSession();
  if (!auth) {
    return { status: "error", message: "You must be logged in to do that." };
  }

  const rate = checkRateLimit(`change-password:${auth.user.id}`, 5, 15 * 60);
  if (!rate.allowed) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return { status: "error", fieldErrors };
  }

  const fullUser = await prisma.user.findUniqueOrThrow({
    where: { id: auth.user.id },
    select: { passwordHash: true },
  });

  const isCurrentValid = await verifyPassword(parsed.data.currentPassword, fullUser.passwordHash);
  if (!isCurrentValid) {
    return {
      status: "error",
      fieldErrors: { currentPassword: ["That's not your current password."] },
    };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: auth.user.id }, data: { passwordHash } });

  // Sign out every other device — the one making this change stays signed
  // in, since it just proved it holds the current password.
  await revokeOtherSessionsForUser(auth.user.id, auth.session.id);

  revalidatePath("/dashboard/security");
  return { status: "success", message: "Password updated. Other devices have been signed out." };
}

// Plain one-argument form action (used directly as a <form action={...}>,
// not through useActionState) — the sessions list re-renders via
// revalidatePath, so no inline error state is needed here.
export async function revokeSessionAction(formData: FormData): Promise<void> {
  const auth = await getCurrentSession();
  if (!auth) return;

  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId || sessionId === auth.session.id) return;

  // Scoped to the current user, so an id belonging to someone else's
  // session simply matches zero rows rather than being revocable.
  await revokeSessionForUser(auth.user.id, sessionId);

  revalidatePath("/dashboard/security");
}
