"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { sportLabel, formatLabel, formatMoney } from "@/lib/tournamentService";
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
  
  // Live Score State for Court 1 (Football 7A SF1)
  const [scoreA, setScoreA] = useState<number>(10);
  const [scoreB, setScoreB] = useState<number>(8);
  const [currentSet, setCurrentSet] = useState<number>(3);
  const [serverTeam, setServerTeam] = useState<"A" | "B">("A");
  const [serverNum, setServerNum] = useState<1 | 2>(2);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [varNotice, setVarNotice] = useState<string | null>(null);

  // Active Tab for Tables/Logs
  const [bottomTab, setBottomTab] = useState<"standings" | "var_logs" | "schedule">("standings");

  // Real Database Tournaments (danh sách thật từ backend)
  const [dbTournaments, setDbTournaments] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);

  // Fetch real tournaments from backend
  const fetchDbTournaments = async () => {
    try {
      setLoadingDb(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/tournaments`);
      if (res.ok) {
        const data = await res.json();
        setDbTournaments(data);
      }
    } catch (e) {
      console.error("Lỗi tải giải đấu:", e);
    } finally {
      setLoadingDb(false);
    }
  };

  React.useEffect(() => {
    fetchDbTournaments();
  }, []);

  // Danh sách giải lấy từ CSDL — không dùng dữ liệu giả.
  const tournaments = useMemo(
    () =>
      dbTournaments.map((t: any) => {
        const teams = t.teams ?? [];
        const cap = t.totalTeams ?? 0;
        const progress = cap ? Math.min(100, Math.round((teams.length / cap) * 100)) : 0;
        const st = t.status ?? "OPEN";
        return {
          id: String(t.id),
          sport: t.sportType ?? "SAN_7",
          sportBadge: `${sportLabel(t.sportType).toUpperCase()} • ${
            st === "ONGOING" ? "ĐANG DIỄN RA" : st === "COMPLETED" ? "ĐÃ KẾT THÚC" : "ĐANG MỞ"
          }`,
          title: t.title,
          subtitle: `${teams.length}${cap ? `/${cap}` : ""} đội • ${formatLabel(t.format)} • Thưởng ${formatMoney(
            t.prizePool ?? 0
          )}`,
          progress,
          status: st === "ONGOING" ? "live" : st === "COMPLETED" ? "done" : "active",
          courts: t.pitchName || t.location || "Chưa chọn sân",
          hasBracket: !!t.bracketJson,
        };
      }),
    [dbTournaments]
  );

  const SPORT_FILTERS = [
    { id: "all", label: "Tất Cả Thể Thức" },
    { id: "SAN_7", label: "Bóng Đá Sân 7" },
    { id: "SAN_5", label: "Bóng Đá Sân 5" },
    { id: "SAN_11", label: "Bóng Đá Sân 11" },
    { id: "FUTSAL", label: "Futsal Trong Nhà" },
  ];

  const countBySportFilter = (id: string) =>
    id === "all" ? tournaments.length : tournaments.filter((t: any) => t.sport === id).length;

  // Giải dùng làm nguồn cho BXH / kết quả / lịch: giải đầu tiên đã bốc thăm trong CSDL.
  const activeTournamentId = useMemo(() => {
    const withBracket = dbTournaments.find((t: any) => t.bracketJson);
    return withBracket?.id ?? dbTournaments[0]?.id ?? null;
  }, [dbTournaments]);

  const activeTournament = useMemo(
    () => dbTournaments.find((t: any) => t.id === activeTournamentId) ?? null,
    [dbTournaments, activeTournamentId]
  );

  // Nhánh đấu parse từ bracketJson (nguồn thật, không cần gọi API thêm).
  const activeBracket = useMemo(() => {
    if (!activeTournament?.bracketJson) return null;
    try {
      const p = JSON.parse(activeTournament.bracketJson);
      return p && Array.isArray(p.rounds) ? p : null;
    } catch {
      return null;
    }
  }, [activeTournament]);

  const doneMatches = useMemo(() => {
    if (!activeBracket) return [];
    return activeBracket.rounds
      .flatMap((r: any) => r.matches)
      .filter((m: any) => m.status === "DONE" && m.teamA && m.teamB)
      .map((m: any) => ({
        matchId: m.matchId,
        teamA: m.teamA.name,
        teamB: m.teamB.name,
        scoreA: m.scoreA ?? 0,
        scoreB: m.scoreB ?? 0,
        matchDate: m.matchDate,
      }));
  }, [activeBracket]);

  const scheduledMatches = useMemo(() => {
    if (!activeBracket) return [];
    return activeBracket.rounds
      .flatMap((r: any) => r.matches)
      .filter((m: any) => m.status !== "BYE" && m.teamA && m.teamB)
      .map((m: any) => ({
        matchId: m.matchId,
        teamA: m.teamA.name,
        teamB: m.teamB.name,
        matchDate: m.matchDate,
        timeSlot: m.timeSlot,
        pitchName: m.pitchName,
      }))
      .sort((a: any, b: any) => (a.matchDate ?? "").localeCompare(b.matchDate ?? ""));
  }, [activeBracket]);

  // BXH tính từ các trận DONE (thắng 3đ, hòa 1đ; xếp điểm → hiệu số → Elo)
  const standings = useMemo(() => {
    if (!activeTournament) return [];
    const base = new Map<string, any>();
    for (const t of activeTournament.teams ?? []) {
      base.set(t.teamName, {
        team: t.teamName,
        elo: t.eloRating ?? 1200,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
      });
    }
    for (const m of doneMatches) {
      const a = base.get(m.teamA);
      const b = base.get(m.teamB);
      if (a) { a.played++; a.gf += m.scoreA; a.ga += m.scoreB; }
      if (b) { b.played++; b.gf += m.scoreB; b.ga += m.scoreA; }
      if (m.scoreA === m.scoreB) {
        if (a) a.drawn++;
        if (b) b.drawn++;
      } else if (m.scoreA > m.scoreB) {
        if (a) a.won++;
        if (b) b.lost++;
      } else {
        if (b) b.won++;
        if (a) a.lost++;
      }
    }
    return Array.from(base.values())
      .map((r: any) => ({ ...r, points: r.won * 3 + r.drawn, diff: r.gf - r.ga }))
      .sort((x: any, y: any) => y.points - x.points || y.diff - x.diff || y.elo - x.elo);
  }, [activeTournament, doneMatches]);

  // Vua phá lưới đọc từ bảng goal_events của giải
  const [topScorers, setTopScorers] = useState<any[]>([]);
  useEffect(() => {
    let alive = true;
    if (!activeTournamentId) { setTopScorers([]); return; }
    fetch(`${API_BASE_URL}/api/v1/tournaments/${activeTournamentId}/scorers`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (alive && Array.isArray(d)) setTopScorers(d.slice(0, 5)); })
      .catch(() => { if (alive) setTopScorers([]); });
    return () => { alive = false; };
  }, [activeTournamentId]);

  const filteredTournaments = selectedSport === "all"
    ? tournaments
    : tournaments.filter(t => t.sport === selectedSport);

  // Score Handlers
  const handlePointA = () => {
    setScoreA(prev => prev + 1);
  };

  const handlePointB = () => {
    setScoreB(prev => prev + 1);
  };

  const handleSwitchServer = () => {
    if (serverTeam === "A") {
      setServerTeam("B");
    } else {
      setServerTeam("A");
    }
  };

  const triggerVarClaim = () => {
    setVarNotice("Đang xem lại VAR: Kiểm tra bóng chạm tay và lỗi việt vị trong vòng cấm...");
    setTimeout(() => {
      setVarNotice("Kết quả VAR: BÀN THẮNG HỢP LỆ (Goal Confirmed). Không có lỗi việt vị!");
      setTimeout(() => setVarNotice(null), 4000);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* HEADER BAR (PITCHHUB PORTAL PRO OPERATING SYSTEM) */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-50 via-emerald-50 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 border border-sky-200">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>PITCHHUB PORTAL PRO v4.2</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>
                  {loadingDb ? "Đang đồng bộ CSDL…" : `CSDL: ${dbTournaments.length} giải đấu`}
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <span>Quản Lý Giải Đấu Bóng Đá SoccerHub</span>
              <Award className="w-8 h-8 text-amber-500 shrink-0 hidden sm:inline-block" />
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl font-medium leading-relaxed">
              Trung tâm điều hành giải đấu bóng đá tập trung: Tòa trọng tài điện tử AI, bốc thăm hạt giống tự động Elo VFF, Smart Escrow VietQR và sơ đồ nhánh đấu knockout thời gian thực.
            </p>
          </div>

          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center space-x-2 active:scale-95 shadow-xs"
            >
              <Download className="w-4 h-4 text-sky-600" />
              <span>Xuất Báo Cáo</span>
            </button>

            <button
              onClick={() =>
                setVarNotice(
                  `CSDL hiện có ${dbTournaments.length} giải đấu. Duyệt hồ sơ VĐV nằm ở mục Chợ Kèo của hệ thống.`
                )
              }
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center space-x-2 relative active:scale-95 shadow-xs"
            >
              <Users className="w-4 h-4 text-amber-600" />
              <span>Giải đang quản lý</span>
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                {dbTournaments.length}
              </span>
            </button>

            <Link
              href="/tournaments/new"
              className="px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all flex items-center space-x-2 active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Khởi Tạo Giải Đấu Mới</span>
            </Link>
          </div>
        </div>

        {/* Form tạo giải đã chuyển sang trang wizard riêng: /tournaments/new (4 bước) */}

        {/* SPORT CATEGORY FILTERS */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Bộ Lọc Môn:
            </span>
            {SPORT_FILTERS.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedSport(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  selectedSport === item.id
                    ? "bg-[#0b4f6c] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200/60"
                }`}
              >
                {item.label} ({countBySportFilter(item.id)})
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-slate-500 shrink-0 hidden md:block">
            Giải đang mở: <span className="text-emerald-700 font-bold">{countBySportFilter("all")} giải trong CSDL</span>
          </div>
        </div>
      </div>

      {/* FOOTBALL TOURNAMENT BENTO CAROUSEL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loadingDb && filteredTournaments.length === 0 ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="rounded-3xl p-6 border border-slate-200/90 bg-white space-y-3">
              <div className="skeleton-shimmer h-5 w-2/3 rounded-lg" />
              <div className="skeleton-shimmer h-3 w-1/2 rounded-lg" />
              <div className="skeleton-shimmer h-2 w-full rounded-full" />
            </div>
          ))
        ) : filteredTournaments.length === 0 ? (
          <div className="md:col-span-3 rounded-3xl p-10 text-center border border-dashed border-slate-300 bg-white">
            <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="mt-3 text-sm font-bold text-slate-600">
              {selectedSport === "all"
                ? "Chưa có giải đấu nào trong CSDL."
                : `Không có giải nào đúng bộ lọc “${SPORT_FILTERS.find((f) => f.id === selectedSport)?.label}”.`}
            </p>
          </div>
        ) : filteredTournaments.map((t: any) => (
          <div
            key={t.id}
            className={`rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-xs ${
              t.status === "live"
                ? "bg-emerald-50/40 border-emerald-300 text-slate-900"
                : "bg-white border-slate-200/90 text-slate-900"
            }`}
          >
            {t.status === "live" && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />
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
                {t.hasBracket ? "✅ Đã bốc thăm — có nhánh đấu trong CSDL" : "⏳ Chưa bốc thăm"}
              </span>

              <button
                onClick={() => onNavigateTab?.("tournaments")}
                className="text-xs font-black text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center space-x-1 group"
              >
                <span>Mở Nhánh Đấu</span>
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

          {/* 1. TÒA TRỌNG TÀI ĐIỆN TỬ SÂN 7A (LIVE BÁN KẾT SOCCERHUB CUP) */}
          <div className="bg-white border border-slate-200/90 text-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-50/50 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold shrink-0">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase text-rose-600 tracking-wider">
                      TÒA TRỌNG TÀI ĐIỆN TỬ • SÂN 7A
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[9px] font-black uppercase">
                      LIVE STREAM VAR
                    </span>
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900 mt-0.5">
                    Bán Kết SF1: FC Saigon Warriors VS FC Anh Em Kiến Trúc
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all ${
                    isPaused
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? "Tiếp Tục Trận" : "Tạm Dừng Trận"}</span>
                </button>
              </div>
            </div>

            {/* VAR Alert Notice Banner */}
            {varNotice && (
              <div className="mb-6 p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold flex items-center space-x-3 animate-bounce">
                <Video className="w-5 h-5 text-purple-600 shrink-0" />
                <span>{varNotice}</span>
              </div>
            )}

            {/* LIVE SCOREBOARD DISPLAY (HIGH-VISIBILITY STITCH SPEC) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-50 p-6 rounded-2xl border border-slate-200">
              
              {/* TEAM A SCORE */}
              <div className={`p-6 rounded-2xl border transition-all ${
                serverTeam === "A"
                  ? "bg-white border-emerald-400 shadow-sm"
                  : "bg-white/60 border-slate-200"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-black tracking-wide text-slate-700">
                      ĐỘI A (HẠT GIỐNG #1)
                    </span>
                  </div>
                  {serverTeam === "A" && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1 border border-emerald-200">
                      <Flame className="w-3 h-3 text-emerald-600" /> Giao Bóng ({serverNum})
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    FC Saigon Warriors
                  </span>
                  <span className="text-5xl font-black font-mono text-emerald-600 tracking-tighter">
                    {scoreA}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Tỷ số: Hiệp 1 (2-1) • Hiệp 2 đang đá</span>
                  <span className="text-emerald-700 font-bold">Elo: 1,650</span>
                </div>
              </div>

              {/* TEAM B SCORE */}
              <div className={`p-6 rounded-2xl border transition-all ${
                serverTeam === "B"
                  ? "bg-white border-sky-400 shadow-sm"
                  : "bg-white/60 border-slate-200"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-sky-500" />
                    <span className="text-xs font-black tracking-wide text-slate-700">
                      ĐỘI B (HẠT GIỐNG #4)
                    </span>
                  </div>
                  {serverTeam === "B" && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black uppercase flex items-center gap-1 border border-sky-200">
                      <Flame className="w-3 h-3 text-sky-600" /> Giao Bóng ({serverNum})
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    FC Titan Sài Gòn
                  </span>
                  <span className="text-5xl font-black font-mono text-sky-600 tracking-tighter">
                    {scoreB}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Tỷ số: Hiệp 1 (1-2) • Hiệp 2 đang đá</span>
                  <span className="text-sky-700 font-bold">Elo: 1,580</span>
                </div>
              </div>

            </div>

            {/* INTERACTIVE UMPIRE CONTROLS */}
            <div className="mt-6 space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Bảng Điều Khiển Điểm Trọng Tài:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={handlePointA}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+1 Bàn Thắng (Đội A)</span>
                </button>

                <button
                  onClick={handlePointB}
                  className="py-3 px-4 rounded-xl bg-[#0b4f6c] hover:bg-[#083b52] text-white text-xs font-black shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+1 Bàn Thắng (Đội B)</span>
                </button>

                <button
                  onClick={handleSwitchServer}
                  className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Đổi Quyền Phát Bóng</span>
                </button>

                <button
                  onClick={triggerVarClaim}
                  className="py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5"
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
                  Sơ Đồ Nhánh Đấu Knock-out Trực Tiếp (SoccerHub Premier Cup)
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
                      <span>FC Saigon Warriors</span>
                      <span className="font-mono">2</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>FC Hùng Dũng Q.7</span>
                      <span className="font-mono">1</span>
                    </div>
                  </div>

                  {/* QF2 */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between font-bold text-sky-600 dark:text-sky-400">
                      <span>FC Titan Sài Gòn</span>
                      <span className="font-mono">2</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>FC Chiến Thắng</span>
                      <span className="font-mono">0</span>
                    </div>
                  </div>

                  {/* QF3 */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>FC Bảo Long Gia Định</span>
                      <span className="font-mono">2</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>FC Anh Em Thủ Đức</span>
                      <span className="font-mono">1</span>
                    </div>
                  </div>

                  {/* QF4 */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>FC Sơn Tùng Bình Thạnh</span>
                      <span className="font-mono">2</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>FC Phúc Hải Tân Bình</span>
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
                      <span>FC Saigon Warriors</span>
                      <span className="font-mono font-black text-sm">1</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-sky-400">
                      <span>FC Titan Sài Gòn</span>
                      <span className="font-mono font-black text-sm">1</span>
                    </div>
                  </div>

                  {/* SF2 */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2 opacity-80">
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">
                      SF2 • Dự kiến 15:30
                    </span>
                    <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                      <span>FC Bảo Long</span>
                      <span className="font-mono">-</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                      <span>FC Sơn Tùng</span>
                      <span className="font-mono">-</span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: GRAND FINALS (CHUNG KẾT) */}
                <div className="space-y-6 self-center">
                  <div className="text-xs font-black text-amber-500 uppercase tracking-wider text-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    Chung Kết Tranh Cúp
                  </div>

                  <div className="bg-gradient-to-b from-amber-50 to-amber-100/40 p-5 rounded-2xl border border-amber-300 text-center space-y-3 shadow-xs">
                    <Trophy className="w-8 h-8 text-amber-500 mx-auto animate-bounce" />
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block">
                        Cúp Vô Địch 80Tr
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        Thắng SF1 vs Thắng SF2
                      </span>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 text-[10px] font-mono font-bold border border-amber-300">
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
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
                {[
                  { id: "standings", label: "Bảng Xếp Hạng" },
                  { id: "var_logs", label: "Kết Quả & Vua Phá Lưới" },
                  { id: "schedule", label: "Lịch Thi Đấu" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setBottomTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
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
                onClick={fetchDbTournaments}
                disabled={loadingDb}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? "animate-spin" : ""}`} />
                <span>{loadingDb ? "Đang tải…" : "Tải lại từ CSDL"}</span>
              </button>
            </div>

            {/* Chưa chọn giải có nhánh đấu */}
            {!activeBracket && (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
                {dbTournaments.length === 0
                  ? "Chưa đọc được danh sách giải từ CSDL."
                  : "Chưa giải nào trong CSDL đã bốc thăm. Mở tab “Giải Đấu & BXH › Bảng Đấu & Nhánh Bracket” để bốc thăm và nhập kết quả."}
              </p>
            )}

            {/* TAB CONTENT: BXH TÍNH TỪ TRẬN ĐÃ ĐÁ */}
            {bottomTab === "standings" && activeBracket && (
              standings.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
                  Chưa có trận nào có kết quả nên chưa xếp hạng được.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[620px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="py-3 px-3">Hạng</th>
                        <th className="py-3 px-3">Đội Bóng (FC)</th>
                        <th className="py-3 px-3 text-center">Trận</th>
                        <th className="py-3 px-3 text-center">T</th>
                        <th className="py-3 px-3 text-center">H</th>
                        <th className="py-3 px-3 text-center">B</th>
                        <th className="py-3 px-3 text-center">HS</th>
                        <th className="py-3 px-3 text-center">Điểm</th>
                        <th className="py-3 px-3 text-right">Elo VFF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                      {standings.map((row: any, idx: number) => (
                        <tr
                          key={row.team}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            idx === 0 ? "bg-emerald-50 dark:bg-emerald-950/20" : ""
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            {idx === 0 ? "👑 " : ""}
                            {row.team}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-300">{row.played}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{row.won}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">{row.drawn}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-rose-500">{row.lost}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400">
                            {row.diff > 0 ? `+${row.diff}` : row.diff}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-black text-slate-900 dark:text-white">{row.points}</td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-mono font-bold text-amber-500">{row.elo.toLocaleString("vi-VN")}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* TAB CONTENT: KẾT QUẢ & VUA PHÁ LƯỚI (đọc từ goal_events) */}
            {bottomTab === "var_logs" && activeBracket && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                    Kết quả đã ghi nhận ({doneMatches.length})
                  </p>
                  {doneMatches.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Chưa có trận nào kết thúc.</p>
                  ) : (
                    <div className="space-y-2">
                      {doneMatches.map((m: any) => (
                        <div
                          key={m.matchId}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="font-mono text-slate-400 shrink-0">{m.matchId}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {m.teamA} <span className="font-mono text-emerald-600 dark:text-emerald-400">{m.scoreA}-{m.scoreB}</span> {m.teamB}
                          </span>
                          <span className="font-mono text-slate-400 shrink-0">
                            {m.matchDate ? m.matchDate.split("-").reverse().join("/") : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                    Vua phá lưới giải ({topScorers.length})
                  </p>
                  {topScorers.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chưa có dữ liệu cầu thủ ghi bàn. Khi nhập kết quả ở tab Bracket, mục “Ghi bàn/kiến tạo” sẽ ghi vào bảng{" "}
                      <span className="font-mono">goal_events</span>.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {topScorers.map((s: any, idx: number) => (
                        <div
                          key={`${s.playerName}-${s.teamName}`}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-[#0b4f6c] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{s.playerName}</p>
                              <p className="text-[10px] text-slate-400 truncate">{s.teamName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 font-mono shrink-0">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                              {s.goals}⚽
                            </span>
                            {s.assists > 0 && (
                              <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold">
                                {s.assists}👟
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LỊCH THI ĐẤU THẬT */}
            {bottomTab === "schedule" && activeBracket && (
              scheduledMatches.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
                  BTC chưa bấm “Xếp lịch thi đấu” cho giải này nên chưa có ngày/giờ cho từng trận.
                </p>
              ) : (
                <div className="space-y-2">
                  {scheduledMatches.map((m: any) => (
                    <div
                      key={m.matchId}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-slate-400 shrink-0">{m.matchId}</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {m.teamA} vs {m.teamB}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-slate-500 shrink-0">
                        {m.matchDate && (
                          <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold">
                            {m.matchDate.split("-").reverse().join("/")}
                          </span>
                        )}
                        {m.timeSlot && <span className="font-bold text-slate-700 dark:text-slate-300">{m.timeSlot}</span>}
                        {m.pitchName && <span className="text-emerald-700 dark:text-emerald-400 truncate max-w-[200px]">{m.pitchName}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )
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
                  AI ELO VFF SEEDING ENGINE
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
                Thuật toán AI tự động phân tích điểm Elo VFF, phong độ giải đấu và chỉ số thể lực IoT để xếp cặp thi đấu công bằng nhất.
              </p>
            </div>

            <button
              onClick={() => alert("Đã kích hoạt thuật toán AI Tái Bốc Thăm dựa trên Elo VFF Rating mới nhất!")}
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
              Trang Thiết Bị & Bóng Thi Đấu Chính Thức
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Động Lực UHV 2.05 FIFA Pro</span>
                  <span className="text-[11px] text-slate-400">Bóng thi đấu chính thức chuẩn FIFA Quality Pro</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                  OFFICIAL
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Wika Sport / Mizuno</span>
                  <span className="text-[11px] text-slate-400">Trang bị thi đấu, áo Bib & găng tay thủ môn</span>
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
