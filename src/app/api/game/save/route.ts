import { z } from "zod";
import { prisma } from "@/lib/db";
import { getGameSessionUserId } from "@/lib/game-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { corsPreflight, jsonWithCors } from "@/lib/cors";

/**
 * GET/POST /api/game/save
 *
 * The signed-in player's own game state — collection, decks, currencies,
 * story/mission progress. Opaque JSON from the portal's point of view; the
 * game defines and versions its own shape. Authenticated by a per-player
 * bearer token from `POST /api/game/auth/login` (`getGameSessionUserId`),
 * never the shared `GAME_SERVER_API_KEY` the other `/api/game/*` routes use.
 */

const saveBodySchema = z.object({
  patch: z.record(z.string(), z.unknown()),
});

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const userId = await getGameSessionUserId(request);
  if (!userId) {
    return jsonWithCors(request, { error: "Unauthorized" }, { status: 401 });
  }

  const save = await prisma.gameSave.findUnique({
    where: { userId },
    select: { state: true },
  });

  return jsonWithCors(request, { state: save?.state ?? {} });
}

export async function POST(request: Request) {
  const userId = await getGameSessionUserId(request);
  if (!userId) {
    return jsonWithCors(request, { error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`game-save:${userId}`, 120, 60);
  if (!rate.allowed) {
    return jsonWithCors(request, { error: "Rate limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors(request, { error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = saveBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonWithCors(
      request,
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Atomic partial merge — `state = state || patch` — so pushing one
  // slice of the save (say, `economy` right after a pack opens) can't
  // clobber another slice (`decks`) that hasn't changed this tick. Raw
  // SQL because Prisma's query builder has no jsonb-merge operation, and
  // an upsert here still needs the merge to happen in the same statement
  // as the insert-or-update to stay atomic under concurrent writes.
  await prisma.$executeRaw`
    INSERT INTO "game_saves" ("userId", "state", "updatedAt")
    VALUES (${userId}, ${JSON.stringify(parsed.data.patch)}::jsonb, now())
    ON CONFLICT ("userId")
    DO UPDATE SET "state" = "game_saves"."state" || excluded."state", "updatedAt" = now()
  `;

  return jsonWithCors(request, { ok: true });
}
