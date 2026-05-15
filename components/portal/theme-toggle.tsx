"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Read the DOM attribute set by the pre-paint script and reflect it in
    // React state. Server render and first client render both produce the
    // null placeholder, so this avoids a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(readTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore quota / private-mode errors
    }
  }

  // During SSR and before the effect runs, render a same-size placeholder so
  // hydration sees the same DOM shape regardless of what data-theme resolved
  // to in the pre-paint script.
  if (theme === null) {
    return (
      <span
        aria-hidden
        className="inline-block h-8 w-8 rounded-sm"
      />
    );
  }

  const goingLight = theme === "dark";
  const label = goingLight ? "Switch to light mode" : "Switch to dark mode";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggle}
            aria-label={label}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            {goingLight ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
