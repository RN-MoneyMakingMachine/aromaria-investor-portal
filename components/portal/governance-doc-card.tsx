import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProgressBar } from "@/components/portal/progress-bar";
import { Card, CardContent } from "@/components/ui/card";

export function GovernanceDocCard({
  href,
  section,
  title,
  completed,
  total,
}: {
  href: string;
  section: string;
  title: string;
  completed: number;
  total: number;
}) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const allDone = total > 0 && completed === total;

  return (
    <Link href={href} className="group block">
      <Card className="h-full border-t-2 border-t-[var(--accent-green)] transition-colors duration-200 group-hover:border-[var(--metal-mid)] group-hover:border-t-[var(--accent-green)]">
        <CardContent className="flex h-full flex-col gap-5 p-5 md:gap-6 md:p-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              {section}
            </span>
            <h2 className="font-serif text-lg font-light leading-snug tracking-tight text-[var(--text-primary)] md:text-xl">
              {title}
            </h2>
          </div>

          <div className="flex flex-1 flex-col justify-end gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                Adoption
              </span>
              <span className="tabular font-mono text-xs text-[var(--text-secondary)]">
                {completed} of {total}
              </span>
            </div>
            <ProgressBar value={percent} tone={allDone ? "green" : "green"} />
          </div>

          <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">
            Enter <ArrowRight className="h-3 w-3" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
