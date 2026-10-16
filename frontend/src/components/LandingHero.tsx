"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Trophy,
  Clock,
  Search,
  CheckCircle2,
  Zap,
  Users,
  Flame,
  Shield
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface LandingHeroProps {
  onOpenAuth: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
}

export default function LandingHero({ onOpenAuth, onNavigateTab }: LandingHeroProps) {
  const [city, setCity] = useState("dn");
  const [pitchType, setPitchType] = useState("7");
  const [timeSlot, setTimeSlot] = useState("gold");
  const [dateChoice, setDateChoice] = useState("today");

  /**
   * 4 chỉ số dưới hero đếm trực tiếp từ CSDL (pitches / tournaments /
   * matchmaking_posts / tổng trận đã có kết quả) thay vì số quảng cáo bịa sẵn.
   */
  const [stats, setStats] = useState({ pitches: 0, tournaments: 0, posts: 0, matchesPlayed: 0, loading: true });
  useEffect(() => {
    let alive = true;
    const get = (p: string) =>
      fetch(`${API_BASE_URL}${p}`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);
    Promise.all([
      get("/api/v1/pitches"),
      get("/api/v1/tournaments"),
      get("/api/v1/community/matchmaking-posts"),
    ])
      .then(([pitches, tournaments, posts]) => {
        if (!alive) return;
        let played = 0;
        for (const t of Array.isArray(tournaments) ? tournaments : []) {
          if (!t.bracketJson) continue;
          try {
            const b = JSON.parse(t.bracketJson);
            for (const r of b?.rounds ?? []) for (const m of r.matches ?? []) if (m.status === "DONE") played += 1;
          } catch { /* bỏ qua giải có bracket hỏng */ }
        }
        setStats({
          pitches: Array.isArray(pitches) ? pitches.length : 0,
          tournaments: Array.isArray(tournaments) ? tournaments.length : 0,
          posts: Array.isArray(posts) ? posts.filter((p: any) => (p.status ?? "OPEN") === "OPEN").length : 0,
          matchesPlayed: played,
          loading: false,
        });
      })
      .catch(() => { if (alive) setStats((s) => ({ ...s, loading: false })); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="relative w-full space-y-7 sm:space-y-14 overflow-x-clip">
      {/* ========================================================
          FULL-WIDTH EDGE-TO-EDGE BANNER (GIAO DIỆN SÁNG TINH TẾ)
         ======================================================== */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden shadow-xs border-y border-slate-200/80 bg-white">
        {/* Soft Ambient Accents (ẩn trên mobile để tối giản) */}
        <div className="hidden sm:block absolute top-0 right-1/4 w-[500px] h-[500px] bg-sky-50/70 rounded-full blur-3xl pointer-events-none" />
        <div className="hidden sm:block absolute -bottom-20 left-10 w-[450px] h-[450px] bg-sky-50/60 rounded-full blur-3xl pointer-events-none" />

        {/* Inner Content Container Aligned with Site Container (max-w-[1720px]) */}
        <div className="relative z-10 max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-6 xl:px-[50px] py-6 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 xl:gap-14 items-center">
            
            {/* LEFT COLUMN: HERO CONTENT (7 COLS) */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              {/* Main Headline: Đề tài quản lý sân bóng và giải đấu thể thao thông minh */}
              <h1 className="text-[1.7rem] leading-[1.22] sm:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-slate-900 tracking-tight sm:uppercase font-display">
                Quản Lý Sân Bóng &amp;{" "}
                <span className="text-[#0b4f6c]">Giải Đấu Thể Thao Thông Minh</span>
              </h1>

              {/* Feature chips — chỉ hiện từ tablet trở lên để tối giản mobile */}
              <div className="hidden sm:grid sm:grid-cols-2 gap-5 pt-1">
                <div className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 fill-amber-700" />
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-800 leading-snug">
                    Đặt ca trực tiếp từ CSDL • Không trùng lịch
                  </span>
                </div>

                <div className="flex items-center space-x-3 p-2.5 sm:p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 border border-sky-200">
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-700 fill-sky-700" />
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-800 leading-snug">
                    Sân 5 · 7 · 11 &amp; Futsal • Giải đấu theo phong độ
                  </span>
                </div>
              </div>

              {/* Concise Thesis-Aligned Description (rút gọn trên mobile) */}
              <p className="text-[13px] sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl pt-1">
                Nền tảng kết nối <strong>Cầu Thủ</strong>, <strong>Chủ Cụm Sân</strong> và <strong>Ban Tổ Chức Giải Đấu</strong>.
                <span className="hidden sm:inline">
                  {" "}Đặt sân online với thanh toán cọc qua <strong>VietQR</strong>, quản lý ca sân và giải đấu loại trực tiếp, lưu <strong>lịch sử thi đấu</strong> và chuỗi phong độ cho từng trận.
                </span>
              </p>

              {/* Action Button Strip */}
              <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => onOpenAuth("login", "PLAYER")}
                  className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] flex items-center justify-center space-x-2.5 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-white" />
                  <span>Đặt Sân Ngay →</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuth("login", "OWNER")}
                  className="w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs sm:text-sm border border-slate-200 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                >
                  <Shield className="w-4 h-4 text-sky-700" />
                  <span>Cổng Chủ Sân</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: CLEAN REAL PLAYER PHOTO WITHOUT UNNECESSARY BADGES (5 COLS) — ẩn trên mobile để gọn banner */}
            <div className="hidden lg:flex lg:col-span-5 relative items-center justify-center">
              {/* Subtle Stadium Light Flare */}
              <div className="absolute w-[360px] sm:w-[480px] h-[360px] sm:h-[480px] rounded-full bg-white/10 blur-3xl pointer-events-none" />

              {/* The Actual Player Image from Nicepage Template - Clean & Dramatic */}
              <div className="relative z-10 w-full max-w-[260px] sm:max-w-[480px]">
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 sm:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0ea5e9] dark:bg-[#0ea5e9] text-white dark:text-white flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider block">
                Bộ Lọc Tìm Sân Trống Theo Khu Vực &amp; Giờ Vàng
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                Lọc theo khu vực, loại sân và khung giờ trống trong ngày
              </span>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono font-bold text-sky-800 dark:text-sky-300 bg-sky-100/70 dark:bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-300 dark:border-sky-800">
            Dữ liệu trực tiếp từ CSDL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {/* 1. Location Select */}
          <div className="space-y-1.5">
            <label htmlFor="hero-city" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-rose-500" />
              Khu vực sân
            </label>
            <select
              id="hero-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0284c7] shadow-xs cursor-pointer"
            >
              <option value="dn">Đà Nẵng (Hải Châu, Cẩm Lệ, Liên Chiểu...)</option>
              <option value="hcm">TP. Hồ Chí Minh (Quận 7, Bình Thạnh...)</option>
              <option value="hn">Hà Nội (Cầu Giấy, Nam Từ Liêm...)</option>
            </select>
          </div>

          {/* 2. Pitch Size Select */}
          <div className="space-y-1.5">
            <label htmlFor="hero-pitch-type" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
              <Trophy className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Quy chuẩn sân
            </label>
            <select
              id="hero-pitch-type"
              value={pitchType}
              onChange={(e) => setPitchType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0284c7] shadow-xs cursor-pointer"
            >
              <option value="7">Sân 7 Người (Cỏ FIFA Pro)</option>
              <option value="5">Sân 5 Người (Mini / Futsal)</option>
              <option value="11">Sân 11 Người (Tiêu chuẩn VFF)</option>
            </select>
          </div>

          {/* 3. Date Select */}
          <div className="space-y-1.5">
            <label htmlFor="hero-date" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-sky-500" />
              Ngày thi đấu
            </label>
            <select
              id="hero-date"
              value={dateChoice}
              onChange={(e) => setDateChoice(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0284c7] shadow-xs cursor-pointer"
            >
              <option value="today">Hôm Nay (Tối nay có ca)</option>
              <option value="tomorrow">Ngày Mai (Đặt cọc giữ chỗ)</option>
              <option value="weekend">Cuối Tuần Này (Kèo vàng)</option>
            </select>
          </div>

          {/* 4. Time Slot Select */}
          <div className="space-y-1.5">
            <label htmlFor="hero-timeslot" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
              <Flame className="w-3.5 h-3.5 mr-1 text-orange-500" />
              Khung giờ đá
            </label>
            <select
              id="hero-timeslot"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0284c7] shadow-xs cursor-pointer"
            >
              <option value="gold">Giờ Vàng: 16:00 - 20:00</option>
              <option value="afternoon">Chiều Sớm: 14:00 - 16:00</option>
              <option value="night">Đêm: 20:00 - 22:00</option>
              <option value="all">Tất cả các ca trong ngày</option>
            </select>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="hidden sm:flex items-center space-x-2 text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Đặt ca theo giá niêm yết • Cọc 50% qua VietQR • Chính sách hoàn cọc theo từng sân</span>
          </div>

          <button
            type="button"
            onClick={() => onOpenAuth("login", "PLAYER")}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-sky-600 hover:from-[#083a50] hover:to-sky-500 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Quét Ca Sân Trống Ngay</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          SECTION 3: 4 CHỈ SỐ LẤY TRỰC TIẾP TỪ CSDL
         ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 min-w-0">
          <div className="text-xl sm:text-3xl font-mono font-black text-[#0b4f6c] dark:text-sky-400">
            {stats.loading ? "—" : stats.pitches}
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cụm sân trong CSDL</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 min-w-0">
          <div className="text-xl sm:text-3xl font-mono font-black text-sky-700 dark:text-sky-400">
            {stats.loading ? "—" : stats.tournaments}
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Giải đấu đã đăng</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 min-w-0">
          <div className="text-xl sm:text-3xl font-mono font-black text-amber-500">{stats.loading ? "—" : stats.matchesPlayed}</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trận đã có kết quả</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 min-w-0">
          <div className="text-xl sm:text-3xl font-mono font-black text-sky-500">{stats.loading ? "—" : stats.posts}</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kèo đang mở</div>
        </div>
      </div>
    </div>
  );
}
