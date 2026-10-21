"use client";

import React, { useState, useEffect, useMemo } from "react";
import SafeImage from "@/components/SafeImage";
import {
 Sparkles,
 MapPin,
 Clock,
 DollarSign,
 Star,
 CheckCircle2,
 ChevronRight,
 ShieldCheck,
 ShieldAlert,
 Zap,
 Gift,
 QrCode,
 Users,
 Trophy,
 Activity,
 Award,
 Calendar,
 Flame,
 Filter,
 Check,
 ChevronDown,
 Layers,
 ArrowRight,
 SlidersHorizontal,
 Search,
 Lock,
 Timer,
 Loader2,
 PhoneCall,
 RefreshCw,
 Compass,
 Share2,
 X,
 PlusCircle,
 ThumbsUp,
 Camera,
 Navigation
} from "lucide-react";

import PitchDetail from "./PitchDetail";
import { getAllPitchesApi } from "@/lib/pitchService";
import { pitchTypeLabel } from "@/lib/pitchLabels";
import { API_BASE_URL, apiRequest, ensureLoggedIn, fetchWithTimeout } from '@/lib/api';
import { todayLocal } from "@/lib/dateUtils";
import { fetchTournaments } from "@/lib/tournamentService";
import { recommendPitches, type AiPitchCluster } from "@/lib/aiService";
import { subscribeToBookingEvents } from "@/lib/realtimeService";

interface PitchSearchProps {
 user?: any;
}

