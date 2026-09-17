import "server-only";

/**
 * CORS for the game client's own API — everything under `/api/game/auth/`
 * and `/api/game/save`. The existing `/api/game/matches` etc. never needed
 * this: those are server-to-server calls with no browser origin at all.
 * These are called with `fetch` from the game running in a browser, a
 * different origin than the portal, so the actual response (not just the
 * preflight) has to carry the header or the browser discards it.
 *
 * A single configured origin rather than a wildcard: these endpoints
 * accept a password (login) or return a player's save data, neither of
 * which should be readable by an arbitrary site that happens to get a
 * player to load it in an iframe or fetch.
 */

function allowedOrigin(requestOrigin: string | null): string | null {
  const configured = process.env.GAME_CLIENT_ORIGIN;
  if (!configured || !requestOrigin) return null;
  return requestOrigin === configured ? configured : null;
}

export function corsHeaders(request: Request): HeadersInit {
  const origin = allowedOrigin(request.headers.get("origin"));
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

/** `OPTIONS` handler for a game-client route — export this directly as `OPTIONS`. */
export function corsPreflight(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

/** `Response.json`, with the CORS headers for this request folded in. */
export function jsonWithCors(
  request: Request,
  body: unknown,
  init?: ResponseInit,
): Response {
  return Response.json(body, {
    ...init,
    headers: { ...corsHeaders(request), ...init?.headers },
  });
}
