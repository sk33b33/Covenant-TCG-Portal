import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeCompare } from "@/lib/auth/crypto";
import { exchangeCodeForGoogleIdentity } from "@/lib/auth/google";
import { resolveOrCreateUserForGoogleIdentity } from "@/lib/auth/google-link";
import { createSession } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/redirect";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp, getRequestUserAgent } from "@/lib/request";
import { getAppUrl } from "@/lib/app-url";

const STATE_COOKIE = "google_oauth_state";
const NEXT_COOKIE = "google_oauth_next";

function loginErrorRedirect(reason: string) {
  const url = new URL("/login", getAppUrl());
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

/**
 * GET /api/auth/google/callback
 *
 * Completes the OAuth flow started by /api/auth/google/start. Validates
 * the CSRF state, exchanges the authorization code, verifies the ID
 * token, then applies the account-linking policy in
 * resolveOrCreateUserForGoogleIdentity (see that file — and
 * docs/AUTH.md#google-sign-in — for the actual linking rules).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await cookies();

  // Always clear the one-time OAuth cookies regardless of outcome — they
  // must never be reused across attempts.
  const storedState = cookieStore.get(STATE_COOKIE)?.value;
  const storedNext = cookieStore.get(NEXT_COOKIE)?.value;
  // Must delete with the same `path` used when setting these, or the
  // browser treats it as a distinct cookie and the original lingers
  // (harmless — it's single-use and expires in 10 minutes regardless —
  // but this is the correct way to actually clear it).
  cookieStore.delete({ name: STATE_COOKIE, path: "/api/auth/google" });
  cookieStore.delete({ name: NEXT_COOKIE, path: "/api/auth/google" });

  const ip = (await getRequestIp()) ?? "unknown";
  const rate = checkRateLimit(`google-oauth-callback:${ip}`, 20, 15 * 60);
  if (!rate.allowed) {
    return loginErrorRedirect("rate_limited");
  }

  const googleError = url.searchParams.get("error");
  if (googleError) {
    // Most commonly the player just clicked "Cancel" on Google's consent
    // screen — not worth alarming them with an error page for that.
    return NextResponse.redirect(new URL("/login", getAppUrl()));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || !storedState || !safeCompare(state, storedState)) {
    return loginErrorRedirect("invalid_state");
  }

  let identity;
  try {
    identity = await exchangeCodeForGoogleIdentity(code);
  } catch (error) {
    console.error("Google OAuth exchange failed:", error);
    return loginErrorRedirect("exchange_failed");
  }

  const result = await resolveOrCreateUserForGoogleIdentity(identity);
  if (!result.ok) {
    return loginErrorRedirect("email_not_verified");
  }

  await createSession(result.userId, {
    ipAddress: ip,
    userAgent: await getRequestUserAgent(),
  });

  return NextResponse.redirect(new URL(safeNextPath(storedNext), getAppUrl()));
}
