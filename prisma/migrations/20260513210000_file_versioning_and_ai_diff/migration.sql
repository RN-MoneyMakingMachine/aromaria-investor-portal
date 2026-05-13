-- Document version chains + AI diff metadata on FileUpload.
-- Each upload can point at its previous version via previousVersionId,
-- forming a singly linked chain. isFinal pins a canonical version per
-- chain. aiDiff* columns hold Claude's per-version change summary.

ALTER TABLE "FileUpload"
    ADD COLUMN "isFinal" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "previousVersionId" TEXT,
    ADD COLUMN "aiDiffStatus" TEXT,
    ADD COLUMN "aiDiffSummary" TEXT,
    ADD COLUMN "aiDiffError" TEXT,
    ADD COLUMN "aiDiffModel" TEXT,
    ADD COLUMN "aiDiffTokensIn" INTEGER,
    ADD COLUMN "aiDiffTokensOut" INTEGER;

ALTER TABLE "FileUpload"
    ADD CONSTRAINT "FileUpload_previousVersionId_fkey"
    FOREIGN KEY ("previousVersionId")
    REFERENCES "FileUpload"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

CREATE INDEX "FileUpload_previousVersionId_idx" ON "FileUpload"("previousVersionId");
CREATE INDEX "FileUpload_deliverableId_isCurrent_idx" ON "FileUpload"("deliverableId", "isCurrent");
