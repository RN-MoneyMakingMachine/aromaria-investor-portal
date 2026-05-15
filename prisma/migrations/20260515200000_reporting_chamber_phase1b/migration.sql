-- Reporting Chamber Phase 1B: extends Report with delivery / status / ack
-- fields, adds 8 new ReportType values (the full Reporting Policy cadence
-- set), adds ReportStatus + InformationRequestStatus enums, and creates
-- the InformationRequest table for the IR workflow.

-- ReportType: append new values.
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'WEEKLY_BANK_STATEMENT';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'MONTHLY_OPERATING';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'QUARTERLY_BOARD';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'QUARTERLY_INVESTOR';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'ANNUAL_AUDITED';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'ANNUAL_OPERATING_PLAN';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'MATERIAL_EVENT_DISCLOSURE';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'UPSIDE_NOTICE';

-- ReportStatus enum.
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT','DELIVERED','ACKNOWLEDGED','ACTION_REQUIRED');

-- InformationRequestStatus enum.
CREATE TYPE "InformationRequestStatus" AS ENUM ('SUBMITTED','ACKNOWLEDGED','IN_PROGRESS','DELIVERED','DECLINED');

-- Report new columns.
ALTER TABLE "Report"
  ADD COLUMN "dueDate"          TIMESTAMP(3),
  ADD COLUMN "status"           "ReportStatus" NOT NULL DEFAULT 'DELIVERED',
  ADD COLUMN "actionLabel"      TEXT,
  ADD COLUMN "acknowledgedAt"   TIMESTAMP(3),
  ADD COLUMN "acknowledgedById" TEXT;

CREATE INDEX "Report_type_dueDate_idx" ON "Report"("type","dueDate");
CREATE INDEX "Report_status_idx" ON "Report"("status");

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_acknowledgedById_fkey"
  FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- InformationRequest table.
CREATE TABLE "InformationRequest" (
  "id"             TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "body"           TEXT NOT NULL,
  "authorId"      TEXT NOT NULL,
  "isSubstantive" BOOLEAN NOT NULL DEFAULT TRUE,
  "status"        "InformationRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
  "acknowledgedAt" TIMESTAMP(3),
  "deliveredAt"    TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InformationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InformationRequest_status_idx" ON "InformationRequest"("status");
CREATE INDEX "InformationRequest_createdAt_idx" ON "InformationRequest"("createdAt");

ALTER TABLE "InformationRequest"
  ADD CONSTRAINT "InformationRequest_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
