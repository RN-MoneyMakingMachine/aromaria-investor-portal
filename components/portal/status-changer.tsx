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
import { STATUS_LABEL } from "@/lib/constants";
import { changeStatusAction } from "@/app/(portal)/deliverables/actions";

const STATUS_OPTIONS: Status[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
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
            <span>{STATUS_LABEL[currentStatus]}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {STATUS_OPTIONS.map((s) => (
            <DropdownMenuItem
              key={s}
              onSelect={() => pick(s)}
              className="text-xs uppercase tracking-widest"
            >
              {STATUS_LABEL[s]}
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
