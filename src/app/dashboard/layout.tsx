import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { LogoMark, Wordmark } from "@/components/layout/Logo";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Defense in depth: proxy.ts already redirects signed-out visitors away
  // from /dashboard based on cookie presence alone. This is the
  // authoritative check — it validates the session against the database.
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b border-line-soft px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-gold-bright">
          <LogoMark />
          <Wordmark />
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
          <LogoutButton />
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <DashboardNav isAdmin={user.role === "ADMIN"} />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
