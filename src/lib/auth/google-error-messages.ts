const GOOGLE_OAUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "That sign-in link expired or was already used. Please try again.",
  exchange_failed: "Google sign-in didn't go through. Please try again.",
  email_not_verified:
    "Google reports that email isn't verified, so it can't be safely linked to an existing account.",
  rate_limited: "Too many sign-in attempts. Please wait a moment and try again.",
};

export function googleOAuthErrorMessage(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return GOOGLE_OAUTH_ERROR_MESSAGES[code] ?? "Google sign-in didn't go through. Please try again.";
}
