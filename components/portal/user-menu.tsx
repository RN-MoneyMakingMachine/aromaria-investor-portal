"use client";

import Link from "next/link";
import { ChevronDown, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SessionUser } from "@/lib/rbac";

import { doSignOut } from "@/app/(portal)/sign-out-action";

export function UserMenu({ user }: { user: SessionUser }) {
  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-sm border border-transparent px-2 py-1 text-left transition-colors hover:border-[var(--border-subtle)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
            {initials}
          </span>
          <span className="hidden flex-col text-right sm:flex">
            <span className="text-xs text-[var(--text-primary)]">{user.name}</span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              {user.side}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            <span>Account</span>
          </Link>
        </DropdownMenuItem>
        {user.role === "ADMIN" ? (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <form action={doSignOut}>
          <DropdownMenuItem asChild>
            <button
              type="submit"
              className="flex w-full items-center gap-2 text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
