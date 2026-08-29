import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatSignedPct } from "@/lib/format";

// Delta badge that is "good" when positive is desirable, and can invert
// semantics for metrics where a rise is bad (e.g. expenses).
export function DeltaBadge({
  pct,
  invert = false,
}: {
  pct: number | null;
  invert?: boolean;
}) {
  if (pct === null) {
    return (
      <span className="rounded-full bg-panel3 px-2 py-0.5 text-[11px] font-semibold text-faint">
        —
      </span>
    );
  }
  const rising = pct >= 0;
  const positive = invert ? !rising : rising;
  const Icon = rising ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular",
        positive ? "bg-up/12 text-up" : "bg-down/12 text-down",
      )}
    >
      <Icon className="h-3 w-3" />
      {formatSignedPct(pct)}
    </span>
  );
}
