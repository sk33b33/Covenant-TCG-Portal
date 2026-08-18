import { prisma } from "@/lib/db";
import { getLeaderboardPage } from "@/lib/leaderboard";
import { isAuthorizedGameServerRequest, unauthorizedResponse } from "@/lib/game-auth";

/**
 * GET /api/game/leaderboard?season=<slug>&page=<n>
 *
 * Server-to-server leaderboard read for the game backend. The website's
 * own leaderboard pages query the database directly rather than calling
 * this — it exists for the game server, which authenticates differently
 * than a browser (see docs/GAME_INTEGRATION.md).
 */
export async function GET(request: Request) {
  if (!isAuthorizedGameServerRequest(request)) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);
  const seasonSlug = url.searchParams.get("season");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

  if (!seasonSlug) {
    return Response.json({ error: "Missing required query param: season" }, { status: 400 });
  }

  const season = await prisma.season.findUnique({ where: { slug: seasonSlug } });
  if (!season) {
    return Response.json({ error: `Unknown season slug: ${seasonSlug}` }, { status: 404 });
  }

  const { rows, totalCount, pageCount } = await getLeaderboardPage(season.id, page);

  return Response.json({
    season: { slug: season.slug, name: season.name, isActive: season.isActive, isDemo: season.isDemo },
    page,
    pageCount,
    totalCount,
    entries: rows,
  });
}
