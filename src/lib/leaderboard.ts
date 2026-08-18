import "server-only";

import { prisma } from "@/lib/db";
import type { Prisma } from "../../generated/prisma/client";

export type LeaderboardRow = {
  rank: number;
  gamePlayerId: string;
  displayName: string;
  avatarUrl: string | null;
  isLinkedProfile: boolean;
  rating: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
};

export type SeasonSummary = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isDemo: boolean;
  startAt: Date;
  endAt: Date | null;
};

/**
 * The leaderboard service is intentionally a thin, explicit boundary over
 * Prisma (rather than components querying the database directly) so the
 * eventual real-time/game-reported leaderboard can replace the storage
 * details here without touching every page that renders standings. See
 * docs/GAME_INTEGRATION.md for how MatchResult rows update these entries.
 */

export async function getActiveSeason(): Promise<SeasonSummary | null> {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    orderBy: { startAt: "desc" },
  });
  return season;
}

export async function getSeasonBySlug(slug: string): Promise<SeasonSummary | null> {
  return prisma.season.findUnique({ where: { slug } });
}

const PAGE_SIZE = 25;

export async function getLeaderboardPage(
  seasonId: string,
  page: number = 1,
): Promise<{ rows: LeaderboardRow[]; totalCount: number; pageCount: number }> {
  const safePage = Math.max(1, page);
  const [entries, totalCount] = await Promise.all([
    prisma.leaderboardEntry.findMany({
      where: { seasonId },
      orderBy: { rating: "desc" },
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { playerProfile: { select: { displayName: true, avatarUrl: true } } },
    }),
    prisma.leaderboardEntry.count({ where: { seasonId } }),
  ]);

  const rows: LeaderboardRow[] = entries.map((entry, index) => ({
    rank: (safePage - 1) * PAGE_SIZE + index + 1,
    gamePlayerId: entry.gamePlayerId,
    displayName: entry.playerProfile?.displayName ?? entry.displayNameSnapshot,
    avatarUrl: entry.playerProfile?.avatarUrl ?? null,
    isLinkedProfile: Boolean(entry.playerProfile),
    rating: entry.rating,
    wins: entry.wins,
    losses: entry.losses,
    matchesPlayed: entry.matchesPlayed,
  }));

  return { rows, totalCount, pageCount: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) };
}

/** Used on the homepage leaderboard preview — top N rows, no pagination. */
export async function getLeaderboardPreview(seasonId: string, limit = 5): Promise<LeaderboardRow[]> {
  const entries = await prisma.leaderboardEntry.findMany({
    where: { seasonId },
    orderBy: { rating: "desc" },
    take: limit,
    include: { playerProfile: { select: { displayName: true, avatarUrl: true } } },
  });

  return entries.map((entry, index) => ({
    rank: index + 1,
    gamePlayerId: entry.gamePlayerId,
    displayName: entry.playerProfile?.displayName ?? entry.displayNameSnapshot,
    avatarUrl: entry.playerProfile?.avatarUrl ?? null,
    isLinkedProfile: Boolean(entry.playerProfile),
    rating: entry.rating,
    wins: entry.wins,
    losses: entry.losses,
    matchesPlayed: entry.matchesPlayed,
  }));
}

/** A signed-in player's own standing in a season, for "your rank" highlighting. */
export async function getEntryForGamePlayerId(seasonId: string, gamePlayerId: string) {
  return prisma.leaderboardEntry.findUnique({
    where: { seasonId_gamePlayerId: { seasonId, gamePlayerId } },
  });
}

// --- Match result ingestion (called only from the authenticated
// /api/game/matches route — see docs/GAME_INTEGRATION.md) ---

const STARTING_RATING = 1000;
// Flat per-match rating delta. This is a deliberately simple, clearly
// PROVISIONAL placeholder — not a real competitive ruleset, which Covenant
// hasn't defined yet. Swap this function's math out once one exists; every
// caller only depends on recordMatchResult's signature, not this constant.
const PLACEHOLDER_RATING_DELTA = 25;

async function fallbackDisplayName(tx: Prisma.TransactionClient, gamePlayerId: string) {
  const link = await tx.gamePlayerLink.findUnique({
    where: { gamePlayerId },
    select: { user: { select: { profile: { select: { id: true, displayName: true } } } } },
  });
  return link?.user.profile ?? null;
}

async function applyResultToEntry(
  tx: Prisma.TransactionClient,
  seasonId: string,
  gamePlayerId: string,
  didWin: boolean,
) {
  const existing = await tx.leaderboardEntry.findUnique({
    where: { seasonId_gamePlayerId: { seasonId, gamePlayerId } },
  });

  const delta = didWin ? PLACEHOLDER_RATING_DELTA : -PLACEHOLDER_RATING_DELTA;

  if (!existing) {
    const profile = await fallbackDisplayName(tx, gamePlayerId);
    await tx.leaderboardEntry.create({
      data: {
        seasonId,
        gamePlayerId,
        playerProfileId: profile?.id ?? null,
        displayNameSnapshot: profile?.displayName ?? `Player-${gamePlayerId.slice(0, 8)}`,
        rating: Math.max(0, STARTING_RATING + delta),
        wins: didWin ? 1 : 0,
        losses: didWin ? 0 : 1,
        matchesPlayed: 1,
      },
    });
    return;
  }

  await tx.leaderboardEntry.update({
    where: { id: existing.id },
    data: {
      rating: Math.max(0, existing.rating + delta),
      wins: { increment: didWin ? 1 : 0 },
      losses: { increment: didWin ? 0 : 1 },
      matchesPlayed: { increment: 1 },
    },
  });
}

export async function recordMatchResult(input: {
  seasonId: string;
  winnerGamePlayerId: string;
  loserGamePlayerId: string;
  playedAt: Date;
  raw?: object;
}) {
  const { seasonId, winnerGamePlayerId, loserGamePlayerId, playedAt, raw } = input;

  // All three writes succeed or fail together, so a match can never be
  // recorded without its rating/W-L effects (or vice versa).
  await prisma.$transaction(async (tx) => {
    await tx.matchResult.create({
      data: { seasonId, winnerGamePlayerId, loserGamePlayerId, playedAt, raw: raw ?? undefined },
    });

    await applyResultToEntry(tx, seasonId, winnerGamePlayerId, true);
    await applyResultToEntry(tx, seasonId, loserGamePlayerId, false);
  });
}
