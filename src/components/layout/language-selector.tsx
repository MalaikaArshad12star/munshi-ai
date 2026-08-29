"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp } from "@/components/providers/app-providers";
import type { Language } from "@/lib/types";

const OPTIONS: { value: Language; label: string; sub: string }[] = [
  { value: "en", label: "English", sub: "English" },
  { value: "ur", label: "اردو", sub: "Urdu" },
  { value: "roman", label: "Roman Urdu", sub: "Roman Urdu" },
];

export function LanguageSelector() {
  const { settings, setLanguage, mounted } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const current = OPTIONS.find((o) => o.value === settings.language) ?? OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 items-center gap-2 rounded-xl border border-line bg-panel px-3 text-xs font-semibold text-muted",
          "transition-colors hover:border-line2 hover:text-fg",
        )}
        aria-label="Select language"
      >
        <Globe className="h-3.5 w-3.5 text-brand-strong" />
        <span className={cn(current.value === "ur" && "urdu text-sm")}>
          {mounted ? current.label : "English"}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-44 overflow-hidden rounded-xl border border-line bg-panel shadow-card">
          {OPTIONS.map((opt) => {
            const selected = opt.value === settings.language;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setLanguage(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-medium transition-colors",
                  selected ? "bg-brand/10 text-fg" : "text-muted hover:bg-panel2 hover:text-fg",
                )}
              >
                <span className={cn(opt.value === "ur" && "urdu text-sm")}>{opt.label}</span>
                {selected && <Check className="h-3.5 w-3.5 text-brand-strong" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
