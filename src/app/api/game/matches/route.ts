import { prisma } from "@/lib/db";
import { recordMatchResult } from "@/lib/leaderboard";
import { isAuthorizedGameServerRequest, unauthorizedResponse } from "@/lib/game-auth";
import { matchSubmissionSchema } from "@/lib/validation/game";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/game/matches
 *
 * Records a completed match and updates both players' leaderboard
 * standing. This is a trusted server-to-server endpoint for the (future)
 * game backend — see docs/GAME_INTEGRATION.md for the full contract and
 * why this is intentionally the only way leaderboard numbers change.
 *
 * Auth: `Authorization: Bearer <GAME_SERVER_API_KEY>`.
 */
export async function POST(request: Request) {
  if (!isAuthorizedGameServerRequest(request)) {
    return unauthorizedResponse();
  }

  // Coarse abuse guard on top of the shared-secret auth — a compromised or
  // misbehaving caller can still only hit this a bounded number of times
  // per minute. Real throughput control belongs at the network/gateway
  // layer for a multi-instance deployment (see src/lib/rate-limit.ts).
  const rate = checkRateLimit("game-api:matches", 600, 60);
  if (!rate.allowed) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = matchSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const { seasonSlug, winnerGamePlayerId, loserGamePlayerId, playedAt } = parsed.data;

  if (winnerGamePlayerId === loserGamePlayerId) {
    return Response.json({ error: "winnerGamePlayerId and loserGamePlayerId must differ" }, { status: 400 });
  }

  const playedAtDate = new Date(playedAt);
  if (Number.isNaN(playedAtDate.getTime())) {
    return Response.json({ error: "playedAt must be a valid date" }, { status: 400 });
  }

  const season = await prisma.season.findUnique({ where: { slug: seasonSlug } });
  if (!season) {
    return Response.json({ error: `Unknown season slug: ${seasonSlug}` }, { status: 404 });
  }

  await recordMatchResult({
    seasonId: season.id,
    winnerGamePlayerId,
    loserGamePlayerId,
    playedAt: playedAtDate,
    raw: parsed.data,
  });

  return Response.json({ ok: true }, { status: 201 });
}
