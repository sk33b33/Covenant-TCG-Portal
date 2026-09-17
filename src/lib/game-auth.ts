import "server-only";

import { safeCompare } from "@/lib/auth/crypto";
import { getUserIdForGameToken } from "@/lib/auth/game-session";

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

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

/**
 * Authenticates a request from the game *client* itself — a signed-in
 * player, not the trusted game server above. Distinct auth entirely: this
 * is a per-player token from `game-session.ts` (`POST /api/game/auth/login`
 * issues it), not the one shared `GAME_SERVER_API_KEY` every request above
 * presents. Returns the userId the token belongs to, or `null` for a
 * missing, unknown, or expired one.
 */
export async function getGameSessionUserId(request: Request): Promise<string | null> {
  const token = bearerToken(request);
  if (!token) return null;
  return getUserIdForGameToken(token);
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
