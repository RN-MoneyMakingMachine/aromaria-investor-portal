-- Adoption Progress: a per-deliverable, admin-curated checklist of the
-- concrete steps required to implement a deliverable. Admins (the two
-- principals) tick items as they're done. Toggle on/off, reversible.

CREATE TABLE "AdoptionStep" (
  "id" TEXT NOT NULL,
  "deliverableId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "checkedAt" TIMESTAMP(3),
  "checkedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AdoptionStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdoptionStep_deliverableId_order_idx" ON "AdoptionStep"("deliverableId", "order");

ALTER TABLE "AdoptionStep"
  ADD CONSTRAINT "AdoptionStep_deliverableId_fkey"
  FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdoptionStep"
  ADD CONSTRAINT "AdoptionStep_checkedById_fkey"
  FOREIGN KEY ("checkedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
