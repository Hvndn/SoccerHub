"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Home, ChevronRight, Calendar, Clock, MapPin, Trophy, Users, ShieldCheck, Zap,
  QrCode, Video, MessageSquare, CheckCircle2, RefreshCw, XCircle, PlayCircle, FileText
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import {
  fetchTournaments, sportLabel, formatLabel,
  type Tournament, type TournamentBracketData,
} from "@/lib/tournamentService";

interface ActivityScheduleProps {
  user?: any;
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

type MatchRow = {
  key: string;
  matchId: string;
  roundName: string;
  tournamentId: number;
  tournamentTitle: string;
  teamA: string;
  teamB: string;
  formA?: string;
  recordA?: string;
  formB?: string;
  recordB?: string;
  scoreA?: number;
  scoreB?: number;
  status: string;
  matchDate?: string;
  timeSlot?: string;
  pitchName?: string;
  startAt?: Date;
};

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const money = (n?: number | null) => `${(n ?? 0).toLocaleString("vi-VN")}đ`;

/** "2026-11-15" + "17:00 - 18:30" -> Date (dùng mốc đầu khung giờ). */
function parseStart(date?: string, slot?: string): Date | undefined {
  if (!date) return undefined;
  const hhmm = /(\d{1,2}):(\d{2})/.exec(slot ?? "");
  const d = new Date(`${date}T${hhmm ? `${hhmm[1].padStart(2, "0")}:${hhmm[2]}` : "00:00"}:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export const ActivitySchedule: React.FC<ActivityScheduleProps> = ({
  user,
  onBackToHome,
  onNavigateTab,
}) => {
  const [activeFilter, setActiveFilter] = useState<
    "upcoming" | "tournaments" | "matchmaking" | "history" | "cancelled"
  >("upcoming");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchRow | null>(null);

  // Đồng hồ 1 nhịp/giây cho countdown + trạng thái "đã bắt đầu"
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [ts, ps] = await Promise.all([
        fetchTournaments(true).catch(() => [] as Tournament[]),
        fetch(`${API_BASE_URL}/api/v1/community/matchmaking-posts`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [] as any[]),
      ]);
      setTournaments(ts);
      setPosts(Array.isArray(ps) ? ps : []);

      // Vé của chính mình: tra theo SĐT trong tài khoản (API search bookings)
      const phone = (user?.phone ?? "").toString().replace(/\s/g, "");
      if (phone.length >= 8) {
        const bs = await fetch(`${API_BASE_URL}/api/v1/pitches/bookings/search?query=${encodeURIComponent(phone)}`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [] as any[]);
        setMyBookings(Array.isArray(bs) ? bs : []);
      } else {
        setMyBookings([]);
      }
    } catch (e: any) {
      setLoadError(e?.message || "Không tải được dữ liệu từ máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phone]);

  /** Gom toàn bộ trận trong mọi nhánh đấu ra một danh sách phẳng. */
  const allMatches = useMemo<MatchRow[]>(() => {
    const rows: MatchRow[] = [];
    for (const t of tournaments) {
      if (!t.bracketJson) continue;
      let b: TournamentBracketData | null = null;
      try {
        const p = JSON.parse(t.bracketJson) as TournamentBracketData;
        b = p && Array.isArray(p.rounds) ? p : null;
      } catch {
        b = null;
      }
      if (!b) continue;
      for (const r of b.rounds) {
        for (const m of r.matches) {
          if (!m.teamA || !m.teamB || m.status === "BYE") continue;
          rows.push({
            key: `t${t.id}-${m.matchId}`,
            matchId: m.matchId,
            roundName: r.name,
            tournamentId: t.id,
            tournamentTitle: t.title,
            teamA: m.teamA.name,
            teamB: m.teamB.name,
            formA: m.teamA.form ?? "",
            recordA: m.teamA.record ?? "0-0-0",
            formB: m.teamB.form ?? "",
            recordB: m.teamB.record ?? "0-0-0",
            scoreA: m.scoreA,
            scoreB: m.scoreB,
            status: m.status ?? "SCHEDULED",
            matchDate: m.matchDate,
            timeSlot: m.timeSlot,
            pitchName: m.pitchName ?? t.pitchName ?? t.location ?? undefined,
            startAt: parseStart(m.matchDate, m.timeSlot),
          });
        }
      }
    }
    return rows.sort((a, b) => (a.startAt?.getTime() ?? Infinity) - (b.startAt?.getTime() ?? Infinity));
  }, [tournaments]);

  const upcoming = useMemo(
    () => allMatches.filter((m) => m.status !== "DONE" && (m.startAt ? m.startAt.getTime() > now.getTime() : false)),
    [allMatches, now]
  );
  const running = useMemo(
    () => allMatches.filter((m) => m.status !== "DONE" && m.startAt && m.startAt.getTime() <= now.getTime() && now.getTime() - m.startAt.getTime() < 6 * 3600 * 1000),
    [allMatches, now]
  );
  const doneMatches = useMemo(() => allMatches.filter((m) => m.status === "DONE"), [allMatches]);

  const openPosts = useMemo(() => posts.filter((p: any) => (p.status ?? "OPEN") === "OPEN"), [posts]);
  const matchedPosts = useMemo(() => posts.filter((p: any) => p.status === "MATCHED"), [posts]);
  const cancelledPosts = useMemo(() => posts.filter((p: any) => p.status === "CANCELLED"), [posts]);

  /** Trận nổi bật: đang diễn ra, nếu không thì trận sắp tới gần nhất. */
  const hero = running[0] ?? upcoming[0] ?? null;
  const heroSeconds = hero?.startAt ? Math.max(0, Math.floor((hero.startAt.getTime() - now.getTime()) / 1000)) : 0;

  const fmtCountdown = (total: number) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const listFor = (filter: typeof activeFilter): MatchRow[] => {
    switch (filter) {
      case "upcoming":
      case "tournaments":
        return upcoming;
      case "history":
        return doneMatches;
      default:
        return [];
    }
  };

  const visibleMatches = listFor(activeFilter);

  const filterTabs: { id: typeof activeFilter; label: string; count: number; tone: string }[] = [
    { id: "upcoming", label: "Sắp diễn ra", count: upcoming.length, tone: "bg-[#0ea5e9] text-white" },
    { id: "tournaments", label: "Lịch đấu giải", count: allMatches.length, tone: "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200" },
    { id: "matchmaking", label: "Kèo đã ghép", count: matchedPosts.length, tone: "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200" },
    { id: "history", label: "Đã đá", count: doneMatches.length, tone: "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200" },
    { id: "cancelled", label: "Đã hủy", count: cancelledPosts.length, tone: "bg-rose-100 text-rose-700" },
  ];

  const dateBox = (m: MatchRow) => {
    const d = m.startAt ?? (m.matchDate ? new Date(`${m.matchDate}T00:00:00`) : null);
    if (!d) return { top: "—", num: "—", bot: "—" };
    return { top: WEEKDAY[d.getDay()], num: String(d.getDate()), bot: d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) };
  };

  return (
    <div className="w-full bg-[#f8f9ff] dark:bg-[#0b1c30] text-[#0b1c30] dark:text-[#f8f9ff] font-sans transition-colors duration-300">
      <div className="w-full py-2">
        <div className="flex flex-col w-full gap-3 sm:gap-6">

          {/* 1. BREADCRUMB & ACTIONS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col gap-1.5">
              <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <button onClick={onBackToHome} className="hover:text-sky-800 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>Trang chủ</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-900 dark:text-white font-bold">Lịch Hoạt Động & Đặt Chỗ</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-sky-800 dark:text-sky-400 font-mono font-bold">Tất cả lịch trình</span>
              </nav>

              <div className="flex items-center gap-3">
                <h1 className="text-lg sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Lịch Trình & Vé Thi Đấu
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#0ea5e9] text-slate-950 font-black text-xs uppercase tracking-wide">
                  {tournaments.length} giải trong CSDL
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-sky-700 dark:text-sky-400 ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Đang tải…" : "Tải lại từ CSDL"}</span>
              </button>

              <button
                onClick={() => onNavigateTab && onNavigateTab("booking")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>+ Đặt Sân Mới</span>
              </button>
            </div>
          </div>

          {loadError && (
            <p className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-300">
              {loadError}
            </p>
          )}

          {/* 2. FILTER RIBBON — số liệu đếm từ CSDL */}
          <div className="flex items-center justify-between overflow-x-auto pb-1 gap-3 sm:gap-4">
            <div className="flex items-center gap-2 shrink-0">
              {filterTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveFilter(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeFilter === t.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <span>{t.label}</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${t.tone}`}>{t.count}</span>
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#0ea5e9] animate-pulse"></span>
              Lịch lấy trực tiếp từ bảng <span className="font-mono">tournaments</span> &amp;{" "}
              <span className="font-mono">matchmaking_posts</span>
            </div>
          </div>

          {/* 3. NỘI DUNG */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start">
            <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-6">

              {/* HERO: trận sắp tới / đang diễn ra */}
              {hero ? (
                <div className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-md p-4 sm:p-6 lg:p-7 flex flex-col gap-3 sm:gap-5 border border-slate-200/80 dark:border-slate-800">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-lime-400 to-teal-500"></div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-[#0ea5e9] animate-ping"></span>
                        {running.length ? "ĐANG DIỄN RA" : "TRẬN TIẾP THEO"}
                      </span>
                      {hero.startAt && !running.length && (
                        <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-rose-500" />
                          Khởi tranh sau: <span className="font-mono font-black tracking-wider text-base">{fmtCountdown(heroSeconds)}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-400 font-bold text-xs">
                        {sportLabel(tournaments.find((t) => t.id === hero.tournamentId)?.sportType)}
                      </span>
                      <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                        {hero.matchId}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {hero.teamA} vs {hero.teamB}
                    </h2>

                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <Clock className="w-4 h-4 text-sky-700" />
                        {hero.timeSlot ?? "Chưa xếp giờ"}
                        {hero.matchDate ? ` (${prettyDate(hero.matchDate)})` : ""}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4 text-sky-700" />
                        {hero.pitchName ?? "Chưa xếp sân"}
                      </span>
                    </div>

                    {/* Đội hình lấy từ danh sách đội đã đăng ký trong CSDL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {[hero.teamA, hero.teamB].map((name, i) => {
                        const entry = tournaments.find((t) => t.id === hero.tournamentId)?.teams?.find((z) => z.teamName === name);
                        const initials = name.split(" ").filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase();
                        return (
                          <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 flex flex-col gap-1.5 border border-slate-200/60 dark:border-slate-800">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                              <span className="uppercase tracking-wider">
                                {i === 0 ? "ĐỘI A" : "ĐỘI B"}
                              </span>
                              <span className={`font-mono ${i === 0 ? "text-sky-800 dark:text-sky-400" : ""}`}>
                                Phong độ {i === 0 ? (hero.recordA ?? entry?.record ?? "0-0-0") : (hero.recordB ?? entry?.record ?? "0-0-0")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                i === 0 ? "bg-[#0ea5e9] text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}>
                                {initials || "?"}
                              </span>
                              <span className="truncate">{name}</span>
                            </div>
                            <div className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400">
                              {entry
                                ? `Trọng tài đội: ${entry.captainName ?? "—"} · ${entry.memberCount ?? "—"} thành viên`
                                : "Không tìm thấy hồ sơ đội trong giải"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setSelectedMatch(hero)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-extrabold shadow-sm transition-all active:scale-95"
                      >
                        <FileText className="w-4 h-4" />
                        Xem Vé & Thông Tin Trận
                      </button>
                      <button
                        onClick={() => onNavigateTab && onNavigateTab("tournaments")}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        <Trophy className="w-4 h-4 text-sky-700" />
                        Mở Nhánh Đấu
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {hero.roundName} · {hero.tournamentTitle}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-4 sm:p-8 text-center">
                  <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                    Chưa có trận nào sắp diễn ra
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {tournaments.length === 0
                      ? "Chưa đọc được giải đấu từ máy chủ. Bấm “Tải lại từ CSDL” để thử lại."
                      : "BTC chưa bốc thăm hoặc chưa xếp lịch cho giải nào. Mở tab Điều Hành Giải Đấu để bốc thăm và xếp lịch."}
                  </p>
                </div>
              )}

              {/* DANH SÁCH TRẬN THEO BỘ LỌC */}
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeFilter === "history" ? "Kết Quả Các Trận Đã Đánh" : "Các Trận Sắp Tới"}
                    <span className="ml-2 font-mono text-xs text-slate-500">({visibleMatches.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Sắp xếp theo thời gian</span>
                </div>

                {visibleMatches.length === 0 ? (
                  <div className="rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-4 sm:p-8 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {activeFilter === "history"
                        ? "Chưa có trận nào kết thúc."
                        : "Chưa có trận nào khớp bộ lọc này."}
                    </p>
                  </div>
                ) : (
                  visibleMatches.map((m) => {
                    const db = dateBox(m);
                    return (
                      <button
                        key={m.key}
                        onClick={() => setSelectedMatch(m)}
                        className="w-full text-left rounded-xl bg-white dark:bg-slate-900 shadow-xs p-3 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-5 border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center shrink-0 text-center border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] uppercase font-bold text-slate-500">{db.top}</span>
                            <span className="text-lg leading-none text-sky-800 dark:text-sky-400 font-black">{db.num}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{db.bot}</span>
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                m.status === "DONE"
                                  ? "bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-400"
                                  : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                              }`}>
                                {m.status === "DONE" ? "ĐÃ ĐÁ" : m.roundName.toUpperCase()}
                              </span>
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{m.tournamentTitle}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs flex-wrap">
                              <span className="flex items-center gap-1 text-slate-900 dark:text-white font-semibold">
                                <Clock className="w-3.5 h-3.5 text-sky-700" />
                                {m.timeSlot ?? "Chưa xếp giờ"}
                              </span>
                              <span>•</span>
                              <span>{m.pitchName ?? "Chưa xếp sân"}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-500">{m.matchId}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              <strong className="text-slate-900 dark:text-white">{m.teamA}</strong>
                              {m.status === "DONE" && (
                                <span className="font-mono text-sky-700 dark:text-sky-400">
                                  {" "}{m.scoreA}-{m.scoreB}{" "}
                                </span>
                              )}
                              <strong className="text-slate-900 dark:text-white">{m.teamB}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-end gap-2 shrink-0">
                          <span className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5">
                            <QrCode className="w-3.5 h-3.5 text-sky-700" />
                            Chi tiết
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* VÉ ĐẶT SÂN CỦA TÔI (tra theo SĐT trong tài khoản) */}
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Vé Đặt Sân Của Tôi
                  <span className="ml-2 font-mono text-xs text-slate-500">({myBookings.length})</span>
                </h3>
                {myBookings.length === 0 ? (
                  <p className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-5 text-xs text-slate-500 dark:text-slate-400">
                    {user?.phone
                      ? "Chưa có vé nào đặt bằng số điện thoại trong tài khoản. Bấm “Tải lại từ CSDL” sau khi đặt sân."
                      : "Tài khoản chưa có số điện thoại nên chưa tra cứu được vé. Cập nhật hồ sơ trước."}
                  </p>
                ) : (
                  myBookings.map((b) => (
                    <div key={b.id} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {b.courtName ?? b.courtType ?? "Sân"} · {b.timeSlot}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {b.bookingDate} · Mã vé <span className="font-mono font-bold">{b.code}</span> · Tổng {money(b.totalPrice)} (cọc {money(b.depositPaid)})
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        b.status === "CANCELLED"
                          ? "bg-rose-100 text-rose-700"
                          : b.status === "RESALE"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-sky-100 text-sky-800"
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CỘT PHẢI: CHỢ KÈO THẬT */}
            <aside className="lg:col-span-4 flex flex-col gap-3 sm:gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-3 sm:p-5 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Kèo Ghép Đang Mở ({openPosts.length})
                </h3>

                {openPosts.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chưa có kèo nào đang mở. Mở tab Chợ Kèo để tạo kèo đầu tiên.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {openPosts.slice(0, 8).map((p: any) => (
                      <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.teamName}</span>
                          <span className="font-mono text-[10px] font-bold text-amber-600 shrink-0">
                            {p.record && p.record !== "0-0-0" ? `${p.record}` : "Tân binh"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {p.pitchName} · {p.matchTime}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Cọc dự kiến {money(p.estimatedFee)} · {p.paymentModel}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => onNavigateTab && onNavigateTab("matchmaking")}
                  className="w-full px-3 py-2 rounded-lg bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold transition-all active:scale-95"
                >
                  Mở Chợ Kèo
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-3 sm:p-5 space-y-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-700" />
                  Thống Kê Nhanh
                </h3>
                {[
                  { label: "Giải trong CSDL", value: tournaments.length },
                  { label: "Trận sắp diễn ra", value: upcoming.length },
                  { label: "Trận đã đánh", value: doneMatches.length },
                  { label: "Kèo đang mở", value: openPosts.length },
                  { label: "Vé của tôi", value: myBookings.length },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{s.label}</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* MODAL: CHI TIẾT TRẬN */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                <Trophy className="w-5 h-5 text-sky-700" />
                {selectedMatch.matchId} · {selectedMatch.roundName}
              </h3>
              <button onClick={() => setSelectedMatch(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedMatch.teamA}
              {selectedMatch.status === "DONE" && (
                <span className="font-mono text-sky-700 dark:text-sky-400">
                  {" "}{selectedMatch.scoreA}-{selectedMatch.scoreB}{" "}
                </span>
              )}
              {selectedMatch.teamB}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Giải đấu:</span>
                <div className="font-bold text-slate-900 dark:text-white">{selectedMatch.tournamentTitle}</div>
              </div>
              <div>
                <span className="text-slate-500">Ngày giờ:</span>
                <div className="font-bold text-slate-900 dark:text-white">
                  {selectedMatch.matchDate ? prettyDate(selectedMatch.matchDate) : "Chưa xếp"} · {selectedMatch.timeSlot ?? "—"}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Sân:</span>
                <div className="font-bold text-slate-900 dark:text-white">{selectedMatch.pitchName ?? "Chưa xếp"}</div>
              </div>
              <div>
                <span className="text-slate-500">Phong độ (T-H-B):</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedMatch.recordA ?? "0-0-0"} / {selectedMatch.recordB ?? "0-0-0"}
                </div>
              </div>
            </div>

            <p className="hidden sm:block text-[11px] text-slate-500 leading-relaxed">
              Vé thi đấu được cấp khi BTC nhập kết quả và thanh toán lệ phí trên CSDL. Muốn sửa tỷ số hoặc hoàn
              tiền cọc, vào tab Điều Hành Giải Đấu › Bảng Đấu &amp; Nhánh Bracket.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedMatch(null); onNavigateTab && onNavigateTab("tournaments"); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold"
              >
                Mở nhánh đấu
              </button>
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {notice && (
        <div className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-md">
          <div className="rounded-xl bg-slate-900 text-white text-xs font-bold px-4 py-3 shadow-lg">{notice}</div>
        </div>
      )}
    </div>
  );
};

function prettyDate(iso?: string): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export default ActivitySchedule;
