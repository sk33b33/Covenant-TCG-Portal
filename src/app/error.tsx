"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-covenant-glow flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="mb-8 flex items-center gap-2 text-gold-bright">
        <LogoMark />
        <Wordmark />
      </Link>
      <h1 className="font-display text-2xl text-parchment">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-muted">
        An unexpected error occurred. You can try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="secondary">
          Back to home
        </Button>
      </div>
    </div>
  );
}
