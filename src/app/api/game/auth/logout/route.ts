import { destroyGameSession } from "@/lib/auth/game-session";
import { corsPreflight, jsonWithCors } from "@/lib/cors";

/**
 * POST /api/game/auth/logout
 *
 * Revokes the presented game session server-side, the same "sign out
 * means the token stops working, not just that the client forgot it"
 * guarantee browser sessions get (`destroyCurrentSession`). Always
 * responds success — a token that's already gone (expired, already
 * revoked) is still "signed out" from the caller's point of view.
 */
export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    await destroyGameSession(token);
  }
  return jsonWithCors(request, { ok: true });
}
