import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { generateOpaqueToken, hashToken } from "./crypto";
import { SESSION_COOKIE_NAME } from "./session-cookie";

export { SESSION_COOKIE_NAME };

// Absolute session lifetime. A session idle for longer than this must
// re-authenticate, regardless of activity.
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

// When a session has less than this much time left, we transparently renew
// it (rolling expiration) so an active player never gets logged out
// mid-session, while an abandoned browser tab's session still expires.
const SESSION_RENEWAL_THRESHOLD_SECONDS = 7 * 24 * 60 * 60; // 7 days

export type SessionMetadata = {
  userAgent?: string | null;
  ipAddress?: string | null;
};

/**
 * Creates a new server-side session row and sets the session cookie on the
 * response. Must be called from a Server Action or Route Handler.
 */
export async function createSession(userId: string, metadata: SessionMetadata = {}) {
  const token = generateOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      id: tokenHash,
      userId,
      expiresAt,
      userAgent: metadata.userAgent ?? null,
      ipAddress: metadata.ipAddress ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return { token, expiresAt };
}

export type AuthenticatedSession = {
  session: { id: string; expiresAt: Date; createdAt: Date };
  user: {
    id: string;
    email: string;
    role: "PLAYER" | "ADMIN";
    emailVerified: Date | null;
  };
};

/**
 * Reads the session cookie (if any), validates it against the database, and
 * transparently renews it if it's within the rolling-renewal window.
 * Returns null for a missing, expired, or unknown session — callers should
 * treat that as "signed out" without distinguishing why.
 */
export async function getCurrentSession(): Promise<AuthenticatedSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { id: tokenHash },
    include: {
      user: {
        select: { id: true, email: true, role: true, emailVerified: true },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    // Expired: clean up lazily and report signed-out.
    await prisma.session.delete({ where: { id: tokenHash } }).catch(() => {});
    return null;
  }

  const msRemaining = session.expiresAt.getTime() - Date.now();
  if (msRemaining < SESSION_RENEWAL_THRESHOLD_SECONDS * 1000) {
    const newExpiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
    await prisma.session.update({
      where: { id: tokenHash },
      data: { expiresAt: newExpiresAt },
    });
    // Server Components can't set cookies; renewal is best-effort and will
    // also be picked up the next time a Server Action or Route Handler runs.
    try {
      cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
    } catch {
      // Called from a Server Component render — cookie mutation isn't
      // allowed there. That's fine; the DB row is already renewed.
    }
    session.expiresAt = newExpiresAt;
  }

  return {
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    },
    user: session.user,
  };
}

/** Signs out the current browser by deleting its session row and clearing the cookie. */
export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.delete({ where: { id: hashToken(token) } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Lists every active session for a user, for the "manage devices" security page. */
export async function listSessionsForUser(userId: string) {
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, expiresAt: true, userAgent: true, ipAddress: true },
  });
}

/** Revokes one session by id, scoped to a specific user so players can only revoke their own. */
export async function revokeSessionForUser(userId: string, sessionId: string) {
  await prisma.session.deleteMany({ where: { id: sessionId, userId } });
}

/** Revokes every session for a user except the one currently in use (e.g. after a password change). */
export async function revokeOtherSessionsForUser(userId: string, keepSessionId: string) {
  await prisma.session.deleteMany({
    where: { userId, NOT: { id: keepSessionId } },
  });
}

/** Revokes every session for a user, including the current one (e.g. account compromise). */
export async function revokeAllSessionsForUser(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}
