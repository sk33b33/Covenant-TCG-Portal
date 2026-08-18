# Game integration

Covenant's game client doesn't exist yet. This document describes what's already built
(the server-to-server API the future game backend will call) and what's intentionally left as a
design sketch rather than code, because building it now would mean guessing at a client that
doesn't exist.

## What's implemented today

Three endpoints under `/api/game/`, authenticated with a **shared-secret Bearer token**
(`GAME_SERVER_API_KEY`) — a trusted server-to-server call, never something embedded in a game
client binary. See `src/lib/game-auth.ts`.

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

## What's designed but not built: linking a website account to a game identity

The schema already has the seam for this (`GamePlayerLink`, with `status: NOT_LINKED | PENDING |
LINKED`), and the dashboard already has a page for it (`/dashboard/game`) that shows whatever
that status currently is. What's missing is the handshake that actually sets it, because that
handshake's shape depends on how the game client authenticates a player at all — a decision that
belongs to the game client, which doesn't exist yet.

The intended flow, once a game client exists:

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
