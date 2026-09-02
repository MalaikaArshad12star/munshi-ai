"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/ui/toast";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/kit";
import { todayISO } from "@/lib/format";
import type { Document, DocumentCategory } from "@/lib/types";

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "receipt", label: "Receipt" },
  { value: "invoice", label: "Invoice" },
  { value: "expense-bill", label: "Expense Bill" },
  { value: "purchase-bill", label: "Purchase Bill" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function DocumentForm({ initial, onDone }: { initial?: Document; onDone: () => void }) {
  const { actions, t } = useApp();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<DocumentCategory>(initial?.category ?? "receipt");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial ? initial.date.slice(0, 10) : todayISO());
  const [note, setNote] = useState(initial?.note ?? "");
  const [fileName, setFileName] = useState(initial?.fileName ?? "");
  const [fileType, setFileType] = useState(initial?.fileType ?? "");
  const [fileSize, setFileSize] = useState(initial?.fileSize ?? 0);
  const [fileData, setFileData] = useState(initial?.fileData ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setErrors((e) => ({ ...e, file: "File too large. Maximum size is 5 MB." }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileName(file.name);
      setFileType(file.type || "application/octet-stream");
      setFileSize(file.size);
      setFileData(reader.result as string);
      setErrors((e) => {
        const { file: _, ...rest } = e;
        return rest;
      });
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = t("common.required");
    if (!date) e.date = t("common.required");
    if (!initial && !fileData) e.file = t("documents.fileRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const input = {
      category,
      title: title.trim(),
      date: `${date}T12:00:00`,
      fileName,
      fileType,
      fileSize,
      fileData,
      note: note.trim() || undefined,
    };
    const result = initial ? actions.updateDocument(initial.id, input) : actions.addDocument(input);
    if (result.ok) {
      toast("success", initial ? "Document updated." : "Document uploaded.");
      onDone();
    } else {
      toast("error", result.error);
    }
  };

  return (
    <div className="space-y-4">
      <Field label={t("common.category")}>
        <Select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>
      </Field>

      <Field label={t("common.name")} error={errors.title}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Vendor invoice — Aug 2026" />
      </Field>

      <Field label={t("common.date")} error={errors.date}>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      {!initial && (
        <div>
          <Field label={t("documents.uploadFile")} error={errors.file}>
            <div
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-panel2 px-4 py-6 transition-colors hover:border-brand/50 hover:bg-panel3"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-faint" />
              <span className="text-xs font-semibold text-muted">
                {fileName || "Click to select a file"}
              </span>
              {fileName && (
                <span className="text-[10px] text-faint">
                  {(fileSize / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </Field>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {initial && (
        <div className="rounded-xl border border-line bg-panel2 px-4 py-3">
          <p className="text-xs font-semibold text-muted">{initial.fileName}</p>
          <p className="text-[10px] text-faint">{(initial.fileSize / 1024).toFixed(1)} KB</p>
        </div>
      )}

      <Field label={t("common.notes")}>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional notes…" />
      </Field>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onDone}>{t("common.cancel")}</Button>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </div>
  );
}
