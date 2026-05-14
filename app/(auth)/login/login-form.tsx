"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { authenticate, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      className="w-full"
      disabled={pending}
    >
      {pending ? "Signing in" : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(authenticate, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          spellCheck={false}
          defaultValue={state.email ?? ""}
          placeholder="you@aromaria.mx"
        />
      </div>

      {state.error ? (
        <p className="text-xs text-[var(--accent-red)]">{state.error}</p>
      ) : null}

      <SubmitButton />

      <p className="text-center text-[10px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
        By invitation only
      </p>
    </form>
  );
}
