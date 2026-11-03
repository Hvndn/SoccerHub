"use client";

import React, { useEffect, useState } from "react";
import SafeImage from "@/components/SafeImage";
import {
  MapPin,
  Trophy,
  Clock,
  Search,
  CheckCircle2,
  Users,
  Shield,
  Sparkles,
  Calendar,
  ArrowRight,
  Zap,
  QrCode,
  Flame,
  Swords,
} from "lucide-react";
import { API_BASE_URL, fetchWithTimeout } from "@/lib/api";

interface LandingHeroProps {
  onOpenAuth: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
}

export default function LandingHero({ onOpenAuth, onNavigateTab }: LandingHeroProps) {
  const [city, setCity] = useState("dn");
  const [pitchType, setPitchType] = useState("7");
  const [timeSlot, setTimeSlot] = useState("gold");
  const [dateChoice, setDateChoice] = useState("today");

  const [stats, setStats] = useState({
    pitches: 0,
    tournaments: 0,
    posts: 0,
    matchesPlayed: 0,
    loading: true,
  });

  useEffect(() => {
    let alive = true;
    const get = (p: string) =>
      fetchWithTimeout(`${API_BASE_URL}${p}`)
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
            for (const r of b?.rounds ?? [])
              for (const m of r.matches ?? [])
                if (m.status === "DONE") played += 1;
          } catch {
            /* ignore */
          }
        }
        setStats({
          pitches: Array.isArray(pitches) ? pitches.length : 0,
          tournaments: Array.isArray(tournaments) ? tournaments.length : 0,
          posts: Array.isArray(posts)
            ? posts.filter((p: any) => (p.status ?? "OPEN") === "OPEN").length
            : 0,
          matchesPlayed: played,
          loading: false,
        });
      })
      .catch(() => {
        if (alive) setStats((s) => ({ ...s, loading: false }));
      });
    return () => {
      alive = false;
    };
  }, []);

  const quickTags = [
    {
      label: "Sân 7 người giờ vàng",
      icon: Flame,
      action: () => {
        setPitchType("7");
        setTimeSlot("gold");
        onOpenAuth("login", "PLAYER");
      },
    },
    {
      label: "Kèo giao hữu tối nay",
      icon: Swords,
      action: () => (onNavigateTab ? onNavigateTab("matchmaking") : onOpenAuth("login", "PLAYER")),
    },
    {
      label: "Giải đấu đang mở đăng ký",
      icon: Trophy,
      action: () => (onNavigateTab ? onNavigateTab("tournaments") : onOpenAuth("login", "PLAYER")),
    },
  ];

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* HERO BANNER ĐẲNG CẤP SÂN VẬN ĐỘNG */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#062333] via-[#0b4f6c] to-[#0369a1] text-white shadow-xl border border-sky-800/60">
        {/* Họa tiết đường kẻ sân cỏ & ánh sáng sân vận động */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.55) 0%, transparent 45%), radial-gradient(circle at 15% 80%, rgba(56, 189, 248, 0.45) 0%, transparent 50%)",
          }}
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -bottom-16 w-[480px] h-[480px] text-white/[0.05]"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="8" fill="currentColor" />
          <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="2" />
          <rect x="15" y="15" width="170" height="170" rx="12" stroke="currentColor" strokeWidth="2" />
        </svg>

        <div className="relative z-10 p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Cột nội dung bên trái */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sky-100 text-[13px] font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span>Nền tảng bóng đá phong trào số 1 Đà Nẵng</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.18] text-white">
              Đặt Sân Cỏ Nhân Tạo &amp;{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-200">
                Tranh Tài Giải Đấu
              </span>{" "}
              Chỉ Trong 30 Giây
            </h1>

            <p className="text-sm sm:text-base text-sky-100/90 leading-relaxed max-w-2xl font-medium">
              Tra cứu lịch trống trực tiếp của các cụm sân tại Đà Nẵng, giữ ca tự động qua VietQR, bắt đối giao hữu và điều hành nhánh đấu chuyên nghiệp.
            </p>

            {/* Cụm nút hành động chính */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenAuth("login", "PLAYER")}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[15px] shadow-lg shadow-emerald-950/30 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4 stroke-[2.5]" />
                <span>Đặt Sân Ngay</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() =>
                  onNavigateTab ? onNavigateTab("tournaments") : onOpenAuth("login", "PLAYER")
                }
                className="px-5 py-3.5 rounded-xl bg-white/12 hover:bg-white/20 text-white font-bold text-[15px] border border-white/25 backdrop-blur-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Khám Phá Giải Đấu</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth("login", "OWNER")}
                className="px-5 py-3.5 rounded-xl bg-slate-950/35 hover:bg-slate-950/55 text-sky-100 font-bold text-[14px] border border-sky-300/25 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-emerald-300" />
                <span>Dành Cho Chủ Sân</span>
              </button>
            </div>

            {/* Cam kết tin cậy */}
            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-semibold text-sky-100/90">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Xác nhận giữ sân tức thì</span>
              </div>
              <div className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Thanh toán VietQR minh bạch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Tự động chia nhánh giải đấu</span>
              </div>
            </div>
          </div>

          {/* Cột Visual Showcase bên phải */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-[390px] mx-auto">
              {/* Vòng sáng phía sau cầu thủ */}
              <div
                aria-hidden="true"
                className="absolute inset-4 rounded-full bg-gradient-to-tr from-emerald-400/25 to-sky-300/20 blur-2xl"
              />

              <div className="relative z-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 shadow-2xl">
                <SafeImage
                  src="/images/epic-goal-player.png"
                  alt="Đặt sân bóng đá trực tuyến Turfzone"
                  className="w-full h-[270px] sm:h-[300px] object-contain drop-shadow-2xl"
                />

                {/* Thẻ nổi 1: Trạng thái giữ sân thực tế */}
                <div className="mt-2 rounded-xl bg-slate-950/75 backdrop-blur-md border border-white/15 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-extrabold text-white line-clamp-2">
                        Lịch sân trống cập nhật trực tiếp
                      </div>
                      <div className="text-[13px] text-sky-200 font-medium">
                        {stats.loading
                          ? "Đang đồng bộ dữ liệu cụm sân..."
                          : `${stats.pitches} cụm sân · ${stats.tournaments} giải đấu đang mở`}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[13px] font-bold shrink-0">
                    Trực tiếp
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THANH TRA CỨU SÂN TRỐNG THÔNG MINH */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Tra Cứu Nhanh Khung Giờ Sân Trống
              </h2>
              <p className="text-[13px] text-slate-500 font-medium">
                Chọn khu vực và khung giờ mong muốn để giữ sân ngay lập tức
              </p>
            </div>
          </div>

          {/* Hàng chip gợi ý nhanh */}
          <div className="flex flex-wrap items-center gap-2">
            {quickTags.map((tag, idx) => {
              const TagIcon = tag.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={tag.action}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-[#0369a1] border border-slate-200 hover:border-sky-300 text-[13px] font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <TagIcon className="w-3.5 h-3.5 text-[#0369a1]" />
                  <span>{tag.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          <div className="space-y-1.5">
            <label
              htmlFor="hero-city"
              className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4 text-[#0369a1]" />
              <span>Khu vực tại Đà Nẵng</span>
            </label>
            <select
              id="hero-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] transition-colors cursor-pointer"
            >
              <option value="dn">Toàn thành phố Đà Nẵng</option>
              <option value="dn-hai-chau">Hải Châu · Thanh Khê · Sơn Trà</option>
              <option value="dn-cam-le">Cẩm Lệ · Liên Chiểu · Ngũ Hành Sơn</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="hero-pitch-type"
              className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-[#0369a1]" />
              <span>Loại mặt sân</span>
            </label>
            <select
              id="hero-pitch-type"
              value={pitchType}
              onChange={(e) => setPitchType(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] transition-colors cursor-pointer"
            >
              <option value="7">Sân 7 người tiêu chuẩn</option>
              <option value="5">Sân 5 người / Futsal</option>
              <option value="11">Sân 11 người</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="hero-date"
              className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-[#0369a1]" />
              <span>Ngày thi đấu</span>
            </label>
            <select
              id="hero-date"
              value={dateChoice}
              onChange={(e) => setDateChoice(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] transition-colors cursor-pointer"
            >
              <option value="today">Hôm nay</option>
              <option value="tomorrow">Ngày mai</option>
              <option value="weekend">Cuối tuần này</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="hero-timeslot"
              className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4 text-[#0369a1]" />
              <span>Khung giờ đá</span>
            </label>
            <select
              id="hero-timeslot"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] transition-colors cursor-pointer"
            >
              <option value="gold">16:30 - 20:30 (Giờ cao điểm)</option>
              <option value="afternoon">14:00 - 16:30 (Buổi chiều)</option>
              <option value="night">20:30 - 22:30 (Buổi tối)</option>
              <option value="all">Tất cả khung giờ</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => onOpenAuth("login", "PLAYER")}
            className="w-full px-5 py-2.5 h-[44px] rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[14px] shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Tìm Sân Trống</span>
          </button>
        </div>
      </div>

      {/* 4 THẺ CHỈ SỐ HOẠT ĐỘNG THỰC TẾ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-[#0369a1] flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.loading ? "—" : stats.pitches}
            </div>
            <div className="text-[13px] sm:text-[14px] font-bold text-slate-600">
              Cụm sân hoạt động
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.loading ? "—" : stats.tournaments}
            </div>
            <div className="text-[13px] sm:text-[14px] font-bold text-slate-600">
              Giải đấu phong trào
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.loading ? "—" : stats.matchesPlayed}
            </div>
            <div className="text-[13px] sm:text-[14px] font-bold text-slate-600">
              Trận đấu hoàn tất
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.loading ? "—" : stats.posts}
            </div>
            <div className="text-[13px] sm:text-[14px] font-bold text-slate-600">
              Kèo giao hữu đang mở
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
