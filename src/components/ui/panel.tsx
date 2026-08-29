import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-line bg-panel shadow-card",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-sm font-bold text-fg">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-faint">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
