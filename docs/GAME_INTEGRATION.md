# Game integration

The game client (thecovenant.game) now exists and signs players in directly against this portal
— see "Player sign-in and save data" below. This document also still describes a *second*,
separate integration surface: a trusted server-to-server API for a future game *backend* to
report match results, and a still-speculative design for linking some *other*, independently
-authenticating client to a portal account. Those two are unrelated to how the game itself signs
players in today.

## Player sign-in and save data

The game client registers nowhere — accounts only ever get created on the portal (`/register`).
The game only signs in, against the same `User`/`passwordHash` the website's own login checks
(`loginAction`, reused validation and rate-limiting, see `src/app/api/game/auth/login/route.ts`).
There is no separate "game identity": signing into the game *is* signing into the portal account,
which is why this is unrelated to `GamePlayerLink` below.

```
POST /api/game/auth/login          { email, password } → { token, expiresAt, user: { email } }
POST /api/game/auth/logout         Authorization: Bearer <token> → revokes it
GET  /api/game/save                Authorization: Bearer <token> → { state }
POST /api/game/save                Authorization: Bearer <token>, { patch: {...} } → merged in place
```

The bearer token comes from `game-session.ts` — same underlying primitives as a browser session
(`generateOpaqueToken`/`hashToken` from `src/lib/auth/crypto.ts`, only the hash ever stored), just
returned as JSON instead of set as a cookie, since the game runs on a different origin and a
browser can't read another origin's httpOnly cookie anyway. A password reset or change
(`resetPasswordAction`, `changePasswordAction`) revokes every outstanding game session for that
user, the same "sign out everywhere" guarantee browser sessions already get.

`GameSave.state` is opaque JSON from the portal's point of view — the game defines and versions
its own shape entirely. Writes merge (`state = state || patch`) rather than overwrite, so pushing
one slice of a save can't clobber another slice that hasn't changed this tick.

These four routes are the only `/api/game/*` endpoints that take a browser origin at all (CORS,
`src/lib/cors.ts`, restricted to `GAME_CLIENT_ORIGIN`) — everything below this point is a
server-to-server call with no browser involved, and deliberately has no CORS handling at all.

## What's implemented for a future game *backend*: match reporting

Three endpoints under `/api/game/`, authenticated with a **shared-secret Bearer token**
(`GAME_SERVER_API_KEY`) — a trusted server-to-server call, never something embedded in a game
client binary. See `src/lib/game-auth.ts`. Unrelated to the per-player login above: this key
authenticates a whole trusted backend, not an individual player.

```
Authorization: Bearer <GAME_SERVER_API_KEY>
```

### `POST /api/game/matches`

Records a completed match and updates both players' leaderboard standing in one transaction
(`src/lib/leaderboard.ts#recordMatchResult`).

```json
{
  "seasonSlug": "preview-season",
  "winnerGamePlayerId": "game-assigned-id-1",
  "loserGamePlayerId": "game-assigned-id-2",
  "playedAt": "2026-01-01T12:00:00Z"
}
```

Rating math is a deliberately simple flat ±25 per match — explicitly a placeholder, not a real
competitive ruleset (Covenant hasn't defined one). It exists so the leaderboard has *a* working
aggregate to display; replace `PLACEHOLDER_RATING_DELTA` and the surrounding logic in
`src/lib/leaderboard.ts` once a real system is designed. Every caller only depends on
`recordMatchResult`'s signature, not this math.

### `GET /api/game/leaderboard?season=<slug>&page=<n>`

Returns the same paginated standings the website itself renders — a separate endpoint because the
game server authenticates differently (shared secret) than a browser (session cookie); the
website's own leaderboard pages query the database directly rather than calling this.

### `GET /api/game/players/:gamePlayerId`

Resolves a game player id to its linked website profile (display name, avatar), if any. Returns
404 if that game identity hasn't been linked to an account yet. Deliberately never returns
auth-identity fields (email, password hash) — only the public profile.

## What's designed but not built: linking a website account to *another* game identity

Not thecovenant.game — that one signs in directly against a portal account (above), with no
separate identity to link. This is for a still-hypothetical *different* client that authenticates
players its own way (a platform account, a native login, anything) and needs its own opaque
identity connected to a portal account after the fact.

The schema already has the seam for this (`GamePlayerLink`, with `status: NOT_LINKED | PENDING |
LINKED`), and the dashboard already has a page for it (`/dashboard/game`) that shows whatever
that status currently is. What's missing is the handshake that actually sets it, because that
handshake's shape depends on how that client authenticates a player at all — a decision that
belongs to a client which doesn't exist yet.

The intended flow, once such a client exists:

1. The signed-in player requests a short-lived, single-use **link code** from the website (a new,
   small addition — same pattern as `VerificationToken`: random token, hashed at rest, expiring).
2. The player enters that code in the game client.
3. The game server calls a new authenticated endpoint (`POST /api/game/link`, not yet built) with
   the code and its own `gamePlayerId`, which atomically consumes the code and sets
   `GamePlayerLink.status = LINKED`.

This keeps the website never needing to know how the game client itself authenticates a player
locally (password? platform account? something else) — the website only ever hands out a
short-lived code and receives a game-assigned id back, over the same trusted server-to-server
channel as match reporting.

## Security notes for the future game server implementer

- `GAME_SERVER_API_KEY` is a single shared secret for the whole game backend, not per-player.
  Never ship it inside a distributable game client — it belongs on whatever server the game
  studio controls, calling these endpoints on players' behalf.
- Every `/api/game/*` request should come from that trusted server, not be proxied through
  arbitrary client input.
- If/when the game needs many independent server instances calling in, consider per-instance keys
  instead of one shared secret — the current single-key design is the simplest thing that works
  for "one trusted backend," not a multi-tenant credential system.
