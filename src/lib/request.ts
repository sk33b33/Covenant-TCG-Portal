import "server-only";

import { headers } from "next/headers";

/** Best-effort client IP for rate limiting and session metadata (not for security-critical decisions). */
export async function getRequestIp(): Promise<string | null> {
  const hdrs = await headers();
  const forwardedFor = hdrs.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return hdrs.get("x-real-ip");
}

export async function getRequestUserAgent(): Promise<string | null> {
  const hdrs = await headers();
  return hdrs.get("user-agent");
}
