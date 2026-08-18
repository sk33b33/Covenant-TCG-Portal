import type { Metadata } from "next";
import Link from "next/link";
import { requireUser, getUserWithProfile } from "@/lib/auth/current-user";
import { getActiveSeason, getEntryForGamePlayerId } from "@/lib/leaderboard";
import { listLatestNews } from "@/lib/news";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default async function DashboardPage() {
  const authUser = await requireUser();
  const [user, activeSeason, latestNews] = await Promise.all([
    getUserWithProfile(authUser.id),
    getActiveSeason(),
    listLatestNews(3),
  ]);

  const myEntry =
    activeSeason && user.gameLink?.gamePlayerId
      ? await getEntryForGamePlayerId(activeSeason.id, user.gameLink.gamePlayerId)
      : null;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-3xl text-parchment">
          Welcome back, {user.profile?.displayName ?? "player"}.
        </h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s where things stand with your account.</p>
      </div>

      {!user.emailVerified ? (
        <Card className="border-arcane/30 bg-arcane/5 p-5">
          <p className="text-sm text-parchment">
            Your email isn&apos;t verified yet.{" "}
            <Link href="/dashboard/security" className="text-gold hover:text-gold-bright">
              Verify it from your security page →
            </Link>
          </p>
        </Card>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-sm font-medium text-muted">Player statistics</h2>
          {myEntry ? (
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Rating</dt>
                <dd className="font-medium text-parchment">{myEntry.rating}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Record</dt>
                <dd className="text-parchment">
                  {myEntry.wins}W / {myEntry.losses}L
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-faint">
              No ranked matches yet. Stats will appear here once you&apos;ve played.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-medium text-muted">Connected game</h2>
          <div className="mt-3">
            <Badge tone={user.gameLink?.status === "LINKED" ? "success" : "neutral"}>
              {user.gameLink?.status === "LINKED" ? "Linked" : "Not linked"}
            </Badge>
          </div>
          <Link
            href="/dashboard/game"
            className="mt-3 inline-block text-sm text-gold hover:text-gold-bright"
          >
            View details →
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-medium text-muted">Account</h2>
          <p className="mt-3 text-sm text-parchment">{user.email}</p>
          <Link
            href="/dashboard/profile"
            className="mt-3 inline-block text-sm text-gold hover:text-gold-bright"
          >
            Edit profile →
          </Link>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-parchment">Latest news</h2>
          <Button href="/news" variant="ghost">
            All news →
          </Button>
        </div>
        {latestNews.length > 0 ? (
          <ul className="space-y-3">
            {latestNews.map((article) => (
              <li key={article.slug}>
                <Card className="p-4">
                  <Link
                    href={`/news/${article.slug}`}
                    className="font-medium text-parchment hover:text-gold-bright"
                  >
                    {article.title}
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="p-6 text-sm text-muted">No announcements yet.</Card>
        )}
      </div>
    </div>
  );
}
