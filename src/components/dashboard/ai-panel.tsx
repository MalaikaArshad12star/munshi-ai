import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Lightbulb, MessageSquareText, Mic, Sparkles, TrendingUp } from "lucide-react";
import type { Intelligence, SmartInsight } from "@/lib/intelligence";
import { formatCompact } from "@/lib/format";

const TYPE_ICON: Record<SmartInsight["type"], typeof Lightbulb> = {
  opportunity: Lightbulb,
  warning: AlertTriangle,
  positive: TrendingUp,
  expense: AlertTriangle,
};

export function AiPanel({ intel }: { intel: Intelligence }) {
  const top = intel.insights[0];
  const rec = intel.health.recommendation;
  const f = intel.forecast;
  const TopIcon = top ? TYPE_ICON[top.type] : Sparkles;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-brand/25 bg-gradient-to-br from-panel2 via-panel to-panel shadow-glow">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
      <div className="grid gap-4 p-5 lg:grid-cols-3">
        {/* Insight */}
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-deep text-white shadow-glow">
            <TopIcon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-strong">Munshi Insight</p>
            <p className="mt-0.5 text-sm font-bold text-fg">{top?.title ?? "All looking stable"}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{top?.body ?? "No urgent signals right now."}</p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="flex items-start gap-3 lg:border-l lg:border-line lg:pl-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gold">Next best action</p>
            <p className="mt-0.5 text-sm font-bold text-fg">{rec?.problem ?? "Keep it up"}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{rec?.action ?? "Stay consistent."}</p>
          </div>
        </div>

        {/* Forecast + CTA */}
        <div className="flex flex-col justify-between gap-3 lg:border-l lg:border-line lg:pl-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-faint">Estimated next 7 days</p>
            <p className="mt-0.5 text-lg font-extrabold tabular text-fg">{formatCompact(f.next7Sales)}</p>
            <p className="text-[11px] text-faint">
              Trend {f.trend} · {f.confidence} confidence · estimate only
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/ask-munshi" className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-brand to-brand-deep text-xs font-bold text-white shadow-glow hover:brightness-110">
              <MessageSquareText className="h-4 w-4" /> Ask Munshi
            </Link>
            <Link href="/voice" className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-gold hover:bg-gold/25" aria-label="Voice Munshi">
              <Mic className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      <Link href="/ask-munshi" className="absolute right-3 top-3 text-faint hover:text-fg" aria-label="Open Ask Munshi">
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
