"use client";

import { useState } from "react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/ui/toast";
import { Button, Field, Input } from "@/components/ui/kit";
import { todayISO } from "@/lib/format";
import type { Customer } from "@/lib/types";

export function CustomerForm({ initial, onDone }: { initial?: Customer; onDone: () => void }) {
  const { actions, t } = useApp();
  const { toast } = useToast();

  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [openingBalance, setOpeningBalance] = useState<number>(initial?.openingBalance ?? 0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("common.required");
    if (!phone.trim()) e.phone = t("common.required");
    if (openingBalance < 0 || !Number.isFinite(openingBalance)) e.openingBalance = "Balance cannot be negative.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const input = {
      name: name.trim(),
      phone: phone.trim(),
      openingBalance,
      lastVisit: initial?.lastVisit ?? todayISO(),
    };
    const r = initial ? actions.updateCustomer(initial.id, input) : actions.addCustomer(input);
    toast(r.ok ? "success" : "error", r.ok ? (initial ? "Customer updated." : "Customer added.") : r.error);
    if (r.ok) onDone();
  };

  return (
    <div className="space-y-4">
      <Field label={t("common.name")} error={errors.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rashid Khan" />
      </Field>
      <Field label={t("common.phone")} error={errors.phone}>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx-xxxxxxx" />
      </Field>
      <Field
        label="Opening udhaar balance (Rs)"
        error={errors.openingBalance}
        hint="Any existing balance this customer already owes."
      >
        <Input type="number" min={0} value={openingBalance || ""} onChange={(e) => setOpeningBalance(Number(e.target.value))} />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onDone}>{t("common.cancel")}</Button>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </div>
  );
}
