"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { ResolutionThresholdType } from "@prisma/client";

import { createResolutionAction } from "@/app/(portal)/chambers/board/copilot-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const THRESHOLD_OPTIONS: {
  value: ResolutionThresholdType;
  label: string;
}[] = [
  { value: "STANDARD", label: "Standard (3 of 5 majority)" },
  { value: "TIER_2", label: "Tier 2 (4 of 5 supermajority)" },
  { value: "TIER_1", label: "Tier 1 (Investor consent + 4 of 5)" },
  { value: "FAMILY_ONLY", label: "Family-only (3 of 4)" },
];

export function NewResolutionForm({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    body: "",
    thresholdType: "STANDARD" as ResolutionThresholdType,
  });

  async function onSubmit() {
    setError(null);
    const r = await createResolutionAction(meetingId, draft);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setDraft({ title: "", body: "", thresholdType: "STANDARD" });
    setOpen(false);
    startTransition(() => router.refresh());
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 h-3.5 w-3.5" />
        Add resolution
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5 md:p-6">
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          New resolution
        </span>
        <input
          autoFocus
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Resolution title"
          className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
        />
        <textarea
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          rows={5}
          placeholder="Proposed resolution language…"
          className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
        />
        <select
          value={draft.thresholdType}
          onChange={(e) =>
            setDraft({
              ...draft,
              thresholdType: e.target.value as ResolutionThresholdType,
            })
          }
          className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
        >
          {THRESHOLD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-xs text-[var(--accent-red)]">{error}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={pending || !draft.title.trim() || !draft.body.trim()}
            onClick={onSubmit}
          >
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
