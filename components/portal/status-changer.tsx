"use client";

import { useState, useTransition } from "react";
import type { Status } from "@prisma/client";
import { ChevronDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_LABEL, STATUS_LABEL_SHORT, STATUS_PROGRESS } from "@/lib/constants";
import { changeStatusAction } from "@/app/(portal)/deliverables/actions";

const STATUS_OPTIONS: Status[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED_FOR_REVIEW",
  "IN_REVIEW",
  "BLOCKED",
  "COMPLETED",
];

export function StatusChanger({
  deliverableId,
  currentStatus,
}: {
  deliverableId: string;
  currentStatus: Status;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pick(status: Status) {
    setError(null);
    if (status === currentStatus) return;
    start(async () => {
      const result = await changeStatusAction(deliverableId, status);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={pending}>
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            <span title={STATUS_LABEL[currentStatus]}>
              {STATUS_LABEL_SHORT[currentStatus] ?? STATUS_LABEL[currentStatus]}
            </span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          {STATUS_OPTIONS.map((s) => (
            <DropdownMenuItem
              key={s}
              onSelect={() => pick(s)}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="truncate">{STATUS_LABEL[s]}</span>
              <span className="tabular font-mono text-[10px] text-[var(--text-tertiary)]">
                {STATUS_PROGRESS[s] ?? 0}%
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {error ? (
        <p className="text-[10px] text-[var(--accent-red)]">{error}</p>
      ) : null}
    </div>
  );
}
