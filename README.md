# Covenant TCG Portal

The official web portal for **Covenant**, a trading card game currently in development: player
accounts, news, and leaderboards, built as the long-term home for the game's online identity
system.

The game itself doesn't exist as a playable client yet. This repository is the account/community
layer it will eventually plug into — see [`docs/GAME_INTEGRATION.md`](docs/GAME_INTEGRATION.md)
for how that connection is designed to work.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) — unified frontend + server
- **PostgreSQL + Prisma 7** (driver adapter: `@prisma/adapter-pg`) — data layer
- **Hand-rolled session auth** — bcrypt password hashing, DB-backed sessions, no third-party auth
  provider (see [`docs/AUTH.md`](docs/AUTH.md) for why)
- **Tailwind CSS v4** — styling, CSS-first theme
- **Zod** — server-side validation on every form and API input
- **Nodemailer** — transactional email (verification, password reset), with a console-log
  fallback in development

Full rationale for these choices: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Getting started

### Prerequisites

- Node.js 20.9+ (Next.js 16 requirement)
- A PostgreSQL 16 database — either:
  - `docker compose up -d` (starts one at `localhost:5432`, matching the `.env.example` default), or
  - your own local/remote Postgres instance

### Setup

```bash
npm install
cp .env.example .env      # then fill in AUTH_SECRET, GAME_SERVER_API_KEY (see below)
npm run db:migrate        # creates tables
npm run db:seed           # optional: adds a dev admin account + preview leaderboard/news data
npm run dev
```

Open http://localhost:3000.

Generate the two required local secrets:

```bash
openssl rand -hex 32   # → AUTH_SECRET
openssl rand -hex 32   # → GAME_SERVER_API_KEY
```

Every environment variable is documented in [`.env.example`](.env.example) — what it does,
whether it's client-safe, and where to get it.

### Dev-only seeded admin account

`npm run db:seed` creates `admin@covenant.local` / `change-me-now-12345` (overridable via
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) with the `ADMIN` role, plus a `Preview Season`
leaderboard and a few real announcement posts. The seeded season and its leaderboard rows are
flagged `isDemo: true` and the UI shows a "Preview data" notice wherever they render — see
[`docs/DATABASE.md`](docs/DATABASE.md). **Never reuse this account or password outside local
development.**

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:seed` | Seed dev admin + preview data |
| `npm run db:studio` | Prisma Studio (browse the DB) |

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack rationale, account model, API boundaries
- [`docs/AUTH.md`](docs/AUTH.md) — the session/token design in detail
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema, migrations, seed data
- [`docs/GAME_INTEGRATION.md`](docs/GAME_INTEGRATION.md) — the `/api/game/*` contract for the
  future game server
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — production deployment notes
- [`docs/SECURITY.md`](docs/SECURITY.md) — security posture and known limitations
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — local dev workflow

## Assets

No game logo, card artwork, or brand assets exist in this repository yet — `about the game`
itself is still in development. The header/footer logo (`src/components/layout/Logo.tsx`) is a
placeholder sigil built from SVG primitives, and every color/typography choice lives in
`src/app/globals.css` as CSS custom properties. When real artwork exists, drop it in `public/`
and swap `Logo.tsx`'s contents — nothing else in the app depends on it being SVG-drawn.

## Status

This is a working foundation, not a finished product. In particular:

- The game client doesn't exist, so "connected game" status is always a placeholder.
- Leaderboards run on seeded preview data until a real season/match-reporting integration exists.
- Privacy Policy and Terms of Service pages are explicit placeholders pending legal review.
