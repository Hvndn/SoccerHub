"use client";

import React, { useMemo, useState, useEffect } from "react";
import { toastOk, toastInfo } from "@/lib/toast";
import SafeImage from "@/components/SafeImage";
import {
  User,
  ShieldCheck,
  Trophy,
  Award,
  Zap,
  Activity,
  Heart,
  Flame,
  Star,
  Share2,
  Edit3,
  Swords,
  Video,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Filter,
  Sparkles,
  Phone,
  Mail,
  Check,
  X,
  Target,
  CircleDot,
  Save,
  ArrowLeft,
  Footprints,
  Shirt,
  Scale,
  Ruler,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/lib/authService";
import { fetchTournaments, sportLabel } from "@/lib/tournamentService";
import FormDots from "./FormDots";

interface PlayerProfileConsoleProps {
  user?: UserProfile | null;
  onOpenAuth?: (mode: "login" | "register") => void;
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function PlayerProfileConsole({
  user: propUser,
  onOpenAuth,
  onBackToHome,
  onNavigateTab
}: PlayerProfileConsoleProps) {
  const { user: contextUser, updateProfile } = useAuth();
  const activeUser = propUser !== undefined ? propUser : contextUser;

  // Active Football Pitch Format Tab State
  const [activeFormat, setActiveFormat] = useState<"san7" | "san5" | "san11" | "futsal">("san7");

  // Giải đấu trong CSDL — nguồn tính thành tích thi đấu thật.
  const [tournaments, setTournaments] = useState<any[]>([]);
  useEffect(() => {
    let alive = true;
    fetchTournaments()
      .then((list) => { if (alive) setTournaments(list as any[]); })
      .catch(() => { if (alive) setTournaments([]); });
    return () => { alive = false; };
  }, []);

  // History Filter State
  const [historyFilter, setHistoryFilter] = useState<"all" | "win" | "loss" | "ai_video">("all");

  // In-page Edit Mode (Inline Mode - Tuyệt đối không dùng popup)
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");

  // Detailed Form State (Mở rộng toàn diện hồ sơ thể chất & bóng đá)
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    area: "",
    favoriteSport: "",
    level: "",
    avatar: "",
    // Chỉ số hồ sơ do cầu thủ tự khai báo — không có thì để trống (không bịa)
    dominantFoot: "",
    jerseyNumber: "",
    height: "",
    weight: "",
    preferredTime: "",
    currentClub: "",
  });

  useEffect(() => {
    if (activeUser) {
      setEditForm(prev => ({
        ...prev,
        fullName: activeUser.fullName || "",
        email: activeUser.email || "",
        phone: activeUser.phone || "",
        position: activeUser.position || "",
        area: activeUser.area || "",
        favoriteSport: activeUser.favoriteSport || "football",
        level: activeUser.level || "",
        avatar: activeUser.avatar || "",
        dominantFoot: activeUser.dominantFoot || "",
        jerseyNumber: activeUser.jerseyNumber || "",
        height: activeUser.height || "",
        weight: activeUser.weight || "",
        preferredTime: activeUser.preferredTime || "",
        currentClub: activeUser.currentClub || "",
      }));
    }
  }, [activeUser]);

  const handleToggleEdit = () => {
    if (!activeUser) {
      if (onOpenAuth) {
        onOpenAuth("login");
      } else {
        toastInfo("Vui lòng đăng nhập để cập nhật hồ sơ cầu thủ!");
      }
      return;
    }
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
    setIsEditingInline(!isEditingInline);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
    try {
      await updateProfile(editForm);
      setSaveSuccessMsg("Đã lưu thành công toàn bộ hồ sơ chi tiết cầu thủ!");
      setTimeout(() => {
        setIsEditingInline(false);
        setSaveSuccessMsg("");
      }, 1200);
    } catch (err: any) {
      setSaveErrorMsg(err?.message || "Cập nhật thất bại. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper values
  const displayFullName = editForm.fullName || activeUser?.fullName || "Chưa cập nhật tên";
  const displayEmail = editForm.email || activeUser?.email || "—";
  const displayPhone = editForm.phone || activeUser?.phone || "Chưa khai báo SĐT";
  const displayRole = activeUser?.role === "OWNER" ? "Chủ Sân" : activeUser?.role === "ORGANIZER" ? "Ban Tổ Chức" : activeUser?.role === "ADMIN" ? "Quản Trị" : "Cầu Thủ";
  const displayPosition = editForm.position || "Chưa khai báo vị trí";
  const displayArea = editForm.area || "Chưa khai báo khu vực";
  const displayLevel = editForm.level || "Chưa xếp bậc";
  const displayAvatar = editForm.avatar || activeUser?.avatar;

  const isAvatarUrl = displayAvatar && (displayAvatar.startsWith("http://") || displayAvatar.startsWith("https://") || displayAvatar.startsWith("data:"));
  const initials = displayFullName
    ? displayFullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "HD";

  // ============================================================================
  // THÀNH TÍCH THI ĐẤU — tính từ CSDL (giải + nhánh đấu + goal_events)
  // Không có bảng chỉ số kỹ năng/rank phần trăm trong hệ thống nên không bịa.
  // ============================================================================
  const perf = useMemo(() => {
    const myPhone = (activeUser?.phone ?? "").toString().replace(/\s/g, "");
    const result = {
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      myTeamName: null as string | null,
      titles: 0,
      history: [] as any[],
    };
    if (!myPhone) return result;

    for (const t of tournaments) {
      const myTeam = (t.teams ?? []).find(
        (z: any) => String(z.captainPhone ?? "").replace(/\s/g, "") === myPhone
      );
      if (!myTeam?.teamName || !t.bracketJson) continue;
      if (!result.myTeamName) result.myTeamName = myTeam.teamName;

      let bracket: any = null;
      try {
        bracket = JSON.parse(t.bracketJson);
      } catch {
        continue;
      }
      if (!Array.isArray(bracket?.rounds)) continue;

      for (const r of bracket.rounds) {
        for (const m of r.matches ?? []) {
          if (!m.teamA || !m.teamB) continue;
          const isA = m.teamA.name === myTeam.teamName;
          const isB = m.teamB.name === myTeam.teamName;
          if (!isA && !isB) continue;

          if (m.status !== "DONE") {
            result.history.push({
              id: `${t.id}-${m.matchId}`,
              date: m.matchDate ?? "",
              time: m.timeSlot ?? "",
              pitch: m.pitchName ?? t.pitchName ?? t.location ?? "Chưa xếp sân",
              format: sportLabel(t.sportType),
              result: "upcoming",
              score: `${m.scoreA ?? 0} - ${m.scoreB ?? 0}`,
              myTeam: m.teamA.name,
              opponent: m.teamB.name,
              scoreDiff: "-",
              mvp: false,
              stats: "Chưa có kết quả",
              hasAiVideo: false,
            });
            continue;
          }

          const sa = m.scoreA ?? 0;
          const sb = m.scoreB ?? 0;
          const myScore = isA ? sa : sb;
          const oppScore = isA ? sb : sa;
          result.matches += 1;
          result.goalsFor += myScore;
          result.goalsAgainst += oppScore;
          if (myScore > oppScore) result.wins += 1;
          else if (myScore < oppScore) result.losses += 1;
          else result.draws += 1;
          if (oppScore === 0) result.cleanSheets += 1;

          result.history.push({
            id: `${t.id}-${m.matchId}`,
            date: m.matchDate ?? "",
            time: m.timeSlot ?? "",
            pitch: m.pitchName ?? t.pitchName ?? t.location ?? "Chưa xếp sân",
            format: sportLabel(t.sportType),
            result: myScore > oppScore ? "win" : myScore < oppScore ? "loss" : "draw",
            score: `${sa} - ${sb}`,
            myTeam: m.teamA.name,
            opponent: m.teamB.name,
            scoreDiff: `${myScore > oppScore ? "+" : ""}${myScore - oppScore} bàn`,
            mvp: false,
            stats: `Ghi ${myScore} • Thủng ${oppScore}`,
            hasAiVideo: false,
          });
        }
      }
      // Vô địch = đội của tôi thắng ở vòng đấu cuối cùng của nhánh
      const lastRound = [...bracket.rounds]
        .reverse()
        .find((r: any) =>
          (r.matches ?? []).some(
            (m: any) =>
              m.status !== "BYE" &&
              (m.teamA?.name === myTeam.teamName || m.teamB?.name === myTeam.teamName)
          )
        );
      const finalMatch = lastRound?.matches?.find((m: any) => m.status !== "BYE");
      if (finalMatch?.status === "DONE" && finalMatch.winner === myTeam.teamName) {
        result.titles += 1;
      }
    }
    result.history.sort((a: any, b: any) => (b.date + b.time).localeCompare(a.date + a.time));
    return result;
  }, [tournaments, activeUser?.phone]);

  const totalDecided = perf.wins + perf.losses + perf.draws;
  const winRate = totalDecided ? Math.round((perf.wins / totalDecided) * 1000) / 10 : 0;
  const goalDiff = perf.goalsFor - perf.goalsAgainst;
  // 5 trận gần nhất đã có kết quả (history đã sắp mới → cũ)
  const recentForm = perf.history
    .filter((h: any) => h.result !== "upcoming")
    .slice(0, 5);
  // Chuỗi phong độ 5 trận gần nhất (ký tự đầu = mới nhất) + thành tích T-H-B từ lịch sử thật
  const formStr = recentForm
    .map((h: any) => (h.result === "win" ? "W" : h.result === "loss" ? "L" : "D"))
    .join("");
  const recordStr = `${perf.wins}-${perf.draws}-${perf.losses}`;

  /** Bảng chỉ số dùng chung cho cả 4 môn — hệ thống chưa tách chỉ số theo môn. */
  const formatStats = {
    san7: buildStat("Bóng Đá Sân 7"),
    san5: buildStat("Bóng Đá Sân 5"),
    san11: buildStat("Bóng Đá Sân 11"),
    futsal: buildStat("Futsal Sàn Gỗ"),
  } as Record<string, any>;

  function buildStat(title: string) {
    return {
      title,
      formStr,
      recordStr,
      // Hệ thống chưa có bảng tier / xếp hạng phần trăm -> hiển thị trạng thái
      tier: displayLevel || "Chưa xếp bậc",
      badge: activeUser?.area || "Chưa cập nhật khu vực",
      percentile: `${perf.matches} trận đã có kết quả`,
      ranking: totalDecided ? `Thắng ${perf.wins} · Hòa ${perf.draws} · Thua ${perf.losses}` : "Chưa thi đấu",
      matches: perf.matches,
      wins: perf.wins,
      losses: perf.losses,
      winRate: `${winRate}%`,
      goals: perf.goalsFor,
      assists: 0,
      cleanSheets: perf.cleanSheets,
      streak: goalDiff > 0 ? `+${goalDiff} hiệu số` : goalDiff === 0 ? "Cân bằng" : `${goalDiff} hiệu số`,
      streakBadge: `${perf.goalsFor} bàn thắng / ${perf.goalsAgainst} bàn thua`,
      // Chỉ số kỹ năng & radar cần dữ liệu đo đạc chưa có trong CSDL
      skills: [] as any[],
      radarPoints: [
        { label: "Ghi bàn", val: perf.goalsFor },
        { label: "Thủ bàn", val: perf.goalsAgainst },
        { label: "Tổng trận", val: perf.matches },
        { label: "Thắng", val: perf.wins },
        { label: "Sạch lưới", val: perf.cleanSheets },
      ],
    };
  }

  const currentStat = formatStats[activeFormat];

  // Lịch sử trận đấu — lấy từ CSDL (nhánh đấu các giải mà bạn làm trọng tài đội)
  const matchHistory = perf.history;

  const filteredMatches = matchHistory.filter(m => {
    if (historyFilter === "win") return m.result === "win";
    if (historyFilter === "loss") return m.result === "loss";
    if (historyFilter === "ai_video") return m.hasAiVideo;
    return true;
  });

  return (
    <div className="w-full text-slate-900 dark:text-slate-100 transition-colors space-y-3 sm:space-y-6 pb-20">
      {/* ========================================================= */}
      {/* HEADER COCKPIT: BẢN HỒ SƠ CẦU THỦ CHI TIẾT TOÀN DIỆN      */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Banner ngầm tinh tế */}
        <div className="relative min-h-[5.5rem] sm:h-32 bg-slate-100 dark:bg-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10 max-w-full">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-[#0ea5e9]/10 dark:bg-[#0ea5e9]/20 text-sky-800 dark:text-sky-300 border border-[#0ea5e9]/30">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
              <span className="truncate">HỒ SƠ CẦU THỦ THUỘC HỆ THỐNG</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 dark:text-emerald-200/70 font-mono shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Nguồn: Lịch sử thi đấu SoccerHub
            </span>
          </div>
        </div>

        {/* Hàng thông tin chính */}
        <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
            
            {/* Bên trái: Avatar + Tên + Thông tin liên hệ */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
              {/* Avatar Box */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl sm:text-3xl lg:text-4xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800 overflow-hidden">
                  {isAvatarUrl ? (
                    <SafeImage
                      src={displayAvatar}
                      alt={displayFullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#0ea5e9] text-white p-1 sm:p-1.5 rounded-xl shadow-md border-2 border-white dark:border-slate-900" title="Tài khoản đã xác minh căn cước & số điện thoại">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Tên & Meta */}
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {displayFullName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                    {displayRole}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    Thành tích {recordStr} (T-H-B)
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 sm:gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-500">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium break-all">
                    <Mail className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
                    <span className="truncate max-w-[220px] sm:max-w-none">{displayEmail}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium shrink-0">
                    <Phone className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
                    {displayPhone}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    {displayArea}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 pt-0.5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Vị trí: <span className="text-sky-700 dark:text-sky-400 font-bold">{displayPosition}</span>
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>Trình độ: <strong className="text-slate-800 dark:text-slate-200">{displayLevel}</strong></span>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-sky-700 dark:text-sky-400 font-medium w-full sm:w-auto">Trạng thái: Sẵn sàng nhận kèo</span>
                </div>
              </div>
            </div>

            {/* Bên phải: Nút thao tác */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 lg:pt-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleToggleEdit}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm min-h-[42px] ${
                    isEditingInline
                      ? "border-[#0ea5e9] bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />
                  <span>{isEditingInline ? "Đóng Form" : "Chỉnh Sửa Hồ Sơ"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toastOk("Đã sao chép liên kết hồ sơ cầu thủ SoccerHub!");
                  }}
                  className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-all shadow-sm shrink-0 min-h-[42px] min-w-[42px] flex items-center justify-center"
                  title="Chia sẻ hồ sơ"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab("community");
                  } else {
                    window.location.hash = "#community";
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[42px]"
              >
                <Swords className="w-4 h-4 shrink-0" />
                <span>Mời Ghép Đội / Thách Đấu</span>
              </button>
            </div>

          </div>

          {/* BẢNG CHỈ SỐ THỂ CHẤT & THÔNG SỐ CẦU THỦ CHI TIẾT (MỚI BỔ SUNG) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Footprints className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Chân Thuận</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{editForm.dominantFoot || "Chưa khai báo"}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Shirt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Số Áo Thích</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{editForm.jerseyNumber ? `#${editForm.jerseyNumber}` : "—"}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Chiều Cao</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{editForm.height || "Chưa khai báo"}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Cân Nặng</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{editForm.weight || "Chưa khai báo"}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Khung Giờ</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate" title={editForm.preferredTime}>{editForm.preferredTime || "Chưa khai báo"}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Đội Bóng / CLB</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate" title={editForm.currentClub}>{editForm.currentClub || "Chưa khai báo"}</p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ========================================================= */}
        {/* BẢNG CHỈNH SỬA HỒ SƠ INLINE (NẰM TRỰC TIẾP TRÊN TRANG)    */}
        {/* ========================================================= */}
        {isEditingInline && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border-2 border-emerald-500/80 p-4 sm:p-8 shadow-md space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-500" />
                  Cập Nhật Chi Tiết Hồ Sơ & Thể Chất Cầu Thủ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thay đổi thông tin trực tiếp trên giao diện hồ sơ (Không sử dụng popup).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingInline(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-sky-50 text-sky-900 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-[#0ea5e9] text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-sky-700" />
                {saveSuccessMsg}
              </div>
            )}

            {saveErrorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700 text-xs">
                {saveErrorMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                    placeholder="Ví dụ: Hồ Văn Diện"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Địa Chỉ Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                    placeholder="cauthu@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                    placeholder="0947 304 321"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trình Độ Thi Đấu
                  </label>
                  <select
                    aria-label="Trình độ thi đấu"
                    value={editForm.level}
                    onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                  >
                    <option value="Mới bắt đầu">Mới bắt đầu</option>
                    <option value="Nghiệp dư">Nghiệp dư</option>
                    <option value="Bán chuyên">Bán chuyên</option>
                    <option value="Chuyên nghiệp / Cựu tuyển">Chuyên nghiệp / Cựu tuyển</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vị Trí Sở Trường
                  </label>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                    placeholder="Ví dụ: Tiền vệ trung tâm (CM) / Hộ công"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Khu Vực Thi Đấu Thường Xuyên
                  </label>
                  <input
                    type="text"
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                    placeholder="Ví dụ: Đà Nẵng (Hải Châu / Cẩm Lệ)"
                  />
                </div>
              </div>

              {/* Thông số Thể chất bổ sung */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chân Thuận
                  </label>
                  <select
                    aria-label="Chân thuận"
                    value={editForm.dominantFoot}
                    onChange={(e) => setEditForm({ ...editForm, dominantFoot: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                  >
                    <option value="Chân Phải">Chân Phải</option>
                    <option value="Chân Trái">Chân Trái</option>
                    <option value="Hai Chân Như Một">Hai Chân Như Một</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số Áo Ưa Thích
                  </label>
                  <input
                    type="text"
                    value={editForm.jerseyNumber}
                    onChange={(e) => setEditForm({ ...editForm, jerseyNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chiều Cao
                  </label>
                  <input
                    type="text"
                    value={editForm.height}
                    onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                    placeholder="1m75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cân Nặng
                  </label>
                  <input
                    type="text"
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                    placeholder="68 kg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Đội Bóng / CLB Đang Thi Đấu
                  </label>
                  <input
                    type="text"
                    value={editForm.currentClub}
                    onChange={(e) => setEditForm({ ...editForm, currentClub: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                    placeholder="FC Brothers Đà Nẵng"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    URL Ảnh Đại Diện (Avatar)
                  </label>
                  <input
                    type="url"
                    value={editForm.avatar}
                    onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#0284c7] outline-none"
                    placeholder="https://... ảnh chân dung"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingInline(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Đang lưu..." : "Lưu Thông Tin"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4 THẺ THỐNG KÊ NHANH (QUICK METRICS RIBBON)               */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Trận đã đấu */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between animate-fade-in-up delay-stagger-1 hover-card-elevate">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                TRẬN ĐÃ ĐẤU
              </span>
              <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400">
                <Target className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {currentStat.matches}
                </span>
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                  Thắng {currentStat.wins}
                </span>
                <span className="text-xs text-slate-500">
                  Bại {currentStat.losses}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden flex">
                <div className="bg-[#0ea5e9] h-full rounded-l-full" style={{ width: currentStat.winRate }} />
                <div className="bg-rose-500 h-full rounded-r-full" style={{ width: `${100 - parseFloat(currentStat.winRate)}%` }} />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Tỷ lệ chiến thắng: <strong className="text-slate-800 dark:text-slate-200">{currentStat.winRate}</strong>
              </p>
            </div>
          </div>

          {/* 2. Chuỗi phong độ */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between animate-fade-in-up delay-stagger-2 hover-card-elevate">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                CHUỖI PHONG ĐỘ
              </span>
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700">
                <Flame className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {currentStat.streak}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 uppercase">
                  {currentStat.streakBadge}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                {recentForm.length === 0 ? (
                  <span className="text-[11px] text-slate-500">Chưa có trận nào kết thúc</span>
                ) : (
                  recentForm.map((h) => (
                    <span
                      key={h.id}
                      title={`${h.myTeam} ${h.score} ${h.opponent}`}
                      className={`w-6 h-6 rounded-md text-white text-[11px] font-bold flex items-center justify-center ${
                        h.result === "win"
                          ? "bg-[#0ea5e9] text-white"
                          : h.result === "draw"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    >
                      {h.result === "win" ? "W" : h.result === "draw" ? "D" : "L"}
                    </span>
                  ))
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {recentForm.length > 0
                  ? "5 trận gần nhất (trái = mới nhất) — tính từ nhánh đấu trong CSDL"
                  : "Kết quả sẽ tự cập nhật khi bạn nhập tỷ số các trận"}
              </p>
            </div>
          </div>

          {/* 3. Trận giữ sạch lưới */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between animate-fade-in-up delay-stagger-3 hover-card-elevate">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                TRẬN KHÔNG THỦNG LƯỚI
              </span>
              <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-500">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {perf.cleanSheets}
                </span>
                <span className="text-xs text-slate-500">/ {perf.matches} trận</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                {perf.matches === 0
                  ? "Chưa có trận kết thúc để đếm"
                  : `Ghi nhận từ tỷ số các trận đã có kết quả • ${perf.goalsAgainst} bàn thua`}
              </p>
            </div>
          </div>

          {/* 4. Bộ sưu tập danh hiệu */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between animate-fade-in-up delay-stagger-4 hover-card-elevate">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                BỘ SƯU TẬP GIẢI ĐẤU
              </span>
              <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-500">
                <Trophy className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-700 font-mono">
                  {String(perf.titles).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Giải Vô Địch
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-600 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-sky-500" />
                  {perf.matches} trận đã đá
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  {perf.wins} trận thắng
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {perf.myTeamName
                  ? `Đội của bạn: ${perf.myTeamName} — vô địch khi thắng ở vòng cuối nhánh đấu`
                  : "Bạn chưa là đội trưởng của đội nào trong các giải trên hệ thống"}
              </p>
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* NỘI DUNG CHÍNH: 2 CỘT (CỘT TRÁI 8 PHẦN, CỘT PHẢI 4 PHẦN)  */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
          
          {/* CỘT TRÁI (8 CỘT): ĐÁNH GIÁ NĂNG LỰC, ELO VÀ LỊCH SỬ TRẬN ĐẤU */}
          <div className="lg:col-span-8 space-y-5 sm:space-y-8">
            
            {/* KHỐI 1: ELO & CHỈ SỐ KỸ NĂNG THEO MÔ HÌNH SÂN BÓNG */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-8 shadow-sm">
              
              {/* Header chuyển đổi thể thức sân bóng */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Đánh Giá Năng Lực & Kỹ Năng Cầu Thủ
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Thuật toán tự động đo đạc dựa trên hiệu suất thi đấu, số bàn thắng và phiếu bầu MVP sau mỗi trận.
                  </p>
                </div>

                {/* Tabs thể thức: Sân 7, Sân 5, Sân 11, Futsal */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar max-w-full shrink-0">
                  <button
                    onClick={() => setActiveFormat("san7")}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      activeFormat === "san7"
                        ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Bóng Đá Sân 7
                  </button>
                  <button
                    onClick={() => setActiveFormat("san5")}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      activeFormat === "san5"
                        ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Bóng Đá Sân 5
                  </button>
                  <button
                    onClick={() => setActiveFormat("san11")}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      activeFormat === "san11"
                        ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Bóng Đá Sân 11
                  </button>
                  <button
                    onClick={() => setActiveFormat("futsal")}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      activeFormat === "futsal"
                        ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Futsal Sàn Gỗ
                  </button>
                </div>
              </div>

              {/* Thông số phong độ của thể thức đang chọn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 pt-4 sm:pt-6">
                
                {/* Box Phong độ 5 trận & Thành tích */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      PHONG ĐỘ 5 TRẬN GẦN NHẤT
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                      {currentStat.percentile}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <FormDots form={currentStat.formStr} />
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {currentStat.recordStr}
                    </span>
                    <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                      {totalDecided ? "Thắng-Hòa-Bại (mới → cũ)" : "Chưa có lịch sử thi đấu"}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
                    Hạng: <span className="text-slate-900 dark:text-white font-bold">{currentStat.ranking}</span>
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>Hạng giải đấu: <strong className="text-slate-700 dark:text-slate-200">{currentStat.tier}</strong></span>
                    <span>Huy hiệu: <strong className="text-sky-700 dark:text-sky-400">{currentStat.badge}</strong></span>
                  </div>
                </div>

                {/* Box Thành tích bàn thắng & Kiến tạo */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      ĐÓNG GÓP BÀN THẮNG & KIẾN TẠO
                    </span>
                    <span className="text-xs font-bold text-amber-700">
                      {currentStat.goals + currentStat.assists} G+A
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                      <p className="text-xl font-bold text-sky-700 dark:text-sky-400">{currentStat.goals}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Bàn Thắng</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{currentStat.assists}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Kiến Tạo</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{currentStat.cleanSheets}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Giữ Sạch Lưới</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-3 text-center">
                    Thống kê tự động ghi nhận từ bảng điểm trọng tài & đội trưởng xác nhận
                  </p>
                </div>

              </div>

              {/* Thành tích thi đấu từ CSDL — không có bảng chỉ số kỹ thuật riêng */}
              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Thành Tích Thi Đấu Trong Hệ Thống
                </h3>

                {perf.matches === 0 ? (
                  <p className="text-sm text-slate-500 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 sm:p-6 text-center">
                    Bạn chưa làm trọng tài/đội trưởng của đội nào trong các giải trên hệ thống, nên chưa có thành
                    tích tính được. Số liệu sẽ tự cập nhật ngay khi bạn tham gia giải.
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[520px]">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500 font-black tracking-wider">
                            <th className="py-2.5 px-3">Chỉ số</th>
                            <th className="py-2.5 px-3 text-center">Giá trị</th>
                            <th className="py-2.5 px-3 text-center">Nguồn</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {[
                            { k: "Tổng trận đã đánh", v: perf.matches, src: "match_results" },
                            { k: "Thắng", v: perf.wins, src: "match_results" },
                            { k: "Hòa", v: perf.draws, src: "match_results" },
                            { k: "Thua", v: perf.losses, src: "match_results" },
                            { k: "Tỉ lệ thắng", v: `${winRate}%`, src: "tính từ CSDL" },
                            { k: "Bàn thắng", v: perf.goalsFor, src: "tournaments.bracket_json" },
                            { k: "Bàn thua", v: perf.goalsAgainst, src: "tournaments.bracket_json" },
                            { k: "Hiệu số", v: goalDiff > 0 ? `+${goalDiff}` : goalDiff, src: "tính từ CSDL" },
                            { k: "Trận không thủng lưới", v: perf.cleanSheets, src: "tính từ CSDL" },
                            { k: "Thành tích (T-H-B)", v: recordStr, src: "match_results" },
                          ].map((row) => (
                            <tr key={row.k}>
                              <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{row.k}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 dark:text-white">{row.v}</td>
                              <td className="py-2.5 px-3 text-center font-mono text-[10px] text-slate-500">{row.src}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {currentStat.radarPoints.map((pt, i) => (
                        <div key={i} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                          <p className="text-[11px] font-semibold text-slate-500">{pt.label}</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{pt.val}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* KHỐI 2: LỊCH SỬ THI ĐẤU & TRẬN KÈO PHỦI GẦN ĐÂY */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    Lịch Sử Thi Đấu Gần Đây
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Ghi chép kết quả trận đấu, chuỗi phong độ và video AI tự động quay bàn thắng đẹp.
                  </p>
                </div>

                {/* Filter nút */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar max-w-full shrink-0">
                  <button
                    onClick={() => setHistoryFilter("all")}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                      historyFilter === "all"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setHistoryFilter("win")}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                      historyFilter === "win"
                        ? "bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Thắng
                  </button>
                  <button
                    onClick={() => setHistoryFilter("loss")}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                      historyFilter === "loss"
                        ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Bại
                  </button>
                  <button
                    onClick={() => setHistoryFilter("ai_video")}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                      historyFilter === "ai_video"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Có Video AI
                  </button>
                </div>
              </div>

              {/* Danh sách trận */}
              <div className="space-y-4 pt-6">
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Không có trận đấu nào khớp với bộ lọc hiện tại.
                  </div>
                ) : (
                  filteredMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:border-sky-300 dark:hover:border-emerald-700 transition-all space-y-3"
                    >
                      {/* Dòng 1: Thời gian, Sân và Thể thức */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{m.date}</span>
                          <span>•</span>
                          <span>{m.time}</span>
                          <span>•</span>
                          <span className="font-medium text-sky-700 dark:text-sky-400">{m.format}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">ID: {m.id}</span>
                      </div>

                      {/* Dòng 2: Tỉ số & Tên hai đội */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                              m.result === "win"
                                ? "bg-[#0ea5e9] text-white"
                                : "bg-rose-500 text-white"
                            }`}
                          >
                            {m.result === "win" ? "W" : "L"}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                {m.myTeam}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                                {m.score}
                              </span>
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-500">
                                {m.opponent}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {m.pitch}
                            </p>
                          </div>
                        </div>

                        {/* Kết quả trận & MVP */}
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {m.mvp && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              MVP
                            </span>
                          )}
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                              m.result === "win"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : m.result === "draw"
                                  ? "bg-slate-500/15 text-slate-600 dark:text-slate-300"
                                  : m.result === "loss"
                                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}
                          >
                            {m.result === "win" ? "Thắng" : m.result === "draw" ? "Hòa" : m.result === "loss" ? "Thua" : "Sắp đá"} {m.scoreDiff !== "-" ? `(${m.scoreDiff})` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Dòng 3: Đóng góp & Link Video AI */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600 dark:text-slate-300">
                          {m.stats}
                        </span>
                        {m.hasAiVideo ? (
                          <button
                            onClick={() => toastInfo(`Đang tải video highlights AI của trận đấu ${m.id}...`)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Xem Highlight Bàn Thắng (AI Replay)
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Chưa đăng ký dịch vụ quay AI</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

          {/* CỘT PHẢI (4 CỘT): DỮ LIỆU THỂ LỰC & BỘ SƯU TẬP DANH HIỆU */}
          <div className="lg:col-span-4 space-y-5 sm:space-y-8">
            
            {/* KHỐI 1: THỂ LỰC VẬN ĐỘNG & BẢNG ĐO QUÃNG ĐƯỜNG */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600" />
                  Dữ Liệu Thể Lực Cầu Thủ
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Đồng bộ Smartwatch</span>
              </div>

              {/* 2 Card Calo & Nhịp tim */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                  <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 tracking-wider">
                    CALO TIÊU HAO / TUẦN
                  </span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    3,450 <span className="text-xs font-normal text-slate-500">kcal</span>
                  </p>
                  <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-1 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +12% so với tuần trước
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                  <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                    NHỊP TIM TRUNG BÌNH
                  </span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    142 <span className="text-xs font-normal text-slate-500">bpm</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Đỉnh điểm 178 bpm (Phút 72)
                  </p>
                </div>
              </div>

              {/* Bảng quãng đường di chuyển */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  QUÃNG ĐƯỜNG DI CHUYỂN TRUNG BÌNH
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Bóng đá sân 5 / trận</span>
                    <strong className="text-slate-900 dark:text-white">4.8 km</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Bóng đá sân 7 / trận</span>
                    <strong className="text-sky-700 dark:text-sky-400">7.2 km</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Bóng đá sân 11 / trận</span>
                    <strong className="text-slate-900 dark:text-white">10.5 km</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 text-xs text-sky-900 dark:text-sky-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-700 mt-0.5" />
                <span>Cầu thủ đạt tiêu chuẩn thể lực loại 1, đảm bảo thi đấu cường độ cao không hụt hơi.</span>
              </div>
            </div>

            {/* KHỐI 2: TỦ TRƯNG BÀY DANH HIỆU & HUY HIỆU PHỦI */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-700" />
                  Danh Hiệu & Huy Chương Đạt Được
                </h3>
              </div>

              <div className="space-y-3">
                {(() => {
                  const myTournaments = tournaments.filter((t: any) =>
                    (t.teams ?? []).some((z: any) => z.teamName && z.teamName === perf.myTeamName)
                  );
                  const items: { icon: any; cls: string; title: string; sub: string }[] = [];
                  if (perf.titles > 0 && perf.myTeamName) {
                    items.push({
                      icon: Trophy,
                      cls: "bg-amber-500",
                      title: `Vô địch ${perf.titles} giải`,
                      sub: `Cùng ${perf.myTeamName} • ${perf.wins} trận thắng đã ghi nhận`,
                    });
                  }
                  if (perf.myTeamName && myTournaments.length > 0) {
                    items.push({
                      icon: Award,
                      cls: "bg-blue-600",
                      title: `Đội trưởng ${perf.myTeamName}`,
                      sub: `Tham gia ${myTournaments.length} giải: ${myTournaments
                        .map((t: any) => t.name)
                        .join(" • ")}`,
                    });
                  }
                  if (perf.goalsFor > 0) {
                    items.push({
                      icon: Star,
                      cls: "bg-[#0ea5e9]",
                      title: `Đã ghi ${perf.goalsFor} bàn trong các giải`,
                      sub: `${perf.matches} trận có kết quả • giữ sạch lưới ${perf.cleanSheets} trận`,
                    });
                  }

                  if (items.length === 0) {
                    return (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs text-center text-slate-500">
                        Chưa có danh hiệu nào. Bạn chưa là đội trưởng của đội nào trong các giải
                        trên hệ thống — tham gia giải để tích lũy thành tích.
                      </div>
                    );
                  }
                  return items.map((it, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3.5 ${
                        i === 0
                          ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-800/60"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200/70 dark:border-slate-800"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl ${it.cls} text-white flex items-center justify-center shrink-0 shadow-md`}
                      >
                        <it.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {it.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-500">{it.sub}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-center text-slate-500">
                Hồ sơ tự động cập nhật từ hệ thống giải đấu SoccerHub
              </div>
            </div>

          </div>

        </div>

    </div>
  );
}
