import "server-only";

import { safeCompare } from "@/lib/auth/crypto";

/**
 * Authenticates a request from the (future) game server to /api/game/*.
 * This is a single shared secret presented as a Bearer token — appropriate
 * for a trusted server-to-server call, and explicitly NOT something that
 * should ever ship inside a game client binary (see docs/GAME_INTEGRATION.md).
 */
export function isAuthorizedGameServerRequest(request: Request): boolean {
  const expected = process.env.GAME_SERVER_API_KEY;
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return false;

  return safeCompare(token, expected);
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