export default function PitchSearch({ user }: PitchSearchProps) {
 // Bộ lọc chính
 const [selectedSport, setSelectedSport] = useState("ALL");
 const [selectedDistrict, setSelectedDistrict] = useState("ALL");
 const [selectedTimeSlotFilter, setSelectedTimeSlotFilter] = useState("ALL");
 const [selectedPitchFormat, setSelectedPitchFormat] = useState("ALL");
 const [maxBudget, setMaxBudget] = useState(650000);
 const [onlyAvailableTonight, setOnlyAvailableTonight] = useState(false);
 // Trên mobile: bộ lọc được thu gọn để giao diện tối giản
 const [showMobileFilters, setShowMobileFilters] = useState(false);
 // Đếm số bộ lọc đang bật (hiển thị badge trên mobile)
 const activeFilterCount =
 (selectedSport !== "ALL" ? 1 : 0) +
 (selectedDistrict !== "ALL" ? 1 : 0) +
 (selectedTimeSlotFilter !== "ALL" ? 1 : 0) +
 (selectedPitchFormat !== "ALL" ? 1 : 0) +
 (maxBudget < 650000 ? 1 : 0) +
 (onlyAvailableTonight ? 1 : 0);

 // Điều hướng & Modal
 const [selectedPitchForSlot, setSelectedPitchForSlot] = useState<any>(null);
 const [toastMsg, setToastMsg] = useState<string | null>(null);

 // Kèo ghép & tương tác
 const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);

 // Form tao keo moi hien INLINE -> tu cuon toi.
 useEffect(() => {
  if (!showCreateMatchModal) return;
  const raf = requestAnimationFrame(() => {
   document.getElementById("ps-inline-create-match")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  return () => cancelAnimationFrame(raf);
 }, [showCreateMatchModal]);
 const [newMatchTitle, setNewMatchTitle] = useState("");
 const [newMatchSlot, setNewMatchSlot] = useState("19:00 - 21:00");
 const [newMatchPitchId, setNewMatchPitchId] = useState("");
 const [newMatchNeed, setNewMatchNeed] = useState("");
 const [showQrModal, setShowQrModal] = useState(false);

 // Danh sách sân thật từ Backend
 const [realPitches, setRealPitches] = useState<any[]>([]);
 const [loadingRealPitches, setLoadingRealPitches] = useState(false);

 const showToast = (msg: string) => {
 setToastMsg(msg);
 setTimeout(() => setToastMsg(null), 3500);
 };

 useEffect(() => {
 fetchPitches();

 // Lắng nghe sự kiện Realtime (chủ sân duyệt đơn hoặc cập nhật giờ hoạt động)
 const unsubscribe = subscribeToBookingEvents((event) => {
 fetchPitches();
 });

 return () => unsubscribe();
 }, []);

 const [featuredLiveSlots, setFeaturedLiveSlots] = useState<any[]>([]);
 // Lỗi tải danh sách sân (VD: backend không phản hồi) — hiển thị thông báo thân thiện
 const [pitchLoadError, setPitchLoadError] = useState<string | null>(null);

 const fetchPitches = async () => {
 setLoadingRealPitches(true);
 setPitchLoadError(null);
 try {
 const data = await getAllPitchesApi();
 if (Array.isArray(data) && data.length > 0) {
 const mapped = data.map((item: any, idx: number) => {
 const rawId = item.id ? item.id.toString().replace(/\D/g, "") : (idx + 1).toString();
 const basePrice = item.avgPricePerHour || item.pricePerHour || 350000;
 const peakPrice = item.peakPricePerHour || Math.round(basePrice * 1.3);
 const openTime = item.openTime || "14:00";
 const closeTime = item.closeTime || "22:30";
 const slotDur = item.slotDurationMinutes || 120;

 // Địa chỉ thật từ CSDL — không có thì để trống, không bịa địa chỉ
 const address = item.address || item.area || "Chưa khai báo địa chỉ";
 const pitchName = item.name || "Cụm sân chưa đặt tên";

 // Sinh khung giờ 2 tiếng chuẩn theo openTime và closeTime thật của sân
 const startH = parseInt(openTime.split(":")[0]) || 14;
 const endH = parseInt(closeTime.split(":")[0]) || 22;
 const dynamicSlots: any[] = [];
 for (let h = startH; h + 2 <= endH; h += 2) {
 const isPeak = h >= 16 && h < 20;
 dynamicSlots.push({
 time: `${String(h).padStart(2, '0')}:00 - ${String(h + 2).padStart(2, '0')}:00`,
 price: `${Math.round((isPeak ? peakPrice : basePrice) / 1000)}k`,
 status: "AVAILABLE",
 tag: isPeak ? "⭐ Ca Vàng" : "Ca Thường"
 });
 }
 if (dynamicSlots.length === 0) {
 dynamicSlots.push(
 { time: "14:00 - 16:00", price: `${Math.round(basePrice / 1000)}k`, status: "AVAILABLE", tag: "Chiều Sớm" },
 { time: "16:00 - 18:00", price: `${Math.round(peakPrice / 1000)}k`, status: "AVAILABLE", tag: "⭐ Ca Vàng" },
 { time: "18:00 - 20:00", price: `${Math.round(peakPrice / 1000)}k`, status: "AVAILABLE", tag: "🔥 Kèo Đỉnh" },
 { time: "20:00 - 22:00", price: `${Math.round(basePrice / 1000)}k`, status: "AVAILABLE", tag: "Đêm Mát" }
 );
 }

  // API /pitches KHÔNG có field "type" — chỉ có pitchTypes (mã SAN_5/SAN_7/SAN_11/FUTSAL).
  // Trước đây đọc item.type nên mọi sân đều bị coi là SAN7 và bộ lọc Sân 5 / Sân 11 / Futsal luôn rỗng.
  const sportTabs: string[] = toSportTabs(item.pitchTypes);
  const sport: string =
    sportTabs.includes("FUTSAL") && /futsal/i.test(String(item.name || ""))
      ? "FUTSAL"
      : sportTabs.includes("SAN11") && /sân 11|11 người/i.test(String(item.name || ""))
      ? "SAN11"
      : sportTabs.includes("SAN7")
      ? "SAN7"
      : sportTabs.includes("SAN5")
      ? "SAN5"
      : sportTabs[0] || "SAN7";

 return {
 id: item.id || `pitch-db-${rawId}`,
 numericId: Number(rawId) || 1,
 name: pitchName,
 address: address,
 latitude: item.latitude ?? 16.0544,
 longitude: item.longitude ?? 108.2022,
 district: address.includes("Liên Chiểu") ? "LIEN_CHIEU" : address.includes("Hải Châu") ? "HAI_CHAU" : address.includes("Cẩm Lệ") ? "CAM_LE" : "LIEN_CHIEU",
 districtName: address.includes("Liên Chiểu") ? "Q. Liên Chiểu" : address.includes("Hải Châu") ? "Q. Hải Châu" : "Đà Nẵng",
 phone: item.phone || "",
 ownerName: item.ownerName || "",
 openTime: openTime,
 closeTime: closeTime,
 slotDurationMinutes: slotDur,
  sportList: sportTabs,
  sportBadge: pitchTypeLabel(sport) || "⚽ Bóng Đá Sân 7 Chuẩn VFF",
 // Khoảng cách chỉ có thật nếu dùng vị trí GPS; không thì để trống.
 distanceKm: null,
 rating: item.rating ?? null,
 reviewsCount: item.reviewsCount ?? 0,
 priceOriginal: basePrice, // không bịa giá gạch: hiển thị đúng giá niêm yết
 priceDiscounted: basePrice,
 peakPrice: peakPrice,
 pitchTypes: item.pitchTypes && item.pitchTypes.length > 0 ? item.pitchTypes : [],
 amenities: item.amenities && item.amenities.length > 0 ? item.amenities : [],
 imageUrl: item.imageUrl || (idx % 2 === 0
 ? "https://images.unsplash.com/photo-1529900241452-f47268d87ec9?auto=format&fit=crop&w=1000&q=80"
 : "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80"),
 timeSlots: dynamicSlots
 };
 });
 setRealPitches(mapped);

 // Nạp dữ liệu ca thật của cụm sân đầu tiên từ API ma trận để phục vụ widget trạng thái ca sân
 if (mapped.length > 0) {
 try {
 const todayStr = todayLocal();
 const matrixRes = await fetchWithTimeout(`${API_BASE_URL}/api/v1/pitches/${mapped[0].numericId}/matrix?date=${todayStr}&duration=120`);
 if (matrixRes.ok) {
 const matrixData = await matrixRes.json();
 if (Array.isArray(matrixData) && matrixData.length > 0 && matrixData[0].slots) {
 const liveItems = matrixData[0].slots.slice(0, 3).map((s: any) => ({
 time: s.time,
 courtName: matrixData[0].pitchName,
 status: s.status === 'booked' ? 'BOOKED' : s.status === 'playing' ? 'PLAYING' : 'AVAILABLE',
 customer: s.customer || 'Trống'
 }));
 setFeaturedLiveSlots(liveItems);
 }
 }
 } catch {
 // Widget trạng thái ca sân là phần trang trí — lỗi ở đây không được làm hỏng danh sách sân
 }
 }
 }
 } catch (e) {
 setPitchLoadError(
 "Không kết nối được máy chủ dữ liệu sân. Vui lòng kiểm tra mạng và thử lại."
 );
 } finally {
 setLoadingRealPitches(false);
 }
 };

 // KHUYẾN NGHỊ: mọi useState/useEffect/useMemo đều phải nằm TRƯỚC các nhánh
 // return sớm bên dưới, nếu không sẽ vi phạm rules-of-hooks khi mở chi tiết sân.
 const userName = user?.fullName || user?.name || "Khách";
 const userPhone = (user?.phone ?? "").toString().replace(/\s/g, "");
 const hasUser = Boolean(user);

 // Giải đấu trong CSDL — dùng để đếm số trận đã đá của cầu thủ.
 const [tournaments, setTournaments] = useState<any[]>([]);
 useEffect(() => {
 let alive = true;
 fetchTournaments()
 .then((list) => { if (alive) setTournaments(list as any[]); })
 .catch(() => { if (alive) setTournaments([]); });
 return () => { alive = false; };
 }, []);

 // Đội của user (khớp SĐT đội trưởng trong các giải) — tournaments đã kèm
 // phong độ live từng đội nên suy ra form/record/tỷ lệ thắng, không cần điểm Elo.
 const myTeamEntry: any | null = React.useMemo(() => {
 if (!userPhone) return null;
 for (const t of tournaments) {
 const found = (t.teams ?? []).find(
 (z: any) => String(z.captainPhone ?? "").replace(/\s/g, "") === userPhone
 );
 if (found) return found;
 }
 return null;
 }, [tournaments, userPhone]);
 const myForm: string = myTeamEntry?.form ?? "";
 const myRecord: string = myTeamEntry?.record ?? "0-0-0";
 const myWinRate: number = myTeamEntry?.winRate ?? 0;

 // Kèo đang mở thật từ bảng matchmaking_posts trong CSDL
 const [openPosts, setOpenPosts] = useState<any[]>([]);
 const [postsLoading, setPostsLoading] = useState(true);
 const [creatingPost, setCreatingPost] = useState(false);

 const fetchOpenPosts = React.useCallback(async () => {
 try {
 const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/community/matchmaking-posts`);
 if (res.ok) {
 const data = await res.json();
 setOpenPosts(
 Array.isArray(data) ? data.filter((p: any) => p.status === "OPEN") : []
 );
 } else {
 setOpenPosts([]);
 }
 } catch {
 setOpenPosts([]);
 } finally {
 setPostsLoading(false);
 }
 }, []);

 useEffect(() => {
 fetchOpenPosts();
 }, [fetchOpenPosts]);

 /**
 * Số trận đã đá của cầu thủ: quét các giải trong CSDL, tìm đội do chính
 * người dùng làm trọng tài/đội trưởng rồi đếm các trận đã có kết quả.
 */ const userMatchesPlayed = React.useMemo(() => {
 if (!userPhone) return 0;
 let played = 0;
 for (const t of tournaments) {
 const myTeam = (t.teams ?? []).find(
 (z: any) => String(z.captainPhone ?? "").replace(/\s/g, "") === userPhone
 );
 if (!myTeam?.teamName) continue;
 if (!t.bracketJson) continue;
 try {
 const b = JSON.parse(t.bracketJson);
 if (!Array.isArray(b?.rounds)) continue;
 for (const r of b.rounds) {
 for (const m of r.matches ?? []) {
 if (m.status !== "DONE") continue;
 if (m.teamA?.name === myTeam.teamName || m.teamB?.name === myTeam.teamName) played += 1;
 }
 }
 } catch {
 /* bracket hỏng thì bỏ qua giải này */
 }
 }
 return played;
 }, [tournaments, userPhone]);

/** Mã loại sân trong CSDL (SAN_5/SAN_7/SAN_11/FUTSAL) -> id của tab bộ lọc. */
const SPORT_CODE_TO_TAB: Record<string, string> = {
  SAN_5: "SAN5",
  SAN_7: "SAN7",
  SAN_11: "SAN11",
  FUTSAL: "FUTSAL",
};

/** Quy đổi danh sách mã loại sân của 1 cụm sân sang id tab bộ lọc. */
const toSportTabs = (types?: string[] | null): string[] =>
  (types ?? []).map((t) => SPORT_CODE_TO_TAB[String(t).trim().toUpperCase()] ?? String(t).trim().toUpperCase());

 const sportsTabs = [
 { id: "ALL", name: "Tất Cả Sân Bóng", icon: "⚽" },
 { id: "SAN7", name: "Sân 7 Cỏ Nhân Tạo", icon: "🏆", badge: "Chuẩn VFF" },
 { id: "SAN5", name: "Sân 5 Mini Tốc Độ", icon: "⚡", badge: "Kèo Nhanh" },
 { id: "FUTSAL", name: "Futsal Sàn Gỗ", icon: "👟", badge: "Trong Nhà" },
 { id: "SAN11", name: "Sân 11 Tiêu Chuẩn", icon: "🏟️", badge: "11 vs 11" }
 ];

 const districtList = [
 { id: "ALL", name: "Toàn TP. Đà Nẵng" },
 { id: "LIEN_CHIEU", name: "Q. Liên Chiểu (Gần bạn nhất • < 2km)" },
 { id: "HAI_CHAU", name: "Q. Hải Châu (Trung tâm)" },
 { id: "THANH_KHE", name: "Q. Thanh Khê" },
 { id: "CAM_LE", name: "Q. Cẩm Lệ" },
 { id: "SON_TRA", name: "Q. Sơn Trà" }
 ];

 // Lọc danh sách sân theo các tiêu chí thực tế
 const filteredPitches = realPitches.filter((p) => {
  if (selectedSport !== "ALL" && !(p.sportList ?? [p.sport]).includes(selectedSport)) return false;
 if (selectedDistrict !== "ALL" && p.district !== selectedDistrict) return false;
 if (p.priceDiscounted > maxBudget) return false;
 return true;
 });

 const featuredPitch = realPitches.length > 0 ? realPitches[0] : null;

 // 3 đội phong độ cao nhất (tỷ lệ thắng từ lịch sử thật, đã kèm trong teams)
 const topTeamsByForm = tournaments
 .flatMap((t: any) => t.teams ?? [])
 .filter((tm: any) => tm.teamName && typeof tm.winRate === "number")
 .sort((a: any, b: any) => (b.winRate ?? 0) - (a.winRate ?? 0) || (b.played ?? 0) - (a.played ?? 0))
 .slice(0, 3);

 // AI gợi ý sân (FastAPI :8000) — ẩn lặng nếu AI offline
 const [aiLoading, setAiLoading] = useState(false);
 const [aiResults, setAiResults] = useState<AiPitchCluster[] | null>(null);
 const [aiSlow, setAiSlow] = useState(false);

 // ---- Điều hướng (đặt SAU toàn bộ hook để không vi phạm rules-of-hooks) ----
 // Điều hướng sang trang chi tiết sân thật
 if (selectedPitchForSlot) {
 return (
 <PitchDetail
 pitch={selectedPitchForSlot}
 user={user}
 onBack={() => setSelectedPitchForSlot(null)}
 />
 );
 }

 // Nhận kèo ngay từ widget Chợ Kèo — gọi đúng API nhận kèo của hệ thống.
 const handleAcceptFromWidget = async (post: any) => {
 if (!hasUser) {
 showToast("Bạn cần đăng nhập để nhận kèo.");
 return;
 }
 try {
 if (!ensureLoggedIn('nhận kèo')) return;
 const data = await apiRequest<any>(
 `/api/v1/community/matchmaking-posts/${post.id}/accept`,
 {
 method: "POST",
 body: JSON.stringify({
 opponentTeamName: user?.teamName || `FC ${userName}`,
 opponentCaptainName: userName,
 opponentCaptainPhone: user?.phone || "",
 }),
 }
 );
 showToast(data?.message || "🎉 Ghép kèo thành công!");
 fetchOpenPosts();
 } catch (e: any) {
 showToast(e?.message || "Kèo này không còn nhận được, hãy tải lại.");
 fetchOpenPosts();
 }
 };

 // Đăng kèo mới từ widget Chợ Kèo — ghi thẳng vào bảng matchmaking_posts.
 const handleCreateFromWidget = async () => {
 if (!hasUser) {
 showToast("Bạn cần đăng nhập để đăng kèo.");
 return;
 }
 if (!newMatchTitle.trim()) {
 showToast("Bạn cần nhập tên đội / tiêu đề kèo.");
 return;
 }
 const picked =
 realPitches.find((p: any) => String(p.id) === newMatchPitchId) ?? featuredPitch;
 setCreatingPost(true);
 try {
 if (!ensureLoggedIn('đăng kèo')) return;
 // apiRequest tự gắn Authorization — endpoint đăng kèo yêu cầu đăng nhập
 await apiRequest("/api/v1/community/matchmaking-posts", {
 method: "POST",
 body: JSON.stringify({
 teamName: newMatchTitle.trim(),
 captainName: userName,
 captainPhone: user?.phone || "",
 pitchName: picked?.name || "Chưa chọn sân",
 address: picked?.address || picked?.area || "",
 matchTime: newMatchSlot,
 pitchType: picked?.sport === "SAN5" ? "SAN_5" : "SAN_7",
 paymentModel: "SPLIT_EQUAL",
 estimatedFee:
 picked?.priceDiscounted && picked.priceDiscounted > 0
 ? Math.round(picked.priceDiscounted / 14)
 : 25000,
 note: newMatchNeed.trim() || "Tìm kèo giao lưu, tinh thần thể thao vui vẻ.",
 }),
 });
 setShowCreateMatchModal(false);
 setNewMatchTitle("");
 setNewMatchNeed("");
 showToast("🚀 Kèo của bạn đã được đăng lên Chợ Kèo!");
 fetchOpenPosts();
 } catch (e: any) {
 showToast(e?.message || "Lỗi kết nối máy chủ khi đăng kèo.");
 } finally {
 setCreatingPost(false);
 }
 };

 const askAiRecommend = async () => {
 if (realPitches.length === 0) return;
 try {
 setAiLoading(true);
 setAiSlow(false);
 setAiResults(null);
 // AI service trên Render có thể cần 20-30s để khởi động lần đầu.
 // Sau 3s chưa có kết quả thì hiện nhắc nhở để người dùng không tưởng bị treo.
 const slowTimer = setTimeout(() => setAiSlow(true), 3000);
 try {
 const clusters: AiPitchCluster[] = realPitches.map((p: any, idx: number) => ({
 id: String(p.numericId ?? idx + 1),
 name: p.name,
 latitude: Number(p.latitude ?? 16.0544),
 longitude: Number(p.longitude ?? 108.2022),
 avg_price_per_hour: Number(p.priceDiscounted ?? 350000),
 pitch_types: [p.sport === "SAN5" ? "PITCH_5" : p.sport === "SAN11" ? "PITCH_11" : "PITCH_7"],
 rating: Number(p.rating ?? 4.5),
 image_url: p.imageUrl ?? null,
 address: p.address ?? null,
 }));
 const sportMap: Record<string, string> = { SAN7: "PITCH_7", SAN5: "PITCH_5", SAN11: "PITCH_11", FUTSAL: "PITCH_7", ALL: "PITCH_7" };
 const res = await recommendPitches(clusters, {
 max_budget: maxBudget,
 pitch_type: sportMap[selectedSport] ?? "PITCH_7",
 top_n: 3,
 });
 setAiResults(res ? res.recommendations : []);
 } finally {
 clearTimeout(slowTimer);
 }
 } finally {
 setAiLoading(false);
 setAiSlow(false);
 }
 };

 return (
 <div className="space-y-4 sm:space-y-6">
 {/* Toast Notification */}
 {toastMsg && (
 <div className="fixed bottom-24 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in-up">
 <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
 <span className="text-sm font-bold">{toastMsg}</span>
 </div>
 )}

 {/* 0. AI GỢI Ý SÂN (FastAPI) — theo ngân sách + thể thức đang lọc */}
 <section className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm p-4 sm:p-6 space-y-3">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-amber-700" />
 AI Gợi Ý Sân Cho Bạn
 </h2>
 <p className="text-[13px] sm:text-[13px] text-slate-500 mt-0.5">
 Chấm điểm theo ngân sách {maxBudget.toLocaleString("vi-VN")}đ và thể thức đang lọc.
 </p>
 </div>
 <button
 type="button"
 onClick={askAiRecommend}
 disabled={aiLoading || realPitches.length === 0}
 className="shrink-0 px-4 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[13px] shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
 >
 {aiLoading ? (
 <><Loader2 className="w-4 h-4 animate-spin" /><span>Đang hỏi AI…</span></>
 ) : (
 <><Sparkles className="w-4 h-4" /><span>Hỏi AI chọn sân</span></>
 )}
 </button>
 </div>

 {/* Skeleton + nhắc nhở trong lúc chờ AI: lần đầu service cần ~20-30s để dựng */}
 {aiLoading && (
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="status" aria-live="polite">
 {[0, 1, 2].map((i) => (
 <div key={i} className="rounded-2xl border border-slate-200 p-3.5 space-y-2">
 <div className="skeleton-shimmer h-3 w-20 rounded" />
 <div className="skeleton-shimmer h-3.5 w-full rounded" />
 <div className="skeleton-shimmer h-3 w-2/3 rounded" />
 </div>
 ))}
 <p className="sm:col-span-3 text-[13px] text-slate-500 text-center">
 {aiSlow
 ? "AI đang khởi động máy chủ lần đầy (có thể mất 20–30 giây). Bạn vẫn có thể đặt sân thủ công bên dưới."
 : "Đang gửi yêu cầu tới AI…"}
 </p>
 </div>
 )}

 {aiResults !== null && (
 aiResults.length === 0 ? (
 <p className="text-[13px] text-slate-500 rounded-xl bg-slate-50 border border-slate-200 p-3.5">
 AI gợi ý đang tạm không phản hồi. Bạn vẫn chọn và đặt sân thủ công bên dưới như bình thường — thử bấm lại sau
 vài giây nếu muốn dùng gợi ý.
 </p>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 {aiResults.map((r, i) => (
 <div key={r.id} className="rounded-2xl border-2 border-[#0369a1]/50 bg-sky-50/50 p-3.5 space-y-1">
 <div className="flex items-center justify-between gap-2">
 <span className="text-[13px] font-black tracking-wider text-sky-800 ">
 Lựa chọn #{i + 1}
 </span>
 <span className="font-mono text-[13px] font-black text-sky-800 ">
 {Math.round(r.compatibility_score ?? 0)} điểm
 </span>
 </div>
 <p className="text-[13px] font-black text-slate-900 truncate">{r.name}</p>
 <p className="text-[13px] text-slate-500 truncate">{r.address || ""}</p>
 <p className="text-[13px] font-mono font-bold text-slate-700 ">
 {Number(r.avg_price_per_hour || 0).toLocaleString("vi-VN")}đ/giờ
 </p>
 </div>
 ))}
 </div>
 )
 )}
 </section>

 {/* 1. HERO COCKPIT CẦU THỦ PRO: THẺ DANH DỰ & TRẠNG THÁI PHONG ĐỘ */}
 <section className="relative w-full rounded-2xl sm:rounded-3xl bg-white text-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-all p-4 sm:p-8 border border-slate-200 ">
 <div className="hidden sm:block absolute -right-16 -top-20 w-96 h-96 bg-[#0369a1]/5 rounded-full blur-3xl pointer-events-none" />
 <div className="hidden sm:block absolute left-1/3 -bottom-24 w-80 h-80 bg-[#0369a1]/5 rounded-full blur-2xl pointer-events-none" />

 <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 sm:gap-6">
 {/* Cột trái: Thông tin cầu thủ & Lời chào */}
 <div className="flex-1 space-y-4 w-full">
 <div className="flex items-center space-x-2 flex-wrap gap-y-2">
 <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-800 font-extrabold text-[13px] sm:text-[13px] tracking-wider border border-sky-200 ">
 <CheckCircle2 className="w-3.5 h-3.5 text-sky-700 " />
 <span>Đã Xác Thực Tài Khoản</span>
 </span>
 <span className="hidden sm:inline-block font-mono text-[13px] sm:text-[13px] font-bold text-[#0b4f6c] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 ">
 VĐV ID: {user?.id ? `#SH-${user.id}` : "#SH-GH"}
 </span>
 {userMatchesPlayed > 0 ? (
 <span className="hidden sm:inline-flex items-center space-x-1 text-[13px] sm:text-[13px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 ">
 <Flame className="w-3.5 h-3.5 text-amber-700" />
 <span>Đã đá {userMatchesPlayed} trận</span>
 </span>
 ) : null}
 </div>

 <div className="flex items-center space-x-3.5 sm:space-x-4">
 <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0369a1] text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shrink-0">
 {userName.charAt(0)}
 </div>
 <div className="min-w-0">
 <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
 {hasUser ? (
 <>
 Chào mừng trở lại,{" "}
 <span className="text-[#0b4f6c] ">{userName}!</span> 👋
 </>
 ) : (
 <>
 Chào bạn đến với{" "}
 <span className="text-[#0b4f6c] ">Turfzone</span>! 👋
 </>
 )}
 </h1>
 <p className="text-[13px] sm:text-[13px] md:text-sm text-slate-600 font-medium mt-0.5 leading-relaxed">
 Vị trí chơi:{" "}
 <span className="text-[#0b4f6c] font-bold">
 {user?.position ?? "Chưa cập nhật"}
 </span>{" "}
 • Khu vực: <span className="font-bold">{user?.area ?? "Chưa cập nhật"}</span>{" "}
 • Bậc: <span className="font-bold">{user?.level ?? "Chưa xếp bậc"}</span>
 </p>
 </div>
 </div>
 </div>

 {/* Cột phải: Thống kê phong độ thực tế */}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-col gap-3 w-full xl:w-auto shrink-0">
 <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 w-full xl:min-w-[260px]">
 <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl font-bold border border-amber-500/20 shrink-0">
 🏆
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-[13px] text-slate-500 tracking-wider font-extrabold">Phong Độ Đội Bạn</span>
 <div className="flex items-baseline space-x-2">
 <span className="text-xl sm:text-2xl font-black text-[#0b4f6c] font-mono whitespace-nowrap shrink-0">
 {hasUser ? (myTeamEntry ? myRecord : "—") : "—"}
 </span>
 <span className="text-[13px] text-slate-700 font-bold truncate">
 {myTeamEntry ? `${myTeamEntry.teamName} • Thắng ${myWinRate}%` : (user?.level ?? "Chưa xếp bậc")}
 </span>
 </div>
 <span className="text-[13px] text-slate-500 truncate">
 {userMatchesPlayed > 0
 ? `Đã đá ${userMatchesPlayed} trận trong các giải của hệ thống`
 : "Chưa thi đấu trong giải nào trên hệ thống"}
 </span>
 </div>
 </div>

 <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 w-full xl:min-w-[260px]">
 <div className="w-11 h-11 rounded-xl bg-[#0369a1]/10 text-sky-700 flex items-center justify-center text-xl font-bold border border-[#0369a1]/20 shrink-0">
 ⚽
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-[13px] text-slate-500 tracking-wider font-extrabold">Môn Thể Thức Yêu Thích</span>
 <div className="flex items-baseline space-x-2">
 <span className="text-xl sm:text-2xl font-black text-sky-700 font-mono truncate">
 {user?.favoriteSport === "football" ? "Bóng Đá" : user?.favoriteSport ?? "—"}
 </span>
 </div>
 <span className="text-[13px] text-sky-700 font-bold truncate">
 {realPitches.length} cụm sân đang mở đặt trên hệ thống
 </span>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* 2. BỘ LỌC TÌM SÂN THÔNG MINH (SMART FILTERS BAR) */}
 <section className="w-full bg-white p-2 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 space-y-2.5 sm:space-y-3.5">
 {/* Mobile: nút mở/đóng bộ lọc để giữ giao diện tối giản */}
 <button
 type="button"
 onClick={() => setShowMobileFilters((v) => !v)}
 aria-expanded={showMobileFilters}
 className="sm:hidden w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-left cursor-pointer"
 >
 <span className="flex items-center gap-2 text-sm font-bold text-slate-800 ">
 <SlidersHorizontal className="w-4 h-4 text-[#0b4f6c] " />
 Bộ lọc tìm sân
 {activeFilterCount > 0 && (
 <span className="text-[13px] font-black px-1.5 py-0.5 rounded-md bg-[#0369a1] text-white ">
 {activeFilterCount}
 </span>
 )}
 </span>
 <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500">
 {showMobileFilters ? "Thu gọn" : "Mở rộng"}
 <ChevronDown className={`w-4 h-4 transition-transform ${showMobileFilters ? "rotate-180" : ""}`} />
 </span>
 </button>

 {/* Hàng 1: Tabs loại sân thể thao */}
 <div className={`${showMobileFilters ? "flex" : "hidden"} sm:flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3`}>
 <div className="flex items-center gap-2 pb-1 flex-wrap">
 {sportsTabs.map((tab) => (
 <button
 key={tab.id}
 type="button"
 onClick={() => setSelectedSport(tab.id)}
 className={`px-3.5 sm:px-4 py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap shrink-0 cursor-pointer ${
 selectedSport === tab.id
 ? "bg-[#0369a1] text-white shadow-sm"
 : "bg-slate-100 text-slate-700 hover:bg-slate-200 "
 }`}
 >
 <span>{tab.icon}</span>
 <span>
 {tab.name}
 {tab.badge ? (
 <span className={`ml-1 px-1.5 py-0.2 rounded-md ${
 selectedSport === tab.id
 ? "bg-white/20 text-white "
 : "bg-slate-200 text-slate-600 "
 }`}>
 {tab.badge}
 </span>
 ) : null}
 </span>
 </button>
 ))}
 </div>

 {/* Nút chỉ lọc ca trống tối nay */}
 <button
 type="button"
 onClick={() => setOnlyAvailableTonight(!onlyAvailableTonight)}
 className={`w-full sm:w-auto shrink-0 px-3.5 py-2 rounded-xl text-[13px] font-bold flex items-center justify-center space-x-1.5 border transition-all cursor-pointer ${
 onlyAvailableTonight
 ? "bg-[#0369a1]/10 border-[#0369a1] text-sky-700 "
 : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
 }`}
 >
 <span className={`w-2 h-2 rounded-full ${onlyAvailableTonight ? "bg-[#0369a1] text-white animate-ping" : "bg-slate-400"}`} />
 <span>Chỉ xem ca trống tối nay</span>
 </button>
 </div>

 {/* Hàng 2: Dropdowns chi tiết (Khu vực Đà Nẵng, Khung Giờ, Quy Mô Sân, Ngân Sách) */}
 <div className={`${showMobileFilters ? "grid" : "hidden"} sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1`}>
 {/* Lọc Khu vực Đà Nẵng Thật */}
 <div className="bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-200 flex items-center space-x-2.5">
 <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
 <div className="flex-1 min-w-0">
 <span className="text-[13px] text-slate-500 font-extrabold block leading-none">Khu Vực Địa Lý</span>
 <select
 aria-label="Khu vực địa lý"
 value={selectedDistrict}
 onChange={(e) => setSelectedDistrict(e.target.value)}
 className="w-full bg-transparent text-[13px] font-bold text-slate-900 focus:outline-none cursor-pointer mt-0.5"
 >
 {districtList.map((d) => (
 <option key={d.id} value={d.id} className="">
 {d.name}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Lọc Khung giờ thi đấu */}
 <div className="bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-200 flex items-center space-x-2.5">
 <Clock className="w-4 h-4 text-[#0b4f6c] shrink-0" />
 <div className="flex-1 min-w-0">
 <span className="text-[13px] text-slate-500 font-extrabold block leading-none">Khung Giờ Thi Đấu</span>
 <select
 aria-label="Khung giờ thi đấu"
 value={selectedTimeSlotFilter}
 onChange={(e) => setSelectedTimeSlotFilter(e.target.value)}
 className="w-full bg-transparent text-[13px] font-bold text-slate-900 focus:outline-none cursor-pointer mt-0.5"
 >
 <option value="ALL" className="">Tất Cả Ca (14:00 - 22:00)</option>
 <option value="PEAK" className="">⭐ Ca Vàng (18:00 - 20:00)</option>
 <option value="AFTERNOON" className="">Ca Chiều (14:00 - 18:00)</option>
 <option value="NIGHT" className="">Ca Đêm (20:00 - 22:00)</option>
 </select>
 </div>
 </div>

 {/* Lọc Quy mô sân con */}
 <div className="bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-200 flex items-center space-x-2.5">
 <Layers className="w-4 h-4 text-emerald-500 shrink-0" />
 <div className="flex-1 min-w-0">
 <span className="text-[13px] text-slate-500 font-extrabold block leading-none">Quy Mô Sân Con</span>
 <select
 aria-label="Quy mô sân con"
 value={selectedPitchFormat}
 onChange={(e) => setSelectedPitchFormat(e.target.value)}
 className="w-full bg-transparent text-[13px] font-bold text-slate-900 focus:outline-none cursor-pointer mt-0.5"
 >
 <option value="ALL" className="">Tất Cả Sân Con</option>
 <option value="SAN_7" className="">Sân 7 (Cỏ Nhân Tạo 50mm)</option>
 <option value="SAN_5" className="">Sân 5 (Mini Tốc Độ)</option>
 <option value="SAN_11" className="">Sân 11 (Cỏ Tự Nhiên)</option>
 </select>
 </div>
 </div>

 {/* Slider Ngân Sách */}
 <div className="bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-200 flex items-center space-x-2.5">
 <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between text-[13px] text-slate-500 font-extrabold leading-none">
 <span>Ngân Sách Tối Đa</span>
 <span className="text-sky-700 font-mono font-bold">
 {maxBudget.toLocaleString("vi-VN")}đ
 </span>
 </div>
 <input
 type="range"
 min="200000"
 max="800000"
 step="50000"
 value={maxBudget}
 onChange={(e) => setMaxBudget(Number(e.target.value))}
 aria-label="Ngân sách tối đa mỗi giờ"
 aria-valuetext={maxBudget.toLocaleString("vi-VN") + " đồng"}
 className="w-full accent-[#0369a1] cursor-pointer h-1.5 mt-1.5"
 />
 </div>
 </div>
 </div>
 </section>

 {/* 3. CARD AI ĐỀ XUẤT THÔNG MINH & REDIS DISTRIBUTED MUTEX MONITOR */}
 {featuredPitch && (
 <section className="w-full">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6">
 {/* CỘT TRÁI (7 COLS): AI SMART RECOMMENDATION CHO ĐỘI BÓNG */}
 <div className="lg:col-span-7 bg-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
 <div className="space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center space-x-2">
 <span className="px-2.5 py-1 bg-[#0369a1] text-white font-black text-[13px] rounded-lg flex items-center tracking-wider shadow-xs">
 <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300 " />
 Gợi ý sân thông minh
 </span>
 <span className="font-mono text-[13px] font-extrabold text-sky-700 flex items-center">
 <Zap className="w-3.5 h-3.5 mr-0.5" />
 Phong độ: {hasUser ? (myTeamEntry ? `${myRecord} • Thắng ${myWinRate}%` : "tân binh") : "chưa đăng nhập"}
 </span>
 </div>
 </div>

 <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
 Đề xuất tối ưu cho Đội của bạn:{" "}
 <span className="text-[#0b4f6c] ">{featuredPitch.name}</span>
 </h2>

 <p className="hidden sm:block text-[13px] sm:text-sm text-slate-600 font-medium leading-relaxed">
 Gợi ý dựa trên vị trí thật tại{" "}
 <strong className="text-slate-900 ">
 {featuredPitch.address ?? featuredPitch.area ?? "khu vực của bạn"}
 </strong>{" "}
 và lịch sử phong độ của đội bạn (
 {hasUser ? (
 <>
 {myTeamEntry ? `${myRecord} • Thắng ${myWinRate}%` : "tân binh"}
 {userMatchesPlayed > 0
 ? `, đã đá ${userMatchesPlayed} trận trong hệ thống`
 : ", chưa thi đấu trong giải nào"}
 </>
 ) : (
 "đăng nhập để hệ thống lưu lịch sử thi đấu của bạn"
 )}
 ).
 </p>

 {/* 3 Thông Số Lấy Từ Hồ Sơ Sân Trong CSDL */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
 <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
 <span className="text-[13px] font-bold text-slate-500">Giờ Mở Cửa</span>
 <div className="text-sm font-black text-slate-900 font-mono">
 {featuredPitch.openTime ?? "—"} - {featuredPitch.closeTime ?? "—"}
 </div>
 <span className="text-[13px] font-bold text-[#0b4f6c] block">
 {featuredPitch.timeSlots?.length ?? 0} ca mỗi ngày
 </span>
 </div>

 <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
 <span className="text-[13px] font-bold text-slate-500">Loại Sân</span>
 <div className="text-sm font-black text-slate-900 font-mono truncate">
 {featuredPitch.pitchTypes?.filter(Boolean).slice(0, 2).map(pitchTypeLabel).join(" · ") ||
 featuredPitch.type ||
 "Chưa khai báo"}
 </div>
 <span className="text-[13px] font-bold text-sky-700 block truncate">
 {featuredPitch.amenities?.[0] ?? "Theo hồ sơ sân"}
 </span>
 </div>

 <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
 <span className="text-[13px] font-bold text-slate-500">Giá Mỗi Ca</span>
 <div className="text-sm font-black text-slate-900 font-mono truncate">
 {featuredPitch.priceDiscounted?.toLocaleString("vi-VN")}đ
 </div>
 <span className="text-[13px] font-bold text-amber-700 block">
 {featuredPitch.rating
 ? `Đánh giá ${featuredPitch.rating} (${featuredPitch.reviewsCount} đánh giá)`
 : "Chưa có đánh giá nào"}
 </span>
 </div>
 </div>
 </div>

 <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
 <div className="hidden sm:flex items-center space-x-2">
 <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1] animate-pulse" />
 <span className="text-[13px] font-bold text-slate-600 ">
 Giá theo niêm yết của sân — đặt xong hệ thống sinh mã giữ chỗ
 </span>
 </div>
 <button
 type="button"
 onClick={() => setSelectedPitchForSlot(featuredPitch)}
 className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
 >
 <span>Chọn Khung Giờ Ngay</span>
 <ArrowRight className="w-4 h-4 text-white" />
 </button>
 </div>
 </div>

 {/* CỘT PHẢI (5 COLS): REDIS DISTRIBUTED MUTEX LOCK MONITOR */}
 <div className="lg:col-span-5 bg-white text-slate-900 p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
 <div className="space-y-3">
 <div className="flex items-center justify-between pb-2 border-b border-slate-100 ">
 <div className="flex items-center space-x-2">
 <Lock className="w-[18px] h-[18px] text-amber-700" />
 <span className="font-extrabold text-sm text-slate-900 ">Trạng Thái Ca Sân Hôm Nay</span>
 </div>
 <span className="font-mono text-[13px] font-extrabold px-2.5 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-full flex items-center">
 <span className="w-1.5 h-1.5 rounded-full bg-[#0369a1] mr-1.5" />
 Đọc từ CSDL
 </span>
 </div>

 <p className="hidden sm:block text-[13px] text-slate-500 font-medium">
 Ma trận ca sân lấy trực tiếp từ bảng bookings — ca nào đã có khách đặt thì không
 thể chọn tiếp.
 </p>

 {/* State Legend */}
 <div className="hidden sm:flex items-center space-x-3 text-[13px] font-bold pt-1">
 <span className="flex items-center text-sky-700 ">
 <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1] mr-1.5" /> Sẵn Sàng
 </span>
 <span className="flex items-center text-slate-500">
 <span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-1.5" /> Đã Đặt
 </span>
 </div>

 {/* Danh sách ca sân thời gian thực từ cơ sở dữ liệu thật */}
 <div className="space-y-2 font-mono text-[13px] pt-2">
 {featuredLiveSlots.length > 0 ? (
 featuredLiveSlots.map((ls: any, lIdx: number) => (
 <div
 key={lIdx}
 className={`flex items-center justify-between p-2.5 rounded-xl border ${
 ls.status === 'BOOKED' || ls.status === 'PLAYING'
 ? "bg-slate-50 border-slate-200 "
 : "bg-sky-50 border-sky-200 "
 }`}
 >
 <div className="flex items-center space-x-2 min-w-0 flex-1">
 <span className={`font-bold shrink-0 ${ls.status === 'BOOKED' ? "text-slate-600 " : "text-[#0b4f6c] "}`}>
 {ls.time}
 </span>
 <span className="text-[13px] text-slate-600 font-sans truncate min-w-0 max-w-[100px] sm:max-w-[130px]">
 {pitchTypeLabel(ls.courtName) || ls.courtName}
 </span>
 </div>
 {ls.status === 'BOOKED' || ls.status === 'PLAYING' ? (
 <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[13px] font-bold rounded font-sans min-w-0 break-words text-right">
 Đã Đặt ({ls.customer})
 </span>
 ) : (
 <button
 type="button"
 onClick={() => setSelectedPitchForSlot(featuredPitch)}
 className="px-2.5 sm:px-3 py-1 bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] rounded-lg font-sans shadow-sm transition-colors cursor-pointer shrink-0"
 >
 Chọn Ca
 </button>
 )}
 </div>
 ))
 ) : (
 <>
 <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 ">
 <span className="text-[13px] text-slate-500 font-sans">
 Chưa có dữ liệu ca sân cho sân này trong ngày đã chọn.
 </span>
 </div>
 </>
 )}
 </div>
 </div>

 <div className="hidden sm:block text-right pt-2 border-t border-slate-100 ">
 <span className="font-mono text-[13px] text-slate-500">
 Nguồn: bảng bookings · cập nhật khi tải trang
 </span>
 </div>
 </div>
 </div>
 </section>
 )}

 {/* 4. MAIN COCKPIT: DANH SÁCH CỤM SÂN KHẢ DỤNG & CHỢ KÈO GHÉP ĐỘI */}
 <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-6 items-start">
 {/* THÔNG BÁO LỖI KẾT NỐI MÁY CHỦ (thân thiện, có nút thử lại) */}
 {pitchLoadError && (
 <div className="xl:col-span-12 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
 <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold text-amber-900 ">
 Chưa tải được dữ liệu sân
 </p>
 <p className="text-[13px] text-amber-800/90 mt-0.5">
 {pitchLoadError}
 </p>
 </div>
 <button
 type="button"
 onClick={fetchPitches}
 disabled={loadingRealPitches}
 className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] disabled:opacity-60 text-white text-[13px] font-bold transition-colors"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${loadingRealPitches ? "animate-spin" : ""}`} />
 <span>Thử lại</span>
 </button>
 </div>
 )}

 {/* CỘT TRÁI (8 COLS): DANH SÁCH CỤM SÂN BÓNG ĐÁ THẬT ĐÀ NẴNG */}
 <main className="xl:col-span-8 space-y-4 sm:space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center space-x-2">
 <h2 className="text-lg sm:text-xl font-black text-slate-900 ">
 Sân Trống Khả Dụng Khung Giờ Tối
 </h2>
 <span className="hidden sm:inline px-2.5 py-0.5 rounded-full bg-[#0369a1] text-white text-[13px] font-black">
 LIVE
 </span>
 <span className="sm:hidden w-2 h-2 rounded-full bg-[#0369a1] animate-pulse" aria-hidden="true" />
 </div>
 <p className="hidden sm:block text-[13px] text-slate-500 font-medium mt-0.5">
 Danh sách lấy từ bảng pitches và ma trận ca sân của hệ thống
 </p>
 </div>

 <div className="flex items-center space-x-2">
 <span className="text-[13px] font-bold text-[#0369a1] bg-sky-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-sky-200 text-[13px] sm:text-[13px]">
 Gần nhất
 </span>
 </div>
 </div>

 {/* DANH SÁCH CÁC THẺ SÂN BÓNG */}
 <div className="space-y-3 sm:space-y-5">
 {loadingRealPitches ? (
 <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-slate-200 text-center space-y-3">
 <Loader2 className="w-8 h-8 text-[#0b4f6c] animate-spin mx-auto" />
 <p className="text-sm font-bold text-slate-500">Đang đồng bộ cụm sân từ máy chủ MySQL...</p>
 </div>
 ) : filteredPitches.length === 0 ? (
 <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-slate-200 text-center space-y-4 shadow-sm">
 <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto border border-amber-500/20">
 <MapPin className="w-8 h-8" />
 </div>
 <div className="space-y-1">
 <h3 className="text-lg font-black text-slate-900 ">
 Không tìm thấy cụm sân bóng nào phù hợp
 </h3>
 <p className="text-[13px] text-slate-500 max-w-md mx-auto">
 Vui lòng thử mở rộng bán kính tìm kiếm hoặc điều chỉnh ngân sách ca đấu.
 </p>
 </div>
 </div>
 ) : (
 filteredPitches.map((pitch) => (
 <article
 key={pitch.id}
 className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-sm sport-card-hover flex flex-col md:flex-row cursor-pointer"
 >
 {/* Thumbnail Visual */}
 <div className="md:w-5/12 relative min-h-[150px] md:min-h-[230px] overflow-hidden bg-slate-900">
 <SafeImage
 src={pitch.imageUrl}
 alt={pitch.name}
 className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out brightness-95"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
 
 <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
 <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-white font-extrabold text-[13px] flex items-center space-x-1 border border-slate-700">
 <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
 <span>{pitch.pitchTypes?.[0] ? pitchTypeLabel(pitch.pitchTypes[0]) : pitch.sportBadge}</span>
 </span>
 </div>

 <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[13px] font-bold">
 <div className="flex items-center space-x-1">
 <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
 <span className="truncate max-w-[170px]">{pitch.districtName}</span>
 </div>
 <span className="bg-[#0369a1]/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[13px]">
 {pitch.openTime} - {pitch.closeTime}
 </span>
 </div>
 </div>

 {/* Chi tiết sân & Ca trống hôm nay */}
 <div className="md:w-7/12 p-3 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-4">
 <div className="space-y-2.5">
 <div className="flex items-start justify-between gap-2">
 <div>
 <h3 
 onClick={() => setSelectedPitchForSlot(pitch)}
 className="text-lg font-black text-slate-900 group-hover:text-sky-700 transition-colors cursor-pointer"
 >
 {pitch.name}
 </h3>
 <p className="text-[13px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
 <Navigation className="w-3.5 h-3.5 text-slate-500 shrink-0" />
 <span>{pitch.address}</span>
 </p>
 </div>
 {pitch.rating ? (
 <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl shrink-0">
 <Star className="w-3.5 h-3.5 text-amber-700 fill-amber-500" />
 <span className="font-extrabold text-[13px] text-slate-900 ">
 {pitch.rating}
 </span>
 <span className="text-[13px] text-slate-500">({pitch.reviewsCount})</span>
 </div>
 ) : null}
 </div>

 {/* Tiện ích khai báo trong hồ sơ sân */}
 <div className="flex flex-wrap gap-1.5 pt-0.5">
 {(pitch.amenities ?? []).length === 0 ? (
 <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold text-[13px]">
 Chủ sân chưa khai báo tiện ích
 </span>
 ) : (
 pitch.amenities.slice(0, 3).map((a: string) => (
 <span
 key={a}
 className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-bold text-[13px] flex items-center gap-1 border border-sky-200 "
 >
 <Camera className="w-3 h-3 text-emerald-500" />
 {a}
 </span>
 ))
 )}
 </div>
 </div>

 {/* Dải ca trống hôm nay từ database */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between text-[13px] font-extrabold text-slate-500 tracking-wider">
 <span>Ca trống hôm nay ({pitch.openTime} - {pitch.closeTime}):</span>
 <span className="text-sky-700 ">120p (2 tiếng)/ca</span>
 </div>
 <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
 {pitch.timeSlots.map((ts: any, i: number) => (
 <button
 key={i}
 type="button"
 onClick={() => setSelectedPitchForSlot(pitch)}
 className={`px-3 py-1.5 rounded-xl font-mono text-[13px] font-bold shrink-0 transition-all cursor-pointer ${
 ts.status === "ACTIVE"
 ? "bg-[#0369a1] text-white shadow-xs"
 : "bg-slate-100 text-slate-700 hover:bg-slate-200 "
 }`}
 >
 {ts.time} {ts.tag ? `(${ts.tag})` : ""}
 </button>
 ))}
 </div>
 </div>

 {/* Bảng giá & Nút Xem Ca & Đặt */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 ">
 <div>
 <div className="flex items-baseline space-x-2 flex-wrap">
 <span className="text-xl font-black text-sky-700 font-mono">
 {pitch.priceDiscounted.toLocaleString("vi-VN")}đ
 </span>
 <span className="px-1.5 py-0.2 rounded bg-[#0369a1]/15 text-sky-800 text-[13px] font-black">
 {pitch.slotDurationMinutes} phút/ca
 </span>
 </div>
 <p className="hidden sm:block text-[13px] text-slate-500 font-medium">
 Giá theo niêm yết của sân · ca giờ vàng tính theo giá peak
 </p>
 </div>

 <button
 type="button"
 onClick={() => setSelectedPitchForSlot(pitch)}
 className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
 >
 <span>Xem Ca & Đặt</span>
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 </article>
 ))
 )}
 </div>
 </main>

 {/* CỘT PHẢI (4 COLS): CHỢ KÈO GHÉP ĐỘI ELO & THẺ CHECK-IN QUICKPASS */}
 <aside className="xl:col-span-4 space-y-4 sm:space-y-6">
 {/* WIDGET 1: CHỢ KÈO GHÉP ĐỘI — đọc từ bảng matchmaking_posts trong CSDL */}
 <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1] animate-ping" />
 <h3 className="font-black text-slate-900 text-sm">
 Chợ Kèo Đang Mở ({openPosts.length})
 </h3>
 </div>
 <button
 type="button"
 onClick={() => setShowCreateMatchModal(true)}
 className="text-[13px] font-bold text-[#0369a1] hover:underline flex items-center gap-1 cursor-pointer"
 >
 <PlusCircle className="w-3.5 h-3.5" />
 <span>Tạo Kèo Mới</span>
 </button>
 </div>

 <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
 Danh sách kèo do đội khác đăng lên hệ thống, sắp theo thời điểm đăng
 {hasUser && myTeamEntry ? (
 <>
 {" "}• <strong className="text-slate-900 ">Phong độ đội bạn: {myRecord}</strong>
 </>
 ) : null}
 .
 </p>

 {postsLoading ? (
 <p className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[13px] text-slate-500 flex items-center gap-2">
 <Loader2 className="w-4 h-4 animate-spin" /> Đang tải kèo từ CSDL…
 </p>
 ) : openPosts.length === 0 ? (
 <p className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[13px] text-slate-500 leading-relaxed">
 Chưa có kèo nào đang mở. Bấm <strong>“Tạo Kèo Mới”</strong> để đăng đội
 của bạn lên sàn, hoặc vào tab <strong>Chợ Kèo</strong> để xem chi tiết.
 </p>
 ) : (
 openPosts.slice(0, 2).map((p: any) => {
 const label =
 p.pitchType === "FUTSAL"
 ? "👟 Futsal"
 : p.pitchType === "SAN_5"
 ? "👟 Sân 5"
 : p.pitchType === "SAN_11"
 ? "🏟️ Sân 11"
 : "⚽ Bóng Đá Sân 7";
 return (
 <div
 key={p.id}
 className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
 >
 <div className="flex items-center justify-between">
 <span className="px-2 py-0.5 rounded bg-[#0369a1]/20 text-sky-800 font-black text-[13px]">
 {label}
 </span>
 <span className="font-mono text-[13px] font-bold text-slate-500">
 {p.matchTime ?? "—"}
 </span>
 </div>
 <h4 className="font-black text-[13px] text-slate-900 ">
 {p.pitchName ?? "Chưa chọn sân"}
 {p.note ? ` • ${p.note}` : ""}
 </h4>
 <div className="flex items-center justify-between text-[13px] text-slate-500">
 <span>
 Phong độ:{" "}
 <strong className="text-slate-900 ">
 {p.record && p.record !== "0-0-0" ? `${p.record} • Thắng ${p.winRate ?? 0}%` : "Tân binh"}
 </strong>
 </span>
 {p.estimatedFee ? (
 <span className="font-mono font-black text-sky-700 ">
 {Number(p.estimatedFee).toLocaleString("vi-VN")}đ/người
 </span>
 ) : null}
 </div>

 <div className="flex items-center justify-between pt-2 border-t border-slate-200 ">
 <span className="text-[13px] font-bold text-slate-500 truncate pr-2">
 {p.teamName} mở kèo
 </span>
 <button
 type="button"
 onClick={() => handleAcceptFromWidget(p)}
 className="px-3.5 py-1.5 rounded-xl font-bold text-[13px] transition-all cursor-pointer bg-[#0369a1] hover:bg-[#075985] text-white active:scale-95 shrink-0"
 >
 Bắt Kèo Ngay
 </button>
 </div>
 </div>
 );
 })
 )}
 </section>

 {/* WIDGET 2: THẺ VẬN ĐỘNG VIÊN Turfzone QUICKPASS (QR SCAN BARRIER) */}
 <section className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-200 space-y-4 relative overflow-hidden">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <QrCode className="w-5 h-5 text-amber-700" />
 <h3 className="font-black text-sm text-slate-900 ">Turfzone QuickPass</h3>
 </div>
 <span className="px-2.5 py-0.5 rounded bg-[#0369a1] text-white font-black text-[13px]">
 Check-in Không Chạm
 </span>
 </div>

 <div className="p-3.5 rounded-2xl bg-slate-50 backdrop-blur-md flex items-center justify-between space-x-3 border border-slate-200 ">
 <div 
 onClick={() => setShowQrModal(true)}
 className="bg-white p-2 rounded-xl shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
 title="Nhấn để phóng to mã QR"
 >
 <QrCode className="w-12 h-12 text-slate-950" />
 </div>
 <div className="flex-1 min-w-0 space-y-1">
 <h4 className="font-black text-[13px] text-slate-900 truncate">{userName}</h4>
 <p className="font-mono text-[13px] text-[#0b4f6c] ">ID: {user?.id ? `#SH-${user.id}` : "#SH-GH"}</p>
 <div className="flex items-center space-x-2 text-[13px] font-mono text-sky-800 font-bold">
 <span>{user?.level ?? "Chưa xếp bậc"}</span>
 <span>•</span>
 <span>{hasUser ? (myTeamEntry ? `Thành tích ${myRecord}` : "Tân binh") : "Chưa đăng nhập"}</span>
 </div>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setShowQrModal(true)}
 className="w-full py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[13px] shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
 >
 <span>Mở Thẻ Hội Viên QR</span>
 <ArrowRight className="w-4 h-4" />
 </button>
 </section>

 {/* WIDGET 3: ĐỘI PHONG ĐỘ CAO NHẤT (tỷ lệ thắng từ lịch sử thật trong CSDL) */}
 <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <Trophy className="w-4 h-4 text-amber-700" />
 <h3 className="font-black text-slate-900 text-[13px]">
 Đội Phong Độ Cao Nhất
 </h3>
 </div>
 <span className="text-[13px] font-bold text-slate-500">
 {tournaments.length} giải trong CSDL
 </span>
 </div>

 <div className="space-y-2">
 {topTeamsByForm.length === 0 ? (
 <p className="text-[13px] text-slate-500 leading-relaxed">
 Chưa có đội nào trong danh sách đội của các giải. Đăng ký một giải để
 đội bạn xuất hiện ở đây.
 </p>
 ) : (
 topTeamsByForm.map((tm: any, idx: number) => (
 <div
 key={`${tm.teamName}-${idx}`}
 className={`flex items-center justify-between p-2 rounded-xl text-[13px] ${
 idx === 0
 ? "bg-amber-500/10 border border-amber-500/20"
 : "bg-slate-50 "
 }`}
 >
 <div className="flex items-center space-x-2 min-w-0">
 <span
 className={`font-black font-mono ${
 idx === 0 ? "text-amber-700" : "text-slate-500"
 }`}
 >
 #{idx + 1}
 </span>
 <span className="font-bold text-slate-900 truncate">
 {tm.teamName}
 </span>
 </div>
 <span
 className={`font-mono font-bold shrink-0 ${
 idx === 0
 ? "text-amber-600 "
 : "text-slate-500"
 }`}
 >
 {tm.record && tm.record !== "0-0-0" ? `${tm.record} • ` : ""}Thắng {tm.winRate ?? 0}%
 </span>
 </div>
 ))
 )}
 </div>
 </section>
 </aside>
 </div>

 {/* MODAL TẠO KÈO MỚI */}
 {showCreateMatchModal && (
 <div id="ps-inline-create-match" className="w-full animate-fade-in">
 <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-md w-full border border-slate-200 shadow-sm space-y-4">
 <div className="flex items-center justify-between pb-3 border-b border-slate-100 ">
 <div className="flex items-center space-x-2">
 <div className="w-8 h-8 rounded-xl bg-[#0369a1]/20 text-emerald-500 flex items-center justify-center font-bold">
 ⚽
 </div>
 <h3 className="font-black text-base text-slate-900 ">Đăng Tin Tìm Đối / Ghép Đội</h3>
 </div>
 <button
 type="button"
 onClick={() => setShowCreateMatchModal(false)}
 className="text-slate-500 hover:text-slate-600 p-1"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="space-y-3">
 <div>
 <label className="text-[13px] font-bold text-slate-700 block mb-1">
 Tên Đội / Tiêu đề kèo:
 </label>
 <input
 type="text"
 placeholder="Ví dụ: FC Anh Em Liên Chiểu tìm đối giao lưu vui vẻ"
 value={newMatchTitle}
 onChange={(e) => setNewMatchTitle(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 </div>

 <div>
 <label className="text-[13px] font-bold text-slate-700 block mb-1">
 Sân thi đấu:
 </label>
 <select
 aria-label="Sân thi đấu"
 value={newMatchPitchId}
 onChange={(e) => setNewMatchPitchId(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 >
 {realPitches.length === 0 ? (
 <option value="">Chưa tải được danh sách sân</option>
 ) : (
 realPitches.map((p: any) => (
 <option key={String(p.id)} value={String(p.id)}>
 {p.name}
 </option>
 ))
 )}
 </select>
 </div>

 <div>
 <label className="text-[13px] font-bold text-slate-700 block mb-1">
 Khung giờ thi đấu:
 </label>
 <select
 aria-label="Khung giờ thi đấu"
 value={newMatchSlot}
 onChange={(e) => setNewMatchSlot(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 >
 {(featuredPitch?.timeSlots?.length
 ? featuredPitch.timeSlots.map((s: any) => String(s.time))
 : ["17:30 - 19:00", "19:00 - 21:00", "21:00 - 23:00"]
 ).map((t: string) => (
 <option key={t} value={t}>
 {t}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="text-[13px] font-bold text-slate-700 block mb-1">
 Ghi chú / vị trí cần ghép:
 </label>
 <input
 type="text"
 placeholder="Ví dụ: Cần thêm 1 GK bắt gôn + 2 hậu vệ đá cánh"
 value={newMatchNeed}
 onChange={(e) => setNewMatchNeed(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 </div>
 </div>

 <div className="pt-2 flex items-center justify-end space-x-2">
 <button
 type="button"
 onClick={() => setShowCreateMatchModal(false)}
 className="px-4 py-2 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 "
 >
 Hủy bỏ
 </button>
 <button
 type="button"
 disabled={creatingPost}
 onClick={handleCreateFromWidget}
 className="px-5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] shadow-md transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
 >
 {creatingPost && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
 {creatingPost ? "Đang đăng…" : "Đăng Kèo Ngay"}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* MODAL MÃ QR BARRIER TOÀN MÀN HÌNH */}
 {showQrModal && (
 <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
 <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-sm w-full border border-slate-200 shadow-2xl text-center space-y-4 animate-modal-pop my-auto max-h-[92vh] overflow-y-auto">
 <div className="flex items-center justify-between pb-2 border-b border-slate-100 ">
 <span className="text-[13px] font-black text-slate-900">
 Thẻ Hội Viên QR
 </span>
 <button
 type="button"
 onClick={() => setShowQrModal(false)}
 className="text-slate-500 hover:text-slate-600 p-1"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
 <div className="bg-white p-4 rounded-2xl shadow-md">
 <QrCode className="w-48 h-48 text-slate-950" />
 </div>
 <p className="font-mono text-sm font-black text-sky-700 ">
 {user?.id ? `#SH-${user.id}` : "#SH-GH"} • {userName}
 </p>
 <p className="text-[13px] text-slate-500 max-w-xs">
 Đưa mã này cho chủ sân đối chiếu thông tin của bạn khi tới nhận sân.
 </p>
 </div>

 <button
 type="button"
 onClick={() => {
 setShowQrModal(false);
 showToast("✓ Đã lưu mã QR vào thư viện ảnh thiết bị!");
 }}
 className="w-full py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] shadow-md"
 >
 Lưu Mã Về Điện Thoại
 </button>
 </div>
 </div>
 )}
 </div>
 );
}
