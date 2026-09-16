import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // The Prisma CLI (migrate deploy/dev, generate, studio) needs a
  // session-capable connection for its advisory lock and prepared
  // statements — a transaction-mode pooler (e.g. Supabase's port 6543)
  // can't provide that and migrate deploy hangs instead of erroring. Point
  // the CLI at DIRECT_URL (a session-capable connection string) here,
  // while the app's own runtime client (src/lib/db.ts) keeps querying
  // through the pooled DATABASE_URL directly via its driver adapter —
  // the two are intentionally decoupled, not the same env var.
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
