"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Search, Sparkles, Eraser } from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { SectionCard, StatusBadge } from "./AdminUI";
import { listAdminBookings, simulateBookings, clearSimulatedBookings, type AdminBooking } from "@/lib/adminService";
import { apiRequest } from "@/lib/api";

const STATUS_TONE: Record<string, "green" | "amber" | "rose" | "sky" | "slate"> = {
  BOOKED: "green",
  PLAYING: "sky",
  RESALE: "amber",
  CANCELLED: "rose",
  COMPLETED: "slate",
};
const STATUS_LABEL: Record<string, string> = {
  BOOKED: "Đã cọc",
  PLAYING: "Đang đá",
  RESALE: "Nhượng",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn tất",
};

export default function AdminBookings({ notify }: { notify: (type: "ok" | "err", text: string) => void }) {
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [simBusy, setSimBusy] = useState<"gen" | "clear" | null>(null);
  const [perDay, setPerDay] = useState(6);

  const loadRecent = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await listAdminBookings(100));
    } catch (err: any) {
      notify("err", err?.message || "Không tải được đơn đặt sân. Cần đăng nhập tài khoản ADMIN.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) {
      loadRecent();
      return;
    }
    try {
      setSearching(true);
      const data = await apiRequest<AdminBooking[]>(`/api/v1/pitches/bookings/search?query=${encodeURIComponent(q)}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      notify("err", err?.message || "Tra cứu thất bại.");
    } finally {
      setSearching(false);
    }
  };

  /** Sinh dữ liệu demo: 21 ngày (14 quá khứ + 7 tương lai) x N đơn/ngày trên toàn bộ cụm sân. */
  const runSimulate = async () => {
    try {
      setSimBusy("gen");
      const res = await simulateBookings({ pastDays: 14, futureDays: 7, perDay });
      notify("ok", `${res.message} Doanh thu đã thu: ${(res.settledRevenue ?? 0).toLocaleString("vi-VN")}đ`);
      await loadRecent();
    } catch (err: any) {
      notify("err", err?.message || "Không sinh được dữ liệu giả lập.");
    } finally {
      setSimBusy(null);
    }
  };

  const runClearSim = async () => {
    try {
      setSimBusy("clear");
      const res = await clearSimulatedBookings();
      notify("ok", res?.message || "Đã dọn đơn giả lập.");
      await loadRecent();
    } catch (err: any) {
      notify("err", err?.message || "Không dọn được đơn giả lập.");
    } finally {
      setSimBusy(null);
    }
  };

  const columns: AdminColumn<AdminBooking>[] = [
    {
      key: "id",
      header: "Mã đơn",
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => (
        <div>
          <p className="font-mono font-bold text-slate-700 dark:text-slate-200">{r.code || `#${r.id}`}</p>
          <p className="text-[10px] font-mono text-slate-400">{r.createdAt ? String(r.createdAt).slice(0, 16).replace("T", " ") : ""}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Khách hàng",
      sortable: true,
      sortValue: (r) => r.customerName ?? "",
      render: (r) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{r.customerName}</p>
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{r.customerPhone}</p>
        </div>
      ),
    },
    {
      key: "slot",
      header: "Ca sân",
      sortable: true,
      sortValue: (r) => `${r.bookingDate ?? ""} ${r.timeSlot ?? ""}`,
      render: (r) => (
        <div>
          <p className="font-bold">{r.courtName}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {r.bookingDate} • {r.timeSlot}
          </p>
        </div>
      ),
    },
    {
      key: "money",
      header: "Đã cọc",
      sortable: true,
      sortValue: (r) => r.depositPaid ?? 0,
      render: (r) => (
        <span className="font-mono font-bold text-sky-800 dark:text-sky-400">
          {(r.depositPaid ?? 0).toLocaleString("vi-VN")}đ
        </span>
      ),
    },
    {
      key: "via",
      header: "Kênh",
      render: (r) => <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{r.via || "—"}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      sortable: true,
      sortValue: (r) => r.status ?? "",
      render: (r) => (
        <StatusBadge tone={STATUS_TONE[r.status ?? ""] ?? "slate"}>
          {STATUS_LABEL[r.status ?? ""] ?? r.status}
        </StatusBadge>
      ),
    },
  ];

  return (
    <SectionCard>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-sm">Đơn đặt sân & doanh thu</h3>
          <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            100 đơn mới nhất. Tra cứu mã vé hoặc SĐT để soi chi tiết.
          </p>
        </div>
        <form onSubmit={search} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Tra cứu mã vé hoặc số điện thoại"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Mã vé / SĐT…"
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0284c7] w-48 sm:w-56"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-3.5 py-2 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            {searching ? "Đang tìm…" : "Tra cứu"}
          </button>
        </form>
      </div>

      {/* Bộ công cụ dữ liệu demo — mọi đơn sinh ra đều có mã bắt đầu bằng "SIM-" nên xoá sạch được */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            Dữ liệu demo
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Sinh đơn giả lập 21 ngày (14 ngày trước · 7 ngày sau) để dashboard chủ sân có doanh thu &amp; lịch đầy đủ.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Đơn/ngày</span>
            <input
              type="number"
              min={1}
              max={30}
              value={perDay}
              onChange={(e) => setPerDay(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
              aria-label="Số đơn giả lập mỗi ngày"
              className="w-14 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
            />
          </label>
          <button
            type="button"
            onClick={runSimulate}
            disabled={simBusy !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {simBusy === "gen" ? "Đang tạo…" : "Tạo đơn giả lập"}
          </button>
          <button
            type="button"
            onClick={runClearSim}
            disabled={simBusy !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            <Eraser className="w-3.5 h-3.5" />
            {simBusy === "clear" ? "Đang xoá…" : "Dọn dữ liệu demo"}
          </button>
        </div>
      </div>

      <AdminTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        searchPlaceholder="Lọc nhanh trong danh sách…"
        searchFilter={(r, q) =>
          [r.customerName, r.customerPhone, r.code ?? "", r.courtName].join(" ").toLowerCase().includes(q)
        }
        emptyTitle="Chưa có đơn đặt sân nào."
      />
    </SectionCard>
  );
}
