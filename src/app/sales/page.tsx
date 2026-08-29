"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/ui/toast";
import { Badge, Button, EmptyState, Input, Select } from "@/components/ui/kit";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { SaleForm } from "@/components/forms/sale-form";
import { saleOutstanding } from "@/lib/business";
import { formatPKR, shortDateLabel, todayISO } from "@/lib/format";
import type { Sale } from "@/lib/types";

type DateRange = "all" | "today" | "7" | "30";
type SortKey = "newest" | "oldest" | "high" | "low";

function StatusBadge({ sale }: { sale: Sale }) {
  if (sale.paymentStatus === "paid") return <Badge tone="up">Paid</Badge>;
  if (sale.paymentStatus === "partial") return <Badge tone="warn">Partial</Badge>;
  return <Badge tone="down">Unpaid</Badge>;
}

export default function SalesPage() {
  const { data, actions, t, settings, mounted } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [range, setRange] = useState<DateRange>("30");
  const [status, setStatus] = useState("all");
  const [customer, setCustomer] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | undefined>();
  const [viewing, setViewing] = useState<Sale | undefined>();
  const [deleting, setDeleting] = useState<Sale | undefined>();

  const simple = settings.mode === "simple";
  const sales = useMemo(() => data?.sales ?? [], [data]);
  const customers = useMemo(() => data?.customers ?? [], [data]);
  const customerName = useMemo(() => {
    const m = new Map<string, string>();
    customers.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [customers]);

  const stats = useMemo(() => {
    const today = todayISO();
    let todaySales = 0;
    let total = 0;
    let paid = 0;
    let outstanding = 0;
    for (const s of sales) {
      total += s.total;
      paid += s.paidAmount;
      outstanding += saleOutstanding(s);
      if (s.date.slice(0, 10) === today) todaySales += s.total;
    }
    return { todaySales, total, transactions: sales.length, paid, outstanding };
  }, [sales]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = todayISO();
    let list = sales.filter((s) => {
      const day = s.date.slice(0, 10);
      if (range === "today" && day !== today) return false;
      if (range === "7" && day < addDays(today, -6)) return false;
      if (range === "30" && day < addDays(today, -29)) return false;
      if (status !== "all" && s.paymentStatus !== status) return false;
      if (customer !== "all" && s.customerId !== customer) return false;
      if (q) {
        const hay = [
          `inv-${s.invoiceNo}`,
          String(s.invoiceNo),
          customerName.get(s.customerId ?? "") ?? "",
          ...s.items.map((i) => i.productName),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = list.sort((a, b) => {
      if (sort === "newest") return b.date.localeCompare(a.date);
      if (sort === "oldest") return a.date.localeCompare(b.date);
      if (sort === "high") return b.total - a.total;
      return a.total - b.total;
    });
    return list;
  }, [sales, search, range, status, customer, sort, customerName]);

  if (!mounted || !data) return null;

  const openAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (s: Sale) => {
    setEditing(s);
    setFormOpen(true);
  };
  const confirmDelete = () => {
    if (!deleting) return;
    const r = actions.deleteSale(deleting.id);
    toast(r.ok ? "success" : "error", r.ok ? "Sale deleted. Stock restored." : r.error);
  };

  const statTiles = [
    { label: t("sales.today"), value: formatPKR(stats.todaySales), tone: "text-brand-strong" },
    { label: t("sales.total"), value: formatPKR(stats.total), tone: "text-fg" },
    { label: t("sales.transactions"), value: String(stats.transactions), tone: "text-fg" },
    { label: t("sales.paid"), value: formatPKR(stats.paid), tone: "text-up" },
    { label: t("sales.outstanding"), value: formatPKR(stats.outstanding), tone: "text-down" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">{t("sales.title")}</h1>
          <p className="mt-1 text-sm text-muted">Record and track every sale.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> {t("sales.add")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {statTiles.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-panel p-4 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">{s.label}</p>
            <p className={`mt-1 text-lg font-extrabold tabular ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters (professional) */}
      {!simple && (
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-panel p-3 sm:grid-cols-3 lg:grid-cols-5">
          <Input
            placeholder={`${t("common.search")}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="col-span-2 sm:col-span-3 lg:col-span-1"
          />
          <Select value={range} onChange={(e) => setRange(e.target.value as DateRange)}>
            <option value="all">{t("common.all")} time</option>
            <option value="today">{t("common.today")}</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </Select>
          <Select value={customer} onChange={(e) => setCustomer(e.target.value)}>
            <option value="all">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="high">Highest amount</option>
            <option value="low">Lowest amount</option>
          </Select>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel shadow-card">
          <EmptyState title="No sales found" sub={t("common.noResults")} action={<Button onClick={openAdd}>{t("sales.add")}</Button>} />
        </div>
      ) : simple ? (
        <div className="space-y-2">
          {filtered.slice(0, 20).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setViewing(s)}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-panel p-4 text-left shadow-card hover:border-line2"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-up/12 text-up">
                <TrendingUp className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-fg">
                  {customerName.get(s.customerId ?? "") ?? t("sales.walkIn")}
                </span>
                <span className="block text-[11px] text-faint">
                  {shortDateLabel(s.date.slice(0, 10))} · {s.items.length} item{s.items.length > 1 ? "s" : ""}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-extrabold tabular text-fg">{formatPKR(s.total)}</span>
                <StatusBadge sale={s} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                  <th className="px-4 py-3">{t("sales.invoice")}</th>
                  <th className="px-4 py-3">{t("common.date")}</th>
                  <th className="px-4 py-3">{t("common.customer")}</th>
                  <th className="px-4 py-3">{t("common.items")}</th>
                  <th className="px-4 py-3 text-right">{t("common.total")}</th>
                  <th className="px-4 py-3">{t("sales.payment")}</th>
                  <th className="px-4 py-3 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-panel2/50">
                    <td className="px-4 py-3 font-bold tabular text-fg">#{s.invoiceNo}</td>
                    <td className="px-4 py-3 text-muted">{shortDateLabel(s.date.slice(0, 10))}</td>
                    <td className="px-4 py-3 text-fg">{customerName.get(s.customerId ?? "") ?? t("sales.walkIn")}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-muted">
                      {s.items.map((i) => i.productName).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular text-fg">{formatPKR(s.total)}</td>
                    <td className="px-4 py-3"><StatusBadge sale={s} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconBtn label={t("common.view")} onClick={() => setViewing(s)}><Eye className="h-4 w-4" /></IconBtn>
                        <IconBtn label={t("common.edit")} onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></IconBtn>
                        <IconBtn danger label={t("common.delete")} onClick={() => setDeleting(s)}><Trash2 className="h-4 w-4" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t("sales.edit") : t("sales.add")} wide>
        <SaleForm initial={editing} onDone={() => setFormOpen(false)} />
      </Modal>

      {/* View */}
      <Modal open={!!viewing} onClose={() => setViewing(undefined)} title={viewing ? `${t("sales.view")} #${viewing.invoiceNo}` : ""}>
        {viewing && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-faint">{t("common.date")}</span><span className="text-fg">{shortDateLabel(viewing.date.slice(0, 10))}</span></div>
            <div className="flex justify-between"><span className="text-faint">{t("common.customer")}</span><span className="text-fg">{customerName.get(viewing.customerId ?? "") ?? t("sales.walkIn")}</span></div>
            <div className="space-y-1 rounded-xl border border-line bg-panel2 p-3">
              {viewing.items.map((i, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-muted">{i.productName} × {i.qty}</span>
                  <span className="tabular text-fg">{formatPKR(i.qty * i.unitPrice)}</span>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t border-line pt-2 text-sm font-bold">
                <span className="text-muted">{t("common.total")}</span>
                <span className="tabular text-brand-strong">{formatPKR(viewing.total)}</span>
              </div>
            </div>
            <div className="flex justify-between"><span className="text-faint">{t("sales.payment")}</span><StatusBadge sale={viewing} /></div>
            <div className="flex justify-between"><span className="text-faint">{t("sales.paid")}</span><span className="tabular text-up">{formatPKR(viewing.paidAmount)}</span></div>
            <div className="flex justify-between"><span className="text-faint">{t("sales.outstanding")}</span><span className="tabular text-down">{formatPKR(saleOutstanding(viewing))}</span></div>
            {viewing.notes && <p className="rounded-xl bg-panel2 p-3 text-xs text-muted">{viewing.notes}</p>}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        title={t("common.delete")}
        body={`Delete sale #${deleting?.invoiceNo ?? ""}? ${t("common.confirmDelete")}`}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors ${
        danger ? "hover:bg-down/15 hover:text-down" : "hover:bg-panel3 hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
