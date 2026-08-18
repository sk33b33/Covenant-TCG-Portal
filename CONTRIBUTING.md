# Contributing

## Local setup

See the [README](README.md#getting-started) for install/setup steps.

## Workflow

1. Create a branch off `main`.
2. Make your change.
3. Before opening a PR, run:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```
4. If you changed `prisma/schema.prisma`, run `npm run db:migrate` to generate a migration and
   commit the resulting `prisma/migrations/<timestamp>_<name>/` directory — migrations are the
   audit trail for schema changes, not just the end state.

## Conventions

- **Server Actions, not client-side fetch, for mutations.** See `src/lib/actions/` for the
  pattern: parse with Zod, re-derive the caller's identity from `getCurrentSession()` (never trust
  a client-passed user id or role — see [`docs/AUTH.md`](docs/AUTH.md)), return a typed
  `ActionState`.
- **Data access goes through a service module**, not directly from page components — see
  `src/lib/leaderboard.ts` and `src/lib/news.ts` for the pattern. New features should follow the
  same shape.
- **No comments explaining *what* code does** — name things clearly instead. Comments are for
  *why*: a non-obvious constraint, a workaround, a security-relevant decision.
- **Every data-driven page needs a loading, empty, and error state.** See
  `src/components/ui/DataStates.tsx`.
- **Don't add tables/features speculatively.** The schema and API surface are scoped to what the
  product needs today, with documented seams (`GamePlayerLink`, `docs/GAME_INTEGRATION.md`) for
  what's coming.

## Security-sensitive changes

Anything touching `src/lib/auth/`, `src/lib/actions/`, `proxy.ts`, or `/api/game/*` is
security-sensitive. Read [`docs/AUTH.md`](docs/AUTH.md) and
[`docs/SECURITY.md`](docs/SECURITY.md) first. In particular: every exported function in a
`"use server"` file is a directly client-callable RPC — never write one that trusts a
caller-supplied identity/role instead of re-deriving it from the session.
