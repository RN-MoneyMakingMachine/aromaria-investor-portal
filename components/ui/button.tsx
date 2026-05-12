import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-overlay)]",
        primary:
          "border border-[var(--metal-mid)] bg-gradient-to-br from-[var(--metal-light)] to-[var(--metal-mid)] text-[var(--bg-base)] hover:from-[var(--metal-light)] hover:to-[var(--metal-light)]",
        outline:
          "border border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]",
        ghost:
          "border border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
        destructive:
          "border border-[var(--accent-red)] bg-transparent text-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:text-[var(--text-primary)]",
        link: "border border-transparent text-[var(--text-secondary)] underline-offset-4 hover:text-[var(--text-primary)] hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
