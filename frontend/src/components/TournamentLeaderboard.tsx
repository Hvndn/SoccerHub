import React, { useCallback, useMemo, useState } from 'react';
import SafeImage from "@/components/SafeImage";
import Link from 'next/link';
import CountUp from './CountUp';
import FormDots from './FormDots';
import TournamentBracket from './TournamentBracket';
import { 
  Trophy, Award, Flame, Search, Filter, Calendar, MapPin, Users, ChevronRight, 
  PlayCircle, Zap, ArrowUpRight, ShieldCheck, CheckCircle2, UserCheck, PlusCircle,
  Radio, RefreshCw, Star, Info, Share2, Sparkles, Check, Home, Video, ChevronDown,
  Activity, AlertTriangle, LogIn
} from 'lucide-react';
import {
  Tournament,
  SportType,
  fetchTournaments,
  fetchTopScorers,
  type ScorerRow,
  subscribeTournaments,
  countBySport,
  countOpen,
  countLive,
  pickFeatured,
  filterBySport,
  sportLabel,
  formatLabel,
  formatShort,
  formatDate,
  formatMoney,
  daysUntil,
  registeredCount,
  isFull as isTournamentFull,
  fillPercent,
  type TournamentBracketData,
} from '@/lib/tournamentService';

interface TournamentLeaderboardProps {
  user?: any;
  onBackToHome?: () => void;
  onSelectTournament?: (id: string) => void;
  /** Mở modal đăng nhập (dùng cho trạng thái khách) */
  onRequestLogin?: () => void;
}

