"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { createInformationRequestAction, type IRFormState } from "@/app/(portal)/chambers/reporting/information-requests/actions";

const INITIAL: IRFormState = {};

export function NewInformationRequestForm() {
  const [state, action, pending] = useActionState(
    createInformationRequestAction,
    INITIAL,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="subject"
          className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]"
        >
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          maxLength={200}
          defaultValue={state.subject ?? ""}
          className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="body"
          className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]"
        >
          Detail
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={8}
          defaultValue={state.body ?? ""}
          className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <input
          type="checkbox"
          name="isSubstantive"
          defaultChecked={state.isSubstantive ?? true}
          className="h-4 w-4 accent-[var(--accent-green)]"
        />
        Substantive (counts toward quarterly cap of 4)
      </label>

      {state.error ? (
        <p className="text-xs text-[var(--accent-red)]">{state.error}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? "Submitting…" : "Submit request"}
        </Button>
      </div>
    </form>
  );
}
