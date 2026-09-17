# Security notes

This documents the security posture of the current implementation: what's covered, what's a
known/documented trade-off, and what was found and fixed during review.

## Covered

- **Password storage**: bcrypt, cost 12. Never logged, never returned from a query result that
  reaches a client or JSON response (every `prisma.user.*` call is `select`-scoped —
  verified by grep, no bare `findMany`/`findUnique` without a `select`).
- **Sessions**: opaque random tokens, HMAC-hashed before storage, `httpOnly` + `Secure` (prod) +
  `SameSite=Lax` cookies, DB-validated on every protected request. See
  [`docs/AUTH.md`](AUTH.md).
- **CSRF**: Next.js Server Actions verify the request's `Origin` against `Host` automatically —
  no separate CSRF token scheme was added because the framework already closes this for the
  form-mutation path this app uses exclusively. The `/api/game/*` routes use a Bearer token in
  the `Authorization` header rather than cookies, so they aren't reachable via a cross-site form
  submission in the first place.
- **XSS**: no `dangerouslySetInnerHTML` anywhere in the codebase (verified by grep). News article
  bodies are Markdown rendered via `react-markdown` with no raw-HTML plugin enabled, so embedded
  HTML/script in article content is stripped, not executed. Admin-supplied hero image URLs are
  validated as `http(s)` only (`z.httpUrl()`) and rendered as a plain `<img src>` — not run
  through `next/image`'s server-side fetch/optimizer, and not usable as a script sink even for an
  exotic URL scheme.
- **Authorization**: every Server Action re-derives the caller's identity (and role, for admin
  actions) from the validated session — never from a client-supplied id or role. Session revoke
  (`revokeSessionForUser`) is scoped by `userId` in the `WHERE` clause, so passing another user's
  session id matches zero rows instead of being an IDOR. Route protection is two-layered: `proxy.ts`
  (cookie-presence only, fast redirect) and `requireUser()`/`requireAdmin()` (DB-validated, the
  authoritative check) in every protected layout.
- **Open redirect**: the post-login `?next=` param (used to return a user to the page they were
  trying to reach) is validated to be a same-origin relative path (`safeNextPath` in
  `src/lib/auth/redirect.ts`, shared by both the password-login action and the Google OAuth
  callback) before being passed to `redirect()` — an absolute or protocol-relative URL falls back
  to `/dashboard`. Covered by an automated regression check (see below).
