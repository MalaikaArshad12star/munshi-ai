"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/ui/toast";
import { Button, EmptyState, Input, Select } from "@/components/ui/kit";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { ExpenseForm } from "@/components/forms/expense-form";
import { EXPENSE_CATEGORIES } from "@/lib/business";
import { formatPKR, shortDateLabel, todayISO } from "@/lib/format";
import type { Expense } from "@/lib/types";

export default function ExpensesPage() {
  const { data, actions, t, settings, mounted } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [range, setRange] = useState<"all" | "today" | "30">("30");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | undefined>();
  const [deleting, setDeleting] = useState<Expense | undefined>();

  const simple = settings.mode === "simple";
  const expenses = useMemo(() => data?.expenses ?? [], [data]);

  const stats = useMemo(() => {
    const today = todayISO();
    const month = today.slice(0, 7);
    let total = 0;
    let todayTotal = 0;
    let monthTotal = 0;
    const byCat = new Map<string, number>();
    for (const e of expenses) {
      total += e.amount;
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
      const day = e.date.slice(0, 10);
      if (day === today) todayTotal += e.amount;
      if (day.slice(0, 7) === month) monthTotal += e.amount;
    }
    return { total, todayTotal, monthTotal, categories: byCat.size };
  }, [expenses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = todayISO();
    return expenses
      .filter((e) => {
        const day = e.date.slice(0, 10);
        if (range === "today" && day !== today) return false;
        if (range === "30" && day < addDays(today, -29)) return false;
        if (category !== "all" && e.category !== category) return false;
        if (q && !`${e.note} ${e.category}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, search, category, range]);

  if (!mounted || !data) return null;

  const openAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const confirmDelete = () => {
    if (!deleting) return;
    const r = actions.deleteExpense(deleting.id);
    toast(r.ok ? "success" : "error", r.ok ? "Expense deleted." : r.error);
  };

  const tiles = [
    { label: t("expenses.today"), value: formatPKR(stats.todayTotal), tone: "text-down" },
    { label: t("expenses.month"), value: formatPKR(stats.monthTotal), tone: "text-fg" },
    { label: t("expenses.total"), value: formatPKR(stats.total), tone: "text-fg" },
    { label: t("common.category"), value: String(stats.categories), tone: "text-gold" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">{t("expenses.title")}</h1>
          <p className="mt-1 text-sm text-muted">Track every rupee going out.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> {t("expenses.add")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-panel p-4 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">{s.label}</p>
            <p className={`mt-1 text-lg font-extrabold tabular ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-panel p-3 sm:grid-cols-3">
        <Input placeholder={`${t("common.search")}…`} value={search} onChange={(e) => setSearch(e.target.value)} className="col-span-2 sm:col-span-1" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">{t("common.all")} {t("common.category").toLowerCase()}s</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select value={range} onChange={(e) => setRange(e.target.value as "all" | "today" | "30")}>
          <option value="all">{t("common.all")} time</option>
          <option value="today">{t("common.today")}</option>
          <option value="30">Last 30 days</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel shadow-card">
          <EmptyState title="No expenses found" sub={t("common.noResults")} action={<Button onClick={openAdd}>{t("expenses.add")}</Button>} />
        </div>
      ) : simple ? (
        <div className="space-y-2">
          {filtered.slice(0, 20).map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-4 shadow-card">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-down/12 text-down">
                <Wallet className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-fg">{e.category}</span>
                <span className="block truncate text-[11px] text-faint">{e.note}</span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-extrabold tabular text-down">−{formatPKR(e.amount)}</span>
                <span className="block text-[10px] text-faint">{shortDateLabel(e.date.slice(0, 10))}</span>
              </span>
              <RowActions onEdit={() => { setEditing(e); setFormOpen(true); }} onDelete={() => setDeleting(e)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                  <th className="px-4 py-3">{t("common.date")}</th>
                  <th className="px-4 py-3">{t("common.category")}</th>
                  <th className="px-4 py-3">{t("expenses.description")}</th>
                  <th className="px-4 py-3">{t("sales.payment")}</th>
                  <th className="px-4 py-3 text-right">{t("common.amount")}</th>
                  <th className="px-4 py-3 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-panel2/50">
                    <td className="px-4 py-3 text-muted">{shortDateLabel(e.date.slice(0, 10))}</td>
                    <td className="px-4 py-3 font-semibold text-fg">{e.category}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-muted">{e.note}</td>
                    <td className="px-4 py-3 capitalize text-muted">{e.paymentMethod}</td>
                    <td className="px-4 py-3 text-right font-bold tabular text-down">−{formatPKR(e.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <ActionBtn label={t("common.edit")} onClick={() => { setEditing(e); setFormOpen(true); }}><Pencil className="h-4 w-4" /></ActionBtn>
                        <ActionBtn danger label={t("common.delete")} onClick={() => setDeleting(e)}><Trash2 className="h-4 w-4" /></ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t("expenses.edit") : t("expenses.add")}>
        <ExpenseForm initial={editing} onDone={() => setFormOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        title={t("common.delete")}
        body={`Delete this ${deleting?.category ?? ""} expense of ${formatPKR(deleting?.amount ?? 0)}? ${t("common.confirmDelete")}`}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <ActionBtn label="Edit" onClick={onEdit}><Pencil className="h-4 w-4" /></ActionBtn>
      <ActionBtn danger label="Delete" onClick={onDelete}><Trash2 className="h-4 w-4" /></ActionBtn>
    </div>
  );
}

function ActionBtn({ children, onClick, label, danger = false }: { children: React.ReactNode; onClick: () => void; label: string; danger?: boolean }) {
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

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
