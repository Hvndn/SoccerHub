"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FormDots from "./FormDots";
import { useAuth } from "@/context/AuthContext";
import TournamentBracket from "./TournamentBracket";
import DrawLotteryOverlay from "./DrawLotteryOverlay";
import {
  Trophy,
  Award,
  Search,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  Radio,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Info,
  ExternalLink,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";
import {
  Tournament,
  SportType,
  fetchTournaments,
  fetchTopScorers,
  type ScorerRow,
  subscribeTournaments,
  countOpen,
  countLive,
  filterBySport,
  sportLabel,
  formatLabel,
  formatDate,
  formatMoney,
  confirmedCount,
  isFull as isTournamentFull,
  fillPercent,
  type TournamentBracketData,
} from "@/lib/tournamentService";

interface TournamentLeaderboardProps {
  user?: any;
  onNavigateTab?: (tab: string) => void;
  onBackToHome?: () => void;
  onSelectTournament?: (id: string) => void;
  onRequestLogin?: () => void;
  initialTournamentId?: number | null;
}

function shortTournamentCode(title?: string): string {
  if (!title) return "";
  return title
    .split(/\s+/)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
}

const SPORT_TABS: { key: SportType | "all"; label: string }[] = [
  { key: "all", label: "Tất cả loại sân" },
  { key: "SAN_7", label: "Sân 7 người" },
  { key: "SAN_5", label: "Sân 5 người" },
  { key: "SAN_11", label: "Sân 11 người" },
  { key: "FUTSAL", label: "Sân Futsal" },
];

type TabKey = "open" | "live" | "bracket" | "rankings";
type StatusFilter = "ALL" | "OPEN" | "ONGOING" | "COMPLETED";

export const TournamentLeaderboard: React.FC<TournamentLeaderboardProps> = ({
  user,
  onNavigateTab,
  initialTournamentId,
}) => {
  const { user: authUser } = useAuth();
  const currentUser = user || authUser;
  const [activeSport, setActiveSport] = useState<SportType | "all">("all");
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  const [selectedFormat, setSelectedFormat] = useState<"ALL" | "KNOCKOUT" | "ROUND_ROBIN">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");
  const [selectedLocation, setSelectedLocation] = useState("ALL");
  const [tournamentQuery, setTournamentQuery] = useState("");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [expandedTournamentId, setExpandedTournamentId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [lottery, setLottery] = useState<{
    pairs: { matchId: string; teamA: string; teamB: string }[];
    byes: string[];
  } | null>(null);
  const [drawnTournament, setDrawnTournament] = useState<Tournament | null>(null);
  const [bracketTargetId, setBracketTargetId] = useState<number | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Phân trang 8 giải / trang
  const [currentPage, setCurrentPage] = useState(1);
  const TOURNAMENTS_PER_PAGE = 8;

  useEffect(() => {
    if (initialTournamentId) {
      setBracketTargetId(initialTournamentId);
      setActiveTab("bracket");
    }
  }, [initialTournamentId]);

  const reloadTournaments = useCallback(
    async (force = false, silent = false) => {
      try {
        if (!silent || tournaments.length === 0) setLoadingTournaments(true);
        if (!silent) setLoadError(null);
        const data = await fetchTournaments(force);
        setTournaments(data);
      } catch {
        setLoadError("Không tải được danh sách giải đấu. Vui lòng kiểm tra kết nối máy chủ.");
      } finally {
        if (!silent || tournaments.length === 0) setLoadingTournaments(false);
      }
    },
    [tournaments.length]
  );

  useEffect(() => {
    reloadTournaments();
    return subscribeTournaments(setTournaments);
  }, [reloadTournaments]);

  useEffect(() => {
    if (!loadError) return;
    const timer = window.setInterval(() => {
      reloadTournaments(true, true).catch(() => {});
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loadError, reloadTournaments]);

  const [topScorers, setTopScorers] = useState<ScorerRow[]>([]);

  useEffect(() => {
    let alive = true;
    const loadScorers = () => {
      fetchTopScorers(10)
        .then((rows) => {
          if (alive) setTopScorers(rows);
        })
        .catch(() => {});
    };
    loadScorers();
    const unsub = subscribeTournaments(loadScorers);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const isTournamentEnded = (t: Tournament): boolean => {
    if (t.status === "COMPLETED" || t.status === "FINISHED") return true;
    if (t.endDate && new Date(t.endDate) < new Date(new Date().toDateString())) return true;
    return false;
  };

  const statusBase = useMemo(() => {
    if (selectedStatus === "ALL") return tournaments;
    return tournaments.filter((t) => {
      const ended = isTournamentEnded(t);
      if (selectedStatus === "COMPLETED") return ended;
      if (ended) return false;
      return (t.status ?? "OPEN") === selectedStatus;
    });
  }, [tournaments, selectedStatus]);

  const visibleTournaments = useMemo(
    () =>
      filterBySport(statusBase, activeSport).filter((t) => {
        if (selectedFormat !== "ALL" && t.format !== selectedFormat) return false;
        if (selectedLocation !== "ALL" && t.location !== selectedLocation) return false;
        const q = tournamentQuery.trim().toLowerCase();
        if (q) {
          const code = shortTournamentCode(t.title).toLowerCase();
          const haystack = `${t.title ?? ""} ${t.location ?? ""} ${code} ${String(t.id ?? "")}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      }),
    [statusBase, activeSport, selectedFormat, selectedLocation, tournamentQuery]
  );

  // Sắp xếp giải đấu mới nhất lên đầu
  const sortedTournaments = useMemo(() => {
    return [...visibleTournaments].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  }, [visibleTournaments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSport, selectedFormat, selectedStatus, selectedLocation, tournamentQuery]);

  const totalPages = Math.ceil(sortedTournaments.length / TOURNAMENTS_PER_PAGE) || 1;
  const paginatedTournaments = useMemo(() => {
    const start = (currentPage - 1) * TOURNAMENTS_PER_PAGE;
    return sortedTournaments.slice(start, start + TOURNAMENTS_PER_PAGE);
  }, [sortedTournaments, currentPage]);

  const locationOptions = useMemo(
    () => Array.from(new Set(tournaments.map((t) => t.location).filter(Boolean))) as string[],
    [tournaments]
  );

  const hasActiveFilters =
    activeSport !== "all" ||
    selectedFormat !== "ALL" ||
    selectedLocation !== "ALL" ||
    selectedStatus !== "ALL" ||
    tournamentQuery.trim() !== "";

  const resetFilters = () => {
    setActiveSport("all");
    setSelectedFormat("ALL");
    setSelectedStatus("ALL");
    setSelectedLocation("ALL");
    setTournamentQuery("");
  };

  const openCount = countOpen(tournaments);
  const liveCount = countLive(tournaments);

  const allMatches = useMemo(() => {
    type MatchItem = {
      tournamentId: number;
      tournamentTitle: string;
      matchId: string;
      roundName: string;
      teamA: string;
      teamB: string;
      sa: number;
      sb: number;
      status: string;
      winner: string | null;
      matchDate?: string;
      timeSlot?: string;
      pitchName?: string;
    };
    const list: MatchItem[] = [];
    for (const t of tournaments) {
      if (!t.bracketJson) continue;
      let parsed: TournamentBracketData | null = null;
      try {
        parsed = JSON.parse(t.bracketJson) as TournamentBracketData;
      } catch {
        continue;
      }
      if (!parsed?.rounds?.length) continue;
      for (const r of parsed.rounds) {
        for (const m of r.matches ?? []) {
          if (!m.teamA || !m.teamB || m.status === "BYE") continue;
          list.push({
            tournamentId: t.id,
            tournamentTitle: t.title,
            matchId: m.matchId,
            roundName: r.name,
            teamA: m.teamA.name,
            teamB: m.teamB.name,
            sa: m.scoreA ?? 0,
            sb: m.scoreB ?? 0,
            status: m.status ?? "SCHEDULED",
            winner: m.winner ?? null,
            matchDate: m.matchDate,
            timeSlot: m.timeSlot,
            pitchName: m.pitchName || t.pitchName || t.location,
          });
        }
      }
    }
    return list.sort((a, b) => {
      const ka = a.matchDate ?? "9999-99-99";
      const kb = b.matchDate ?? "9999-99-99";
      return ka.localeCompare(kb) || (a.timeSlot ?? "").localeCompare(b.timeSlot ?? "");
    });
  }, [tournaments]);

  return (
    <div className="w-full text-slate-900 space-y-5 pb-12">
      {/* 1. TIÊU ĐỀ TRANG & THANH CHUYỂN TAB CHÍNH */}
      <section className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Giải Đấu Bóng Đá Phong Trào
            </h1>
            <p className="text-[14px] text-slate-600 mt-0.5">
              Tra cứu giải đấu, đăng ký đội bóng, xem lịch thi đấu, nhánh đấu và bảng xếp hạng
            </p>
          </div>

          <Link
            href="/tournaments/register"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[14px] font-bold bg-[#0369a1] hover:bg-[#075985] text-white shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đăng Ký Đội Tham Gia</span>
          </Link>
        </div>

        {/* 4 Tab chức năng chính của trang Giải Đấu */}
        <div className="flex flex-wrap items-center gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "open"}
            onClick={() => setActiveTab("open")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[14px] font-bold border transition-colors cursor-pointer ${
              activeTab === "open"
                ? "bg-[#0369a1] text-white border-[#0369a1]"
                : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Danh Sách Giải Đấu ({tournaments.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "bracket"}
            onClick={() => setActiveTab("bracket")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[14px] font-bold border transition-colors cursor-pointer ${
              activeTab === "bracket"
                ? "bg-[#0369a1] text-white border-[#0369a1]"
                : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Bảng Đấu &amp; Nhánh Đấu</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "live"}
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[14px] font-bold border transition-colors cursor-pointer ${
              activeTab === "live"
                ? "bg-[#0369a1] text-white border-[#0369a1]"
                : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch Thi Đấu &amp; Kết Quả ({allMatches.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "rankings"}
            onClick={() => setActiveTab("rankings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[14px] font-bold border transition-colors cursor-pointer ${
              activeTab === "rankings"
                ? "bg-[#0369a1] text-white border-[#0369a1]"
                : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>BXH Đội Bóng &amp; Vua Phá Lưới</span>
          </button>
        </div>
      </section>

      {/* Thông báo thao tác hoặc lỗi tải dữ liệu */}
      {actionNotice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-sky-300 bg-sky-50 px-4 py-3">
          <p className="text-[14px] font-bold text-sky-900">{actionNotice}</p>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-sky-700 hover:text-sky-950 font-bold text-[14px]"
          >
            Đóng
          </button>
        </div>
      )}

      {loadError && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-[14px] font-bold text-rose-800">{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => reloadTournaments(true)}
            className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[14px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      <DrawLotteryOverlay
        open={lottery !== null}
        inline
        tournamentTitle={drawnTournament?.title ?? ""}
        pairs={lottery?.pairs ?? []}
        byes={lottery?.byes ?? []}
        onDone={() => {
          setLottery(null);
          setDrawnTournament(null);
          setActionNotice("Đã lưu nhánh đấu. Chuyển sang tab Bảng Đấu & Nhánh Đấu.");
          setActiveTab("bracket");
        }}
      />

      {/* =========================================================
          NỘI DUNG THEO TỪNG TAB
         ========================================================= */}
      {activeTab === "bracket" ? (
        <TournamentBracket initialTournamentId={bracketTargetId} />
      ) : activeTab === "rankings" ? (
        /* TAB 4: BẢNG XẾP HẠNG ĐỘI BÓNG & VUA PHÁ LƯỚI */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Cột Trái (8 cột): BXH Phong Độ Đội Bóng */}
          <div className="lg:col-span-8 bg-white rounded-lg border border-slate-300 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Bảng Xếp Hạng Các Đội Tham Gia Giải
                </h2>
              </div>
              <span className="text-[14px] text-slate-500 font-semibold">
                Tổng hợp từ {tournaments.length} giải đấu
              </span>
            </div>

            {(() => {
              const ranked = tournaments
                .flatMap((t) => (t.teams ?? []).map((tm) => ({ ...tm, tournament: t })))
                .sort(
                  (a, b) =>
                    (b.winRate ?? 0) - (a.winRate ?? 0) || (b.played ?? 0) - (a.played ?? 0)
                )
                .slice(0, 20);

              if (!ranked.length) {
                return (
                  <div className="p-8 text-center text-slate-500 text-[14px]">
                    Chưa có đội bóng nào ghi danh trên hệ thống.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-[14px] border-collapse min-w-[600px]">
                    <thead>
                      <tr className="text-left text-slate-600 border-b border-slate-300 bg-slate-50">
                        <th className="py-2.5 px-3 font-bold">Hạng</th>
                        <th className="py-2.5 px-3 font-bold">Đội bóng</th>
                        <th className="py-2.5 px-3 font-bold">Đội trưởng</th>
                        <th className="py-2.5 px-3 font-bold">Giải đấu</th>
                        <th className="py-2.5 px-3 font-bold text-right">Thành viên</th>
                        <th className="py-2.5 px-3 font-bold text-right">Phong độ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranked.map((row, idx) => {
                        const rowKey = `${row.tournament.id}-${row.teamName}`;
                        const roster: string[] = String(row.memberNames ?? "")
                          .split(",")
                          .map((s: string) => s.trim())
                          .filter(Boolean);
                        const isOpen = expandedTeam === rowKey;
                        return (
                          <React.Fragment key={rowKey}>
                            <tr className="border-b border-slate-200 hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                                #{idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                <button
                                  type="button"
                                  onClick={() => setExpandedTeam(isOpen ? null : rowKey)}
                                  className="inline-flex items-center gap-1.5 hover:text-[#0369a1] text-left cursor-pointer"
                                >
                                  <span>{row.teamName}</span>
                                  {roster.length > 0 && (
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                                        isOpen ? "rotate-180" : ""
                                      }`}
                                    />
                                  )}
                                </button>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                {row.captainName || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 max-w-[14rem] truncate">
                                {row.tournament.title}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                {row.memberCount || roster.length || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <FormDots form={row.form} size="sm" />
                              </td>
                            </tr>
                            {isOpen && roster.length > 0 && (
                              <tr className="border-b border-slate-200 bg-slate-50">
                                <td colSpan={6} className="px-3 py-2.5">
                                  <p className="text-[14px] font-bold text-slate-600 mb-1.5">
                                    Danh sách cầu thủ ({roster.length} người):
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {roster.map((m, mi) => (
                                      <span
                                        key={mi}
                                        className="px-2 py-0.5 rounded bg-white text-slate-800 text-[14px] font-semibold border border-slate-300"
                                      >
                                        {mi + 1}. {m}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* Cột Phải (4 cột): Vua Phá Lưới */}
          <div className="lg:col-span-4 bg-white rounded-lg border border-slate-300 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#0369a1]" />
                <h3 className="font-bold text-base text-slate-900">Vua Phá Lưới &amp; Kiến Tạo</h3>
              </div>
            </div>

            {topScorers.length === 0 ? (
              <p className="py-6 text-center text-[14px] text-slate-500">
                Chưa có cầu thủ ghi bàn.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {topScorers.map((p) => (
                  <div
                    key={`${p.playerName}-${p.teamName}`}
                    className="py-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded font-mono text-[14px] font-bold flex items-center justify-center shrink-0 ${
                          p.rank === 1
                            ? "bg-amber-500 text-white"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}
                      >
                        {p.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-slate-900 truncate">
                          {p.playerName}
                        </p>
                        <p className="text-[14px] text-slate-600 truncate">{p.teamName}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[#0369a1] text-[14px] shrink-0">
                      {p.goals} bàn • {p.assists} KT
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "live" ? (
        /* TAB 3: LỊCH THI ĐẤU & KẾT QUẢ CÁC GIẢI */
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#0369a1]" />
              <span>Lịch Thi Đấu &amp; Kết Quả Các Trận ({allMatches.length})</span>
            </h2>
            <span className="text-[14px] text-slate-600">
              {openCount} giải đang mở • {liveCount} giải đang diễn ra
            </span>
          </div>

          {allMatches.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-slate-600">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-[15px] font-bold">Chưa có trận đấu nào được xếp lịch</p>
              <p className="text-[14px] text-slate-500">
                Chọn tab <strong>Bảng Đấu &amp; Nhánh Đấu</strong> để xem hoặc bốc thăm lịch thi đấu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {allMatches.map((m) => (
                <div
                  key={`${m.tournamentId}-${m.matchId}`}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-300 flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 text-[14px] border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700 truncate">
                      {m.tournamentTitle} ({m.roundName})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[14px] font-bold shrink-0 ${
                        m.status === "DONE"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-white text-slate-700 border border-slate-300"
                      }`}
                    >
                      {m.status === "DONE" ? "Đã kết thúc" : m.timeSlot || "Chờ lịch"}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200">
                      <span
                        className={`text-[14px] truncate ${
                          m.winner === m.teamA ? "font-bold text-slate-900" : "font-medium text-slate-700"
                        }`}
                      >
                        {m.teamA}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-[15px]">
                        {m.status === "DONE" ? m.sa : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200">
                      <span
                        className={`text-[14px] truncate ${
                          m.winner === m.teamB ? "font-bold text-slate-900" : "font-medium text-slate-700"
                        }`}
                      >
                        {m.teamB}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-[15px]">
                        {m.status === "DONE" ? m.sb : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[14px] text-slate-600 pt-1">
                    <span className="truncate">
                      {m.matchDate ? m.matchDate.split("-").reverse().join("/") : "Chưa xếp ngày"}
                      {m.pitchName ? ` • ${m.pitchName}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBracketTargetId(m.tournamentId);
                        setActiveTab("bracket");
                      }}
                      className="text-[#0369a1] font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      Chi tiết →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TAB 1 (MẶC ĐỊNH): DANH SÁCH GIẢI ĐẤU + BỘ LỌC TRUYỀN THỐNG */
        <div className="space-y-4">
          {/* Thanh bộ lọc giải đấu */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tournamentQuery}
                  onChange={(e) => setTournamentQuery(e.target.value)}
                  placeholder="Tìm theo tên giải đấu, địa điểm tổ chức..."
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 bg-white text-[14px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0369a1]"
                />
              </div>

              <div className="lg:col-span-2">
                <select
                  aria-label="Trạng thái giải"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#0369a1] cursor-pointer"
                >
                  <option value="ALL">Mọi trạng thái</option>
                  <option value="OPEN">Đang mở đăng ký</option>
                  <option value="ONGOING">Đang diễn ra</option>
                  <option value="COMPLETED">Đã kết thúc</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  aria-label="Thể thức thi đấu"
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as typeof selectedFormat)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#0369a1] cursor-pointer"
                >
                  <option value="ALL">Mọi thể thức</option>
                  <option value="KNOCKOUT">Loại trực tiếp</option>
                  <option value="ROUND_ROBIN">Đấu vòng tròn</option>
                </select>
              </div>

              <div className="lg:col-span-3">
                <select
                  aria-label="Địa điểm"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#0369a1] cursor-pointer"
                >
                  <option value="ALL">Tất cả địa điểm</option>
                  {locationOptions.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {SPORT_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveSport(tab.key)}
                    className={`px-3 py-1.5 rounded-md text-[14px] font-bold border transition-colors cursor-pointer ${
                      activeSport === tab.key
                        ? "bg-[#0369a1] text-white border-[#0369a1]"
                        : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-[14px]">
                <span className="text-slate-600 font-semibold">
                  Tìm thấy <strong className="text-slate-900">{sortedTournaments.length}</strong> giải đấu
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Danh sách giải đấu (Lưới 2 cột, 8 giải / trang) */}
          {loadingTournaments && sortedTournaments.length === 0 ? (
            <div className="bg-white rounded-lg p-12 border border-slate-300 text-center space-y-2">
              <RefreshCw className="w-7 h-7 text-[#0369a1] animate-spin mx-auto" />
              <p className="text-[15px] font-semibold text-slate-600">
                Đang tải danh sách giải đấu...
              </p>
            </div>
          ) : sortedTournaments.length === 0 ? (
            <div className="bg-white rounded-lg p-10 border border-slate-300 text-center space-y-3">
              <Trophy className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-base font-bold text-slate-800">
                Không có giải đấu nào phù hợp với bộ lọc
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-md bg-[#0369a1] text-white text-[14px] font-bold cursor-pointer"
                >
                  Xem tất cả giải đấu
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {paginatedTournaments.map((t) => {
                const percentage = fillPercent(t);
                const full = isTournamentFull(t);
                const ended = isTournamentEnded(t);
                const reg = confirmedCount(t);
                const cap = t.totalTeams ?? 0;

                const statusLabel = ended
                  ? "Đã kết thúc"
                  : t.status === "ONGOING"
                  ? "Đang diễn ra"
                  : full
                  ? "Đã đủ đội"
                  : "Đang mở đăng ký";

                return (
                  <article
                    key={t.id}
                    onClick={() => setExpandedTournamentId(expandedTournamentId === t.id ? null : t.id)}
                    className={`bg-white rounded-lg p-5 border transition-all flex flex-col justify-between space-y-4 cursor-pointer text-left ${
                      expandedTournamentId === t.id
                        ? "border-[#0369a1] ring-2 ring-[#0369a1]/20 shadow-sm"
                        : "border-slate-300 hover:border-sky-400"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Hàng nhãn trạng thái & thể thức */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-bold text-[14px]">
                            {sportLabel(t.sportType)}
                          </span>
                          <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[14px]">
                            {formatLabel(t.format)}
                          </span>
                          {t.joinMode === "INVITE_ONLY" ? (
                            <span className="px-2.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[14px] inline-flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" />
                              Mời qua email
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[14px] inline-flex items-center gap-1">
                              <Unlock className="w-3.5 h-3.5" />
                              Đăng ký tự do
                            </span>
                          )}
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded font-bold text-[14px] border ${
                            ended
                              ? "bg-slate-100 text-slate-600 border-slate-300"
                              : t.status === "ONGOING"
                              ? "bg-sky-50 text-[#0369a1] border-sky-200"
                              : full
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      {/* Tên giải & Địa điểm */}
                      <div>
                        <div
                          onClick={() => setExpandedTournamentId(expandedTournamentId === t.id ? null : t.id)}
                          className="cursor-pointer group flex items-start justify-between gap-2"
                          title="Bấm để xem chi tiết giải đấu, điều lệ và danh sách đội"
                        >
                          <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-[#0369a1] transition-colors">
                            {t.title}
                          </h3>
                          <span className="text-slate-400 group-hover:text-[#0369a1] shrink-0 mt-0.5 p-1 rounded-md hover:bg-slate-100 transition-colors">
                            {expandedTournamentId === t.id ? (
                              <ChevronUp className="w-5 h-5 text-[#0369a1]" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{t.pitchName || t.location || "Đà Nẵng"}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>Khởi tranh: {formatDate(t.startDate)}</span>
                          </span>
                        </div>
                      </div>

                      {/* 3 Ô thông số chính */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-md bg-slate-50 border border-slate-200 text-[14px]">
                        <div>
                          <span className="text-slate-500 block">Giải thưởng</span>
                          <strong className="text-[#0369a1] font-mono text-[15px]">
                            {formatMoney(t.prizePool)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Lệ phí</span>
                          <strong className="text-slate-900 font-mono">
                            {formatMoney(t.entryFee)}/đội
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Số đội</span>
                          <strong className="text-slate-900 font-mono">
                            {reg}/{cap || "—"} đội
                          </strong>
                        </div>
                      </div>

                      {/* Danh sách đội đã đăng ký */}
                      {t.teams && t.teams.length > 0 && (
                        <div className="text-[14px] space-y-1">
                          <span className="font-semibold text-slate-600 block">
                            Các đội đã ghi danh ({t.teams.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {t.teams.slice(0, 5).map((tm: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[14px] font-medium border border-slate-200"
                              >
                                {tm.teamName}
                              </span>
                            ))}
                            {t.teams.length > 5 && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[14px] font-semibold border border-slate-200">
                                +{t.teams.length - 5} đội khác
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* KHỐI CHI TIẾT GIẢI ĐẤU MỞ RỘNG KHI CLICK VÀO TIÊU ĐỀ / CARD */}
                    {expandedTournamentId === t.id && (
                      <div className="pt-3 border-t border-slate-200 space-y-3.5 text-[13px] animate-fade-in">
                        {/* 1. Điều lệ & Mô tả giải */}
                        {t.description && (
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-900 block mb-1">📋 Điều Lệ &amp; Quy Định Giải:</span>
                            <p className="whitespace-pre-line text-[13px]">{t.description}</p>
                          </div>
                        )}

                        {/* 2. Bảng 4 thông số chi tiết */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[12px]">Hạn chót đăng ký</span>
                            <strong className="text-slate-900 font-medium">{formatDate(t.registrationDeadline) || "Chưa ấn định"}</strong>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[12px]">Ngày bế mạc</span>
                            <strong className="text-slate-900 font-medium">{formatDate(t.endDate) || "Chưa ấn định"}</strong>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[12px]">Quyền tham gia</span>
                            <strong className={t.joinMode === "INVITE_ONLY" ? "text-amber-800" : "text-emerald-800"}>
                              {t.joinMode === "INVITE_ONLY" ? "🔒 Mời qua email" : "🔓 Đăng ký tự do"}
                            </strong>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-slate-500 block text-[12px]">Trạng thái nhánh</span>
                            <strong className={t.bracketJson ? "text-sky-800" : "text-slate-600"}>
                              {t.bracketJson ? "✅ Đã bốc thăm" : "⏳ Chờ bốc thăm"}
                            </strong>
                          </div>
                        </div>

                        {/* 3. Toàn bộ danh sách các đội tham gia */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              Danh Sách Toàn Bộ Đội Bóng ({t.teams?.length ?? 0}/{t.totalTeams ?? "—"} đội):
                            </span>
                            <span className="text-[12px] text-slate-500">
                              {full ? "Đã chốt danh sách" : `Còn trống ${Math.max(0, (t.totalTeams ?? 0) - (t.teams?.length ?? 0))} suất`}
                            </span>
                          </div>
                          {t.teams && t.teams.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {t.teams.map((tm: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-2 rounded-md bg-white border border-slate-200 flex items-center justify-between gap-1.5 text-[12px]"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <span className="font-bold text-slate-900 truncate">{tm.teamName}</span>
                                  </div>
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-bold shrink-0 bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Đã vào giải
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="p-2.5 rounded-md bg-slate-50 border border-dashed border-slate-300 text-slate-500 text-center text-[12px]">
                              Chưa có đội bóng nào ghi danh. Hãy là đội đầu tiên nộp đơn tham gia!
                            </p>
                          )}
                        </div>

                        {/* 4. Hành động nhanh theo vai trò */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const origin = typeof window !== "undefined" ? window.location.origin : "";
                                navigator.clipboard.writeText(`${origin}/tournaments/register?tournamentId=${t.id}`);
                                setActionNotice(`✅ Đã sao chép liên kết giải: ${t.title}`);
                                setTimeout(() => setActionNotice(null), 3000);
                              }}
                              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao Chép Link Giải</span>
                            </button>

                            {(currentUser?.role === "OWNER" || currentUser?.role === "ORGANIZER") && onNavigateTab && (
                              <button
                                type="button"
                                onClick={() => onNavigateTab("tournaments-portal")}
                                className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 text-[12px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Vào Quản Lý Giải</span>
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedTournamentId(null)}
                            className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[12px] font-bold cursor-pointer"
                          >
                            Thu gọn ▲
                          </button>
                        </div>
                      </div>
                    )}

                    
{/* Thanh tiến độ & Nút thao tác */}
                    <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0369a1]"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-[14px] text-slate-600 font-mono font-semibold">
                          {percentage}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setExpandedTournamentId(expandedTournamentId === t.id ? null : t.id)}
                          className="px-3 py-2 rounded-md text-[13px] font-bold bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                          title="Xem chi tiết điều lệ, các đội tham gia và lịch trình"
                        >
                          <Info className="w-3.5 h-3.5 text-[#0369a1]" />
                          <span>{expandedTournamentId === t.id ? "Đóng" : "Chi Tiết"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBracketTargetId(t.id);
                            setActiveTab("bracket");
                          }}
                          className="px-3.5 py-2 rounded-md text-[14px] font-bold bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trophy className="w-4 h-4 text-[#0369a1]" />
                          <span>Xem Nhánh Đấu</span>
                        </button>

                        {ended ? (
                          <span className="px-3.5 py-2 rounded-md text-[14px] font-bold bg-slate-100 text-slate-500 border border-slate-300">
                            Đã kết thúc (Chỉ xem)
                          </span>
                        ) : full ? (
                          <span className="px-3.5 py-2 rounded-md text-[14px] font-bold bg-slate-100 text-slate-500 border border-slate-300">
                            Đã đủ đội
                          </span>
                        ) : (
                          <Link
                            onClick={(e) => e.stopPropagation()}
                            href={`/tournaments/register?tournamentId=${t.id}`}
                            className="px-4 py-2 rounded-md text-[14px] font-bold bg-[#0369a1] hover:bg-[#075985] text-white flex items-center gap-1"
                          >
                            <span>Đăng Ký Đội</span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Phân trang 8 giải / trang */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 bg-white p-3.5 rounded-lg border border-slate-300">
              <span className="text-[14px] text-slate-600 font-semibold">
                Trang <strong>{currentPage}</strong> / {totalPages} (Tổng {sortedTournaments.length} giải đấu)
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 150, behavior: "smooth" });
                  }}
                  className="px-3 py-1.5 rounded-md border border-slate-300 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Trang trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 150, behavior: "smooth" });
                    }}
                    className={`w-9 h-9 rounded-md text-[14px] font-bold cursor-pointer ${
                      currentPage === page
                        ? "bg-[#0369a1] text-white"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 150, behavior: "smooth" });
                  }}
                  className="px-3 py-1.5 rounded-md border border-slate-300 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentLeaderboard;
