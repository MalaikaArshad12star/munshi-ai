"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ExpenseSlice } from "@/lib/kpis";
import type { ExpenseCategory } from "@/lib/types";
import { formatCompact, formatPKR } from "@/lib/format";

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Rent: "#f6b73c",
  Electricity: "#facc15",
  Salaries: "#818cf8",
  Transport: "#f472b6",
  Supplies: "#34d399",
  Maintenance: "#22d3ee",
  Marketing: "#c084fc",
  Utilities: "#38bdf8",
  Other: "#94a3b8",
};

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-panel2 px-3 py-2 shadow-card">
      <p className="text-xs font-bold text-fg">
        {payload[0].name}: <span className="tabular">{formatPKR(payload[0].value)}</span>
      </p>
    </div>
  );
}

export function ExpenseBreakdown({ slices }: { slices: ExpenseSlice[] }) {
  const total = slices.reduce((a, s) => a + s.amount, 0);
  return (
    <div className="px-5 pb-5">
      <div className="relative h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<DonutTooltip />} />
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="category"
              innerRadius={62}
              outerRadius={86}
              paddingAngle={3}
              strokeWidth={0}
            >
              {slices.map((s) => (
                <Cell key={s.category} fill={CATEGORY_COLORS[s.category]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">
              30-day spend
            </p>
            <p className="text-lg font-bold tabular text-fg">{formatCompact(total)}</p>
          </div>
        </div>
      </div>
      <ul className="mt-2 space-y-2">
        {slices.map((s) => (
          <li key={s.category} className="flex items-center gap-2.5 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: CATEGORY_COLORS[s.category] }}
            />
            <span className="flex-1 font-medium text-muted">{s.category}</span>
            <span className="font-bold tabular text-fg">{formatPKR(s.amount)}</span>
            <span className="w-10 text-right tabular text-faint">
              {total > 0 ? Math.round((s.amount / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
