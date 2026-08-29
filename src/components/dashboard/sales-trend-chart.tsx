"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyStat } from "@/lib/kpis";
import { formatCompact, formatPKR, shortDateLabel } from "@/lib/format";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const sales = payload.find((p) => p.dataKey === "sales")?.value ?? 0;
  const expenses = payload.find((p) => p.dataKey === "expenses")?.value ?? 0;
  return (
    <div className="rounded-xl border border-line bg-panel2 px-3.5 py-2.5 shadow-card">
      <p className="text-[11px] font-semibold text-faint">
        {label ? shortDateLabel(label) : ""}
      </p>
      <p className="mt-1 text-xs font-bold text-brand-strong tabular">
        Sales {formatPKR(sales)}
      </p>
      <p className="text-xs font-bold text-gold tabular">
        Expenses {formatPKR(expenses)}
      </p>
      <p className="text-[11px] font-semibold text-muted tabular">
        Profit {formatPKR(sales - expenses)}
      </p>
    </div>
  );
}

export function SalesTrendChart({ daily }: { daily: DailyStat[] }) {
  return (
    <div className="h-[280px] w-full px-2 pb-2 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={daily} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6b73c" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#f6b73c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#22304e" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDateLabel}
            tick={{ fill: "#6b7894", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
          />
          <YAxis
            tickFormatter={(v: number) => formatCompact(v)}
            tick={{ fill: "#6b7894", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={58}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#2c3c60" }} />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#34d399"
            strokeWidth={2.5}
            fill="url(#salesFill)"
            activeDot={{ r: 4, fill: "#34d399", stroke: "#071018" }}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#f6b73c"
            strokeWidth={2}
            strokeDasharray="5 4"
            fill="url(#expenseFill)"
            activeDot={{ r: 3.5, fill: "#f6b73c", stroke: "#071018" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
