"use client";

import React, { useMemo, useState } from "react";
import { matchmakingAi } from "@/lib/aiService";
import {
  Sparkles,
  MapPin,
  Clock,
  Zap,
  Star,
  ShieldCheck,
  Flame,
  Search,
  Filter,
  Users,
  PlusCircle,
  Trophy,
  Activity,
  CheckCircle2,
  ChevronDown,
  Award,
  CircleDollarSign,
  UserPlus,
  Tv,
  Lock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Info,
  RefreshCw,
  X
} from "lucide-react";
import { API_BASE_URL, apiRequest, ensureLoggedIn } from "@/lib/api";
import FormDots from "./FormDots";

interface MatchmakingMarketplaceProps {
  user?: any;
  onSelectMatch?: (match: any) => void;
  onCreateMatch?: () => void;
}

export default function MatchmakingMarketplace({
  user,
  onSelectMatch,
  onCreateMatch
}: MatchmakingMarketplaceProps) {
  const [selectedSport, setSelectedSport] = useState("SAN_7");
  const [selectedLevel, setSelectedLevel] = useState("Tất cả");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("TONIGHT");
  const [radiusKm, setRadiusKm] = useState(5);
  const [matchFormat, setMatchFormat] = useState("DOUBLES_MALE");
  const [paymentModel, setPaymentModel] = useState("SPLIT_EQUAL");
  const [joinedMatches, setJoinedMatches] = useState<string[]>([]);
  // Trên mobile: gom bộ lọc nâng cao vào nút thu gọn cho gọn màn hình
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Dữ liệu kèo thật từ MySQL Backend
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Modal tạo kèo mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTeamName, setCreateTeamName] = useState("");
  const [createPitchName, setCreatePitchName] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createMatchTime, setCreateMatchTime] = useState("20:00 Tối nay");
  const [createPitchType, setCreatePitchType] = useState("SAN_7");
  const [createPaymentModel, setCreatePaymentModel] = useState("SPLIT_EQUAL");
  const [createFee, setCreateFee] = useState(50000);
  const [createNote, setCreateNote] = useState("");
  const [creating, setCreating] = useState(false);

  // Modal nhận kèo đối thủ
  const [acceptingPost, setAcceptingPost] = useState<any | null>(null);
  const [acceptOpponentTeam, setAcceptOpponentTeam] = useState("");
  const [acceptOpponentPhone, setAcceptOpponentPhone] = useState(user?.phone || "");
  const [accepting, setAccepting] = useState(false);

  const userName = user?.fullName || user?.name || "Khách";
  const userTier = user?.level || "Chưa xếp bậc";
  // "Đội của tôi" để AI so phong độ: ưu tiên kèo đang mở của chính user
  // (đã kèm form/record/winRate từ backend), chưa đăng kèo thì lấy mốc trung bình.
  const myTeamPost: any | null =
    (user?.phone
      ? posts.find((p: any) => p.captainPhone && user?.phone && String(p.captainPhone).replace(/\s/g, "") === String(user.phone).replace(/\s/g, ""))
      : null) ?? null;
  const myWinRate = myTeamPost?.winRate ?? 50;
  const myForm: string = myTeamPost?.form ?? "";
  const myTeamName: string = myTeamPost?.teamName ?? userName;

  // Sắp xếp kèo bằng AI (fallback: chênh lệch tỷ lệ thắng local khi AI offline)
  const [aiOrder, setAiOrder] = useState<string[] | null>(null);
  const [aiSorting, setAiSorting] = useState(false);
  const [aiOffline, setAiOffline] = useState(false);

  const formScoreOf = (a: string, b: string) => {
    const x = (a || "").toUpperCase().slice(0, 5);
    const y = (b || "").toUpperCase().slice(0, 5);
    let s = 0;
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
      if ("WDL".includes(x[i]) && x[i] === y[i]) s += 1;
    }
    return s;
  };

  const sortByAi = async () => {
    if (posts.length === 0 || aiSorting) return;
    try {
      setAiSorting(true);
      setAiOffline(false);
      const res = await matchmakingAi(
        { id: "me", name: myTeamName, win_rate: myWinRate, recent_form: myForm },
        posts.map((p: any) => ({
          id: String(p.id),
          name: p.teamName || "Kèo",
          win_rate: p.winRate ?? 50,
          recent_form: p.form ?? "",
          contact_phone: p.captainPhone ?? null,
        }))
      );
      if (res && Array.isArray(res.matched_opponents) && res.matched_opponents.length > 0) {
        setAiOrder(res.matched_opponents.map((o: any) => String(o.id)));
      } else {
        setAiOffline(true);
        setAiOrder(
          [...posts]
            .sort(
              (a: any, b: any) =>
                Math.abs((a.winRate ?? 50) - myWinRate) - Math.abs((b.winRate ?? 50) - myWinRate) ||
                formScoreOf(b.form, myForm) - formScoreOf(a.form, myForm)
            )
            .map((p: any) => String(p.id))
        );
      }
    } finally {
      setAiSorting(false);
    }
  };

  const postPassesFormFilter = (p: any) => {
    const form: string = p.form ?? "";
    const winRate: number = p.winRate ?? 50;
    if (selectedLevel === "Có lịch sử") return form !== "";
    if (selectedLevel === "Phong độ cao") return winRate >= 60;
    if (selectedLevel === "Tân binh") return form === "";
    return true;
  };

  const visiblePosts = aiOrder
    ? [...posts].filter(postPassesFormFilter).sort((a: any, b: any) => {
        const ra = aiOrder.indexOf(String(a.id));
        const rb = aiOrder.indexOf(String(b.id));
        return (ra === -1 ? Number.MAX_SAFE_INTEGER : ra) - (rb === -1 ? Number.MAX_SAFE_INTEGER : rb);
      })
    : posts.filter(postPassesFormFilter);

  // Số liệu chợ kèo lấy thẳng từ CSDL — không hardcode.
  const openKèoCount = posts.length;
  // Số VĐV duy nhất đang mở kèo (mỗi đội 1 trưởng), đếm từ dữ liệu thật.
  const onlineCaptains = useMemo(
    () => new Set(posts.map((p: any) => p.captainPhone).filter(Boolean)).size,
    [posts]
  );
  const openKèoBySport = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts) {
      const k = String(p.pitchType ?? "SAN_7");
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [posts]);
  // Số kèo cùng tầm phong độ với đội của bạn (chênh ≤15% tỷ lệ thắng) — thay cho con số % bịa.
  const matchableCount = useMemo(
    () => posts.filter((p: any) => Math.abs((p.winRate ?? 50) - myWinRate) <= 15).length,
    [posts, myWinRate]
  );
  // Bảng xếp đội mở kèo — gom từ bảng matchmaking_posts trong CSDL.
  const topTeams = useMemo(() => {
    const map = new Map<string, { teamName: string; count: number; winRate: number; pitchType?: string }>();
    for (const p of posts) {
      const key = String(p.teamName ?? "—");
      const cur = map.get(key) ?? { teamName: key, count: 0, winRate: p.winRate ?? 50, pitchType: p.pitchType };
      cur.count += 1;
      cur.winRate = Math.max(cur.winRate, p.winRate ?? 50);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || b.winRate - a.winRate).slice(0, 3);
  }, [posts]);

  // Kèo gợi ý cho widget radar: ưu tiên kèo cùng tầm phong độ, không thì lấy kèo đầu tiên
  const recommendedPost = useMemo(
    () =>
      posts.find((p: any) => Math.abs((p.winRate ?? 50) - myWinRate) <= 15) ?? posts[0] ?? null,
    [posts, myWinRate]
  );

  // Fetch real matchmaking posts
  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/community/matchmaking-posts`);
      if (res.ok) {
        const data = await res.json();
        // Chỉ hiển thị kèo còn MỞ — kèo đã ghép (MATCHED) không nhận được nữa.
        setPosts(
          Array.isArray(data) ? data.filter((p: any) => p.status === "OPEN") : []
        );
      }
    } catch (err) {
      console.error("Error fetching matchmaking posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  React.useEffect(() => {
    fetchPosts();
  }, []);

  // Submit tạo kèo mới lên CSDL MySQL
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      if (!ensureLoggedIn('đăng kèo giao lưu')) return;
      // Dùng apiRequest để tự gắn Authorization — endpoint đăng kèo yêu cầu đăng nhập
      const res = await apiRequest<any>("/api/v1/community/matchmaking-posts", {
        method: "POST",
        body: JSON.stringify({
          teamName: createTeamName.trim() || `FC ${userName}`,
          captainName: userName,
          captainPhone: user?.phone || "",
          pitchName: createPitchName.trim() || "Chưa chọn sân",
          address: createAddress.trim(),
          matchTime: createMatchTime,
          pitchType: createPitchType,
          paymentModel: createPaymentModel,
          estimatedFee: createFee,
          note: createNote.trim() || "Kèo giao lưu cọ xát cho đội phong độ tương đương, tinh thần thể thao vui vẻ."
        })
      });

      setShowCreateModal(false);
      setCreateTeamName("");
      setCreateNote("");
      fetchPosts();
      alert("Đã đăng kèo thành công! Các đội khác sẽ thấy kèo của bạn ngay.");
    } catch (err: any) {
      alert(err?.message || "Lỗi kết nối máy chủ khi tạo kèo.");
    } finally {
      setCreating(false);
    }
  };

  // Submit nhận kèo đối thủ vào MySQL
  const handleAcceptPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingPost) return;
    if (!ensureLoggedIn('nhận kèo')) return;
    try {
      setAccepting(true);
      const data = await apiRequest<any>(
        `/api/v1/community/matchmaking-posts/${acceptingPost.id}/accept`,
        {
          method: "POST",
          body: JSON.stringify({
            opponentTeamName: acceptOpponentTeam.trim() || `FC ${userName}`,
            opponentCaptainName: userName,
            opponentCaptainPhone: acceptOpponentPhone.trim() || user?.phone || ""
          })
        }
      );

      alert(data?.message || "Ghép kèo thành công!");
      setJoinedMatches([...joinedMatches, String(acceptingPost.id)]);
      setAcceptingPost(null);
      setAcceptOpponentTeam("");
      fetchPosts();
    } catch (err: any) {
      alert(err?.message || "Lỗi kết nối máy chủ khi nhận kèo.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="w-full space-y-3 sm:space-y-6 pb-20 text-slate-900 dark:text-white animate-fade-in">
      {/* 1. SUB-HEADER & LIVE BREADCRUMB RIBBON */}
      <section className="w-full bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Breadcrumb + AI Matchmaking Indicator */}
          <div className="space-y-1.5">
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500">
              <span className="hover:text-[#0b4f6c] cursor-pointer">Trang chủ</span>
              <span>/</span>
              <span>Chợ Kèo Ghép Đội</span>
              <span>/</span>
              <span className="text-[#0b4f6c] font-bold">Sàn Ghép Cặp Tức Thì</span>
            </div>
            <div className="flex items-center space-x-2 pt-0.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#acf847] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0ea5e9]" />
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                Ghép kèo theo phong độ thi đấu
              </span>
              <span className="text-slate-500">•</span>
              <span className="px-3 py-0.5 rounded-full bg-[#0ea5e9]/10 text-[#0b4f6c] font-bold text-xs">
                {onlineCaptains > 0
                  ? `${onlineCaptains} đội đang mở kèo trên sàn`
                  : "Chưa có kèo nào đang mở"}
              </span>
            </div>
          </div>

          {/* Action Bar Right */}
            <div className="flex items-center gap-2.5">
              <button className="hidden sm:flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors shadow-xs">
                <Filter className="w-4 h-4 text-[#0b4f6c]" />
                <span>Bộ Lọc Kèo Quanh Tôi</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 sm:flex-none justify-center flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-2xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span className="sm:hidden">+ Tạo Kèo</span>
                <span className="hidden sm:inline">+ Tạo Kèo Giao Lưu Mới</span>
              </button>
            </div>
          </div>
        </section>

      {/* 2. FILTER CONSOLE & SPORTS SWITCHER */}
      <section className="w-full bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 sm:space-y-4">
        {/* Sport Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedSport("SAN_7")}
            className={`flex items-center space-x-2 px-3 sm:px-5 py-2 sm:py-3 rounded-2xl font-bold text-xs shrink-0 transition-all ${
              selectedSport === "SAN_7"
                ? "bg-[#0ea5e9] text-white shadow-md shadow-[#006c49]/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>⚽ Bóng Đá Sân 7</span>
            <span className="px-2 py-0.5 rounded-full bg-[#acf847] text-[#102000] font-mono text-[10px] font-black">
              {openKèoBySport.get("SAN_7") ?? 0} kèo mở
            </span>
          </button>

          <button
            onClick={() => setSelectedSport("SAN_5")}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all ${
              selectedSport === "SAN_5"
                ? "bg-[#0ea5e9] text-white shadow-md shadow-[#006c49]/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>👟 Sân 5 Cỏ Nhân Tạo</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
              {openKèoBySport.get("SAN_5") ?? 0} kèo
            </span>
          </button>

          <button
            onClick={() => setSelectedSport("SAN_11")}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all ${
              selectedSport === "SAN_11"
                ? "bg-[#0ea5e9] text-white shadow-md shadow-[#006c49]/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🏟️ Bóng Đá Sân 11 FIFA</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
              {openKèoBySport.get("SAN_11") ?? 0} kèo
            </span>
          </button>

          <button
            onClick={() => setSelectedSport("FUTSAL")}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all ${
              selectedSport === "FUTSAL"
                ? "bg-[#0ea5e9] text-white shadow-md shadow-[#006c49]/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🥅 Futsal Trong Nhà</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
              {openKèoBySport.get("FUTSAL") ?? 0} kèo
            </span>
          </button>
        </div>

        {/* Mobile: nút mở/đóng bộ lọc nâng cao */}
        <button
          type="button"
          onClick={() => setShowMobileFilters((v) => !v)}
          aria-expanded={showMobileFilters}
          className="md:hidden w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
            <Filter className="w-4 h-4 text-[#0b4f6c]" />
            Bộ lọc kèo nâng cao
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            {showMobileFilters ? "Thu gọn" : "Mở rộng"}
            <ChevronDown className={`w-4 h-4 transition-transform ${showMobileFilters ? "rotate-180" : ""}`} />
          </span>
        </button>

        {/* Advanced Filter Metrics Bar (5 Cols Grid) */}
        <div className={`${showMobileFilters ? "grid" : "hidden"} md:grid bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700/60 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-center`}>
          {/* Level / Phong độ */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 uppercase font-extrabold text-[10px]">Lọc theo phong độ</span>
              <span className="text-[#0b4f6c] font-bold text-[11px]">
                {selectedLevel === "Tất cả" ? "Mọi trình độ" : selectedLevel}
              </span>
            </div>
            <div className="flex items-center space-x-1 pt-0.5">
              {["Tất cả", "Có lịch sử", "Phong độ cao", "Tân binh"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    selectedLevel === lvl
                      ? "bg-[#0ea5e9] text-white shadow-xs"
                      : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot */}
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-extrabold text-[10px] block">Khung giờ</span>
            <div className="flex items-center space-x-1 pt-0.5">
              <button
                onClick={() => setSelectedTimeSlot("TONIGHT")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  selectedTimeSlot === "TONIGHT"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                Tối nay (18:30-22h)
              </button>
              <button
                onClick={() => setSelectedTimeSlot("TOMORROW")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  selectedTimeSlot === "TOMORROW"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                Ngày mai
              </button>
            </div>
          </div>

          {/* Radius Filter */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 uppercase font-extrabold text-[10px]">Bán kính</span>
              <span className="text-slate-600 dark:text-slate-300 font-bold text-[11px]">&lt; {radiusKm}km (Q.7, Nhà Bè)</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-[#006c49] cursor-pointer mt-2"
            />
          </div>

          {/* Format Filter */}
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-extrabold text-[10px] block">Thể thức thi đấu</span>
            <select
              aria-label="Thể thức thi đấu"
              value={matchFormat}
              onChange={(e) => setMatchFormat(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="SAN_7">Kèo Bóng Đá Sân 7</option>
              <option value="SAN_5">Kèo Futsal / Sân 5 Người</option>
              <option value="SAN_11">Kèo Sân 11 Chuẩn VFF</option>
              <option value="SOLO_SLOT">Ghép Slot Lẻ / Tuyển Thủ Môn</option>
            </select>
          </div>

          {/* Payment Model */}
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-extrabold text-[10px] block">Hình thức tiền sân</span>
            <select
              aria-label="Hình thức tiền sân"
              value={paymentModel}
              onChange={(e) => setPaymentModel(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="SPLIT_EQUAL">Chia đều tự động (~45k-60k)</option>
              <option value="LOSER_PAYS">Đội thua chịu 100% sân</option>
              <option value="HOST_COVER">Chủ kèo bao trọn gói</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. MAIN GRID CONTENT (68% LEFT + 32% RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start">
        {/* LEFT COLUMN: MATCH LISTINGS (68% WIDTH / 8 COLS) */}
        <main className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Kèo Đang Mở Đăng Ký ({openKèoCount})
              </h2>
              <span className="px-3 py-1 rounded-full bg-[#acf847] text-[#102000] font-mono text-xs font-extrabold">
                {matchableCount}/{openKèoCount} kèo cùng tầm phong độ (±15%)
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
              <span>Sắp xếp:</span>
              <button
                type="button"
                onClick={sortByAi}
                disabled={aiSorting || posts.length === 0}
                title="Nhờ AI xếp kèo cùng tầm phong độ nhất lên đầu"
                className="text-[#0b4f6c] font-bold hover:underline disabled:opacity-50 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiSorting ? "AI đang xếp…" : aiOrder ? (aiOffline ? "Theo phong độ (AI offline) ↻" : "AI đã xếp kèo ✓ xếp lại") : "AI xếp kèo cùng tầm ▼"}</span>
              </button>
            </div>
          </div>
          {aiOffline && aiOrder && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              AI service chưa phản hồi — đang xếp tạm theo độ tương đồng phong độ với đội của bạn.
            </p>
          )}

          {/* MATCH LISTINGS FROM REAL MYSQL BACKEND */}
          <div className="space-y-4">
            {loadingPosts ? (
              <div className="p-5 sm:p-8 text-center bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin text-[#0b4f6c] mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-bold">Đang tải danh sách các kèo giao lưu thật từ hệ thống...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-5 sm:p-8 text-center bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-sm text-slate-500 font-semibold">Chưa có kèo nào đang mở. Hãy là người đầu tiên tạo kèo!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-[#0ea5e9] text-white text-xs font-bold"
                >
                  + Đăng Tin Tạo Kèo Ngay
                </button>
              </div>
            ) : (
              visiblePosts.map((post, vIdx) => {
                const isMatched = post.status === "MATCHED";
                const isMyJoined = joinedMatches.includes(String(post.id));
                const isAiTop = aiOrder !== null && vIdx === 0 && !isMatched;

                return (
                  <article 
                    key={post.id} 
                    className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-extrabold text-xs border ${
                          isMatched 
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700" 
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse"
                        }`}>
                          <Flame className="w-4 h-4 text-rose-600" />
                          <span>{isMatched ? "ĐÃ CÓ ĐỐI THỦ NHẬN KÈO" : "KÈO ĐANG MỞ CHỜ ĐỐI"}</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                          {post.pitchType === "SAN_7" ? "Sân 7 Cỏ Nhân Tạo" : post.pitchType === "SAN_5" ? "Sân 5 Mini" : "Sân 11 FIFA"}
                        </span>
                        {isAiTop && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{aiOffline ? "Hợp phong độ nhất" : "AI đề xuất"}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[#0b4f6c] font-mono font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-[#0b4f6c]" />
                        <FormDots form={post.form} size="sm" />
                        <span className="text-slate-500 font-sans font-bold">
                          {post.record && post.record !== "0-0-0" ? `${post.record} • ` : ""}Thắng {post.winRate ?? 50}%
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{post.teamName}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-400 font-bold">
                            Cap: {post.captainName}
                          </span>
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <span className="flex items-center space-x-1 text-slate-900 dark:text-white font-bold">
                            <MapPin className="w-4 h-4 text-[#0b4f6c]" />
                            <span>{post.pitchName}</span>
                          </span>
                          {post.address && (
                            <>
                              <span>•</span>
                              <span>{post.address}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end bg-slate-50 dark:bg-slate-800/60 md:bg-transparent p-3 md:p-0 rounded-xl">
                        <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                          {(post.estimatedFee || 50000).toLocaleString('vi-VN')}đ <span className="text-xs font-normal text-slate-500">/người</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#0b4f6c]">
                          {post.paymentModel === "SPLIT_EQUAL" ? "Chia đôi tiền sân (50/50)" : post.paymentModel === "LOSER_PAYS" ? "Đội thua trả tiền sân" : "Chủ kèo bao trọn"}
                        </span>
                      </div>
                    </div>

                    {/* Note / Lời nhắn của đội */}
                    {post.note && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
                        <span className="font-bold text-slate-500 mr-1">Ghi chú:</span>
                        <span>{post.note}</span>
                      </div>
                    )}

                    {/* Opponent matched info if any */}
                    {isMatched && (
                      <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-[#0ea5e9]/30 rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sky-900 dark:text-sky-400">Đối thủ đã nhận: </span>
                          <strong className="text-slate-900 dark:text-white">{post.opponentTeamName}</strong> (Cap: {post.opponentCaptainName})
                        </div>
                        <span className="text-sky-700 font-mono font-bold text-[11px]">Đã chốt kèo</span>
                      </div>
                    )}

                    {/* Action Bottom */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-mono text-sm font-bold">
                        <Clock className="w-4 h-4 text-[#0b4f6c]" />
                        <span>{post.matchTime}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isMatched ? (
                          <span className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold">
                            Đã Đầy Đội
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setAcceptingPost(post);
                              setAcceptOpponentTeam(`FC ${userName}`);
                            }}
                            className="px-5 py-2.5 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
                          >
                            <Zap className="w-4 h-4 text-white" />
                            <span>Bắt Kèo Giao Lưu Ngay</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: AI MATCH RADAR & ESCROW FAIRPLAY (32% WIDTH / 4 COLS) */}
        <aside className="lg:col-span-4 space-y-5">
          {/* WIDGET 1: GỢI Ý GHÉP KÈO (đọc từ bảng matchmaking_posts) */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#0ea5e9] text-white flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Kèo Gợi Ý Cho Bạn</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#acf847] text-[#102000] font-mono text-xs font-black">
                {matchableCount}/{openKèoCount} cùng tầm
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 flex items-center justify-between border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-extrabold">Hồ sơ của bạn</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{userName}</span>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="font-extrabold text-[#0b4f6c]">{userTier}</div>
                <div className="text-slate-500 text-[10px]">
                  {myTeamPost ? `Phong độ: ${myTeamPost.record ?? myTeamPost.form ?? "—"}` : "Chưa đăng kèo"}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[10px] uppercase font-extrabold text-slate-500 block">
                Kèo đang mở trong CSDL:
              </span>
              {loadingPosts ? (
                <p className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500">
                  Đang tải kèo…
                </p>
              ) : !recommendedPost ? (
                <p className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 leading-relaxed">
                  Chưa có kèo nào đang mở. Bấm “+ Tạo Kèo” để đăng ký đội của bạn lên sàn.
                </p>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 space-y-1 text-[#0b4f6c]">
                  <div className="flex items-center justify-between font-bold">
                    <span className="truncate pr-2">{recommendedPost.pitchName ?? "Chưa chọn sân"}</span>
                    <span className="font-mono shrink-0">{recommendedPost.matchTime ?? "—"}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {recommendedPost.teamName} mở kèo
                    {recommendedPost.record && recommendedPost.record !== "0-0-0"
                      ? ` • Thành tích ${recommendedPost.record}`
                      : " • Tân binh chưa có lịch sử"}
                    {typeof recommendedPost.estimatedFee === "number"
                      ? ` • Cọc dự kiến ${recommendedPost.estimatedFee.toLocaleString("vi-VN")}đ`
                      : ""}
                  </p>
                </div>
              )}
            </div>

            {recommendedPost && (
              <button
                onClick={() => setAcceptingPost(recommendedPost)}
                className="w-full py-3 rounded-2xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <Zap className="w-4 h-4 text-white" />
                <span>Xem Chi Tiết &amp; Nhận Kèo</span>
              </button>
            )}
          </section>

          {/* WIDGET 2: HỒ SƠ CẦU THỦ + SỐ LIỆU SÀN (lấy từ CSDL) */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#0b4f6c]" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Hồ Sơ Cầu Thủ</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                {user?.email ? "Đã đăng nhập" : "Khách"}
              </span>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-1 shadow-md">
              <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Phong độ đội của bạn</span>
              <div className="flex items-baseline justify-between font-mono">
                <FormDots form={myForm} />
                <span className="text-xs text-slate-300 font-bold">
                  {myTeamPost
                    ? `${myTeamPost.record ?? "0-0-0"} • Thắng ${myWinRate}%`
                    : user?.level ?? "Chưa xếp bậc"}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 pt-1">
                {userName ? `${userName} • ${user?.position ?? "Cầu thủ"} • ${user?.area ?? "Chưa cập nhật khu vực"}` : "Đăng nhập để BTC và đội khác thấy hồ sơ của bạn."}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Kèo đang mở trên sàn:</span>
                <span className="font-bold text-[#0b4f6c] font-mono">{openKèoCount} kèo</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Số đội đang chờ ghép:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{onlineCaptains} đội</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Kèo hợp trình độ của bạn:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {matchableCount}/{openKèoCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] flex items-start space-x-2">
                <Info className="w-4 h-4 text-[#0b4f6c] shrink-0 mt-0.5" />
                <span>
                  Tên đội, trình độ và số liệu trên đều đọc trực tiếp từ CSDL — có kèo mới là danh sách tự cập nhật.
                </span>
              </div>
            </div>
          </section>

          {/* WIDGET 3: TOP ĐỘI ĐANG MỞ KÈO (nhiều kèo + phong độ cao) */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-700" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Đội Mở Kèo Nhiều Nhất</h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">{openKèoCount} kèo trong CSDL</span>
            </div>

            {topTeams.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Chưa có kèo nào. Bấm “+ Tạo Kèo Giao Lưu Mới” để mở kèo đầu tiên.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {topTeams.map((t, i) => (
                  <div
                    key={t.teamName}
                    className={`flex items-center justify-between p-2.5 rounded-xl ${
                      i === 0
                        ? "bg-slate-50 dark:bg-slate-800/80"
                        : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                          i === 0
                            ? "bg-[#acf847] text-[#102000]"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{t.teamName}</p>
                        <span className="text-[10px] text-slate-500">
                          {t.count} kèo đang mở • {t.pitchType ?? "Sân 7"}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[#0b4f6c] shrink-0">Thắng {t.winRate}%</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* MODAL 1: TẠO KÈO GIAO LƯU BÓNG ĐÁ MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl animate-modal-pop text-slate-900 dark:text-white my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                <PlusCircle className="w-5 h-5 text-[#0b4f6c]" />
                Đăng Tin Tạo Kèo Giao Lưu Bóng Đá
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Tên Đội Bóng Của Bạn (FC)</label>
                <input 
                  type="text" 
                  required 
                  value={createTeamName}
                  onChange={(e) => setCreateTeamName(e.target.value)}
                  placeholder="Ví dụ: FC Phù Đổng Q7"
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-[#006c49]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Thể Thức Sân</label>
                  <select 
                    aria-label="Thể thức sân"
                    value={createPitchType}
                    onChange={(e) => setCreatePitchType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none"
                  >
                    <option value="SAN_7">⚽ Sân 7 Cỏ Nhân Tạo</option>
                    <option value="SAN_5">👟 Sân 5 Mini</option>
                    <option value="SAN_11">🏟️ Sân 11 FIFA</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Thời Gian Đá</label>
                  <input 
                    type="text" 
                    required 
                    value={createMatchTime}
                    onChange={(e) => setCreateMatchTime(e.target.value)}
                    placeholder="Ví dụ: 20:00 Tối nay"
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-[#006c49]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Cụm Sân Thi Đấu</label>
                <input 
                  type="text" 
                  required 
                  value={createPitchName}
                  onChange={(e) => setCreatePitchName(e.target.value)}
                  placeholder="Ví dụ: Sân Bóng Đá Đại Nắng (Sân 7A)"
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-[#006c49]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Hình Thức Tiền Sân</label>
                  <select 
                    aria-label="Hình thức tiền sân"
                    value={createPaymentModel}
                    onChange={(e) => setCreatePaymentModel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none"
                  >
                    <option value="SPLIT_EQUAL">Chia Đôi 50/50</option>
                    <option value="LOSER_PAYS">Đội Thua Trả 100%</option>
                    <option value="HOST_COVER">Chủ Kèo Bao Sân</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Dự Kiến / Người (VNĐ)</label>
                  <input 
                    type="number" 
                    step={5000}
                    value={createFee}
                    onChange={(e) => setCreateFee(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-[#006c49]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Lời Nhắn Tìm Đối / Yêu Cầu</label>
                <textarea 
                  rows={2}
                  value={createNote}
                  onChange={(e) => setCreateNote(e.target.value)}
                  placeholder="Ví dụ: Tìm đội phong độ tương đương, đá giao lưu vui vẻ, fairplay không quạu."
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-[#006c49]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-bold"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-extrabold flex items-center gap-1.5 shadow-md"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{creating ? "Đang lưu..." : "Đăng Kèo Lên Sàn"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: XÁC NHẬN BẮT KÈO ĐỐI THỦ */}
      {acceptingPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl animate-modal-pop text-slate-900 dark:text-white my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                <Zap className="w-5 h-5 text-[#0b4f6c]" />
                Xác Nhận Bắt Kèo Giao Lưu
              </h3>
              <button 
                onClick={() => setAcceptingPost(null)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-[#0ea5e9]/30 rounded-2xl text-xs space-y-1">
              <span className="font-extrabold text-sky-900 dark:text-sky-300 block">
                Đối đầu: {acceptingPost.teamName} (Cap: {acceptingPost.captainName})
              </span>
              <div className="text-slate-600 dark:text-slate-500 flex justify-between">
                <span>Khung giờ & Sân:</span>
                <strong className="text-slate-900 dark:text-white">{acceptingPost.matchTime} • {acceptingPost.pitchName}</strong>
              </div>
            </div>

            <form onSubmit={handleAcceptPost} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Tên Đội Của Bạn (FC Thách Đấu)</label>
                <input 
                  type="text" 
                  required 
                  value={acceptOpponentTeam}
                  onChange={(e) => setAcceptOpponentTeam(e.target.value)}
                  placeholder="Ví dụ: FC Saigon Warriors"
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-[#006c49]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Số Điện Thoại Đội Trưởng Nhận Kèo</label>
                <input 
                  type="tel" 
                  required 
                  value={acceptOpponentPhone}
                  onChange={(e) => setAcceptOpponentPhone(e.target.value)}
                  placeholder="09xx..."
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-[#006c49]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Phong độ đội bạn:</span>
                  <strong className="text-[#0b4f6c] font-mono font-bold">
                    {myTeamPost ? `${myTeamPost.record ?? "0-0-0"} • Thắng ${myWinRate}%` : "Tân binh"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Cam kết tinh thần:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Fairplay & Đúng Giờ</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setAcceptingPost(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-bold"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={accepting}
                  className="px-5 py-2 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-extrabold flex items-center gap-1.5 shadow-md"
                >
                  {accepting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{accepting ? "Đang chốt..." : "Chốt Kèo Giao Lưu"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
