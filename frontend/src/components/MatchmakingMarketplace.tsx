"use client";

import React, { useEffect, useMemo, useState } from "react";
import { matchmakingAi } from "@/lib/aiService";
import { pitchTypeLabel } from "@/lib/pitchLabels";
import { buildVietQrUrl } from "@/lib/tournamentService";
import { getAllPitchesApi } from "@/lib/pitchService";
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
X,
} from "lucide-react";
import { API_BASE_URL, apiRequest, ensureLoggedIn, fetchWithTimeout } from '@/lib/api';
import { toastOk, toastErr } from "@/lib/toast";
import { submitTeamReview } from "@/lib/adminService";
import FormDots from "./FormDots";
import MatchmakingCard from "./MatchmakingCard";

interface MatchmakingMarketplaceProps {
 user?: any;
 onSelectMatch?: (match: any) => void;
 onCreateMatch?: () => void;
}

/**
 * Khối thanh toán tiền sân cho một kèo đã ghép.
 *
 * <p>Kèo "Chia đôi 50/50" thì mỗi đội chuyển một nửa tiền sân. Nếu cụm sân đã
 * khai báo tài khoản nhận tiền (STK) thì hệ thống sinh QR VietQR để quét chuyển
 * khoản; chưa khai báo thì chỉ hiện số tiền cùng hotline để liên hệ trực tiếp.</p>
 */
