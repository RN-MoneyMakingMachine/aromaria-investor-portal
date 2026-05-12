import type { Phase, Priority, Status } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  PHASE_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
} from "@/lib/constants";

export function StatusPill({ status }: { status: Status }) {
  const variant: React.ComponentProps<typeof Badge>["variant"] = {
    NOT_STARTED: "default",
    IN_PROGRESS: "amber",
    BLOCKED: "red",
    COMPLETED: "green",
  }[status] as React.ComponentProps<typeof Badge>["variant"];
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>;
}

export function PriorityPill({ priority }: { priority: Priority }) {
  const variant: React.ComponentProps<typeof Badge>["variant"] = {
    CRITICAL: "red",
    HIGH: "amber",
    MEDIUM: "default",
    LOW: "default",
  }[priority] as React.ComponentProps<typeof Badge>["variant"];
  return <Badge variant={variant}>{PRIORITY_LABEL[priority]}</Badge>;
}

export function PhasePill({ phase }: { phase: Phase }) {
  return <Badge variant="metal">{PHASE_LABEL[phase]}</Badge>;
}
