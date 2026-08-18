# Deployment

This is a standard Next.js 16 App Router application with a PostgreSQL database — it deploys
anywhere that runs a Node.js server (Vercel, Fly.io, Railway, a plain VM/container, etc.). Next.js
16's Build Adapters API is still alpha, so there's no adapter config committed here; `next build`
+ `next start` works out of the box on any Node host.

## Before deploying

1. **Provision PostgreSQL.** Any managed Postgres works (Neon, Supabase's Postgres, RDS, Fly
   Postgres, etc.) — this project only uses Postgres itself, not any platform-specific service.
2. **Set environment variables** (see `.env.example` for the full list with descriptions):
   - `DATABASE_URL` — the production connection string
   - `AUTH_SECRET` — a strong random value (`openssl rand -hex 32`), **different from
     development**
   - `APP_URL` — the real public URL (used to build links in verification/reset emails)
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` — required in
     production; without them, verification and password-reset emails are only logged to the
     server console (fine for local dev, silently broken for real users in prod)
   - `GAME_SERVER_API_KEY` — a strong random value, shared only with the trusted game server
     backend once one exists
3. **Run migrations** against the production database: `npx prisma migrate deploy` (not
   `migrate dev` — that's interactive and meant for local schema iteration).
4. **Do not run `npm run db:seed` against production.** It's meant for local/dev environments and
   creates a documented, publicly-known dev password.

## Build & run

```bash
npm ci
npx prisma generate     # also runs automatically via postinstall
npx prisma migrate deploy
npm run build
npm run start
```

## Runtime notes

- `proxy.ts` (Next 16's renamed middleware) runs on the Node.js runtime, not Edge — this project
  doesn't rely on Edge-specific APIs, so no additional deployment configuration is needed for it.
- Sessions are stored in Postgres, not in-process — the app is safe to run behind a load balancer
  across multiple instances **except** for the in-memory rate limiter
  (`src/lib/rate-limit.ts`), which is per-process by design and documented as such. Multi-instance
  deployments that want real distributed rate limiting should swap that module for a shared store
  (Redis/Upstash) before scaling out — see the file's own comment for the exact seam.
- `GAME_SERVER_API_KEY` should be rotated the same way any server secret would be — update the
  environment variable and redeploy; nothing caches it beyond process lifetime.

## Health check

There's no dedicated `/api/health` route yet — `GET /` (200 when the app and DB are reachable) is
sufficient for most platforms' health checks today. Add a dedicated endpoint if your deployment
platform requires one that doesn't render a full page.
