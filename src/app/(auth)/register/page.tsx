import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { isGoogleSignInConfigured } from "@/lib/auth/google";

export const metadata: Metadata = {
  title: "Create your account",
  robots: { index: false },
};

// Otherwise static-eligible, which would bake isGoogleSignInConfigured()'s
// result into the page at build time — showing/hiding the Google button
// based on whatever GOOGLE_CLIENT_ID was set to during the last deploy,
// not the current one, until the next rebuild.
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account" subtitle="One account, ready for the game on day one.">
      <RegisterForm googleEnabled={isGoogleSignInConfigured()} />
    </AuthCard>
  );
}
