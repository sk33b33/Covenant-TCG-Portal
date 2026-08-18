/**
 * Local development seed data.
 *
 * Everything this script creates is either clearly-labeled demo data (the
 * `isDemo: true` season and its leaderboard rows — see docs/DATABASE.md) or
 * genuine, non-fabricated site content (the announcement posts below,
 * about the website itself, not invented game lore/mechanics).
 *
 * Deliberately does NOT import from src/lib — those modules import
 * "server-only", which throws when loaded outside Next.js's bundler (this
 * script runs standalone via `tsx`), so it builds its own tiny Prisma
 * client instead.
 *
 * Run with: npm run db:seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@covenant.local";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "change-me-now-12345";

async function main() {
  console.log("Seeding local development data...");
  console.warn(
    `Dev-only admin account: ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD} — never reuse this outside local development.`,
  );

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    update: {},
    create: {
      email: SEED_ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
      profile: { create: { displayName: "Covenant Team" } },
      gameLink: { create: {} },
    },
    include: { profile: true },
  });

  const season = await prisma.season.upsert({
    where: { slug: "preview-season" },
    update: {},
    create: {
      name: "Preview Season",
      slug: "preview-season",
      startAt: new Date(),
      isActive: true,
      isDemo: true,
    },
  });

  const demoPlayers = [
    { gamePlayerId: "demo-forge-warden", displayNameSnapshot: "ForgeWarden", rating: 1842, wins: 61, losses: 22 },
    { gamePlayerId: "demo-nightbloom", displayNameSnapshot: "Nightbloom", rating: 1795, wins: 54, losses: 25 },
    { gamePlayerId: "demo-ashen-quill", displayNameSnapshot: "AshenQuill", rating: 1760, wins: 48, losses: 27 },
    { gamePlayerId: "demo-tidecaller", displayNameSnapshot: "Tidecaller", rating: 1701, wins: 45, losses: 30 },
    { gamePlayerId: "demo-graymantle", displayNameSnapshot: "Graymantle", rating: 1668, wins: 40, losses: 33 },
    { gamePlayerId: "demo-vow-keeper", displayNameSnapshot: "VowKeeper", rating: 1622, wins: 38, losses: 35 },
    { gamePlayerId: "demo-emberlynx", displayNameSnapshot: "Emberlynx", rating: 1590, wins: 33, losses: 34 },
    { gamePlayerId: "demo-hollow-star", displayNameSnapshot: "HollowStar", rating: 1544, wins: 29, losses: 36 },
  ];

  for (const player of demoPlayers) {
    await prisma.leaderboardEntry.upsert({
      where: { seasonId_gamePlayerId: { seasonId: season.id, gamePlayerId: player.gamePlayerId } },
      update: {},
      create: { seasonId: season.id, matchesPlayed: player.wins + player.losses, ...player },
    });
  }

  // Demonstrate the linked-profile join path: the seeded admin's game
  // identity also appears on the leaderboard, showing a real display name
  // instead of a raw snapshot.
  if (admin.profile) {
    await prisma.leaderboardEntry.upsert({
      where: { seasonId_gamePlayerId: { seasonId: season.id, gamePlayerId: "demo-covenant-team" } },
      update: {},
      create: {
        seasonId: season.id,
        gamePlayerId: "demo-covenant-team",
        playerProfileId: admin.profile.id,
        displayNameSnapshot: admin.profile.displayName,
        rating: 1500,
        wins: 10,
        losses: 10,
        matchesPlayed: 20,
      },
    });
  }

  const articles = [
    {
      slug: "welcome-to-the-covenant-portal",
      title: "Welcome to the Covenant portal",
      excerpt:
        "The official Covenant website is live in early preview — create an account, explore the early leaderboard structure, and follow along as the game takes shape.",
      body: `We're opening up the Covenant web portal in early preview. This is the account and community hub for the game: create a player account today, and it'll carry over as the in-game connection goes live.\n\nWhat's here right now:\n\n- Account creation, login, and password recovery\n- A player dashboard and profile\n- A leaderboard structure, ready for real seasons once matches are reported\n- This news feed, for development updates\n\nMore is coming as the game itself develops. Thanks for being early.`,
      category: "Announcements",
    },
    {
      slug: "how-accounts-will-connect-to-the-game",
      title: "How web accounts will connect to the game",
      excerpt:
        "A look at the account architecture: your website login, your public player profile, and your future in-game identity are kept separate on purpose.",
      body: `A quick note on how accounts are built, for anyone curious.\n\nYour website login (email + password) is kept separate from your public player profile (display name, avatar), which is kept separate again from your in-game identity. That separation means the same website account will be able to sign in from the game client on any device once that connection is built, without the game ever needing to see your password.\n\nThe dashboard's "Connected Game" section will light up once that link is available.`,
      category: "Development",
    },
    {
      slug: "leaderboards-are-ready-for-real-seasons",
      title: "Leaderboards are ready for real seasons",
      excerpt:
        "The leaderboard you see today is preview data, clearly marked as such. Here's what it looks like once real matches start counting.",
      body: `The current leaderboard is running on preview data so the page has something to show while the game itself is still in development — every preview row is labeled, and none of it reflects real matches.\n\nWhen the game is ready to report results, matches will flow in through an authenticated server-to-server API, and standings will update from real play. We'd rather ship an honestly-labeled preview than pretend placeholder numbers are live rankings.`,
      category: "Development",
    },
  ];

  for (const article of articles) {
    await prisma.newsArticle.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        ...article,
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: admin.id,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
