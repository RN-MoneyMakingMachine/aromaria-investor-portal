"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REPORT_TYPE_LABEL } from "@/lib/constants";

import {
  createReportAction,
  type ReportFormState,
} from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving" : "Save report"}
    </Button>
  );
}

export function NewReportForm() {
  const [state, action] = useActionState<ReportFormState, FormData>(
    createReportAction,
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
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          defaultValue={state.type ?? "FINANCIAL"}
          required
          className="flex h-11 w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-base text-[var(--text-primary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)]"
        >
          {Object.entries(REPORT_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="periodLabel">Period</Label>
        <Input
          id="periodLabel"
          name="periodLabel"
          required
          placeholder="e.g. Q3 2026 or May 2026"
          defaultValue={state.periodLabel ?? ""}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="summary">Summary</Label>
        <textarea
          id="summary"
          name="summary"
          rows={6}
          defaultValue={state.summary ?? ""}
          className="w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-sm text-[var(--text-primary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)]"
        />
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
