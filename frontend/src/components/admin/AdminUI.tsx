"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";

/* ---------- Modal xác nhận hành động nguy hiểm (xóa / khóa) ---------- */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  danger = true,
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="animate-modal-pop w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 my-auto max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              danger ? "bg-rose-100 dark:bg-rose-950 text-rose-600" : "bg-sky-100 dark:bg-sky-950 text-sky-700"
            }`}
          >
            {danger ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white">{title}</h3>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{message}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2 rounded-xl text-white text-xs font-black transition-all active:scale-95 disabled:opacity-50 ${
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-[#0ea5e9] hover:bg-[#0284c7]"
            }`}
          >
            {busy ? "Đang xử lý…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Toast ---------- */
export function AdminToast({ toast, onClose }: { toast: { type: "ok" | "err"; text: string } | null; onClose: () => void }) {
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in-up sm:max-w-sm">
      {toast.type === "ok" ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
      )}
      <span className="text-xs font-bold">{toast.text}</span>
    </div>
  );
}

/* ---------- Thẻ section ---------- */
export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-3 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

/* ---------- Badge trạng thái ---------- */
export function StatusBadge({ tone, children }: { tone: "green" | "amber" | "rose" | "sky" | "slate"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    green: "bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-400",
    amber: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400",
    rose: "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400",
    sky: "bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-400",
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${map[tone]}`}>
      {children}
    </span>
  );
}

/* ---------- Trạng thái rỗng ---------- */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="p-4 sm:p-8 text-center">
      <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
      <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
