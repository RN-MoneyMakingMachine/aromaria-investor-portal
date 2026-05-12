import {
  Category,
  Phase,
  Priority,
  PrismaClient,
  Role,
  Side,
  Status,
} from "@prisma/client";

const prisma = new PrismaClient();

type SeedUser = {
  email: string;
  name: string;
  title: string;
  side: Side;
  role: Role;
  canApprove: boolean;
};

const USERS: SeedUser[] = [
  {
    email: "apln@aromaria.mx",
    name: "Ana Patricia Nikaido",
    title: "President AROMARIA",
    side: "NIKAIDO",
    role: "EDITOR",
    canApprove: false,
  },
  {
    email: "jnikaido@aromaria.mx",
    name: "Jorge Nikaido",
    title: "CEO AROMARIA",
    side: "NIKAIDO",
    role: "ADMIN",
    canApprove: true,
  },
  {
    email: "Rodrigonikaido@aromaria.mx",
    name: "Rodrigo Nikaido",
    title: "CGO AROMARIA",
    side: "NIKAIDO",
    role: "ADMIN",
    canApprove: true,
  },
  {
    email: "jnikaido@me.com",
    name: "Jorge Nikaido Sr",
    title: "Investor, Board Member",
    side: "NIKAIDO",
    role: "INVESTOR",
    canApprove: false,
  },
  {
    email: "myk@mykpo.ch",
    name: "MYK",
    title: "Investor, Creative",
    side: "NIKAIDO",
    role: "INVESTOR",
    canApprove: false,
  },
  {
    email: "gregoire.boissel@creative.com.co",
    name: "Gregoire Boissel",
    title: "Head of OMOY",
    side: "OMOY",
    role: "INVESTOR",
    canApprove: true,
  },
  {
    email: "fabian@placeholder.com",
    name: "Fabian Coscolla",
    title: "CFO OMOY",
    side: "OMOY",
    role: "INVESTOR",
    canApprove: false,
  },
  {
    email: "tarek.elkhereiji@creative.com.co",
    name: "Tarek El Khereiji",
    title: "Investor OMOY",
    side: "OMOY",
    role: "INVESTOR",
    canApprove: false,
  },
];

type SeedDeliverable = {
  code: string;
  name: string;
  category: Category;
  phase: Phase;
  sectionRef: string;
  priority: Priority;
  implementationTimeline?: string;
  description: string;
  status?: Status;
  progressPercent?: number;
};

