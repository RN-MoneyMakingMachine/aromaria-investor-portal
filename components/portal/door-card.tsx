import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function DoorCard({
  href,
  eyebrow,
  title,
  body,
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full border-[var(--border-subtle)] bg-gradient-to-br from-[var(--bg-elevated)] via-[var(--bg-base)] to-[var(--bg-base)] transition-colors duration-200 group-hover:border-[var(--metal-mid)]">
        <CardContent className="flex h-full flex-col gap-6 p-6 md:gap-8 md:p-10">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {eyebrow}
          </span>
          <h2 className="font-serif text-2xl font-light leading-tight tracking-tight text-[var(--text-primary)] md:text-3xl">
            {title}
          </h2>
          <p className="flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
            {body}
          </p>
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">
            Enter <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
