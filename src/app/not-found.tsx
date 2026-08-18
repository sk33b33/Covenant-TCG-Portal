import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="bg-covenant-glow flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="mb-8 flex items-center gap-2 text-gold-bright">
        <LogoMark />
        <Wordmark />
      </Link>
      <p className="font-display text-6xl text-gold-bright">404</p>
      <h1 className="mt-3 font-display text-2xl text-parchment">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted">
        This page doesn&apos;t exist, or it moved. Let&apos;s get you back on track.
      </p>
      <Button href="/" className="mt-8">
        Back to home
      </Button>
    </div>
  );
}
