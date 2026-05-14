"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DECISION_STATUS_LABEL } from "@/lib/constants";

import {
  createDecisionAction,
  type DecisionFormState,
} from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving" : "Save decision"}
    </Button>
  );
}

export function NewDecisionForm() {
  const [state, action] = useActionState<DecisionFormState, FormData>(
    createDecisionAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={state.title ?? ""}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="summary">Summary</Label>
        <textarea
          id="summary"
          name="summary"
          required
          rows={3}
          defaultValue={state.summary ?? ""}
          className="w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-sm text-[var(--text-primary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Body</Label>
        <textarea
          id="body"
          name="body"
          rows={8}
          defaultValue={state.body ?? ""}
          className="w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-sm text-[var(--text-primary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={state.status ?? "OPEN"}
          className="flex h-11 w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-base text-[var(--text-primary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)]"
        >
          {Object.entries(DECISION_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <p className="text-xs text-[var(--accent-red)]">{state.error}</p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
