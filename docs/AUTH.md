# Authentication

## Overview

Email + password authentication with server-side sessions. No OAuth, no third-party identity
provider, no JWTs stored client-side. Everything server-verifiable lives in Postgres; the browser
only ever holds an opaque random token.

## Password storage

`bcryptjs`, cost factor 12 (`src/lib/auth/password.ts`). Passwords are never logged, never
returned from any query (`select`-scoped everywhere), and never sent in a response body.

Password policy (`src/lib/validation/auth.ts`) is length-based (10–128 characters) per current
NIST 800-63B guidance, rather than forced composition rules (must contain a symbol, etc.), which
research shows pushes people toward predictable substitutions instead of actually stronger
passwords.

## Sessions

- On login/register, a random 32-byte token is generated (`generateOpaqueToken`,
  `src/lib/auth/crypto.ts`) and set as an `httpOnly`, `Secure` (in production), `SameSite=Lax`
  cookie.
- The database never stores that raw token — only `HMAC-SHA256(token, AUTH_SECRET)`
  (`hashToken`). A leaked `sessions` table row can't be replayed as a cookie, and rotating
  `AUTH_SECRET` instantly invalidates every session.
- Sessions carry a 30-day absolute lifetime with rolling renewal: any request within 7 days of
  expiry silently extends it another 30 days, so an active player is never logged out mid-session
  while an abandoned session still expires.
- Sessions are looked up by primary key (the token hash) on every request that needs identity —
  there's no server-side session cache to go stale, and revocation (sign out one device, sign out
  everywhere on password change) is a single `DELETE`.

See `src/lib/auth/session.ts` for the full implementation.

## Why session cookies over JWTs

A signed JWT would let the server skip a database lookup, at the cost of being unrevocable until
it expires — there's no way to sign out a single device or force-logout after a password change
without a denylist, which is extra infrastructure that reintroduces the same DB lookup this was
meant to avoid. Given the "multi-device login, revocable sessions" requirement, DB-backed
sessions are the simpler design here, not the more complex one.

## Verification & password reset tokens

Both use the same pattern (`src/lib/auth/tokens.ts`):

1. A random opaque token is generated; only its HMAC hash is stored (`VerificationToken.tokenHash`).
2. Tokens are single-use (`usedAt`) and time-limited (24h for email verification, 1h for password
   reset).
3. Issuing a new token invalidates any previous unused token of the same type for that user —
   only the most recently requested link ever works.
4. Consumption is atomic (`updateMany` conditioned on `usedAt: null`), so two concurrent requests
   with the same token can't both succeed.

**Email verification is a two-step confirm, not a bare link click.** Clicking the emailed link
lands on a page that shows the token is valid and asks for one more click to actually confirm.
This is deliberate: corporate email security scanners and some mail clients pre-fetch/auto-click
links to scan them for malware, which would silently burn a single-use token before the user ever
sees it if verification happened directly on the GET request. Password reset has the same
"unauthenticated GET" exposure but a different mitigation — the reset-password page **peeks** at
token validity (read-only) without consuming it, and only *submitting the new-password form*
(a real user action) consumes the token.

## Rate limiting

`src/lib/rate-limit.ts` — an in-memory fixed-window limiter applied to register, login, forgot
password, change password, and resend-verification. It's intentionally simple, with a known
limitation documented in the file: it's per-process, so it resets on deploy and doesn't share
state across multiple instances. That's an acceptable trade-off for a single-instance deployment;
scaling to multiple instances/replicas means swapping this for a shared store (Redis/Upstash) —
only the call sites in `src/lib/actions/*.ts` would need to change, not the calling convention.

## Authorization

- **Route-level**: `proxy.ts` redirects signed-out visitors away from `/dashboard` based on
  cookie presence (fast, no DB hit, not authoritative).
- **Page-level**: `requireUser()` / `requireAdmin()` (`src/lib/auth/current-user.ts`) validate
  the session against the database on every request to a protected page or admin page. This is
  the real authorization boundary.
- **Action-level**: every Server Action that mutates data re-derives the caller's identity (and
  role, for admin actions) from `getCurrentSession()` — never from a form field, a client-passed
  argument, or an assumption about which UI path called it. This matters specifically because
  every exported function in a `"use server"` file becomes a client-callable RPC endpoint; a
  function like `resendVerificationEmailAction()` takes no caller-supplied identity precisely so
  it can't be invoked for an arbitrary account.

## What's explicitly out of scope today

- Multi-factor authentication
- OAuth / social login
- Passkeys/WebAuthn

None of these are precluded by this design — they'd layer on top of the existing `User` /
`Session` split — they're just not built because nothing in the current requirements calls for
them yet.