function KeoPaymentInfo({ post, pitch }: { post: any; pitch: any }) {
  const fee = Number(post?.estimatedFee ?? 50000);
  const rule =
    post?.paymentModel === "SPLIT_EQUAL"
      ? "Chia đôi tiền sân 50/50 giữa hai đội"
      : post?.paymentModel === "LOSER_PAYS"
      ? "Đội thua chịu toàn bộ tiền sân"
      : "Chủ kèo bao trọn tiền sân";

  const qr = pitch
    ? buildVietQrUrl({
        bankCode: pitch.bankCode,
        bankAccount: pitch.bankAccount,
        accountName: pitch.accountName,
        entryFee: fee,
        addInfo: `Kèo ${(post?.pitchName ?? "").slice(0, 18)}`.slice(0, 25),
      })
    : null;

  return (
    <div className="rounded-xl bg-white border border-sky-200 p-3 flex flex-col sm:flex-row gap-3">
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="font-black text-slate-900 text-[13px]">Thanh toán tiền sân</div>
        <p className="text-slate-600 text-[13px]">{rule}.</p>
        <p className="text-slate-900 font-black font-mono text-[15px]">
          {fee.toLocaleString("vi-VN")}đ
          <span className="font-normal text-slate-500 text-[13px]"> / người</span>
        </p>
        {qr ? (
          <div className="space-y-1">
            <img
              src={qr}
              alt={`QR chuyển khoản tiền sân ${fee.toLocaleString("vi-VN")}đ`}
              className="w-[132px] h-auto object-contain rounded-lg border border-slate-200 bg-white"
            />
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Quét mã để chuyển khoản. Nội dung chuyển khoản ghi tên kèo để chủ sân đối chiếu.
            </p>
          </div>
        ) : (
          <p className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
            Cụm sân chưa khai báo tài khoản nhận tiền — liên hệ trực tiếp chủ sân
            {pitch?.phone ? ` (hotline ${pitch.phone})` : ""} để thỏa thuận.
          </p>
        )}
      </div>
      {qr && (
        <div className="flex sm:flex-col items-center justify-center gap-1.5 text-[13px] text-slate-500 sm:w-[150px]">
          <span className="font-bold text-slate-700">Chuyển khoản VietQR</span>
          <span className="text-center leading-relaxed">
            {pitch?.accountName || "Tài khoản của cụm sân"}
            {pitch?.bankAccount ? ` · ${pitch.bankAccount}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}


export default function MatchmakingMarketplace({
 user,
 onSelectMatch,
 onCreateMatch
}: MatchmakingMarketplaceProps) {
  const [selectedSport, setSelectedSport] = useState("ALL");
 const [selectedLevel, setSelectedLevel] = useState("Tất cả");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("ALL");
 const [radiusKm, setRadiusKm] = useState(5);
  const [matchFormat, setMatchFormat] = useState("ALL");
  const [paymentModel, setPaymentModel] = useState("ALL");
 const [joinedMatches, setJoinedMatches] = useState<string[]>([]);
  // Danh sach cum san: dung de tra thong tin nhan tien (STK) khi sinh QR VietQR cho keo 50/50.
  const [pitches, setPitches] = useState<any[]>([]);

// Fair-play rating modal
const [reviewPost, setReviewPost] = useState<any>(null);
const [reviewStars, setReviewStars] = useState(5);
const [reviewOnTime, setReviewOnTime] = useState(true);
const [reviewFairPlay, setReviewFairPlay] = useState(true);
const [reviewSportsmanship, setReviewSportsmanship] = useState(true);
const [reviewComment, setReviewComment] = useState("");
const [reviewSubmitting, setReviewSubmitting] = useState(false);
 // Trên mobile: gom bộ lọc nâng cao vào nút thu gọn cho gọn màn hình
 const [showMobileFilters, setShowMobileFilters] = useState(false);

 // Dữ liệu kèo thật từ MySQL Backend
 const [posts, setPosts] = useState<any[]>([]);
  // Keo da ghep (MATCHED): van hien de cac doi thay thong tin va QR thanh toan tien san.
  const [matchedPosts, setMatchedPosts] = useState<any[]>([]);
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

 // Cac form (tao keo / xac nhan bat keo / danh gia fair-play) hien INLINE -> tu cuon toi.
 useEffect(() => {
  if (!showCreateModal && !acceptingPost && !reviewPost) return;
  const raf = requestAnimationFrame(() => {
   document.querySelector('[id^="mm-inline-"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  return () => cancelAnimationFrame(raf);
 }, [showCreateModal, acceptingPost, reviewPost]);
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
  // Bộ lọc: môn, khung giờ, hình thức tiền sân — trước đây các state này chỉ đổi UI
  // mà không hề được áp dụng vào danh sách kèo.
  if (selectedSport !== "ALL" && p.pitchType !== selectedSport) return false;
  if (paymentModel !== "ALL" && p.paymentModel !== paymentModel) return false;
  if (selectedTimeSlot === "TONIGHT") {
    const mt = String(p.matchTime ?? "");
    const hour = Number.parseInt(mt.split(":")[0] ?? "0", 10) || 0;
    // Tối nay: buổi tối hôm nay (không phải "mai").
    if (!/mai/i.test(mt) && hour < 17) return false;
  } else if (selectedTimeSlot === "TOMORROW") {
    if (!/mai/i.test(String(p.matchTime ?? ""))) return false;
  }
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
 const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/community/matchmaking-posts`);
 if (res.ok) {
 const data = await res.json();
 // Chỉ hiển thị kèo còn MỞ — kèo đã ghép (MATCHED) không nhận được nữa.
    const list = Array.isArray(data) ? data : [];
    setPosts(list.filter((p: any) => p.status === "OPEN"));
    setMatchedPosts(list.filter((p: any) => p.status === "MATCHED"));
    console.log("[DBG] fetchPosts len=" + list.length + " matched=" + list.filter((p: any) => p.status === "MATCHED").length + " statuses=" + JSON.stringify(list.map((p: any) => p.status)));
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

  // Tai danh sach cum san (de lay STK cua chu san cho QR).
  React.useEffect(() => {
    let alive = true;
    getAllPitchesApi()
      .then((list) => {
        if (alive) setPitches(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  /** Tra cum san theo ten trong bai dang keo (ten co the them/bot tien to "Cum San"). */
  const findPitchByName = (name?: string | null) => {
    const n = (name ?? '').trim().toLowerCase();
    if (!n) return null;
    const norm = (s: string) =>
      s.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9à-ỹ]+/g, ' ').replace(/\s+/g, ' ').trim();
    const target = norm(n);
    return (
      pitches.find((p) => norm(String(p.name)) === target) ||
      pitches.find((p) => norm(String(p.name)).includes(target)) ||
      pitches.find((p) => target.includes(norm(String(p.name)))) ||
      null
    );
  };

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
 toastOk("Đã đăng kèo thành công! Các đội khác sẽ thấy kèo của bạn ngay.");
 } catch (err: any) {
 toastErr(err?.message || "Lỗi kết nối máy chủ khi tạo kèo.");
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

 toastOk(data?.message || "Ghép kèo thành công!");
 setJoinedMatches([...joinedMatches, String(acceptingPost.id)]);
 setAcceptingPost(null);
 setAcceptOpponentTeam("");
 fetchPosts();
 } catch (err: any) {
 toastErr(err?.message || "Lỗi kết nối máy chủ khi nhận kèo.");
 } finally {
 setAccepting(false);
 }
 };

 return (
 <div className="w-full space-y-3 sm:space-y-6 pb-20 text-slate-900 animate-fade-in">
 {/* 1. SUB-HEADER & LIVE BREADCRUMB RIBBON */}
 <section className="w-full bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 {/* Breadcrumb + AI Matchmaking Indicator */}
 <div className="space-y-1.5">
 <div className="hidden sm:flex items-center space-x-1.5 text-[13px] text-slate-500">
 <span className="hover:text-[#0b4f6c] cursor-pointer">Trang chủ</span>
 <span>/</span>
 <span>Chợ Kèo Ghép Đội</span>
 <span>/</span>
 <span className="text-[#0b4f6c] font-bold">Sàn Ghép Cặp Tức Thì</span>
 </div>
 <div className="flex items-center space-x-2 pt-0.5">
 <span className="relative flex h-3 w-3">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#acf847] opacity-75" />
 <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0369a1]" />
 </span>
 <span className="font-mono text-[13px] font-bold text-slate-900 ">
 Ghép kèo theo phong độ thi đấu
 </span>
 <span className="text-slate-500">•</span>
 <span className="px-3 py-0.5 rounded-full bg-[#0369a1]/10 text-[#0b4f6c] font-bold text-[13px]">
 {onlineCaptains > 0
 ? `${onlineCaptains} đội đang mở kèo trên sàn`
 : "Chưa có kèo nào đang mở"}
 </span>
 </div>
 </div>

 {/* Action Bar Right */}
 <div className="flex items-center gap-2.5">
 <button className="hidden sm:flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[13px] transition-colors shadow-xs">
 <Filter className="w-4 h-4 shrink-0 text-[#0b4f6c] " />
 <span className="whitespace-nowrap">Bộ Lọc Kèo Quanh Tôi</span>
 </button>

 <button
 onClick={() => setShowCreateModal(true)}
 className="flex-1 sm:flex-none justify-center flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[13px] shadow-md transition-all active:scale-95"
 >
 <PlusCircle className="w-4 h-4 text-white" />
 <span className="sm:hidden">+ Tạo Kèo</span>
 <span className="hidden sm:inline">+ Tạo Kèo Giao Lưu Mới</span>
 </button>
 </div>
 </div>
 </section>

 {/* 2. FILTER CONSOLE & SPORTS SWITCHER */}
 <section className="w-full bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
 {/* Sport Tabs */}
 <div className="flex flex-wrap items-center gap-2">
  <button
  onClick={() => { setSelectedSport("ALL"); setMatchFormat("ALL"); }}
  className={`flex items-center space-x-2 px-3 sm:px-5 py-2 sm:py-3 rounded-2xl font-bold text-[13px] shrink-0 transition-all ${
  selectedSport === "ALL"
  ? "bg-[#0369a1] text-white shadow-md shadow-[#006c49]/20"
  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
  }`}
  >
  <span>🎯 Tất cả</span>
  <span className="px-2 py-0.5 rounded-full bg-slate-200 font-mono text-[13px] font-black">
  {posts.length} kèo
  </span>
  </button>

 <button
 onClick={() => { setSelectedSport("SAN_7"); setMatchFormat("SAN_7"); }}
 className={`flex items-center space-x-2 px-3 sm:px-5 py-2 sm:py-3 rounded-2xl font-bold text-[13px] shrink-0 transition-all ${
 selectedSport === "SAN_7"
 ? "bg-[#0369a1] text-white shadow-md shadow-[#006c49]/20"
 : "bg-slate-100 text-slate-700 hover:bg-slate-200"
 }`}
 >
 <span>⚽ Bóng Đá Sân 7</span>
 <span className="px-2 py-0.5 rounded-full bg-[#acf847] text-[#102000] font-mono text-[13px] font-black">
 {openKèoBySport.get("SAN_7") ?? 0} kèo mở
 </span>
 </button>

 <button
 onClick={() => { setSelectedSport("SAN_5"); setMatchFormat("SAN_5"); }}
 className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-[13px] shrink-0 transition-all ${
 selectedSport === "SAN_5"
 ? "bg-[#0369a1] text-white shadow-md shadow-[#006c49]/20"
 : "bg-slate-100 text-slate-700 hover:bg-slate-200"
 }`}
 >
 <span>👟 Sân 5 Cỏ Nhân Tạo</span>
 <span className="px-2 py-0.5 rounded-full bg-slate-200 font-mono text-[13px]">
 {openKèoBySport.get("SAN_5") ?? 0} kèo
 </span>
 </button>

 <button
 onClick={() => { setSelectedSport("SAN_11"); setMatchFormat("SAN_11"); }}
 className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-[13px] shrink-0 transition-all ${
 selectedSport === "SAN_11"
 ? "bg-[#0369a1] text-white shadow-md shadow-[#006c49]/20"
 : "bg-slate-100 text-slate-700 hover:bg-slate-200"
 }`}
 >
 <span>🏟️ Bóng Đá Sân 11 FIFA</span>
 <span className="px-2 py-0.5 rounded-full bg-slate-200 font-mono text-[13px]">
 {openKèoBySport.get("SAN_11") ?? 0} kèo
 </span>
 </button>

 <button
 onClick={() => { setSelectedSport("FUTSAL"); setMatchFormat("FUTSAL"); }}
 className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-[13px] shrink-0 transition-all ${
 selectedSport === "FUTSAL"
 ? "bg-[#0369a1] text-white shadow-md shadow-[#006c49]/20"
 : "bg-slate-100 text-slate-700 hover:bg-slate-200"
 }`}
 >
 <span>🥅 Futsal Trong Nhà</span>
 <span className="px-2 py-0.5 rounded-full bg-slate-200 font-mono text-[13px]">
 {openKèoBySport.get("FUTSAL") ?? 0} kèo
 </span>
 </button>
 </div>

 {/* Mobile: nút mở/đóng bộ lọc nâng cao */}
 <button
 type="button"
 onClick={() => setShowMobileFilters((v) => !v)}
 aria-expanded={showMobileFilters}
 className="md:hidden w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-left"
 >
 <span className="flex items-center gap-2 text-[13px] font-bold text-slate-800 ">
 <Filter className="w-4 h-4 text-[#0b4f6c] " />
 Bộ lọc kèo nâng cao
 </span>
 <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500">
 {showMobileFilters ? "Thu gọn" : "Mở rộng"}
 <ChevronDown className={`w-4 h-4 transition-transform ${showMobileFilters ? "rotate-180" : ""}`} />
 </span>
 </button>

 {/* Advanced Filter Metrics Bar (5 Cols Grid) */}
 <div className={`${showMobileFilters ? "grid" : "hidden"} md:grid bg-slate-50 rounded-2xl p-3 sm:p-4 border border-slate-200 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-center`}>
 {/* Level / Phong độ */}
 <div className="space-y-1">
 <div className="flex justify-between items-center text-[13px]">
 <span className="text-slate-500 font-extrabold text-[13px]">Lọc theo phong độ</span>
 <span className="text-[#0b4f6c] font-bold text-[13px]">
 {selectedLevel === "Tất cả" ? "Mọi trình độ" : selectedLevel}
 </span>
 </div>
 <div className="flex items-center space-x-1 pt-0.5">
 {["Tất cả", "Có lịch sử", "Phong độ cao", "Tân binh"].map((lvl) => (
 <button
 key={lvl}
 onClick={() => setSelectedLevel(lvl)}
 className={`flex-1 py-1.5 px-2 rounded-xl text-[13px] font-mono font-bold transition-all ${
 selectedLevel === lvl
 ? "bg-[#0369a1] text-white shadow-xs"
 : "bg-white text-slate-700 hover:bg-slate-200"
 }`}
 >
 {lvl}
 </button>
 ))}
 </div>
 </div>

 {/* Time Slot */}
 <div className="space-y-1">
 <span className="text-slate-500 font-extrabold text-[13px] block">Khung giờ</span>
 <div className="flex items-center space-x-1 pt-0.5">
  <button
  onClick={() => setSelectedTimeSlot("ALL")}
  className={`flex-1 py-1.5 px-2 rounded-xl text-[13px] font-bold transition-all ${
  selectedTimeSlot === "ALL"
  ? "bg-slate-900 text-white "
  : "bg-white text-slate-700 "
  }`}
  >
  Tất cả
  </button>

 <button
 onClick={() => setSelectedTimeSlot("TONIGHT")}
 className={`flex-1 py-1.5 px-2 rounded-xl text-[13px] font-bold transition-all ${
 selectedTimeSlot === "TONIGHT"
 ? "bg-slate-900 text-white "
 : "bg-white text-slate-700 "
 }`}
 >
 Tối nay (18:30-22h)
 </button>
 <button
 onClick={() => setSelectedTimeSlot("TOMORROW")}
 className={`flex-1 py-1.5 px-2 rounded-xl text-[13px] font-bold transition-all ${
 selectedTimeSlot === "TOMORROW"
 ? "bg-slate-900 text-white "
 : "bg-white text-slate-700 "
 }`}
 >
 Ngày mai
 </button>
 </div>
 </div>

 {/* Radius Filter */}
 <div className="space-y-1">
 <div className="flex justify-between items-center text-[13px]">
 <span className="text-slate-500 font-extrabold text-[13px]">Bán kính</span>
 <span className="text-slate-600 font-bold text-[13px]">&lt; {radiusKm}km (Hải Châu, Cẩm Lệ)</span>
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
 <span className="text-slate-500 font-extrabold text-[13px] block">Thể thức thi đấu</span>
 <select
 aria-label="Thể thức thi đấu"
 value={matchFormat}
 onChange={(e) => {
    setMatchFormat(e.target.value);
    setMatchFormat(e.target.value);
    setSelectedSport(e.target.value === "ALL" ? "ALL" : e.target.value);
  }}
 className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none"
 >
  <option value="ALL">Tất cả môn</option>
 <option value="SAN_7">Kèo Bóng Đá Sân 7</option>
 <option value="SAN_5">Kèo Futsal / Sân 5 Người</option>
 <option value="SAN_11">Kèo Sân 11 Chuẩn VFF</option>
 <option value="SOLO_SLOT">Ghép Người Lẻ / Tuyển Thủ Môn</option>
 </select>
 </div>

 {/* Payment Model */}
 <div className="space-y-1">
 <span className="text-slate-500 font-extrabold text-[13px] block">Hình thức tiền sân</span>
 <select
 aria-label="Hình thức tiền sân"
 value={paymentModel}
 onChange={(e) => setPaymentModel(e.target.value)}
 className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none"
 >
  <option value="ALL">Tất cả</option>
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
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex flex-wrap items-center gap-2">
 <h2 className="text-xl font-black text-slate-900 shrink-0">
  Kèo Đang Mở Đăng Ký ({visiblePosts.length})
 </h2>
 <span className="px-3 py-1 rounded-full bg-[#acf847] text-[#102000] font-mono text-[13px] font-extrabold whitespace-nowrap">
 {matchableCount}/{openKèoCount} kèo cùng tầm
 </span>
  {visiblePosts.length < openKèoCount && (
  <span className="text-[13px] font-semibold text-slate-500">
  ({openKèoCount - visiblePosts.length} kèo bị bộ lọc ẩn)
  </span>
  )}
 </div>
 <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 shrink-0 whitespace-nowrap">
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
 <p className="text-[13px] text-amber-600 font-semibold">
 AI service chưa phản hồi — đang xếp tạm theo độ tương đồng phong độ với đội của bạn.
 </p>
 )}

 {/* MATCH LISTINGS FROM REAL MYSQL BACKEND */}
 <div className="space-y-4">
 {loadingPosts ? (
 <div className="p-5 sm:p-8 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-200 ">
 <RefreshCw className="w-6 h-6 animate-spin text-[#0b4f6c] mx-auto mb-2" />
 <p className="text-[13px] text-slate-500 font-bold">Đang tải danh sách các kèo giao lưu thật từ hệ thống...</p>
 </div>
 ) : posts.length === 0 ? (
 <div className="p-5 sm:p-8 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3">
 <p className="text-sm text-slate-500 font-semibold">Chưa có kèo nào đang mở. Hãy là người đầu tiên tạo kèo!</p>
 <button
 onClick={() => setShowCreateModal(true)}
 className="px-5 py-2.5 rounded-2xl bg-[#0369a1] text-white text-[13px] font-bold"
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
 className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md hover:shadow-xl transition-all space-y-4"
 >
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center space-x-2">
 <span className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-extrabold text-[13px] border ${
 isMatched 
 ? "bg-slate-100 text-slate-500 border-slate-200 " 
 : "bg-rose-500/10 text-rose-700 border-rose-500/30"
 }`}>
 <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
 <span>{isMatched ? "Đã có đối thủ" : "Kèo đang mở"}</span>
 </span>
 <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[13px]">
  {post.pitchType === "SAN_7" ? "Sân 7 Cỏ Nhân Tạo" : post.pitchType === "SAN_5" ? "Sân 5 Mini" : post.pitchType === "FUTSAL" ? "Futsal Trong Nhà" : "Sân 11 FIFA"}
 </span>
 {isAiTop && (
 <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-black text-[13px] flex items-center gap-1">
 <Sparkles className="w-3.5 h-3.5" />
 <span>{aiOffline ? "Hợp phong độ nhất" : "AI đề xuất"}</span>
 </span>
 )}


 </div>
 <div className="flex items-center space-x-1.5 text-[#0b4f6c] font-mono font-bold text-[13px]">
 <ShieldCheck className="w-4 h-4 text-[#0b4f6c] " />
 <FormDots form={post.form} size="sm" />
 <span className="text-slate-500 font-sans font-bold">
 {post.record && post.record !== "0-0-0" ? `${post.record} • ` : ""}Thắng {post.winRate ?? 50}%
 </span>
 </div>
 </div>

 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
 <div className="space-y-1">
 <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
 <span>{post.teamName}</span>
 <span className="text-[13px] px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-bold">
 Cap: {post.captainName}
 </span>
 </h3>
 <div className="flex items-center space-x-2 text-[13px] text-slate-500">
 <span className="flex items-center space-x-1 text-slate-900 font-bold">
 <MapPin className="w-4 h-4 text-[#0b4f6c] " />
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

 <div className="flex flex-col md:items-end bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl">
 <div className="text-xl font-black text-slate-900 font-mono">
 {(post.estimatedFee || 50000).toLocaleString('vi-VN')}đ <span className="text-[13px] font-normal text-slate-500">/người</span>
 </div>
 <span className="text-[13px] font-bold text-[#0b4f6c] ">
 {post.paymentModel === "SPLIT_EQUAL" ? "Chia đôi tiền sân (50/50)" : post.paymentModel === "LOSER_PAYS" ? "Đội thua trả tiền sân" : "Chủ kèo bao trọn"}
 </span>
 </div>
 </div>

 {/* Note / Lời nhắn của đội */}
 {post.note && (
 <div className="p-3 bg-slate-50 rounded-xl text-[13px] text-slate-700 border border-slate-200/60 ">
 <span className="font-bold text-slate-500 mr-1">Ghi chú:</span>
 <span>{post.note}</span>
 </div>
 )}

 {/* Opponent matched info if any */}
  {isMatched && (
  <div className="p-3 bg-sky-50 border border-[#0369a1]/30 rounded-xl text-[13px] space-y-2.5">
  <div className="flex flex-wrap items-center justify-between gap-2">
  <div>
  <span className="font-bold text-sky-900 ">Đối thủ đã nhận: </span>
  <strong className="text-slate-900 ">{post.opponentTeamName}</strong> (Cap: {post.opponentCaptainName})
  </div>
  <span className="text-sky-700 font-mono font-bold text-[13px]">Đã chốt kèo</span>
  </div>
  <KeoPaymentInfo post={post} pitch={findPitchByName(post.pitchName)} />
  </div>
  )}

 {/* Action Bottom */}
 <div className="flex items-center justify-between pt-2 border-t border-slate-100 ">
 <div className="flex items-center space-x-2 text-slate-900 font-mono text-sm font-bold">
 <Clock className="w-4 h-4 text-[#0b4f6c] " />
 <span>{post.matchTime}</span>
 </div>

 <div className="flex items-center space-x-2">
 {isMatched ? (
  <>
  <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-[13px] font-bold">
  Đã Đầy Đội
  </span>
  <button
  type="button"
  onClick={() => {
    setReviewPost(post);
    setReviewStars(5);
    setReviewOnTime(true);
    setReviewFairPlay(true);
    setReviewSportsmanship(true);
    setReviewComment("");
  }}
  className="px-3 py-2 rounded-xl bg-[#0369a1]/10 hover:bg-[#0369a1]/20 text-[#0369a1] text-[13px] font-bold transition-all flex items-center gap-1.5 border border-[#0369a1]/30"
  >
  <Star className="w-3.5 h-3.5" />
  <span>Đánh giá Fair-play</span>
  </button>
  </>
 ) : (
 <button
 onClick={() => {
 setAcceptingPost(post);
 setAcceptOpponentTeam(`FC ${userName}`);
 }}
 className="px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[13px] shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
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

{/* KÈO ĐÃ GHÉP — giữ lại để các đội thấy thông tin đối thủ và QR thanh toán tiền sân */}
{matchedPosts.length > 0 && (
  <section className="w-full bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3">
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        Kèo Đã Ghép ({matchedPosts.length})
      </h3>
      <span className="text-[13px] text-slate-500">Xem đối thủ, quy tắc và QR thanh toán tiền sân</span>
    </div>

    <div className="space-y-2.5">
      {matchedPosts.map((post: any) => (
        <div
          key={post.id}
          className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-black text-slate-900 truncate">
                {post.teamName}
                <span className="font-normal text-slate-500 text-[13px]"> vs </span>
                <span className="text-[#0b4f6c]">{post.opponentTeamName || "Đã ghép"}</span>
              </p>
              <p className="text-[13px] text-slate-500 truncate">
                {post.pitchName} • {post.matchTime}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-[13px] shrink-0">
              Đã chốt kèo
            </span>
          </div>
          <KeoPaymentInfo post={post} pitch={findPitchByName(post.pitchName)} />
          <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setReviewPost(post);
              setReviewStars(5);
              setReviewOnTime(true);
              setReviewFairPlay(true);
              setReviewSportsmanship(true);
              setReviewComment("");
            }}
            className="px-3 py-2 rounded-xl bg-[#0369a1]/10 hover:bg-[#0369a1]/20 text-[#0369a1] text-[13px] font-bold transition-all flex items-center gap-1.5 border border-[#0369a1]/30"
          >
            <Star className="w-3.5 h-3.5" />
            <span>Đánh giá Fair-play</span>
          </button>
          </div>
        </div>
      ))}
    </div>
  </section>
)}
 </div>
 </main>

 {/* RIGHT COLUMN: AI MATCH RADAR & ESCROW FAIRPLAY (32% WIDTH / 4 COLS) */}
 <aside className="lg:col-span-4 space-y-5">
 {/* WIDGET 1: GỢI Ý GHÉP KÈO (đọc từ bảng matchmaking_posts) */}
 <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-4 relative overflow-hidden">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <div className="w-8 h-8 rounded-xl bg-[#0369a1] text-white flex items-center justify-center font-bold">
 <Activity className="w-4 h-4 text-white" />
 </div>
 <h3 className="font-black text-sm text-slate-900 ">Kèo Gợi Ý Cho Bạn</h3>
 </div>
 <span className="px-2.5 py-0.5 rounded-full bg-[#acf847] text-[#102000] font-mono text-[13px] font-black">
 {matchableCount}/{openKèoCount} cùng tầm
 </span>
 </div>

 <div className="bg-slate-50 rounded-2xl p-3.5 flex items-center justify-between border border-slate-200 ">
 <div className="flex flex-col">
 <span className="text-[13px] text-slate-500 font-extrabold">Hồ sơ của bạn</span>
 <span className="font-bold text-sm text-slate-900 ">{userName}</span>
 </div>
 <div className="text-right font-mono text-[13px]">
 <div className="font-extrabold text-[#0b4f6c] ">{userTier}</div>
 <div className="text-slate-500 text-[13px]">
 {myTeamPost ? `Phong độ: ${myTeamPost.record ?? myTeamPost.form ?? "—"}` : "Chưa đăng kèo"}
 </div>
 </div>
 </div>

 <div className="space-y-2 text-[13px]">
 <span className="text-[13px] font-extrabold text-slate-500 block">
 Kèo đang mở trong CSDL:
 </span>
 {loadingPosts ? (
 <p className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500">
 Đang tải kèo…
 </p>
 ) : !recommendedPost ? (
 <p className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 leading-relaxed">
 Chưa có kèo nào đang mở. Bấm “+ Tạo Kèo” để đăng ký đội của bạn lên sàn.
 </p>
 ) : (
 <div className="p-3.5 rounded-2xl bg-[#0369a1]/10 border border-[#0369a1]/20 space-y-1 text-[#0b4f6c] ">
 <div className="flex items-center justify-between font-bold">
 <span className="truncate pr-2">{recommendedPost.pitchName ?? "Chưa chọn sân"}</span>
 <span className="font-mono shrink-0">{recommendedPost.matchTime ?? "—"}</span>
 </div>
 <p className="text-slate-600 text-[13px] leading-relaxed">
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
 className="w-full py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[13px] shadow-md transition-all flex items-center justify-center space-x-1.5 active:scale-95"
 >
 <Zap className="w-4 h-4 text-white" />
 <span>Xem Chi Tiết &amp; Nhận Kèo</span>
 </button>
 )}
 </section>

 {/* WIDGET 2: HỒ SƠ CẦU THỦ + SỐ LIỆU SÀN (lấy từ CSDL) */}
 <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <ShieldCheck className="w-5 h-5 text-[#0b4f6c] " />
 <h3 className="font-black text-sm text-slate-900 ">Hồ Sơ Cầu Thủ</h3>
 </div>
 <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[13px] font-bold">
 {user?.email ? "Đã đăng nhập" : "Khách"}
 </span>
 </div>

 <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-1 shadow-md">
  <span className="text-[13px] text-slate-300 font-extrabold block">Phong độ đội của bạn</span>
 <div className="flex items-baseline justify-between font-mono">
  <FormDots form={myForm} emptyClassName="text-[13px] font-bold text-slate-300" />
 <span className="text-[13px] text-slate-300 font-bold">
 {myTeamPost
 ? `${myTeamPost.record ?? "0-0-0"} • Thắng ${myWinRate}%`
 : user?.level ?? "Chưa xếp bậc"}
 </span>
 </div>
 <p className="text-[13px] text-slate-300 pt-1">
 {userName ? `${userName} • ${user?.position ?? "Cầu thủ"} • ${user?.area ?? "Chưa cập nhật khu vực"}` : "Đăng nhập để BTC và đội khác thấy hồ sơ của bạn."}
 </p>
 </div>

 <div className="space-y-2 text-[13px]">
 <div className="flex justify-between items-center text-slate-600 ">
 <span>Kèo đang mở trên sàn:</span>
 <span className="font-bold text-[#0b4f6c] font-mono">{openKèoCount} kèo</span>
 </div>
 <div className="flex justify-between items-center text-slate-600 ">
 <span>Số đội đang chờ ghép:</span>
 <span className="font-bold text-slate-900 font-mono">{onlineCaptains} đội</span>
 </div>
 <div className="flex justify-between items-center text-slate-600 ">
 <span>Kèo hợp trình độ của bạn:</span>
 <span className="font-bold text-slate-900 font-mono">
 {matchableCount}/{openKèoCount}
 </span>
 </div>
 <div className="p-3 rounded-xl bg-slate-50 text-slate-500 text-[13px] flex items-start space-x-2">
 <Info className="w-4 h-4 text-[#0b4f6c] shrink-0 mt-0.5" />
 <span>
 Tên đội, trình độ và số liệu trên đều đọc trực tiếp từ CSDL — có kèo mới là danh sách tự cập nhật.
 </span>
 </div>
 </div>
 </section>

 {/* WIDGET 3: TOP ĐỘI ĐANG MỞ KÈO (nhiều kèo + phong độ cao) */}
 <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <Trophy className="w-5 h-5 text-amber-700" />
 <h3 className="font-black text-sm text-slate-900 ">Đội Mở Kèo Nhiều Nhất</h3>
 </div>
 <span className="text-[13px] text-slate-500 font-semibold">{openKèoCount} kèo trong CSDL</span>
 </div>

 {topTeams.length === 0 ? (
 <p className="text-[13px] text-slate-500 py-4 text-center">
 Chưa có kèo nào. Bấm “+ Tạo Kèo Giao Lưu Mới” để mở kèo đầu tiên.
 </p>
 ) : (
 <div className="space-y-2 text-[13px]">
 {topTeams.map((t, i) => (
 <div
 key={t.teamName}
 className={`flex items-center justify-between p-2.5 rounded-xl ${
 i === 0
 ? "bg-slate-50 "
 : "bg-white border border-slate-100 "
 }`}
 >
 <div className="flex items-center space-x-2.5 min-w-0">
 <span
 className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-black text-[13px] shrink-0 ${
 i === 0
 ? "bg-[#acf847] text-[#102000]"
 : "bg-slate-200 text-slate-900 font-bold"
 }`}
 >
 {i + 1}
 </span>
 <div className="min-w-0">
 <p className="font-bold text-slate-900 truncate">{t.teamName}</p>
 <span className="text-[13px] text-slate-500">
  {t.count} kèo đang mở • {pitchTypeLabel(t.pitchType) || "Sân 7"}
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
 <div id="mm-inline-create" className="w-full animate-fade-in">
 <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-sm text-slate-900">
 <div className="flex items-center justify-between border-b border-slate-200 pb-3">
 <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-900 ">
 <PlusCircle className="w-5 h-5 text-[#0b4f6c] " />
 Đăng Tin Tạo Kèo Giao Lưu Bóng Đá
 </h3>
 <button 
 onClick={() => setShowCreateModal(false)}
 className="text-slate-500 hover:text-slate-700 "
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleCreatePost} className="space-y-3.5 text-[13px]">
 <div>
 <label className="block font-bold mb-1 text-slate-700 ">Tên Đội Bóng Của Bạn (FC)</label>
 <input 
 type="text" 
 required 
 value={createTeamName}
 onChange={(e) => setCreateTeamName(e.target.value)}
 placeholder="Ví dụ: FC Phù Đổng Hải Châu"
 className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006c49]"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block font-bold mb-1 text-slate-700 ">Thể Thức Sân</label>
 <select 
 aria-label="Thể thức sân"
 value={createPitchType}
 onChange={(e) => setCreatePitchType(e.target.value)}
 className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
 >
 <option value="SAN_7">⚽ Sân 7 Cỏ Nhân Tạo</option>
 <option value="SAN_5">👟 Sân 5 Mini</option>
 <option value="SAN_11">🏟️ Sân 11 FIFA</option>
 </select>
 </div>
 <div>
 <label className="block font-bold mb-1 text-slate-700 ">Thời Gian Đá</label>
 <input 
 type="text" 
 required 
 value={createMatchTime}
 onChange={(e) => setCreateMatchTime(e.target.value)}
 placeholder="Ví dụ: 20:00 Tối nay"
 className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006c49]"
 />
 </div>
 </div>

 <div>
 <label className="block font-bold mb-1 text-slate-700 ">Cụm Sân Thi Đấu</label>
 <input 
 type="text" 
 required 
 value={createPitchName}
 onChange={(e) => setCreatePitchName(e.target.value)}
 placeholder="Ví dụ: Sân Bóng Đá Đại Nắng (Sân 7A)"
 className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006c49]"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block font-bold mb-1 text-slate-700 ">Hình Thức Tiền Sân</label>
 <select 
 aria-label="Hình thức tiền sân"
 value={createPaymentModel}
 onChange={(e) => setCreatePaymentModel(e.target.value)}
 className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
 >
 <option value="SPLIT_EQUAL">Chia Đôi 50/50</option>
 <option value="LOSER_PAYS">Đội Thua Trả 100%</option>
 <option value="HOST_COVER">Chủ Kèo Bao Sân</option>
 </select>
 </div>
 <div>
 <label className="block font-bold mb-1 text-slate-700 ">Dự Kiến / Người (VNĐ)</label>
 <input 
 type="number" 
 step={5000}
 value={createFee}
 onChange={(e) => setCreateFee(Number(e.target.value))}
 className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006c49]"
 />
 </div>
 </div>

 <div>
 <label className="block font-bold mb-1 text-slate-700 ">Lời Nhắn Tìm Đối / Yêu Cầu</label>
 <textarea 
 rows={2}
 value={createNote}
 onChange={(e) => setCreateNote(e.target.value)}
 placeholder="Ví dụ: Tìm đội phong độ tương đương, đá giao lưu vui vẻ, fairplay không quạu."
 className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006c49]"
 />
 </div>

 <div className="pt-2 flex justify-end gap-2.5">
 <button 
 type="button"
 onClick={() => setShowCreateModal(false)}
 className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
 >
 Hủy
 </button>
 <button 
 type="submit"
 disabled={creating}
 className="px-5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold flex items-center gap-1.5 shadow-md"
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
 <div id="mm-inline-accept" className="w-full animate-fade-in">
 <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-sm text-slate-900">
 <div className="flex items-center justify-between border-b border-slate-200 pb-3">
 <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-900 ">
 <Zap className="w-5 h-5 text-[#0b4f6c] " />
 Xác Nhận Bắt Kèo Giao Lưu
 </h3>
 <button 
 onClick={() => setAcceptingPost(null)}
 className="text-slate-500 hover:text-slate-700 "
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-3 bg-sky-50 border border-[#0369a1]/30 rounded-2xl text-[13px] space-y-1">
 <span className="font-extrabold text-sky-900 block">
 Đối đầu: {acceptingPost.teamName} (Cap: {acceptingPost.captainName})
 </span>
 <div className="text-slate-600 flex justify-between">
 <span>Khung giờ & Sân:</span>
 <strong className="text-slate-900 ">{acceptingPost.matchTime} • {acceptingPost.pitchName}</strong>
 </div>
 </div>

 <form onSubmit={handleAcceptPost} className="space-y-3.5 text-[13px]">
 <div>
 <label className="block font-bold mb-1 text-slate-700 ">Tên Đội Của Bạn (FC Thách Đấu)</label>
 <input 
 type="text" 
 required 
 value={acceptOpponentTeam}
 onChange={(e) => setAcceptOpponentTeam(e.target.value)}
 placeholder="Ví dụ: FC Đại Nắng United"
 className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006c49]"
 />
 </div>

 <div>
 <label className="block font-bold mb-1 text-slate-700 ">Số Điện Thoại Đội Trưởng Nhận Kèo</label>
 <input 
 type="tel" 
 required 
 value={acceptOpponentPhone}
 onChange={(e) => setAcceptOpponentPhone(e.target.value)}
 placeholder="09xx..."
 className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#006c49]"
 />
 </div>

 <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[13px] text-slate-600 space-y-1">
 <div className="flex justify-between">
 <span>Phong độ đội bạn:</span>
 <strong className="text-[#0b4f6c] font-mono font-bold">
 {myTeamPost ? `${myTeamPost.record ?? "0-0-0"} • Thắng ${myWinRate}%` : "Tân binh"}
 </strong>
 </div>
 <div className="flex justify-between">
 <span>Cam kết tinh thần:</span>
 <span className="font-bold text-slate-800 ">Fairplay & Đúng Giờ</span>
 </div>
 </div>

 <div className="pt-2 flex justify-end gap-2.5">
 <button 
 type="button"
 onClick={() => setAcceptingPost(null)}
 className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
 >
 Hủy
 </button>
 <button 
 type="submit"
 disabled={accepting}
 className="px-5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold flex items-center gap-1.5 shadow-md"
 >
 {accepting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
 <span>{accepting ? "Đang chốt..." : "Chốt Kèo Giao Lưu"}</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
  {/* Fair-play rating modal */}
  {reviewPost && (
  <div id="mm-inline-review" className="w-full animate-fade-in">
  <div className="bg-white max-w-md w-full rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-4 border border-slate-200 shadow-sm">
  <div className="flex items-center justify-between">
  <h3 className="font-black text-slate-900 text-base">Đánh giá Fair-play</h3>
  <button type="button" onClick={() => setReviewPost(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors" aria-label="Đóng">✕</button>
  </div>
  <p className="text-[13px] text-slate-500">
  Đánh giá đội <strong className="text-slate-900">{reviewPost.opponentTeamName || reviewPost.teamName}</strong> sau trận giao hữu.
  </p>
  <div className="flex items-center gap-1.5">
  {[1,2,3,4,5].map((s) => (
  <button key={s} type="button" onClick={() => setReviewStars(s)} className="p-1 transition-transform hover:scale-110 active:scale-95" aria-label={s + " sao"}>
  <Star className={`w-7 h-7 ${s <= reviewStars ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
  </button>
  ))}
  <span className="ml-2 text-sm font-black text-slate-900">{reviewStars}/5</span>
  </div>
  <div className="space-y-2">
  <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 cursor-pointer">
  <input type="checkbox" checked={reviewOnTime} onChange={(e) => setReviewOnTime(e.target.checked)} className="w-4 h-4 accent-[#0369a1]" />
  Đúng giờ (không trễ)
  </label>
  <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 cursor-pointer">
  <input type="checkbox" checked={reviewFairPlay} onChange={(e) => setReviewFairPlay(e.target.checked)} className="w-4 h-4 accent-[#0369a1]" />
  Sòng phẳng (chia tiền đúng thỏa thuận)
  </label>
  <label className="flex items-center gap-2 text-[13px] font-bold text-slate-700 cursor-pointer">
  <input type="checkbox" checked={reviewSportsmanship} onChange={(e) => setReviewSportsmanship(e.target.checked)} className="w-4 h-4 accent-[#0369a1]" />
  Tinh thần thể thao (không chơi xấu)
  </label>
  </div>
  <textarea
  value={reviewComment}
  onChange={(e) => setReviewComment(e.target.value)}
  placeholder="Nhận xét (tuỳ chọn)..."
  maxLength={300}
  rows={3}
  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0369a1] resize-none"
  />
  <div className="flex justify-end gap-2.5">
  <button type="button" onClick={() => setReviewPost(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold transition-all">Hủy</button>
  <button
  type="button"
  disabled={reviewSubmitting}
  onClick={async () => {
    try {
      setReviewSubmitting(true);
      const reviewed = reviewPost.opponentTeamName || reviewPost.teamName;
      const reviewer = reviewPost.teamName === reviewed ? reviewPost.opponentTeamName : reviewPost.teamName;
      await submitTeamReview({
        reviewedTeamName: reviewed,
        reviewerTeamName: reviewer,
        matchmakingPostId: reviewPost.id,
        stars: reviewStars,
        onTime: reviewOnTime,
        fairPlay: reviewFairPlay,
        sportsmanship: reviewSportsmanship,
        comment: reviewComment.trim() || undefined,
      });
      toastOk("Đã gửi đánh giá Fair-play!");
      setReviewPost(null);
    } catch (err: any) {
      toastErr(err?.message || "Không gửi được đánh giá.");
    } finally {
      setReviewSubmitting(false);
    }
  }}
  className="px-5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black transition-all active:scale-95 disabled:opacity-50"
  >
  {reviewSubmitting ? "Đang gửi…" : "Gửi đánh giá"}
  </button>
  </div>
  </div>
  </div>
  )}
 </div>
 );
}
