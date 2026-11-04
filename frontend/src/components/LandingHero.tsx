"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Radio,
} from "lucide-react";
import { API_BASE_URL, fetchWithTimeout } from "@/lib/api";

interface LandingHeroProps {
  onOpenAuth: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
}

type ShowcaseMode = "pitch" | "tournament" | "matchmaking";

/** Bộ đếm số tăng dần mượt mà khi dữ liệu tải xong */
function AnimatedCounter({ value, loading }: { value: number; loading: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (value <= 0) {
      setDisplay(0);
      return;
    }
    let start = 0;
    const duration = 900;
    const stepTime = 25;
    const steps = Math.max(1, Math.floor(duration / stepTime));
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, loading]);

  if (loading) return <span>—</span>;
  return <span>{display}</span>;
}

export default function LandingHero({ onOpenAuth, onNavigateTab }: LandingHeroProps) {
  const [city, setCity] = useState("dn");
  const [pitchType, setPitchType] = useState("7");
  const [timeSlot, setTimeSlot] = useState("gold");
  const [dateChoice, setDateChoice] = useState("today");

  // Chế độ tương tác trên Hero Showcase
  const [activeMode, setActiveMode] = useState<ShowcaseMode>("pitch");
  const [selectedPreviewSlot, setSelectedPreviewSlot] = useState("17:30 - 18:30");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const [stats, setStats] = useState({
    pitches: 0,
    tournaments: 0,
    posts: 0,
    matchesPlayed: 0,
    loading: true,
  });
  const [liveItems, setLiveItems] = useState<
    { id: string; badge: string; text: string; tab?: string }[]
  >([]);

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
        const pitchArr = Array.isArray(pitches) ? pitches : [];
        const tourneyArr = Array.isArray(tournaments) ? tournaments : [];
        const postArr = Array.isArray(posts) ? posts : [];

        let played = 0;
        for (const t of tourneyArr) {
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
          pitches: pitchArr.length,
          tournaments: tourneyArr.length,
          posts: postArr.filter((p: any) => (p.status ?? "OPEN") === "OPEN").length,
          matchesPlayed: played,
          loading: false,
        });

        // Tạo dải băng chuyền sự kiện trực tiếp từ dữ liệu thật
        const ticker: { id: string; badge: string; text: string; tab?: string }[] = [];
        pitchArr.slice(0, 3).forEach((p: any, idx: number) => {
          ticker.push({
            id: `p-${idx}`,
            badge: "Sân trống",
            text: `${p.name} (${p.location || "Đà Nẵng"}) đang mở đặt ca trực tuyến`,
          });
        });
        tourneyArr.slice(0, 3).forEach((t: any, idx: number) => {
          ticker.push({
            id: `t-${idx}`,
            badge: "Giải đấu",
            text: `${t.title} · ${t.registeredTeams ?? 0}/${t.totalTeams ?? 16} đội tham dự`,
            tab: "tournaments",
          });
        });
        postArr.slice(0, 2).forEach((m: any, idx: number) => {
          ticker.push({
            id: `m-${idx}`,
            badge: "Bắt kèo",
            text: `${m.teamName || "CLB Đà Nẵng"} đang tìm đối giao hữu khung giờ ${m.timeSlot || "18:30"}`,
            tab: "matchmaking",
          });
        });

        if (ticker.length === 0) {
          ticker.push(
            {
              id: "d1",
              badge: "Sân trống",
              text: "Hệ thống cụm sân cỏ nhân tạo Đà Nẵng đang mở đặt lịch giữ ca qua VietQR",
            },
            {
              id: "d2",
              badge: "Giải đấu",
              text: "Khởi tranh các giải bóng đá phong trào Sân 5 & Sân 7 tại Đà Nẵng",
              tab: "tournaments",
            },
            {
              id: "d3",
              badge: "Bắt kèo",
              text: "Cộng đồng đội bóng Đà Nẵng đang mở kèo giao hữu mỗi tối",
              tab: "matchmaking",
            }
          );
        }
        setLiveItems(ticker);
      })
      .catch(() => {
        if (alive) setStats((s) => ({ ...s, loading: false }));
      });
    return () => {
      alive = false;
    };
  }, []);

  // Tự động luân chuyển chế độ giới thiệu sau mỗi 7 giây nếu người dùng chưa thao tác
  useEffect(() => {
    const modes: ShowcaseMode[] = ["pitch", "tournament", "matchmaking"];
    const timer = setInterval(() => {
      setActiveMode((prev) => {
        const nextIdx = (modes.indexOf(prev) + 1) % modes.length;
        return modes[nextIdx];
      });
    }, 7500);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    setTilt({ x, y });
  };

  const previewSlots = [
    { time: "16:30 - 17:30", price: "280.000đ", status: "Còn 3 sân trống", hot: false },
    { time: "17:30 - 18:30", price: "350.000đ", status: "Giờ vàng · Còn 2 sân", hot: true },
    { time: "18:30 - 19:30", price: "350.000đ", status: "Giờ vàng · Còn 1 sân", hot: true },
    { time: "19:30 - 20:30", price: "320.000đ", status: "Còn 4 sân trống", hot: false },
  ];

  const modeTabs: { id: ShowcaseMode; label: string; icon: any }[] = [
    { id: "pitch", label: "Sơ đồ đặt sân", icon: Calendar },
    { id: "tournament", label: "Nhánh giải đấu", icon: Trophy },
    { id: "matchmaking", label: "Radar cáp kèo", icon: Swords },
  ];

  return (
    <div className="w-full space-y-6">
      {/* 1. DẢI BĂNG CHUYỀN SỰ KIỆN TRỰC TIẾP (LIVE MATCHDAY TICKER) */}
      {liveItems.length > 0 && (
        <div className="bg-slate-900 text-white landing-card-radius px-4 py-2.5 border border-slate-800 flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[13px] font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 live-radar-dot" />
            <Radio className="w-3.5 h-3.5" />
            <span>Trực tiếp sân cỏ</span>
          </div>

          <div className="overflow-hidden flex-1 relative">
            <div className="animate-marquee-ticker items-center gap-8">
              {[...liveItems, ...liveItems].map((item, idx) => (
                <button
                  key={`${item.id}-${idx}`}
                  type="button"
                  onClick={() =>
                    item.tab && onNavigateTab
                      ? onNavigateTab(item.tab)
                      : onOpenAuth("login", "PLAYER")
                  }
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-200 hover:text-emerald-300 transition-colors cursor-pointer shrink-0"
                >
                  <span className="px-2 py-0.5 rounded bg-white/10 text-sky-300 font-bold text-[13px]">
                    {item.badge}
                  </span>
                  <span>{item.text}</span>
                  <span className="text-slate-600 pl-4">•</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. HERO SÂN VẬN ĐỘNG ĐA CHẾ ĐỘ TƯƠNG TÁC */}
      <div className="relative overflow-hidden landing-shell-radius bg-gradient-to-br from-[#041d2b] via-[#0b4f6c] to-[#0369a1] text-white border border-sky-700/60">
        {/* Ánh sáng sân vận động & Lưới sân bóng */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 82% 22%, rgba(16, 185, 129, 0.65) 0%, transparent 45%), radial-gradient(circle at 12% 85%, rgba(56, 189, 248, 0.5) 0%, transparent 50%)",
          }}
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-12 w-[500px] h-[500px] text-white/[0.05]"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="72" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="6" fill="currentColor" />
          <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="2" />
          <rect x="14" y="14" width="172" height="172" rx="14" stroke="currentColor" strokeWidth="2" />
        </svg>

        <div className="relative z-10 p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Cột Trái: Thông điệp & Hành động */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-5"
          >
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sky-100 text-[13px] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 live-radar-dot" />
              <span>Trung tâm đặt sân &amp; giải đấu bóng đá Đà Nẵng</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.16] text-white">
              Chạm Để Giữ Sân Cỏ,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-200">
                Bùng Nổ Mọi Trận Cầu
              </span>{" "}
              Tại Đà Nẵng
            </h1>

            <p className="text-sm sm:text-base text-sky-100/90 leading-relaxed max-w-2xl font-medium">
              Trải nghiệm đặt sân bóng trực quan theo sơ đồ thực tế, thanh toán VietQR xác nhận ngay lập tức, ghép kèo giao hữu và vận hành giải đấu tự động.
            </p>

            {/* Nút hành động có hiệu ứng quét sáng (btn-shine-effect) */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenAuth("login", "PLAYER")}
                className="btn-shine-effect px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[15px] transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
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
                className="px-5 py-3.5 rounded-xl bg-white/12 hover:bg-white/22 text-white font-bold text-[15px] border border-white/25 backdrop-blur-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Đấu Trường Giải Đấu</span>
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

            {/* 3 Cam kết nổi bật */}
            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-semibold text-sky-100/90">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Giữ ca tự động 24/7</span>
              </div>
              <div className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Đặt cọc VietQR an toàn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Lịch đấu &amp; bảng điểm thời gian thực</span>
              </div>
            </div>
          </motion.div>

          {/* Cột Phải: Bảng Điều Khiển Sân Vận Động Tương Tác 3 Chế Độ (Interactive 3D Card) */}
          <div
            className="lg:col-span-5"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTilt({ x: 0, y: 0 })}
          >
            <motion.div
              animate={{ rotateX: tilt.y, rotateY: tilt.x }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              style={{ transformPerspective: 1000 }}
              className="rounded-2xl bg-slate-950/65 backdrop-blur-md border border-white/20 p-4 sm:p-5 space-y-4"
            >
              {/* Thanh chuyển đổi 3 chế độ tương tác */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/10 border border-white/10">
                {modeTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveMode(tab.id)}
                      className={`relative flex-1 py-2 px-2.5 rounded-lg text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        isActive ? "text-slate-950" : "text-sky-100 hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="heroShowcaseTabIndicator"
                          className="absolute inset-0 rounded-lg bg-emerald-400"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" />
                      <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Nội dung động theo từng chế độ */}
              <div className="min-h-[260px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {activeMode === "pitch" && (
                    <motion.div
                      key="mode-pitch"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3.5"
                    >
                      {/* Mô phỏng mặt sân cỏ chiến thuật */}
                      <div className="relative rounded-xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 p-4 border border-emerald-400/40 overflow-hidden">
                        <div className="flex items-center justify-between gap-2 relative z-10">
                          <div>
                            <span className="text-[13px] font-bold text-emerald-200 block">
                              Sân 7A · Cụm Sân Trung Tâm Đà Nẵng
                            </span>
                            <h3 className="text-base font-black text-white">
                              Chọn thử ca trống để xem giá ngay
                            </h3>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-black text-[13px]">
                            Sẵn sàng
                          </span>
                        </div>
                      </div>

                      {/* Các khung giờ tương tác bấm chọn thử */}
                      <div className="grid grid-cols-2 gap-2">
                        {previewSlots.map((slot) => {
                          const selected = selectedPreviewSlot === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => setSelectedPreviewSlot(slot.time)}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                selected
                                  ? "bg-emerald-500/25 border-emerald-400 text-white"
                                  : "bg-white/5 hover:bg-white/10 border-white/15 text-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[14px] font-black">{slot.time}</span>
                                {slot.hot && (
                                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                              </div>
                              <div className="text-[13px] text-emerald-300 font-bold mt-0.5">
                                {slot.price}/giờ
                              </div>
                              <div className="text-[13px] text-sky-200/80">{slot.status}</div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-1 flex items-center justify-between gap-2">
                        <span className="text-[13px] text-sky-200 font-medium">
                          Đang chọn: <strong className="text-white">{selectedPreviewSlot}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenAuth("login", "PLAYER")}
                          className="px-3.5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[13px] flex items-center gap-1 cursor-pointer"
                        >
                          <span>Giữ ca này</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeMode === "tournament" && (
                    <motion.div
                      key="mode-tournament"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3.5"
                    >
                      <div className="rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-400/35 p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
                            <Trophy className="w-5 h-5 text-amber-300" />
                          </div>
                          <div>
                            <div className="text-[14px] font-black text-white">
                              Hệ Thống Chia Nhánh &amp; Bảng Điểm Tự Động
                            </div>
                            <div className="text-[13px] text-amber-200">
                              {stats.tournaments} giải đấu · {stats.matchesPlayed} trận đã cập nhật tỷ số
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mô phỏng nhánh đấu trực quan */}
                      <div className="rounded-xl bg-white/5 border border-white/15 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-[13px] text-sky-200 font-bold">
                          <span>Bán kết 1 · Sân 7A</span>
                          <span className="text-emerald-300">Đã kết thúc</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-lg border border-white/10">
                          <span className="text-[14px] font-bold text-white">FC Sông Hàn</span>
                          <span className="px-2.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 font-black text-[14px]">
                            3 - 1
                          </span>
                          <span className="text-[14px] font-semibold text-slate-300">FC Hải Châu</span>
                        </div>

                        <div className="flex items-center justify-between text-[13px] text-sky-200 font-bold pt-1">
                          <span>Bán kết 2 · Sân 7B</span>
                          <span className="text-amber-300">19:30 tối nay</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-lg border border-white/10">
                          <span className="text-[14px] font-bold text-white">FC Sơn Trà</span>
                          <span className="px-2.5 py-0.5 rounded bg-amber-500/25 text-amber-300 font-black text-[13px]">
                            Sắp đá
                          </span>
                          <span className="text-[14px] font-bold text-white">FC Thanh Khê</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onNavigateTab ? onNavigateTab("tournaments") : onOpenAuth("login", "PLAYER")
                        }
                        className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[13px] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trophy className="w-4 h-4" />
                        <span>Mở Toàn Bộ Bảng Đấu &amp; Giải Đấu</span>
                      </button>
                    </motion.div>
                  )}

                  {activeMode === "matchmaking" && (
                    <motion.div
                      key="mode-matchmaking"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3.5"
                    >
                      <div className="rounded-xl bg-gradient-to-r from-sky-500/20 to-emerald-500/20 border border-sky-300/35 p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center shrink-0">
                            <Swords className="w-5 h-5 text-emerald-300" />
                          </div>
                          <div>
                            <div className="text-[14px] font-black text-white">
                              Sàn Cáp Kèo &amp; Tìm Đối Giao Hữu
                            </div>
                            <div className="text-[13px] text-sky-200">
                              Đang có {stats.posts} kèo chờ bắt đối tại Đà Nẵng
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/5 border border-white/15 p-4 flex items-center justify-between gap-3">
                        <div className="text-center space-y-1 flex-1">
                          <div className="w-11 h-11 rounded-full bg-sky-500/25 border border-sky-300/40 mx-auto flex items-center justify-center font-black text-white text-[14px]">
                            ĐN
                          </div>
                          <div className="text-[14px] font-bold text-white">FC Đà Nẵng Trẻ</div>
                          <div className="text-[13px] text-emerald-300 font-semibold">Đã có sân 7</div>
                        </div>

                        <div className="px-3 py-1.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 font-black text-[13px]">
                          Tìm đối 50/50
                        </div>

                        <div className="text-center space-y-1 flex-1">
                          <div className="w-11 h-11 rounded-full bg-white/10 border border-dashed border-white/35 mx-auto flex items-center justify-center font-black text-sky-200 text-[14px]">
                            ?
                          </div>
                          <div className="text-[14px] font-bold text-sky-200">Đội của bạn</div>
                          <div className="text-[13px] text-amber-300 font-semibold">18:30 tối nay</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onNavigateTab ? onNavigateTab("matchmaking") : onOpenAuth("login", "PLAYER")
                        }
                        className="w-full py-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[13px] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Vào Sàn Bắt Kèo Giao Hữu Ngay</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 3. THANH TRA CỨU SÂN TRỐNG NHANH */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white landing-shell-radius p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Tra Cứu &amp; Giữ Khung Giờ Sân Trống
              </h2>
              <p className="text-[13px] text-slate-500 font-medium">
                Lọc theo khu vực quận huyện, loại sân và ca thi đấu thực tế
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPitchType("7");
                setTimeSlot("gold");
                onOpenAuth("login", "PLAYER");
              }}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-[#0369a1] border border-slate-200 text-[13px] font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Sân 7 giờ vàng</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigateTab ? onNavigateTab("matchmaking") : onOpenAuth("login", "PLAYER")
              }
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-[#0369a1] border border-slate-200 text-[13px] font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Swords className="w-3.5 h-3.5 text-[#0369a1]" />
              <span>Kèo giao hữu tối nay</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onNavigateTab ? onNavigateTab("tournaments") : onOpenAuth("login", "PLAYER")
              }
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-[#0369a1] border border-slate-200 text-[13px] font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Giải đang mở đăng ký</span>
            </button>
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
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] cursor-pointer"
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
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] cursor-pointer"
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
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] cursor-pointer"
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
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] cursor-pointer"
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
            className="btn-shine-effect w-full px-5 py-2.5 h-[44px] rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[14px] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Tìm Sân Trống</span>
          </button>
        </div>
      </motion.div>

      {/* 4. THỐNG KÊ HỆ THỐNG CÓ HIỆU ỨNG ĐẾM SỐ TĂNG DẦN (ANIMATED COUNTER) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {[
          {
            label: "Cụm sân hoạt động",
            val: stats.pitches,
            icon: MapPin,
            tone: "bg-sky-50 border-sky-200 text-[#0369a1]",
          },
          {
            label: "Giải đấu phong trào",
            val: stats.tournaments,
            icon: Trophy,
            tone: "bg-amber-50 border-amber-200 text-amber-600",
          },
          {
            label: "Trận đấu hoàn tất",
            val: stats.matchesPlayed,
            icon: CheckCircle2,
            tone: "bg-emerald-50 border-emerald-200 text-emerald-600",
          },
          {
            label: "Kèo giao hữu đang mở",
            val: stats.posts,
            icon: Swords,
            tone: "bg-rose-50 border-rose-200 text-rose-600",
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 * idx }}
              className="bg-white p-4 sm:p-5 landing-card-interactive border border-slate-200 flex items-center gap-3.5"
            >
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${item.tone}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  <AnimatedCounter value={item.val} loading={stats.loading} />
                </div>
                <div className="text-[13px] sm:text-[14px] font-bold text-slate-600">
                  {item.label}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
