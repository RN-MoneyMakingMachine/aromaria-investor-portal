-- Commercial decisions log: a record of decisions taken between the
-- partners, with a single editor-controlled status. Reports and board
-- meetings already exist on the schema; only the Decision side needs a
-- new table and enum here.

CREATE TYPE "DecisionStatus" AS ENUM ('OPEN', 'APPROVED', 'DECLINED', 'IMPLEMENTED');

CREATE TABLE "Decision" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "body" TEXT,
  "status" "DecisionStatus" NOT NULL DEFAULT 'OPEN',
  "decidedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Decision"
  ADD CONSTRAINT "Decision_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Decision_status_idx" ON "Decision"("status");
CREATE INDEX "Decision_createdAt_idx" ON "Decision"("createdAt");
