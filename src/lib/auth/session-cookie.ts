// Deliberately dependency-free (no next/headers, no Prisma) so it can be
// imported from proxy.ts without pulling the database client into that
// execution context. See proxy.ts for why proxy only checks for the
// cookie's presence and never its contents.
export const SESSION_COOKIE_NAME = "covenant_session";
