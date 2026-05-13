import Link from "next/link";

import { FOOTER_NOTICE } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-center px-8 py-10">
        <Link href="/" className="wordmark text-base text-[var(--metal-light)]">
          AROMARIA
        </Link>
      </header>
      <section className="flex flex-1 items-center justify-center px-6 pb-16">
        {children}
      </section>
      <footer className="border-t border-[var(--border-subtle)] px-8 py-4 text-center">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          {FOOTER_NOTICE}
        </p>
      </footer>
    </main>
  );
}
