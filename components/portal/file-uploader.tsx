"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Lock,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTimestamp } from "@/lib/dates";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";

export type ChainEntry = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  isCurrent: boolean;
  isFinal: boolean;
  previousVersionId: string | null;
  uploadedAt: Date;
  aiDiffStatus: string | null;
  aiDiffSummary: string | null;
  aiDiffError: string | null;
  user: { id: string; name: string };
};

export type Chain = {
  head: ChainEntry;
  chainHasFinal: boolean;
  finalId: string | null;
  history: ChainEntry[];
};

export function FileUploader({
  deliverableId,
  chains,
  currentUserId,
  canEdit,
}: {
  deliverableId: string;
  chains: Chain[];
  currentUserId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const newFileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    label: string;
    percent: number;
  } | null>(null);

  async function uploadFile(opts: {
    file: File;
    previousVersionId?: string;
    replacingFinal?: boolean;
    label: string;
  }) {
    if (opts.file.size > MAX_UPLOAD_BYTES) {
      setError(`File exceeds ${formatBytes(MAX_UPLOAD_BYTES)} limit.`);
      return;
    }
    setError(null);
    setProgress({ label: opts.label, percent: 0 });
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/deliverables/${deliverableId}/files`);
        xhr.setRequestHeader("x-filename", encodeURIComponent(opts.file.name));
        xhr.setRequestHeader(
          "content-type",
          opts.file.type || "application/octet-stream",
        );
        if (opts.previousVersionId) {
          xhr.setRequestHeader("x-previous-version-id", opts.previousVersionId);
        }
        if (opts.replacingFinal) {
          xhr.setRequestHeader("x-replacing-final", "1");
        }
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress({
              label: opts.label,
              percent: Math.round((ev.loaded / ev.total) * 100),
            });
          }
        };
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
        xhr.send(opts.file);
      });
      setProgress(null);
      startTransition(() => router.refresh());
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  function onNewFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void uploadFile({ file, label: "Uploading" });
  }

  async function onDelete(fileId: string) {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Delete failed (${res.status})`);
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  async function onToggleFinal(fileId: string, current: boolean) {
    setError(null);
    try {
      const res = await fetch(`/api/files/${fileId}/final`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isFinal: !current }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          body.error ?? `${current ? "Unmark" : "Mark"} final failed (${res.status})`,
        );
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Final toggle failed.");
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Documents
            </span>
            <span className="tabular font-mono text-[10px] text-[var(--text-tertiary)]">
              {chains.length}
            </span>
          </div>
          {canEdit ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={newFileInput}
                type="file"
                className="hidden"
                onChange={onNewFileChange}
              />
              <input
                ref={cameraInput}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onNewFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={progress !== null || pending}
                onClick={() => cameraInput.current?.click()}
                title="Take a photo (mobile)"
              >
                <Camera className="mr-2 h-3.5 w-3.5" />
                Take photo
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={progress !== null || pending}
                onClick={() => newFileInput.current?.click()}
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                {progress?.label ? `${progress.label} ${progress.percent}%` : "Upload document"}
              </Button>
            </div>
          ) : null}
        </div>

        {canEdit ? (
          <p className="-mt-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Up to {formatBytes(MAX_UPLOAD_BYTES)}. PDF, Word, Excel, PowerPoint, images, video.
          </p>
        ) : null}

        {error ? (
          <p className="text-xs text-[var(--accent-red)]">{error}</p>
        ) : null}

        {progress !== null ? (
          <div className="h-1 w-full overflow-hidden rounded-sm bg-[var(--bg-elevated)]">
            <div
              className="h-full bg-[var(--metal-light)] transition-[width]"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        ) : null}

        {chains.length === 0 ? (
          <p className="rounded-sm border border-dashed border-[var(--border-subtle)] px-6 py-8 text-center text-sm text-[var(--text-tertiary)]">
            No documents attached yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {chains.map((chain) => (
              <li key={chain.head.id}>
                <ChainRow
                  chain={chain}
                  currentUserId={currentUserId}
                  canEdit={canEdit}
                  busy={progress !== null || pending}
                  onUploadVersion={(file, replacingFinal) =>
                    uploadFile({
                      file,
                      previousVersionId: chain.head.id,
                      replacingFinal,
                      label: `Uploading v${chain.head.version + 1}`,
                    })
                  }
                  onDelete={onDelete}
                  onToggleFinal={onToggleFinal}
                />
              </li>
            ))}
          </ul>
        )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function ChainRow({
  chain,
  currentUserId,
  canEdit,
  busy,
  onUploadVersion,
  onDelete,
  onToggleFinal,
}: {
  chain: Chain;
  currentUserId: string;
  canEdit: boolean;
  busy: boolean;
  onUploadVersion: (file: File, replacingFinal: boolean) => void;
  onDelete: (fileId: string) => void;
  onToggleFinal: (fileId: string, current: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const versionInput = useRef<HTMLInputElement>(null);
  const head = chain.head;

  function pickVersion() {
    if (chain.chainHasFinal) {
      const ok = confirm(
        "This document already has a FINAL version. Upload a new version anyway?",
      );
      if (!ok) return;
    }
    versionInput.current?.click();
  }

  function onVersionChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onUploadVersion(file, chain.chainHasFinal);
  }

  return (
    <div className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <a
              href={`/api/files/${head.id}`}
              download={head.filename}
              className="truncate text-sm text-[var(--text-primary)] hover:underline"
            >
              {head.filename}
            </a>
            <Badge variant="metal" className="shrink-0">
              v{head.version}
            </Badge>
            {chain.chainHasFinal ? (
              <Badge variant="green" className="shrink-0">
                <Lock className="mr-1 h-2.5 w-2.5" />
                Final
              </Badge>
            ) : null}
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {head.user.name}
            <span className="mx-1.5">,</span>
            {formatBytes(head.sizeBytes)}
            <span className="mx-1.5">,</span>
            {formatTimestamp(head.uploadedAt)}
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={`/api/files/${head.id}`}
                download={head.filename}
                className="rounded-sm p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                aria-label={`Download ${head.filename}`}
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
          {canEdit ? (
            <>
              <input
                ref={versionInput}
                type="file"
                className="hidden"
                onChange={onVersionChange}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={pickVersion}
                    disabled={busy}
                    className="rounded-sm p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-50"
                    aria-label="Upload new version"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Upload new version</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onToggleFinal(head.id, head.isFinal)}
                    disabled={busy}
                    className={cn(
                      "rounded-sm p-2 transition-colors hover:bg-[var(--bg-elevated)]",
                      head.isFinal
                        ? "text-[var(--accent-green)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--accent-green)]",
                    )}
                    aria-label={head.isFinal ? "Unmark final" : "Mark final"}
                  >
                    <Star
                      className="h-3.5 w-3.5"
                      fill={head.isFinal ? "currentColor" : "none"}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {head.isFinal ? "Unmark final" : "Mark final"}
                </TooltipContent>
              </Tooltip>
            </>
          ) : null}
          {(canEdit || head.user.id === currentUserId) && !head.isFinal ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onDelete(head.id)}
                  disabled={busy}
                  className="rounded-sm p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-red)] disabled:opacity-50"
                  aria-label={`Delete ${head.filename}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </header>

      <AiDiffBlock entry={head} />

      {chain.history.length > 0 ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            {open ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {chain.history.length} earlier version
            {chain.history.length === 1 ? "" : "s"}
          </button>
          {open ? (
            <ol className="mt-3 flex flex-col gap-3 border-l border-[var(--border-subtle)] pl-4">
              {chain.history.map((h) => (
                <li
                  key={h.id}
                  className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/files/${h.id}`}
                          download={h.filename}
                          className="truncate text-xs text-[var(--text-primary)] hover:underline"
                        >
                          {h.filename}
                        </a>
                        <Badge variant="metal" className="shrink-0">
                          v{h.version}
                        </Badge>
                        {h.isFinal ? (
                          <Badge variant="green" className="shrink-0">
                            Final
                          </Badge>
                        ) : null}
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                        {h.user.name}
                        <span className="mx-1.5">,</span>
                        {formatBytes(h.sizeBytes)}
                        <span className="mx-1.5">,</span>
                        {formatTimestamp(h.uploadedAt)}
                      </span>
                    </div>
                    <HistoryActions entry={h} />
                  </div>
                  <AiDiffBlock entry={h} compact />
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function HistoryActions({
  entry,
}: {
  entry: ChainEntry;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={`/api/files/${entry.id}`}
            download={entry.filename}
            className="rounded-sm p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]"
            aria-label={`Download ${entry.filename}`}
          >
            <Download className="h-3 w-3" />
          </a>
        </TooltipTrigger>
        <TooltipContent>Download</TooltipContent>
      </Tooltip>
    </div>
  );
}

function AiDiffBlock({
  entry,
  compact = false,
}: {
  entry: ChainEntry;
  compact?: boolean;
}) {
  const status = entry.aiDiffStatus;
  if (!status) {
    // Root version; no comparison possible.
    return null;
  }
  const wrapper = cn(
    "mt-3 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)]",
    compact ? "p-2.5" : "p-3",
  );

  if (status === "pending") {
    return (
      <div className={wrapper}>
        <p className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Sparkles className="h-3 w-3 animate-pulse" />
          Generating change summary...
        </p>
      </div>
    );
  }
  if (status === "skipped_v1") return null;
  if (status === "skipped_quota") {
    return (
      <div className={wrapper}>
        <p className="text-xs text-[var(--text-tertiary)]">
          Daily AI diff quota reached. Summary not generated.
        </p>
      </div>
    );
  }
  if (status === "unsupported") {
    return (
      <div className={wrapper}>
        <p className="text-xs text-[var(--text-tertiary)]">
          File type not supported for AI summary (only PDF and DOCX with
          extractable text).
        </p>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div
        className={cn(
          wrapper,
          "border-[color-mix(in_srgb,var(--accent-red)_30%,transparent)]",
        )}
      >
        <p className="text-xs text-[var(--accent-red)]">
          AI summary failed{entry.aiDiffError ? `: ${entry.aiDiffError}` : "."}
        </p>
      </div>
    );
  }
  if (status === "done") {
    const parsed = tryParseSummary(entry.aiDiffSummary);
    return (
      <div className={wrapper}>
        <p className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <Sparkles className="h-3 w-3" />
          Change summary vs previous version
        </p>
        {parsed ? (
          <SummaryView parsed={parsed} />
        ) : (
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--text-secondary)]">
            {entry.aiDiffSummary}
          </pre>
        )}
      </div>
    );
  }
  return null;
}

type ParsedSummary = {
  headline?: string;
  added?: string[];
  removed?: string[];
  modified?: string[];
  open_questions?: string[];
};

function tryParseSummary(raw: string | null): ParsedSummary | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") return obj as ParsedSummary;
  } catch {
    /* fall through */
  }
  return null;
}

function SummaryView({ parsed }: { parsed: ParsedSummary }) {
  return (
    <div className="flex flex-col gap-2 text-xs">
      {parsed.headline ? (
        <p className="text-sm text-[var(--text-primary)]">{parsed.headline}</p>
      ) : null}
      <SummaryGroup label="Added" items={parsed.added} tone="green" />
      <SummaryGroup label="Removed" items={parsed.removed} tone="red" />
      <SummaryGroup label="Modified" items={parsed.modified} tone="amber" />
      <SummaryGroup
        label="Open questions"
        items={parsed.open_questions}
        tone="blue"
      />
    </div>
  );
}

function SummaryGroup({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[] | undefined;
  tone: "green" | "red" | "amber" | "blue";
}) {
  if (!items || items.length === 0) return null;
  const dotColor = {
    green: "var(--accent-green)",
    red: "var(--accent-red)",
    amber: "var(--accent-amber)",
    blue: "var(--accent-blue)",
  }[tone];
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
        {label}
      </span>
      <ul className="flex flex-col gap-1">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[var(--text-secondary)]"
          >
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
      <Separator className="opacity-30" />
    </div>
  );
}
