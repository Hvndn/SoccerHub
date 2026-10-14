"use client";

import React, { useState } from "react";
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
  const [selectedLevel, setSelectedLevel] = useState("2.5 - 3.5");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("TONIGHT");
  const [radiusKm, setRadiusKm] = useState(5);
  const [matchFormat, setMatchFormat] = useState("DOUBLES_MALE");
  const [paymentModel, setPaymentModel] = useState("SPLIT_EQUAL");
  const [userDepositBalance, setUserDepositBalance] = useState(200000);
  const [joinedMatches, setJoinedMatches] = useState<string[]>([]);

  // Dữ liệu kèo thật từ MySQL Backend
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Modal tạo kèo mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTeamName, setCreateTeamName] = useState("");
  const [createPitchName, setCreatePitchName] = useState("Cụm Sân Bóng Đá Đại Nắng (Sân 7A)");
  const [createAddress, setCreateAddress] = useState("Số 154 Nguyễn Lương Bằng, Phường Tân Phú, Quận 7");
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

  const userName = user?.fullName || user?.name || "Nguyễn Văn An";
  const userElo = user?.eloRating || 1200;
  const userTier = "Phủi Serie B";

  // Fetch real matchmaking posts
  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await fetch("http://localhost:8080/api/v1/community/matchmaking-posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
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
      const res = await fetch("http://localhost:8080/api/v1/community/matchmaking-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: createTeamName.trim() || `FC ${userName}`,
          captainName: userName,
          captainPhone: user?.phone || "0908 123 456",
          eloRating: userElo,
          pitchName: createPitchName,
          address: createAddress,
          matchTime: createMatchTime,
          pitchType: createPitchType,
          paymentModel: createPaymentModel,
          estimatedFee: createFee,
          note: createNote.trim() || "Kèo giao lưu cọ xát nâng trình Elo, tinh thần thể thao vui vẻ."
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setCreateTeamName("");
        setCreateNote("");
        fetchPosts();
      } else {
        alert("Lỗi khi tạo kèo giao lưu, vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi khi tạo kèo:", err);
      alert("Lỗi kết nối máy chủ khi tạo kèo.");
    } finally {
      setCreating(false);
    }
  };

  // Submit nhận kèo đối thủ vào MySQL
  const handleAcceptPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingPost) return;
    try {
      setAccepting(true);
      const res = await fetch(`http://localhost:8080/api/v1/community/matchmaking-posts/${acceptingPost.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponentTeamName: acceptOpponentTeam.trim() || `FC ${userName}`,
          opponentCaptainName: userName,
          opponentCaptainPhone: acceptOpponentPhone.trim() || user?.phone || "0912 345 678",
          opponentElo: userElo
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Ghép kèo thành công!");
        setJoinedMatches([...joinedMatches, String(acceptingPost.id)]);
        setAcceptingPost(null);
        setAcceptOpponentTeam("");
        fetchPosts();
      } else {
        const errData = await res.json();
        alert(errData.error || "Không thể nhận kèo này.");
      }
    } catch (err) {
      console.error("Lỗi khi nhận kèo:", err);
      alert("Lỗi kết nối máy chủ khi nhận kèo.");
    } finally {
      setAccepting(false);
    }
  };

  const handleJoinMatch = (matchId: string, matchFee: number) => {
    if (joinedMatches.includes(matchId)) return;
    setJoinedMatches([...joinedMatches, matchId]);
    if (onSelectMatch) {
      onSelectMatch({ matchId, matchFee });
    }
  };

  return (
    <div className="w-full space-y-6 pb-20 text-slate-900 dark:text-white animate-fade-in">
      {/* 1. SUB-HEADER & LIVE BREADCRUMB RIBBON */}
      <section className="w-full bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Breadcrumb + AI Matchmaking Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="hover:text-[#006c49] cursor-pointer">Trang chủ</span>
              <span>/</span>
              <span>Chợ Kèo Ghép Đội</span>
              <span>/</span>
              <span className="text-[#006c49] font-bold">Sàn Ghép Cặp Tức Thì</span>
            </div>
            <div className="flex items-center space-x-2 pt-0.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#acf847] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#006c49]" />
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                Thuật toán AI Matchmaking v4.2
              </span>
              <span className="text-slate-400">•</span>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 text-[#006c49] font-bold text-xs">
                Đang kết nối 142 VĐV sẵn sàng ra sân
              </span>
            </div>
          </div>

          {/* Action Bar Right */}
            <div className="flex items-center space-x-2.5">
              <button className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors shadow-xs">
                <Filter className="w-4 h-4 text-[#006c49]" />
                <span>Bộ Lọc Kèo Quanh Tôi</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>+ Tạo Kèo Giao Lưu Mới</span>
              </button>
            </div>
          </div>
        </section>

      {/* 2. FILTER CONSOLE & SPORTS SWITCHER */}
      <section className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Sport Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedSport("SAN_7")}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all ${
              selectedSport === "SAN_7"
                ? "bg-[#006c49] text-white shadow-md shadow-[#006c49]/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>⚽ Bóng Đá Sân 7</span>
            <span className="px-2 py-0.5 rounded-full bg-[#acf847] text-[#102000] font-mono text-[10px] font-black">
              28 kèo mở
            </span>
          </button>

          <button
            onClick={() => setSelectedSport("SAN_5")}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all ${
              selectedSport === "SAN_5"
                ? "bg-[#006c49] text-white shadow-md shadow-[#006c49]/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>👟 Sân 5 Cỏ Nhân Tạo</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
              19 kèo
            </span>
          </button>

          <button
            onClick={() => setSelectedSport("SAN_11")}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all ${
              selectedSport === "SAN_11"
                ? "bg-[#006c49] text-white shadow-md shadow-[#006c49]/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🏟️ Bóng Đá Sân 11 FIFA</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
              6 kèo
            </span>
          </button>

          <button
            onClick={() => setSelectedSport("FUTSAL")}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all ${
              selectedSport === "FUTSAL"
                ? "bg-[#006c49] text-white shadow-md shadow-[#006c49]/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🥅 Futsal Trong Nhà</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
              8 kèo
            </span>
          </button>
        </div>

        {/* Advanced Filter Metrics Bar (5 Cols Grid) */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          {/* Level / Elo */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 uppercase font-extrabold text-[10px]">Trình độ & Hạng Elo</span>
              <span className="text-[#006c49] font-bold text-[11px]">Khớp Elo {userElo}</span>
            </div>
            <div className="flex items-center space-x-1 pt-0.5">
              {["Elo 1000-1200", "Elo 1200-1500", "Elo 1500+"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    selectedLevel === lvl
                      ? "bg-[#006c49] text-white shadow-xs"
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
              value={matchFormat}
              onChange={(e) => setMatchFormat(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="SAN_7">Kèo Bóng Đá Sân 7 (Tính điểm Elo)</option>
              <option value="SAN_5">Kèo Futsal / Sân 5 Người</option>
              <option value="SAN_11">Kèo Sân 11 Chuẩn VFF</option>
              <option value="SOLO_SLOT">Ghép Slot Lẻ / Tuyển Thủ Môn</option>
            </select>
          </div>

          {/* Payment Model */}
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-extrabold text-[10px] block">Hình thức tiền sân</span>
            <select
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: MATCH LISTINGS (68% WIDTH / 8 COLS) */}
        <main className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Kèo Đang Mở Đăng Ký</h2>
              <span className="px-3 py-1 rounded-full bg-[#acf847] text-[#102000] font-mono text-xs font-extrabold">
                Phù hợp 95%+ cho Trình độ Elo {userElo}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
              <span>Sắp xếp:</span>
              <span className="text-[#006c49] font-bold cursor-pointer">Gần nhất & Sớm nhất ▼</span>
            </div>
          </div>

          {/* MATCH LISTINGS FROM REAL MYSQL BACKEND */}
          <div className="space-y-4">
            {loadingPosts ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin text-[#006c49] mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-bold">Đang tải danh sách các kèo giao lưu thật từ hệ thống...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="text-sm text-slate-500 font-semibold">Chưa có kèo nào đang mở. Hãy là người đầu tiên tạo kèo!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-[#006c49] text-white text-xs font-bold"
                >
                  + Đăng Tin Tạo Kèo Ngay
                </button>
              </div>
            ) : (
              posts.map((post) => {
                const isMatched = post.status === "MATCHED";
                const isMyJoined = joinedMatches.includes(String(post.id));

                return (
                  <article 
                    key={post.id} 
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-extrabold text-xs border ${
                          isMatched 
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700" 
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse"
                        }`}>
                          <Flame className="w-4 h-4 text-rose-500" />
                          <span>{isMatched ? "ĐÃ CÓ ĐỐI THỦ NHẬN KÈO" : "KÈO ĐANG MỞ CHỜ ĐỐI"}</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                          {post.pitchType === "SAN_7" ? "Sân 7 Cỏ Nhân Tạo" : post.pitchType === "SAN_5" ? "Sân 5 Mini" : "Sân 11 FIFA"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-[#006c49] font-mono font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-[#006c49]" />
                        <span>Elo Đội Tạo: {post.eloRating || 1200}</span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{post.teamName}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-bold">
                            Cap: {post.captainName}
                          </span>
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center space-x-1 text-slate-900 dark:text-white font-bold">
                            <MapPin className="w-4 h-4 text-[#006c49]" />
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
                          {(post.estimatedFee || 50000).toLocaleString('vi-VN')}đ <span className="text-xs font-normal text-slate-400">/người</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#006c49]">
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
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-emerald-800 dark:text-emerald-400">Đối thủ đã nhận: </span>
                          <strong className="text-slate-900 dark:text-white">{post.opponentTeamName}</strong> (Cap: {post.opponentCaptainName})
                        </div>
                        <span className="text-emerald-600 font-mono font-bold text-[11px]">Đã chốt kèo</span>
                      </div>
                    )}

                    {/* Action Bottom */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-mono text-sm font-bold">
                        <Clock className="w-4 h-4 text-[#006c49]" />
                        <span>{post.matchTime}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isMatched ? (
                          <span className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold">
                            Đã Đầy Đội
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setAcceptingPost(post);
                              setAcceptOpponentTeam(`FC ${userName}`);
                            }}
                            className="px-5 py-2.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
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
          {/* WIDGET 1: AI MATCH RADAR (98% MATCH) */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#006c49] text-white flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">AI Match Radar</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#acf847] text-[#102000] font-mono text-xs font-black">
                98% Match
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 flex items-center justify-between border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold">Hồ sơ của bạn</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{userName}</span>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="font-extrabold text-[#006c49]">{userTier}</div>
                <div className="text-slate-400 text-[10px]">Elo {userElo}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Khuyến nghị hoàn hảo tối nay:</span>
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-[#006c49]">
                <div className="flex items-center justify-between font-bold">
                  <span>Sân D-Sport Oasis (Sân 7A)</span>
                  <span className="font-mono">19:30 Tối nay</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  Trình độ tương đồng hoàn toàn với @TuanLe (Elo 1,450) và @QuocBao (Elo 1,420). Chỉ cách vị trí hiện tại của bạn 1.8km.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleJoinMatch("match-101", 45000)}
              className="w-full py-3 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Tham Gia Kèo Này Ngay (1-Click)</span>
            </button>
          </section>

          {/* WIDGET 2: ESCROW FAIRPLAY BALANCE */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#006c49]" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Ký Quỹ FairPlay™</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                Active
              </span>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-1 shadow-md">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Số dư ký quỹ bảo chứng</span>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-2xl font-black text-[#acf847]">
                  {userDepositBalance.toLocaleString("vi-VN")}đ
                </span>
                <span className="text-xs text-emerald-300 font-bold hover:underline cursor-pointer">
                  Nạp thêm →
                </span>
              </div>
              <p className="text-[11px] text-slate-300 pt-1">
                Bảo chứng không hủy kèo phút chót. Tự động hoàn lại sau khi quét mã QR vào sân.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Tỷ lệ uy tín thi đấu:</span>
                <span className="font-bold text-[#006c49] flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 fill-[#006c49] text-[#006c49]" />
                  <span>100% (5.0 / 5)</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-mono">
                <span>Số trận hoàn tất không vắng:</span>
                <span className="font-bold text-slate-900 dark:text-white">14/14 trận</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] flex items-start space-x-2">
                <Info className="w-4 h-4 text-[#006c49] shrink-0 mt-0.5" />
                <span>VĐV vắng mặt vô cớ sẽ chuyển toàn bộ tiền cọc làm bồi hoàn cho các thành viên còn lại.</span>
              </div>
            </div>
          </section>

          {/* WIDGET 3: LEADERBOARD BOARD OF HONOR */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Vinh Danh Ghép Kèo</h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">Tuần 42</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#acf847] text-[#102000] font-black text-xs flex items-center justify-center font-mono">
                    1
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Trần Quốc Nam</p>
                    <span className="text-[10px] text-slate-400">Ghép 18 trận • Thắng 15</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#006c49]">+45 Elo</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center font-mono">
                    2
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Lê Hoàng Yến</p>
                    <span className="text-[10px] text-slate-400">Ghép 14 trận • Chuỗi 8W</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#006c49]">+38 Elo</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center font-mono">
                    3
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Phạm Đăng Khoa</p>
                    <span className="text-[10px] text-slate-400">Ghép 12 trận • MVP Q.7</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#006c49]">+29 Elo</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* MODAL 1: TẠO KÈO GIAO LƯU BÓNG ĐÁ MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-modal-pop text-slate-900 dark:text-white my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                <PlusCircle className="w-5 h-5 text-[#006c49]" />
                Đăng Tin Tạo Kèo Giao Lưu Bóng Đá
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
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
                  placeholder="Ví dụ: Tìm đội Elo tương đương, đá giao lưu vui vẻ, fairplay không quạu."
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
                  className="px-5 py-2 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-extrabold flex items-center gap-1.5 shadow-md"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-modal-pop text-slate-900 dark:text-white my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                <Zap className="w-5 h-5 text-[#006c49]" />
                Xác Nhận Bắt Kèo Giao Lưu
              </h3>
              <button 
                onClick={() => setAcceptingPost(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs space-y-1">
              <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">
                Đối đầu: {acceptingPost.teamName} (Cap: {acceptingPost.captainName})
              </span>
              <div className="text-slate-600 dark:text-slate-400 flex justify-between">
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

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Trình độ Elo của bạn:</span>
                  <strong className="text-[#006c49] font-mono font-bold">{userElo} Elo</strong>
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
                  className="px-5 py-2 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-extrabold flex items-center gap-1.5 shadow-md"
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
