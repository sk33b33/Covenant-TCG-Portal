"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions/profile";
import { initialActionState } from "@/lib/actions/types";
import { FieldGroup, FieldErrors, Input, Label, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";

export function UpdateProfileForm({
  displayName,
  bio,
}: {
  displayName: string;
  bio: string | null;
}) {
  const [state, formAction] = useActionState(updateProfileAction, initialActionState);

  return (
    <form action={formAction} noValidate>
      <FormMessage status="error" message={state.status === "error" ? state.message : undefined} />
      <FormMessage
        status="success"
        message={state.status === "success" ? state.message : undefined}
      />

      <FieldGroup>
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={displayName}
          required
          minLength={3}
          maxLength={24}
        />
        <FieldErrors errors={state.fieldErrors?.displayName} />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" rows={3} maxLength={280} defaultValue={bio ?? ""} />
        <FieldErrors errors={state.fieldErrors?.bio} />
      </FieldGroup>

      <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
    </form>
  );
}
