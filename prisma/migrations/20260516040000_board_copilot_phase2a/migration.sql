-- Board Meetings co-pilot Phase 2A: structured agenda items, RSVP /
-- attendance tracking, resolutions with thresholded voting. BoardMeeting
-- gains type / status / startsAt / location / startedAt / endedAt; the
-- existing freeform agenda / minutes / decisions text fields remain.

CREATE TYPE "MeetingType" AS ENUM ('REGULAR','QUARTERLY','SPECIAL','EMERGENCY');
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED','IN_PROGRESS','COMPLETED','MINUTES_APPROVED');
CREATE TYPE "AgendaItemType" AS ENUM ('INFORMATION','DISCUSSION','DECISION','RESERVED_MATTER');
CREATE TYPE "RsvpStatus" AS ENUM ('PENDING','CONFIRMED','DECLINED','PROXY');
CREATE TYPE "ResolutionThresholdType" AS ENUM ('STANDARD','TIER_1','TIER_2','FAMILY_ONLY');
CREATE TYPE "ResolutionOutcome" AS ENUM ('PENDING','PASSED','FAILED','WITHDRAWN');
CREATE TYPE "VoteChoice" AS ENUM ('FOR','AGAINST','ABSTAIN');

ALTER TABLE "BoardMeeting"
  ADD COLUMN "startsAt"    TIMESTAMP(3),
  ADD COLUMN "durationMin" INTEGER,
  ADD COLUMN "location"    TEXT,
  ADD COLUMN "type"        "MeetingType"  NOT NULL DEFAULT 'REGULAR',
  ADD COLUMN "status"      "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
  ADD COLUMN "startedAt"   TIMESTAMP(3),
  ADD COLUMN "endedAt"     TIMESTAMP(3);

CREATE TABLE "AgendaItem" (
  "id"            TEXT NOT NULL,
  "meetingId"     TEXT NOT NULL,
  "title"         TEXT NOT NULL,
  "body"          TEXT,
  "leadPresenter" TEXT,
  "timeMinutes"   INTEGER,
  "itemType"      "AgendaItemType" NOT NULL DEFAULT 'DISCUSSION',
  "order"         INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AgendaItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgendaItem_meetingId_order_idx" ON "AgendaItem"("meetingId","order");

ALTER TABLE "AgendaItem"
  ADD CONSTRAINT "AgendaItem_meetingId_fkey"
  FOREIGN KEY ("meetingId") REFERENCES "BoardMeeting"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MeetingAttendance" (
  "id"          TEXT NOT NULL,
  "meetingId"   TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "rsvpStatus"  "RsvpStatus" NOT NULL DEFAULT 'PENDING',
  "rsvpNote"    TEXT,
  "rsvpAt"      TIMESTAMP(3),
  "attendedAt"  TIMESTAMP(3),
  "proxyForId"  TEXT,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MeetingAttendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MeetingAttendance_meetingId_userId_key" ON "MeetingAttendance"("meetingId","userId");
CREATE INDEX "MeetingAttendance_userId_idx" ON "MeetingAttendance"("userId");

ALTER TABLE "MeetingAttendance"
  ADD CONSTRAINT "MeetingAttendance_meetingId_fkey"
  FOREIGN KEY ("meetingId") REFERENCES "BoardMeeting"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MeetingAttendance"
  ADD CONSTRAINT "MeetingAttendance_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "BoardResolution" (
  "id"            TEXT NOT NULL,
  "meetingId"     TEXT NOT NULL,
  "title"         TEXT NOT NULL,
  "body"          TEXT NOT NULL,
  "thresholdType" "ResolutionThresholdType" NOT NULL DEFAULT 'STANDARD',
  "outcome"       "ResolutionOutcome" NOT NULL DEFAULT 'PENDING',
  "resolvedAt"    TIMESTAMP(3),
  "lockedAt"      TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BoardResolution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BoardResolution_meetingId_idx" ON "BoardResolution"("meetingId");

ALTER TABLE "BoardResolution"
  ADD CONSTRAINT "BoardResolution_meetingId_fkey"
  FOREIGN KEY ("meetingId") REFERENCES "BoardMeeting"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BoardVote" (
  "id"           TEXT NOT NULL,
  "resolutionId" TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "choice"       "VoteChoice" NOT NULL,
  "comment"      TEXT,
  "castAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BoardVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BoardVote_resolutionId_userId_key" ON "BoardVote"("resolutionId","userId");
CREATE INDEX "BoardVote_userId_idx" ON "BoardVote"("userId");

ALTER TABLE "BoardVote"
  ADD CONSTRAINT "BoardVote_resolutionId_fkey"
  FOREIGN KEY ("resolutionId") REFERENCES "BoardResolution"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardVote"
  ADD CONSTRAINT "BoardVote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
