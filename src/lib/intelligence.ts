import type { BusinessData, Product } from "./types";
import { computeKpis, type Kpis } from "./kpis";
import { customerOutstanding, isLowStock, isService } from "./business";
import { daysAgoISO } from "./format";

export interface ProductPerf {
  id: string;
  name: string;
  revenue7: number;
  qty7: number;
  revenue30: number;
  qty30: number;
}

export interface Recommendation {
  priority: number; // lower = more urgent
  problem: string;
  why: string;
  action: string;
}

export interface SmartInsight {
  id: string;
  type: "opportunity" | "warning" | "positive" | "expense";
  title: string;
  body: string;
}

export interface Forecast {
  next7Sales: number;
  next7Expenses: number;
  next7Profit: number;
  trend: "up" | "down" | "flat";
  confidence: "high" | "medium" | "low";
}

export interface Intelligence {
  kpis: Kpis;
  businessName: string;
  ownerName: string;
  sales: {
    total: number;
    today: number;
    growthPct: number;
    avgTransaction: number;
    transactions: number;
    best: ProductPerf[];
    worst: ProductPerf[];
    fast: ProductPerf[];
  };
  profit: {
    revenue: number;
    cogs: number;
    expenses: number;
    net: number;
    marginPct: number;
  };
  expenses: { total: number; top: { category: string; amount: number }[]; growthPct: number };
  customers: {
    total: number;
    best: { name: string; total: number }[];
    debtors: { name: string; outstanding: number }[];
  };
  inventory: { low: Product[]; out: Product[]; slow: ProductPerf[] };
  udhaar: { total: number; ratioPct: number; top: { name: string; outstanding: number }[] };
  health: {
    score: number;
    status: string;
    helping: string[];
    attention: string[];
    recommendation: Recommendation | null;
  };
  insights: SmartInsight[];
  recommendations: Recommendation[];
  forecast: Forecast;
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

export function buildIntelligence(data: BusinessData): Intelligence {
  const kpis = computeKpis(data);
  const weekStart = daysAgoISO(6);
  const monthStart = daysAgoISO(29);

  // ---- Product performance ----
  const perf = new Map<string, ProductPerf>();
  for (const p of data.products) {
    perf.set(p.id, { id: p.id, name: p.name, revenue7: 0, qty7: 0, revenue30: 0, qty30: 0 });
  }
  for (const s of data.sales) {
    const day = s.date.slice(0, 10);
    if (day < monthStart) continue;
    for (const item of s.items) {
      const rec = perf.get(item.productId);
      if (!rec) continue;
      rec.revenue30 += item.unitPrice * item.qty;
      rec.qty30 += item.qty;
      if (day >= weekStart) {
        rec.revenue7 += item.unitPrice * item.qty;
        rec.qty7 += item.qty;
      }
    }
  }
  const allPerf = [...perf.values()];
  const sold = allPerf.filter((p) => p.qty30 > 0);
  const best = [...sold].sort((a, b) => b.revenue7 - a.revenue7).slice(0, 3);
  const fast = [...sold].sort((a, b) => b.qty7 - a.qty7).slice(0, 3);
  const worst = [...sold].sort((a, b) => a.revenue30 - b.revenue30).slice(0, 3);

  // ---- Expenses ----
  const expRecent = data.expenses.filter((e) => e.date.slice(0, 10) >= weekStart);
  const expPrev = data.expenses.filter((e) => {
    const d = e.date.slice(0, 10);
    return d >= daysAgoISO(13) && d < weekStart;
  });
  const expRecentTotal = expRecent.reduce((a, e) => a + e.amount, 0);
  const expPrevTotal = expPrev.reduce((a, e) => a + e.amount, 0);
  const expGrowth = expPrevTotal > 0 ? ((expRecentTotal - expPrevTotal) / expPrevTotal) * 100 : 0;

  // ---- Customers ----
  const custPerf = data.customers
    .map((c) => {
      const own = data.sales.filter((s) => s.customerId === c.id);
      return {
        name: c.name,
        total: own.reduce((a, s) => a + s.total, 0),
        outstanding: customerOutstanding(c, data.sales),
      };
    });
  const bestCustomers = [...custPerf].sort((a, b) => b.total - a.total).slice(0, 3);
  const debtors = custPerf.filter((c) => c.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding);

  // ---- Inventory ----
  const physical = data.products.filter((p) => !isService(p));
  const low = physical.filter((p) => p.stock > 0 && isLowStock(p));
  const out = physical.filter((p) => p.stock <= 0);
  const slow = allPerf
    .filter((p) => physical.some((x) => x.id === p.id))
    .sort((a, b) => a.qty30 - b.qty30)
    .slice(0, 3);

  // ---- Udhaar ----
  const udhaarTotal = debtors.reduce((a, d) => a + d.outstanding, 0);
  const udhaarRatio = kpis.last30.revenue > 0 ? (udhaarTotal / kpis.last30.revenue) * 100 : 0;

  // ---- Profit ----
  const cogs = data.sales.reduce((a, s) => a + s.cost, 0);
  const profit = {
    revenue: kpis.last30.revenue,
    cogs,
    expenses: kpis.last30.expenses,
    net: kpis.last30.profit,
    marginPct: kpis.last30.marginPct,
  };

  // ---- Week-over-week sales growth ----
  const last7 = kpis.daily.slice(23);
  const prev7 = kpis.daily.slice(16, 23);
  const salesRecent = last7.reduce((a, d) => a + d.sales, 0);
  const salesPrev = prev7.reduce((a, d) => a + d.sales, 0);
  const salesGrowth = salesPrev > 0 ? ((salesRecent - salesPrev) / salesPrev) * 100 : 0;

  // ---- Forecast (simple moving averages, clearly estimates) ----
  const salesAvg = avg(last7.map((d) => d.sales));
  const expAvg = avg(last7.map((d) => d.expenses));
  const next7Sales = salesAvg * 7;
  const next7Expenses = expAvg * 7;
  const next7Profit = next7Sales * (kpis.last30.marginPct / 100);
  const cv = salesAvg > 0 ? Math.sqrt(avg(last7.map((d) => (d.sales - salesAvg) ** 2))) / salesAvg : 1;
  const confidence = cv < 0.25 ? "high" : cv < 0.45 ? "medium" : "low";
  const trend: Forecast["trend"] = kpis.health.factors.find((f) => f.key === "trend")
    ? kpis.health.factors.find((f) => f.key === "trend")!.status === "good"
      ? "up"
      : kpis.health.factors.find((f) => f.key === "trend")!.status === "critical"
        ? "down"
        : "flat"
    : "flat";
  const forecast: Forecast = { next7Sales, next7Expenses, next7Profit, trend, confidence };

  // ---- Recommendations (priority-based) ----
  const recommendations: Recommendation[] = [];
  if (udhaarRatio > 12) {
    recommendations.push({
      priority: 1,
      problem: "High outstanding udhaar",
      why: `${Math.round(udhaarRatio)}% of monthly revenue is tied up in customer credit.`,
      action: "Follow up on outstanding customer payments to free up cash flow.",
    });
  }
  const lowBestSeller = low.find((p) => best.some((b) => b.id === p.id));
  if (lowBestSeller) {
    recommendations.push({
      priority: 1,
      problem: `Best-seller running low: ${lowBestSeller.name}`,
      why: "A top-selling product is near out-of-stock, risking lost sales.",
      action: `Restock ${lowBestSeller.name} as soon as possible.`,
    });
  } else if (out.length) {
    recommendations.push({
      priority: 1,
      problem: `Out of stock: ${out[0].name}`,
      why: "You cannot sell what you do not have.",
      action: `Restock ${out[0].name}.`,
    });
  }
  if (expGrowth > 10 && expGrowth > salesGrowth) {
    recommendations.push({
      priority: 2,
      problem: "Expenses rising faster than sales",
      why: `Expenses grew ${expGrowth.toFixed(0)}% week-over-week.`,
      action: "Review your fastest-growing expense category.",
    });
  }
  if (kpis.last30.marginPct < 10) {
    recommendations.push({
      priority: 2,
      problem: "Thin profit margin",
      why: `Net margin is ${kpis.last30.marginPct.toFixed(1)}%.`,
      action: "Review product pricing and high-cost expenses.",
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      priority: 3,
      problem: "No urgent issues",
      why: "Health, margins and stock look stable.",
      action: "Keep momentum — focus on your best-selling products.",
    });
  }
  recommendations.sort((a, b) => a.priority - b.priority);

  // ---- Health explanation ----
  const helping: string[] = [];
  const attention: string[] = [];
  for (const f of kpis.health.factors) {
    if (f.status === "good") helping.push(f.detail);
    else attention.push(f.detail);
  }

  // ---- Smart insights ----
  const insights: SmartInsight[] = [];
  if (kpis.health.factors.find((f) => f.key === "trend")?.status === "good") {
    insights.push({ id: "i-trend", type: "positive", title: "Sales are climbing", body: `Revenue is up week-over-week. Keep your best sellers stocked.` });
  }
  if (lowBestSeller) {
    insights.push({ id: "i-low", type: "opportunity", title: "Restock a best-seller", body: `${lowBestSeller.name} sells fast and is running low. Restocking may prevent lost sales.` });
  }
  if (udhaarRatio > 12) {
    insights.push({ id: "i-udhaar", type: "warning", title: "Udhaar is tying up cash", body: `${Math.round(udhaarRatio)}% of monthly revenue is outstanding. Recovering some would improve cash flow.` });
  }
  if (expGrowth > 15) {
    const topCat = kpis.expenseByCategory[0];
    insights.push({ id: "i-exp", type: "expense", title: "Expenses rising", body: `Expenses grew ${expGrowth.toFixed(0)}% this week${topCat ? `, led by ${topCat.category}` : ""}.` });
  }
  if (best[0]) {
    insights.push({ id: "i-best", type: "positive", title: "Top performer", body: `${best[0].name} brought in the most revenue this week.` });
  }

  return {
    kpis,
    businessName: data.businessName,
    ownerName: data.ownerName,
    sales: {
      total: kpis.last30.revenue,
      today: kpis.today.sales,
      growthPct: salesGrowth,
      avgTransaction: kpis.last30.saleCount ? kpis.last30.revenue / kpis.last30.saleCount : 0,
      transactions: kpis.last30.saleCount,
      best,
      worst,
      fast,
    },
    profit,
    expenses: { total: kpis.last30.expenses, top: kpis.expenseByCategory, growthPct: expGrowth },
    customers: { total: data.customers.length, best: bestCustomers, debtors },
    inventory: { low, out, slow },
    udhaar: { total: udhaarTotal, ratioPct: udhaarRatio, top: debtors.slice(0, 3) },
    health: {
      score: kpis.health.score,
      status: kpis.health.status,
      helping,
      attention,
      recommendation: recommendations[0] ?? null,
    },
    insights,
    recommendations,
    forecast,
  };
}
