import "server-only";

import { createRemoteJWKSet, jwtVerify } from "jose";
import { getAppUrl } from "@/lib/app-url";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

// Verified locally against Google's published signing keys (cached and
// auto-rotated by `jose`) rather than calling Google's tokeninfo endpoint
// per login — Google's own docs note tokeninfo isn't meant for
// production-volume verification.
const googleJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

function getGoogleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured (see .env.example).",
    );
  }
  return { clientId, clientSecret };
}

function getRedirectUri() {
  return `${getAppUrl()}/api/auth/google/callback`;
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Builds the URL to send the browser to for Google's consent screen. */
export function buildGoogleAuthUrl(state: string): string {
  const { clientId } = getGoogleCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    // Re-confirms the account each time rather than silently
    // auto-selecting whichever Google account happens to be signed in on
    // the device — safer default for a shared/public computer.
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export type GoogleIdentity = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
};

/**
 * Exchanges an authorization code for tokens, then verifies the returned
 * ID token's signature, issuer, audience, and expiry before trusting any
 * of its claims. Throws if the code is invalid/expired or the token
 * doesn't check out.
 */
export async function exchangeCodeForGoogleIdentity(code: string): Promise<GoogleIdentity> {
  const { clientId, clientSecret } = getGoogleCredentials();

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Google token exchange failed: ${tokenResponse.status}`);
  }

  const tokenBody = (await tokenResponse.json()) as { id_token?: string };
  if (!tokenBody.id_token) {
    throw new Error("Google token response did not include an id_token.");
  }

  const { payload } = await jwtVerify(tokenBody.id_token, googleJwks, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });

  if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new Error("Google ID token is missing required claims.");
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : null,
    picture: typeof payload.picture === "string" ? payload.picture : null,
  };
}
