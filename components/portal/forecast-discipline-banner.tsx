import { TriangleAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export type ForecastTrigger = {
  kind: "material_revision" | "cumulative_drift";
  percent: number; // e.g. 12, 18
  detail: string;
};

// Renders only when a trigger fires. Otherwise: returns null and takes no
// vertical space. UI hooks up to a service later — for now, the page passes
// `null` and the banner is silent.
export function ForecastDisciplineBanner({
  trigger,
}: {
  trigger: ForecastTrigger | null;
}) {
  if (!trigger) return null;
  const title =
    trigger.kind === "material_revision"
      ? "Material revision threshold crossed (10%)"
      : "Plan Reset trigger — cumulative drift 15%";
  return (
    <Card className="border-l-2 border-l-[var(--accent-amber)]">
      <CardContent className="flex items-start gap-4 p-5 md:p-6">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-amber)]" />
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-[var(--accent-amber)]">
            Forecast discipline
          </span>
          <span className="font-serif text-base font-light text-[var(--text-primary)]">
            {title} — {trigger.percent}%
          </span>
          <span className="text-xs text-[var(--text-secondary)]">{trigger.detail}</span>
        </div>
      </CardContent>
    </Card>
  );
}
