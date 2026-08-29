"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/ui/toast";
import { Badge, Button, EmptyState, Input } from "@/components/ui/kit";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { CustomerForm } from "@/components/forms/customer-form";
import { customerStats } from "@/lib/business";
import { formatPKR, shortDateLabel } from "@/lib/format";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const { data, actions, t, settings, mounted } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>();
  const [viewing, setViewing] = useState<Customer | undefined>();
  const [deleting, setDeleting] = useState<Customer | undefined>();

  const simple = settings.mode === "simple";
  const customers = useMemo(() => data?.customers ?? [], [data]);
  const sales = useMemo(() => data?.sales ?? [], [data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers
      .filter((c) => !q || `${c.name} ${c.phone}`.toLowerCase().includes(q))
      .map((c) => ({ customer: c, stats: customerStats(c, sales) }))
      .sort((a, b) => b.stats.totalPurchases - a.stats.totalPurchases);
  }, [customers, sales, search]);

  if (!mounted || !data) return null;

  const openAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const confirmDelete = () => {
    if (!deleting) return;
    const r = actions.deleteCustomer(deleting.id);
    toast(r.ok ? "success" : "error", r.ok ? "Customer deleted. Their sales were kept." : r.error);
  };

  const viewingStats = viewing ? customerStats(viewing, sales) : null;
  const viewingSales = viewing ? sales.filter((s) => s.customerId === viewing.id).sort((a, b) => b.date.localeCompare(a.date)) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">{t("customers.title")}</h1>
          <p className="mt-1 text-sm text-muted">Know every customer and every rupee owed.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> {t("customers.add")}
        </Button>
      </div>

      <Input placeholder={`${t("common.search")}…`} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel shadow-card">
          <EmptyState title="No customers found" sub={t("common.noResults")} action={<Button onClick={openAdd}>{t("customers.add")}</Button>} />
        </div>
      ) : simple ? (
        <div className="space-y-2">
          {rows.map(({ customer: c, stats }) => (
            <button key={c.id} type="button" onClick={() => setViewing(c)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-panel p-4 text-left shadow-card hover:border-line2">
              <Avatar name={c.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-fg">{c.name}</span>
                <span className="block text-[11px] text-faint">{stats.transactions} purchases</span>
              </span>
              <span className="text-right">
                {stats.outstanding > 0 ? <Badge tone="down">{formatPKR(stats.outstanding)}</Badge> : <Badge tone="up">Clear</Badge>}
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
                  <th className="px-4 py-3">{t("common.name")}</th>
                  <th className="px-4 py-3">{t("common.phone")}</th>
                  <th className="px-4 py-3 text-right">{t("customers.purchases")}</th>
                  <th className="px-4 py-3 text-right">Txns</th>
                  <th className="px-4 py-3 text-right">{t("customers.balance")}</th>
                  <th className="px-4 py-3">{t("customers.lastVisit")}</th>
                  <th className="px-4 py-3 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {rows.map(({ customer: c, stats }) => (
                  <tr key={c.id} className="hover:bg-panel2/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} />
                        <span className="font-semibold text-fg">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{c.phone}</td>
                    <td className="px-4 py-3 text-right font-bold tabular text-fg">{formatPKR(stats.totalPurchases)}</td>
                    <td className="px-4 py-3 text-right tabular text-muted">{stats.transactions}</td>
                    <td className="px-4 py-3 text-right">
                      {stats.outstanding > 0 ? <Badge tone="down">{formatPKR(stats.outstanding)}</Badge> : <Badge tone="up">Clear</Badge>}
                    </td>
                    <td className="px-4 py-3 text-muted">{stats.lastPurchase ? shortDateLabel(stats.lastPurchase) : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Btn label={t("common.view")} onClick={() => setViewing(c)}><Eye className="h-4 w-4" /></Btn>
                        <Btn label={t("common.edit")} onClick={() => { setEditing(c); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Btn>
                        <Btn danger label={t("common.delete")} onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></Btn>
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
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t("customers.edit") : t("customers.add")}>
        <CustomerForm initial={editing} onDone={() => setFormOpen(false)} />
      </Modal>

      {/* Detail */}
      <Modal open={!!viewing} onClose={() => setViewing(undefined)} title={viewing?.name ?? ""} sub={t("customers.details")} wide>
        {viewing && viewingStats && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Phone className="h-4 w-4" /> {viewing.phone}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DetailStat label={t("customers.purchases")} value={formatPKR(viewingStats.totalPurchases)} tone="text-fg" />
              <DetailStat label="Transactions" value={String(viewingStats.transactions)} tone="text-fg" />
              <DetailStat label="Opening" value={formatPKR(viewing.openingBalance)} tone="text-muted" />
              <DetailStat label={t("customers.balance")} value={formatPKR(viewingStats.outstanding)} tone={viewingStats.outstanding > 0 ? "text-down" : "text-up"} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Purchase history</p>
              {viewingSales.length === 0 ? (
                <p className="rounded-xl bg-panel2 p-3 text-xs text-faint">No purchases yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {viewingSales.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-xl border border-line bg-panel2 px-3 py-2 text-xs">
                      <span className="text-muted">#{s.invoiceNo} · {shortDateLabel(s.date.slice(0, 10))}</span>
                      <span className="font-bold tabular text-fg">{formatPKR(s.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        title={t("common.delete")}
        body={`Delete ${deleting?.name ?? ""}? Their past sales will be kept but unlinked. ${t("common.confirmDelete")}`}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-panel3 to-panel2 text-xs font-bold text-gold">
      {initials}
    </span>
  );
}

function DetailStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel2 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">{label}</p>
      <p className={`mt-0.5 text-sm font-extrabold tabular ${tone}`}>{value}</p>
    </div>
  );
}

function Btn({ children, onClick, label, danger = false }: { children: React.ReactNode; onClick: () => void; label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors ${danger ? "hover:bg-down/15 hover:text-down" : "hover:bg-panel3 hover:text-fg"}`}
    >
      {children}
    </button>
  );
}
