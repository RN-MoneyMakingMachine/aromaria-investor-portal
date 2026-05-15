export const BRAND = "AROMARIA" as const;

export const PORTAL_NAME = "AROMARIA Investor Portal" as const;

export const FOOTER_NOTICE = "Authorised users only. All access logged." as const;

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

export const SIDE_LABEL: Record<string, string> = {
  NIKAIDO: "Nikaido",
  OMOY: "OMOY",
  AROMARIA_TEAM: "AROMARIA Team",
  AUDITOR: "Auditor",
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
  INVESTOR: "Investor",
};

export const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  SUBMITTED_FOR_REVIEW: "Submitted by Nikaido Family Office for review",
  IN_REVIEW: "In review by OMOY",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
};

export const STATUS_LABEL_SHORT: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  SUBMITTED_FOR_REVIEW: "Submitted for review",
  IN_REVIEW: "In review",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
};

export const STATUS_PROGRESS: Record<string, number> = {
  NOT_STARTED: 0,
  IN_PROGRESS: 50,
  BLOCKED: 25,
  SUBMITTED_FOR_REVIEW: 75,
  IN_REVIEW: 85,
  COMPLETED: 100,
};

export const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const PHASE_LABEL: Record<string, string> = {
  WIRE_CONDITION: "Wire Condition",
  COMMITTED: "Committed",
  POST_SIGNING: "Post Signing",
  COMPLETED_PRE_60D: "Completed Pre 60D",
};

export const CATEGORY_LABEL: Record<string, string> = {
  GOVERNANCE: "Governance",
  REPORTING: "Reporting",
  LEGAL: "Legal",
  BUSINESS: "Business",
  STRUCTURE: "Structure",
  HR: "HR",
  FINANCIAL: "Financial",
  RISK: "Risk",
  FUNDING: "Funding",
};

export const REPORT_TYPE_LABEL: Record<string, string> = {
  FINANCIAL: "Financial",
  GROWTH: "Growth",
  CREATIVE: "Creative",
  SPECIAL_PROJECT: "Special Project",
  WEEKLY_BANK_STATEMENT: "Weekly Bank Statement",
  MONTHLY_OPERATING: "Monthly Operating",
  QUARTERLY_BOARD: "Quarterly Board",
  QUARTERLY_INVESTOR: "Quarterly Investor",
  ANNUAL_AUDITED: "Annual Audited",
  ANNUAL_OPERATING_PLAN: "Annual Operating Plan",
  MATERIAL_EVENT_DISCLOSURE: "Material Event",
  UPSIDE_NOTICE: "Upside Notice",
};

export const DECISION_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  APPROVED: "Approved",
  DECLINED: "Declined",
  IMPLEMENTED: "Implemented",
};

export const BANK_ACCOUNT_LABEL: Record<string, string> = {
  AROMARIA_LLC: "AROMARIA LLC",
  AROMARIA_UK_LTD: "AROMARIA UK LTD",
  AROMAS_Y_AMBIENTES: "AROMAS Y AMBIENTES SA DE CV",
};

export const BANK_ACCOUNTS_ORDER: ReadonlyArray<
  "AROMARIA_LLC" | "AROMARIA_UK_LTD" | "AROMAS_Y_AMBIENTES"
> = ["AROMARIA_LLC", "AROMARIA_UK_LTD", "AROMAS_Y_AMBIENTES"];
