import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { DemoDataNotice } from "@/components/leaderboard/DemoDataNotice";
import { EmptyState } from "@/components/ui/DataStates";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getActiveSeason, getLeaderboardPage } from "@/lib/leaderboard";
import { getOptionalUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Covenant's competitive standings by season.",
};

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [season, user] = await Promise.all([getActiveSeason(), getOptionalUser()]);

  let myGamePlayerId: string | null = null;
  if (user) {
    const link = await prisma.gamePlayerLink.findUnique({
      where: { userId: user.id },
      select: { gamePlayerId: true },
    });
    myGamePlayerId = link?.gamePlayerId ?? null;
  }

  return (
    <Container className="py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-parchment">Leaderboards</h1>
          {season ? <p className="mt-2 text-muted">{season.name}</p> : null}
        </div>
        {season?.isActive ? <Badge tone="success">Season active</Badge> : null}
      </div>

      {!season ? (
        <div className="mt-10">
          <EmptyState
            title="No active season"
            description="Standings will appear here once a competitive season begins."
          />
        </div>
      ) : (
        <div className="mt-8">
          {season.isDemo ? <DemoDataNotice /> : null}
          <LeaderboardPageContent
            seasonId={season.id}
            page={page}
            highlightGamePlayerId={myGamePlayerId}
          />
        </div>
      )}
    </Container>
  );
}

async function LeaderboardPageContent({
  seasonId,
  page,
  highlightGamePlayerId,
}: {
  seasonId: string;
  page: number;
  highlightGamePlayerId: string | null;
}) {
  const { rows, pageCount } = await getLeaderboardPage(seasonId, page);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No ranked players yet"
        description="Once matches are reported, players will appear here."
      />
    );
  }

  return (
    <>
      <LeaderboardTable rows={rows} highlightGamePlayerId={highlightGamePlayerId} />
      {pageCount > 1 ? (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Leaderboard pagination">
          {page > 1 ? (
            <Button href={`/leaderboards?page=${page - 1}`} variant="secondary" size="md">
              ← Prev
            </Button>
          ) : null}
          <span className="px-3 text-sm text-muted">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Button href={`/leaderboards?page=${page + 1}`} variant="secondary" size="md">
              Next →
            </Button>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
