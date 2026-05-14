import { FOOTER_NOTICE } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(212,212,216,0.06), transparent 70%), radial-gradient(80% 60% at 50% 100%, rgba(72,76,88,0.18), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-[var(--metal-mid)] to-transparent opacity-40"
      />

      <section className="flex flex-1 items-center justify-center px-6 py-20">
        {children}
      </section>

      <footer className="border-t border-[var(--border-subtle)] px-8 py-5 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-tertiary)]">
          {FOOTER_NOTICE}
        </p>
      </footer>
    </main>
  );
}
