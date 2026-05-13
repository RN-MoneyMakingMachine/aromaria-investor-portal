"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  postCommentAction,
  type CommentState,
} from "@/app/(portal)/deliverables/actions";

function SubmitButton({ label = "Post comment" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="sm" disabled={pending}>
      {pending ? "Posting" : label}
    </Button>
  );
}

export function CommentForm({
  deliverableId,
  parentId,
  label = "Post comment",
  placeholder = "Add a comment.",
  compact = false,
  onPosted,
}: {
  deliverableId: string;
  parentId?: string;
  label?: string;
  placeholder?: string;
  compact?: boolean;
  onPosted?: () => void;
}) {
  const action = postCommentAction.bind(null, deliverableId);
  const [state, formAction] = useActionState<CommentState, FormData>(
    async (prev, formData) => {
      const next = await action(prev, formData);
      if (!next.error) onPosted?.();
      return next;
    },
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {!compact ? (
        <Label htmlFor={`body-${parentId ?? "root"}`}>Comment</Label>
      ) : null}
      <textarea
        id={`body-${parentId ?? "root"}`}
        name="body"
        required
        maxLength={5000}
        defaultValue={state.body ?? ""}
        placeholder={placeholder}
        rows={compact ? 2 : 4}
        className={cn(
          "w-full resize-none rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-tertiary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)]",
        )}
      />
      {parentId ? (
        <input type="hidden" name="parentId" value={parentId} />
      ) : null}
      {state.error ? (
        <p className="text-xs text-[var(--accent-red)]">{state.error}</p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton label={label} />
      </div>
    </form>
  );
}
