"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string };

export function DashboardNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/profile", label: "Profile" },
    { href: "/dashboard/security", label: "Security" },
    { href: "/dashboard/game", label: "Connected game" },
  ];
  if (isAdmin) {
    items.push({ href: "/dashboard/admin/news", label: "Manage news" });
  }

  return (
    <nav
      aria-label="Dashboard"
      className="flex gap-1 overflow-x-auto border-b border-line-soft px-4 py-2 md:flex-col md:border-b-0 md:border-r md:px-3 md:py-6"
    >
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-gold/10 text-gold-bright"
                : "text-muted hover:bg-panel-2 hover:text-parchment",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
