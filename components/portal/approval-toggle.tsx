"use client";

import { useState, useTransition } from "react";
import type { Side } from "@prisma/client";
import { Check, Loader2, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SIDE_LABEL } from "@/lib/constants";
import { formatTimestamp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/rbac";
import { canApproveSide, isAdmin } from "@/lib/rbac";
import {
  approveAction,
  revokeApprovalAction,
} from "@/app/(portal)/deliverables/actions";

type ExistingApproval = {
  side: Side;
  approvedAt: Date;
  user: { name: string; email: string };
} | null;

export function ApprovalToggle({
  deliverableId,
  side,
  approval,
  user,
}: {
  deliverableId: string;
  side: Side;
  approval: ExistingApproval;
  user: SessionUser;
}) {
  const approved = !!approval;
  const canApprove = !approved && canApproveSide(user, side);
  const canRevoke = approved && isAdmin(user);

  return (
    <Card
      className={cn(
        "h-full border-[var(--border-subtle)]",
        approved && "border-[var(--accent-green)]",
      )}
    >
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {SIDE_LABEL[side] ?? side} Approval
          </span>
          {approved ? (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--accent-green)]">
              <Check className="h-3 w-3" /> Approved
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Pending
            </span>
          )}
        </div>

        {approval ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-[var(--text-primary)]">
              {approval.user.name}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              {formatTimestamp(approval.approvedAt)}
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {side === "NIKAIDO"
              ? "Awaiting approval from Jorge Nikaido or Rodrigo Nikaido."
              : "Awaiting approval from Gregoire Boissel."}
          </p>
        )}

        <div className="mt-auto">
          {canApprove ? (
            <ApproveDialog deliverableId={deliverableId} side={side} />
          ) : canRevoke ? (
            <RevokeDialog deliverableId={deliverableId} side={side} />
          ) : (
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              {approved ? "Locked" : "Read only"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ApproveDialog({
  deliverableId,
  side,
}: {
  deliverableId: string;
  side: Side;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    start(async () => {
      const result = await approveAction(deliverableId, side);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" className="w-full">
          <ShieldCheck className="h-4 w-4" />
          Approve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve {SIDE_LABEL[side] ?? side} side</DialogTitle>
          <DialogDescription>
            Your name and timestamp will be recorded in the audit log. If both
            sides have approved, the deliverable will move to Completed
            automatically.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-xs text-[var(--accent-red)]">{error}</p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={submit}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording
              </>
            ) : (
              <>Confirm approval</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RevokeDialog({
  deliverableId,
  side,
}: {
  deliverableId: string;
  side: Side;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    start(async () => {
      const result = await revokeApprovalAction(deliverableId, side);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          Revoke approval
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke {SIDE_LABEL[side] ?? side} approval</DialogTitle>
          <DialogDescription>
            This reverts the deliverable to In Progress if it was Completed by
            this approval. The reversal is recorded in the audit log.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-xs text-[var(--accent-red)]">{error}</p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={submit}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Revoking
              </>
            ) : (
              <>Confirm revoke</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
