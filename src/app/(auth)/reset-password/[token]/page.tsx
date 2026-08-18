import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { peekVerificationToken } from "@/lib/auth/tokens";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false },
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const isValid = await peekVerificationToken(token, "PASSWORD_RESET");

  if (!isValid) {
    return (
      <AuthCard title="Link expired">
        <p className="text-sm text-muted">
          This password reset link is invalid or has expired. Reset links are only valid for one
          hour.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm text-gold hover:text-gold-bright"
        >
          Request a new link →
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
