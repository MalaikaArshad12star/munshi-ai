"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Eye,
  FileImage,
  FileText,
  FileType,
  Pencil,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/ui/toast";
import { Button, EmptyState } from "@/components/ui/kit";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { DocumentForm } from "@/components/forms/document-form";
import { shortDateLabel } from "@/lib/format";
import type { Document, DocumentCategory } from "@/lib/types";

type Tab = "all" | DocumentCategory;

const TABS: { value: Tab; label: string; tKey: string; icon: typeof FileText }[] = [
  { value: "all", label: "All", tKey: "documents.all", icon: FileText },
  { value: "receipt", label: "Receipts", tKey: "documents.receipts", icon: Receipt },
  { value: "invoice", label: "Invoices", tKey: "documents.invoices", icon: FileText },
  { value: "expense-bill", label: "Expense Bills", tKey: "documents.expenseBills", icon: FileType },
  { value: "purchase-bill", label: "Purchase Bills", tKey: "documents.purchaseBills", icon: FileImage },
];

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  receipt: "Receipt",
  invoice: "Invoice",
  "expense-bill": "Expense Bill",
  "purchase-bill": "Purchase Bill",
};

const CATEGORY_TONES: Record<DocumentCategory, string> = {
  receipt: "bg-up/12 text-up",
  invoice: "bg-brand/12 text-brand-strong",
  "expense-bill": "bg-down/12 text-down",
  "purchase-bill": "bg-gold/12 text-gold",
};

export default function DocumentsPage() {
  const { data, actions, t, settings, mounted } = useApp();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Document | undefined>();
  const [deleting, setDeleting] = useState<Document | undefined>();
  const [preview, setPreview] = useState<Document | null>(null);

  const documents = useMemo(() => data?.documents ?? [], [data]);
  const simple = settings.mode === "simple";

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: documents.length };
    for (const d of documents) c[d.category] = (c[d.category] ?? 0) + 1;
    return c;
  }, [documents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents
      .filter((d) => {
        if (tab !== "all" && d.category !== tab) return false;
        if (q && !`${d.title} ${d.fileName} ${d.note ?? ""}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [documents, tab, search]);

  if (!mounted || !data) return null;

  const openAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const r = actions.deleteDocument(deleting.id);
    toast(r.ok ? "success" : "error", r.ok ? "Document deleted." : r.error);
  };

  const downloadFile = (doc: Document) => {
    const a = window.document.createElement("a");
    a.href = doc.fileData;
    a.download = doc.fileName;
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">{t("documents.title")}</h1>
          <p className="mt-1 text-sm text-muted">Receipts, invoices, bills — all in one place.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> {t("documents.add")}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-line bg-panel p-1.5 shadow-card">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.value;
          return (
            <button
              key={tb.value}
              type="button"
              onClick={() => setTab(tb.value)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                active
                  ? "bg-gradient-to-br from-brand to-brand-deep text-white shadow-glow"
                  : "text-muted hover:bg-panel3 hover:text-fg"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(tb.tKey)}
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  active ? "bg-white/20 text-white" : "bg-panel3 text-faint"
                }`}
              >
                {counts[tb.value] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-line bg-panel p-3 shadow-card">
        <input
          className="w-full rounded-xl border border-line bg-panel2 px-3 text-sm text-fg placeholder:text-faint focus:border-brand focus:outline-none h-10"
          placeholder={`${t("common.search")}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel shadow-card">
          <EmptyState
            title={t("documents.noDocs")}
            sub={t("documents.noDocsSub")}
            action={<Button onClick={openAdd}>{t("documents.add")}</Button>}
          />
        </div>
      ) : simple ? (
        <div className="space-y-2">
          {filtered.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-4 shadow-card">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${CATEGORY_TONES[d.category]}`}>
                <FileText className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-fg">{d.title}</span>
                <span className="block truncate text-[11px] text-faint">{d.fileName}</span>
              </span>
              <span className="text-right">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_TONES[d.category]}`}>
                  {CATEGORY_LABELS[d.category]}
                </span>
                <span className="mt-0.5 block text-[10px] text-faint">{shortDateLabel(d.date.slice(0, 10))}</span>
              </span>
              <DocActions doc={d} onEdit={() => { setEditing(d); setFormOpen(true); }} onDelete={() => setDeleting(d)} onPreview={() => setPreview(d)} onDownload={() => downloadFile(d)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                  <th className="px-4 py-3">{t("common.name")}</th>
                  <th className="px-4 py-3">{t("common.category")}</th>
                  <th className="px-4 py-3">{t("common.date")}</th>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-panel2/50">
                    <td className="px-4 py-3">
                      <span className="block truncate font-semibold text-fg">{d.title}</span>
                      {d.note && <span className="block truncate text-[11px] text-faint">{d.note}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_TONES[d.category]}`}>
                        {CATEGORY_LABELS[d.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{shortDateLabel(d.date.slice(0, 10))}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-muted">{d.fileName}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <ActionBtn label="Preview" onClick={() => setPreview(d)}><Eye className="h-4 w-4" /></ActionBtn>
                        <ActionBtn label="Download" onClick={() => downloadFile(d)}><Download className="h-4 w-4" /></ActionBtn>
                        <ActionBtn label={t("common.edit")} onClick={() => { setEditing(d); setFormOpen(true); }}><Pencil className="h-4 w-4" /></ActionBtn>
                        <ActionBtn danger label={t("common.delete")} onClick={() => setDeleting(d)}><Trash2 className="h-4 w-4" /></ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload / Edit modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t("documents.edit") : t("documents.add")} wide>
        <DocumentForm initial={editing} onDone={() => setFormOpen(false)} />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        title={t("common.delete")}
        body={`Delete "${deleting?.title ?? ""}"? ${t("common.confirmDelete")}`}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDelete}
      />

      {/* Preview modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title ?? ""} wide>
        {preview && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-panel2 px-4 py-3">
              <FileText className="h-5 w-5 text-faint" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-fg">{preview.fileName}</p>
                <p className="text-[11px] text-faint">{(preview.fileSize / 1024).toFixed(1)} KB &middot; {shortDateLabel(preview.date.slice(0, 10))}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => downloadFile(preview)}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
            {preview.fileType.startsWith("image/") ? (
              <div className="overflow-hidden rounded-xl border border-line">
                <img src={preview.fileData} alt={preview.title} className="max-h-[60vh] w-full object-contain" />
              </div>
            ) : preview.fileType === "application/pdf" ? (
              <iframe src={preview.fileData} title={preview.title} className="h-[60vh] w-full rounded-xl border border-line" />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-panel2 px-6 py-12 text-center">
                <FileText className="h-10 w-10 text-faint" />
                <p className="text-sm text-muted">Preview not available for this file type.</p>
                <Button size="sm" onClick={() => downloadFile(preview)}>
                  <Download className="h-3.5 w-3.5" /> Download to view
                </Button>
              </div>
            )}
            {preview.note && (
              <div className="rounded-xl border border-line bg-panel2 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase text-faint">Notes</p>
                <p className="mt-1 text-sm text-muted">{preview.note}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function DocActions({
  doc: _doc,
  onEdit,
  onDelete,
  onPreview,
  onDownload,
}: {
  doc: Document;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="flex gap-1">
      <ActionBtn label="Preview" onClick={onPreview}><Eye className="h-4 w-4" /></ActionBtn>
      <ActionBtn label="Download" onClick={onDownload}><Download className="h-4 w-4" /></ActionBtn>
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
