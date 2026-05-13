-- Two new states between IN_PROGRESS (50%) and COMPLETED (100%) on the
-- review path: SUBMITTED_FOR_REVIEW (75%) -- "Submitted by Nikaido
-- Family Office for review" -- and IN_REVIEW (85%) -- "In review by
-- OMOY". Progress percent is computed app-side from the status, so no
-- data migration is needed.

ALTER TYPE "Status" ADD VALUE IF NOT EXISTS 'SUBMITTED_FOR_REVIEW';
ALTER TYPE "Status" ADD VALUE IF NOT EXISTS 'IN_REVIEW';
