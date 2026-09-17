/**
 * Only ever redirect to a same-origin relative path after login — a
 * caller-controlled absolute or protocol-relative URL (`https://evil.tld`,
 * `//evil.tld`) here would be an open redirect. Shared by both the
 * password-login form and the Google OAuth callback so a `next=` value is
 * validated identically either way.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  const path = value ?? "";
  if (path.startsWith("/") && !path.startsWith("//") && !path.includes("://")) {
    return path;
  }
  return fallback;
}
