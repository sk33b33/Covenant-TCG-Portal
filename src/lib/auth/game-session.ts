import "server-only";

import { prisma } from "@/lib/db";
import { generateOpaqueToken, hashToken } from "./crypto";

/**
 * The game client's own sign-in — a bearer token instead of the browser
 * session cookie `session.ts` sets, since the game is a different origin
 * and a browser can't read another origin's httpOnly cookie anyway. Same
 * underlying primitives as a browser session (`generateOpaqueToken`,
 * `hashToken`): the raw token is handed back once in the login response
 * and never stored; only its HMAC hash lives in `GameSession.id`, so a
 * leaked database row can't be replayed as a token, the same guarantee
 * `docs/AUTH.md` describes for browser sessions.
 */

// Same absolute lifetime as a browser session (see session.ts) — no
// rolling renewal here for v1: a game client that finds its stored token
// expired just signs in again, which is a much smaller UX cost for an app
// than for a browser tab left open.
const GAME_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export async function createGameSession(userId: string) {
  const token = generateOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + GAME_SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.gameSession.create({
    data: { id: tokenHash, userId, expiresAt },
  });

  return { token, expiresAt };
}

/**
 * Validates a bearer token from an `Authorization` header and returns the
 * userId it belongs to, or `null` for a missing, unknown, or expired one —
 * callers should treat all three as "not signed in" without distinguishing
 * why, the same convention `getCurrentSession` uses for browser sessions.
 */
export async function getUserIdForGameToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const session = await prisma.gameSession.findUnique({
    where: { id: tokenHash },
    select: { userId: true, expiresAt: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.gameSession.delete({ where: { id: tokenHash } }).catch(() => {});
    return null;
  }

  return session.userId;
}

/** Revokes one game session by its raw token — the game's own "sign out." */
export async function destroyGameSession(token: string): Promise<void> {
  await prisma.gameSession.delete({ where: { id: hashToken(token) } }).catch(() => {});
}

/** Revokes every game session for a user (password reset, account compromise). */
export async function revokeAllGameSessionsForUser(userId: string): Promise<void> {
  await prisma.gameSession.deleteMany({ where: { userId } });
}
