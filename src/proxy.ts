import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

// Proxy only performs a cheap "is there a session cookie at all" check for
// routing/UX purposes (fast redirect to /login, avoid rendering an
// authenticated shell for a signed-out visitor). It intentionally does NOT
// query the database or trust the cookie's contents for authorization —
// that would make an unvalidated cookie a source of truth. The
// authoritative check is `requireUser()` / `requireAdmin()`
// (src/lib/auth/current-user.ts), which validates the session against the
// database on every request to a protected page. See docs/AUTH.md.
// Every authenticated page lives under /dashboard (including
// /dashboard/admin/*, which is further role-gated server-side by
// requireAdmin() — proxy has no concept of roles, only "is there a
// session cookie").
const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_ONLY_PREFIXES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && hasSessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
