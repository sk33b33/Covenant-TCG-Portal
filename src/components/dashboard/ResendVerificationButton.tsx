"use client";

import { useActionState } from "react";
import { resendVerificationEmailAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";

export function ResendVerificationButton() {
  const [state, formAction] = useActionState(
    () => resendVerificationEmailAction(),
    initialActionState,
  );

  return (
    <form action={formAction}>
      {state.status !== "idle" ? (
        <FormMessage status={state.status === "error" ? "error" : "success"} message={state.message} />
      ) : null}
      <SubmitButton pendingLabel="Sending…" variant="secondary">
        Resend verification email
      </SubmitButton>
    </form>
  );
}
