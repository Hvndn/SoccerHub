"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  Sparkles,
  Eraser,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
} from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { SectionCard, StatusBadge } from "./AdminUI";
import {
  listAdminBookings,
  simulateBookings,
  clearSimulatedBookings,
  adminCancelBooking,
  type AdminBooking,
} from "@/lib/adminService";
import { pitchTypeLabel } from "@/lib/pitchLabels";
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

const PRESET_REASONS = [
  "Chủ sân huỷ ca đột xuất do thời tiết bất khả kháng",
  "Sân bóng ngập nước / sự cố đèn chiếu sáng",
  "Khách khiếu nại ca sân bị trùng lịch với giải đấu",
  "Lỗi cổng đối soát chuyển khoản VietQR Napas",
  "Chủ sân và khách đồng thuận hủy ca & hoàn cọc",
];

export default function AdminBookings({
  notify,
}: {
  notify: (type: "ok" | "err", text: string) => void;
}) {
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [simBusy, setSimBusy] = useState<"gen" | "clear" | null>(null);
  const [perDay, setPerDay] = useState(6);

  // Trạng thái Trọng tài khiếu nại & hoàn cọc (INLINE Zero-Modal)
  const [disputeBooking, setDisputeBooking] = useState<AdminBooking | null>(null);
  const [disputeReason, setDisputeReason] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

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
      const data = await apiRequest<AdminBooking[]>(
        `/api/v1/pitches/bookings/search?query=${encodeURIComponent(q)}`
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      notify("err", err?.message || "Tra cứu thất bại.");
    } finally {
      setSearching(false);
    }
  };

  /** Xử lý hoàn cọc & hủy đơn cưỡng chế từ Admin (Arbitration Action) */
  const handleConfirmDispute = async () => {
    if (!disputeBooking) return;
    setCancelling(true);
    const finalReason = customReason.trim() ? customReason.trim() : disputeReason;
    try {
      const res = await adminCancelBooking(disputeBooking.id, finalReason);
      notify(
        "ok",
        `${res.message} (Số tiền hoàn: ${(res.refundAmount || 0).toLocaleString("vi-VN")}đ)`
      );
      // Cập nhật dòng trên giao diện trực tiếp
      setRows((prev) =>
        prev.map((b) =>
          b.id === disputeBooking.id
            ? {
                ...b,
                status: "CANCELLED",
                cancelReason: finalReason,
                cancelledBy: "ADMIN",
              }
            : b
        )
      );
      setDisputeBooking(null);
      setCustomReason("");
    } catch (err: any) {
      notify("err", err?.message || "Thao tác hủy đơn và hoàn cọc thất bại.");
    } finally {
      setCancelling(false);
    }
  };

  /** Sinh dữ liệu demo */
  const runSimulate = async () => {
    try {
      setSimBusy("gen");
      const res = await simulateBookings({ pastDays: 14, futureDays: 7, perDay });
      notify(
        "ok",
        `${res.message} Doanh thu đã thu: ${(res.settledRevenue ?? 0).toLocaleString("vi-VN")}đ`
      );
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

  // Lọc dữ liệu theo trạng thái
  const filteredRows = rows.filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  const columns: AdminColumn<AdminBooking>[] = [
    {
      key: "id",
      header: "Mã đơn",
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => (
        <div>
          <p className="font-mono font-bold text-slate-900">{r.code || `#${r.id}`}</p>
          <p className="text-[12px] font-mono text-slate-400">
            {r.createdAt ? String(r.createdAt).slice(0, 16).replace("T", " ") : ""}
          </p>
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
          <p className="font-bold text-slate-900">{r.customerName}</p>
          <p className="text-[12px] font-mono text-slate-500">{r.customerPhone}</p>
          {(r.isClubBooking || r.clubName || (r.via && r.via.includes("CLB"))) && (
            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[12px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              🛡️ CLB Bao Sân{r.clubName ? `: ${r.clubName}` : ""}
            </span>
          )}
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
          <p className="font-bold text-slate-900">{pitchTypeLabel(r.courtName) || r.courtName}</p>
          <p className="text-[12px] text-slate-500 font-mono">
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
        <span className="font-mono font-bold text-slate-900">
          {(r.depositPaid ?? 0).toLocaleString("vi-VN")}đ
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      sortable: true,
      sortValue: (r) => r.status ?? "",
      render: (r) => (
        <div className="space-y-0.5">
          <StatusBadge tone={STATUS_TONE[r.status ?? ""] ?? "slate"}>
            {STATUS_LABEL[r.status ?? ""] ?? r.status}
          </StatusBadge>
          {r.cancelledBy === "ADMIN" && (
            <p className="text-[11px] font-semibold text-rose-600">Admin đã huỷ & hoàn cọc</p>
          )}
        </div>
      ),
    },
    {
      key: "action",
      header: "Trọng tài",
      render: (r) => {
        const canCancel = r.status === "BOOKED" || r.status === "PLAYING";
        if (!canCancel) {
          return (
            <span className="text-[12px] text-slate-400">
              {r.status === "CANCELLED" ? "Đã giải quyết" : "Không áp dụng"}
            </span>
          );
        }
        return (
          <button
            type="button"
            onClick={() => {
              setDisputeBooking(r);
              // Cuộn mượt tới khu vực trọng tài inline
              setTimeout(() => {
                document
                  .getElementById("admin-dispute-panel")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 50);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Xử lý tranh chấp hoặc khiếu nại hoàn cọc"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-slate-700" />
            <span>Xử Lý Khiếu Nại</span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* KHỐI TRỌNG TÀI KHIẾU NẠI & HOÀN CỌC (INLINE ZERO-MODAL) */}
      {disputeBooking && (
        <div
          id="admin-dispute-panel"
          className="rounded-2xl bg-white border border-slate-300 p-5 shadow-sm space-y-4 animate-fade-in"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Trung Tâm Trọng Tài & Hoàn Cọc Đơn #{disputeBooking.id}
                </h3>
                <p className="text-[13px] text-slate-500">
                  Can thiệp hủy đơn cưỡng chế và kích hoạt lệnh hoàn tiền cọc bảo vệ quyền lợi người chơi.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDisputeBooking(null)}
              className="text-slate-400 hover:text-slate-700 text-[13px] font-bold cursor-pointer"
            >
              Đóng lại
            </button>
          </div>

          {/* Chi tiết đơn tranh chấp */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl text-[13px]">
            <div>
              <span className="block text-slate-400 font-medium">Khách hàng:</span>
              <span className="font-bold text-slate-900">{disputeBooking.customerName}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Số điện thoại:</span>
              <span className="font-mono font-bold text-slate-900">
                {disputeBooking.customerPhone}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Ca sân thi đấu:</span>
              <span className="font-bold text-slate-900">
                {disputeBooking.bookingDate} ({disputeBooking.timeSlot})
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Tiền cọc hoàn trả:</span>
              <span className="font-mono font-black text-emerald-700 text-sm">
                {(disputeBooking.depositPaid ?? 0).toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>

          {/* Chọn lý do khiếu nại */}
          <div className="space-y-3">
            <label className="block text-[13px] font-bold text-slate-800">
              Lý do hủy đơn & hoàn cọc:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setDisputeReason(reason);
                    setCustomReason("");
                  }}
                  className={`px-3 py-2 rounded-xl text-left text-[13px] border transition-all cursor-pointer ${
                    disputeReason === reason && !customReason
                      ? "bg-slate-900 text-white border-slate-900 font-bold"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
                >
                  {reason}
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
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDisputeBooking(null)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-bold transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmDispute}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RotateCcw className={`w-4 h-4 ${cancelling ? "animate-spin" : ""}`} />
              <span>
                {cancelling ? "Đang xử lý hoàn cọc..." : "Xác Nhận Hủy Đơn & Kích Hoạt Hoàn Cọc"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* KHỐI BẢNG ĐƠN ĐẶT SÂN & DOANH THU */}
      <SectionCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-black text-slate-900 text-base">Đơn Đặt Sân & Đối Soát Cọc</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Tra cứu mã vé, kiểm tra trạng thái và xử lý trọng tài khi có khiếu nại giữa Chủ sân và
              Cầu thủ.
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
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-[13px] focus:outline-none focus:ring-1 focus:ring-slate-400 w-48 sm:w-56 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {searching ? "Đang tìm…" : "Tra Cứu"}
            </button>
          </form>
        </div>

        {/* Thanh lọc trạng thái nhanh */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {[
            { id: "ALL", label: "Tất Cả Đơn" },
            { id: "BOOKED", label: "Đã Cọc (BOOKED)" },
            { id: "PLAYING", label: "Đang Đá (PLAYING)" },
            { id: "CANCELLED", label: "Đã Hủy / Hoàn Cọc" },
            { id: "COMPLETED", label: "Hoàn Tất" },
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

        {/* Bảng dữ liệu đơn đặt sân */}
        <AdminTable
          rows={filteredRows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          searchPlaceholder="Lọc nhanh trong danh sách…"
          searchFilter={(r, q) =>
            [r.customerName, r.customerPhone, r.code ?? "", r.courtName]
              .join(" ")
              .toLowerCase()
              .includes(q)
          }
          emptyTitle="Chưa có đơn đặt sân nào."
        />

        {/* Bộ công cụ sinh & dọn dẹp dữ liệu giả lập */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3.5">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-600" />
              Công Cụ Mô Phỏng & Kiểm Thử Dữ Liệu
            </p>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Sinh đơn giả lập (mã SIM-*) 21 ngày để kiểm tra dòng tiền và lịch sân của đối tác mà
              không ảnh hưởng đơn thật.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
              <span className="hidden sm:inline">Số đơn/ngày:</span>
              <input
                type="number"
                min={1}
                max={30}
                value={perDay}
                onChange={(e) => setPerDay(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                aria-label="Số đơn giả lập mỗi ngày"
                className="w-12 px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-900 text-[12px] font-bold text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </label>
            <button
              type="button"
              onClick={runSimulate}
              disabled={simBusy !== null}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {simBusy === "gen" ? "Đang tạo…" : "Tạo Đơn Test"}
            </button>
            <button
              type="button"
              onClick={runClearSim}
              disabled={simBusy !== null}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[12px] font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Eraser className="w-3.5 h-3.5" />
              {simBusy === "clear" ? "Đang xóa…" : "Xóa Đơn Test"}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
