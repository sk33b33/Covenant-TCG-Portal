import "server-only";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "./session";

/** For layouts/pages that render differently when signed in, without forcing a redirect. */
export async function getOptionalUser() {
  const auth = await getCurrentSession();
  if (!auth) return null;
  return auth.user;
}

/** For protected pages: returns the signed-in user or redirects to /login. Prefer relying on proxy.ts for the redirect and use this for the authoritative user data. */
export async function requireUser() {
  const auth = await getCurrentSession();
  if (!auth) {
    redirect("/login");
  }
  return auth.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

/** Full profile bundle for the dashboard: user + player profile + game link, creating the profile/link rows if a legacy account somehow lacks them. */
export async function getUserWithProfile(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
      profile: true,
      gameLink: true,
    },
  });
}
