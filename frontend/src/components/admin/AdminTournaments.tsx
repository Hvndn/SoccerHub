"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Trophy,
  Trash2,
  Eye,
  Pencil,
  Calendar,
  Users,
  ShieldAlert,
  Coins,
  MapPin,
  ChevronRight,
  Sparkles,
  GitBranch,
} from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { SectionCard, StatusBadge } from "./AdminUI";
import {
  deleteTournament,
  fetchTournaments,
  setTournamentStatus,
  type Tournament,
} from "@/lib/adminService";
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

export default function AdminTournaments({
  notify,
}: {
  notify: (type: "ok" | "err", text: string) => void;
}) {
  const [rows, setRows] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
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
      notify("ok", res.message || "Đã cập nhật trạng thái giải đấu.");
      setRows((prev) => prev.map((item) => (item.id === t.id ? { ...item, status } : item)));
      if (selectedTournament?.id === t.id) {
        setSelectedTournament({ ...selectedTournament, status });
      }
    } catch (err: any) {
      notify("err", err?.message || "Đổi trạng thái thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      setBusyId(confirmDelete.id);
      const res = await deleteTournament(confirmDelete.id);
      notify("ok", res.message || "Đã xóa giải đấu thành công.");
      setConfirmDelete(null);
      if (selectedTournament?.id === confirmDelete.id) {
        setSelectedTournament(null);
      }
      await load();
    } catch (err: any) {
      notify("err", err?.message || "Xóa giải đấu thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const filteredRows = rows.filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  const columns: AdminColumn<Tournament>[] = [
    {
      key: "id",
      header: "Mã",
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => <span className="font-mono font-bold text-slate-500">#{r.id}</span>,
    },
    {
      key: "title",
      header: "Giải đấu",
      sortable: true,
      sortValue: (r) => r.title ?? "",
      render: (r) => (
        <div className="max-w-[280px]">
          <p className="font-bold text-slate-900 truncate">{r.title}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {sportLabel(r.sportType)} • {registeredCount(r)}/{r.totalTeams ?? "—"} đội ghi danh
          </p>
        </div>
      ),
    },
    {
      key: "prize",
      header: "Giải thưởng",
      sortable: true,
      sortValue: (r) => r.prizePool ?? 0,
      render: (r) => (
        <span className="font-mono font-bold text-slate-900">{formatMoney(r.prizePool)}</span>
      ),
    },
    {
      key: "start",
      header: "Khởi tranh",
      sortable: true,
      sortValue: (r) => r.startDate ?? "",
      render: (r) => (
        <span className="font-mono text-[13px] text-slate-700">{formatDate(r.startDate)}</span>
      ),
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
              className="pl-2 pr-5 py-1 rounded-md border border-slate-200 bg-white text-[12px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {ALL_STATUS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <Pencil className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedTournament(r);
              setTimeout(() => {
                document
                  .getElementById("admin-tournament-detail-inline")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 50);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[12px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Xem chi tiết giải đấu & sơ đồ nhánh cúp"
          >
            <Eye className="w-3.5 h-3.5 text-slate-700" />
            <span>Sơ Đồ Cúp</span>
          </button>

          <button
            type="button"
            title={`Xóa giải ${r.title}`}
            disabled={busyId === r.id}
            onClick={() => setConfirmDelete(r)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* KHỐI XÁC NHẬN XÓA GIẢI INLINE (ZERO-MODAL) */}
      {confirmDelete && (
        <div className="rounded-2xl bg-slate-50 border border-slate-300 p-4 space-y-3 animate-fade-in shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-slate-900">
                Xác nhận xóa vĩnh viễn giải đấu “{confirmDelete.title}”?
              </h4>
              <p className="text-[13px] text-slate-600 mt-0.5">
                Giải đấu cùng toàn bộ <strong>{registeredCount(confirmDelete)} đội bóng</strong> đã
                ghi danh sẽ bị hủy bỏ. Không thể hoàn tác sau khi thực thi.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-100 cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={doDelete}
              disabled={busyId !== null}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {busyId !== null ? "Đang xóa..." : "Xác Nhận Xóa Vĩnh Viễn"}
            </button>
          </div>
        </div>
      )}

      {/* KHỐI XEM CHI TIẾT & SƠ ĐỒ NHÁNH CÚP INLINE (ZERO-MODAL) */}
      {selectedTournament && (
        <div
          id="admin-tournament-detail-inline"
          className="rounded-2xl bg-white border border-slate-300 p-5 shadow-sm space-y-5 animate-fade-in"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    Sơ Đồ Nhánh Cúp: {selectedTournament.title}
                  </h3>
                  <StatusBadge tone={STATUS_TONE[selectedTournament.status ?? ""] ?? "slate"}>
                    {STATUS_LABEL[selectedTournament.status ?? ""] ?? selectedTournament.status}
                  </StatusBadge>
                </div>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Giám sát tiến độ giải đấu, thể thức thi đấu và các đội bóng hạt giống tham gia tranh cúp.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTournament(null)}
              className="text-slate-400 hover:text-slate-700 text-[13px] font-bold cursor-pointer"
            >
              Đóng lại
            </button>
          </div>

          {/* 3 Thẻ tóm tắt thông số giải */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-[13px]">
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Thông Tin Thi Đấu:</span>
              <p className="text-slate-900 font-bold">
                Môn: {sportLabel(selectedTournament.sportType)} • Thể thức:{" "}
                {selectedTournament.format === "ROUND_ROBIN" ? "Vòng tròn" : "Loại trực tiếp (Knockout)"}
              </p>
              <p className="text-slate-600">
                Địa điểm: <strong>{selectedTournament.pitchName || selectedTournament.location || "Đà Nẵng"}</strong>
              </p>
              <p className="text-slate-500 text-[12px]">
                Thời gian: {formatDate(selectedTournament.startDate)} — {formatDate(selectedTournament.endDate)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Tài Chính Giải Đấu:</span>
              <p className="text-slate-900">
                Tổng giải thưởng:{" "}
                <strong className="font-mono text-slate-900 font-black">
                  {formatMoney(selectedTournament.prizePool)}
                </strong>
              </p>
              <p className="text-slate-600">
                Lệ phí tham gia:{" "}
                <strong className="font-mono">
                  {selectedTournament.entryFee
                    ? `${selectedTournament.entryFee.toLocaleString("vi-VN")}đ/đội`
                    : "Miễn phí"}
                </strong>
              </p>
              <p className="text-slate-500 text-[12px]">
                Tài khoản BTC: {selectedTournament.bankCode || "MBBank"} - {selectedTournament.bankAccount || "0987654321"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Số Lượng Đội Tham Dự:</span>
              <p className="text-slate-900 font-bold">
                {registeredCount(selectedTournament)} / {selectedTournament.totalTeams ?? 8} đội đã ghi danh
              </p>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-1">
                <div
                  className="bg-slate-900 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (registeredCount(selectedTournament) /
                          (selectedTournament.totalTeams || 8)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
              <p className="text-slate-500 text-[12px] mt-1">
                Hạn chót đăng ký: {formatDate(selectedTournament.registrationDeadline)}
              </p>
            </div>
          </div>

          {/* TRỰC QUAN HÓA SƠ ĐỒ NHÁNH CÚP KNOCKOUT BRACKET PREVIEW */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-bold text-slate-900 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-slate-700" />
                Sơ Đồ Phân Nhánh Cúp (Knockout Bracket Tree)
              </h4>
              <span className="text-[12px] text-slate-500">
                Thể thức loại trực tiếp 8 đội tranh cúp vô địch
              </span>
            </div>

            {/* Khung vẽ nhánh cúp trực quan */}
            <div className="overflow-x-auto pb-4 scrollbar-thin">
              <div className="min-w-[700px] grid grid-cols-3 gap-6 items-center bg-slate-50/70 border border-slate-200 rounded-xl p-5">
                {/* Vòng Tứ Kết (Quarter-Finals) */}
                <div className="space-y-4">
                  <div className="text-center font-bold text-[12px] text-slate-500 pb-1 border-b border-slate-200">
                    VÒNG TỨ KẾT (4 CẶP ĐẤU)
                  </div>

                  {/* Trận 1 */}
                  <div className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-2xs space-y-1.5 text-[12px]">
                    <div className="flex justify-between items-center text-slate-900 font-bold">
                      <span>FC Hải Châu 1</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">3</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>FC Thanh Khê</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">1</span>
                    </div>
                  </div>

                  {/* Trận 2 */}
                  <div className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-2xs space-y-1.5 text-[12px]">
                    <div className="flex justify-between items-center text-slate-900 font-bold">
                      <span>FC Cẩm Lệ Pro</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">2</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>FC Sơn Trà</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">0</span>
                    </div>
                  </div>

                  {/* Trận 3 */}
                  <div className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-2xs space-y-1.5 text-[12px]">
                    <div className="flex justify-between items-center text-slate-900 font-bold">
                      <span>FC Liên Chiểu</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">4</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>FC Hòa Vang</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">2</span>
                    </div>
                  </div>

                  {/* Trận 4 */}
                  <div className="rounded-xl bg-white border border-slate-200 p-2.5 shadow-2xs space-y-1.5 text-[12px]">
                    <div className="flex justify-between items-center text-slate-900 font-bold">
                      <span>FC Ngũ Hành Sơn</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">1 (4)</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>FC Bách Khoa</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">1 (2)</span>
                    </div>
                  </div>
                </div>

                {/* Vòng Bán Kết (Semi-Finals) */}
                <div className="space-y-12">
                  <div className="text-center font-bold text-[12px] text-slate-500 pb-1 border-b border-slate-200">
                    VÒNG BÁN KẾT
                  </div>

                  {/* Bán kết 1 */}
                  <div className="rounded-xl bg-white border border-slate-300 p-3 shadow-xs space-y-2 text-[12px]">
                    <div className="flex justify-between items-center text-slate-900 font-bold">
                      <span>FC Hải Châu 1</span>
                      <span className="font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded">2</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>FC Cẩm Lệ Pro</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">1</span>
                    </div>
                  </div>

                  {/* Bán kết 2 */}
                  <div className="rounded-xl bg-white border border-slate-300 p-3 shadow-xs space-y-2 text-[12px]">
                    <div className="flex justify-between items-center text-slate-900 font-bold">
                      <span>FC Liên Chiểu</span>
                      <span className="font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded">3</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>FC Ngũ Hành Sơn</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">0</span>
                    </div>
                  </div>
                </div>

                {/* Trận Chung Kết & Cúp Vô Địch (Final & Trophy) */}
                <div className="space-y-6">
                  <div className="text-center font-bold text-[12px] text-slate-500 pb-1 border-b border-slate-200">
                    CHUNG KẾT TRANH CÚP 🏆
                  </div>

                  <div className="rounded-2xl bg-white border-2 border-slate-900 p-4 shadow-md space-y-3 text-[13px]">
                    <div className="text-center font-black text-slate-900 text-[14px]">
                      TRẬN CHUNG KẾT
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-slate-900 font-extrabold">
                        <span>FC Hải Châu 1</span>
                        <span className="font-mono bg-slate-900 text-white px-2 py-0.5 rounded-md text-sm">
                          ?
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-900 font-extrabold">
                        <span>FC Liên Chiểu</span>
                        <span className="font-mono bg-slate-900 text-white px-2 py-0.5 rounded-md text-sm">
                          ?
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-center">
                      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-600">
                        🏆 Nhà vô địch nhận {formatMoney(selectedTournament.prizePool)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KHỐI BẢNG DANH MỤC GIẢI ĐẤU */}
      <SectionCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-black text-slate-900 text-base">Quản Lý Giải Đấu Phong Trào</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Giám sát sơ đồ phân nhánh cúp, đối soát lệ phí và đóng/mở đăng ký giải đấu.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            Tải Lại
          </button>
        </div>

        {/* Thanh lọc trạng thái giải */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin mb-3">
          {[
            { id: "ALL", label: "Tất Cả Giải" },
            { id: "OPEN", label: "Đang Mở (OPEN)" },
            { id: "ONGOING", label: "Đang Diễn Ra (ONGOING)" },
            { id: "COMPLETED", label: "Đã Kết Thúc (COMPLETED)" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AdminTable
          rows={filteredRows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          searchPlaceholder="Tìm theo tên giải, địa điểm, môn thi đấu…"
          searchFilter={(r, q) =>
            [r.title, r.location ?? "", r.pitchName ?? "", r.sportType ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(q)
          }
          emptyTitle="Chưa có giải đấu nào phù hợp."
        />
      </SectionCard>
    </div>
  );
}
