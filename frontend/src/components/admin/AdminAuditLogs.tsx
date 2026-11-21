"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ScrollText, RefreshCw, ShieldCheck, Search, Filter } from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { SectionCard } from "./AdminUI";
import { apiRequest } from "@/lib/api";

interface AuditRow {
  id: number;
  adminEmail: string;
  adminName?: string;
  actionGroup: string;
  action: string;
  target?: string;
  detail?: string;
  createdAt: string;
}

/** Nhãn tiếng Việt cho từng hành động quản trị */
const ACTION_LABEL: Record<string, string> = {
  LOCK_USER: "Khóa tài khoản",
  UNLOCK_USER: "Mở khóa tài khoản",
  CHANGE_ROLE: "Đổi vai trò",
  DELETE_USER: "Xóa tài khoản",
  DELETE_POST: "Gỡ tin chợ kèo",
  BROADCAST: "Gửi thông báo",
  DELETE_NOTIFICATION: "Xóa thông báo",
  DELETE_TOURNAMENT: "Xóa giải đấu",
  SET_TOURNAMENT_STATUS: "Đổi trạng thái giải",
  CLEAN_ORPHANS: "Dọn dữ liệu mồ côi",
  DELETE_CHAT_MESSAGE: "Xóa tin nhắn",
  ADMIN_CANCEL_BOOKING: "Trọng tài huỷ & hoàn cọc",
  VERIFY_PITCH: "Xác thực tọa độ sân",
};

const GROUP_LABEL: Record<string, string> = {
  USER: "Người Dùng",
  TOURNAMENT: "Giải Đấu",
  PITCH: "Sân Bóng",
  BOOKING: "Đặt Sân",
  CHAT: "Phòng Chat",
  MATCHMAKING: "Chợ Kèo",
  NOTIFICATION: "Thông Báo",
  SYSTEM: "Hệ Thống",
};

const GROUPS = [
  { value: "", label: "Tất Cả Nhóm" },
  { value: "USER", label: "Người Dùng" },
  { value: "BOOKING", label: "Đặt Sân & Cọc" },
  { value: "PITCH", label: "Cụm Sân Bóng" },
  { value: "TOURNAMENT", label: "Giải Đấu" },
  { value: "MATCHMAKING", label: "Chợ Kèo" },
  { value: "CHAT", label: "Phòng Chat" },
  { value: "NOTIFICATION", label: "Thông Báo" },
  { value: "SYSTEM", label: "Hệ Thống" },
];

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const s = String(iso).replace("T", " ");
  return s.slice(0, 19);
}

export default function AdminAuditLogs({
  notify,
}: {
  notify: (type: "ok" | "err", text: string) => void;
}) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const url = group
        ? `/api/v1/admin/audit-logs?group=${encodeURIComponent(group)}&limit=200`
        : `/api/v1/admin/audit-logs?limit=200`;
      const data = await apiRequest<AuditRow[]>(url);
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      notify("err", err?.message || "Không tải được nhật ký quản trị.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [group, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: AdminColumn<AuditRow>[] = [
    {
      key: "id",
      header: "Mã",
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => <span className="font-mono font-bold text-slate-500">#{r.id}</span>,
    },
    {
      key: "actionGroup",
      header: "Phân hệ",
      sortable: true,
      sortValue: (r) => r.actionGroup,
      render: (r) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
          {GROUP_LABEL[r.actionGroup] ?? r.actionGroup}
        </span>
      ),
    },
    {
      key: "action",
      header: "Hành động",
      sortable: true,
      sortValue: (r) => r.action,
      render: (r) => (
        <span className="font-bold text-slate-900 text-[13px]">
          {ACTION_LABEL[r.action] ?? r.action}
        </span>
      ),
    },
    {
      key: "admin",
      header: "Quản trị viên",
      sortable: true,
      sortValue: (r) => r.adminEmail ?? "",
      render: (r) => (
        <div className="max-w-[190px]">
          <p className="font-bold text-slate-900 truncate text-[13px]">
            {r.adminName || r.adminEmail || "—"}
          </p>
          <p className="text-[12px] font-mono text-slate-500 truncate">{r.adminEmail}</p>
        </div>
      ),
    },
    {
      key: "detail",
      header: "Chi tiết thao tác",
      render: (r) => (
        <p className="text-[13px] text-slate-700 max-w-[420px] break-words leading-relaxed">
          {r.detail || "—"}
        </p>
      ),
    },
    {
      key: "createdAt",
      header: "Thời gian",
      sortable: true,
      sortValue: (r) => r.createdAt ?? "",
      render: (r) => (
        <span className="text-[12px] font-mono text-slate-500 whitespace-nowrap">
          {fmtDate(r.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <SectionCard>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-base">Nhật Ký Kiểm Toán Thao Tác</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Truy vết minh bạch mọi hành vi của Quản trị viên: ai đã làm gì, lên đối tượng nào, vào lúc nào.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            aria-label="Lọc theo nhóm thao tác"
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shadow-2xs"
          >
            {GROUPS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-700 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tải Lại</span>
          </button>
        </div>
      </div>

      <AdminTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        searchPlaceholder="Tìm theo quản trị, hành động, đối tượng, chi tiết…"
        searchFilter={(r, q) =>
          [r.adminName, r.adminEmail, r.action, r.target, r.detail, r.actionGroup]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        }
        emptyTitle="Chưa có thao tác quản trị nào được ghi nhận."
      />
    </SectionCard>
  );
}
