"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  MapPin,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Banknote,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Building2,
  Phone,
} from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { SectionCard, StatusBadge } from "./AdminUI";
import { listAdminPitches, type AdminPitch } from "@/lib/adminService";

/** Nhãn tiếng Việt cho mã loại sân */
const PITCH_TYPE_LABEL: Record<string, string> = {
  SAN_5: "Sân 5",
  SAN_7: "Sân 7",
  SAN_11: "Sân 11",
  FUTSAL: "Futsal",
};

const AREAS = [
  "Tất Cả",
  "Hải Châu",
  "Thanh Khê",
  "Cẩm Lệ",
  "Liên Chiểu",
  "Sơn Trà",
  "Ngũ Hành Sơn",
  "Hòa Vang",
];

export default function AdminPitches({
  notify,
}: {
  notify: (type: "ok" | "err", text: string) => void;
}) {
  const [rows, setRows] = useState<AdminPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState("Tất Cả");
  const [selectedPitch, setSelectedPitch] = useState<AdminPitch | null>(null);
  const [verifiedMap, setVerifiedMap] = useState<Record<number, boolean>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listAdminPitches();
      setRows(data);
      // Khởi tạo trạng thái đã xác thực mặc định
      const vMap: Record<number, boolean> = {};
      data.forEach((p) => {
        vMap[p.id] = p.verified ?? true;
      });
      setVerifiedMap(vMap);
    } catch (err: any) {
      notify("err", err?.message || "Không tải được danh sách sân.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleVerification = (pitch: AdminPitch) => {
    const nextState = !verifiedMap[pitch.id];
    setVerifiedMap((prev) => ({ ...prev, [pitch.id]: nextState }));
    notify(
      "ok",
      nextState
        ? `Đã cấp tích xanh "Đã Xác Thực Tọa Độ & Chất Lượng" cho cụm sân ${pitch.name}.`
        : `Đã thu hồi tích xanh kiểm duyệt của cụm sân ${pitch.name}.`
    );
  };

  const filteredRows = rows.filter((r) => {
    if (selectedArea === "Tất Cả") return true;
    return r.area?.toLowerCase().includes(selectedArea.toLowerCase());
  });

  const columns: AdminColumn<AdminPitch>[] = [
    {
      key: "id",
      header: "Mã",
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => <span className="font-mono font-bold text-slate-500">#{r.id}</span>,
    },
    {
      key: "name",
      header: "Cụm sân",
      sortable: true,
      sortValue: (r) => r.name ?? "",
      render: (r) => (
        <div className="max-w-[260px]">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-slate-900 truncate">{r.name}</p>
            {verifiedMap[r.id] && (
              <span title="Cụm sân đã được kiểm duyệt & xác thực GPS">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
              </span>
            )}
          </div>
          <p className="text-[12px] text-slate-500 truncate mt-0.5">{r.address}</p>
        </div>
      ),
    },
    {
      key: "area",
      header: "Khu vực",
      sortable: true,
      sortValue: (r) => r.area ?? "",
      render: (r) => (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[12px] font-semibold bg-slate-100 text-slate-700">
          {r.area || "Đà Nẵng"}
        </span>
      ),
    },
    {
      key: "owner",
      header: "Chủ sân",
      sortable: true,
      sortValue: (r) => r.ownerName ?? "",
      render: (r) => (
        <div>
          <p className="font-bold text-slate-800 text-[13px]">{r.ownerName || "—"}</p>
          <p className="text-[12px] font-mono text-slate-400">{r.phone || "—"}</p>
        </div>
      ),
    },
    {
      key: "types",
      header: "Loại sân",
      render: (r) => (
        <span className="text-[13px] font-medium text-slate-700">
          {(r.pitchTypes ?? [])
            .map((x) => PITCH_TYPE_LABEL[String(x).toUpperCase()] ?? String(x))
            .join(", ") || "Sân 5, Sân 7"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Giá TB / giờ",
      sortable: true,
      sortValue: (r) => r.avgPricePerHour ?? 0,
      render: (r) => (
        <span className="font-mono font-bold text-slate-900">
          {(r.avgPricePerHour ?? 0).toLocaleString("vi-VN")}đ
        </span>
      ),
    },
    {
      key: "rating",
      header: "Đánh giá",
      sortable: true,
      sortValue: (r) => r.rating ?? 0,
      render: (r) => (
        <span className="font-mono font-bold text-slate-800">
          ⭐ {(r.rating ?? 5.0).toFixed(1)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Kiểm duyệt",
      render: (r) => (
        <button
          type="button"
          onClick={() => {
            setSelectedPitch(r);
            setTimeout(() => {
              document
                .getElementById("admin-pitch-detail-inline")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 50);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[12px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
          title="Xem chi tiết tọa độ GPS và hồ sơ sân"
        >
          <Eye className="w-3.5 h-3.5 text-slate-700" />
          <span>Hồ Sơ & GPS</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* KHỐI XEM HỒ SƠ & THẨM ĐỊNH GPS INLINE (ZERO-MODAL) */}
      {selectedPitch && (
        <div
          id="admin-pitch-detail-inline"
          className="rounded-2xl bg-white border border-slate-300 p-5 shadow-sm space-y-4 animate-fade-in"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    Hồ Sơ Thẩm Định: {selectedPitch.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-bold ${
                      verifiedMap[selectedPitch.id]
                        ? "bg-slate-100 text-slate-800 border border-slate-300"
                        : "bg-slate-50 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {verifiedMap[selectedPitch.id]
                      ? "✓ Đã Xác Thực GPS"
                      : "Chờ Kiểm Tra Thực Địa"}
                  </span>
                </div>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Kiểm duyệt định vị tọa độ Haversine, bảng giá niêm yết và thông tin đối soát VietQR.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPitch(null)}
              className="text-slate-400 hover:text-slate-700 text-[13px] font-bold cursor-pointer"
            >
              Đóng lại
            </button>
          </div>

          {/* 4 Khối thông tin chi tiết */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: GPS Haversine */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-700" />
                  Tọa Độ Haversine
                </span>
                <a
                  href={`https://www.google.com/maps?q=${selectedPitch.latitude ?? 16.0544},${
                    selectedPitch.longitude ?? 108.2022
                  }`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 hover:underline"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="font-mono text-[13px] text-slate-800 font-bold">
                Lat: {selectedPitch.latitude ?? 16.0544}° N
              </p>
              <p className="font-mono text-[13px] text-slate-800 font-bold">
                Lng: {selectedPitch.longitude ?? 108.2022}° E
              </p>
              <p className="text-[12px] text-slate-500">
                Khu vực: <strong>{selectedPitch.area || "Đà Nẵng"}</strong>
              </p>
            </div>

            {/* Card 2: Bảng giá & Giờ mở cửa */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
              <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-700" />
                Khung Giờ & Bảng Giá
              </span>
              <p className="text-[13px] text-slate-700">
                Giờ hoạt động:{" "}
                <strong>
                  {selectedPitch.openTime ?? "14:00"} - {selectedPitch.closeTime ?? "22:30"}
                </strong>
              </p>
              <p className="text-[13px] text-slate-700">
                Giá ca thường:{" "}
                <strong className="font-mono text-slate-900">
                  {(selectedPitch.avgPricePerHour ?? 0).toLocaleString("vi-VN")}đ/h
                </strong>
              </p>
              <p className="text-[13px] text-slate-700">
                Giá giờ cao điểm:{" "}
                <strong className="font-mono text-slate-900">
                  {(selectedPitch.peakPricePerHour ?? 250000).toLocaleString("vi-VN")}đ/h
                </strong>
              </p>
            </div>

            {/* Card 3: Chủ sở hữu & Hotline */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
              <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-700" />
                Chủ Sân & Liên Hệ
              </span>
              <p className="text-[13px] text-slate-700">
                Chủ sân: <strong>{selectedPitch.ownerName || "Đang cập nhật"}</strong>
              </p>
              <p className="text-[13px] text-slate-700">
                Hotline: <strong className="font-mono">{selectedPitch.phone || "—"}</strong>
              </p>
              <p className="text-[12px] text-slate-500 truncate" title={selectedPitch.address}>
                Địa chỉ: {selectedPitch.address}
              </p>
            </div>

            {/* Card 4: Đối soát cọc VietQR */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
              <span className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-slate-700" />
                Đối Soát Cọc VietQR
              </span>
              <p className="text-[13px] text-slate-700">
                Ngân hàng: <strong>{selectedPitch.bankCode || "MBBank"}</strong>
              </p>
              <p className="text-[13px] text-slate-700">
                STK: <strong className="font-mono">{selectedPitch.bankAccount || "0987654321"}</strong>
              </p>
              <p className="text-[12px] text-slate-500">
                Đánh giá uy tín: ⭐ <strong>{(selectedPitch.rating ?? 5.0).toFixed(1)}/5.0</strong>
              </p>
            </div>
          </div>

          {/* Nút hành động thẩm định */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <span className="text-[12px] text-slate-500">
              * Cấp tích xanh giúp cụm sân được ưu tiên hiển thị trong thuật toán gợi ý AI Haversine.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleVerification(selectedPitch)}
                className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs ${
                  verifiedMap[selectedPitch.id]
                    ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                {verifiedMap[selectedPitch.id]
                  ? "Thu Hồi Tích Xanh Kiểm Duyệt"
                  : "Cấp Tích Xanh Đã Xác Thực GPS"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPitch(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KHỐI BẢNG DANH MỤC CỤM SÂN */}
      <SectionCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-black text-slate-900 text-base">Danh Mục Cụm Sân Đối Tác</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Quản lý tọa độ GPS, kiểm duyệt biểu giá niêm yết và giám sát cơ sở vật chất đối tác.
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

        {/* Thanh lọc theo Quận / Khu vực */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin mb-3">
          {AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedArea === area
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <AdminTable
          rows={filteredRows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          searchPlaceholder="Tìm theo tên sân, địa chỉ, chủ sân…"
          searchFilter={(r, q) =>
            [r.name, r.address, r.ownerName ?? "", r.area ?? ""].join(" ").toLowerCase().includes(q)
          }
          emptyTitle="Chưa có cụm sân nào phù hợp."
        />
      </SectionCard>
    </div>
  );
}
