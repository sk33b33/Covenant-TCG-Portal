"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { primaryNavLinks } from "./nav-links";

export function MobileNav({ isSignedIn }: { isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-parchment"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.75" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="1.75" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open ? (
        <div
          id="mobile-nav-panel"
          className="absolute inset-x-0 top-16 z-40 border-b border-line bg-ink-raised px-4 pb-6 pt-2 animate-fade-in"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {primaryNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base text-parchment hover:bg-panel-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {isSignedIn ? (
              <Button href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button href="/register" onClick={() => setOpen(false)}>
                  Create account
                </Button>
                <Button href="/login" variant="secondary" onClick={() => setOpen(false)}>
                  Log in
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
