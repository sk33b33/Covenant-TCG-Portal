import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { isGoogleSignInConfigured } from "@/lib/auth/google";
import { googleOAuthErrorMessage } from "@/lib/auth/google-error-messages";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; next?: string; error?: string }>;
}) {
  const { reset, next, error } = await searchParams;
  const infoMessage =
    reset === "success" ? "Password updated. Log in with your new password." : undefined;

  return (
    <AuthCard title="Welcome back" subtitle="Log in to your Covenant account.">
      <LoginForm
        infoMessage={infoMessage}
        oauthError={googleOAuthErrorMessage(error)}
        next={next}
        googleEnabled={isGoogleSignInConfigured()}
      />
    </AuthCard>
  );
}
