import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FOOTER_NOTICE } from "@/lib/constants";

export default function RootPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <span className="wordmark text-sm text-[var(--metal-light)]">
          AROMARIA
        </span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          Investor Portal
        </span>
      </header>

      <Separator />

      <section className="flex flex-1 items-center justify-center px-6 py-24">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col gap-6 p-10 text-center">
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Phase 1, Infrastructure
            </p>
            <h1 className="font-serif text-3xl font-light leading-tight tracking-tight text-[var(--text-primary)]">
              Welcome.
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              The AROMARIA Investor Portal is being prepared. Sign in becomes
              available in the next phase.
            </p>
            <Separator className="my-2" />
            <Link
              href="/login"
              className="text-xs uppercase tracking-widest text-[var(--text-secondary)] underline-offset-4 transition-colors hover:text-[var(--text-primary)] hover:underline"
            >
              Continue to sign in
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-[var(--border-subtle)] px-8 py-4">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          {FOOTER_NOTICE}
        </p>
      </footer>
    </main>
  );
}
