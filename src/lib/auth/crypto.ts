import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a random 32+ byte value (see .env.example).",
    );
  }
  return secret;
}

/** A random, URL-safe opaque token. This is what goes in cookies and email links. */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Deterministic HMAC-SHA256 digest of a token, keyed by AUTH_SECRET.
 *
 * We never store raw session/verification tokens in the database — only
 * this digest. A leaked database row therefore cannot be replayed as a
 * cookie or reset link, and rotating AUTH_SECRET instantly invalidates
 * every outstanding session and token.
 */
export function hashToken(token: string): string {
  return createHmac("sha256", getAuthSecret()).update(token).digest("hex");
}

/** Constant-time comparison for secret-bearing strings of potentially unequal length. */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
