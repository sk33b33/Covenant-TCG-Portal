"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FieldGroup, FieldErrors, Input, Label } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialActionState);

  return (
    <form action={formAction} noValidate>
      <FormMessage status="error" message={state.status === "error" ? state.message : undefined} />

      <FieldGroup>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
        <FieldErrors errors={state.fieldErrors?.email} />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="nickname"
          required
          minLength={3}
          maxLength={24}
        />
        <FieldErrors errors={state.fieldErrors?.displayName} />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="password">Password</Label>
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

      <SubmitButton pendingLabel="Creating account…" className="w-full">
        Create account
      </SubmitButton>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-gold hover:text-gold-bright">
          Log in
        </Link>
      </p>
    </form>
  );
}
