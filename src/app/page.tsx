"use client";

import { useMemo } from "react";
import { Banknote, HandCoins, TrendingDown, TrendingUp } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { buildIntelligence } from "@/lib/intelligence";
import { formatPKR } from "@/lib/format";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";
import { ExpenseBreakdown } from "@/components/dashboard/expense-breakdown";
import { BusinessHealth } from "@/components/dashboard/business-health";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { InsightsPreview } from "@/components/dashboard/insights-preview";
import { AiPanel } from "@/components/dashboard/ai-panel";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Panel, PanelHeader } from "@/components/ui/panel";

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-16 rounded-2xl bg-panel" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-panel" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-[360px] rounded-2xl bg-panel lg:col-span-2" />
        <div className="h-[360px] rounded-2xl bg-panel" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { mounted, data, kpis, settings } = useApp();
  const intel = useMemo(() => (data ? buildIntelligence(data) : null), [data]);

  if (!mounted || !data || !kpis || !intel) {
    return <DashboardSkeleton />;
  }

  const simple = settings.mode === "simple";

  return (
    <div className="space-y-5">
      {/* Greeting + quick actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">
            Assalam, {data.ownerName.split(" ")[0]} Sahab
          </h1>
          <p className="mt-1 text-sm text-muted">
            Here&apos;s how{" "}
            <span className="font-semibold text-fg">{data.businessName}</span> is
            doing today.
          </p>
        </div>
        <QuickActions />
      </div>

      {/* AI panel */}
      <AiPanel intel={intel} />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Today's Sales"
          value={formatPKR(kpis.today.sales)}
          sub={`${kpis.today.saleCount} sales recorded today`}
          icon={<TrendingUp className="h-5 w-5" />}
          iconClass="bg-up/12 text-up"
          delta={kpis.deltas.sales}
          simple={simple}
          highlight
        />
        <KpiCard
          label="Today's Expenses"
          value={formatPKR(kpis.today.expenses)}
          sub="Spending tracked across categories"
          icon={<TrendingDown className="h-5 w-5" />}
          iconClass="bg-down/12 text-down"
          delta={kpis.deltas.expenses}
          invertDelta
          simple={simple}
        />
        <KpiCard
          label="Today's Profit"
          value={formatPKR(kpis.today.profit)}
          sub="Sales minus today's expenses"
          icon={<Banknote className="h-5 w-5" />}
          iconClass="bg-gold/12 text-gold"
          simple={simple}
        />
        <KpiCard
          label="Udhaar Receivables"
          value={formatPKR(kpis.receivables.total)}
          sub={`${kpis.receivables.customerCount} customers owe you`}
          icon={<HandCoins className="h-5 w-5" />}
          iconClass="bg-panel3 text-gold-soft"
          simple={simple}
        />
      </div>

      {/* Trend + breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className={simple ? "lg:col-span-3" : "lg:col-span-2"}>
          <PanelHeader
            title="Sales Overview"
            sub="Last 30 days — sales vs expenses"
            action={
              <div className="flex items-center gap-4 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-full bg-brand-strong" /> Sales
                </span>
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-full bg-gold" /> Expenses
                </span>
              </div>
            }
          />
          <SalesTrendChart daily={kpis.daily} />
        </Panel>
        {!simple && (
          <Panel>
            <PanelHeader title="Expense Breakdown" sub="Where the money went" />
            <ExpenseBreakdown slices={kpis.expenseByCategory} />
          </Panel>
        )}
      </div>

      {/* Health + activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <BusinessHealth kpis={kpis} simple={simple} intel={intel} />
        <div className="lg:col-span-2">
          <RecentActivity data={data} simple={simple} />
        </div>
      </div>

      {/* AI insights */}
      <InsightsPreview insights={intel.insights} />
    </div>
  );
}
