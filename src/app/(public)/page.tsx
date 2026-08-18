import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { NewsCard } from "@/components/news/NewsCard";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { DemoDataNotice } from "@/components/leaderboard/DemoDataNotice";
import { getOptionalUser } from "@/lib/auth/current-user";
import { listLatestNews } from "@/lib/news";
import { getActiveSeason, getLeaderboardPreview } from "@/lib/leaderboard";

export default async function HomePage() {
  const [user, latestNews, activeSeason] = await Promise.all([
    getOptionalUser(),
    listLatestNews(3),
    getActiveSeason(),
  ]);

  const leaderboardPreview = activeSeason ? await getLeaderboardPreview(activeSeason.id, 5) : [];

  return (
    <>
      <section className="bg-covenant-glow relative overflow-hidden border-b border-line-soft">
        <Container className="flex flex-col items-start gap-6 py-20 sm:py-28">
          <Badge tone="gold">In active development</Badge>
          <h1 className="animate-fade-up font-display text-balance text-4xl leading-tight text-parchment sm:text-6xl">
            A trading card game worth <span className="text-gold-bright">swearing to</span>.
          </h1>
          <p className="animate-fade-up max-w-xl text-lg text-muted [animation-delay:100ms]">
            Covenant is a strategic trading card game currently in development. This portal is
            your account hub: create your identity now, and it carries straight into the game
            when it launches.
          </p>
          <div className="animate-fade-up flex flex-col gap-3 sm:flex-row [animation-delay:150ms]">
            {user ? (
              <Button href="/dashboard" size="lg">
                Go to your dashboard
              </Button>
            ) : (
              <>
                <Button href="/register" size="lg">
                  Create your account
                </Button>
                <Button href="/about" variant="secondary" size="lg">
                  Learn about Covenant
                </Button>
              </>
            )}
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl text-parchment">Latest news</h2>
            <Button href="/news" variant="ghost">
              All news →
            </Button>
          </div>
          {latestNews.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latestNews.map((article) => (
                <NewsCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-muted">
              No announcements yet — check back soon.
            </Card>
          )}
        </Container>
      </section>

      <section className="border-t border-line-soft py-16">
        <Container>
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl text-parchment">Leaderboard</h2>
            <Button href="/leaderboards" variant="ghost">
              Full leaderboard →
            </Button>
          </div>
          {activeSeason && leaderboardPreview.length > 0 ? (
            <>
              {activeSeason.isDemo ? <DemoDataNotice /> : null}
              <LeaderboardTable rows={leaderboardPreview} />
            </>
          ) : (
            <Card className="p-8 text-center text-muted">
              No season is active yet. Standings will appear here once one begins.
            </Card>
          )}
        </Container>
      </section>
    </>
  );
}
