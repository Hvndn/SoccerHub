"use client";

import React, { useState } from "react";
import {
  MapPin,
  Trophy,
  Clock,
  Search,
  CheckCircle2,
  Zap,
  Users,
  Flame,
  Shield,
  ArrowRight
} from "lucide-react";

interface LandingHeroProps {
  onOpenAuth: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
}

export default function LandingHero({ onOpenAuth, onNavigateTab }: LandingHeroProps) {
  const [city, setCity] = useState("dn");
  const [pitchType, setPitchType] = useState("7");
  const [timeSlot, setTimeSlot] = useState("gold");
  const [dateChoice, setDateChoice] = useState("today");

  return (
    <div className="relative w-full space-y-10 sm:space-y-14">
      {/* ========================================================
          FULL-WIDTH EDGE-TO-EDGE BANNER (GIAO DIỆN SÁNG TINH TẾ)
         ======================================================== */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden shadow-xs border-y border-slate-200/80 bg-white">
        {/* Soft Ambient Accents */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-50/70 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-[450px] h-[450px] bg-sky-50/60 rounded-full blur-3xl pointer-events-none" />

        {/* Inner Content Container Aligned with Site Container (max-w-[1720px]) */}
        <div className="relative z-10 max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-[50px] py-10 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
            
            {/* LEFT COLUMN: HERO CONTENT (7 COLS) */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              {/* Main Headline: Đề tài quản lý sân bóng và giải đấu thể thao thông minh */}
              <h1 className="text-2xl sm:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-slate-900 tracking-tight leading-[1.18] uppercase font-sans">
                Quản Lý Sân Bóng &amp; <br />
                <span className="text-[#0b4f6c]">Giải Đấu Thể Thao Thông Minh</span>
              </h1>

              {/* 2 Feature Items Chuẩn Đề Tài */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 pt-1">
                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                    <Zap className="w-4 h-4 text-amber-700 fill-amber-700" />
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-800 leading-snug">
                    Khóa Ca Redis Mutex &lt;20ms • Chống Trùng Ca 100%
                  </span>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 border border-sky-200">
                    <Shield className="w-4 h-4 text-sky-700 fill-sky-700" />
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-800 leading-snug">
                    Tự Động Hóa Dàn Đèn IoT MQTT &amp; Giải Đấu Chuẩn VFF
                  </span>
                </div>
              </div>

              {/* Concise Thesis-Aligned Description */}
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl pt-1">
                Nền tảng số hóa toàn diện kết nối <strong>Cầu Thủ</strong>, <strong>Chủ Cụm Sân</strong> và <strong>Ban Tổ Chức Giải Đấu</strong>. 
                Tích hợp thanh toán cọc tức thời <strong>VietQR Napas247</strong>, tự động bật/tắt dàn đèn theo ca thi đấu, thuật toán AI cân bằng trình độ <strong>Elo Rating</strong> và sơ đồ thi đấu knock-out trực quan.
              </p>

              {/* Action Button Strip */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onOpenAuth("login", "PLAYER")}
                  className="px-9 py-4 rounded-xl bg-[#0b4f6c] hover:bg-[#083b52] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-sm transition-all active:scale-95 flex items-center space-x-2.5 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-white" />
                  <span>Đặt Sân Ngay →</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuth("login", "OWNER")}
                  className="px-7 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs sm:text-sm border border-slate-200 transition-all active:scale-95 flex items-center space-x-2 cursor-pointer shadow-xs"
                >
                  <Shield className="w-4 h-4 text-sky-700" />
                  <span>Cổng Chủ Sân</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: CLEAN REAL PLAYER PHOTO WITHOUT UNNECESSARY BADGES (5 COLS) */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Subtle Stadium Light Flare */}
              <div className="absolute w-[360px] sm:w-[480px] h-[360px] sm:h-[480px] rounded-full bg-white/10 blur-3xl pointer-events-none" />

              {/* The Actual Player Image from Nicepage Template - Clean & Dramatic */}
              <div className="relative z-10 w-full max-w-[400px] sm:max-w-[480px]">
                <img
                  src="/images/epic-goal-player.png"
                  alt="Striker Scoring Epic Last-Minute Goal"
                  className="w-full h-auto object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.55)]"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================
          SECTION 2: BỘ LỌC TÌM SÂN TRỐNG GPS & GIỜ VÀNG (DƯỚI TỰ SÁNG TẠO)
         ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider block">
                Bộ Lọc Tìm Sân Trống Tọa Độ GPS &amp; Giờ Vàng
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                Quét bán kính 500m gần bạn nhất bằng PostgreSQL PostGIS
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800">
            Live PostGIS 500m
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Location Select */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-rose-500" />
              Khu vực sân
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c] shadow-xs cursor-pointer"
            >
              <option value="dn">Đà Nẵng (Hải Châu, Cẩm Lệ, Liên Chiểu...)</option>
              <option value="hcm">TP. Hồ Chí Minh (Quận 7, Bình Thạnh...)</option>
              <option value="hn">Hà Nội (Cầu Giấy, Nam Từ Liêm...)</option>
            </select>
          </div>

          {/* 2. Pitch Size Select */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
              <Trophy className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Quy chuẩn sân
            </label>
            <select
              value={pitchType}
              onChange={(e) => setPitchType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c] shadow-xs cursor-pointer"
            >
              <option value="7">Sân 7 Người (Cỏ FIFA Pro)</option>
              <option value="5">Sân 5 Người (Mini / Futsal)</option>
              <option value="11">Sân 11 Người (Tiêu chuẩn VFF)</option>
            </select>
          </div>

          {/* 3. Date Select */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-sky-500" />
              Ngày thi đấu
            </label>
            <select
              value={dateChoice}
              onChange={(e) => setDateChoice(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c] shadow-xs cursor-pointer"
            >
              <option value="today">Hôm Nay (Tối nay có ca)</option>
              <option value="tomorrow">Ngày Mai (Đặt cọc giữ chỗ)</option>
              <option value="weekend">Cuối Tuần Này (Kèo vàng)</option>
            </select>
          </div>

          {/* 4. Time Slot Select */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
              <Flame className="w-3.5 h-3.5 mr-1 text-orange-500" />
              Khung giờ đá
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c] shadow-xs cursor-pointer"
            >
              <option value="gold">Giờ Vàng: 17:30 - 21:00</option>
              <option value="night">Đêm Muộn: 21:00 - 22:30</option>
              <option value="morning">Sáng Sớm: 06:00 - 08:30</option>
              <option value="all">Tất cả các ca trong ngày</option>
            </select>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Khóa ca tức thì &lt;20ms • VietQR Napas247 • Tự hoàn 100% nếu có mưa bão</span>
          </div>

          <button
            type="button"
            onClick={() => onOpenAuth("login", "PLAYER")}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-[#0b4f6c] to-sky-600 hover:from-[#083a50] hover:to-sky-500 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Quét Ca Sân Trống Ngay</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          SECTION 3: 4 CHỈ SỐ THỰC TẾ ĐỀ TÀI TỐT NGHIỆP
         ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-2xl sm:text-3xl font-mono font-black text-[#0b4f6c] dark:text-sky-400">450+</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cụm sân đối tác</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400">&lt;20ms</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Redis Mutex Lock</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-2xl sm:text-3xl font-mono font-black text-amber-500">-25.4%</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chi phí điện IoT</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-2xl sm:text-3xl font-mono font-black text-sky-500">120k+</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cầu thủ Elo xếp hạng</div>
        </div>
      </div>
    </div>
  );
}
