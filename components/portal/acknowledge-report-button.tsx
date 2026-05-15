"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { acknowledgeReportAction } from "@/app/(portal)/chambers/reporting/actions";
import { Button } from "@/components/ui/button";

export function AcknowledgeReportButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    const r = await acknowledgeReportAction(id);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={pending}
        onClick={onClick}
      >
        <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
        {pending ? "Acknowledging…" : "Mark as Reviewed and Acknowledged"}
      </Button>
      {error ? (
        <p className="text-xs text-[var(--accent-red)]">{error}</p>
      ) : null}
    </div>
  );
}
