import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-base text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-tertiary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
