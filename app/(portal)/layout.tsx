import Link from "next/link";

import { PortalNav } from "@/components/portal/portal-nav";
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
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-5">
          <div className="flex items-center gap-10">
            <Link
              href="/welcome"
              className="wordmark text-sm text-[var(--metal-light)]"
            >
              AROMARIA
            </Link>
            <PortalNav />
          </div>
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {children}
      </main>

      <footer className="border-t border-[var(--border-subtle)] px-6 py-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <span>{FOOTER_NOTICE}</span>
          <span>AROMARIA Investor Portal</span>
        </div>
      </footer>
    </div>
  );
}
