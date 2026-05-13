"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/welcome", label: "Welcome" },
  { href: "/deliverables", label: "Deliverables" },
  { href: "/chambers", label: "Chambers" },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-xs uppercase tracking-widest transition-colors",
              active
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
