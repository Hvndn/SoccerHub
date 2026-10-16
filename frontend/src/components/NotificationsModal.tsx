"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Bell,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  Trash2,
} from "lucide-react";

export interface AllNotificationsItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  cancelReason?: string;
  link?: string | null;
}

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
  notifications: AllNotificationsItem[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onMarkAllRead: () => void;
}

type FilterKey = "all" | "unread" | "booking" | "tournament" | "system";

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "unread", label: "Chưa đọc" },
  { id: "booking", label: "Đặt sân" },
  { id: "tournament", label: "Giải đấu" },
  { id: "system", label: "Hệ thống" },
];

function matchFilter(n: AllNotificationsItem, f: FilterKey): boolean {
  const t = (n.type || "").toUpperCase();
  if (f === "all") return true;
  if (f === "unread") return !n.read;
  if (f === "booking") return t.startsWith("BOOKING");
  if (f === "tournament")
    return ["TOURNAMENT", "MATCH", "BRACKET", "GOAL", "SCHEDULE"].some((k) => t.startsWith(k));
  return !t.startsWith("BOOKING") && !["TOURNAMENT", "MATCH", "BRACKET", "GOAL", "SCHEDULE"].some((k) => t.startsWith(k));
}

function formatTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return d.toLocaleDateString("vi-VN");
}

function TypeIcon({ type }: { type: string }) {
  const t = (type || "").toUpperCase();
  if (t === "BOOKING_CREATED")
    return <CheckCircle className="w-5 h-5 text-emerald-500" />;
  if (t === "BOOKING_CANCELLED")
    return <XCircle className="w-5 h-5 text-rose-500" />;
  if (t === "BOOKING_CHECKED_IN")
    return <CheckCircle className="w-5 h-5 text-sky-500" />;
  if (t.startsWith("TOURNAMENT") || t.startsWith("MATCH") || t.startsWith("BRACKET"))
    return <Trophy className="w-5 h-5 text-amber-500" />;
  return <AlertCircle className="w-5 h-5 text-amber-500" />;
}

function TypeTone(type: string): string {
  const t = (type || "").toUpperCase();
  if (t === "BOOKING_CREATED") return "bg-sky-100 dark:bg-emerald-900/40 text-sky-700";
  if (t === "BOOKING_CANCELLED") return "bg-rose-100 dark:bg-rose-900/40 text-rose-600";
  if (t === "BOOKING_CHECKED_IN") return "bg-sky-100 dark:bg-sky-900/40 text-sky-600";
  return "bg-amber-100 dark:bg-amber-900/40 text-amber-600";
}

export default function NotificationsModal({
  open,
  onClose,
  notifications,
  onDelete,
  onClearAll,
  onMarkAllRead,
}: NotificationsModalProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setFilter("all");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const filtered = useMemo(
    () => notifications.filter((n) => matchFilter(n, filter)),
    [notifications, filter]
  );
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tất cả thông báo"
        className="animate-modal-pop bg-white dark:bg-slate-900 w-full sm:max-w-2xl h-[92vh] sm:h-auto sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#0b4f6c]/10 text-[#247BA0] dark:text-sky-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                Tất Cả Thông Báo
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {notifications.length} thông báo
                {unread > 0 && <span className="font-bold text-[#247BA0] dark:text-sky-400"> • {unread} chưa đọc</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#247BA0] dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Đã đọc hết
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng danh sách thông báo"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bộ lọc theo loại */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filter === f.id
                  ? "bg-[#0b4f6c] text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {f.label}
              {f.id === "unread" && unread > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/25 text-[10px] font-black">{unread}</span>
              )}
            </button>
          ))}
          {unread > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="sm:hidden px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap text-[#247BA0] dark:text-sky-400 border border-[#0b4f6c]/30"
            >
              Đã đọc hết
            </button>
          )}
        </div>

        {/* Danh sách */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center space-y-3 text-slate-400 px-6 text-center">
              <Bell className="w-12 h-12 opacity-30" />
              <p className="text-sm font-semibold">
                {notifications.length === 0
                  ? "Chưa có thông báo nào từ hệ thống"
                  : "Không có thông báo nào thuộc nhóm này"}
              </p>
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className={`p-4 sm:p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                  !n.read ? "bg-sky-50/60 dark:bg-sky-950/20" : ""
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${TypeTone(n.type)}`}>
                    <TypeIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">{n.title}</p>
                      {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-[#0b4f6c] mt-1 shrink-0" />}
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{n.message}</p>
                    {n.type === "BOOKING_CANCELLED" && (n as any).cancelReason && (
                      <div className="mt-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                        <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                          📋 Lý do: <span className="font-normal">{(n as any).cancelReason}</span>
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <p className="text-[11px] text-slate-400 font-mono">{formatTime(n.time)}</p>
                      <div className="flex items-center gap-1.5">
                        {n.link && (
                          <a
                            href={n.link}
                            className="text-[11px] font-bold text-[#247BA0] dark:text-sky-400 hover:underline"
                          >
                            Xem chi tiết →
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(n.id)}
                          aria-label="Xóa thông báo này"
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
            >
              Xóa tất cả thông báo
            </button>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {filtered.length}/{notifications.length} hiển thị
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
