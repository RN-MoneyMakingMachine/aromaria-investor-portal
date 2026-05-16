"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gavel, Lock } from "lucide-react";
import type {
  ResolutionOutcome,
  ResolutionThresholdType,
  Side,
  VoteChoice,
} from "@prisma/client";

import {
  castVoteAction,
  resolveResolutionAction,
} from "@/app/(portal)/chambers/board/copilot-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/portal/progress-bar";
import { cn } from "@/lib/utils";

const THRESHOLD_LABEL: Record<ResolutionThresholdType, string> = {
  STANDARD: "Board majority · 3 of 5",
  TIER_1: "Tier 1 · Investor consent + 4 of 5",
  TIER_2: "Tier 2 · 4 of 5 supermajority",
  FAMILY_ONLY: "Family directors · 3 of 4",
};

const THRESHOLD_REQUIRED: Record<ResolutionThresholdType, { req: number; total: number }> = {
  STANDARD: { req: 3, total: 5 },
  TIER_1: { req: 4, total: 5 },
  TIER_2: { req: 4, total: 5 },
  FAMILY_ONLY: { req: 3, total: 4 },
};

const OUTCOME_TONE: Record<ResolutionOutcome, string> = {
  PENDING: "var(--text-tertiary)",
  PASSED: "var(--accent-green)",
  FAILED: "var(--accent-red)",
  WITHDRAWN: "var(--text-tertiary)",
};

export type ResolutionVote = {
  id: string;
  userId: string;
  choice: VoteChoice;
  user: { id: string; name: string; side: Side };
};

export type ResolutionCardProps = {
  meetingId: string;
  resolution: {
    id: string;
    title: string;
    body: string;
    thresholdType: ResolutionThresholdType;
    outcome: ResolutionOutcome;
    lockedAt: string | null;
    resolvedAt: string | null;
    votes: ResolutionVote[];
  };
  currentUser: { id: string; side: Side; role: string };
  meetingLive: boolean;
  isAdmin: boolean;
};

export function ResolutionCard({
  meetingId,
  resolution,
  currentUser,
  meetingLive,
  isAdmin,
}: ResolutionCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const myVote = resolution.votes.find((v) => v.userId === currentUser.id);
  const forCount = resolution.votes.filter((v) => v.choice === "FOR").length;
  const againstCount = resolution.votes.filter((v) => v.choice === "AGAINST").length;
  const abstainCount = resolution.votes.filter((v) => v.choice === "ABSTAIN").length;
  const { req, total } = THRESHOLD_REQUIRED[resolution.thresholdType];
  const percent = Math.min(100, Math.round((forCount / req) * 100));

  const eligibleSides: Side[] =
    resolution.thresholdType === "FAMILY_ONLY" ? ["NIKAIDO"] : ["NIKAIDO", "OMOY"];
  const isEligible =
    eligibleSides.includes(currentUser.side) && currentUser.role !== "VIEWER";
  const locked = !!resolution.lockedAt;

  async function onVote(choice: VoteChoice) {
    setError(null);
    const r = await castVoteAction(meetingId, resolution.id, choice);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function onResolve() {
    if (!confirm("Finalise this resolution? This locks the vote record.")) return;
    setError(null);
    const r = await resolveResolutionAction(meetingId, resolution.id);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <Card className={cn(locked && "border-l-2", locked && (resolution.outcome === "PASSED" ? "border-l-[var(--accent-green)]" : "border-l-[var(--accent-red)]"))}>
      <CardContent className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Resolution
            </span>
            <Badge variant="metal">{THRESHOLD_LABEL[resolution.thresholdType]}</Badge>
          </div>
          {locked ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest"
              style={{ color: OUTCOME_TONE[resolution.outcome] }}
            >
              <Lock className="h-3 w-3" />
              {resolution.outcome}
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-serif text-lg font-light text-[var(--text-primary)]">
            {resolution.title}
          </h3>
          <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
            {resolution.body}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            <span>For {forCount} · Against {againstCount} · Abstain {abstainCount}</span>
            <span className="tabular font-mono">
              {forCount} of {req} required (pool of {total})
            </span>
          </div>
          <ProgressBar
            value={percent}
            tone={
              locked
                ? resolution.outcome === "PASSED"
                  ? "green"
                  : "red"
                : forCount >= req
                  ? "green"
                  : "metal"
            }
          />
        </div>

        {error ? (
          <p className="text-xs text-[var(--accent-red)]">{error}</p>
        ) : null}

        {!locked && meetingLive && isEligible ? (
          <div className="flex flex-wrap gap-2">
            <VoteButton
              choice="FOR"
              active={myVote?.choice === "FOR"}
              disabled={pending}
              onClick={() => onVote("FOR")}
              tone="var(--accent-green)"
            />
            <VoteButton
              choice="AGAINST"
              active={myVote?.choice === "AGAINST"}
              disabled={pending}
              onClick={() => onVote("AGAINST")}
              tone="var(--accent-red)"
            />
            <VoteButton
              choice="ABSTAIN"
              active={myVote?.choice === "ABSTAIN"}
              disabled={pending}
              onClick={() => onVote("ABSTAIN")}
              tone="var(--text-tertiary)"
            />
            {isAdmin ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="ml-auto"
                disabled={pending}
                onClick={onResolve}
              >
                Finalise resolution
              </Button>
            ) : null}
          </div>
        ) : !locked && !meetingLive ? (
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Voting opens when the meeting is started.
          </p>
        ) : !locked && !isEligible ? (
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            You are not eligible to vote on this resolution.
          </p>
        ) : null}

        {resolution.votes.length > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Cast votes
            </span>
            <ul className="flex flex-wrap gap-1.5">
              {resolution.votes.map((v) => (
                <li
                  key={v.id}
                  className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-[10px] uppercase tracking-widest text-[var(--text-secondary)]"
                >
                  {v.user.name} · {v.choice}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function VoteButton({
  choice,
  active,
  disabled,
  onClick,
  tone,
}: {
  choice: VoteChoice;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  tone: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors",
        active
          ? "border-transparent text-[var(--bg-base)]"
          : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]",
        disabled && "opacity-60",
      )}
      style={active ? { background: tone } : undefined}
    >
      {choice}
    </button>
  );
}
