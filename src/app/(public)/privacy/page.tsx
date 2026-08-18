import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Covenant privacy policy placeholder.",
};

export default function PrivacyPage() {
  return (
    <Container className="max-w-2xl py-16">
      <h1 className="font-display text-4xl text-parchment">Privacy Policy</h1>
      <p className="mt-4 text-sm text-faint">Placeholder — last updated: not yet published.</p>

      <div className="prose-covenant mt-10">
        <p>
          This page is a placeholder. Covenant does not yet have a finalized privacy policy —
          this section exists so the site has a stable, linkable location for it once it&apos;s
          written and reviewed.
        </p>
        <p>
          When published, this policy will describe what account information is collected
          (currently: email address, password — stored as a salted hash, never in plain text —
          and the profile details you choose to add), how it&apos;s used, how long it&apos;s
          retained, and how you can request access to or deletion of your data.
        </p>
        <p>
          Until then, treat this account system as what it is: an early account layer for a game
          in development, published ahead of a formal privacy review.
        </p>
      </div>
    </Container>
  );
}
