"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FormDots from "./FormDots";
import { useAuth } from "@/context/AuthContext";
import TournamentBracket from "./TournamentBracket";
import DrawLotteryOverlay from "./DrawLotteryOverlay";
import SafeImage from "@/components/SafeImage";
import {
  Trophy,
  Award,
  Search,
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
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

type TabKey = "open" | "live" | "bracket";
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

  // Tự cuộn mượt tới sân khấu bốc thăm khi bắt đầu bốc thăm
  useEffect(() => {
    if (lottery !== null) {
      const raf = requestAnimationFrame(() => {
        document.getElementById("draw-lottery-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [lottery]);

  // Phân trang 8 giải / trang
  const [currentPage, setCurrentPage] = useState(1);
  const TOURNAMENTS_PER_PAGE = 8;

  useEffect(() => {
    if (initialTournamentId) {
      setBracketTargetId(initialTournamentId);
      setActiveTab("bracket");
    } else {
      setBracketTargetId(null);
      setActiveTab("open");
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
      <section className="bg-white rounded-lg border border-slate-300 shadow-sm p-3.5 sm:p-5 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-2.5 pb-2.5 sm:pb-3 border-b border-slate-200">
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-bold text-slate-900 truncate">
              Giải Đấu Bóng Đá Phong Trào
            </h1>
            <p className="hidden sm:block text-[14px] text-slate-600 mt-0.5">
              Tra cứu giải đấu, đăng ký đội bóng, xem lịch thi đấu, nhánh đấu và bảng xếp hạng
            </p>
          </div>

          <Link
            href="/tournaments/register"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-md text-[13px] sm:text-[14px] font-bold bg-[#0369a1] hover:bg-[#075985] text-white shrink-0 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đăng Ký Đội</span>
          </Link>
        </div>

        {/* 4 Tab chức năng chính của trang Giải Đấu - Cuộn ngang mượt mà trên mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar scroll-smooth" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "open"}
            onClick={() => setActiveTab("open")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-[13px] sm:text-[14px] font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "open"
                ? "bg-[#0369a1] text-white border-[#0369a1]"
                : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Danh Sách ({tournaments.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "bracket"}
            onClick={() => setActiveTab("bracket")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[14px] font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[14px] font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "live"
                ? "bg-[#0369a1] text-white border-[#0369a1]"
                : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch Thi Đấu &amp; Kết Quả ({allMatches.length})</span>
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
        format={drawnTournament?.format}
        teams={drawnTournament?.teams}
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setBracketTargetId(null);
                setActiveTab("open");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-[13px] shadow-xs cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
              <span>Quay Lại Danh Sách Giải Đấu</span>
            </button>
          </div>
          <TournamentBracket initialTournamentId={bracketTargetId} />
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
                    onClick={() => {
                      setBracketTargetId(t.id);
                      setActiveTab("bracket");
                    }}
                    className="bg-white rounded-xl border border-slate-200 hover:border-[#0369a1] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden cursor-pointer text-left group"
                  >
                    {/* Ảnh Bìa Giải Đấu Trực Quan */}
                    <div className="relative h-36 sm:h-40 w-full bg-slate-900 overflow-hidden">
                      <SafeImage
                        src={(t as any).imageUrl || (t as any).bannerUrl || "/images/copa-action.png"}
                        alt={t.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

                      {/* Huy hiệu trên ảnh */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white font-bold text-[13px] border border-white/15">
                            {sportLabel(t.sportType)}
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white font-medium text-[13px] border border-white/15">
                            {formatLabel(t.format)}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-md font-bold text-[13px] backdrop-blur-md shadow-xs ${
                            ended
                              ? "bg-slate-700/80 text-slate-200"
                              : t.status === "ONGOING"
                              ? "bg-sky-600/90 text-white"
                              : full
                              ? "bg-rose-600/90 text-white"
                              : "bg-emerald-600/90 text-white"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      {/* Tiền thưởng nổi bật ở góc dưới ảnh */}
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                        <span className="text-[13px] font-semibold text-amber-300 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" />
                          <span>Thưởng: {formatMoney(t.prizePool)}</span>
                        </span>
                        <span className="text-[13px] text-slate-200 font-medium">
                          {reg}/{cap || "—"} đội
                        </span>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Hình thức đăng ký & Đơn vị tổ chức */}
                        <div className="flex items-center justify-between gap-2">
                          {t.joinMode === "INVITE_ONLY" ? (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[13px] inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Mời qua email
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[13px] inline-flex items-center gap-1">
                              <Unlock className="w-3 h-3" />
                              Đăng ký tự do
                            </span>
                          )}

                          <span className="text-slate-400 group-hover:text-[#0369a1] shrink-0 flex items-center gap-1 text-[13px] font-semibold">
                            <span>Vào xem</span>
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>

                        {/* Tên giải & Địa điểm */}
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-[#0369a1] transition-colors line-clamp-2">
                            {t.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-600 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="line-clamp-1">{t.pitchName || t.location || "Đà Nẵng"}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{formatDate(t.startDate)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Thông số chi phí & giải thưởng */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[13px]">
                          <div>
                            <span className="text-slate-500 block">Lệ phí giải</span>
                            <strong className="text-slate-900 font-mono text-[14px]">
                              {formatMoney(t.entryFee)}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Tiến độ ghi danh</span>
                            <strong className="text-[#0369a1] font-mono text-[14px]">
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
                            Đã kết thúc
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
