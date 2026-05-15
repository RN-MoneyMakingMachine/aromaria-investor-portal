import type {
  DecisionStatus,
  Phase,
  Priority,
  ReportType,
  Status,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  DECISION_STATUS_LABEL,
  PHASE_LABEL,
  PRIORITY_LABEL,
  REPORT_TYPE_LABEL,
  STATUS_LABEL,
  STATUS_LABEL_SHORT,
} from "@/lib/constants";

export function StatusPill({ status }: { status: Status }) {
  const variant: React.ComponentProps<typeof Badge>["variant"] = {
    NOT_STARTED: "default",
    IN_PROGRESS: "amber",
    SUBMITTED_FOR_REVIEW: "blue",
    IN_REVIEW: "amber",
    BLOCKED: "red",
    COMPLETED: "green",
  }[status] as React.ComponentProps<typeof Badge>["variant"];
  return (
    <Badge variant={variant} title={STATUS_LABEL[status]}>
      {STATUS_LABEL_SHORT[status] ?? STATUS_LABEL[status]}
    </Badge>
  );
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

export function ReportTypePill({ type }: { type: ReportType }) {
  const variant: React.ComponentProps<typeof Badge>["variant"] = {
    FINANCIAL: "green",
    GROWTH: "blue",
    CREATIVE: "amber",
    SPECIAL_PROJECT: "metal",
    WEEKLY_BANK_STATEMENT: "blue",
    MONTHLY_OPERATING: "green",
    QUARTERLY_BOARD: "amber",
    QUARTERLY_INVESTOR: "amber",
    ANNUAL_AUDITED: "metal",
    ANNUAL_OPERATING_PLAN: "metal",
    MATERIAL_EVENT_DISCLOSURE: "red",
    UPSIDE_NOTICE: "green",
  }[type] as React.ComponentProps<typeof Badge>["variant"];
  return <Badge variant={variant}>{REPORT_TYPE_LABEL[type]}</Badge>;
}

export function DecisionStatusPill({ status }: { status: DecisionStatus }) {
  const variant: React.ComponentProps<typeof Badge>["variant"] = {
    OPEN: "amber",
    APPROVED: "green",
    DECLINED: "red",
    IMPLEMENTED: "blue",
  }[status] as React.ComponentProps<typeof Badge>["variant"];
  return <Badge variant={variant}>{DECISION_STATUS_LABEL[status]}</Badge>;
}
