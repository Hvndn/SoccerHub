"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { subscribeToasts, dismiss, type ToastItem } from "@/lib/toast";

const ICON = {
  ok: CheckCircle2,
  err: AlertTriangle,
  info: Info,
} as const;

const TONE = {
  ok: "text-emerald-400",
  err: "text-rose-400",
  info: "text-cyan-400",
} as const;

/** Khung hiển thị toast — đặt một lần trong layout.tsx. */
export default function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setList), []);

  // Khung luôn tồn tại (rỗng khi không có thông báo) nên không nhảy layout khi toast
  // đầu tiên hiện ra; pointer-events-none nên không chặn thao tác.
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed z-[300] bottom-24 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto flex flex-col items-end gap-2 pointer-events-none"
    >
      {list.map((t) => {
        const Icon = ICON[t.type];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto w-full sm:w-auto sm:max-w-sm flex items-start gap-2.5 bg-slate-900 text-white pl-3.5 pr-2 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in-up"
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${TONE[t.type]}`} />
            <span className="text-sm font-medium leading-snug flex-1 min-w-0 break-words">{t.text}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Đóng thông báo"
              className="shrink-0 w-6 h-6 rounded-lg hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}