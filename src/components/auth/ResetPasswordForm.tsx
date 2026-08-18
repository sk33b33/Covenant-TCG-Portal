"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FieldGroup, FieldErrors, Input, Label } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialActionState);

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="token" value={token} />
      <FormMessage status="error" message={state.status === "error" ? state.message : undefined} />

      <FieldGroup>
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={128}
        />
        <p className="mt-1.5 text-xs text-faint">At least 10 characters.</p>
        <FieldErrors errors={state.fieldErrors?.password} />
      </FieldGroup>

      <SubmitButton pendingLabel="Resetting…" className="w-full">
        Reset password
      </SubmitButton>
    </form>
  );
}
