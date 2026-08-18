import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/current-user";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Authoritative role check — re-derived from the database on every
  // request, never trusted from a cookie claim or client state.
  await requireAdmin();
  return <>{children}</>;
}
