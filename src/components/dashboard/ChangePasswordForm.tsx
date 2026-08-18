"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/actions/security";
import { initialActionState } from "@/lib/actions/types";
import { FieldGroup, FieldErrors, Input, Label } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initialActionState);

  return (
    <form action={formAction} noValidate>
      <FormMessage status="error" message={state.status === "error" ? state.message : undefined} />
      <FormMessage
        status="success"
        message={state.status === "success" ? state.message : undefined}
      />

      <FieldGroup>
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldErrors errors={state.fieldErrors?.currentPassword} />
      </FieldGroup>

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

      <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
    </form>
  );
}
