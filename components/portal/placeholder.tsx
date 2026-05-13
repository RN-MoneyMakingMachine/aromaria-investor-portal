import { Card, CardContent } from "@/components/ui/card";

export function PhasePlaceholder({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="py-12">
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col gap-5 p-12 text-center">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {eyebrow}
          </p>
          <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {body}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
