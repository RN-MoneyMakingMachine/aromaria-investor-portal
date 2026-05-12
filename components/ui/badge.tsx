import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest tabular-nums transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)]",
        outline:
          "border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)]",
        green:
          "border-[var(--accent-green)] bg-transparent text-[var(--accent-green)]",
        amber:
          "border-[var(--accent-amber)] bg-transparent text-[var(--accent-amber)]",
        red: "border-[var(--accent-red)] bg-transparent text-[var(--accent-red)]",
        blue: "border-[var(--accent-blue)] bg-transparent text-[var(--accent-blue)]",
        metal:
          "border-[var(--metal-mid)] bg-transparent text-[var(--metal-light)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