/** Sport ribbon tabs — keys are the real `sportType` values stored in MySQL. */
const SPORT_TABS: { key: SportType | 'all'; label: string; emoji: string; badgeClass: string }[] = [
  { key: 'all', label: 'Tất cả Thể Thức', emoji: '✨', badgeClass: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
  { key: 'SAN_7', label: 'Sân 7 Phủi', emoji: '⚽', badgeClass: 'bg-[#0ea5e9] text-white' },
  { key: 'SAN_5', label: 'Sân 5 Mini', emoji: '🥅', badgeClass: 'bg-lime-500 text-slate-950' },
  { key: 'SAN_11', label: 'Sân 11 Người', emoji: '🏟️', badgeClass: 'bg-amber-500 text-slate-950' },
  { key: 'FUTSAL', label: 'Futsal Sài Gòn', emoji: '👟', badgeClass: 'bg-[#0ea5e9] text-white' },
];

type TabKey = 'open' | 'live' | 'bracket' | 'rankings';
type StatusFilter = 'ALL' | 'OPEN' | 'ONGOING' | 'COMPLETED';

export const TournamentLeaderboard: React.FC<TournamentLeaderboardProps> = ({
  user,
  onBackToHome,
  onSelectTournament,
  onRequestLogin
}) => {
  const [activeSport, setActiveSport] = useState<SportType | 'all'>('all');
  const [activeTab, setActiveTab] = useState<TabKey>('open');
  const [selectedFormat, setSelectedFormat] = useState<'ALL' | 'KNOCKOUT' | 'ROUND_ROBIN'>('ALL');
  // Mặc định OPEN — khớp với tab "Giải Đấu Đang Mở Đăng Ký" đang chọn sẵn.
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('OPEN');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  // Trên mobile: thu gọn thanh lọc nhanh cho gọn màn hình
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Dữ liệu giải đấu thật từ MySQL Backend (dùng cache dùng chung)
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Đăng ký đội đã chuyển sang trang wizard riêng: /tournaments/register (4 bước)

  // Fetch real tournaments from API (shared cache + explicit error state)
  const reloadTournaments = useCallback(async (force = false) => {
    try {
      setLoadingTournaments(true);
      setLoadError(null);
      const data = await fetchTournaments(force);
      setTournaments(data);
    } catch (err) {
      console.error("Error loading tournaments:", err);
      setLoadError("Không tải được danh sách giải đấu. Vui lòng kiểm tra Backend (cổng 8080) và thử lại.");
    } finally {
      setLoadingTournaments(false);
    }
  }, []);

  React.useEffect(() => {
    reloadTournaments();
    // Re-sync if another screen (CommunityForm / registration) refreshes the cache.
    return subscribeTournaments(setTournaments);
  }, [reloadTournaments]);

  // Top Vua phá lưới toàn hệ thống — dữ liệu thật từ CSDL (thay hardcode)
  const [topScorers, setTopScorers] = useState<ScorerRow[]>([]);

  React.useEffect(() => {
    let alive = true;
    fetchTopScorers(5)
      .then((rows) => {
        if (alive) setTopScorers(rows);
      })
      .catch(() => {});
    const refresh = () => {
      fetchTopScorers(5)
        .then((rows) => {
          if (alive) setTopScorers(rows);
        })
        .catch(() => {});
    };
    const unsub = subscribeTournaments(refresh);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // DỮ LIỆU DẪN XUẤT TỪ CSDL — thay cho toàn bộ số liệu hardcode cũ
  // ---------------------------------------------------------------------------
  // Tab chỉ định TRẠNG THÁI mặc định ("Mở đăng ký" = OPEN, "Live" = ONGOING).
  // Người dùng vẫn có thể nới rộng bằng dropdown "Trạng thái" ở thanh lọc.
  const defaultStatusForTab = (tab: typeof activeTab): StatusFilter =>
    tab === 'live' ? 'ONGOING' : 'OPEN';

  // Tập giải nền — mọi con số ở dưới (ribbon, tiêu đề, danh sách) đều đếm trên tập này,
  // nên không bao giờ có chuyện badge ghi 3 mà list ra 2.
  const statusBase = useMemo(
    () =>
      selectedStatus === 'ALL'
        ? tournaments
        : tournaments.filter((t) => (t.status ?? 'OPEN') === selectedStatus),
    [tournaments, selectedStatus]
  );

  // Danh sách sau khi áp DỒN bộ lọc: trạng thái + thể thức (ribbon) + thể thức + địa điểm
  const visibleTournaments = useMemo(
    () =>
      filterBySport(statusBase, activeSport).filter((t) => {
        if (selectedFormat !== 'ALL' && t.format !== selectedFormat) return false;
        if (selectedLocation !== 'ALL' && t.location !== selectedLocation) return false;
        return true;
      }),
    [statusBase, activeSport, selectedFormat, selectedLocation]
  );

  // Các địa điểm thực tế tồn tại trong CSDL → dùng cho dropdown lọc
  const locationOptions = useMemo(
    () => Array.from(new Set(tournaments.map((t) => t.location).filter(Boolean))) as string[],
    [tournaments]
  );

  const hasActiveFilters =
    activeSport !== 'all' ||
    selectedFormat !== 'ALL' ||
    selectedLocation !== 'ALL' ||
    selectedStatus !== defaultStatusForTab(activeTab);

  const resetFilters = () => {
    setActiveSport('all');
    setSelectedFormat('ALL');
    setSelectedStatus(defaultStatusForTab(activeTab));
    setSelectedLocation('ALL');
  };

  // Chuyển tab cũng đồng bộ bộ lọc trạng thái cho khớp nội dung tab đó.
  const changeTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSelectedStatus(defaultStatusForTab(tab));
  };

  // Tiêu đề danh sách phải nói đúng tập dữ liệu đang hiển thị.
  const listTitle =
    selectedStatus === 'OPEN'
      ? 'Danh Sách Các Giải Đấu Đang Mở Đăng Ký'
      : selectedStatus === 'ONGOING'
      ? 'Giải Đấu Đang Diễn Ra'
      : selectedStatus === 'COMPLETED'
      ? 'Giải Đấu Đã Kết Thúc'
      : 'Danh Sách Các Giải Đấu Chính Thức';

  const featured = useMemo(() => pickFeatured(tournaments), [tournaments]);
  const featuredPct = featured ? fillPercent(featured) : 0;
  const featuredRegistered = featured ? registeredCount(featured) : 0;
  const featuredCapacity = featured?.totalTeams ?? 0;
  const featuredSlotsLeft = Math.max(0, featuredCapacity - featuredRegistered);
  const deadlineDays = featured ? daysUntil(featured.registrationDeadline) : null;

  const openCount = countOpen(tournaments);
  const liveCount = countLive(tournaments);

  // Dải "trực tiếp" lấy từ CSDL thật: trận đã đánh gần nhất có lịch (BTC đã xếp lịch).
  // Không có dữ liệu thì hiện trạng thái rõ ràng thay vì bịa tỷ số.
  const latestResult = useMemo(() => {
    type Row = { tournament: Tournament; matchId: string; a: string; b: string; sa: number; sb: number; date: string; time: string; winner: string | null };
    const rows: Row[] = [];
    for (const t of tournaments) {
      if (!t.bracketJson) continue;
      let parsed: TournamentBracketData | null = null;
      try {
        parsed = JSON.parse(t.bracketJson) as TournamentBracketData;
      } catch {
        parsed = null;
      }
      if (!parsed?.rounds?.length) continue;
      for (const r of parsed.rounds) {
        for (const m of r.matches) {
          if (m.status !== 'DONE' || !m.teamA || !m.teamB) continue;
          rows.push({
            tournament: t,
            matchId: m.matchId,
            a: m.teamA.name,
            b: m.teamB.name,
            sa: m.scoreA ?? 0,
            sb: m.scoreB ?? 0,
            date: m.matchDate ?? '',
            time: m.timeSlot ?? '',
            winner: m.winner ?? null,
          });
        }
      }
    }
    if (!rows.length) return null;
    // Ưu tiên trận có ngày + giờ mới nhất, không có lịch thì xếp theo thứ tự trong nhánh.
    rows.sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time) || y.matchId.localeCompare(x.matchId));
    return rows[0];
  }, [tournaments]);

  // Danh sách trận cho widget "Trực tiếp": lấy giải ONGOING đầu tiên có nhánh đấu đã xếp lịch.
  const { liveTournament, liveRows } = useMemo(() => {
    type LiveRow = {
      tournamentId: number;
      tournamentShort: string;
      matchId: string;
      roundName: string;
      teamA: string;
      teamB: string;
      formA?: string;
      recordA?: string;
      formB?: string;
      recordB?: string;
      sa: number;
      sb: number;
      status: string;
      winner: string | null;
      matchDate?: string;
      timeSlot?: string;
      pitchName?: string;
    };
    const candidates = tournaments.filter((t) => (t.status ?? 'OPEN') === 'ONGOING' || t.bracketJson);
    for (const t of candidates) {
      if (!t.bracketJson) continue;
      let parsed: TournamentBracketData | null = null;
      try {
        parsed = JSON.parse(t.bracketJson) as TournamentBracketData;
      } catch {
        continue;
      }
      if (!parsed?.rounds?.length) continue;
      const rows: LiveRow[] = [];
      for (const r of parsed.rounds) {
        for (const m of r.matches) {
          if (!m.teamA || !m.teamB || m.status === 'BYE') continue;
          rows.push({
            tournamentId: t.id,
            tournamentShort: t.title.length > 22 ? `${t.title.slice(0, 22)}…` : t.title,
            matchId: m.matchId,
            roundName: r.name,
            teamA: m.teamA.name,
            teamB: m.teamB.name,
            formA: m.teamA.form ?? "",
            recordA: m.teamA.record ?? "0-0-0",
            formB: m.teamB.form ?? "",
            recordB: m.teamB.record ?? "0-0-0",
            sa: m.scoreA ?? 0,
            sb: m.scoreB ?? 0,
            status: m.status ?? 'SCHEDULED',
            winner: m.winner ?? null,
            matchDate: m.matchDate,
            timeSlot: m.timeSlot,
            pitchName: m.pitchName,
          });
        }
      }
      if (!rows.length) continue;
      // Ưu tiên trận đã có lịch, sắp theo ngày/giờ tăng dần
      rows.sort((a, b) => {
        const ka = a.matchDate ?? '9999-99-99';
        const kb = b.matchDate ?? '9999-99-99';
        return ka.localeCompare(kb) || (a.timeSlot ?? '').localeCompare(b.timeSlot ?? '');
      });
      return { liveTournament: t, liveRows: rows.slice(0, 6) };
    }
    return { liveTournament: null as Tournament | null, liveRows: [] as LiveRow[] };
  }, [tournaments]);

  // Hồ sơ thật của cầu thủ đang đăng nhập (fallback: trạng thái khách)
  const athleteName: string = user?.fullName || user?.name || '';
  // Avatar chỉ render <SafeImage> khi thật sự là URL ảnh (tránh 404 với initials "BT")
  const athleteAvatarUrl =
    user?.avatar && /^(https?:|data:|blob:|\/)/.test(user.avatar) ? user.avatar : null;
  const athleteInitials = athleteName
    ? athleteName.split(' ').filter(Boolean).slice(-2).map((w: string) => w[0]).join('').toUpperCase()
    : '';
  // Đăng ký đội thi đấu: chuyển sang trang wizard riêng /tournaments/register (4 bước)

  return (
    <div className="w-full text-slate-900 dark:text-slate-100 transition-colors space-y-3 sm:space-y-6">
      <div className="w-full">
        <div className="flex flex-col w-full gap-3 sm:gap-6">
          
          {/* 1. BREADCRUMBS & LIVE TICKER BAR */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <button onClick={onBackToHome} className="hover:text-sky-800 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span>Trang chủ</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-900 dark:text-white font-bold">Giải Đấu Bóng Đá &amp; Phong Độ</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-400 font-bold">
                {featured ? featured.title : `${tournaments.length} giải trong CSDL`}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 self-start md:self-auto bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full shadow-xs border border-slate-200 dark:border-slate-800">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`absolute inline-flex h-full w-full rounded-full ${latestResult ? 'animate-ping bg-emerald-400 opacity-75' : 'bg-slate-300 opacity-60'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${latestResult ? 'bg-[#0ea5e9] text-white' : 'bg-slate-400'}`}></span>
              </span>
              {latestResult ? (
                <>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {latestResult.time ? `KQ ${latestResult.time.split(' - ')[0]}:` : 'KQ GẦN NHẤT:'}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-xs sm:max-w-md font-medium">
                    {latestResult.a} {latestResult.sa}-{latestResult.sb} {latestResult.b}
                    {latestResult.winner ? '' : ' (hòa)'} — {latestResult.tournament.title}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">CHƯA CÓ KQ</span>
                  <span className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md font-medium">
                    BTC chưa nhập kết quả trận nào. Bấm vào giải để xem nhánh đấu.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 2. FOOTBALL SPORT FILTER RIBBON & QUICK ACTIONS — số liệu lấy từ CSDL */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800">
            {/* Sport Switcher Ribbon */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0" role="tablist" aria-label="Lọc theo thể thức giải đấu">
              {SPORT_TABS.map((tab) => {
                const count = countBySport(statusBase, tab.key);
                const isActive = activeSport === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveSport(tab.key)}
                    className={`group flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 ${
                      isActive
                        ? 'bg-[#0ea5e9] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span aria-hidden>{tab.emoji}</span>
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[11px] ${tab.badgeClass} ${isActive ? 'opacity-90' : ''}`}>
                      {count} giải
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
              <button 
                onClick={() => {
                  const formSection = document.getElementById('search-form-section');
                  formSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
              >
                <Search className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                <span>Tra cứu BXH Cá Nhân</span>
              </button>

              <Link
                href="/tournaments/register"
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] bg-[#0ea5e9] hover:bg-[#0284c7] text-white"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Đăng Ký Đội Thi Đấu</span>
              </Link>
            </div>
          </div>

          {/* Form đăng ký đội đã chuyển sang trang wizard riêng: /tournaments/register (4 bước) */}

          {/* 3. SECONDARY FILTER BAR — <select> thật, gắn với trường dữ liệu thật */}
          <div className="rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Mobile: nút mở/đóng lọc nhanh */}
            <button
              type="button"
              onClick={() => setShowMobileFilters((v) => !v)}
              aria-expanded={showMobileFilters}
              className="sm:hidden w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
            >
              <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <Filter className="w-3.5 h-3.5" />
                Lọc nhanh
                {hasActiveFilters && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#0ea5e9] text-white normal-case">
                    {visibleTournaments.length} giải
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                {showMobileFilters ? "Thu gọn" : "Mở rộng"}
                <ChevronDown className={`w-4 h-4 transition-transform ${showMobileFilters ? "rotate-180" : ""}`} />
              </span>
            </button>

            <div className={`${showMobileFilters ? "flex" : "hidden"} sm:flex flex-wrap items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3`}>
            <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <Filter className="w-3.5 h-3.5" />
              Lọc nhanh:
            </span>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs shadow-xs transition-colors focus-within:ring-2 focus-within:ring-[#0284c7]">
              <span className="text-slate-500">Thể thức:</span>
              <select
                aria-label="Lọc theo thể thức thi đấu"
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as typeof selectedFormat)}
                className="bg-transparent font-bold text-sky-800 dark:text-sky-400 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả thể thức</option>
                <option value="KNOCKOUT">Loại trực tiếp</option>
                <option value="ROUND_ROBIN">Vòng tròn</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs shadow-xs transition-colors focus-within:ring-2 focus-within:ring-[#0284c7]">
              <span className="text-slate-500">Trạng thái:</span>
              <select
                aria-label="Lọc theo trạng thái giải đấu"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="OPEN">Đang mở đăng ký</option>
                <option value="ONGOING">Đang diễn ra</option>
                <option value="COMPLETED">Đã kết thúc</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs shadow-xs transition-colors focus-within:ring-2 focus-within:ring-[#0284c7]">
              <MapPin className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
              <span className="text-slate-500">Địa điểm:</span>
              <select
                aria-label="Lọc theo địa điểm"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer max-w-[16rem] truncate"
              >
                <option value="ALL">Tất cả địa điểm</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </label>

            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">
                <strong className="text-sky-800 dark:text-sky-400 font-mono">{visibleTournaments.length}</strong> giải khớp
              </span>
              <button 
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="text-sky-800 dark:text-sky-400 text-xs font-bold hover:underline flex items-center gap-0.5 disabled:opacity-40 disabled:no-underline"
              >
                <span>Thiết lập lại bộ lọc</span>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            </div>
          </div>

          {/* 4. FEATURED TOURNAMENT HERO — 100% LẤY TỪ CSDL (không còn hardcode) */}
          {loadingTournaments ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-8 animate-pulse space-y-4">
              <div className="h-5 w-56 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
              <div className="h-9 w-2/3 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800"></div>
                ))}
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800"></div>
            </div>
          ) : loadError ? (
            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Không tải được dữ liệu giải đấu</p>
                  <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{loadError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => reloadTournaments(true)}
                className="shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : featured ? (
          <div className="relative isolate overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm p-3 sm:p-8 border border-slate-200/90 dark:border-slate-800 hover-card-elevate transition-colors">
            {/* Ambient Soft Glow */}
            <div className="hidden sm:block absolute -z-10 -top-20 -right-20 w-96 h-96 rounded-full bg-sky-50/60 dark:bg-sky-950/40 blur-3xl pointer-events-none"></div>
            <div className="hidden sm:block absolute -z-10 -bottom-24 left-1/3 w-80 h-80 rounded-full bg-sky-50/50 dark:bg-sky-950/40 blur-3xl pointer-events-none"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-center">
              {/* Left Content */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-sky-100 dark:bg-sky-950 text-emerald-900 dark:text-sky-300 text-[11px] uppercase tracking-wider font-black flex items-center gap-1 border border-sky-200 dark:border-sky-800">
                    <Award className="w-3.5 h-3.5 text-sky-800 dark:text-sky-400" />
                    Giải đấu tiêu điểm trong tháng
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[11px] font-bold flex items-center gap-1 border border-sky-200 dark:border-sky-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    {formatLabel(featured.format)}
                  </span>
                  {deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 7 && (
                    <span className="px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1 border border-rose-200 dark:border-rose-900">
                      <Activity className="w-3.5 h-3.5 text-rose-500" />
                      Hạn chót: Còn {deadlineDays} ngày
                    </span>
                  )}
                  {deadlineDays !== null && deadlineDays < 0 && (
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                      Đã hết hạn đăng ký
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {featured.title}
                  </h1>
                  {featured.description && (
                    <p className="text-sm sm:text-lg text-sky-800 dark:text-sky-400 font-bold mt-1">
                      {featured.description}
                    </p>
                  )}
                </div>

                {/* Metric Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="flex flex-col p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tổng Giải Thưởng</span>
                    <span className="text-lg sm:text-xl font-black text-sky-800 dark:text-sky-400 font-mono mt-0.5"><CountUp value={featured.prizePool ?? 0} format={(n) => `${Math.round(n).toLocaleString('vi-VN')}đ`} /></span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Thời Gian Diễn Ra</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatDate(featured.startDate)}{featured.endDate ? ` - ${formatDate(featured.endDate)}` : ''}
                    </span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Thể Thức Hạng Đấu</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{sportLabel(featured.sportType)}</span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Địa Điểm Thi Đấu</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{featured.pitchName || featured.location || 'Sắp công bố'}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600 dark:text-slate-500">Tiến độ ghi danh:</span>
                      <span className="font-mono font-bold text-sky-800 dark:text-sky-400">
                        <CountUp value={featuredRegistered} /> / {featuredCapacity} đội (<CountUp value={featuredPct} format={(n) => `${Math.round(n)}%`} />)
                      </span>
                    </div>
                    {featuredSlotsLeft > 0 && featuredSlotsLeft <= 4 && (
                      <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-900 animate-pulse">
                        Chỉ còn {featuredSlotsLeft} suất cuối!
                      </span>
                    )}
                    {featuredSlotsLeft === 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] border border-slate-300 dark:border-slate-700">
                        Đã đủ đội
                      </span>
                    )}
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="h-full bg-[#0ea5e9] rounded-full transition-all duration-500" style={{ width: `${featuredPct}%` }}></div>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {featuredSlotsLeft === 0 ? (
                    <span className="px-5 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 font-black text-xs sm:text-sm">
                      Giải đã đủ đội
                    </span>
                  ) : (
                    <Link
                      href={`/tournaments/register?tournamentId=${featured.id}`}
                      className="px-5 py-3 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                    >
                      <span>⚽ Đăng Ký Tham Gia Ngay (4 bước)</span>
                    </Link>
                  )}
                  <button 
                    type="button"
                    onClick={() => onSelectTournament ? onSelectTournament(String(featured.id)) : changeTab('bracket')}
                    className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                  >
                    <span>📜 Xem Nhánh Bracket & Điều Lệ</span>
                  </button>
                </div>
              </div>

              {/* Right Media Spotlight */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col gap-3 shadow-xs">
                  <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-inner bg-slate-200 dark:bg-slate-800">
                    <SafeImage 
                      src={featured.bannerUrl || 'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=800&q=80'}
                      alt={featured.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-sky-900 dark:text-sky-300 font-bold text-[11px] flex items-center gap-1 shadow-xs truncate">
                        🏆 {featured.pitchName || featured.location || 'Sân chuẩn VFF'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#0ea5e9] text-white font-mono text-[11px] font-bold shrink-0">
                        {formatShort(featured.format)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-500 pt-1 font-medium gap-2">
                    <span className="flex items-center gap-1">
                      Lệ phí: <strong className="font-mono text-sky-800 dark:text-sky-400">{formatMoney(featured.entryFee)}/đội</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          ) : (
            /* Empty state — không có giải nào trong CSDL */
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có giải đấu tiêu điểm</p>
              <p className="mt-1 text-xs text-slate-500">
                Dữ liệu sẽ tự động hiển thị khi Ban Tổ Chức khởi tạo giải đấu mới trong CSDL.
              </p>
            </div>
          )}

          {/* 5. MAIN NAVIGATION TABS — số liệu đếm từ CSDL */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Khu vực nội dung giải đấu">
            <button 
              type="button"
              role="tab"
              aria-selected={activeTab === 'open'}
              onClick={() => changeTab('open')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] ${
                activeTab === 'open' 
                  ? 'bg-sky-500 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="sm:hidden">Đang Mở ({openCount})</span>
              <span className="hidden sm:inline">Giải Đấu Đang Mở Đăng Ký ({openCount})</span>
            </button>

            <button 
              type="button"
              role="tab"
              aria-selected={activeTab === 'live'}
              onClick={() => changeTab('live')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] ${
                activeTab === 'live' 
                  ? 'bg-sky-500 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="sm:hidden">Lịch &amp; KQ ({liveCount})</span>
              <span className="hidden sm:inline">Lịch Thi Đấu &amp; Kết Quả Live ({liveCount})</span>
            </button>

            <button 
              type="button"
              role="tab"
              aria-selected={activeTab === 'bracket'}
              onClick={() => changeTab('bracket')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] ${
                activeTab === 'bracket' 
                  ? 'bg-sky-500 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="sm:hidden">Nhánh Đấu</span>
              <span className="hidden sm:inline">Bảng Đấu &amp; Nhánh Bracket</span>
            </button>

            <button 
              type="button"
              role="tab"
              aria-selected={activeTab === 'rankings'}
              onClick={() => changeTab('rankings')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] ${
                activeTab === 'rankings' 
                  ? 'bg-sky-500 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span className="sm:hidden">Phong Độ</span>
              <span className="hidden sm:inline">Bảng Xếp Hạng &amp; Phong Độ</span>
            </button>
          </div>

          {/* 6. MAIN WORKSPACE — mỗi tab một nội dung riêng (sửa lỗi tab "chạy một chỗ") */}
          {activeTab === 'bracket' ? (
            <TournamentBracket />
          ) : activeTab === 'rankings' ? (
            /* ---------- TAB: BẢNG XEP HẠNG (tính từ đội đã đăng ký trong CSDL) ---------- */
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Bảng Xếp Hạng Phong Độ Các Đội Đã Ghi Danh
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  Cập nhật từ CSDL • {tournaments.length} giải
                </span>
              </div>

              {(() => {
                const ranked = tournaments
                  .flatMap((t) => (t.teams ?? []).map((tm) => ({ ...tm, tournament: t })))
                  .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0) || (b.played ?? 0) - (a.played ?? 0))
                  .slice(0, 20);

                if (!ranked.length) {
                  return (
                    <div className="p-8 text-center">
                      <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="mt-3 text-sm text-slate-500">
                        Chưa có đội nào ghi danh nên chưa có dữ liệu xếp hạng.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto -mx-2 px-2">
                    <table className="w-full text-xs border-collapse min-w-[640px]">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                          <th scope="col" className="py-2 pr-2 sm:pr-3 font-bold sticky left-0 bg-white dark:bg-slate-900 z-10">#</th>
                          <th scope="col" className="py-2 pr-2 sm:pr-3 font-bold">Đội Bóng</th>
                          <th scope="col" className="py-2 pr-2 sm:pr-3 font-bold">Đội Trưởng</th>
                          <th scope="col" className="py-2 pr-2 sm:pr-3 font-bold">Giải Thi Đấu</th>
                          <th scope="col" className="py-2 pr-2 sm:pr-3 font-bold text-right">Số ĐTV</th>
                          <th scope="col" className="py-2 font-bold text-right">Phong Độ</th>
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
                          <tr
                            className={`border-b border-slate-100 dark:border-slate-800/60 ${
                              idx === 0 ? 'bg-amber-50/60 dark:bg-amber-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            } transition-colors`}
                          >
                            <td className="py-2.5 pr-2 sm:pr-3 sticky left-0 bg-white dark:bg-slate-900 z-10">
                              <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full font-mono font-black ${
                                idx === 0 ? 'bg-amber-500 text-slate-950'
                                : idx === 1 ? 'bg-slate-400 text-white'
                                : idx === 2 ? 'bg-amber-700 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3 font-bold text-slate-900 dark:text-white">
                              <button
                                type="button"
                                onClick={() => setExpandedTeam(isOpen ? null : rowKey)}
                                className="inline-flex items-center gap-1.5 hover:text-sky-700 dark:hover:text-sky-400 transition-colors text-left"
                                title={roster.length ? `Xem ${roster.length} thành viên` : "Chưa khai báo danh sách thành viên"}
                              >
                                <span>{idx === 0 && '👑 '}{row.teamName}</span>
                                {roster.length > 0 && (
                                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                )}
                              </button>
                            </td>
                            <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-500">{row.captainName || '—'}</td>
                            <td className="py-2.5 pr-3 text-slate-500 max-w-[16rem] truncate">
                              {row.tournament.title}
                            </td>
                            <td className="py-2.5 pr-3 text-right font-mono text-slate-600 dark:text-slate-500">
                              {row.memberCount ?? (roster.length || '—')}
                            </td>
                            <td className="py-2.5 text-right">
                              <FormDots form={row.form} size="sm" />
                            </td>
                          </tr>
                          {isOpen && roster.length > 0 && (
                            <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40">
                              <td colSpan={6} className="px-3 py-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                  Đội hình {roster.length} thành viên • Đội trưởng {row.captainName || "—"}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {roster.map((m, mi) => (
                                    <span
                                      key={mi}
                                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${
                                        mi === 0
                                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                      }`}
                                    >
                                      {mi + 1}. {m}{mi === 0 ? " (C)" : ""}
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
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start">
            
            {/* LEFT COLUMN (70% - Col span 8): TOURNAMENT CARDS & LIVE BRACKET */}
            <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-6">
              
              {/* LIVE QUICK BRACKET — dựng từ bracketJson thật trong CSDL */}
              {activeTab === 'live' && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded-full font-black text-[11px] flex items-center gap-1 shrink-0 ${
                      liveRows.length
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${liveRows.length ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`}></span>
                      {liveRows.length ? 'TRỰC TIẾP' : 'CHỜ BTC'}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {liveTournament ? liveTournament.title : 'Chưa có giải nào đang diễn ra'}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-bold shrink-0">
                    {liveRows.length ? `${liveRows.length} trận đã xếp lịch` : 'Chưa có lịch thi đấu'}
                  </span>
                </div>

                {liveRows.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 sm:py-6 text-center">
                    BTC chưa xếp lịch cho giải nào. Mở tab <strong>Giải Đấu &amp; BXH › Bảng Đấu &amp; Nhánh Bracket</strong> để bốc thăm và xếp lịch.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {liveRows.map((m) => (
                      <div
                        key={`${m.tournamentId}-${m.matchId}`}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex flex-col gap-2 border border-slate-200/60 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
                          <span className="truncate">
                            {m.tournamentShort} · {m.roundName}
                          </span>
                          <span
                            className={`shrink-0 ${
                              m.status === 'DONE'
                                ? 'text-sky-800 dark:text-sky-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {m.status === 'DONE'
                              ? m.winner
                                ? `${m.sa}-${m.sb} FT`
                                : `${m.sa}-${m.sb} HÒA`
                              : m.timeSlot || 'Chờ lịch'}
                          </span>
                        </div>
                        {[m.teamA, m.teamB].map((name, i) => {
                          const isWinner = m.status === 'DONE' && m.winner === name;
                          const isLoser = m.status === 'DONE' && !!m.winner && m.winner !== name;
                          return (
                            <div
                              key={i}
                              className={`flex items-center justify-between gap-2 p-2 rounded-lg shadow-xs ${
                                isWinner
                                  ? 'bg-white dark:bg-slate-900 border border-[#0ea5e9]/30'
                                  : isLoser
                                  ? 'bg-slate-100/60 dark:bg-slate-900/40'
                                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <span
                                className={`flex items-center gap-2 min-w-0 text-xs truncate ${
                                  isWinner ? 'font-extrabold' : 'font-semibold'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-6 rounded-full shrink-0 ${
                                    isWinner
                                      ? 'bg-emerald-600'
                                      : isLoser
                                      ? 'bg-slate-300 dark:bg-slate-700'
                                      : 'bg-slate-400'
                                  }`}
                                ></span>
                                <span className="truncate text-slate-900 dark:text-slate-100">{name}</span>
                              </span>
                              {m.status !== 'DONE' && (
                                <span className="font-mono text-[10px] text-slate-500 shrink-0">
                                  {(i === 0 ? m.recordA : m.recordB) && (i === 0 ? m.recordA : m.recordB) !== "0-0-0"
                                    ? (i === 0 ? m.recordA : m.recordB)
                                    : "Tân binh"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {m.pitchName && (
                          <span className="text-[10px] text-slate-500 truncate">
                            {m.matchDate ? `${m.matchDate.split('-').reverse().join('/')} · ` : ''}
                            {m.pitchName}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}

              {/* REAL TOURNAMENTS LIST DYNAMICALLY LOADED FROM API */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="radar-ping w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></span>
                    <h3 className="font-extrabold text-sm uppercase tracking-wide text-slate-900 dark:text-white">
                      {listTitle} ({visibleTournaments.length} Giải)
                    </h3>
                  </div>
                  {loadingTournaments && (
                    <span className="text-xs text-sky-700 font-bold flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang cập nhật dữ liệu...
                    </span>
                  )}
                </div>

                {loadingTournaments && visibleTournaments.length === 0 ? (
                  <div role="status" className="space-y-4" aria-label="Đang tải danh sách giải đấu">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                        <div className="skeleton-shimmer h-5 w-2/3 rounded-lg" />
                        <div className="skeleton-shimmer h-3 w-1/2 rounded-lg" />
                        <div className="skeleton-shimmer h-16 w-full rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : visibleTournaments.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                      {tournaments.length === 0
                        ? 'Chưa có giải đấu nào được khởi tạo trong CSDL.'
                        : hasActiveFilters
                        ? 'Không có giải đấu nào khớp bộ lọc.'
                        : selectedStatus === 'ONGOING'
                        ? 'Hiện chưa có giải đấu nào đang diễn ra.'
                        : selectedStatus === 'COMPLETED'
                        ? 'Chưa có giải đấu nào đã kết thúc.'
                        : 'Hiện không có giải đấu nào đang mở đăng ký.'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-3 text-xs font-bold text-sky-800 dark:text-sky-400 hover:underline"
                      >
                        Xóa bộ lọc để xem tất cả
                      </button>
                    )}
                  </div>
                ) : (
                  /* key đổi theo filter/tab để replay cascade mỗi lần danh sách thay đổi */
                  <div key={`${activeTab}-${activeSport}-${selectedFormat}-${selectedStatus}-${selectedLocation}`} className="space-y-4">
                  {visibleTournaments.map((t, cardIdx) => {
                    const percentage = fillPercent(t);
                    const full = isTournamentFull(t);
                    const reg = registeredCount(t);
                    const cap = t.totalTeams ?? 0;
                    const statusLabel =
                      t.status === 'ONGOING' ? 'ĐANG DIỄN RA'
                      : t.status === 'COMPLETED' ? 'ĐÃ KẾT THÚC'
                      : full ? 'ĐÃ ĐỦ ĐỘI' : 'ĐANG MỞ ĐĂNG KÝ';

                    return (
                      <div 
                        key={t.id} 
                        style={{ animationDelay: `${Math.min(cardIdx, 5) * 70}ms` }}
                        className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs hover-card-elevate animate-fade-in-up flex flex-col gap-4 border border-slate-200/80 dark:border-slate-800 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3.5">
                            <div className="w-14 h-14 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center shrink-0 border border-[#0ea5e9]/20 text-2xl">
                              ⚽
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                                  {sportLabel(t.sportType)}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-400 font-bold text-[11px]">
                                  {formatLabel(t.format)}
                                </span>
                                <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                  t.status === 'ONGOING'
                                    ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                                    : t.status === 'COMPLETED'
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    : full 
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400' 
                                    : 'bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-400'
                                }`}>
                                  {statusLabel}
                                </span>
                              </div>
                              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                {t.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-sky-700" />
                                  {t.pitchName || t.location || "TP. Hồ Chí Minh"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                  Khởi tranh: {formatDate(t.startDate)}
                                  {t.registrationDeadline && <> (Hạn: {formatDate(t.registrationDeadline)})</>}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start shrink-0">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Tổng Giải Thưởng</span>
                            <span className="text-xl font-black font-mono text-sky-700 dark:text-sky-400">
                              {formatMoney(t.prizePool)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200/60 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-sky-700" />
                            <span>
                              Số đội: <strong className="text-slate-900 dark:text-white">{reg} / {cap || '—'} Đội</strong>
                              {!full && cap > 0 && <span className="text-sky-700 dark:text-sky-400 font-bold ml-1">(Còn {cap - reg} slot)</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-sky-700" />
                            <span>Lệ phí: <strong className="text-slate-900 dark:text-white">{formatMoney(t.entryFee)} / Đội</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-sky-700" />
                            <span>Công nghệ: <strong className="text-slate-900 dark:text-white">Camera AI & VAR Trực Tiếp</strong></span>
                          </div>
                        </div>

                        {/* Registered Teams Snippet if any */}
                        {t.teams && t.teams.length > 0 && (
                          <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">Đội bóng tiêu biểu đã ghi danh:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {t.teams.map((tm: any, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
                                  ⚽ {tm.teamName} (Cap: {tm.captainName})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Progress & CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="w-36 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-[#0ea5e9] rounded-full transition-all duration-300" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">{percentage}% Slot đã nộp</span>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {t.status === 'COMPLETED' ? (
                              <span className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">
                                Giải Đã Kết Thúc
                              </span>
                            ) : full ? (
                              <span className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">
                                Đã Hết Suất
                              </span>
                            ) : (
                              <Link
                                href={`/tournaments/register?tournamentId=${t.id}`}
                                className="px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] bg-[#0ea5e9] hover:bg-[#0284c7] text-white active:scale-95"
                              >
                                + Nộp Danh Sách Đội Tham Gia
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (30% - Col span 4): LEADERBOARDS & ATHLETE PROFILE WIDGETS */}
            <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-6">
              
              {/* WIDGET 1: ATHLETE PERSONAL ELO STATUS CARD — hiển thị hồ sơ THẬT của user đang đăng nhập */}
              <div id="search-form-section" className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-extrabold flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                    Vị Trí Của Bạn Trên Hệ Thống
                  </span>
                  {user ? (
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-400 text-[11px] font-bold">
                      {user.role === 'OWNER' ? 'Chủ Sân' : user.role === 'ORGANIZER' ? 'Ban Tổ Chức' : 'Xác Thực Thẻ Cầu Thủ'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-bold">
                      Trạng thái khách
                    </span>
                  )}
                </div>

                {user ? (
                  <>
                    {/* Athlete Profile Snippet — lấy từ hồ sơ thật */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                      {athleteAvatarUrl ? (
                        <SafeImage
                          src={athleteAvatarUrl}
                          alt={athleteName}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#0ea5e9] text-white flex items-center justify-center font-bold text-lg shrink-0">
                          {athleteInitials || 'CV'}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{athleteName}</span>
                        <span className="text-xs text-slate-500 truncate">
                          {user.position ? `${user.position}` : 'Cầu thủ'}
                          {user.area ? ` • ${user.area}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Metric dual box */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Phong Độ Đội Bạn</span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          {(() => {
                            const myPhone = String(user?.phone ?? "").replace(/\s/g, "");
                            let mine: any = null;
                            if (myPhone) {
                              for (const t of tournaments) {
                                const f = (t.teams ?? []).find((z: any) => String(z.captainPhone ?? "").replace(/\s/g, "") === myPhone);
                                if (f) { mine = f; break; }
                              }
                            }
                            if (!mine) return <span className="text-sm font-bold text-slate-500">Chưa gắn đội nào</span>;
                            return (
                              <>
                                <FormDots form={mine.form} size="sm" />
                                <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                                  {mine.record ?? "0-0-0"}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          5 trận gần nhất từ lịch sử thật
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Hạng Thi Đấu</span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-lg font-black text-slate-900 dark:text-white truncate">
                            {user.level || 'Chưa phân hạng'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          {user.favoriteSport || 'Bóng đá phủi'}
                        </span>
                      </div>
                    </div>

                    {/* Profile tags (thay cho badge thành tích hardcode) */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Thông Tin Thi Đấu</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(user.position || user.area || user.favoriteSport || user.level) ? (
                          <>
                            {user.position && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-100 dark:bg-sky-950/60 text-emerald-900 dark:text-sky-300 text-xs font-semibold">
                                ⚽ {user.position}
                              </span>
                            )}
                            {user.area && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 text-xs font-semibold">
                                📍 {user.area}
                              </span>
                            )}
                            {user.level && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-semibold">
                                🏆 {user.level}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Chưa cập nhật — hãy bổ sung vị trí & hạng đấu trong Hồ sơ.
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => changeTab('bracket')}
                      className="w-full py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7]"
                    >
                      <span>Nộp Biên Bản Trận Đấu Mới</span>
                    </button>
                  </>
                ) : (
                  /* Guest state — không hiển thị dữ liệu người dùng giả */
                  <div className="flex flex-col items-center text-center gap-3 py-4 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                      <LogIn className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-500 leading-relaxed">
                      Đăng nhập để xem <strong>phong độ thi đấu</strong>, hạng thi đấu và theo dõi vị trí của bạn trên BXH.
                    </p>
                    <button
                      type="button"
                      onClick={() => onRequestLogin?.()}
                      className="w-full py-2.5 rounded-lg bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Đăng Nhập Để Xem Phong Độ</span>
                    </button>
                  </div>
                )}
              </div>

              {/* WIDGET 2: TOP SCORERS & BXH PHONG ĐỘ */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      BXH Vua Phá Lưới & Kiến Tạo
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">TP.HCM • Mùa Q4</span>
                </div>

                {/* Leaderboard Rows — dữ liệu thật từ CSDL */}
                <div className="flex flex-col gap-1 pt-1">
                  {topScorers.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-500">
                      Chưa có bàn thắng nào được ghi nhận. Nhập kết quả trận đấu để lên BXH.
                    </p>
                  ) : (
                    topScorers.map((p) => (
                      <div
                        key={`${p.playerName}-${p.teamName}`}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                          p.rank === 1
                            ? 'bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                            p.rank === 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {p.rank}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 truncate">
                              {p.playerName} {p.rank === 1 && '👑'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium truncate">{p.teamName}</span>
                          </div>
                        </div>
                        <span className="font-mono font-black text-sky-800 dark:text-sky-400 text-xs whitespace-nowrap">
                          {p.goals} bàn ({p.assists} kiến tạo)
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => changeTab('rankings')}
                  className="pt-2 text-center text-xs text-sky-800 dark:text-sky-400 font-bold hover:underline flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] rounded"
                >
                  <span>Xem Bảng Phong Độ Các Đội</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* WIDGET 3: GUARANTEE & FAIRPLAY TRUST BADGES */}
              <div className="p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white text-sm font-bold">
                  <ShieldCheck className="w-5 h-5 text-sky-700" />
                  <span>Bảo Chứng Giải Đấu SoccerHub</span>
                </div>
                <div className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                    <span><strong>100% Trọng tài</strong> có chứng chỉ liên đoàn và kiểm duyệt độc lập trước trận.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                    <span><strong>Smart Bracket Algorithm:</strong> Bốc thăm minh bạch tự động, chống ghép cặp ưu tiên hạt giống.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                    <span><strong>Ký quỹ giải thưởng an toàn:</strong> Tiền thưởng được ký gửi ký quỹ ngân hàng, giải ngân trong 24h.</span>
                  </div>
                </div>
                <div className="pt-2">
                  <a href="#" className="text-xs text-slate-900 dark:text-white hover:text-sky-700 font-bold flex items-center gap-1">
                    <span>Đọc chi tiết Chính Sách FairPlay & Trọng Tài</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

            </div>
          </div>
          )}
        </div>
      </div>

    </div>
  );
};
export default TournamentLeaderboard;
