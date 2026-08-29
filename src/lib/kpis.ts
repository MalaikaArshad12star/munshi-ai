import type { BusinessData, ExpenseCategory } from "./types";
import { daysAgoISO, todayISO } from "./format";
import { customerOutstanding } from "./business";

export interface DailyStat {
  date: string;
  sales: number;
  expenses: number;
  profit: number;
}

export interface ExpenseSlice {
  category: ExpenseCategory;
  amount: number;
}

export type FactorStatus = "good" | "warning" | "critical";

export interface HealthFactor {
  key: "margin" | "trend" | "udhaar" | "inventory";
  label: string;
  status: FactorStatus;
  detail: string;
  points: number; // 0-25
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  tone: "positive" | "warning" | "neutral";
}

export interface TopProduct {
  name: string;
  revenue: number;
  qty: number;
}

export interface Kpis {
  today: { sales: number; expenses: number; profit: number; saleCount: number };
  baseline: { sales: number; expenses: number }; // prev 7-day daily average
  deltas: { sales: number | null; expenses: number | null }; // % vs baseline
  last30: {
    revenue: number;
    expenses: number;
    profit: number;
    marginPct: number;
    saleCount: number;
  };
  receivables: { total: number; customerCount: number };
  daily: DailyStat[];
  expenseByCategory: ExpenseSlice[];
  topProduct: TopProduct | null;
  lowStockCount: number;
  health: {
    score: number;
    status: "excellent" | "good" | "fair" | "poor";
    factors: HealthFactor[];
  };
  insights: Insight[];
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function computeKpis(data: BusinessData): Kpis {
  const today = todayISO();

  // --- Daily series for the last 30 days ---
  const daily: DailyStat[] = [];
  const salesByDay = new Map<string, { total: number; gross: number; count: number }>();
  for (const s of data.sales) {
    const day = s.date.slice(0, 10);
    const cur = salesByDay.get(day) ?? { total: 0, gross: 0, count: 0 };
    cur.total += s.total;
    cur.gross += s.total - s.cost;
    cur.count += 1;
    salesByDay.set(day, cur);
  }
  const expensesByDay = new Map<string, number>();
  for (const e of data.expenses) {
    const day = e.date.slice(0, 10);
    expensesByDay.set(day, (expensesByDay.get(day) ?? 0) + e.amount);
  }
  for (let back = 29; back >= 0; back--) {
    const iso = daysAgoISO(back);
    const sales = salesByDay.get(iso)?.total ?? 0;
    const gross = salesByDay.get(iso)?.gross ?? 0;
    const expenses = expensesByDay.get(iso) ?? 0;
    daily.push({ date: iso, sales, expenses, profit: gross - expenses });
  }

  const todayStat = daily[daily.length - 1];
  const todaySaleCount = salesByDay.get(today)?.count ?? 0;

  // --- Baseline: average of the previous 7 days (excluding today) ---
  const prev7 = daily.slice(22, 29); // days -8 .. -2 relative to today
  const baseSales = prev7.reduce((a, d) => a + d.sales, 0) / Math.max(prev7.length, 1);
  const baseExpenses = prev7.reduce((a, d) => a + d.expenses, 0) / Math.max(prev7.length, 1);

  const deltas = {
    sales: baseSales > 0 ? ((todayStat.sales - baseSales) / baseSales) * 100 : null,
    expenses: baseExpenses > 0 ? ((todayStat.expenses - baseExpenses) / baseExpenses) * 100 : null,
  };

  // --- 30-day totals ---
  const revenue = daily.reduce((a, d) => a + d.sales, 0);
  const totalExpenses = daily.reduce((a, d) => a + d.expenses, 0);
  const grossProfit = data.sales.reduce((a, s) => a + (s.total - s.cost), 0);
  const netProfit = grossProfit - totalExpenses;
  const last30 = {
    revenue,
    expenses: totalExpenses,
    profit: netProfit,
    marginPct: revenue > 0 ? (netProfit / revenue) * 100 : 0,
    saleCount: data.sales.length,
  };

  // --- Receivables (udhaar) computed from sales + opening balances ---
  const debtorList = data.customers
    .map((customer) => ({ customer, outstanding: customerOutstanding(customer, data.sales) }))
    .filter((d) => d.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);
  const receivables = {
    total: debtorList.reduce((a, d) => a + d.outstanding, 0),
    customerCount: debtorList.length,
  };

  // --- Expense breakdown ---
  const byCategory = new Map<ExpenseCategory, number>();
  for (const e of data.expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  }
  const expenseByCategory: ExpenseSlice[] = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // --- Top product (last 7 days) ---
  const weekStart = daysAgoISO(6);
  const productAgg = new Map<string, { name: string; revenue: number; qty: number }>();
  for (const s of data.sales) {
    if (s.date.slice(0, 10) < weekStart) continue;
    for (const item of s.items) {
      const cur = productAgg.get(item.productId) ?? {
        name: item.productName,
        revenue: 0,
        qty: 0,
      };
      cur.revenue += item.unitPrice * item.qty;
      cur.qty += item.qty;
      productAgg.set(item.productId, cur);
    }
  }
  const topArr = [...productAgg.values()].sort((a, b) => b.revenue - a.revenue);
  const topProduct = topArr[0] ?? null;

  // --- Low stock ---
  const lowStockCount = data.products.filter((p) => p.stock <= p.lowStockThreshold).length;

  // --- Health score (4 factors x 25 points) ---
  const marginPoints = clamp((last30.marginPct / 25) * 25, 0, 25);
  const marginStatus: FactorStatus =
    last30.marginPct >= 18 ? "good" : last30.marginPct >= 10 ? "warning" : "critical";

  const recent7 = daily.slice(23).reduce((a, d) => a + d.sales, 0);
  const earlier7 = daily.slice(16, 23).reduce((a, d) => a + d.sales, 0);
  const growthPct = earlier7 > 0 ? ((recent7 - earlier7) / earlier7) * 100 : 0;
  const trendPoints = clamp(((growthPct + 15) / 30) * 25, 0, 25);
  const trendStatus: FactorStatus =
    growthPct >= 5 ? "good" : growthPct >= -5 ? "warning" : "critical";

  const udhaarRatio = revenue > 0 ? receivables.total / revenue : 0;
  const udhaarPoints = clamp((1 - udhaarRatio / 0.35) * 25, 0, 25);
  const udhaarStatus: FactorStatus =
    udhaarRatio <= 0.08 ? "good" : udhaarRatio <= 0.2 ? "warning" : "critical";

  const inventoryPoints = clamp((1 - lowStockCount / 6) * 25, 0, 25);
  const inventoryStatus: FactorStatus =
    lowStockCount === 0 ? "good" : lowStockCount <= 2 ? "warning" : "critical";

  const score = Math.round(marginPoints + trendPoints + udhaarPoints + inventoryPoints);
  const status =
    score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "fair" : "poor";

  const factors: HealthFactor[] = [
    {
      key: "margin",
      label: "Profit margin",
      status: marginStatus,
      detail: `${last30.marginPct.toFixed(1)}% net margin this month`,
      points: marginPoints,
    },
    {
      key: "trend",
      label: "Sales trend",
      status: trendStatus,
      detail: `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(1)}% week over week`,
      points: trendPoints,
    },
    {
      key: "udhaar",
      label: "Udhaar exposure",
      status: udhaarStatus,
      detail: `${(udhaarRatio * 100).toFixed(1)}% of monthly revenue`,
      points: udhaarPoints,
    },
    {
      key: "inventory",
      label: "Inventory health",
      status: inventoryStatus,
      detail: `${lowStockCount} item${lowStockCount === 1 ? "" : "s"} running low`,
      points: inventoryPoints,
    },
  ];

  // --- Rule-based AI-style insights (LLM wiring comes Day 3) ---
  const insights: Insight[] = [];
  if (topProduct) {
    insights.push({
      id: "ins-top",
      title: "Best seller this week",
      body: `${topProduct.name} brought in Rs ${topProduct.revenue.toLocaleString("en-PK")} across ${topProduct.qty} units in the last 7 days. Keep it stocked.`,
      tone: "positive",
    });
  }
  const topDebtor = debtorList[0];
  if (topDebtor && receivables.total > 0) {
    const share = Math.round((topDebtor.outstanding / receivables.total) * 100);
    insights.push({
      id: "ins-udhaar",
      title: "Udhaar reminder",
      body: `${topDebtor.customer.name} owes Rs ${topDebtor.outstanding.toLocaleString("en-PK")} — ${share}% of all receivables. A friendly reminder could free up cash.`,
      tone: "warning",
    });
  }
  insights.push({
    id: "ins-trend",
    title: growthPct >= 0 ? "Sales are climbing" : "Sales dipped this week",
    body:
      growthPct >= 0
        ? `Revenue is up ${growthPct.toFixed(1)}% vs last week. The weekend rush is real — consider extra stock for Saturday & Sunday.`
        : `Revenue is down ${Math.abs(growthPct).toFixed(1)}% vs last week. A small promotion on your best sellers could lift the week.`,
    tone: growthPct >= 0 ? "positive" : "neutral",
  });

  return {
    today: {
      sales: todayStat.sales,
      expenses: todayStat.expenses,
      profit: todayStat.profit,
      saleCount: todaySaleCount,
    },
    baseline: { sales: baseSales, expenses: baseExpenses },
    deltas,
    last30,
    receivables,
    daily,
    expenseByCategory,
    topProduct,
    lowStockCount,
    health: { score, status, factors },
    insights,
  };
}
