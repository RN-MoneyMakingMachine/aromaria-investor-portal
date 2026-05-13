"use client";

import { useState, useTransition } from "react";
import type { Role, Side } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ROLE_LABEL, SIDE_LABEL } from "@/lib/constants";
import { formatTimestamp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { deleteCommentAction } from "@/app/(portal)/deliverables/actions";

import { CommentForm } from "./comment-form";

type RawComment = {
  id: string;
  body: string;
  parentId: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    side: Side;
    role: Role;
    title: string | null;
  };
};

type Threaded = RawComment & { replies: RawComment[] };

function group(comments: RawComment[]): Threaded[] {
  const roots: Threaded[] = comments
    .filter((c) => !c.parentId)
    .map((c) => ({ ...c, replies: [] }));
  const map = new Map(roots.map((c) => [c.id, c]));
  for (const c of comments) {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(c);
    }
  }
  return roots;
}

export function CommentThread({
  deliverableId,
  comments,
  currentUserId,
}: {
  deliverableId: string;
  comments: RawComment[];
  currentUserId: string;
}) {
  const threads = group(comments);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl font-light tracking-tight text-[var(--text-primary)]">
          Comments
        </h2>
        <span className="tabular font-mono text-xs text-[var(--text-tertiary)]">
          {comments.length}
        </span>
      </header>

      <div className="flex flex-col gap-6">
        {threads.length === 0 ? (
          <p className="rounded-sm border border-dashed border-[var(--border-subtle)] px-6 py-10 text-center text-sm text-[var(--text-tertiary)]">
            No comments yet. Start the conversation below.
          </p>
        ) : (
          threads.map((t) => (
            <CommentRow
              key={t.id}
              comment={t}
              deliverableId={deliverableId}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      <Separator />

      <CommentForm
        deliverableId={deliverableId}
        placeholder="Add a comment. Plain text, immutable in v1."
      />
    </section>
  );
}

function CommentRow({
  comment,
  deliverableId,
  currentUserId,
}: {
  comment: Threaded;
  deliverableId: string;
  currentUserId: string;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const hasReplies = comment.replies.length > 0;

  return (
    <article className="flex flex-col gap-3">
      <CommentBody
        comment={comment}
        currentUserId={currentUserId}
        canDelete={!hasReplies}
      />

      {hasReplies ? (
        <div className="ml-6 flex flex-col gap-4 border-l border-[var(--border-subtle)] pl-6">
          {comment.replies.map((r) => (
            <CommentBody
              key={r.id}
              comment={r}
              currentUserId={currentUserId}
              canDelete
            />
          ))}
        </div>
      ) : null}

      <div className="ml-6">
        {replyOpen ? (
          <div className="flex flex-col gap-2 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <CommentForm
              deliverableId={deliverableId}
              parentId={comment.id}
              compact
              label="Reply"
              placeholder="Reply to this comment."
              onPosted={() => setReplyOpen(false)}
            />
            <button
              type="button"
              onClick={() => setReplyOpen(false)}
              className="self-end text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setReplyOpen(true)}
            className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            Reply
          </button>
        )}
      </div>
    </article>
  );
}

function CommentBody({
  comment,
  currentUserId,
  canDelete,
}: {
  comment: RawComment;
  currentUserId: string;
  canDelete: boolean;
}) {
  const isAuthor = comment.user.id === currentUserId;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCommentAction(comment.id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-base)] p-5">
      <header className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-sm text-[var(--text-primary)]">
            {comment.user.name}
          </span>
          <Badge
            variant={comment.user.side === "OMOY" ? "blue" : "metal"}
            className="shrink-0"
          >
            {SIDE_LABEL[comment.user.side] ?? comment.user.side}
          </Badge>
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {ROLE_LABEL[comment.user.role] ?? comment.user.role}
          </span>
        </div>
        <span className="tabular font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          {formatTimestamp(comment.createdAt)}
        </span>
      </header>
      <p
        className={cn(
          "mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]",
        )}
      >
        {comment.body}
      </p>
      {isAuthor && canDelete ? (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent-red)] disabled:opacity-50"
          >
            {pending ? "Deleting" : "Delete"}
          </button>
          {error ? (
            <span className="text-[10px] text-[var(--accent-red)]">{error}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
