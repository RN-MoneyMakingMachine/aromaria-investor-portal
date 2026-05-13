-- One-time reset: the original seed marked 16 deliverables (phase
-- COMPLETED_PRE_60D) as COMPLETED with both NIKAIDO and OMOY approvals.
-- That was incorrect; none of the deliverables have actually been
-- completed yet, so reset every row to NOT_STARTED with 0% progress and
-- clear all approvals.

UPDATE "Deliverable"
SET "status" = 'NOT_STARTED',
    "progressPercent" = 0;

DELETE FROM "Approval";
