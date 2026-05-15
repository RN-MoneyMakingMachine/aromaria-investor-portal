-- Weekly bank statements for the Wire Conditions section. Three accounts
-- (AROMARIA LLC, AROMARIA UK LTD, AROMAS Y AMBIENTES SA DE CV) each
-- expect a statement every Monday covering the prior week. OMOY-side
-- users mark them reviewed.

CREATE TYPE "BankAccount" AS ENUM ('AROMARIA_LLC', 'AROMARIA_UK_LTD', 'AROMAS_Y_AMBIENTES');

CREATE TABLE "BankStatement" (
  "id" TEXT NOT NULL,
  "account" "BankAccount" NOT NULL,
  "weekOf" DATE NOT NULL,
  "fileId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,

  CONSTRAINT "BankStatement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BankStatement_fileId_key" ON "BankStatement"("fileId");
CREATE INDEX "BankStatement_account_weekOf_idx" ON "BankStatement"("account", "weekOf");
CREATE INDEX "BankStatement_reviewedAt_idx" ON "BankStatement"("reviewedAt");

ALTER TABLE "BankStatement"
  ADD CONSTRAINT "BankStatement_fileId_fkey"
  FOREIGN KEY ("fileId") REFERENCES "FileUpload"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BankStatement"
  ADD CONSTRAINT "BankStatement_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BankStatement"
  ADD CONSTRAINT "BankStatement_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
