import Link from "next/link";
import { getOptionalUser } from "@/lib/auth/current-user";
import { Button } from "@/components/ui/Button";
import { Container } from "./Container";
import { LogoMark, Wordmark } from "./Logo";
import { MobileNav } from "./MobileNav";
import { primaryNavLinks } from "./nav-links";

export async function SiteHeader() {
  const user = await getOptionalUser();

  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-ink/90 backdrop-blur-sm">
      <Container className="relative flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-gold-bright">
          <LogoMark />
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {primaryNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-parchment"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button href="/dashboard" size="md">
              Dashboard
            </Button>
          ) : (
            <>
              <Button href="/login" variant="ghost" size="md">
                Log in
              </Button>
              <Button href="/register" size="md">
                Create account
              </Button>
            </>
          )}
        </div>

        <MobileNav isSignedIn={Boolean(user)} />
      </Container>
    </header>
  );
}
