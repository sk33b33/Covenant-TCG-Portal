import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description: "What Covenant is, where it stands in development, and what this portal does.",
};

const pillars = [
  {
    title: "Built for strategy",
    body: "Covenant is designed around meaningful decisions, not just deck size or grind — the specifics of the ruleset are still being finalized in development.",
  },
  {
    title: "A real competitive ladder",
    body: "The leaderboard on this site is wired up to real season and match-result data structures from day one, so competitive standings will be accurate the moment matches start being reported.",
  },
  {
    title: "One account, everywhere",
    body: "Your Covenant account is built to work across devices from the start — sign in here, and the same identity will carry into the game client.",
  },
];

export default function AboutPage() {
  return (
    <Container className="py-16">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl text-parchment">About Covenant</h1>
        <p className="mt-4 text-lg text-muted">
          Covenant is a trading card game currently in development. This website is its official
          web portal — the account system, community hub, and eventual gateway into the game
          itself.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title} className="p-6">
            <h2 className="font-display text-lg text-gold-bright">{pillar.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.body}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-12 max-w-3xl p-8">
        <h2 className="font-display text-xl text-parchment">Where things stand today</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The game itself is still in active development, so you won&apos;t find card lists,
          rules text, or a downloadable client here yet. What you will find is a working account
          system: register, verify your email, manage your profile and security, and follow
          development through the news feed. As the game reaches playable milestones, this page
          and the rest of the portal will grow to match.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href="/register">Create your account</Button>
          <Button href="/news" variant="secondary">
            Read development news
          </Button>
        </div>
      </Card>
    </Container>
  );
}
