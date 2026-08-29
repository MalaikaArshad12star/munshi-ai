import { ArrowDownLeft, ArrowUpRight, HandCoins } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BusinessData } from "@/lib/types";
import { formatPKR, relativeTime } from "@/lib/format";
import { saleOutstanding } from "@/lib/business";
import { Panel, PanelHeader } from "@/components/ui/panel";

interface ActivityRow {
  id: string;
  kind: "sale" | "expense";
  title: string;
  sub: string;
  amount: number;
  date: string;
  udhaar: boolean;
}

export function buildActivity(data: BusinessData): ActivityRow[] {
  const rows: ActivityRow[] = [];
  for (const s of data.sales) {
    const first = s.items[0];
    const extra = s.items.length - 1;
    rows.push({
      id: s.id,
      kind: "sale",
      title: first ? first.productName : "Sale",
      sub:
        extra > 0
          ? `${first.qty}× + ${extra} more item${extra > 1 ? "s" : ""}`
          : `${first.qty}× sold`,
      amount: s.total,
      date: s.date,
      udhaar: saleOutstanding(s) > 0,
    });
  }
  for (const e of data.expenses) {
    rows.push({
      id: e.id,
      kind: "expense",
      title: e.category,
      sub: e.note,
      amount: e.amount,
      date: e.date,
      udhaar: false,
    });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export function RecentActivity({
  data,
  simple = false,
}: {
  data: BusinessData;
  simple?: boolean;
}) {
  const rows = buildActivity(data).slice(0, simple ? 5 : 8);
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Recent Activity"
        sub="Latest sales & expenses across the counter"
      />
      <ul className="flex-1 divide-y divide-line/60 px-2 py-1">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3 px-3 py-3">
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                row.kind === "sale"
                  ? "bg-up/12 text-up"
                  : "bg-down/12 text-down",
              )}
            >
              {row.kind === "sale" ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownLeft className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[13px] font-semibold text-fg">
                  {row.title}
                </p>
                {row.udhaar && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold">
                    <HandCoins className="h-2.5 w-2.5" /> Udhaar
                  </span>
                )}
              </div>
              <p className="truncate text-[11px] text-faint">{row.sub}</p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  "text-[13px] font-bold tabular",
                  row.kind === "sale" ? "text-up" : "text-down",
                )}
              >
                {row.kind === "sale" ? "+" : "−"}
                {formatPKR(row.amount)}
              </p>
              <p className="text-[10px] tabular text-faint">
                {relativeTime(row.date)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