- **Google OAuth**: the authorization-code flow is protected against CSRF by a random `state`
  value round-tripped through a short-lived, `httpOnly`, path-scoped cookie and checked with a
  constant-time comparison before the callback does anything else. The returned ID token's
  signature, issuer, and audience are verified locally against Google's published keys (`jose`)
  before any of its claims are trusted — a forged or tampered token is rejected before it can
  reach the account-linking logic at all. An existing account is only ever auto-linked to a
  Google identity when Google itself reports the email verified (`email_verified: true`); an
  unverified email is refused rather than linked. See
  [`docs/AUTH.md`](AUTH.md#google-sign-in).
- **User enumeration**: login compares against a constant dummy bcrypt hash when the email
  doesn't exist, so response timing doesn't distinguish "wrong password" from "no such account."
  Forgot-password always returns the same generic message regardless of whether the email exists.
- **Token replay/reuse**: email verification and password reset tokens are single-use
  (atomically consumed via a conditional `updateMany`), expiring, and invalidate any earlier
  unused token of the same type on reissue.
- **Rate limiting**: applied to register, login, forgot-password, change-password,
  resend-verification, and the game-server match-submission endpoint. Documented limitation: the
  limiter is in-memory/per-process (`src/lib/rate-limit.ts`), fine for a single instance, not
  sufficient alone for a multi-instance deployment without a shared store.
- **Secrets**: no server secret (`AUTH_SECRET`, `DATABASE_URL`, `GAME_SERVER_API_KEY`, SMTP
  credentials) is referenced from any `"use client"` file (verified by grep) or exposed via
  `NEXT_PUBLIC_*`. `.env` is gitignored; `.env.example` documents every variable without real
  values.
- **SQL injection**: all database access goes through Prisma's parameterized query builder — no
  `$queryRawUnsafe`/`$executeRawUnsafe` anywhere in the codebase (verified by grep).

## Found and fixed during review

- **`proxy.ts` was in the wrong directory.** Next.js requires `proxy.ts` (formerly
  `middleware.ts`) to live next to the `app/` directory — for a `src/`-based project, that's
  `src/proxy.ts`, not the repo root. It was initially placed at the root, where Next.js silently
  never executed it; route protection was still enforced because `requireUser()` in
  `dashboard/layout.tsx` is the authoritative check regardless, but the fast cookie-presence
  redirect (and the `?next=` deep-link parameter) weren't running. Caught via an end-to-end
  browser test that asserted on the redirect URL, not just the end state — fixed by moving the
  file to `src/proxy.ts`.
- **Dead `?next=` parameter.** `proxy.ts` set a `next` query param when redirecting signed-out
  visitors, but nothing read it — login always landed on `/dashboard` regardless of the original
  destination. Not a vulnerability (an unused parameter that's never rendered or reflected can't
  be an open redirect), but the fix (wiring it through `LoginForm` → `loginAction`) needed an
  explicit same-origin check to avoid *introducing* an open redirect, which is why
  `safeNextPath()` exists rather than passing the value straight to `redirect()`.
- **`resendVerificationEmailAction` initially took `(userId, email)` as parameters.** Every
  exported function in a `"use server"` file is a directly client-callable RPC endpoint — a
  caller can invoke it with any arguments, not just the ones the "intended" UI path would send.
  Taking identity as parameters would have meant anyone who found the action reference could
  trigger a verification email to an arbitrary account. Fixed to take no arguments and re-derive
  the current user from the validated session cookie instead. See the comment in
  `src/lib/actions/auth.ts`.

## Dependency notes

`npm audit` flags a high-severity stack-exhaustion advisory in `deepmerge-ts`, pulled in by
`@prisma/config`, which is a transitive dependency of the `prisma` CLI package only —
`@prisma/client` (what actually ships in the deployed app and handles runtime queries) does not
depend on it. It's exercised by `prisma generate`/`migrate` at build/dev time, not by the running
application processing untrusted requests. No action taken beyond noting it here; re-check on the
next `prisma` upgrade.

## Explicitly out of scope for this pass

- No Content-Security-Policy header is configured. Nothing in the current app relies on inline
  scripts/styles that a CSP would need special-casing for, so adding one is a reasonable next
  security hardening step, not a gap this review treats as urgent.
- No automated dependency-vulnerability scanning (Dependabot/Snyk) is wired into CI — this
  repository doesn't have CI configured at all yet.
- Multi-factor authentication, device fingerprinting, and anomaly-based login alerts are not
  implemented — see [`docs/AUTH.md`](AUTH.md#whats-explicitly-out-of-scope-today).

## How this was verified, not just asserted

Beyond static review (grep for `dangerouslySetInnerHTML`, `RawUnsafe`, unscoped `prisma.user.*`
calls, `process.env` in client files), the auth/authorization claims above were exercised with a
real browser (Playwright against a running dev server backed by a real local Postgres instance):
register → dashboard → profile update → logout → protected-route redirect → login → the `next=`
redirect round-trip → the open-redirect guard → admin-only page rejecting a non-admin session →
admin news creation rendering correctly on the public site. The `/api/game/*` endpoints were
exercised directly over HTTP: unauthenticated requests rejected with 401, an authenticated match
submission correctly updating both players' rating/W-L/matches-played atomically.

**Google sign-in** was verified in the pieces that don't require a real Google Cloud OAuth client
and a human clicking through Google's consent screen (nothing in this environment can fabricate
that): the account-linking policy in `resolveOrCreateUserForGoogleIdentity` was exercised
directly against a real Postgres database with fabricated (but realistic) verified/unverified
identity payloads, covering all four cases in
[`docs/AUTH.md`](AUTH.md#google-sign-in) — new account creation, idempotent re-login on the same
Google subject id, auto-linking to an existing password account on a verified email, and refusal
to link on an unverified one — plus display-name collision handling. `/api/auth/google/start` and
`/api/auth/google/callback` were exercised over HTTP: correct Google authorization-URL
construction, cookie scoping/flags, the `next=` open-redirect guard (a `next` pointing off-site
falls back to `/dashboard` exactly like the password-login path), and state-mismatch/missing-state
rejection. The callback's token exchange was confirmed to fail closed (redirect to
`/login?error=exchange_failed`, no crash, no stack trace leaked to the client) against Google's
real token endpoint with a deliberately invalid code — full success can only be confirmed with a
real `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and a real consent flow, which is on whoever
deploys this to verify once those are configured. The login-page messaging for a Google-only
account, and the security page's set-password vs. change-password branching, were both verified
end-to-end with a real browser session.
