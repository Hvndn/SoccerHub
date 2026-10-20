"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ScrollText, RefreshCw, ShieldCheck } from "lucide-react";
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

/** Nhãn tiếng Việt cho từng hành động quản trị. */
const ACTION_LABEL: Record<string, string> = {
 LOCK_USER: "Khoá tài khoản",
 UNLOCK_USER: "Mở khoá tài khoản",
 CHANGE_ROLE: "Đổi vai trò",
 DELETE_USER: "Xoá tài khoản",
 DELETE_POST: "Gỡ tin chợ kèo",
 BROADCAST: "Gửi thông báo",
 DELETE_NOTIFICATION: "Xoá thông báo",
 DELETE_TOURNAMENT: "Xoá giải đấu",
 SET_TOURNAMENT_STATUS: "Đổi trạng thái giải",
 CLEAN_ORPHANS: "Dọn dữ liệu mồ côi",
 DELETE_CHAT_MESSAGE: "Xoá tin nhắn",
};

const GROUP_LABEL: Record<string, string> = {
 USER: "Người dùng",
 TOURNAMENT: "Giải đấu",
 PITCH: "Sân bóng",
 BOOKING: "Đặt sân",
 CHAT: "Chat",
 MATCHMAKING: "Chợ kèo",
 NOTIFICATION: "Thông báo",
 SYSTEM: "Hệ thống",
};

const GROUP_TONE: Record<string, "green" | "amber" | "rose" | "sky" | "slate"> = {
 USER: "sky",
 TOURNAMENT: "amber",
 PITCH: "green",
 BOOKING: "green",
 CHAT: "rose",
 MATCHMAKING: "rose",
 NOTIFICATION: "amber",
 SYSTEM: "slate",
};

const GROUP_ICON: Record<string, React.ReactNode> = {
 USER: <ShieldCheck className="w-3.5 h-3.5" />,
 TOURNAMENT: <ScrollText className="w-3.5 h-3.5" />,
 PITCH: <ScrollText className="w-3.5 h-3.5" />,
 BOOKING: <ScrollText className="w-3.5 h-3.5" />,
 CHAT: <ScrollText className="w-3.5 h-3.5" />,
 MATCHMAKING: <ScrollText className="w-3.5 h-3.5" />,
 NOTIFICATION: <ScrollText className="w-3.5 h-3.5" />,
 SYSTEM: <ScrollText className="w-3.5 h-3.5" />,
};

const GROUPS = [
 { value: "", label: "Tất cả nhóm" },
 { value: "USER", label: "Người dùng" },
 { value: "TOURNAMENT", label: "Giải đấu" },
 { value: "MATCHMAKING", label: "Chợ kèo" },
 { value: "CHAT", label: "Chat" },
 { value: "NOTIFICATION", label: "Thông báo" },
 { value: "SYSTEM", label: "Hệ thống" },
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
 header: "#",
 sortable: true,
 sortValue: (r) => r.id,
 render: (r) => <span className="font-mono font-bold text-slate-400">{r.id}</span>,
 },
 {
 key: "actionGroup",
 header: "Nhóm",
 sortable: true,
 sortValue: (r) => r.actionGroup,
 render: (r) => (
 <span
 className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[13px] font-black border ${
 (GROUP_TONE[r.actionGroup] ?? "slate") === "sky"
 ? "bg-sky-50 text-sky-700 border-sky-200"
 : (GROUP_TONE[r.actionGroup] ?? "slate") === "amber"
 ? "bg-amber-50 text-amber-700 border-amber-200"
 : (GROUP_TONE[r.actionGroup] ?? "slate") === "rose"
 ? "bg-rose-50 text-rose-700 border-rose-200"
 : (GROUP_TONE[r.actionGroup] ?? "slate") === "green"
 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
 : "bg-slate-100 text-slate-600 border-slate-200"
 }`}
 >
 {GROUP_ICON[r.actionGroup]}
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
 <span className="font-bold text-slate-900">
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
 <div className="max-w-[180px]">
 <p className="font-bold text-slate-900 truncate">
 {r.adminName || r.adminEmail || "—"}
 </p>
 <p className="text-[13px] font-mono text-slate-500 truncate">{r.adminEmail}</p>
 </div>
 ),
 },
 {
 key: "detail",
 header: "Chi tiết",
 render: (r) => (
 <p className="text-[13px] text-slate-700 max-w-[420px] break-words">{r.detail || "—"}</p>
 ),
 },
 {
 key: "createdAt",
 header: "Thời gian",
 sortable: true,
 sortValue: (r) => r.createdAt ?? "",
 render: (r) => (
 <span className="text-[13px] font-mono text-slate-500 whitespace-nowrap">
 {fmtDate(r.createdAt)}
 </span>
 ),
 },
 ];

 return (
 <SectionCard>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
 <ScrollText className="w-4 h-4" />
 </div>
 <div>
 <h2 className="font-black text-slate-900 text-sm">Nhật ký quản trị</h2>
 <p className="text-[13px] text-slate-500 mt-0.5">
 Ghi lại mọi thao tác của quản trị viên: ai đã làm gì, lên đối tượng nào, lúc nào.
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <select
 value={group}
 onChange={(e) => setGroup(e.target.value)}
 aria-label="Lọc theo nhóm thao tác"
 className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
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
 className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-700 transition-all flex items-center gap-1.5"
 >
 <RefreshCw className="w-3.5 h-3.5" /> Tải lại
 </button>
 </div>
 </div>

 <AdminTable
 rows={rows}
 columns={columns}
 rowKey={(r) => r.id}
 loading={loading}
 searchPlaceholder="Tìm theo quản trị, hành động, đối tượng…"
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