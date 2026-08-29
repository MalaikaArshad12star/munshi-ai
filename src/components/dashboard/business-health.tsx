import { cn } from "@/lib/cn";
import type { Kpis, FactorStatus } from "@/lib/kpis";
import type { Intelligence } from "@/lib/intelligence";
import { Panel, PanelHeader } from "@/components/ui/panel";

const STATUS_META: Record<FactorStatus, { dot: string; text: string; label: string }> = {
  good: { dot: "bg-up", text: "text-up", label: "Good" },
  warning: { dot: "bg-warn", text: "text-warn", label: "Watch" },
  critical: { dot: "bg-down", text: "text-down", label: "Risk" },
};

const OVERALL: Record<
  Kpis["health"]["status"],
  { label: string; ring: string; text: string }
> = {
  excellent: { label: "Excellent", ring: "#34d399", text: "text-up" },
  good: { label: "Good", ring: "#10b981", text: "text-brand-strong" },
  fair: { label: "Fair", ring: "#fbbf24", text: "text-warn" },
  poor: { label: "Needs care", ring: "#f87171", text: "text-down" },
};

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <div className="relative h-[112px] w-[112px]">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1a2540" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-3xl font-extrabold tabular text-fg">{score}</p>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-faint">
            / 100
          </p>
        </div>
      </div>
    </div>
  );
}

export function BusinessHealth({
  kpis,
  simple = false,
  intel,
}: {
  kpis: Kpis;
  simple?: boolean;
  intel?: Intelligence;
}) {
  const { score, status, factors } = kpis.health;
  const overall = OVERALL[status];
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title="Business Health" sub="AI-scored from your live numbers" />
      <div className="flex-1 px-5 py-4">
        <div className="flex items-center gap-4">
          <ScoreRing score={score} color={overall.ring} />
          <div>
            <p className={cn("text-lg font-bold", overall.text)}>{overall.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-faint">
              {kpis.last30.marginPct.toFixed(1)}% margin ·{" "}
              {kpis.last30.saleCount} sales in 30 days
            </p>
          </div>
        </div>

        {!simple && (
          <ul className="mt-5 space-y-2.5">
            {factors.map((f) => {
              const meta = STATUS_META[f.status];
              return (
                <li key={f.key} className="flex items-center gap-2.5">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
                  <span className="w-[110px] shrink-0 text-xs font-semibold text-fg">
                    {f.label}
                  </span>
                  <span className="flex-1 truncate text-[11px] text-faint">
                    {f.detail}
                  </span>
                  <span className={cn("text-[11px] font-bold", meta.text)}>
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {!simple && intel && (
          <div className="mt-5 space-y-3 border-t border-line pt-4">
            {intel.health.helping.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-up">What is helping</p>
                <ul className="mt-1 space-y-1">
                  {intel.health.helping.slice(0, 2).map((h, i) => (
                    <li key={i} className="text-[11px] text-muted">• {h}</li>
                  ))}
                </ul>
              </div>
            )}
            {intel.health.attention.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-warn">Needs attention</p>
                <ul className="mt-1 space-y-1">
                  {intel.health.attention.slice(0, 2).map((h, i) => (
                    <li key={i} className="text-[11px] text-muted">• {h}</li>
                  ))}
                </ul>
              </div>
            )}
            {intel.health.recommendation && (
              <div className="rounded-xl border border-brand/30 bg-brand/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand-strong">Recommended next action</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-fg">
                  {intel.health.recommendation.action}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
