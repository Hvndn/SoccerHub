"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  Trash2,
} from "lucide-react";
import { formatNotifTime, type AppNotification } from "@/lib/useNotifications";

type FilterKey = "all" | "unread" | "booking" | "tournament" | "system";

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "unread", label: "Chưa đọc" },
  { id: "booking", label: "Đặt sân" },
  { id: "tournament", label: "Giải đấu" },
  { id: "system", label: "Hệ thống" },
];

function matchFilter(n: AppNotification, f: FilterKey): boolean {
  const t = (n.type || "").toUpperCase();
  if (f === "all") return true;
  if (f === "unread") return !n.read;
  if (f === "booking") return t.startsWith("BOOKING");
  if (f === "tournament")
    return ["TOURNAMENT", "MATCH", "BRACKET", "GOAL", "SCHEDULE"].some((k) => t.startsWith(k));
  return (
    !t.startsWith("BOOKING") &&
    !["TOURNAMENT", "MATCH", "BRACKET", "GOAL", "SCHEDULE"].some((k) => t.startsWith(k))
  );
}

function TypeIcon({ type }: { type: string }) {
  const t = (type || "").toUpperCase();
  if (t === "BOOKING_CREATED") return <CheckCircle className="w-5 h-5 text-emerald-500" />;
  if (t === "BOOKING_CANCELLED") return <XCircle className="w-5 h-5 text-rose-600" />;
  if (t === "BOOKING_CHECKED_IN") return <CheckCircle className="w-5 h-5 text-[#0369a1]" />;
  if (t === "BOOKING_REMINDER") return <Bell className="w-5 h-5 text-amber-700" />;
  if (t.startsWith("TOURNAMENT") || t.startsWith("MATCH") || t.startsWith("BRACKET"))
    return <Trophy className="w-5 h-5 text-amber-700" />;
  return <AlertCircle className="w-5 h-5 text-amber-700" />;
}

function TypeTone(type: string): string {
  const t = (type || "").toUpperCase();
  if (t === "BOOKING_CREATED") return "bg-sky-100 text-sky-700";
  if (t === "BOOKING_CANCELLED") return "bg-rose-100 text-rose-600";
  if (t === "BOOKING_CHECKED_IN") return "bg-sky-100 text-[#0369a1]";
  if (t === "BOOKING_REMINDER") return "bg-amber-100 text-amber-700";
  return "bg-amber-100 text-amber-600";
}

interface NotificationsCenterProps {
  notifications: AppNotification[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onMarkAllRead: () => void;
  onMarkRead?: (id: string) => void;
}

/**
 * Danh sách thông báo hiển thị TRONG LUỒNG TRANG (không phải popup/overlay).
 * Dùng cho trang riêng /notifications.
 */
export default function NotificationsCenter({
  notifications,
  onDelete,
  onClearAll,
  onMarkAllRead,
  onMarkRead,
}: NotificationsCenterProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(
    () => notifications.filter((n) => matchFilter(n, filter)),
    [notifications, filter]
  );
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const openLink = (n: AppNotification) => {
    if (!n.read) onMarkRead?.(n.id);
    if (!n.link) return;
    if (/^https?:\/\//i.test(n.link)) window.location.href = n.link;
    else router.push(n.link);
  };

  return (
    <section
      aria-label="Danh sách tất cả thông báo"
      className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Bộ lọc theo loại + đánh dấu đã đọc hết */}
      <div className="px-3 sm:px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${
                filter === f.id
                  ? "bg-[#0369a1] text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
              {f.id === "unread" && unread > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/25 text-[13px] font-black">
                  {unread}
                </span>
              )}
            </button>
          ))}
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-bold text-[#0b4f6c] hover:bg-sky-50 transition-colors shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            Đã đọc hết
          </button>
        )}
      </div>

      {/* Danh sách */}
      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center space-y-3 text-slate-500 px-6 text-center">
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
              className={`p-4 sm:p-5 transition-colors hover:bg-slate-50 ${
                !n.read ? "bg-sky-50/60" : ""
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${TypeTone(n.type)}`}
                >
                  <TypeIcon type={n.type} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-extrabold text-slate-900 leading-snug break-words">
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1] mt-1 shrink-0" />
                    )}
                  </div>
                  <p className="text-[13px] sm:text-[13px] text-slate-600 leading-relaxed font-medium break-words">
                    {n.message}
                  </p>
                  {n.type === "BOOKING_CANCELLED" && n.cancelReason && (
                    <div className="mt-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200">
                      <p className="text-[13px] font-bold text-rose-700">
                        📋 Lý do: <span className="font-normal">{n.cancelReason}</span>
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <p className="text-[13px] text-slate-500 font-mono">
                      {formatNotifTime(n.time)}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {n.link && (
                        <button
                          type="button"
                          onClick={() => openLink(n)}
                          className="text-[13px] font-bold text-[#0b4f6c] hover:underline flex items-center gap-1"
                        >
                          <span>Xem chi tiết →</span>
                        </button>
                      )}
                      {!n.read && onMarkRead && (
                        <button
                          type="button"
                          onClick={() => onMarkRead(n.id)}
                          aria-label="Đánh dấu đã đọc"
                          title="Đánh dấu đã đọc"
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-500 hover:text-[#0369a1] hover:bg-sky-50 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete(n.id)}
                        aria-label="Xóa thông báo này"
                        title="Xóa thông báo này"
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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

      {/* Chân trang */}
      {notifications.length > 0 && (
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClearAll}
            className="text-[13px] font-bold text-slate-500 hover:text-rose-600 transition-colors"
          >
            Xóa tất cả thông báo
          </button>
          <span className="text-[13px] font-semibold text-slate-500">
            {filtered.length}/{notifications.length} hiển thị
          </span>
        </div>
      )}
    </section>
  );
}
