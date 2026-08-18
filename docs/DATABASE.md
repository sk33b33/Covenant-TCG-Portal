# Database

PostgreSQL, managed with Prisma migrations. Schema source of truth: `prisma/schema.prisma`.

## Prisma 7 notes

This project uses Prisma 7, which changed two things relevant to anyone used to earlier
versions:

1. **No `url` in `schema.prisma`'s `datasource` block.** The connection string lives in
   `prisma.config.ts` (for the CLI/migrations) and is passed explicitly to `PrismaClient` via a
   driver adapter at runtime (`src/lib/db.ts`, using `@prisma/adapter-pg`).
2. **The generated client is TypeScript source, not a pre-built package.** `generator client`
   uses `provider = "prisma-client"` with `output = "../generated/prisma"`, so
   `npx prisma generate` (run automatically via `postinstall`) writes real `.ts` files into
   `generated/prisma/` — gitignored, regenerated on every install. Import it via
   `src/lib/db.ts`, not directly.

## Schema overview

See `prisma/schema.prisma` for the authoritative definitions and inline comments. Summary:

| Model | Purpose |
| --- | --- |
| `User` | Auth identity: email, password hash, role, verification state. |
| `Session` | Server-side session store, keyed by a hash of the cookie token. |
| `VerificationToken` | Single-use email-verification / password-reset tokens. |
| `PlayerProfile` | Public identity: display name, avatar, bio. One-to-one with `User`. |
| `GamePlayerLink` | Placeholder connection to a future in-game player identity. |
| `Season` | A competitive period for the leaderboard. |
| `LeaderboardEntry` | One row per game-identity per season; keyed by `gamePlayerId` (the game's own identifier), with an optional link to `PlayerProfile` for display. |
| `MatchResult` | Append-only audit log of reported match outcomes. |
| `NewsArticle` | Announcements/dev updates, Markdown body, draft/published status. |

## Why `LeaderboardEntry` is keyed by `gamePlayerId`, not `PlayerProfile`

Match results are reported by the game using its own player identifier, which may not (yet) be
linked to a website account — someone can appear on the leaderboard from game data alone. When a
`GamePlayerLink` connects that `gamePlayerId` to a `PlayerProfile`, the leaderboard shows the
real display name/avatar instead of a generated fallback label
(`src/lib/leaderboard.ts#applyResultToEntry`). This is what lets match reporting and account
linking evolve independently.

## Seed data (`prisma/seed.ts`)

Run with `npm run db:seed`. Creates:

- A dev-only admin account (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, defaults printed to the
  console on seed) — **never reuse this outside local development.**
- A `Season` row flagged `isDemo: true` with ~9 `LeaderboardEntry` rows of made-up standings.
- Three genuine `NewsArticle` posts about the website/project itself (not fabricated game lore).

### The `isDemo` flag

Nothing in this repository invents real game rules, card data, or player statistics. The seeded
leaderboard exists so the leaderboard *page* has something to render and be tested against before
the game reports real matches — but it must never be mistaken for live data. Every leaderboard
view (`src/components/leaderboard/DemoDataNotice.tsx`) checks `season.isDemo` and shows an
explicit "Preview data" notice when true. When a real, non-demo `Season` becomes active, that
notice disappears automatically — no code change needed, just don't set `isDemo: true` on it.

## Migrations

```bash
npm run db:migrate      # prisma migrate dev — creates + applies a migration from schema changes
npx prisma migrate deploy  # production: apply pending migrations, no schema diffing/prompts
npm run db:studio       # browse data with Prisma Studio
```

Migration files live in `prisma/migrations/` and are committed — they're the audit trail for how
the schema got to its current state, not just the current-state snapshot.
