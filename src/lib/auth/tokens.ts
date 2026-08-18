import "server-only";

import { prisma } from "@/lib/db";
import { generateOpaqueToken, hashToken } from "./crypto";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

type TokenType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

/**
 * Issues a single-use, expiring verification token for a user. Any previous
 * unused token of the same type is invalidated first, so only the most
 * recently requested link ever works.
 *
 * Returns the raw token — this is the only time it exists outside the
 * emailed link; the database only ever stores its hash.
 */
export async function issueVerificationToken(userId: string, type: TokenType) {
  const ttlMs = type === "EMAIL_VERIFICATION" ? EMAIL_VERIFICATION_TTL_MS : PASSWORD_RESET_TTL_MS;
  const token = generateOpaqueToken();

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({
      where: { userId, type, usedAt: null },
    }),
    prisma.verificationToken.create({
      data: {
        userId,
        type,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    }),
  ]);

  return token;
}

/**
 * Read-only check of whether a token is currently valid, without consuming
 * it. Used to show a friendly "this link has expired" message before the
 * player fills out a form, rather than only failing on submit.
 */
export async function peekVerificationToken(rawToken: string, type: TokenType): Promise<boolean> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.type !== type || record.usedAt) return false;
  return record.expiresAt.getTime() > Date.now();
}

export type ConsumeTokenResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "not_found" | "expired" | "already_used" };

/**
 * Validates and burns a verification token in one atomic step. A token can
 * only ever be consumed once, even under concurrent requests, because the
 * update is conditioned on `usedAt: null`.
 */
export async function consumeVerificationToken(
  rawToken: string,
  type: TokenType,
): Promise<ConsumeTokenResult> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== type) {
    return { ok: false, reason: "not_found" };
  }
  if (record.usedAt) {
    return { ok: false, reason: "already_used" };
  }
  if (record.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const { count } = await prisma.verificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (count === 0) {
    // Lost a race with a concurrent consumption of the same token.
    return { ok: false, reason: "already_used" };
  }

  return { ok: true, userId: record.userId };
}