const DELIVERABLES: SeedDeliverable[] = [
  {
    code: "WC-01",
    name: "Unanimous Decisions",
    category: "GOVERNANCE",
    phase: "WIRE_CONDITION",
    sectionRef: "I",
    priority: "CRITICAL",
    implementationTimeline: "Before wire",
    description:
      "Partnership agrees to unanimous decisions on projects + application of draft authority matrix and travel policy in a manner consistent with their intent and commercial substance.",
  },
  {
    code: "WC-02",
    name: "Weekly Bank Statements",
    category: "REPORTING",
    phase: "WIRE_CONDITION",
    sectionRef: "I",
    priority: "CRITICAL",
    implementationTimeline: "Before wire",
    description:
      "Weekly delivery of complete bank account statements + comments from Mr. LM Canal, in form and substance reasonably satisfactory to the Investor. Reverts to monthly upon CFO appointment and Reporting Policies implementation.",
  },
  {
    code: "WC-03",
    name: "Security Documents, General Security Agreement",
    category: "LEGAL",
    phase: "WIRE_CONDITION",
    sectionRef: "I",
    priority: "CRITICAL",
    implementationTimeline: "Before wire",
    description:
      "Partnership signs General Security Agreement and delivers all documents creating or evidencing security interests in favour of the Investor, necessary under applicable law.",
  },

  {
    code: "CM-04",
    name: "Organisation Design (2a)",
    category: "STRUCTURE",
    phase: "COMMITTED",
    sectionRef: "II",
    priority: "HIGH",
    implementationTimeline: "3 to 6 months",
    description: "Org chart and roles.",
  },
  {
    code: "CM-05",
    name: "CFO Recruitment",
    category: "HR",
    phase: "COMMITTED",
    sectionRef: "II",
    priority: "HIGH",
    implementationTimeline: "3 to 6 months",
    description: "CFO hiring.",
  },
  {
    code: "CM-06",
    name: "Management Contracts (JN/RN)",
    category: "HR",
    phase: "COMMITTED",
    sectionRef: "II",
    priority: "HIGH",
    implementationTimeline: "1 to 6 months depending on jurisdictions",
    description:
      "Final commercial terms and contract structure fully agreed and aligned with governance and capital structure.",
  },
  {
    code: "CM-07",
    name: "IT Policy",
    category: "GOVERNANCE",
    phase: "COMMITTED",
    sectionRef: "II",
    priority: "MEDIUM",
    implementationTimeline: "3 to 6 months",
    description: "IT governance.",
  },
  {
    code: "CM-08",
    name: "Risk Framework",
    category: "RISK",
    phase: "COMMITTED",
    sectionRef: "II",
    priority: "HIGH",
    implementationTimeline: "2 to 4 months",
    description: "Risk management.",
  },
  {
    code: "CM-09",
    name: "Financial Controls (4d)",
    category: "FINANCIAL",
    phase: "COMMITTED",
    sectionRef: "II",
    priority: "HIGH",
    implementationTimeline: "2 to 4 months",
    description: "Control framework.",
  },
  {
    code: "CM-10",
    name: "Holding Company Restructuring (5b)",
    category: "LEGAL",
    phase: "COMMITTED",
    sectionRef: "II",
    priority: "HIGH",
    implementationTimeline: "1 to 6 months depending on jurisdictions",
    description:
      "Final target structure, ownership positioning and step plan agreed.",
  },
  {
    code: "CM-11",
    name: "Ancillary Documents (5c-2)",
    category: "LEGAL",
    phase: "COMMITTED",
    sectionRef: "II",
    priority: "HIGH",
    implementationTimeline: "1 to 6 months depending on jurisdictions",
    description:
      "Execution of remaining legal, administrative and restructuring documents strictly consistent with the agreed structure.",
  },

  {
    code: "PR-12",
    name: "Strategic Plan (1a)",
    category: "BUSINESS",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description: "3 to 5 year business plan.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-13",
    name: "Commercial Framework (1b)",
    category: "BUSINESS",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description: "Decision making framework.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-14",
    name: "Compensation Framework (2b)",
    category: "STRUCTURE",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description: "Compensation framework.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-15",
    name: "HR Handbook",
    category: "HR",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description: "HR policies.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-16",
    name: "Governance Document (3a)",
    category: "GOVERNANCE",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description: "Corporate governance framework.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-17",
    name: "Authority Matrix (3b)",
    category: "GOVERNANCE",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description: "Decision authority matrix.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-18",
    name: "Travel Policy (3c)",
    category: "GOVERNANCE",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "MEDIUM",
    description: "Travel policy.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-19",
    name: "Reporting Policies (3d)",
    category: "GOVERNANCE",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description: "Reporting framework.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-20",
    name: "Related Party Policy (3e)",
    category: "GOVERNANCE",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "MEDIUM",
    description: "Related party controls.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-21",
    name: "Breach Mechanics (6a)",
    category: "GOVERNANCE",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description: "Breach framework.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-22",
    name: "Cash Flow Forecast (4a)",
    category: "FINANCIAL",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description: "2026 cash flow.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-23",
    name: "Capital Structure (4b)",
    category: "FINANCIAL",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description: "Debt and liabilities schedule.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-24",
    name: "Shareholder Loans (4c)",
    category: "FINANCIAL",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description: "Loan treatment.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-25",
    name: "Ownership Docs (5a)",
    category: "LEGAL",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description: "40% ownership structure.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-26",
    name: "Investment Documents (5c-1)",
    category: "LEGAL",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description:
      "Execution of all definitive investment and shareholder documentation implementing ownership, governance and investor protections.",
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    code: "PR-27",
    name: "Investment Breakdown (7a)",
    category: "FUNDING",
    phase: "COMPLETED_PRE_60D",
    sectionRef: "II",
    priority: "HIGH",
    description:
      "Full $5M breakdown, permitted deductions fixed, net fresh cash stated.",
    status: "COMPLETED",
    progressPercent: 100,
  },

  {
    code: "PS-28",
    name: "Bank Account List (Carnival)",
    category: "LEGAL",
    phase: "POST_SIGNING",
    sectionRef: "PS",
    priority: "CRITICAL",
    implementationTimeline: "Within 5 Business Days of signing",
    description:
      "Send Investor written list of each bank account where Carnival receivables are or will be deposited, account name, number, bank, routing/ABA.",
  },
  {
    code: "PS-29",
    name: "Share Charge Package, Aromaria USA Inc.",
    category: "LEGAL",
    phase: "POST_SIGNING",
    sectionRef: "PS",
    priority: "CRITICAL",
    implementationTimeline: "Within 15 Business Days of signing",
    description:
      "Deliver to Investor: original share certificates for Aromaria USA Inc., stock transfer powers executed in blank, evidence pledge noted in stock ledger, certified board resolutions.",
  },
  {
    code: "PS-30",
    name: "UCC-1 Filing, Delaware",
    category: "LEGAL",
    phase: "POST_SIGNING",
    sectionRef: "PS",
    priority: "CRITICAL",
    implementationTimeline: "After signing",
    description:
      "File UCC-1 financing statement with Delaware Secretary of State to perfect security interest in Carnival receivables and proceeds.",
  },
  {
    code: "PS-31",
    name: "Aromaria USA Inc. Board Resolutions",
    category: "LEGAL",
    phase: "POST_SIGNING",
    sectionRef: "PS",
    priority: "CRITICAL",
    implementationTimeline: "Within 15 Business Days of signing",
    description:
      "Board resolutions of Aromaria USA Inc. acknowledging the pledge and authorising transfer registration upon enforcement.",
  },
];

