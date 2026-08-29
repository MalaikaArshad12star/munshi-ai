"use client";

import { useState } from "react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/ui/toast";
import { Button, Field, Input, Select } from "@/components/ui/kit";
import type { Product, ProductKind } from "@/lib/types";

export function ProductForm({ initial, onDone }: { initial?: Product; onDone: () => void }) {
  const { actions, t } = useApp();
  const { toast } = useToast();

  const [kind, setKind] = useState<ProductKind>(initial?.kind ?? "product");
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [salePrice, setSalePrice] = useState<number>(initial?.salePrice ?? 0);
  const [costPrice, setCostPrice] = useState<number>(initial?.costPrice ?? 0);
  const [stock, setStock] = useState<number>(initial?.stock ?? 0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(initial?.lowStockThreshold ?? 5);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("common.required");
    if (!Number.isFinite(salePrice) || salePrice <= 0) e.salePrice = "Selling price must be greater than zero.";
    if (costPrice < 0 || !Number.isFinite(costPrice)) e.costPrice = "Cost cannot be negative.";
    if (kind === "product" && (stock < 0 || !Number.isFinite(stock))) e.stock = "Stock cannot be negative.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const input = {
      kind,
      name: name.trim(),
      category: category.trim() || "General",
      salePrice,
      costPrice,
      stock: kind === "product" ? stock : 0,
      lowStockThreshold: kind === "product" ? lowStockThreshold : 0,
    };
    const r = initial ? actions.updateProduct(initial.id, input) : actions.addProduct(input);
    toast(r.ok ? "success" : "error", r.ok ? (initial ? "Item updated." : "Item added.") : r.error);
    if (r.ok) onDone();
  };

  return (
    <div className="space-y-4">
      <Field label="Type">
        <Select value={kind} onChange={(e) => setKind(e.target.value as ProductKind)}>
          <option value="product">{t("inventory.product")}</option>
          <option value="service">{t("inventory.service")}</option>
        </Select>
      </Field>
      <Field label={t("common.name")} error={errors.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "service" ? "e.g. Home Delivery" : "e.g. Cooking Oil 5L"} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("common.category")}>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Staples" />
        </Field>
        <Field label={`Selling ${t("common.price").toLowerCase()} (Rs)`} error={errors.salePrice}>
          <Input type="number" min={0} value={salePrice || ""} onChange={(e) => setSalePrice(Number(e.target.value))} />
        </Field>
        <Field label={`Cost ${t("common.price").toLowerCase()} (Rs)`} error={errors.costPrice}>
          <Input type="number" min={0} value={costPrice || ""} onChange={(e) => setCostPrice(Number(e.target.value))} />
        </Field>
        {kind === "product" && (
          <>
            <Field label={t("common.stock")} error={errors.stock}>
              <Input type="number" min={0} value={stock || ""} onChange={(e) => setStock(Number(e.target.value))} />
            </Field>
            <Field label="Low-stock alert at">
              <Input type="number" min={0} value={lowStockThreshold || ""} onChange={(e) => setLowStockThreshold(Number(e.target.value))} />
            </Field>
          </>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onDone}>{t("common.cancel")}</Button>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </div>
  );
}
