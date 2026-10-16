"use client";

import React, { useCallback, useEffect, useState } from "react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { SectionCard } from "./AdminUI";
import { listAdminPitches, type AdminPitch } from "@/lib/adminService";

export default function AdminPitches({ notify }: { notify: (type: "ok" | "err", text: string) => void }) {
  const [rows, setRows] = useState<AdminPitch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await listAdminPitches());
    } catch (err: any) {
      notify("err", err?.message || "Không tải được danh sách sân.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: AdminColumn<AdminPitch>[] = [
    {
      key: "id",
      header: "#",
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => <span className="font-mono font-bold text-slate-500">{r.id}</span>,
    },
    {
      key: "name",
      header: "Cụm sân",
      sortable: true,
      sortValue: (r) => r.name ?? "",
      render: (r) => (
        <div className="max-w-[240px]">
          <p className="font-bold text-slate-900 dark:text-white truncate">{r.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{r.address}</p>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Chủ sân",
      sortable: true,
      sortValue: (r) => r.ownerName ?? "",
      render: (r) => <span>{r.ownerName || "—"}</span>,
    },
    {
      key: "types",
      header: "Loại sân",
      render: (r) => (
        <span className="text-[11px] text-slate-600 dark:text-slate-300">
          {(r.pitchTypes ?? []).join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Giá TB/giờ",
      sortable: true,
      sortValue: (r) => r.avgPricePerHour ?? 0,
      render: (r) => (
        <span className="font-mono font-bold text-sky-800 dark:text-sky-400">
          {(r.avgPricePerHour ?? 0).toLocaleString("vi-VN")}đ
        </span>
      ),
    },
    {
      key: "rating",
      header: "Đánh giá",
      sortable: true,
      sortValue: (r) => r.rating ?? 0,
      render: (r) => <span className="font-mono font-bold">⭐ {(r.rating ?? 0).toFixed(1)}</span>,
    },
  ];

  return (
    <SectionCard>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-black text-slate-900 dark:text-white text-sm">Quản lý sân bóng</h2>          <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Danh sách cụm sân trong CSDL. Thêm/sửa sân thực hiện ở Bảng điều hành Chủ sân.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all"
        >
          Tải lại
        </button>
      </div>

      <AdminTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        searchPlaceholder="Tìm theo tên sân, địa chỉ, chủ sân…"
        searchFilter={(r, q) =>
          [r.name, r.address, r.ownerName ?? "", r.area ?? ""].join(" ").toLowerCase().includes(q)
        }
        emptyTitle="Chưa có sân nào."
      />
    </SectionCard>
  );
}
