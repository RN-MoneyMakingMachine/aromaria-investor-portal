// Adoption Progress — source-of-truth checklist per deliverable.
//
// Steps live in code, not in the database. The DB only records who
// completed which step and when (AdoptionStepCompletion).
//
// IMPORTANT — completions are keyed by stepIndex (the array position).
// Appending new lines at the end is always safe; reordering or deleting
// existing lines will shift the indices and orphan past completions.
// To rename a line, just edit the string in place — the index is what
// matters.

export type AdoptionStepDefinition = readonly string[];

export const ADOPTION_STEPS = {
  "PR-17": [
    "Company-wide announcement meeting introducing the Authority Matrix — Jorge Nikaido (CEO) — Month 1",
    "Company-wide email rollout with Authority Matrix document and key context — Jorge Nikaido (CEO) — Month 1",
    "Authority Matrix integrated into new-hire onboarding documentation — HR Lead — Month 1",
    "Quarterly Threshold Review calendared with 15% corridor monitoring — Rodrigo Nikaido (CGO) — Month 1",
    "Designated email addresses for governance notice established (Aromaria: Jorge + Rodrigo; Omoy: Designated Representative) — Jorge Nikaido (CEO) — Month 1",
    "Omoy Designated Representative formally designated in writing — Omoy, coordinated by Rodrigo Nikaido (CGO) — Month 1",
    "Omoy backup contact for Crucial Matters established — Omoy, coordinated by Rodrigo Nikaido (CGO) — Month 1",
    "Monthly Board meeting cadence locked into calendar — Office of the CEO — Month 1",
    "Authority Matrix included in standard employment agreement reference packet — HR Lead — Month 2",
    "Vendor approval workflow operational in Monday.com reflecting all thresholds (Zone 1 <$50K, Zone 1 with rollup $50K–$200K, Zone 2 >$200K, IT-specific $10K joint approval, Zone 2 strategic vendors) — Rodrigo Nikaido (CGO) — Month 2",
    "Single Governance Suite Acknowledgment signed by all employees (covers Authority Matrix + all 8 governance documents) — HR Lead — Month 3",
    "First Quarterly Threshold Review completed and documented — Rodrigo Nikaido (CGO) — Month 3",
    "First worked example review at Board (one of five Authority Matrix Section 13 worked examples) — Jorge Nikaido (CEO) — Month 3",
    "Monthly Board meetings under locked cadence — Office of the CEO — Ongoing",
    "Quarterly Threshold Review as standing item in one quarterly Board meeting — Rodrigo Nikaido (CGO) — Ongoing",
    "One worked example review at Board per quarter — Jorge Nikaido (CEO) — Ongoing",
    "Annual full Authority Matrix review as part of strategic planning cycle — Office of the CEO — Annual",
  ],
  "PR-19": [
    "Weekly bank statement monitoring tool operational on portal — Rodrigo Nikaido (CGO)",
    "Agreement with Omoy on format and submission method for all reports (weekly bank statements, Monthly Operating Report, Quarterly Board Pack, Quarterly Investor Pack, Annual Audited Financials, Material Event Disclosure) — Jorge Nikaido (CEO) + Rodrigo Nikaido (CGO) with Omoy Designated Representative — Month 1",
    "Master template created for weekly bank statement with Interim CFO commentary — Interim CFO — Month 1",
    "Master template created for Monthly Operating Report — Interim CFO — Month 1",
    "Master template created for Quarterly Board Pack — Interim CFO — Month 2",
    "Master template created for Quarterly Investor Pack — Interim CFO — Month 2",
    "Master template created for Annual Operating Plan and Annual Audited Financial Statements — Interim CFO — Month 2",
    "Material Event Disclosure notice template created (covers 6 categories under Section 7A) — Jorge Nikaido (CEO) — Month 1",
    "Immediate Upside Notice template created (signed contracts ≥ $250K ACV) — Jorge Nikaido (CEO) — Month 1",
    "Investor information request workflow operational (3 BD acknowledgment, 30 BD delivery, 4 substantive requests/quarter tracking) — Office of the CEO — Month 2",
    "On-time and content monitoring process established — monthly Board meeting standing agenda item to validate weekly, monthly, and quarterly reports delivered on time with correct content — Jorge Nikaido (CEO) — Month 1",
    "External auditor selected (Big Four or top-tier international) — Office of the CEO — Month 3",
    "IFRS adoption confirmed with selected auditor — Office of the CEO + auditor — Month 3",
    "Fiscal year-end confirmed and documented — Office of the CEO — Month 3",
    "Forecast Discipline tracking operational (10% material revision and 15% cumulative drift triggers Plan Reset) — Interim CFO — Month 2",
    "Aromaria OKR & KPI Intelligence Engine operational and producing quarterly outputs — Rodrigo Nikaido (CGO) — Month 3",
    "Reporting Policy communicated company-wide as part of the Single Governance Suite Acknowledgment — HR Lead — Month 3",
    "Monthly Operating Report delivered by 15th of following month — CFO function — Monthly, ongoing",
    "Quarterly Board Pack delivered within 45 days of quarter close — CFO function — Quarterly, ongoing",
    "Quarterly Investor Pack delivered to Omoy within 45 days of quarter close — CFO function — Quarterly, ongoing",
    "Annual audited financial statements delivered within 90 days of year-end — CFO function — Annual, ongoing",
    "Annual Operating Plan delivered for Board approval before fiscal year start — Jorge Nikaido (CEO) — Annual, ongoing",
    "Monthly Board meeting on-time and content review of all reporting cycles — Office of the CEO — Monthly, ongoing",
    "Annual full Reporting Policy review in strategic planning cycle — Office of the CEO — Annual",
  ],
  "PR-18": [
    "Travel approval and payment process designed and documented (defines approver routing by traveler tier and trip cost, integration with Accounts Payable, signature requirements, evidence storage) — Jorge Nikaido (CEO) + Rodrigo Nikaido (CGO) — Month 1",
    "Accounts Payable pre-payment validation process operational — no travel payment processed until written approval from the appropriate authority is on file based on traveler tier and trip cost — Interim CFO + Accounts Payable — Month 1",
    "Travel Request template created and operational — Office of the CEO — Month 1",
    "Company-wide meeting to communicate Travel Policy and the new Travel Request process — Jorge Nikaido (CEO) — Month 2",
    "Travel section in Monthly Operating Report, Quarterly Board Pack, and Annual Board Report — high-level summary of travels executed with policy-compliance validation — Interim CFO / CFO function — Monthly, Quarterly, Annual",
  ],
  "PR-20": [
    "Related Party Process designed and documented — single unified request workflow covering all uses of Personal Consumption Allowance, Business Gifting, Employee Discount Program, and other Related Party transactions; everyone including shareholders submits a request before using credit or purchasing product at cost — Jorge Nikaido (CEO) + Rodrigo Nikaido (CGO) — Month 1",
    "Shareholder View on portal operational — visible to Nikaido family and Omoy named individuals showing real-time status of Personal Consumption Allowance, Business Gifting allocations, and any other Related Party balances — Rodrigo Nikaido (CGO) — Month 2",
    "Accounts Payable pre-payment validation operational — no Related Party payment or product release processed without an approved request in the system — Interim CFO + Accounts Payable — Month 1",
    "Company-wide communication of the Employee Discount Program — informing all employees of their discount entitlement and how to use it — HR Lead — Month 2",
    "Company-wide meeting to communicate the Related Party & Anti-Corruption Policy and the unified Related Party Process — Jorge Nikaido (CEO) — Month 2",
    "Related Party & Anti-Corruption Policy communicated company-wide as part of the Single Governance Suite Acknowledgment — HR Lead — Month 3",
    "External FCPA / anti-corruption counsel relationship established — Office of the CEO — Month 3",
    "Annual Related Party Confirmation signed by all named individuals — Office of the CEO — Annual, first round Month 3",
    "Related Party section in Quarterly Board Pack and Annual Board Report — summary of RP activity with policy-compliance validation — Interim CFO / CFO function — Quarterly, Annual",
    "Annual full Related Party & Anti-Corruption Policy review in strategic planning cycle — Office of the CEO — Annual",
  ],
} as const satisfies Record<string, AdoptionStepDefinition>;

export function getAdoptionSteps(code: string): AdoptionStepDefinition {
  return ADOPTION_STEPS[code as keyof typeof ADOPTION_STEPS] ?? [];
}
