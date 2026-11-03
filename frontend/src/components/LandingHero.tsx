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
} from "lucide-react";
import { API_BASE_URL, fetchWithTimeout } from "@/lib/api";

interface LandingHeroProps {
  onOpenAuth: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
}

export default function LandingHero({ onOpenAuth }: LandingHeroProps) {
  const [city, setCity] = useState("dn");
  const [pitchType, setPitchType] = useState("7");
  const [timeSlot, setTimeSlot] = useState("gold");
  const [dateChoice, setDateChoice] = useState("today");

  const [stats, setStats] = useState({ pitches: 0, tournaments: 0, posts: 0, matchesPlayed: 0, loading: true });
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
            for (const r of b?.rounds ?? []) for (const m of r.matches ?? []) if (m.status === "DONE") played += 1;
          } catch {
            /* ignore */
          }
        }
        setStats({
          pitches: Array.isArray(pitches) ? pitches.length : 0,
          tournaments: Array.isArray(tournaments) ? tournaments.length : 0,
          posts: Array.isArray(posts) ? posts.filter((p: any) => (p.status ?? "OPEN") === "OPEN").length : 0,
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

  return (
    <div className="w-full space-y-6">
      {/* BANNER ĐẦU TRANG TRUYỀN THỐNG */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-block px-3 py-1 rounded bg-slate-100 border border-slate-300 text-slate-700 text-[14px] font-bold">
              Hệ thống đặt sân bóng đá tại Đà Nẵng
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Đặt Sân Bóng Đá &amp; Tổ Chức Giải Đấu Phong Trào
            </h1>
            <p className="text-[15px] text-slate-600 leading-relaxed max-w-2xl">
              Tra cứu lịch sân trống theo giờ, đặt cọc trực tuyến qua VietQR, tìm đối giao hữu và quản lý bảng đấu dành cho các đội bóng tại Đà Nẵng.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenAuth("login", "PLAYER")}
                className="px-6 py-3 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[15px] flex items-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Đặt Sân Ngay</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth("login", "OWNER")}
                className="px-5 py-3 rounded-md bg-white hover:bg-slate-50 text-slate-800 font-bold text-[15px] border border-slate-300 flex items-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-[#0369a1]" />
                <span>Dành Cho Chủ Sân</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:flex lg:col-span-5 items-center justify-center">
            <div className="w-full max-w-[360px]">
              <SafeImage
                src="/images/epic-goal-player.png"
                alt="Đặt sân bóng đá trực tuyến"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KHUNG TÌM KIẾM SÂN TRỐNG TRUYỀN THỐNG */}
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-slate-300 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-[#0369a1]" />
            <span>Tra Cứu Sân Trống</span>
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-semibold text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đặt cọc 50% qua VietQR</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <label htmlFor="hero-city" className="text-[14px] font-bold text-slate-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Khu vực</span>
            </label>
            <select
              id="hero-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2.5 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#0369a1]"
            >
              <option value="dn">Toàn Đà Nẵng</option>
              <option value="dn-hai-chau">Hải Châu · Thanh Khê · Sơn Trà</option>
              <option value="dn-cam-le">Cẩm Lệ · Liên Chiểu · Ngũ Hành Sơn</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="hero-pitch-type" className="text-[14px] font-bold text-slate-700 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-slate-500" />
              <span>Loại sân</span>
            </label>
            <select
              id="hero-pitch-type"
              value={pitchType}
              onChange={(e) => setPitchType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2.5 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#0369a1]"
            >
              <option value="7">Sân 7 người</option>
              <option value="5">Sân 5 / Futsal</option>
              <option value="11">Sân 11 người</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="hero-date" className="text-[14px] font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Ngày đặt</span>
            </label>
            <select
              id="hero-date"
              value={dateChoice}
              onChange={(e) => setDateChoice(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2.5 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#0369a1]"
            >
              <option value="today">Hôm nay</option>
              <option value="tomorrow">Ngày mai</option>
              <option value="weekend">Cuối tuần</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="hero-timeslot" className="text-[14px] font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Khung giờ</span>
            </label>
            <select
              id="hero-timeslot"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2.5 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#0369a1]"
            >
              <option value="gold">16:00 - 20:00 (Giờ cao điểm)</option>
              <option value="afternoon">14:00 - 16:00 (Buổi chiều)</option>
              <option value="night">20:00 - 22:00 (Buổi tối)</option>
              <option value="all">Tất cả khung giờ</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => onOpenAuth("login", "PLAYER")}
            className="w-full px-5 py-2.5 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[15px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Tìm Sân</span>
          </button>
        </div>
      </div>

      {/* THỐNG KÊ HỆ THỐNG ĐƠN GIẢN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-300">
          <div className="text-2xl font-bold text-slate-900">
            {stats.loading ? "—" : stats.pitches}
          </div>
          <div className="text-[14px] font-semibold text-slate-600">Cụm sân hoạt động</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-300">
          <div className="text-2xl font-bold text-slate-900">
            {stats.loading ? "—" : stats.tournaments}
          </div>
          <div className="text-[14px] font-semibold text-slate-600">Giải đấu phong trào</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-300">
          <div className="text-2xl font-bold text-slate-900">
            {stats.loading ? "—" : stats.matchesPlayed}
          </div>
          <div className="text-[14px] font-semibold text-slate-600">Trận đã diễn ra</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-300">
          <div className="text-2xl font-bold text-slate-900">
            {stats.loading ? "—" : stats.posts}
          </div>
          <div className="text-[14px] font-semibold text-slate-600">Kèo giao hữu đang mở</div>
        </div>
      </div>
    </div>
  );
}
