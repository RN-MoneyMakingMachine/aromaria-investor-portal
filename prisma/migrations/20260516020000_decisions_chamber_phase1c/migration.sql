-- Decisions chamber Phase 1C: Authority Matrix Zone + Tier badges, owner +
-- target completion, dependency map, 30/60/90-day retrospectives.

CREATE TYPE "DecisionZone" AS ENUM ('ZONE_1','ZONE_2','ZONE_3','ZONE_4','EMERGENCY','THRESHOLD');
CREATE TYPE "DecisionTier" AS ENUM ('TIER_1','TIER_2');

ALTER TABLE "Decision"
  ADD COLUMN "zone"                 "DecisionZone",
  ADD COLUMN "tier"                 "DecisionTier",
  ADD COLUMN "ownerId"              TEXT,
  ADD COLUMN "targetCompletionDate" TIMESTAMP(3);

CREATE INDEX "Decision_zone_idx" ON "Decision"("zone");

ALTER TABLE "Decision"
  ADD CONSTRAINT "Decision_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "DecisionDependency" (
  "id"             TEXT NOT NULL,
  "dependentId"    TEXT NOT NULL,
  "prerequisiteId" TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DecisionDependency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DecisionDependency_dependentId_prerequisiteId_key"
  ON "DecisionDependency"("dependentId","prerequisiteId");
CREATE INDEX "DecisionDependency_prerequisiteId_idx"
  ON "DecisionDependency"("prerequisiteId");

ALTER TABLE "DecisionDependency"
  ADD CONSTRAINT "DecisionDependency_dependentId_fkey"
  FOREIGN KEY ("dependentId") REFERENCES "Decision"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DecisionDependency"
  ADD CONSTRAINT "DecisionDependency_prerequisiteId_fkey"
  FOREIGN KEY ("prerequisiteId") REFERENCES "Decision"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DecisionRetrospective" (
  "id"           TEXT NOT NULL,
  "decisionId"   TEXT NOT NULL,
  "dayMark"      INTEGER NOT NULL,
  "content"      TEXT NOT NULL,
  "recordedById" TEXT NOT NULL,
  "recordedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DecisionRetrospective_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DecisionRetrospective_decisionId_dayMark_key"
  ON "DecisionRetrospective"("decisionId","dayMark");
CREATE INDEX "DecisionRetrospective_decisionId_idx"
  ON "DecisionRetrospective"("decisionId");

ALTER TABLE "DecisionRetrospective"
  ADD CONSTRAINT "DecisionRetrospective_decisionId_fkey"
  FOREIGN KEY ("decisionId") REFERENCES "Decision"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DecisionRetrospective"
  ADD CONSTRAINT "DecisionRetrospective_recordedById_fkey"
  FOREIGN KEY ("recordedById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
