import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create your account",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account" subtitle="One account, ready for the game on day one.">
      <RegisterForm />
    </AuthCard>
  );
}
