"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/types";
import { FieldGroup, FieldErrors, Input, Label } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormMessage } from "@/components/ui/FormMessage";

export function LoginForm({ infoMessage, next }: { infoMessage?: string; next?: string }) {
  const [state, formAction] = useActionState(loginAction, initialActionState);

  return (
    <form action={formAction} noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {infoMessage && state.status === "idle" ? (
        <FormMessage status="success" message={infoMessage} />
      ) : null}
      <FormMessage status="error" message={state.status === "error" ? state.message : undefined} />

      <FieldGroup>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
        <FieldErrors errors={state.fieldErrors?.email} />
      </FieldGroup>

      <FieldGroup>
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="mb-0">
            Password
          </Label>
          <Link href="/forgot-password" className="text-xs text-gold hover:text-gold-bright">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5"
        />
        <FieldErrors errors={state.fieldErrors?.password} />
      </FieldGroup>

      <SubmitButton pendingLabel="Signing in…" className="w-full">
        Log in
      </SubmitButton>

      <p className="mt-6 text-center text-sm text-muted">
        New to Covenant?{" "}
        <Link href="/register" className="text-gold hover:text-gold-bright">
          Create an account
        </Link>
      </p>
    </form>
  );
}
