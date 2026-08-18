import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Covenant terms of service placeholder.",
};

export default function TermsPage() {
  return (
    <Container className="max-w-2xl py-16">
      <h1 className="font-display text-4xl text-parchment">Terms of Service</h1>
      <p className="mt-4 text-sm text-faint">Placeholder — last updated: not yet published.</p>

      <div className="prose-covenant mt-10">
        <p>
          This page is a placeholder. Covenant does not yet have finalized terms of service —
          this section exists so the site has a stable, linkable location for them once
          they&apos;re written and reviewed.
        </p>
        <p>
          In the meantime, the short version: this account system is part of a game still in
          development. Features, rules, and this account structure itself may change before
          launch. Don&apos;t rely on anything here as a finished product yet.
        </p>
      </div>
    </Container>
  );
}
