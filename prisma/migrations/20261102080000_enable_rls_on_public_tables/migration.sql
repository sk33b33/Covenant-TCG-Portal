-- Enable Row Level Security on every application table.
--
-- Supabase exposes the `public` schema through its PostgREST API, reachable
-- with the project's public anon key. With RLS off, anyone holding that key
-- can read or modify these tables (users, sessions, tokens, saves, ...).
--
-- No policies are created on purpose: with RLS enabled and no policy, the
-- API roles (anon / authenticated) can see and change nothing. The app is
-- unaffected because Prisma connects directly as the table owner, which is
-- exempt from RLS (we deliberately do NOT use FORCE ROW LEVEL SECURITY).
--
-- If a table is ever meant to be read through the Supabase API, add an
-- explicit policy for it in a later migration.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "google_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "player_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "game_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "game_saves" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "game_player_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seasons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leaderboard_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "news_articles" ENABLE ROW LEVEL SECURITY;
