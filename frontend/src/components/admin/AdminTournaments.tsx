"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { ConfirmModal, SectionCard, StatusBadge } from "./AdminUI";
import { deleteTournament, fetchTournaments, setTournamentStatus, type Tournament } from "@/lib/adminService";
import { formatDate, formatMoney, registeredCount, sportLabel } from "@/lib/tournamentService";

const STATUS_TONE: Record<string, "green" | "amber" | "rose" | "sky" | "slate"> = {
 OPEN: "green",
 ONGOING: "sky",
 COMPLETED: "slate",
};
const STATUS_LABEL: Record<string, string> = {
 OPEN: "Đang mở",
 ONGOING: "Đang diễn ra",
 COMPLETED: "Đã kết thúc",
};
const ALL_STATUS = ["OPEN", "ONGOING", "COMPLETED"];

export default function AdminTournaments({ notify }: { notify: (type: "ok" | "err", text: string) => void }) {
 const [rows, setRows] = useState<Tournament[]>([]);
 const [loading, setLoading] = useState(true);
 const [busyId, setBusyId] = useState<number | null>(null);
 const [confirmDelete, setConfirmDelete] = useState<Tournament | null>(null);

 const load = useCallback(async () => {
 try {
 setLoading(true);
 setRows(await fetchTournaments(true));
 } catch (err: any) {
 notify("err", err?.message || "Không tải được danh sách giải đấu.");
 } finally {
 setLoading(false);
 }
 }, [notify]);

 useEffect(() => {
 load();
 }, [load]);

 const changeStatus = async (t: Tournament, status: string) => {
 if (status === (t.status ?? "OPEN")) return;
 try {
 setBusyId(t.id);
 const res = await setTournamentStatus(t.id, status);
 notify("ok", res.message);
 await load();
 } catch (err: any) {
 notify("err", err?.message || "Đổi trạng thái thất bại. Cần đăng nhập tài khoản ADMIN.");
 } finally {
 setBusyId(null);
 }
 };

 const doDelete = async () => {
 if (!confirmDelete) return;
 try {
 setBusyId(confirmDelete.id);
 const res = await deleteTournament(confirmDelete.id);
 notify("ok", res.message);
 setConfirmDelete(null);
 await load();
 } catch (err: any) {
 notify("err", err?.message || "Xóa giải đấu thất bại. Cần đăng nhập tài khoản ADMIN.");
 } finally {
 setBusyId(null);
 }
 };

 const columns: AdminColumn<Tournament>[] = [
 {
 key: "id",
 header: "#",
 sortable: true,
 sortValue: (r) => r.id,
 render: (r) => <span className="font-mono font-bold text-slate-500">{r.id}</span>,
 },
 {
 key: "title",
 header: "Giải đấu",
 sortable: true,
 sortValue: (r) => r.title ?? "",
 render: (r) => (
 <div className="max-w-[260px]">
 <p className="font-bold text-slate-900 truncate">{r.title}</p>
 <p className="text-[13px] text-slate-500">
 {sportLabel(r.sportType)} • {registeredCount(r)}/{r.totalTeams ?? "—"} đội
 </p>
 </div>
 ),
 },
 {
 key: "prize",
 header: "Giải thưởng",
 sortable: true,
 sortValue: (r) => r.prizePool ?? 0,
 render: (r) => <span className="font-mono font-bold text-sky-800 ">{formatMoney(r.prizePool)}</span>,
 },
 {
 key: "start",
 header: "Khởi tranh",
 sortable: true,
 sortValue: (r) => r.startDate ?? "",
 render: (r) => <span className="font-mono">{formatDate(r.startDate)}</span>,
 },
 {
 key: "status",
 header: "Trạng thái",
 sortable: true,
 sortValue: (r) => r.status ?? "",
 render: (r) => (
 <div className="flex items-center gap-1.5">
 <StatusBadge tone={STATUS_TONE[r.status ?? ""] ?? "slate"}>
 {STATUS_LABEL[r.status ?? ""] ?? r.status}
 </StatusBadge>
 <div className="relative">
 <select
 aria-label={`Đổi trạng thái giải ${r.title}`}
 value={r.status ?? "OPEN"}
 disabled={busyId === r.id}
 onChange={(e) => changeStatus(r, e.target.value)}
 className="pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 bg-white text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0369a1] disabled:opacity-50 cursor-pointer"
 >
 {ALL_STATUS.map((s) => (
 <option key={s} value={s}>
 {STATUS_LABEL[s]}
 </option>
 ))}
 </select>
 <Pencil className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
 </div>
 </div>
 ),
 },
 {
 key: "actions",
 header: "Thao tác",
 render: (r) => (
 <button
 type="button"
 title={`Xóa giải ${r.title}`}
 disabled={busyId === r.id}
 onClick={() => setConfirmDelete(r)}
 className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 ),
 },
 ];

 return (
 <SectionCard>
 <div className="flex items-center justify-between mb-4">
 <div>
 <h2 className="font-black text-slate-900 text-sm">Quản lý giải đấu</h2> <p className="hidden sm:block text-[13px] text-slate-500 mt-0.5">
 Đóng/mở đăng ký và xóa giải rác. Xóa giải sẽ xóa kèm toàn bộ đội đã ghi danh.
 </p>
 </div>
 <button
 type="button"
 onClick={load}
 className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all"
 >
 Tải lại
 </button>
 </div>

 <AdminTable
 rows={rows}
 columns={columns}
 rowKey={(r) => r.id}
 loading={loading}
 searchPlaceholder="Tìm theo tên giải, địa điểm…"
 searchFilter={(r, q) =>
 [r.title, r.location ?? "", r.pitchName ?? "", r.sportType ?? ""].join(" ").toLowerCase().includes(q)
 }
 emptyTitle="Chưa có giải đấu nào."
 emptyHint="Tạo giải mới tại trang /tournaments/new."
 />

 <ConfirmModal
 open={confirmDelete !== null}
 title="Xóa giải đấu?"
 message={
 confirmDelete ? (
 <>
 Xóa vĩnh viễn giải <strong>“{confirmDelete.title}”</strong> cùng{" "}
 <strong>{registeredCount(confirmDelete)} đội</strong> đã ghi danh. Không thể hoàn tác.
 </>
 ) : null
 }
 confirmLabel="Xóa vĩnh viễn"
 danger
 busy={busyId !== null}
 onCancel={() => setConfirmDelete(null)}
 onConfirm={doDelete}
 />
 </SectionCard>
 );
}
