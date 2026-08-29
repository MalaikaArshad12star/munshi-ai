import { AlertTriangle, Lightbulb, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SmartInsight } from "@/lib/intelligence";
import { Panel } from "@/components/ui/panel";

const TONE: Record<SmartInsight["type"], { icon: typeof Lightbulb; ring: string; iconBg: string }> = {
  positive: { icon: TrendingUp, ring: "border-up/25", iconBg: "bg-up/12 text-up" },
  opportunity: { icon: Lightbulb, ring: "border-brand/25", iconBg: "bg-brand/12 text-brand-strong" },
  warning: { icon: AlertTriangle, ring: "border-gold/25", iconBg: "bg-gold/12 text-gold" },
  expense: { icon: AlertTriangle, ring: "border-down/25", iconBg: "bg-down/12 text-down" },
};

export function InsightsPreview({ insights }: { insights: SmartInsight[] }) {
  return (
    <Panel className="relative overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-line bg-gradient-to-r from-brand/12 via-panel to-panel px-5 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-deep text-white shadow-glow">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-fg">Munshi Insights</h2>
          <p className="text-[11px] text-faint">Generated live from your business data</p>
        </div>
        <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[10px] font-bold text-gold">AI</span>
      </div>

      {insights.length === 0 ? (
        <p className="p-5 text-sm text-faint">No notable signals right now — things look steady.</p>
      ) : (
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {insights.slice(0, 3).map((ins) => {
            const tone = TONE[ins.type];
            const Icon = tone.icon;
            return (
              <article key={ins.id} className={cn("rounded-xl border bg-panel2/60 p-4 transition-colors hover:bg-panel2", tone.ring)}>
                <div className="flex items-center gap-2.5">
                  <span className={cn("grid h-7 w-7 place-items-center rounded-lg", tone.iconBg)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="text-[13px] font-bold text-fg">{ins.title}</h3>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted">{ins.body}</p>
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
