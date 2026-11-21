"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Trash2,
  ShieldAlert,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Phone,
  Calendar,
  Flame,
} from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { SectionCard, StatusBadge } from "./AdminUI";
import {
  deleteMatchmakingPost,
  listMatchmakingPosts,
  type MatchmakingPost,
} from "@/lib/adminService";
import { formatMoney } from "@/lib/tournamentService";

const STATUS_TONE: Record<string, "green" | "amber" | "rose" | "sky" | "slate"> = {
  OPEN: "green",
  MATCHED: "sky",
  CANCELLED: "slate",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Đang mở",
  MATCHED: "Đã ghép",
  CANCELLED: "Đã hủy",
};

const VIOLATION_PRESETS = [
  "Chứa nội dung cá cược, tỷ lệ kèo độ trái phép",
  "Ngôn từ thô tục, khiêu khích hoặc công kích đối thủ",
  "Dấu hiệu gian lận, cày điểm ELO dàn xếp tỷ số",
  "Spam tin đăng ảo, số điện thoại liên hệ không có thực",
];

export default function AdminModeration({
  notify,
}: {
  notify: (type: "ok" | "err", text: string) => void;
}) {
  const [rows, setRows] = useState<MatchmakingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmDelete, setConfirmDelete] = useState<MatchmakingPost | null>(null);
  const [selectedReason, setSelectedReason] = useState(VIOLATION_PRESETS[0]);
  const [customReason, setCustomReason] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await listMatchmakingPosts());
    } catch (err: any) {
      notify("err", err?.message || "Không tải được tin chợ kèo.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      setBusyId(confirmDelete.id);
      const res = await deleteMatchmakingPost(confirmDelete.id);
      notify("ok", res.message || "Đã gỡ bài đăng vi phạm khỏi chợ kèo.");
      setConfirmDelete(null);
      setCustomReason("");
      await load();
    } catch (err: any) {
      notify("err", err?.message || "Gỡ bài thất bại. Cần đăng nhập tài khoản ADMIN.");
    } finally {
      setBusyId(null);
    }
  };

  const filteredRows = rows.filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  const columns: AdminColumn<MatchmakingPost>[] = [
    {
      key: "id",
      header: "Mã",
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => <span className="font-mono font-bold text-slate-500">#{r.id}</span>,
    },
    {
      key: "team",
      header: "Tin đăng & Địa điểm",
      sortable: true,
      sortValue: (r) => r.teamName ?? "",
      render: (r) => (
        <div className="max-w-[260px]">
          <p className="font-bold text-slate-900 truncate">{r.teamName}</p>
          <p className="text-[12px] text-slate-500 truncate mt-0.5">
            {r.pitchName} • {r.matchTime}
          </p>
          {r.note && (
            <p className="text-[12px] text-slate-600 truncate italic mt-0.5">
              “{r.note}”
            </p>
          )}
        </div>
      ),
    },
    {
      key: "elo",
      header: "Xếp hạng ELO",
      sortable: true,
      sortValue: (r) => r.eloRating ?? 1200,
      render: (r) => (
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-mono font-bold bg-slate-100 text-slate-800">
            <Flame className="w-3 h-3 text-slate-700" />
            {r.eloRating ?? 1200} ELO
          </span>
          <p className="text-[11px] text-slate-400">
            {r.form ? `Form: ${r.form}` : "Chưa có chuỗi"}
          </p>
        </div>
      ),
    },
    {
      key: "captain",
      header: "Đội trưởng & SĐT",
      render: (r) => (
        <div>
          <p className="font-bold text-slate-800 text-[13px]">{r.captainName || "—"}</p>
          <p className="text-[12px] font-mono text-slate-500">{r.captainPhone || "—"}</p>
          <p className="text-[11px] font-medium text-slate-400">
            {r.record && r.record !== "0-0-0" ? `${r.record} (${r.winRate ?? 0}% W)` : "Tân binh"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      sortable: true,
      sortValue: (r) => r.status ?? "",
      render: (r) => (
        <div className="space-y-1">
          <StatusBadge tone={STATUS_TONE[r.status ?? ""] ?? "slate"}>
            {STATUS_LABEL[r.status ?? ""] ?? r.status}
          </StatusBadge>
          <p className="text-[12px] font-mono font-bold text-slate-700">
            {formatMoney((r as any).estimatedFee)}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Kiểm duyệt",
      render: (r) => (
        <button
          type="button"
          title={`Gỡ bài của ${r.teamName}`}
          disabled={busyId === r.id}
          onClick={() => {
            setConfirmDelete(r);
            setTimeout(() => {
              document
                .getElementById("admin-moderation-confirm-inline")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 50);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-rose-600 hover:bg-slate-50 text-[12px] font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Gỡ Bài</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* KHỐI XÁC NHẬN GỠ BÀI INLINE (ZERO-MODAL) */}
      {confirmDelete && (
        <div
          id="admin-moderation-confirm-inline"
          className="rounded-2xl bg-white border border-slate-300 p-5 shadow-sm space-y-4 animate-fade-in"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Gỡ Bài Đăng Chợ Kèo Vi Phạm: {confirmDelete.teamName}
                </h3>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Bài đăng sẽ bị xóa khỏi chợ kèo công khai và gửi thông báo cảnh cáo tới đội trưởng.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="text-slate-400 hover:text-slate-700 text-[13px] font-bold cursor-pointer"
            >
              Đóng lại
            </button>
          </div>

          {/* Chi tiết bài đăng */}
          <div className="bg-slate-50 p-3.5 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
            <div>
              <span className="text-slate-400 block font-medium">Đội bóng:</span>
              <span className="font-bold text-slate-900">{confirmDelete.teamName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Sân & Thời gian:</span>
              <span className="font-bold text-slate-800">
                {confirmDelete.pitchName} ({confirmDelete.matchTime})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Liên hệ đội trưởng:</span>
              <span className="font-bold text-slate-800 font-mono">
                {confirmDelete.captainName} - {confirmDelete.captainPhone}
              </span>
            </div>
          </div>

          {/* Chọn lý do gỡ bài */}
          <div className="space-y-2.5">
            <label className="block text-[13px] font-bold text-slate-800">
              Lý do gỡ bài đăng vi phạm:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VIOLATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelectedReason(preset);
                    setCustomReason("");
                  }}
                  className={`px-3 py-2 rounded-xl text-left text-[13px] border transition-all cursor-pointer ${
                    selectedReason === preset && !customReason
                      ? "bg-slate-900 text-white border-slate-900 font-bold"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Hoặc nhập lý do can thiệp riêng của Quản trị viên..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-[13px] focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
            />
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-bold transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={doDelete}
              disabled={busyId !== null}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>{busyId !== null ? "Đang gỡ bài..." : "Xác Nhận Gỡ Bài Khỏi Chợ Kèo"}</span>
            </button>
          </div>
        </div>
      )}

      {/* KHỐI BẢNG DANH MỤC TIN CHỢ KÈO */}
      <SectionCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-black text-slate-900 text-base">Kiểm Duyệt Bài Đăng Chợ Kèo</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Rà soát tin đăng giao hữu, phát hiện gian lận cày điểm ELO và bảo vệ môi trường bóng đá lành mạnh.
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

        {/* Thanh lọc trạng thái tin */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin mb-3">
          {[
            { id: "ALL", label: "Tất Cả Tin" },
            { id: "OPEN", label: "Đang Mở (OPEN)" },
            { id: "MATCHED", label: "Đã Ghép (MATCHED)" },
            { id: "CANCELLED", label: "Đã Hủy (CANCELLED)" },
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
          searchPlaceholder="Tìm theo tên đội, sân, SĐT…"
          searchFilter={(r, q) =>
            [r.teamName, r.pitchName, r.captainName ?? "", r.captainPhone ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(q)
          }
          emptyTitle="Chợ kèo đang trống."
        />
      </SectionCard>
    </div>
  );
}
