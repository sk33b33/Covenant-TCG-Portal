"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FieldGroup, FieldErrors, Input, Label } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialActionState);

  if (state.status === "success") {
    return <FormMessage status="success" message={state.message} />;
  }

  return (
    <form action={formAction} noValidate>
      <FormMessage status="error" message={state.status === "error" ? state.message : undefined} />

      <FieldGroup>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
        <FieldErrors errors={state.fieldErrors?.email} />
      </FieldGroup>

      <SubmitButton pendingLabel="Sending…" className="w-full">
        Send reset link
      </SubmitButton>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="text-gold hover:text-gold-bright">
          Back to login
        </Link>
      </p>
    </form>
  );
}
