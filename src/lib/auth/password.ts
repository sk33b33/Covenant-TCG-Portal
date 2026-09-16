import "server-only";

import bcrypt from "bcryptjs";

// Cost factor 12 is the current OWASP baseline recommendation for bcrypt.
const BCRYPT_COST_FACTOR = 12;

// A bcrypt hash of a value nobody will ever type, compared against on a
// login attempt for an email that doesn't exist — keeps the login path's
// timing similar whether or not the account exists, so response latency
// can't leak account existence. Shared by every login surface (web,
// game) rather than each keeping its own copy of the same magic value.
export const DUMMY_PASSWORD_HASH =
  "$2b$12$C6UzMDM.H6dfI/f/IKcEeOoDcqvBEXfXAvVzS6VvSAgvBiMdV5VPu";

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, BCRYPT_COST_FACTOR);
}

export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}
