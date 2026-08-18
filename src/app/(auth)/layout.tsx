import type { ReactNode } from "react";
import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-covenant-glow flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-gold-bright">
        <LogoMark />
        <Wordmark />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <Link href="/" className="mt-8 text-sm text-muted hover:text-parchment">
        ← Back to home
      </Link>
    </div>
  );
}
