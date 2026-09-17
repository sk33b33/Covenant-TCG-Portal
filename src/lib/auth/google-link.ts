import "server-only";

import { prisma } from "@/lib/db";
import type { GoogleIdentity } from "./google";

function sanitizeDisplayNameBase(name: string | null): string {
  const cleaned = (name ?? "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .slice(0, 20);
  return cleaned.length >= 3 ? cleaned : "Player";
}

/**
 * Finds a display name matching the profile uniqueness constraint, starting
 * from a Google display name (which may collide, or contain characters our
 * display names don't allow). Falls back to short numeric suffixes.
 */
async function generateUniqueDisplayName(preferredName: string | null): Promise<string> {
  const base = sanitizeDisplayNameBase(preferredName);

  const existing = await prisma.playerProfile.findUnique({
    where: { displayName: base },
    select: { id: true },
  });
  if (!existing) return base;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${base.slice(0, 24 - String(suffix).length - 1)}${suffix}`;
    const taken = await prisma.playerProfile.findUnique({
      where: { displayName: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }

  // Astronomically unlikely to be reached — 20 random 4-digit suffixes all
  // colliding — but fall back to a guaranteed-unique id fragment rather
  // than looping forever.
  return `Player${Date.now().toString(36).slice(-8)}`;
}

export type ResolveGoogleUserResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "email_not_verified" };

/**
 * The account-linking policy (see docs/AUTH.md#google-sign-in):
 *
 * 1. A Google subject id already linked to a User -> that's them, log in.
 * 2. No link yet, but the email matches an existing User, and Google
 *    reports that email as verified -> attach this Google identity to
 *    that existing account (auto-link). Google's own verification is what
 *    makes this safe: an attacker can't get Google to confirm an email
 *    they don't control.
 * 3. No existing User with that email -> create one, with no password
 *    (the player can add one later from the security page) and email
 *    already marked verified, since Google verified it.
 *
 * Everything here runs in one transaction so a new user is never left
 * without its profile/game-link rows, and a link is never left dangling.
 */
export async function resolveOrCreateUserForGoogleIdentity(
  identity: GoogleIdentity,
): Promise<ResolveGoogleUserResult> {
  const existingLink = await prisma.googleAccount.findUnique({
    where: { googleSub: identity.sub },
    select: { userId: true },
  });
  if (existingLink) {
    return { ok: true, userId: existingLink.userId };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: identity.email },
    select: { id: true, emailVerified: true },
  });

  if (existingUser) {
    if (!identity.emailVerified) {
      return { ok: false, reason: "email_not_verified" };
    }
    await prisma.$transaction([
      prisma.googleAccount.create({
        data: { userId: existingUser.id, googleSub: identity.sub, email: identity.email },
      }),
      // Google has now independently confirmed this email, so mark it
      // verified even if the original password-based signup hadn't been.
      ...(existingUser.emailVerified
        ? []
        : [
            prisma.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: new Date() },
            }),
          ]),
    ]);
    return { ok: true, userId: existingUser.id };
  }

  const displayName = await generateUniqueDisplayName(identity.name);

  const newUser = await prisma.user.create({
    data: {
      email: identity.email,
      passwordHash: null,
      emailVerified: identity.emailVerified ? new Date() : null,
      profile: { create: { displayName, avatarUrl: identity.picture } },
      gameLink: { create: {} },
      googleAccount: { create: { googleSub: identity.sub, email: identity.email } },
    },
    select: { id: true },
  });

  return { ok: true, userId: newUser.id };
}
