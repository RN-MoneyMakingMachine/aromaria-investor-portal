"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Download,
  Trash2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BANK_ACCOUNT_LABEL } from "@/lib/constants";
import { formatTimestamp } from "@/lib/dates";
import { cn, formatBytes } from "@/lib/utils";

export type BankStatementView = {
  id: string;
  account: "AROMARIA_LLC" | "AROMARIA_UK_LTD" | "AROMAS_Y_AMBIENTES";
  weekOf: string;
  fileId: string;
  filename: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: { id: string; name: string };
  reviewedAt: string | null;
  reviewedBy: { id: string; name: string } | null;
};

export type BankStatementsProps = {
  statements: BankStatementView[];
  accounts: ReadonlyArray<BankStatementView["account"]>;
  combinedStatus: "reviewed" | "needs_review";
  daysUntilNextDeadline: number;
  nextDeadlineIso: string;
  canUpload: boolean;
  canReview: boolean;
  canEdit: boolean;
  currentUserId: string;
};

export function BankStatements({
  statements,
  accounts,
  combinedStatus,
  daysUntilNextDeadline,
  nextDeadlineIso,
  canUpload,
  canReview,
  canEdit,
  currentUserId,
}: BankStatementsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  function canDeleteRow(row: BankStatementView): boolean {
    return canEdit || row.uploadedBy.id === currentUserId;
  }

  async function onReview(statementId: string) {
    setError(null);
    setBusyId(statementId);
    try {
      const res = await fetch(
        `/api/wire-conditions/statements/${statementId}/review`,
        { method: "PATCH" },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Review failed (${res.status})`);
      }
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(statementId: string, filename: string) {
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;
    setError(null);
    setBusyId(statementId);
    try {
      const res = await fetch(
        `/api/wire-conditions/statements/${statementId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Delete failed (${res.status})`);
      }
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  const nextDeadlineLabel = new Date(nextDeadlineIso).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    },
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-col gap-8 py-6">
        <header className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Wire Conditions
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-[var(--text-primary)]">
            Weekly Bank Statements
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            One statement per account, due each Monday for the week that just passed.
          </p>
        </header>

        <Card>
          <CardContent
            className={cn(
              "flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between",
            )}
          >
            <div className="flex items-center gap-3">
              {combinedStatus === "reviewed" ? (
                <CheckCircle2 className="h-5 w-5 text-[var(--accent-green)]" />
              ) : (
                <CircleAlert className="h-5 w-5 text-[var(--accent-red)]" />
              )}
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  Status
                </span>
                <span
                  className={cn(
                    "font-serif text-xl font-light tracking-tight",
                    combinedStatus === "reviewed"
                      ? "text-[var(--accent-green)]"
                      : "text-[var(--accent-red)]",
                  )}
                >
                  {combinedStatus === "reviewed" ? "Reviewed" : "Needs review"}
                </span>
              </div>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                Next due
              </span>
              <span className="font-mono text-sm text-[var(--text-primary)]">
                {nextDeadlineLabel}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                {daysUntilNextDeadline === 0
                  ? "today"
                  : daysUntilNextDeadline === 1
                    ? "in 1 day"
                    : `in ${daysUntilNextDeadline} days`}
              </span>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <p className="text-xs text-[var(--accent-red)]">{error}</p>
        ) : null}

        <div className="flex flex-col gap-4">
          {accounts.map((acct) => {
            const accountRows = statements.filter((s) => s.account === acct);
            return (
              <AccountCard
                key={acct}
                account={acct}
                statements={accountRows}
                canUpload={canUpload}
                canReview={canReview}
                canDeleteRow={canDeleteRow}
                busy={pending || busyId !== null}
                busyId={busyId}
                onReview={onReview}
                onDelete={onDelete}
                onUploaded={refresh}
                onError={setError}
              />
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

function AccountCard({
  account,
  statements,
  canUpload,
  canReview,
  canDeleteRow,
  busy,
  busyId,
  onReview,
  onDelete,
  onUploaded,
  onError,
}: {
  account: BankStatementView["account"];
  statements: BankStatementView[];
  canUpload: boolean;
  canReview: boolean;
  canDeleteRow: (row: BankStatementView) => boolean;
  busy: boolean;
  busyId: string | null;
  onReview: (statementId: string) => void;
  onDelete: (statementId: string, filename: string) => void;
  onUploaded: () => void;
  onError: (msg: string | null) => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const [latest, ...rest] = statements;

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    onError(null);
    setUploading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/wire-conditions/statements");
        xhr.setRequestHeader("x-filename", encodeURIComponent(file.name));
        xhr.setRequestHeader("x-bank-account", account);
        xhr.setRequestHeader(
          "content-type",
          file.type || "application/octet-stream",
        );
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            let msg = `Upload failed (${xhr.status})`;
            try {
              const body = JSON.parse(xhr.responseText) as { error?: string };
              if (body.error) msg = body.error;
            } catch {
              /* not JSON */
            }
            reject(new Error(msg));
          }
        };
        xhr.send(file);
      });
      onUploaded();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Account
            </span>
            <span className="font-serif text-lg font-light tracking-tight text-[var(--text-primary)]">
              {BANK_ACCOUNT_LABEL[account]}
            </span>
          </div>
          {canUpload ? (
            <div>
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                onChange={onFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || busy}
                onClick={() => fileInput.current?.click()}
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                {uploading ? "Uploading…" : "Upload statement"}
              </Button>
            </div>
          ) : null}
        </div>

        {latest ? (
          <StatementRow
            row={latest}
            canReview={canReview}
            canDelete={canDeleteRow(latest)}
            busy={busy && busyId === latest.id}
            onReview={onReview}
            onDelete={onDelete}
            prominent
          />
        ) : (
          <p className="rounded-sm border border-dashed border-[var(--border-subtle)] px-6 py-6 text-center text-xs uppercase tracking-widest text-[var(--text-tertiary)]">
            No statements uploaded yet
          </p>
        )}

        {rest.length > 0 ? (
          <div>
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              {historyOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {rest.length} earlier {rest.length === 1 ? "statement" : "statements"}
            </button>
            {historyOpen ? (
              <ol className="mt-3 flex flex-col gap-2 border-l border-[var(--border-subtle)] pl-4">
                {rest.map((r) => (
                  <li key={r.id}>
                    <StatementRow
                      row={r}
                      canReview={canReview}
                      canDelete={canDeleteRow(r)}
                      busy={busy && busyId === r.id}
                      onReview={onReview}
                      onDelete={onDelete}
                    />
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatementRow({
  row,
  canReview,
  canDelete,
  busy,
  onReview,
  onDelete,
  prominent = false,
}: {
  row: BankStatementView;
  canReview: boolean;
  canDelete: boolean;
  busy: boolean;
  onReview: (statementId: string) => void;
  onDelete: (statementId: string, filename: string) => void;
  prominent?: boolean;
}) {
  const weekLabel = new Date(row.weekOf).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const isReviewed = !!row.reviewedAt;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        prominent
          ? "rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3"
          : "p-1",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/files/${row.fileId}`}
            download={row.filename}
            className="truncate text-sm text-[var(--text-primary)] hover:underline"
          >
            {row.filename}
          </a>
          {isReviewed ? (
            <Badge variant="green" className="shrink-0">
              Reviewed
            </Badge>
          ) : (
            <Badge variant="red" className="shrink-0">
              Needs review
            </Badge>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          Week of {weekLabel}
          <span className="mx-1.5">,</span>
          {row.uploadedBy.name}
          <span className="mx-1.5">,</span>
          {formatBytes(row.sizeBytes)}
          <span className="mx-1.5">,</span>
          uploaded {formatTimestamp(new Date(row.uploadedAt))}
          {isReviewed && row.reviewedBy ? (
            <>
              <span className="mx-1.5">,</span>
              reviewed by {row.reviewedBy.name}
            </>
          ) : null}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={`/api/files/${row.fileId}`}
              download={row.filename}
              className="rounded-sm p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]"
              aria-label={`Download ${row.filename}`}
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip>
        {canReview && !isReviewed ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() => onReview(row.id)}
          >
            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
            {busy ? "Saving…" : "Reviewed"}
          </Button>
        ) : null}
        {canDelete ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onDelete(row.id, row.filename)}
                disabled={busy}
                className="rounded-sm p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-base)] hover:text-[var(--accent-red)] disabled:opacity-50"
                aria-label={`Delete ${row.filename}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}
