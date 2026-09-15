"use client";

import React, { useState } from "react";
import {
  Trophy,
  ShieldCheck,
  Cpu,
  Zap,
  Activity,
  Users,
  Video,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  Plus,
  RefreshCw,
  Lock,
  Play,
  Pause,
  Award,
  Radio,
  FileText,
  Scale,
  Sparkles,
  ArrowRight,
  Filter,
  Flame,
  Search,
  Check,
  X,
  ExternalLink,
  ChevronDown
} from "lucide-react";

interface TournamentOrganizerPortalProps {
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function TournamentOrganizerPortal({
  onBackToHome,
  onNavigateTab
}: TournamentOrganizerPortalProps) {
  // Sport Filter State
  const [selectedSport, setSelectedSport] = useState<string>("all");
  
  // Live Score State for Court 1 (Pickleball SF1)
  const [scoreA, setScoreA] = useState<number>(10);
  const [scoreB, setScoreB] = useState<number>(8);
  const [currentSet, setCurrentSet] = useState<number>(3);
  const [serverTeam, setServerTeam] = useState<"A" | "B">("A");
  const [serverNum, setServerNum] = useState<1 | 2>(2);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [varNotice, setVarNotice] = useState<string | null>(null);

  // Active Tab for Tables/Logs
  const [bottomTab, setBottomTab] = useState<"standings" | "var_logs" | "schedule">("standings");

  // Filter tournaments by sport
  const tournaments = [
    {
      id: "t1",
      sport: "pickleball",
      sportBadge: "PICKLEBALL • TRỰC TIẾP",
      title: "Pickleball Open Cup 2025 - Hạng Trình 6.5",
      subtitle: "32 Cặp Đôi • 24/48 Trận • Tổng Thưởng 80.000.000 VNĐ",
      progress: 50,
      status: "live",
      courts: "Sân P-01, P-02, P-03",
      sponsorLogo: "⚡ Joola & Vietcombank"
    },
    {
      id: "t2",
      sport: "football",
      sportBadge: "BÓNG ĐÁ 7 NGƯỜI • VÒNG BẢNG",
      title: "Giải Vô Địch 7 Người Mùa Thu 2025",
      subtitle: "16 Đội • 4 Bảng • 58 Bàn Thắng",
      progress: 65,
      status: "active",
      courts: "Sân Bóng S1 & S2",
      sponsorLogo: "🔥 Kamito & RedBull"
    },
    {
      id: "t3",
      sport: "badminton",
      sportBadge: "CẦU LÔNG • SẮP DIỄN RA",
      title: "Hanoi Badminton Doubles Championship",
      subtitle: "24 Cặp • Sân 7-9 • Bắt Đầu 14:00",
      progress: 0,
      status: "upcoming",
      courts: "Cụm Sân Cầu Lông C-04",
      sponsorLogo: "🏸 Yonex Official"
    }
  ];

  const filteredTournaments = selectedSport === "all"
    ? tournaments
    : tournaments.filter(t => t.sport === selectedSport);

  // Score Handlers
  const handlePointA = () => {
    if (scoreA >= 11 && scoreA - scoreB >= 1) {
      alert("Cặp A chiến thắng Set " + currentSet + "!");
    } else {
      setScoreA(prev => prev + 1);
    }
  };

  const handlePointB = () => {
    if (scoreB >= 11 && scoreB - scoreA >= 1) {
      alert("Cặp B chiến thắng Set " + currentSet + "!");
    } else {
      setScoreB(prev => prev + 1);
    }
  };

  const handleSwitchServer = () => {
    if (serverTeam === "A") {
      if (serverNum === 1) {
        setServerNum(2);
      } else {
        setServerTeam("B");
        setServerNum(1);
      }
    } else {
      if (serverNum === 1) {
        setServerNum(2);
      } else {
        setServerTeam("A");
        setServerNum(1);
      }
    }
  };

  const triggerVarClaim = () => {
    setVarNotice("Đang xem lại VAR: Kiểm tra lỗi đè vạch Kitchen (NVZ Line)...");
    setTimeout(() => {
      setVarNotice("Kết quả VAR: Bóng HỢP LỆ (In Bounds). Điểm số giữ nguyên.");
      setTimeout(() => setVarNotice(null), 4000);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* HEADER BAR (PITCHHUB PORTAL PRO OPERATING SYSTEM) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#0b4f6c]/40 via-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1 rounded-full bg-[#0b4f6c] text-sky-300 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 border border-sky-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>PITCHHUB PORTAL PRO v4.2</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Mesh IoT: 48/48 Nodes Active</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Quản Lý Giải Đấu Đa Môn Thể Thao</span>
              <Award className="w-8 h-8 text-amber-400 shrink-0 hidden sm:inline-block" />
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl font-medium leading-relaxed">
              Trung tâm điều hành giải đấu tập trung: Tòa trọng tài điện tử AI, bốc thăm hạt giống tự động DUPR/Elo, Smart Escrow VietQR và sơ đồ nhánh đấu knockout thời gian thực.
            </p>
          </div>

          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => alert("Xuất báo cáo PDF thành công! Đã tải xuống PitchHub_Tournament_Report.pdf")}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center space-x-2 active:scale-95"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Xuất Báo Cáo PDF</span>
            </button>

            <button
              onClick={() => alert("Đã mở danh sách 12 VĐV đang chờ duyệt hồ sơ thi đấu.")}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center space-x-2 relative active:scale-95"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Duyệt VĐV</span>
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                12
              </span>
            </button>

            <button
              onClick={() => alert("Khởi tạo form Giải Đấu Mới! Điền thông tin môn đấu, thể thức và cơ cấu giải thưởng.")}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Khởi Tạo Giải Đấu Mới</span>
            </button>
          </div>
        </div>

        {/* SPORT CATEGORY FILTERS */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Bộ Lọc Môn:
            </span>
            {[
              { id: "all", label: "Tất Cả Môn (3)" },
              { id: "pickleball", label: "Pickleball (1)" },
              { id: "football", label: "Bóng Đá (1)" },
              { id: "badminton", label: "Cầu Lông (1)" },
              { id: "tennis", label: "Tennis (0)" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedSport(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  selectedSport === item.id
                    ? "bg-[#0b4f6c] text-white shadow-md border border-sky-400/40"
                    : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-slate-400 shrink-0 hidden md:block">
            Cập nhật Live Stream: <span className="text-emerald-400 font-bold">100 FPS IoT Stream</span>
          </div>
        </div>
      </div>

      {/* MULTI-SPORT TOURNAMENT BENTO CAROUSEL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredTournaments.map(t => (
          <div
            key={t.id}
            className={`rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
              t.status === "live"
                ? "bg-slate-900 border-emerald-500/50 shadow-xl shadow-emerald-500/10 text-white"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            }`}
          >
            {t.status === "live" && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            )}

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 ${
                  t.status === "live"
                    ? "bg-rose-500 text-white animate-pulse"
                    : t.status === "active"
                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>
                  {t.status === "live" && <Radio className="w-3 h-3 animate-spin" />}
                  {t.sportBadge}
                </span>

                <span className="text-[11px] font-mono text-slate-400 font-bold">
                  {t.courts}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black tracking-tight leading-snug">
                  {t.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {t.subtitle}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>Tiến Độ Giải Đấu</span>
                  <span>{t.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-500"
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                {t.sponsorLogo}
              </span>

              <button
                onClick={() => alert(`Đã chọn điều hành giải đấu: ${t.title}`)}
                className="text-xs font-black text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center space-x-1 group"
              >
                <span>Vào Điều Hành</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT GRID: LIVE ELECTRONIC UMPIRE CONSOLE (LEFT 8) + AI SEEDING & ESCROW (RIGHT 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT 8 COLS: UMPIRE CONSOLE + BRACKET ENGINE + DATA TABLES */}
        <div className="lg:col-span-8 space-y-8">

          {/* 1. TÒA TRỌNG TÀI ĐIỆN TỬ SÂN P-01 (LIVE PICKLEBALL SF1) */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold shrink-0">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase text-rose-400 tracking-wider">
                      TÒA TRỌNG TÀI ĐIỆN TỬ • SÂN P-01
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[9px] font-black uppercase">
                      LIVE STREAM VAR
                    </span>
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                    Bán Kết SF1: Hoàng Nam / Minh Đức VS Quốc Anh / Tuấn Kiệt
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all ${
                    isPaused
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? "Tiếp Tục Trận" : "Tạm Dừng Trận"}</span>
                </button>
              </div>
            </div>

            {/* VAR Alert Notice Banner */}
            {varNotice && (
              <div className="mb-6 p-4 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center space-x-3 animate-bounce">
                <Video className="w-5 h-5 text-purple-400 shrink-0" />
                <span>{varNotice}</span>
              </div>
            )}

            {/* LIVE SCOREBOARD DISPLAY (HIGH-VISIBILITY STITCH SPEC) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-950/80 p-6 rounded-2xl border border-slate-800">
              
              {/* TEAM A SCORE */}
              <div className={`p-6 rounded-2xl border transition-all ${
                serverTeam === "A"
                  ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                  : "bg-slate-900/60 border-slate-800"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-black tracking-wide text-slate-300">
                      CẶP A (HẠT GIỐNG #1)
                    </span>
                  </div>
                  {serverTeam === "A" && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Giao Bóng ({serverNum})
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-white">
                    Hoàng Nam / Minh Đức
                  </span>
                  <span className="text-5xl font-black font-mono text-emerald-400 tracking-tighter">
                    {scoreA}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Các Set trước: Set 1 (11-6), Set 2 (8-11)</span>
                  <span className="text-emerald-400 font-bold">DUPR: 6.8</span>
                </div>
              </div>

              {/* TEAM B SCORE */}
              <div className={`p-6 rounded-2xl border transition-all ${
                serverTeam === "B"
                  ? "bg-sky-950/40 border-sky-500/60 shadow-lg shadow-sky-500/10"
                  : "bg-slate-900/60 border-slate-800"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-sky-400" />
                    <span className="text-xs font-black tracking-wide text-slate-300">
                      CẶP B (HẠT GIỐNG #4)
                    </span>
                  </div>
                  {serverTeam === "B" && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Giao Bóng ({serverNum})
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-white">
                    Quốc Anh / Tuấn Kiệt
                  </span>
                  <span className="text-5xl font-black font-mono text-sky-400 tracking-tighter">
                    {scoreB}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Các Set trước: Set 1 (6-11), Set 2 (11-8)</span>
                  <span className="text-sky-400 font-bold">DUPR: 6.4</span>
                </div>
              </div>

            </div>

            {/* INTERACTIVE UMPIRE CONTROLS */}
            <div className="mt-6 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Bảng Điều Khiển Điểm Trọng Tài:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={handlePointA}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+1 Điểm Cặp A</span>
                </button>

                <button
                  onClick={handlePointB}
                  className="py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-lg shadow-sky-600/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+1 Điểm Cặp B</span>
                </button>

                <button
                  onClick={handleSwitchServer}
                  className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Đổi Giao Bóng</span>
                </button>

                <button
                  onClick={triggerVarClaim}
                  className="py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Video className="w-4 h-4 text-purple-200" />
                  <span>Khiếu Nại VAR</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. VISUAL KNOCKOUT BRACKET ENGINE (SƠ ĐỒ NHÁNH ĐẤU KNOCKOUT) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase text-[#0b4f6c] dark:text-sky-400 tracking-wider">
                  VISUAL BRACKET ENGINE
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Sơ Đồ Nhánh Đấu Knock-out Trực Tiếp (Pickleball Open Cup)
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Thể Thức: Single Elimination
                </span>
              </div>
            </div>

            {/* BRACKET TREE DIAGRAM */}
            <div className="bg-slate-50 dark:bg-slate-950/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-x-auto no-scrollbar">
              <div className="min-w-[700px] grid grid-cols-3 gap-6 relative">
                
                {/* COLUMN 1: QUARTER FINALS (TỨ KẾT) */}
                <div className="space-y-6">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider text-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    Tứ Kết (Quarter Finals)
                  </div>

                  {/* QF1 */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Hoàng Nam / Minh Đức</span>
                      <span className="font-mono">2</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Hùng / Dũng</span>
                      <span className="font-mono">1</span>
                    </div>
                  </div>

                  {/* QF2 */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between font-bold text-sky-600 dark:text-sky-400">
                      <span>Quốc Anh / Tuấn Kiệt</span>
                      <span className="font-mono">2</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Việt / Thắng</span>
                      <span className="font-mono">0</span>
                    </div>
                  </div>

                  {/* QF3 */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>Gia Bảo / Bảo Long</span>
                      <span className="font-mono">2</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Huy / Lâm</span>
                      <span className="font-mono">1</span>
                    </div>
                  </div>

                  {/* QF4 */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>Hải Sơn / Thanh Tùng</span>
                      <span className="font-mono">2</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Phúc / Hải</span>
                      <span className="font-mono">0</span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: SEMI FINALS (BÁN KẾT) */}
                <div className="space-y-12 self-center">
                  <div className="text-xs font-black text-rose-500 uppercase tracking-wider text-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    Bán Kết (Semi Finals)
                  </div>

                  {/* SF1 LIVE */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl border border-rose-500/60 shadow-md space-y-2 relative">
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded bg-rose-500 text-[9px] font-black uppercase tracking-wider text-white animate-pulse">
                      SF1 LIVE
                    </span>
                    <div className="flex items-center justify-between font-bold text-emerald-400">
                      <span>Nam / Đức</span>
                      <span className="font-mono font-black text-sm">1</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-sky-400">
                      <span>Anh / Kiệt</span>
                      <span className="font-mono font-black text-sm">1</span>
                    </div>
                  </div>

                  {/* SF2 */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2 opacity-80">
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">
                      SF2 • Dự kiến 15:30
                    </span>
                    <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                      <span>Bảo / Long</span>
                      <span className="font-mono">-</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                      <span>Sơn / Tùng</span>
                      <span className="font-mono">-</span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: GRAND FINALS (CHUNG KẾT) */}
                <div className="space-y-6 self-center">
                  <div className="text-xs font-black text-amber-500 uppercase tracking-wider text-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    Chung Kết Tranh Cúp
                  </div>

                  <div className="bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 p-5 rounded-2xl border border-amber-500/40 text-center space-y-3 shadow-xl">
                    <Trophy className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                        Cúp Vô Địch 80Tr
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        Thắng SF1 vs Thắng SF2
                      </span>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                      Trận Đấu: 17:00 Hôm Nay
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* 3. DATA TABLES & INCIDENT LOGS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* TABS HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                {[
                  { id: "standings", label: "Bảng Xếp Hạng Bảng A" },
                  { id: "var_logs", label: "Nhật Ký VAR & Kỷ Luật (4)" },
                  { id: "schedule", label: "Lịch Thi Đấu Chi Tiết" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setBottomTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                      bottomTab === tab.id
                        ? "bg-[#0b4f6c] text-white shadow-md"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => alert("Đồng bộ dữ liệu bảng đấu từ máy chủ AWS S3...")}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Cập Nhật Data</span>
              </button>
            </div>

            {/* TAB CONTENT: STANDINGS */}
            {bottomTab === "standings" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-3 px-3">Hạng</th>
                      <th className="py-3 px-3">Cặp VĐV</th>
                      <th className="py-3 px-3">Số Trận</th>
                      <th className="py-3 px-3">Thắng/Thua</th>
                      <th className="py-3 px-3">Điểm Hiệu Số</th>
                      <th className="py-3 px-3">DUPR Avg</th>
                      <th className="py-3 px-3 text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {[
                      { rank: 1, name: "Hoàng Nam / Minh Đức", played: 4, record: "4 - 0", diff: "+28", dupr: "6.8", status: "Vào Bán Kết" },
                      { rank: 2, name: "Quốc Anh / Tuấn Kiệt", played: 4, record: "3 - 1", diff: "+14", dupr: "6.4", status: "Vào Bán Kết" },
                      { rank: 3, name: "Hùng / Dũng", played: 4, record: "2 - 2", diff: "+2", dupr: "6.1", status: "Dừng Bước Tứ Kết" },
                      { rank: 4, name: "Việt / Thắng", played: 4, record: "1 - 3", diff: "-12", dupr: "5.9", status: "Vòng Bảng" }
                    ].map(row => (
                      <tr key={row.rank} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          #{row.rank}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {row.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                          {row.played}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {row.record}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                          {row.diff}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-amber-500">
                          {row.dupr}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            row.status.includes("Bán Kết")
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT: VAR LOGS */}
            {bottomTab === "var_logs" && (
              <div className="space-y-3 font-mono text-xs">
                {[
                  { time: "14:22:10", court: "Sân P-01", type: "VAR Check", detail: "Kiểm tra lỗi đè vạch Kitchen (NVZ Line violation) - Cặp B khiếu nại -> Bóng hợp lệ.", result: "Valid" },
                  { time: "14:05:45", court: "Sân P-03", type: "Thẻ Vàng", detail: "Cảnh cáo VĐV Trần Quốc Anh (Nóng giận đập vợt xuống sàn thi đấu).", result: "Yellow Card" },
                  { time: "13:40:12", court: "Sân P-02", type: "Y Tế", detail: "Tạm dừng 5 phút chăm sóc y tế sẹo cơ đùi cho VĐV Nguyễn Bảo Long.", result: "Medical Timeout" },
                  { time: "13:10:00", court: "Sân P-01", type: "Bốc Thăm", detail: "Bốc thăm quyền giao bóng trận Bán Kết SF1.", result: "Done" }
                ].map((log, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-start space-x-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{log.court} • {log.type}</span>
                        <span>{log.time}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 font-sans font-medium">
                        {log.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: DETAILED SCHEDULE */}
            {bottomTab === "schedule" && (
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 font-medium">
                <p>• 14:00 - 15:15: Bán Kết 1 (Pickleball Đôi Nam Nữ)</p>
                <p>• 15:30 - 16:45: Bán Kết 2 (Gia Bảo/Bảo Long VS Hải Sơn/Thanh Tùng)</p>
                <p>• 17:00 - 18:30: CHUNG KẾT TRANH CÚP VÔ ĐỊCH 80 TRỆU</p>
                <p>• 18:45: Lễ Trao Giải & Smart Escrow Disbursement qua VietQR Auto-Payout</p>
              </div>
            )}

          </div>

        </div>

        {/* RIGHT 4 COLS: AI SEEDING ENGINE + SMART ESCROW + SPONSORS */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* 1. AI SEEDING & MATCHMAKING ENGINE */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">
                  AI DUPR SEEDING ENGINE
                </span>
                <h4 className="text-base font-black text-white">
                  Bốc Thăm & Phân Hạt Giống AI
                </h4>
              </div>
            </div>

            {/* AI Balance Metric */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Chỉ Số Đều Kèo AI:</span>
                <span className="text-emerald-400 font-mono font-black">96% Level Match</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-400 w-[96%]" />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Thuật toán AI tự động phân tích điểm DUPR, tỷ lệ thắng tie-break và chỉ số thể lực IoT để xếp cặp thi đấu công bằng nhất.
              </p>
            </div>

            <button
              onClick={() => alert("Đã kích hoạt thuật toán AI Tái Bốc Thăm dựa trên DUPR Rating mới nhất!")}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tái Bốc Thăm Bằng AI</span>
            </button>
          </div>

          {/* 2. VIETQR SMART ESCROW (VÍ QUẢN LÝ GIẢI ĐẤU & CƠ CẤU THƯỞNG) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                    VIETQR SMART ESCROW
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Quỹ Giải Thưởng Đã Khóa
                  </h4>
                </div>
              </div>
            </div>

            <div className="text-center bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                TỔNG QUỸ THƯỞNG SMART CONTRACT
              </span>
              <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                80.000.000 VNĐ
              </span>
              <span className="text-[10px] text-slate-400 font-bold block pt-1">
                🔒 Tự động giải ngân qua VietQR ngay khi trận chung kết kết thúc
              </span>
            </div>

            {/* Prize Breakdown */}
            <div className="space-y-2.5 text-xs font-medium">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  🥇 Giải Nhất (Cúp Vô Địch)
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-white">45.000.000 VNĐ</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  🥈 Giải Nhì
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-white">25.000.000 VNĐ</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-800/10 border border-amber-800/20">
                <span className="font-bold text-amber-800 dark:text-amber-500 flex items-center gap-1.5">
                  🥉 Đồng Giải Ba (2 Cặp)
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-white">10.000.000 VNĐ</span>
              </div>
            </div>

          </div>

          {/* 3. OFFICIAL EQUIPMENT & SPONSORS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Bóng & Vợt Thi Đấu Chính Thức
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Franklin X-40</span>
                  <span className="text-[11px] text-slate-400">Bóng thi đấu ngoài trời chuẩn USAPA</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                  OFFICIAL
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Joola Perseus / Selkirk</span>
                  <span className="text-[11px] text-slate-400">Vợt thi đấu tiêu chuẩn chuyên nghiệp</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-black">
                  SPONSOR
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