async function main() {
  console.log("Seeding users...");
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        title: u.title,
        side: u.side,
        role: u.role,
        canApprove: u.canApprove,
      },
      create: {
        email: u.email,
        name: u.name,
        title: u.title,
        side: u.side,
        role: u.role,
        canApprove: u.canApprove,
        emailVerified: new Date(),
      },
    });
  }

  const jorge = await prisma.user.findUniqueOrThrow({
    where: { email: "jnikaido@aromaria.mx" },
  });
  const gregoire = await prisma.user.findUniqueOrThrow({
    where: { email: "gregoire.boissel@creative.com.co" },
  });

  console.log("Seeding deliverables...");
  for (const d of DELIVERABLES) {
    const isCompleted = d.phase === "COMPLETED_PRE_60D";
    const status = d.status ?? (isCompleted ? "COMPLETED" : "NOT_STARTED");
    const progressPercent = d.progressPercent ?? (isCompleted ? 100 : 0);

    const deliverable = await prisma.deliverable.upsert({
      where: { code: d.code },
      update: {
        name: d.name,
        description: d.description,
        phase: d.phase,
        category: d.category,
        sectionRef: d.sectionRef,
        priority: d.priority,
        implementationTimeline: d.implementationTimeline,
      },
      create: {
        code: d.code,
        name: d.name,
        description: d.description,
        phase: d.phase,
        category: d.category,
        sectionRef: d.sectionRef,
        priority: d.priority,
        implementationTimeline: d.implementationTimeline,
        status,
        progressPercent,
      },
    });

    if (isCompleted) {
      await prisma.approval.upsert({
        where: {
          deliverableId_side: { deliverableId: deliverable.id, side: "NIKAIDO" },
        },
        update: {},
        create: {
          deliverableId: deliverable.id,
          userId: jorge.id,
          side: "NIKAIDO",
        },
      });
      await prisma.approval.upsert({
        where: {
          deliverableId_side: { deliverableId: deliverable.id, side: "OMOY" },
        },
        update: {},
        create: {
          deliverableId: deliverable.id,
          userId: gregoire.id,
          side: "OMOY",
        },
      });
    }
  }

  const totals = {
    users: await prisma.user.count(),
    deliverables: await prisma.deliverable.count(),
    approvals: await prisma.approval.count(),
  };
  console.log("Seed complete:", totals);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
