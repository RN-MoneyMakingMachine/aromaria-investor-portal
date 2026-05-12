export const BRAND = "AROMARIA" as const;

export const PORTAL_NAME = "AROMARIA Investor Portal" as const;

export const FOOTER_NOTICE = "Authorised users only. All access logged." as const;

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
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
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
