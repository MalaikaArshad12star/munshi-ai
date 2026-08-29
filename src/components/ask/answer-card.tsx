import { Lightbulb, Target } from "lucide-react";
import type { MunshiAnswer } from "@/lib/answers";

export function AnswerCard({ answer, simple }: { answer: MunshiAnswer; simple: boolean }) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-fg">{answer.quick}</p>

      {!simple && answer.numbers.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {answer.numbers.map((n, i) => (
            <div key={i} className="rounded-xl border border-line bg-panel2/70 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">{n.label}</p>
              <p className="text-sm font-extrabold tabular text-brand-strong">{n.value}</p>
            </div>
          ))}
        </div>
      )}

      {!simple && answer.insight && (
        <div className="flex items-start gap-2 rounded-xl bg-panel2/70 p-3">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p className="text-xs leading-relaxed text-muted">{answer.insight}</p>
        </div>
      )}

      {answer.action && (
        <div className="flex items-start gap-2 rounded-xl border border-brand/30 bg-brand/10 p-3">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />
          <p className="text-xs font-semibold leading-relaxed text-fg">{answer.action}</p>
        </div>
      )}
    </div>
  );
}
