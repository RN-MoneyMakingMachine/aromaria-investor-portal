import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { SIDE_LABEL } from "@/lib/constants";
import { firstName, requireUser } from "@/lib/session";

export default async function WelcomePage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-16 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-serif text-5xl font-light tracking-tight text-[var(--text-primary)]">
          Welcome, {firstName(user.name)}.
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {user.title ?? user.role}
          <span className="mx-2 text-[var(--text-tertiary)]">,</span>
          {SIDE_LABEL[user.side] ?? user.side}
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <DoorCard
          href="/deliverables"
          eyebrow="Section I to III"
          title="Investment Deliverables"
          body="31 commitments under Exhibit A. Track approvals, documents, and progress."
        />
        <DoorCard
          href="/chambers"
          eyebrow="Board, Reporting, Calculator"
          title="The Chambers"
          body="Board meetings, reporting, and operational records."
        />
      </div>
    </div>
  );
}

function DoorCard({
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
        <CardContent className="flex h-full flex-col gap-8 p-10">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {eyebrow}
          </span>
          <h2 className="font-serif text-3xl font-light leading-tight tracking-tight text-[var(--text-primary)]">
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
