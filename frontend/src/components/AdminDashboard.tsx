"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Calendar,
  DollarSign,
  Settings,
  CheckCircle2,
  BarChart2,
  Zap,
  Clock,
  AlertTriangle,
  Coffee,
  Wrench,
  Sliders,
  Check,
  Layers,
  Sparkles,
  MapPin,
  RefreshCw,
  Sun,
  CloudRain
} from "lucide-react";

export default function AdminDashboard() {
  const [peakHourMultiplier, setPeakHourMultiplier] = useState(1.2);
  const [autoPricing, setAutoPricing] = useState(true);
  const [selectedPitchFilter, setSelectedPitchFilter] = useState("all");

  // Mock Live Matrix Data (Stitch Spec: Live Pitch Matrix 06:00 - 23:00)
  const pitchMatrix = [
    {
      pitchName: "Sân 7A FIFA Cỏ Nhân Tạo",
      type: "Sân 7 Người",
      slots: [
        { time: "16:00 - 17:30", status: "booked", team: "FC Tuổi Trẻ", price: "450k", via: "VietQR" },
        { time: "17:30 - 19:00", status: "playing", team: "FC FPT Telecom", price: "600k", via: "VietQR (Live)" },
        { time: "19:00 - 20:30", status: "booked", team: "FC Thunder Saigon", price: "600k", via: "VietQR" },
        { time: "20:30 - 22:00", status: "resale", team: "FC Dragon King (Pass)", price: "325k", via: "Sàn Nhượng" }
      ]
    },
    {
      pitchName: "Sân 7B Cỏ Tiêu Chuẩn",
      type: "Sân 7 Người",
      slots: [
        { time: "16:00 - 17:30", status: "empty", team: "Ca Trống", price: "400k", via: "Đặt Ngay" },
        { time: "17:30 - 19:00", status: "playing", team: "FC Real Star", price: "600k", via: "VietQR (Live)" },
        { time: "19:00 - 20:30", status: "booked", team: "FC Sport Plus", price: "600k", via: "VietQR" },
        { time: "20:30 - 22:00", status: "booked", team: "Học Viện U15", price: "500k", via: "Cố Định" }
      ]
    },
    {
      pitchName: "Sân 5A Futsal Trong Nhà",
      type: "Sân 5 Người",
      slots: [
        { time: "16:00 - 17:30", status: "booked", team: "FC Giao Hữu 5v5", price: "300k", via: "VietQR" },
        { time: "17:30 - 19:00", status: "booked", team: "FC Tech Hub", price: "420k", via: "VietQR" },
        { time: "19:00 - 20:30", status: "playing", team: "FC Futsal Pro", price: "420k", via: "VietQR (Live)" },
        { time: "20:30 - 22:00", status: "empty", team: "Ca Trống", price: "340k", via: "Đặt Ngay" }
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* HEADER BANNER (STITCH EXACT SPEC) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0b4f6c]/10 dark:bg-sky-500/10 border border-[#0b4f6c]/20 dark:border-sky-400/20 text-[#0b4f6c] dark:text-sky-400 text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>SÂN VẬN ĐỘNG ĐẠI NAM SPORT COMPLEX (Q.7) — DASHBOARD CHỦ SÂN PRO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Trung Tâm Analytics & Dynamic Pricing Điều Hành
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Giám sát ma trận ca sân real-time, cấu hình hệ số giá linh hoạt AI và quản lý doanh thu dịch vụ canteen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center space-x-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>+ Đặt Ca Vãng Lai Hotline</span>
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-400/20 font-bold text-xs"
            >
              Khóa Sân Khẩn Cấp
            </button>
          </div>
        </div>
      </div>

      {/* TOP 4 KPI CARDS (STITCH HIGH-CONTRAST SPEC) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng Doanh Thu Hôm Nay</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono">14.850.000 VNĐ</div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> +18.5% so với hôm qua
          </span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tỷ Lệ Lấp Đầy (Occupancy)</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">94%</div>
          <span className="text-[11px] font-bold text-emerald-500">Đã khóa 42 / 45 ca đặt (Giờ vàng 100%)</span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ca Cọc VietQR Napas247</span>
          <div className="text-2xl sm:text-3xl font-black text-sky-500 font-mono">38 Ca Cọc</div>
          <span className="text-[11px] font-bold text-slate-500">Khóa slot trong 1s (0% nợ cọc)</span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Canteen & Cho Thuê Đồ</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">2.150.000 VNĐ</div>
          <span className="text-[11px] font-bold text-amber-500">+24% so với trung bình tuần</span>
        </div>
      </div>

      {/* 2 MAIN COLUMNS: LIVE MATRIX & SMART PRICING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN (65%): LIVE PITCH GRID MATRIX */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-[#0b4f6c] dark:text-sky-400" />
                <span>Ma Trận Ca Sân Thời Gian Thực (Live Grid Matrix)</span>
              </h2>
              <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                Live 18:45 (Giờ Cao Điểm)
              </span>
            </div>

            {/* COLOR CODES LEGEND */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold pt-1">
              <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Đã Cọc VietQR</span>
              </span>
              <span className="flex items-center space-x-1.5 text-rose-500">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span>Đang Thi Đấu (IoT Bật)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-amber-500">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Chờ Nhượng Ca</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-400">
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span>Ca Trống</span>
              </span>
            </div>

            {/* MATRIX CARDS BY PITCH */}
            <div className="space-y-4 pt-2">
              {pitchMatrix.map((pitch, pIdx) => (
                <div key={pIdx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-900 dark:text-white">{pitch.pitchName}</span>
                    <span className="font-mono text-slate-400 font-bold">{pitch.type}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    {pitch.slots.map((slot, sIdx) => (
                      <div
                        key={sIdx}
                        className={`p-3 rounded-xl border space-y-1 transition-all ${
                          slot.status === "playing"
                            ? "bg-rose-500/10 border-rose-400 text-rose-600 dark:text-rose-400 font-bold"
                            : slot.status === "booked"
                            ? "bg-emerald-500/10 border-emerald-400 text-emerald-600 dark:text-emerald-400 font-bold"
                            : slot.status === "resale"
                            ? "bg-amber-500/10 border-amber-400 text-amber-600 dark:text-amber-400 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                        }`}
                      >
                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <span>{slot.time}</span>
                          <span className="font-black">{slot.price}</span>
                        </div>
                        <p className="font-extrabold text-slate-900 dark:text-white truncate">{slot.team}</p>
                        <span className="text-[10px] block opacity-80">{slot.via}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (35%): SMART PRICE CONTROLLER & CANTEEN */}
        <div className="lg:col-span-1 space-y-6">
          {/* SMART AI DYNAMIC PRICING CONTROLLER */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#0b4f6c] dark:text-sky-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Dynamic Pricing</h3>
              </div>
              <button
                type="button"
                onClick={() => setAutoPricing(!autoPricing)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                  autoPricing ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-700"
                }`}
              >
                {autoPricing ? "Auto AI: ON" : "Auto AI: OFF"}
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/20 space-y-1">
                <div className="flex justify-between font-extrabold text-amber-600 dark:text-amber-400">
                  <span className="flex items-center space-x-1">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Giờ Vàng Cao Điểm (17:30 - 20:30):</span>
                  </span>
                  <span>+20% (600k/ca)</span>
                </div>
                <p className="text-[10px] text-slate-500">Đã lấp đầy 100% công suất khung giờ tối nay</p>
              </div>

              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-400/20 space-y-1">
                <div className="flex justify-between font-extrabold text-sky-600 dark:text-sky-400">
                  <span className="flex items-center space-x-1">
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>Giờ Vắng / Mưa Rào (13:00 - 16:00):</span>
                  </span>
                  <span>-15% (340k/ca)</span>
                </div>
                <p className="text-[10px] text-slate-500">Tự động kích cầu gửi tin tới 1.200 VĐV quanh 3km</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                <span>Hệ Số Giờ Cao Điểm:</span>
                <span className="text-[#0b4f6c] dark:text-sky-400 font-mono font-black">x{peakHourMultiplier}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.1"
                value={peakHourMultiplier}
                onChange={(e) => setPeakHourMultiplier(Number(e.target.value))}
                className="w-full accent-[#0b4f6c] dark:accent-sky-400 cursor-pointer"
              />
            </div>

            <button
              type="button"
              className="w-full py-2.5 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95"
            >
              Lưu Cấu Hình Giá Mới
            </button>
          </div>

          {/* CANTEEN & MAINTENANCE ALERTS */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
              <Coffee className="w-4 h-4 text-amber-500" />
              <span>Canteen & Bảo Trì Kỹ Thuật</span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Pocari / Revive (48 chai):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">960.000 VNĐ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Thuê giày đá bóng (12 đôi):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">480.000 VNĐ</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Thuê bóng thi đấu Động Lực:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">450.000 VNĐ</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/20 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-amber-600 dark:text-amber-400">
                <Wrench className="w-4 h-4" />
                <span>Cảnh Báo Bảo Trì Cỏ Sân 7A</span>
              </div>
              <p className="text-[11px] text-slate-500">Đã hoạt động 450h. Cần rải thêm hạt cao su sau 3 ngày nữa.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
