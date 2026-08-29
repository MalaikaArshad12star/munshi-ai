import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { DeltaBadge } from "@/components/ui/delta-badge";

export function KpiCard({
  label,
  value,
  sub,
  icon,
  iconClass,
  delta,
  invertDelta = false,
  simple = false,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  iconClass?: string;
  delta?: number | null;
  invertDelta?: boolean;
  simple?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-panel p-5 shadow-card transition-transform hover:-translate-y-0.5",
        highlight
          ? "border-brand/40 shadow-glow"
          : "border-line hover:border-line2",
      )}
    >
      {/* soft corner glow */}
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl",
          highlight ? "bg-brand/20" : "bg-panel3/70",
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 font-bold tabular text-fg",
              simple ? "text-4xl" : "text-[26px]",
            )}
          >
            {value}
          </p>
          {sub && <p className="mt-1 truncate text-[11px] text-faint">{sub}</p>}
        </div>
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
            iconClass ?? "bg-panel3 text-brand-strong",
          )}
        >
          {icon}
        </span>
      </div>
      {delta !== undefined && (
        <div className="relative mt-3 flex items-center gap-2">
          <DeltaBadge pct={delta} invert={invertDelta} />
          <span className="text-[11px] text-faint">vs prev 7-day avg</span>
        </div>
      )}
    </div>
  );
}
