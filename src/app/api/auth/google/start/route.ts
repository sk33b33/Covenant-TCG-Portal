import { cookies } from "next/headers";
import { generateOpaqueToken } from "@/lib/auth/crypto";
import { buildGoogleAuthUrl, isGoogleSignInConfigured } from "@/lib/auth/google";
import { safeNextPath } from "@/lib/auth/redirect";

const STATE_COOKIE = "google_oauth_state";
const NEXT_COOKIE = "google_oauth_next";
const OAUTH_COOKIE_MAX_AGE_SECONDS = 10 * 60; // the consent flow should take seconds, not minutes

/**
 * GET /api/auth/google/start?next=/some/path
 *
 * Kicks off the OAuth flow: stashes a random CSRF state value and the
 * validated return path in short-lived cookies, then sends the browser to
 * Google's consent screen. A plain GET (rather than a Server Action) so
 * this works as an ordinary link/button with no JS required.
 */
export async function GET(request: Request) {
  if (!isGoogleSignInConfigured()) {
    return Response.json(
      { error: "Google sign-in is not configured on this deployment." },
      { status: 501 },
    );
  }

  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const state = generateOpaqueToken();

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth/google",
    maxAge: OAUTH_COOKIE_MAX_AGE_SECONDS,
  };
  cookieStore.set(STATE_COOKIE, state, cookieOptions);
  cookieStore.set(NEXT_COOKIE, next, cookieOptions);

  return Response.redirect(buildGoogleAuthUrl(state));
}
