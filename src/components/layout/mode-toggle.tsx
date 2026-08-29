"use client";

import { Gauge, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp } from "@/components/providers/app-providers";
import type { ViewMode } from "@/lib/types";

const OPTIONS: { value: ViewMode; label: string; icon: typeof Gauge }[] = [
  { value: "simple", label: "Simple", icon: Gauge },
  { value: "professional", label: "Pro", icon: LayoutGrid },
];

export function ModeToggle() {
  const { settings, setMode, mounted } = useApp();
  const active = mounted ? settings.mode : "professional";
  return (
    <div
      className="flex h-9 items-center gap-0.5 rounded-xl border border-line bg-panel p-0.5"
      role="group"
      aria-label="View mode"
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = active === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setMode(opt.value)}
            className={cn(
              "flex h-full items-center gap-1.5 rounded-[10px] px-3 text-xs font-semibold transition-all",
              selected
                ? "bg-gradient-to-b from-panel3 to-panel2 text-fg shadow-[inset_0_0_0_1px_var(--color-line2)]"
                : "text-faint hover:text-muted",
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", selected && "text-gold")} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
