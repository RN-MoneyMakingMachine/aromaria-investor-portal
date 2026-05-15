import Link from "next/link";

import { PortalNav } from "@/components/portal/portal-nav";
import { ThemeToggle } from "@/components/portal/theme-toggle";
import { UserMenu } from "@/components/portal/user-menu";
import { FOOTER_NOTICE } from "@/lib/constants";
import { requireUser } from "@/lib/session";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 md:gap-6 md:px-6 md:py-5">
          <div className="flex items-center gap-4 md:gap-10">
            <Link
              href="/welcome"
              className="wordmark text-sm text-[var(--metal-light)]"
            >
              AROMARIA
            </Link>
            <PortalNav />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-10">
        {children}
      </main>

      <footer className="border-t border-[var(--border-subtle)] px-4 py-4 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <span>{FOOTER_NOTICE}</span>
          <span>AROMARIA Investor Portal</span>
        </div>
      </footer>
    </div>
  );
}
