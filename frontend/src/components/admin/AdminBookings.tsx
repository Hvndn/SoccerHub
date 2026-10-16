"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { SectionCard, StatusBadge } from "./AdminUI";
import { listAdminBookings, type AdminBooking } from "@/lib/adminService";
import { apiRequest } from "@/lib/api";

const STATUS_TONE: Record<string, "green" | "amber" | "rose" | "sky" | "slate"> = {
  BOOKED: "green",
  PLAYING: "sky",
  RESALE: "amber",
  CANCELLED: "rose",
};
const STATUS_LABEL: Record<string, string> = {
  BOOKED: "Đã cọc",
  PLAYING: "Đang đá",
  RESALE: "Nhượng",
  CANCELLED: "Đã hủy",
};

export default function AdminBookings({ notify }: { notify: (type: "ok" | "err", text: string) => void }) {
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

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
