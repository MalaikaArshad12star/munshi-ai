"use client";

import { useMemo, useState } from "react";
import { Package, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/ui/toast";
import { Badge, Button, EmptyState, Input, Select } from "@/components/ui/kit";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { ProductForm } from "@/components/forms/product-form";
import { isLowStock, isService } from "@/lib/business";
import { formatPKR } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function InventoryPage() {
  const { data, actions, t, settings, mounted } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();
  const [deleting, setDeleting] = useState<Product | undefined>();

  const simple = settings.mode === "simple";
  const products = useMemo(() => data?.products ?? [], [data]);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (lowOnly && !isLowStock(p)) return false;
      if (q && !`${p.name} ${p.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, category, lowOnly]);

  const lowCount = useMemo(() => products.filter(isLowStock).length, [products]);

  if (!mounted || !data) return null;

  const openAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const confirmDelete = () => {
    if (!deleting) return;
    const r = actions.deleteProduct(deleting.id);
    toast(r.ok ? "success" : "error", r.ok ? "Item deleted." : r.error);
  };

  const statusBadge = (p: Product) => {
    if (isService(p)) return <Badge tone="gold"><Sparkles className="h-3 w-3" /> {t("inventory.service")}</Badge>;
    if (isLowStock(p)) return <Badge tone="down">{t("inventory.lowStock")}</Badge>;
    return <Badge tone="up">{t("inventory.inStock")}</Badge>;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">{t("inventory.title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {products.length} items · {lowCount} low stock
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> {t("inventory.add")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-panel p-3 sm:grid-cols-4">
        <Input placeholder={`${t("common.search")}…`} value={search} onChange={(e) => setSearch(e.target.value)} className="col-span-2 sm:col-span-2" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">{t("common.all")} {t("common.category").toLowerCase()}s</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select value={lowOnly ? "low" : "all"} onChange={(e) => setLowOnly(e.target.value === "low")}>
          <option value="all">All stock</option>
          <option value="low">{t("inventory.lowStock")} only</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel shadow-card">
          <EmptyState title="No items found" sub={t("common.noResults")} action={<Button onClick={openAdd}>{t("inventory.add")}</Button>} />
        </div>
      ) : simple ? (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-4 shadow-card">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand-strong">
                <Package className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-fg">{p.name}</span>
                <span className="block text-[11px] text-faint">{p.category} · {formatPKR(p.salePrice)}</span>
              </span>
              {statusBadge(p)}
              <RowBtns onEdit={() => { setEditing(p); setFormOpen(true); }} onDelete={() => setDeleting(p)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                  <th className="px-4 py-3">{t("common.name")}</th>
                  <th className="px-4 py-3">{t("common.category")}</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">{t("common.cost")}</th>
                  <th className="px-4 py-3 text-right">{t("common.price")}</th>
                  <th className="px-4 py-3 text-right">{t("common.stock")}</th>
                  <th className="px-4 py-3">{t("common.status")}</th>
                  <th className="px-4 py-3 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-panel2/50">
                    <td className="px-4 py-3 font-semibold text-fg">{p.name}</td>
                    <td className="px-4 py-3 text-muted">{p.category}</td>
                    <td className="px-4 py-3 capitalize text-muted">{p.kind}</td>
                    <td className="px-4 py-3 text-right tabular text-muted">{formatPKR(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular text-fg">{formatPKR(p.salePrice)}</td>
                    <td className="px-4 py-3 text-right tabular text-fg">{isService(p) ? "—" : p.stock}</td>
                    <td className="px-4 py-3">{statusBadge(p)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Btn label={t("common.edit")} onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Btn>
                        <Btn danger label={t("common.delete")} onClick={() => setDeleting(p)}><Trash2 className="h-4 w-4" /></Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t("inventory.edit") : t("inventory.add")}>
        <ProductForm initial={editing} onDone={() => setFormOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        title={t("common.delete")}
        body={`Delete ${deleting?.name ?? ""}? Past sales keep their record. ${t("common.confirmDelete")}`}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function RowBtns({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <Btn label="Edit" onClick={onEdit}><Pencil className="h-4 w-4" /></Btn>
      <Btn danger label="Delete" onClick={onDelete}><Trash2 className="h-4 w-4" /></Btn>
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
