import Link from "next/link";
import { Container } from "./Container";
import { LogoMark } from "./Logo";

const footerLinks = [
  {
    heading: "Game",
    links: [
      { href: "/about", label: "About Covenant" },
      { href: "/news", label: "News" },
      { href: "/leaderboards", label: "Leaderboards" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/register", label: "Create account" },
      { href: "/login", label: "Log in" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line-soft bg-ink-raised">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-gold-bright">
            <LogoMark />
            <span className="font-display text-lg">Covenant</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted">
            The official web portal for Covenant — accounts, rankings, and news for the trading
            card game.
          </p>
        </div>

        {footerLinks.map((group) => (
          <div key={group.heading}>
            <h3 className="font-display text-sm uppercase tracking-wider text-gold">
              {group.heading}
            </h3>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted hover:text-parchment">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container className="border-t border-line-soft py-6">
        <p className="text-xs text-faint">
          © {new Date().getFullYear()} Covenant. This is a work-in-progress portal for a game in
          development — features and content are subject to change.
        </p>
      </Container>
    </footer>
  );
}
