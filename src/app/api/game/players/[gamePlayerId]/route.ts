import { prisma } from "@/lib/db";
import { isAuthorizedGameServerRequest, unauthorizedResponse } from "@/lib/game-auth";

/**
 * GET /api/game/players/:gamePlayerId
 *
 * Resolves a game player id to its linked website profile, if any. Never
 * returns auth-identity fields (email, password hash) — only the public
 * profile, which is the whole point of keeping those separate (see
 * docs/ARCHITECTURE.md).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ gamePlayerId: string }> },
) {
  if (!isAuthorizedGameServerRequest(request)) {
    return unauthorizedResponse();
  }

  const { gamePlayerId } = await context.params;

  const link = await prisma.gamePlayerLink.findUnique({
    where: { gamePlayerId },
    select: {
      status: true,
      gameVersion: true,
      linkedAt: true,
      user: { select: { profile: { select: { displayName: true, avatarUrl: true } } } },
    },
  });

  if (!link) {
    return Response.json({ error: "No account linked to this game player id" }, { status: 404 });
  }

  return Response.json({
    gamePlayerId,
    status: link.status,
    gameVersion: link.gameVersion,
    linkedAt: link.linkedAt,
    profile: link.user.profile,
  });
}
