import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@prisma/client";

import { Card, CardContent } from "@/components/ui/card";
import { CATEGORY_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { ProgressBar, type ProgressTone } from "./progress-bar";

const CATEGORY_TONE: Record<Category, ProgressTone> = {
  GOVERNANCE: "blue",
  REPORTING: "amber",
  LEGAL: "red",
  BUSINESS: "metal",
  STRUCTURE: "metal",
  HR: "amber",
  FINANCIAL: "green",
  RISK: "red",
  FUNDING: "green",
};

export function SectionCard({
  category,
  total,
  completed,
  percent,
}: {
  category: Category;
  total: number;
  completed: number;
  percent: number;
}) {
  const tone = CATEGORY_TONE[category];
  return (
    <Link
      href={`/deliverables/${category.toLowerCase()}`}
      className="group block h-full"
    >
      <Card className="h-full transition-colors duration-200 group-hover:border-[var(--border-strong)]">
        <CardContent className="flex h-full flex-col gap-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                Category
              </span>
              <span className="font-serif text-xl font-light tracking-tight text-[var(--text-primary)]">
                {CATEGORY_LABEL[category]}
              </span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--text-primary)]" />
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="tabular font-mono text-xs text-[var(--text-secondary)]">
                {completed} of {total}
              </span>
              <span className="tabular font-mono text-xs text-[var(--text-tertiary)]">
                {percent}%
              </span>
            </div>
            <ProgressBar value={percent} tone={tone} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function PhaseCard({
  label,
  description,
  total,
  completed,
  percent,
  tone,
  href,
}: {
  label: string;
  description: string;
  total: number;
  completed: number;
  percent: number;
  tone: ProgressTone;
  href?: string;
}) {
  const body = (
    <Card
      className={cn(
        "h-full",
        href && "transition-colors duration-200 group-hover:border-[var(--border-strong)]",
      )}
    >
      <CardContent className="flex h-full flex-col gap-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Phase
            </span>
            <span className="font-serif text-xl font-light tracking-tight text-[var(--text-primary)]">
              {label}
            </span>
          </div>
          {href ? (
            <ArrowUpRight className="h-4 w-4 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--text-primary)]" />
          ) : null}
        </div>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="tabular font-mono text-xs text-[var(--text-secondary)]">
              {completed} of {total}
            </span>
            <span className="tabular font-mono text-xs text-[var(--text-tertiary)]">
              {percent}%
            </span>
          </div>
          <ProgressBar value={percent} tone={tone} />
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return body;
  return (
    <Link href={href} className="group block h-full">
      {body}
    </Link>
  );
}
