"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/dates";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";

export type DeliverableFile = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
  user: { id: string; name: string };
};

export function FileUploader({
  deliverableId,
  files,
  currentUserId,
  canEdit,
}: {
  deliverableId: string;
  files: DeliverableFile[];
  currentUserId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pickFile() {
    fileInput.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File exceeds ${formatBytes(MAX_UPLOAD_BYTES)} limit.`);
      return;
    }
    setError(null);
    void upload(file);
  }

  async function upload(file: File) {
    setProgress(0);
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/deliverables/${deliverableId}/files`);
        xhr.setRequestHeader("x-filename", encodeURIComponent(file.name));
        xhr.setRequestHeader(
          "content-type",
          file.type || "application/octet-stream",
        );
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(Math.round((ev.loaded / ev.total) * 100));
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
        xhr.send(file);
      });
      setProgress(null);
      startTransition(() => router.refresh());
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
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

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Files
            </span>
            <span className="tabular font-mono text-[10px] text-[var(--text-tertiary)]">
              {files.length}
            </span>
          </div>
          {canEdit ? (
            <>
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                onChange={onFileChange}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={progress !== null || pending}
                onClick={pickFile}
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                {progress !== null ? `Uploading ${progress}%` : "Upload"}
              </Button>
            </>
          ) : null}
        </div>

        {error ? (
          <p className="text-xs text-[var(--accent-red)]">{error}</p>
        ) : null}

        {progress !== null ? (
          <div className="h-1 w-full overflow-hidden rounded-sm bg-[var(--bg-elevated)]">
            <div
              className="h-full bg-[var(--metal-light)] transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}

        {files.length === 0 ? (
          <p className="rounded-sm border border-dashed border-[var(--border-subtle)] px-6 py-8 text-center text-sm text-[var(--text-tertiary)]">
            No files attached yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
            {files.map((f) => {
              const canRemove = canEdit || f.user.id === currentUserId;
              return (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <a
                      href={`/api/files/${f.id}`}
                      className="truncate text-sm text-[var(--text-primary)] hover:underline"
                      download={f.filename}
                    >
                      {f.filename}
                    </a>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                      {f.user.name}
                      <span className="mx-1.5">,</span>
                      {formatBytes(f.sizeBytes)}
                      <span className="mx-1.5">,</span>
                      {formatTimestamp(f.uploadedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/api/files/${f.id}`}
                      download={f.filename}
                      className="rounded-sm p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      aria-label={`Download ${f.filename}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    {canRemove ? (
                      <button
                        type="button"
                        onClick={() => onDelete(f.id)}
                        className="rounded-sm p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-red)]"
                        aria-label={`Delete ${f.filename}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
