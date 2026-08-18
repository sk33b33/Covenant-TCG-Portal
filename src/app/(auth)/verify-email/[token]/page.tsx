import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { peekVerificationToken } from "@/lib/auth/tokens";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false },
};

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const isValid = await peekVerificationToken(token, "EMAIL_VERIFICATION");

  if (!isValid) {
    return (
      <AuthCard title="Link expired">
        <p className="text-sm text-muted">
          This verification link is invalid, expired, or was already used.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-gold hover:text-gold-bright">
          Log in, then request a new link from your account security page →
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Verify your email">
      <VerifyEmailForm token={token} />
    </AuthCard>
  );
}
