// One-off seed: adoption-progress steps for Authority Matrix (3b) / PR-17.
// Idempotent: if any AdoptionSteps already exist for the deliverable, exits
// without writing.  Inserts directly via Prisma (skips the admin-gated service)
// so this seed leaves no entries in the audit feed.
//
// Run:  npx tsx scripts/seed-adoption-authority-matrix.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DELIVERABLE_CODE = "PR-17";

const STEPS = [
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
];

async function main() {
  const deliverable = await prisma.deliverable.findUnique({
    where: { code: DELIVERABLE_CODE },
    select: { id: true, name: true },
  });
  if (!deliverable) {
    throw new Error(`Deliverable ${DELIVERABLE_CODE} not found.`);
  }

  const existing = await prisma.adoptionStep.count({
    where: { deliverableId: deliverable.id },
  });
  if (existing > 0) {
    console.log(
      `[skip] ${deliverable.name} already has ${existing} adoption step(s). No changes made.`,
    );
    return;
  }

  await prisma.adoptionStep.createMany({
    data: STEPS.map((title, order) => ({
      deliverableId: deliverable.id,
      title,
      order,
    })),
  });

  console.log(`[ok] Seeded ${STEPS.length} adoption steps on ${deliverable.name}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
