-- Step text moves out of the DB into lib/data/adoption-steps.ts. The DB
-- only tracks completions (one row per completed step). Replaces the
-- earlier AdoptionStep table (which held both title and checked state).

DROP TABLE IF EXISTS "AdoptionStep";

CREATE TABLE "AdoptionStepCompletion" (
  "id" TEXT NOT NULL,
  "deliverableId" TEXT NOT NULL,
  "stepIndex" INTEGER NOT NULL,
  "completedById" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdoptionStepCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdoptionStepCompletion_deliverableId_stepIndex_key"
  ON "AdoptionStepCompletion"("deliverableId", "stepIndex");

CREATE INDEX "AdoptionStepCompletion_deliverableId_idx"
  ON "AdoptionStepCompletion"("deliverableId");

ALTER TABLE "AdoptionStepCompletion"
  ADD CONSTRAINT "AdoptionStepCompletion_deliverableId_fkey"
  FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdoptionStepCompletion"
  ADD CONSTRAINT "AdoptionStepCompletion_completedById_fkey"
  FOREIGN KEY ("completedById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
