"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/ui/toast";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/kit";
import { formatPKR, todayISO } from "@/lib/format";
import type { PaymentMethod, PaymentStatus, Sale, SaleItem } from "@/lib/types";

interface ItemRow {
  name: string;
  qty: number;
  unitPrice: number;
}

export function SaleForm({ initial, onDone }: { initial?: Sale; onDone: () => void }) {
  const { data, actions, t } = useApp();
  const { toast } = useToast();

  const [rows, setRows] = useState<ItemRow[]>(
    initial
      ? initial.items.map((i) => ({ name: i.productName, qty: i.qty, unitPrice: i.unitPrice }))
      : [{ name: "", qty: 1, unitPrice: 0 }],
  );
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.paymentMethod ?? "cash");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initial?.paymentStatus ?? "paid");
  const [paidAmount, setPaidAmount] = useState<number>(initial?.paidAmount ?? 0);
  const [date, setDate] = useState(initial ? initial.date.slice(0, 10) : todayISO());
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const products = data?.products ?? [];
  const customers = data?.customers ?? [];

  const total = useMemo(
    () => rows.reduce((a, r) => a + (r.qty || 0) * (r.unitPrice || 0), 0),
    [rows],
  );

  const setRow = (idx: number, patch: Partial<ItemRow>) => {
    setRows((rs) =>
      rs.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, ...patch };
        if (patch.name !== undefined) {
          const trimmed = patch.name.trim();
          const p = trimmed ? products.find((x) => x.name.toLowerCase() === trimmed.toLowerCase()) : undefined;
          if (p) next.unitPrice = p.salePrice;
        }
        return next;
      }),
    );
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const validRows = rows.filter((r) => r.name.trim());
    if (!validRows.length) e.items = t("common.required");
    if (validRows.some((r) => !Number.isFinite(r.qty) || r.qty <= 0)) e.qty = "Quantity must be a positive number.";
    if (validRows.some((r) => !Number.isFinite(r.unitPrice) || r.unitPrice < 0)) e.price = "Price cannot be negative.";
    if (!date) e.date = t("common.required");
    if (paymentStatus === "partial" && (paidAmount < 0 || paidAmount > total))
      e.paid = `Paid amount must be between 0 and ${formatPKR(total)}.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const items: SaleItem[] = rows
      .filter((r) => r.name.trim())
      .map((r) => {
        const trimmed = r.name.trim();
        const match = products.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
        return {
          productId: match ? match.id : `adhoc:${trimmed}`,
          productName: trimmed,
          qty: r.qty,
          unitPrice: r.unitPrice,
        };
      });
    const effectivePaid =
      paymentStatus === "paid" ? total : paymentStatus === "unpaid" ? 0 : paidAmount;
    const input = {
      date: `${date}T12:00:00`,
      items,
      customerId: customerId || undefined,
      paymentMethod,
      paymentStatus,
      paidAmount: effectivePaid,
      notes: notes.trim() || undefined,
    };
    const result = initial ? actions.updateSale(initial.id, input) : actions.addSale(input);
    if (result.ok) {
      toast("success", initial ? "Sale updated." : "Sale recorded.");
      onDone();
    } else {
      toast("error", result.error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Items */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted">{t("common.items")}</span>
          <Button size="sm" variant="secondary" onClick={() => setRows((r) => [...r, { name: "", qty: 1, unitPrice: 0 }])}>
            <Plus className="h-3.5 w-3.5" /> Add item
          </Button>
        </div>
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_64px_92px_32px] items-center gap-2">
              <Input
                value={row.name}
                onChange={(e) => setRow(idx, { name: e.target.value })}
                placeholder="Item name…"
                aria-label="Item name"
              />
              <Input
                type="number"
                min={1}
                value={row.qty || ""}
                onChange={(e) => setRow(idx, { qty: Number(e.target.value) })}
                aria-label="Quantity"
              />
              <Input
                type="number"
                min={0}
                value={row.unitPrice || ""}
                onChange={(e) => setRow(idx, { unitPrice: Number(e.target.value) })}
                aria-label="Unit price"
              />
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((_, i) => i !== idx))}
                className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-down/15 hover:text-down"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {errors.items && <p className="mt-1 text-[11px] text-down">{errors.items}</p>}
        {(errors.qty || errors.price) && (
          <p className="mt-1 text-[11px] text-down">{errors.qty || errors.price}</p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-line bg-panel2 px-4 py-3">
        <span className="text-xs font-semibold text-muted">{t("common.total")}</span>
        <span className="text-lg font-extrabold tabular text-brand-strong">{formatPKR(total)}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("common.customer")}>
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">{t("sales.walkIn")}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("common.date")} error={errors.date}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t("sales.payment")}>
          <Select
            value={paymentMethod}
            onChange={(e) => {
              const m = e.target.value as PaymentMethod;
              setPaymentMethod(m);
              setPaymentStatus(m === "udhaar" ? "unpaid" : "paid");
            }}
          >
            <option value="cash">Cash</option>
            <option value="udhaar">Udhaar (credit)</option>
          </Select>
        </Field>
        <Field label={t("common.status")}>
          <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </Select>
        </Field>
      </div>

      {paymentStatus === "partial" && (
        <Field label="Paid amount" error={errors.paid}>
          <Input type="number" min={0} value={paidAmount || ""} onChange={(e) => setPaidAmount(Number(e.target.value))} />
        </Field>
      )}

      <Field label={t("common.notes")}>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes…" />
      </Field>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </div>
  );
}
