"use client";

import { useState } from "react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/ui/toast";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/kit";
import { EXPENSE_CATEGORIES } from "@/lib/business";
import { todayISO } from "@/lib/format";
import type { Expense, ExpenseCategory, ExpensePaymentMethod } from "@/lib/types";

export function ExpenseForm({ initial, onDone }: { initial?: Expense; onDone: () => void }) {
  const { actions, t } = useApp();
  const { toast } = useToast();

  const [date, setDate] = useState(initial ? initial.date.slice(0, 10) : todayISO());
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category ?? "Supplies");
  const [amount, setAmount] = useState<number>(initial?.amount ?? 0);
  const [note, setNote] = useState(initial?.note ?? "");
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>(initial?.paymentMethod ?? "cash");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (!date) e.date = t("common.required");
    if (!Number.isFinite(amount) || amount <= 0) e.amount = "Amount must be greater than zero.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const input = {
      date: `${date}T12:00:00`,
      category,
      amount,
      note: note.trim() || category,
      paymentMethod,
    };
    const r = initial ? actions.updateExpense(initial.id, input) : actions.addExpense(input);
    toast(r.ok ? "success" : "error", r.ok ? (initial ? "Expense updated." : "Expense added.") : r.error);
    if (r.ok) onDone();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("common.date")} error={errors.date}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t("common.category")}>
          <Select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`${t("common.amount")} (Rs)`} error={errors.amount}>
          <Input type="number" min={0} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
        </Field>
        <Field label={t("sales.payment")}>
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethod)}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="transfer">Bank transfer</option>
            <option value="other">Other</option>
          </Select>
        </Field>
      </div>
      <Field label={t("expenses.description")}>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was this for?" />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onDone}>{t("common.cancel")}</Button>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </div>
  );
}
