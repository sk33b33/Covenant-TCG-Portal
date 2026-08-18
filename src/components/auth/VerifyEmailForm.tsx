"use client";

import { useActionState } from "react";
import Link from "next/link";
import { verifyEmailAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(verifyEmailAction, initialActionState);

  if (state.status === "success") {
    return (
      <>
        <FormMessage status="success" message={state.message} />
        <Link href="/dashboard" className="text-sm text-gold hover:text-gold-bright">
          Go to your dashboard →
        </Link>
      </>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <FormMessage status="error" message={state.status === "error" ? state.message : undefined} />
      <p className="mb-5 text-sm text-muted">
        Click below to confirm this is your email address. We ask for a click here (not just the
        link itself) so automated email scanners can&apos;t burn the link before you see it.
      </p>
      <SubmitButton pendingLabel="Confirming…" className="w-full">
        Confirm email
      </SubmitButton>
    </form>
  );
}
