"use client";

import { useActionState } from "react";
import { setPasswordAction } from "@/lib/actions/security";
import { initialActionState } from "@/lib/actions/types";
import { FieldGroup, FieldErrors, Input, Label } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";

export function SetPasswordForm() {
  const [state, formAction] = useActionState(setPasswordAction, initialActionState);

  return (
    <form action={formAction} noValidate>
      <FormMessage status="error" message={state.status === "error" ? state.message : undefined} />
      <FormMessage
        status="success"
        message={state.status === "success" ? state.message : undefined}
      />

      <FieldGroup>
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={128}
        />
        <FieldErrors errors={state.fieldErrors?.newPassword} />
      </FieldGroup>

      <SubmitButton pendingLabel="Setting…">Set password</SubmitButton>
    </form>
  );
}
