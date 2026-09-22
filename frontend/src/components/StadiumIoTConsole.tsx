"use client";

import React, { useState } from "react";
import {
  Zap,
  ShieldCheck,
  Power,
  Sliders,
  Activity,
  QrCode,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Radio,
  RefreshCw,
  Sun,
  Flame,
  BatteryCharging,
  TrendingDown,
  Cpu,
  Wifi,
  Video,
  ChevronRight
} from "lucide-react";

interface FieldIoT {
  id: string;
  name: string;
  sport: string;
  status: "live" | "off" | "standby" | "training" | "maintenance";
  lux: number;
  powerKw: number;
  temp: number;
  barrierStatus: "locked" | "unlocked";
  customer?: string;
  qrPass?: string;
  nextMatchTime?: string;
}

export default function StadiumIoTConsole() {
  const [activeFilter, setActiveFilter] = useState<"all" | "pickleball" | "football" | "badminton">("all");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [fields, setFields] = useState<FieldIoT[]>([
    {
      id: "PB-01",
      name: "Sân PB-01 Pro Match",
      sport: "Pickleball",
      status: "live",
      lux: 520,
      powerKw: 2.4,
      temp: 42,
      barrierStatus: "unlocked",
      customer: "Trần Hoàng Long",
      qrPass: "#VS-9981",
    },
    {
      id: "PB-02",
      name: "Sân PB-02 AI Streaming",
      sport: "Pickleball",
      status: "live",
      lux: 500,
      powerKw: 2.4,
      temp: 41,
      barrierStatus: "unlocked",
      customer: "Nguyễn Văn An",
      qrPass: "#VS-9982",
    },
    {
      id: "PB-03",
      name: "Sân PB-03 Standard",
      sport: "Pickleball",
      status: "off",
      lux: 0,
      powerKw: 0.0,
      temp: 29,
      barrierStatus: "locked",
      nextMatchTime: "20:00 (Hệ thống tự bật trước 5p)",
    },
    {
      id: "PB-04",
      name: "Sân PB-04 Training",
      sport: "Pickleball",
      status: "training",
      lux: 350,
      powerKw: 1.6,
      temp: 36,
      barrierStatus: "unlocked",
      customer: "Lớp HLV IPTPA Trẻ Em",
    },
    {
      id: "PB-05",
      name: "Sân PB-05 Standard",
      sport: "Pickleball",
      status: "standby",
      lux: 50,
      powerKw: 0.3,
      temp: 31,
      barrierStatus: "locked",
      nextMatchTime: "20:00 (12 phút nữa)",
    },
    {
      id: "PB-06",
      name: "Sân PB-06 Match",
      sport: "Pickleball",
      status: "live",
      lux: 500,
      powerKw: 2.4,
      temp: 40,
      barrierStatus: "unlocked",
      customer: "Phạm Thu Trang",
      qrPass: "#VS-9985",
    },
    {
      id: "F7-A",
      name: "Sân Bóng Đá 7A Cao Áp",
      sport: "Bóng đá 7",
      status: "live",
      lux: 1200,
      powerKw: 6.8,
      temp: 48,
      barrierStatus: "unlocked",
      customer: "FC Sài Gòn Titans",
      qrPass: "#VS-7001",
    },
    {
      id: "F7-B",
      name: "Sân Bóng Đá 7B (Bảo Trì)",
      sport: "Bóng đá 7",
      status: "maintenance",
      lux: 0,
      powerKw: 0.0,
      temp: 28,
      barrierStatus: "locked",
    },
  ]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const toggleFieldPower = (id: string) => {
    setFields(fields.map(f => {
      if (f.id === id) {
        const isOff = f.status === "off" || f.status === "maintenance";
        const newStatus = isOff ? "live" : "off";
        const newLux = isOff ? 500 : 0;
        const newKw = isOff ? 2.4 : 0;
        triggerToast(`Đã ${isOff ? "BẬT ĐÈN" : "TẮT ĐÈN"} khẩn cấp cho ${f.id}!`);
        return { ...f, status: newStatus, lux: newLux, powerKw: newKw };
      }
      return f;
    }));
  };

  const toggleBarrier = (id: string) => {
    setFields(fields.map(f => {
      if (f.id === id) {
        const isLocked = f.barrierStatus === "locked";
        triggerToast(`Cửa Barrier cửa ${f.id} đã ${isLocked ? "MỞ CỬA" : "KHÓA ĐÓNG"}!`);
        return { ...f, barrierStatus: isLocked ? "unlocked" : "locked" };
      }
      return f;
    }));
  };

  const filteredFields = fields.filter(f => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pickleball") return f.sport.includes("Pickleball");
    if (activeFilter === "football") return f.sport.includes("Bóng đá");
    return true;
  });

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 min-h-screen transition-colors duration-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold text-xs sm:text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Top Navigation & IoT Status Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-3 flex-wrap gap-y-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" /> IoT MQTT Online 100% (Ping 8ms)
              </span>
              <span className="bg-lime-400/20 text-lime-300 border border-lime-400/30 text-xs font-bold px-3 py-1 rounded-full">
                D-Sport Oasis Q.7
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Trung Tâm Điều Hành IoT Smart Floodlight & Barrier VietQR
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Hệ thống tự động hóa khép kín: Khách cọc VietQR ➔ Quét mã QR mở cửa Barrier ➔ Cảm biến MQTT tự bật đèn sân đúng giờ & ngắt rơ-le tiết kiệm 28% điện năng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => triggerToast("Đã đồng bộ lại 18 cảm biến rơ-le MQTT!")}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700 flex items-center space-x-1.5"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Đồng Bộ MQTT</span>
            </button>
            <button
              onClick={() => triggerToast("Đã kích hoạt chế độ tiết kiệm điện ban ngày!")}
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs transition border border-amber-500/30 flex items-center space-x-1.5"
            >
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Chế Độ Ban Ngày</span>
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Strip */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-2xl font-black text-emerald-400 font-mono">18 / 18</div>
            <div className="text-xs text-slate-400 mt-0.5">Cụm Đèn LED 500 Lux Connected</div>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-2xl font-black text-cyan-400 font-mono">18.4 kW/h</div>
            <div className="text-xs text-slate-400 mt-0.5">Công Suất Tiêu Thụ Live</div>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-2xl font-black text-lime-400 font-mono">-28% Điện</div>
            <div className="text-xs text-slate-400 mt-0.5">Tiết Kiệm Lũy Kế ~14.5 Tr/Tháng</div>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-2xl font-black text-amber-400 font-mono">2 / 2 Barrier</div>
            <div className="text-xs text-slate-400 mt-0.5">Cửa QR Ticket Phản Hồi 0.2s</div>
          </div>
        </div>
      </div>

      {/* Main Control Matrix & Access Logs */}
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Field IoT Control Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Power className="w-5 h-5 text-emerald-500" />
                <span>Ma Trận Điều Khiển Sân & Đèn Chiếu Sáng Real-Time</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Bật/tắt rơ-le trực tiếp, điều chỉnh độ sáng Dimming và kiểm soát cửa Barrier tự động
              </p>
            </div>

            {/* Sport Filter Pills */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeFilter === "all"
                    ? "bg-slate-900 dark:bg-emerald-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                Tất Cả (8)
              </button>
              <button
                onClick={() => setActiveFilter("pickleball")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeFilter === "pickleball"
                    ? "bg-slate-900 dark:bg-emerald-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                Pickleball (6)
              </button>
              <button
                onClick={() => setActiveFilter("football")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeFilter === "football"
                    ? "bg-slate-900 dark:bg-emerald-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                Bóng Đá 7 (2)
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredFields.map((field) => (
              <div
                key={field.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 relative ${
                  field.status === "live"
                    ? "border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-md"
                    : field.status === "standby" || field.status === "training"
                    ? "border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20"
                    : field.status === "off"
                    ? "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60"
                    : "border-rose-300 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10 opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 dark:text-white text-base">
                      {field.id}
                    </span>
                    {field.status === "live" && (
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Đèn Bật 100%
                      </span>
                    )}
                    {field.status === "training" && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Dim 70%
                      </span>
                    )}
                    {field.status === "standby" && (
                      <span className="bg-cyan-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Chờ (10%)
                      </span>
                    )}
                    {field.status === "off" && (
                      <span className="bg-slate-300 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Tắt 0 Lux (Tiết Kiệm)
                      </span>
                    )}
                    {field.status === "maintenance" && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Bảo Trì 0V
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                    {field.name}
                  </h3>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-3">
                    <div>💡 Độ sáng: <span className="font-bold text-slate-700 dark:text-slate-200">{field.lux} Lux</span></div>
                    <div>⚡ Công suất: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{field.powerKw} kW/h</span> • Nhiệt: {field.temp}°C</div>
                    {field.customer && (
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                        👤 Khách: {field.customer} ({field.qrPass})
                      </div>
                    )}
                    {field.nextMatchTime && (
                      <div className="text-amber-500 font-medium">
                        ⏰ {field.nextMatchTime}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleBarrier(field.id)}
                    className={`p-2 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      field.barrierStatus === "unlocked"
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                    title="Điều khiển cửa Barrier"
                  >
                    {field.barrierStatus === "unlocked" ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[10px]">Barrier</span>
                  </button>

                  <button
                    onClick={() => toggleFieldPower(field.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition shadow flex items-center space-x-1 ${
                      field.status === "off" || field.status === "maintenance"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-rose-600 hover:bg-rose-500 text-white"
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{field.status === "off" || field.status === "maintenance" ? "Bật Đèn" : "Tắt Đèn"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Automated 4-Step Diagram & Live Access Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Automated Flow Diagram & Energy Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-500" />
              <span>Quy Trình Tự Động Hóa 4 Bước (Zero-Human-Operator)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="font-extrabold text-emerald-500 mb-1">1. VietQR Cọc Sân</div>
                <div className="text-slate-500 dark:text-slate-400">Khách đặt lịch & cọc tự động qua Napas247</div>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="font-extrabold text-cyan-500 mb-1">2. Mã Smart QR</div>
                <div className="text-slate-500 dark:text-slate-400">Hệ thống tạo vé QR Ticket trên App VaoSan</div>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="font-extrabold text-amber-500 mb-1">3. Quét Mở Barrier</div>
                <div className="text-slate-500 dark:text-slate-400">Khách tới quét tại barrier tự động mở lối vào</div>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="font-extrabold text-lime-500 mb-1">4. MQTT Bật/Tắt Đèn</div>
                <div className="text-slate-500 dark:text-slate-400">Rơ-le bật đèn trước 5p & ngắt điện sau khi đá xong</div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <TrendingDown className="w-4 h-4" /> Báo Cáo Tiết Kiệm Điện Năng Hàng Tháng
                </span>
                <span className="font-mono text-emerald-400">-28% Chi Phí</span>
              </div>
              <p className="text-xs text-slate-300">
                Nhờ tính năng tự động ngắt điện đèn cao áp ngay khi ca sân kết thúc, cụm sân đã tiết kiệm được <strong className="text-white">4.250 kWh (~14.500.000đ)</strong> tiền điện mỗi tháng.
              </p>
            </div>
          </div>

          {/* Live Access Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-emerald-500" />
                <span>Nhật Ký Quét QR Check-in</span>
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">
                Live Feed
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400">19:28 • Trần Hoàng Long</span>
                  <span className="font-mono">Barrier 1</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">Quét Pass #VS-9981 ➔ Tự động BẬT ĐÈN PB-01</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-cyan-600 dark:text-cyan-400">19:15 • Nguyễn Văn An</span>
                  <span className="font-mono">Barrier 2</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">Quét Pass #VS-9982 ➔ Mở cổng sân Cầu Lông</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-amber-500">19:05 • Hệ Thống IoT</span>
                  <span className="font-mono">Rơ-le MQTT</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">PB-03 hết ca ➔ TỰ ĐỘNG TẮT ĐÈN tiết kiệm 2.4 kW</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
