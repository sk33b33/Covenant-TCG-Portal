# Architecture

## Context

This repository started empty — no existing game code, backend, or web stack. Everything here
was chosen for this project specifically, not inherited from an existing codebase.

## Stack decision

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | Server Components keep data access server-side by default (no accidental client-exposed queries), Server Actions give secure form mutations without hand-building an API for every form, and one deployable covers frontend + backend for a project this size. |
| Language | TypeScript, strict mode | Type safety across the DB layer (Prisma-generated types), form validation (Zod), and components. |
| Database | PostgreSQL | Relational data (users, sessions, leaderboard standings, articles) with real constraints (uniqueness, foreign keys) and transactions — matters for correctness on things like "don't double-count a match result." |
| ORM | Prisma 7 (`@prisma/adapter-pg` driver adapter) | Typed queries, migrations, and a single schema file as the source of truth. Prisma 7 requires an explicit driver adapter rather than a schema-embedded connection string — see the comment in `prisma.config.ts`. |
| Auth | Hand-rolled session auth (bcrypt + DB-backed sessions) | See "Why not a third-party auth library" below. |
| Styling | Tailwind CSS v4 | CSS-first theme (`src/app/globals.css`) keeps the whole design system (colors, fonts, animation) in one place without a JS config file. |
| Email | Nodemailer, SMTP-configurable | No vendor lock-in; falls back to logging emails to the console in development so the auth flow is testable without real SMTP credentials. |

### Why not a third-party auth library

NextAuth/Auth.js is built primarily around OAuth providers and has historically awkward support
for the specific flows this product needs out of the box: email+password with a real
verification/reset lifecycle, DB-backed sessions with per-device revocation, and a clean
separation between "auth identity" and "player profile." Rolling a small, fully-understood auth
layer (~a few hundred lines, see `src/lib/auth/`) using well-vetted primitives — `bcryptjs` for
hashing, cryptographically random tokens, HMAC-hashed session/verification tokens — gives full
control over that lifecycle without fighting a framework built for a different shape of problem.
See [`docs/AUTH.md`](AUTH.md) for the design in detail.

## Account model

Several concerns are deliberately kept in separate tables (see `prisma/schema.prisma`):

```
User (auth identity)        — email, password hash (optional — see below), role, verification state
  ├── PlayerProfile (public) — display name, avatar, bio
  ├── GamePlayerLink (future) — connection to an in-game player identity
  └── GoogleAccount (optional) — a linked Google identity, keyed on Google's stable subject id
```

**Why**: the website login (`User`) should never need to change shape just because the public
profile changes, and the in-game connection (`GamePlayerLink`) is speculative — it exists as a
clean seam to build the real game-account link against later, without touching auth or profile
data. A password reset, a display name change, and a future "link my game account" flow are three
independent operations on three independent tables. `GoogleAccount` follows the same logic: a
`User` can exist with a password, a linked Google account, or both — see
[`docs/AUTH.md`](AUTH.md#google-sign-in) for the account-linking policy.

## API boundaries

- **Browser ↔ server**: Server Actions (`src/lib/actions/*.ts`) for all mutations (register,
  login, profile updates, admin news CRUD). Every action re-derives the caller's identity from
  the validated session cookie — never from a client-supplied user id or role. See the comment in
  `src/lib/actions/auth.ts` on `resendVerificationEmailAction` for why this matters: any exported
  function in a `"use server"` file is a directly client-callable RPC.
- **Game server ↔ website**: `/api/game/*` routes, authenticated with a shared-secret Bearer
  token (`GAME_SERVER_API_KEY`), never a browser cookie. See
  [`docs/GAME_INTEGRATION.md`](GAME_INTEGRATION.md).
- **Route protection**: `proxy.ts` (Next.js 16's renamed `middleware.ts`) does a cheap
  cookie-presence check to redirect signed-out visitors away from `/dashboard` before any
  rendering happens. It intentionally does **not** query the database or trust the cookie's
  contents — the authoritative check is `requireUser()` / `requireAdmin()`
  (`src/lib/auth/current-user.ts`), which validates the session against the database on every
  request to a protected page. This is defense in depth: proxy is a fast UX redirect, the page
  layout is the real authorization boundary.

## Directory layout

```
src/app/(public)/     Marketing/community pages — home, news, leaderboards, about, legal
src/app/(auth)/       Login, register, password reset, email verification — minimal layout
src/app/dashboard/    Authenticated area — requires a valid session (requireUser in layout.tsx)
src/app/api/game/     Game-server-to-website API (shared-secret auth, not cookies)
src/lib/auth/         Password hashing, sessions, verification tokens
src/lib/actions/      Server Actions (form mutations)
src/lib/              Data-access modules (leaderboard.ts, news.ts), email, rate limiting
src/components/       UI primitives, layout chrome, feature components
prisma/               Schema, migrations, seed script
docs/                 This documentation
```

## Extensibility

The schema deliberately does not include tables this product doesn't need yet — decks, cards,
collections, matches beyond the minimal `MatchResult` audit log, tournaments, achievements. The
account model (`User` / `PlayerProfile` / `GamePlayerLink`) and the leaderboard/news services
(`src/lib/leaderboard.ts`, `src/lib/news.ts`) are the seams meant to grow: new features should
add tables and read/write through a small service module the same way, rather than querying
Prisma directly from page components.
