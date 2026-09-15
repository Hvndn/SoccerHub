"use client";

import React, { useState } from "react";
import {
  Sparkles,
  MapPin,
  Trophy,
  Clock,
  Search,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Users,
  Lock,
  ArrowRight,
  Activity,
  Lightbulb,
  QrCode,
  DollarSign
} from "lucide-react";

interface LandingHeroProps {
  onOpenAuth: (mode: "login" | "register") => void;
}

export default function LandingHero({ onOpenAuth }: LandingHeroProps) {
  const [city, setCity] = useState("hcm");
  const [pitchType, setPitchType] = useState("7");
  const [timeSlot, setTimeSlot] = useState("gold");

  return (
    <div className="relative w-full space-y-12">
      {/* Top Ambient Glow Background Field */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[480px] bg-gradient-to-b from-[#0b4f6c]/20 via-[#0b4f6c]/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* --- HERO MAIN SECTION (2 COLUMNS) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column (7 Cols): Headline, Copy & Interactive Quick Search Box */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Operational Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0b4f6c]/10 dark:bg-sky-400/20 border border-[#0b4f6c]/20 dark:border-sky-400/30 text-[#0b4f6c] dark:text-sky-300 text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold uppercase tracking-wider">Hạ Tầng Thể Thao Số • Trực Tuyến 24/7</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Nền Tảng Đặt Sân <br className="hidden sm:block" />
            & Quản Lý Thể Thao <span className="text-[#0b4f6c] dark:text-sky-400">Thông Minh</span> Số 1
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium leading-relaxed max-w-2xl">
            Kết nối hơn 450+ cụm sân bóng đá cỏ nhân tạo, cầu lông, pickleball, tự động hóa điều khiển IoT dàn đèn, AI ghép đội cân bằng Elo và tổ chức giải đấu chuyên nghiệp chuẩn VFF.
          </p>

          {/* Integrated Interactive Quick Search Box Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl stadium-shadow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Location Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-[#0b4f6c] dark:text-sky-400" />
                  Khu vực & Tọa độ
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0b4f6c] shadow-xs"
                >
                  <option value="hcm">TP. Hồ Chí Minh (Q.7, Bình Thạnh...)</option>
                  <option value="hn">Hà Nội (Cầu Giấy, Nam Từ Liêm...)</option>
                  <option value="dn">Đà Nẵng (Hải Châu, Cẩm Lệ...)</option>
                </select>
              </div>

              {/* 2. Pitch Size Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
                  <Trophy className="w-3.5 h-3.5 mr-1 text-[#0b4f6c] dark:text-sky-400" />
                  Quy chuẩn sân
                </label>
                <select
                  value={pitchType}
                  onChange={(e) => setPitchType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0b4f6c] shadow-xs"
                >
                  <option value="7">Sân 7 người (Tiêu chuẩn cỏ nhân tạo)</option>
                  <option value="5">Sân 5 Futsal / Cầu Lông / Pickleball</option>
                  <option value="11">Sân 11 người (Chuẩn VFF Quality)</option>
                </select>
              </div>

              {/* 3. Time Slot Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-[#0b4f6c] dark:text-sky-400" />
                  Khung giờ đá
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0b4f6c] shadow-xs"
                >
                  <option value="gold">Giờ vàng: 17:30 - 21:00</option>
                  <option value="late">Đêm muộn: 21:00 - 22:30</option>
                  <option value="early">Sáng sớm: 06:00 - 08:30</option>
                  <option value="day">Ban ngày: 08:30 - 16:30</option>
                </select>
              </div>
            </div>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400" />
                <span>Khóa slot tự động • Hoàn tiền nếu hủy do mưa ngập</span>
              </div>

              <button
                onClick={() => onOpenAuth("login")}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs shadow-lg shadow-[#0b4f6c]/25 transition-all flex items-center justify-center space-x-2 active:scale-95"
              >
                <Search className="w-4 h-4 text-white" />
                <span>Tìm Sân Trống Ngay</span>
              </button>
            </div>
          </div>

          {/* 4 Hero Proof Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-2xl font-mono font-extrabold text-[#0b4f6c] dark:text-sky-400">450+</div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Cụm sân đối tác</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">120.000+</div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Cầu thủ năng động</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-2xl font-mono font-extrabold text-[#0b4f6c] dark:text-sky-400">99.8%</div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Chống bùng VietQR</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-2xl font-mono font-extrabold text-amber-500">18ms</div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">IoT Gateway phản hồi</div>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Live Interactive Showcase Card */}
        <div className="lg:col-span-5 relative">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4 relative overflow-hidden">
            {/* Status Ribbon */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-xs font-extrabold text-emerald-400 uppercase tracking-wider">CỤM SÂN HÔM NAY • REALTIME</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#0b4f6c] text-white font-extrabold text-[10px] uppercase shadow-xs">
                IoT Online
              </span>
            </div>

            {/* Pitch Preview Image Backdrop */}
            <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-800">
              <img
                src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80"
                alt="Live Pitch Preview"
                className="w-full h-full object-cover brightness-75 hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base">Sân 7A • Cụm Chuyên Việt Q7</h3>
                  <p className="text-[11px] text-slate-300 font-medium">452 Nguyễn Thị Thập, Tân Quy, Quận 7</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold rounded">
                  Chuẩn FIFA 2026
                </span>
              </div>
            </div>

            {/* Slot Selection Interactive Ribbon */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Ca thi đấu tối nay (Giờ Vàng):</span>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center opacity-60">
                  <span className="block font-bold text-slate-400 text-xs">18:00 - 19:30</span>
                  <span className="block text-[10px] font-bold text-rose-400">Hết slot</span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0b4f6c]/40 border-2 border-[#0b4f6c] text-center shadow-md relative overflow-hidden">
                  <span className="block font-bold text-sky-300 text-xs">19:30 - 21:00</span>
                  <span className="block text-[10px] font-bold text-emerald-400">Trống • Giờ vàng</span>
                  <span className="absolute bottom-0 inset-x-0 h-1 bg-[#0b4f6c]" />
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                  <span className="block font-bold text-slate-200 text-xs">21:00 - 22:30</span>
                  <span className="block text-[10px] font-bold text-amber-400">Giảm 15%</span>
                </div>
              </div>
            </div>

            {/* Pricing & Auto Lock Strip */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 line-through block font-mono">850.000đ</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-lg font-extrabold text-sky-400 font-mono">720.000đ</span>
                  <span className="text-[11px] text-slate-400 font-sans">/ ca 90'</span>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth("login")}
                className="px-4 py-2.5 rounded-xl bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs transition-colors flex items-center space-x-1.5 shadow-md active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>VietQR Khóa Slot</span>
              </button>
            </div>

            {/* IoT Live status chip */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1">
              <span className="flex items-center text-emerald-400">
                <Lightbulb className="w-3.5 h-3.5 mr-1 text-emerald-400" /> IoT Dàn Đèn: Bật trước 5 phút
              </span>
              <span className="font-mono text-slate-500">Redis Mutex: 18ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
