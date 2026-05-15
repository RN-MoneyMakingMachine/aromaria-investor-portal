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

const ZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "ZONE_1", label: "Zone 1" },
  { value: "ZONE_2", label: "Zone 2 (Reserved Matter)" },
  { value: "ZONE_3", label: "Zone 3" },
  { value: "ZONE_4", label: "Zone 4" },
  { value: "EMERGENCY", label: "Emergency Authority" },
  { value: "THRESHOLD", label: "Threshold Review" },
];

const TIER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "TIER_1", label: "Tier 1 (Investor + Board)" },
  { value: "TIER_2", label: "Tier 2 (Board supermajority)" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving" : "Save decision"}
    </Button>
  );
}

export function NewDecisionForm({
  owners,
}: {
  owners: { id: string; name: string }[];
}) {
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
          rows={6}
          defaultValue={state.body ?? ""}
          className="w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-sm text-[var(--text-primary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={state.status ?? "OPEN"}
            className="flex h-11 w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-sm text-[var(--text-primary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)]"
          >
            {Object.entries(DECISION_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="zone">Authority Matrix Zone</Label>
          <select
            id="zone"
            name="zone"
            defaultValue={state.zone ?? ""}
            className="flex h-11 w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-sm text-[var(--text-primary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)]"
          >
            {ZONE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tier">Reserved Matter Tier (if applicable)</Label>
          <select
            id="tier"
            name="tier"
            defaultValue={state.tier ?? ""}
            className="flex h-11 w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-sm text-[var(--text-primary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)]"
          >
            {TIER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="ownerId">Owner (accountable for execution)</Label>
          <select
            id="ownerId"
            name="ownerId"
            defaultValue={state.ownerId ?? ""}
            className="flex h-11 w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-sm text-[var(--text-primary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)]"
          >
            <option value="">Unassigned</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="targetCompletionDate">Target completion date</Label>
          <Input
            id="targetCompletionDate"
            name="targetCompletionDate"
            type="date"
            defaultValue={state.targetCompletionDate ?? ""}
          />
        </div>
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
