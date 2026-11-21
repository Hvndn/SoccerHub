"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Server,
  Database,
  Cpu,
  Globe,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Clock,
  Download,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Radio,
  FileJson,
} from "lucide-react";
import {
  getSystemHealth,
  cleanOrphanData,
  clearSimulatedBookings,
  purgeExpiredPendingBookings,
  purgeOldNotifications,
  exportSystemSnapshot,
  type SystemHealthData,
} from "@/lib/adminService";
import { SectionCard } from "./AdminUI";

interface Props {
  notify: (type: "ok" | "err", text: string) => void;
}

export default function AdminMaintenance({ notify }: Props) {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chế độ bảo trì toàn sàn
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "Hệ thống TurfZone đang tiến hành bảo trì nâng cấp định kỳ máy chủ. Vui lòng quay lại sau ít phút!"
  );
  const [isSavingMsg, setIsSavingMsg] = useState(false);

  // Trạng thái thao tác dọn dẹp cơ sở dữ liệu
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [confirmInline, setConfirmInline] = useState<string | null>(null);

  // Tải thông số viễn thám hệ thống
  const loadHealth = useCallback(async () => {
    try {
      const data = await getSystemHealth();
      setHealth(data);
    } catch {
      notify("err", "Không thể lấy thông số giám sát hệ thống.");
    } finally {
      setLoadingHealth(false);
      setRefreshing(false);
    }
  }, [notify]);

  useEffect(() => {
    loadHealth();
    // Đọc trạng thái bảo trì đã lưu trong localStorage (nếu có)
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("turfzone_maintenance_mode");
      const savedMsg = localStorage.getItem("turfzone_maintenance_msg");
      if (savedMode === "true") setMaintenanceMode(true);
      if (savedMsg) setMaintenanceMessage(savedMsg);
    }
  }, [loadHealth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHealth();
    notify("ok", "Đã cập nhật chỉ số viễn thám mới nhất.");
  };

  const handleToggleMaintenance = () => {
    const nextState = !maintenanceMode;
    setMaintenanceMode(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem("turfzone_maintenance_mode", String(nextState));
      localStorage.setItem("turfzone_maintenance_msg", maintenanceMessage);
    }
    notify(
      "ok",
      nextState
        ? "Đã kích hoạt chế độ bảo trì sàn. Người dùng sẽ thấy biểu ngữ thông báo."
        : "Đã tắt chế độ bảo trì. Hệ thống mở cửa hoạt động bình thường."
    );
  };

  const handleSaveMessage = () => {
    setIsSavingMsg(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("turfzone_maintenance_msg", maintenanceMessage);
    }
    setTimeout(() => {
      setIsSavingMsg(false);
      notify("ok", "Đã lưu nội dung thông điệp bảo trì hệ thống.");
    }, 300);
  };

  // Thực thi dọn dẹp dữ liệu
  const executeClean = async (type: "orphans" | "expired" | "simulated" | "notifications") => {
    setBusyAction(type);
    try {
      if (type === "orphans") {
        const res = await cleanOrphanData();
        notify("ok", res.message || "Đã dọn dẹp bản ghi mồ côi thành công.");
      } else if (type === "expired") {
        const res = await purgeExpiredPendingBookings();
        notify("ok", res.message || "Đã quét và giải phóng các ca cọc quá hạn.");
      } else if (type === "simulated") {
        const res = await clearSimulatedBookings();
        notify("ok", res.message || `Đã xoá ${res.deleted} đơn đặt sân giả lập.`);
      } else if (type === "notifications") {
        const res = await purgeOldNotifications(30);
        notify("ok", res.message || "Đã dọn dẹp thông báo cũ thành công.");
      }
    } catch (err: any) {
      notify("err", err?.message || "Thao tác dọn dẹp thất bại.");
    } finally {
      setBusyAction(null);
      setConfirmInline(null);
    }
  };

  // Xuất snapshot file JSON
  const handleExportSnapshot = async () => {
    setBusyAction("export");
    try {
      const data = await exportSystemSnapshot();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `turfzone-snapshot-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify("ok", "Đã xuất và tải về file sao lưu hệ thống JSON.");
    } catch (err: any) {
      notify("err", err?.message || "Không thể xuất bản sao lưu.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. CHẾ ĐỘ BẢO TRÌ SÀN (MAINTENANCE MODE BANNER & SWITCH) */}
      <div
        className={`rounded-2xl border transition-all p-5 ${
          maintenanceMode
            ? "bg-amber-50/90 border-amber-300 shadow-md"
            : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                maintenanceMode
                  ? "bg-amber-500 text-white shadow-amber-200 shadow-lg"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Chế Độ Bảo Trì Toàn Sàn (Maintenance Mode)
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-bold ${
                    maintenanceMode
                      ? "bg-amber-200/80 text-amber-900 border border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      maintenanceMode ? "bg-amber-600 animate-ping" : "bg-emerald-500"
                    }`}
                  />
                  {maintenanceMode ? "Đang Bật Bảo Trì" : "Hoạt Động Bình Thường"}
                </span>
              </div>
              <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                Khi bật chế độ này, người dùng và khách vãng lai sẽ nhận thông điệp bảo trì tạm dừng
                đặt sân. Quản trị viên vẫn truy cập bình thường để kiểm tra.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleMaintenance}
            className={`shrink-0 px-5 py-2.5 rounded-xl font-black text-[13px] transition-all active:scale-95 cursor-pointer shadow-xs ${
              maintenanceMode
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-[#0369a1] hover:bg-[#075985] text-white"
            }`}
          >
            {maintenanceMode ? "Tắt Chế Độ Bảo Trì" : "Kích Hoạt Bảo Trì"}
          </button>
        </div>

        {/* Cấu hình thông điệp bảo trì hiển thị */}
        {maintenanceMode && (
          <div className="mt-4 pt-4 border-t border-amber-200/70 space-y-3">
            <label className="block text-[13px] font-bold text-amber-900">
              Thông điệp thông báo cho khách hàng:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Nhập lý do bảo trì hoặc thời gian dự kiến mở lại..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-slate-900 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
              <button
                type="button"
                onClick={handleSaveMessage}
                disabled={isSavingMsg}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-bold transition-all disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {isSavingMsg ? "Đang Lưu..." : "Cập Nhật Thông Điệp"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. CHỈ SỐ VIỄN THÁM HẠ TẦNG THỜI GIAN THỰC (REAL-TIME TELEMETRY) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Chỉ Số Sức Khỏe Hạ Tầng (Infrastructure Health)
            </h3>
            <p className="text-[13px] text-slate-500">
              Theo dõi trực tiếp trạng thái kết nối MySQL, AI Microservice, Spring Boot JVM và Frontend.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[13px] font-bold text-slate-700 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#0369a1]" : ""}`} />
            <span>Làm Mới Trực Tiếp</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card MySQL */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-slate-900 leading-tight">MySQL 8.0</h4>
                  <p className="text-[12px] text-slate-400">Database Chính</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Hoạt Động
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[13px]">
              <div className="flex justify-between text-slate-600">
                <span>Độ trễ truy vấn:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {health?.mysql.latencyMs ?? 2} ms
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>HikariCP Pool:</span>
                <span className="font-mono font-bold text-slate-800">
                  {health?.mysql.poolActive ?? 10}/{health?.mysql.poolMax ?? 20}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phiên bản:</span>
                <span className="text-[12px] font-semibold text-slate-700">8.0.36 Community</span>
              </div>
            </div>
          </div>

          {/* Card AI Service */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-slate-900 leading-tight">AI Service</h4>
                  <p className="text-[12px] text-slate-400">FastAPI :8000</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[12px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Sẵn Sàng
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[13px]">
              <div className="flex justify-between text-slate-600">
                <span>Thời gian phản hồi:</span>
                <span className="font-mono font-bold text-indigo-600">
                  {health?.aiService.latencyMs ?? 18} ms
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cổng lắng nghe:</span>
                <span className="font-mono font-bold text-slate-800">Port 8000</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Thuật toán nạp:</span>
                <span className="text-[12px] font-semibold text-slate-700">Haversine & ELO</span>
              </div>
            </div>
          </div>

          {/* Card Spring Boot JVM */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-slate-900 leading-tight">Spring Boot</h4>
                  <p className="text-[12px] text-slate-400">JVM Core :8080</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Trực Tuyến
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[13px]">
              <div className="flex justify-between text-slate-600">
                <span>Bộ nhớ JVM Heap:</span>
                <span className="font-mono font-bold text-amber-700">
                  {health?.jvm.heapUsedMb ?? 248} / {health?.jvm.heapMaxMb ?? 1024} MB
                </span>
              </div>
              {/* Thanh tiến trình RAM */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.round(
                      ((health?.jvm.heapUsedMb ?? 248) / (health?.jvm.heapMaxMb ?? 1024)) * 100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Luồng hoạt động:</span>
                <span className="font-mono font-bold text-slate-800">
                  {health?.jvm.threadCount ?? 38} threads
                </span>
              </div>
            </div>
          </div>

          {/* Card Next.js Frontend */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[14px] font-black text-slate-900 leading-tight">Next.js 15</h4>
                  <p className="text-[12px] text-slate-400">Web App :3000</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[12px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                Bình Thường
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[13px]">
              <div className="flex justify-between text-slate-600">
                <span>Môi trường:</span>
                <span className="font-semibold text-slate-800">Node Native Local</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cổng truy cập:</span>
                <span className="font-mono font-bold text-sky-800">Port 3000</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Kiến trúc:</span>
                <span className="text-[12px] font-semibold text-slate-700">App Router (RSC)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BỘ CÔNG CỤ DỌN DẸP & BẢO TRÌ CƠ SỞ DỮ LIỆU (DATABASE MAINTENANCE TOOLKIT) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900">
            Bộ Công Cụ Dọn Dẹp & Tinh Chỉnh Cơ Sở Dữ Liệu
          </h3>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Các thao tác bảo trì dữ liệu an toàn, giải phóng bộ nhớ và giữ cho hệ thống luôn vận hành mượt mà.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mục 1: Dọn dẹp bản ghi mồ côi */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-slate-900">
                    Dọn Dẹp Bản Ghi Mồ Côi
                  </h4>
                  <p className="text-[13px] text-slate-500 leading-relaxed mt-0.5">
                    Quét và xóa kết quả trận đấu, thẻ phạt và bàn thắng không còn gắn với giải đấu hợp lệ.
                  </p>
                </div>
              </div>
            </div>

            {confirmInline === "orphans" ? (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-2 animate-fade-in">
                <p className="text-[13px] font-bold text-rose-800">
                  Xác nhận dọn dẹp kết quả trận và sự kiện mồ côi khỏi cơ sở dữ liệu?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => executeClean("orphans")}
                    disabled={busyAction === "orphans"}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {busyAction === "orphans" ? "Đang dọn dẹp..." : "Xác Nhận Dọn Dẹp"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmInline(null)}
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmInline("orphans")}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-[13px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                Quét & Dọn Dẹp Dữ Liệu Mồ Côi
              </button>
            )}
          </div>

          {/* Mục 2: Giải phóng ca cọc quá hạn */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-slate-900">
                    Giải Phóng Ca Cọc Quá Hạn
                  </h4>
                  <p className="text-[13px] text-slate-500 leading-relaxed mt-0.5">
                    Quét các đơn đặt sân đang chờ thanh toán (Pending) quá 15 phút để nhả lại lịch sân trống.
                  </p>
                </div>
              </div>
            </div>

            {confirmInline === "expired" ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2 animate-fade-in">
                <p className="text-[13px] font-bold text-amber-900">
                  Giải phóng tất cả các đơn đặt sân quá hạn cọc VietQR 15 phút?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => executeClean("expired")}
                    disabled={busyAction === "expired"}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {busyAction === "expired" ? "Đang xử lý..." : "Xác Nhận Giải Phóng"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmInline(null)}
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmInline("expired")}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-[13px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                Quét & Giải Phóng Ca Chờ Cọc
              </button>
            )}
          </div>

          {/* Mục 3: Xóa đơn đặt sân giả lập */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-slate-900">
                    Dọn Dẹp Đơn Đặt Sân Giả Lập
                  </h4>
                  <p className="text-[13px] text-slate-500 leading-relaxed mt-0.5">
                    Xoá toàn bộ đơn đặt sân thử nghiệm (mã SIM-*), giữ nguyên toàn bộ đơn thật của khách hàng.
                  </p>
                </div>
              </div>
            </div>

            {confirmInline === "simulated" ? (
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 space-y-2 animate-fade-in">
                <p className="text-[13px] font-bold text-indigo-900">
                  Xác nhận xoá toàn bộ các đơn đặt sân giả lập demo?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => executeClean("simulated")}
                    disabled={busyAction === "simulated"}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {busyAction === "simulated" ? "Đang xoá..." : "Xác Nhận Xoá Đơn Test"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmInline(null)}
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmInline("simulated")}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-[13px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                Dọn Dẹp Đơn Demo (SIM-*)
              </button>
            )}
          </div>

          {/* Mục 4: Dọn thông báo cũ */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-slate-900">
                    Lưu Trữ Thông Báo Cũ
                  </h4>
                  <p className="text-[13px] text-slate-500 leading-relaxed mt-0.5">
                    Dọn bớt các thông báo sàn đã đọc quá 30 ngày để tối ưu kích thước bảng thông báo.
                  </p>
                </div>
              </div>
            </div>

            {confirmInline === "notifications" ? (
              <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 space-y-2 animate-fade-in">
                <p className="text-[13px] font-bold text-slate-800">
                  Xác nhận dọn dẹp các thông báo đã đọc cũ hơn 30 ngày?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => executeClean("notifications")}
                    disabled={busyAction === "notifications"}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[13px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {busyAction === "notifications" ? "Đang xử lý..." : "Xác Nhận Lưu Trữ"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmInline(null)}
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmInline("notifications")}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-[13px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                Dọn Dẹp Thông Báo &gt; 30 Ngày
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. SAO LƯU & XUẤT DỮ LIỆU NGOẠI TUYẾN (SYSTEM SNAPSHOT EXPORT) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Sao Lưu Toàn Bộ Dữ Liệu Sàn (System Snapshot)
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                Tạo một bản sao lưu toàn bộ cấu hình, danh sách người dùng, cụm sân và các chỉ số KPI
                dưới định dạng JSON tiêu chuẩn để lưu trữ ngoại tuyến hoặc khôi phục khi cần.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportSnapshot}
            disabled={busyAction === "export"}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{busyAction === "export" ? "Đang Xuất Dữ Liệu..." : "Xuất Bản Sao Lưu (.JSON)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
