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
import { pitchTypeLabel, isPeakSlot } from "@/lib/pitchLabels";
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

  // Reset sân đang chọn mỗi khi đăng nhập / đăng xuất để không bị tự nhảy vào sân cũ
  useEffect(() => {
    setSelectedPitchForSlot(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("pitchId")) {
        url.searchParams.delete("pitchId");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [user?.email, user?.id]);

  // Phân trang danh sách sân (8 sân / trang)
  const [currentPage, setCurrentPage] = useState(1);
  const PITCHES_PER_PAGE = 8;

 const handleOpenPitch = (pitch: any) => {
   if (!pitch) return;
   setSelectedPitchForSlot(pitch);
   if (typeof window !== "undefined") {
     const url = new URL(window.location.href);
     url.searchParams.set("pitchId", String(pitch.id));
     window.history.pushState({ pitchId: pitch.id }, "", url.toString());
     window.scrollTo({ top: 0, behavior: "smooth" });
   }
 };

 const handleBackFromPitch = () => {
   setSelectedPitchForSlot(null);
   if (typeof window !== "undefined") {
     const url = new URL(window.location.href);
     if (url.searchParams.has("pitchId")) {
       url.searchParams.delete("pitchId");
       window.history.pushState({}, "", url.toString());
     }
     window.scrollTo({ top: 0, behavior: "smooth" });
   }
 };

 // Danh sách sân thật từ Backend
 const [realPitches, setRealPitches] = useState<any[]>([]);
 const [loadingRealPitches, setLoadingRealPitches] = useState(false);

 useEffect(() => {
   const handlePopState = () => {
     if (typeof window === "undefined") return;
     const params = new URLSearchParams(window.location.search);
     const pid = params.get("pitchId");
     if (!pid) {
       setSelectedPitchForSlot(null);
     } else if (realPitches.length > 0) {
       const found = realPitches.find((p) => String(p.id) === pid);
       if (found) setSelectedPitchForSlot(found);
     }
   };
   window.addEventListener("popstate", handlePopState);
   return () => window.removeEventListener("popstate", handlePopState);
 }, [realPitches]);

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

 // Sinh khung giờ theo ĐÚNG thời lượng ca của cụm sân (slotDurationMinutes) — trước đây
 // hardcode 2 tiếng nên với sân 90 phút hiển thị lệch hoàn toàn với ma trận backend.
 const startH = parseInt(openTime.split(":")[0]) || 14;
 const endH = parseInt(closeTime.split(":")[0]) || 22;
 const dynamicSlots: any[] = [];
 const stepMin = slotDur > 0 ? slotDur : 120;
 const openMin = startH * 60;
 const closeMin = endH * 60;
 for (let m = openMin; m + stepMin <= closeMin; m += stepMin) {
 const h = Math.floor(m / 60);
 const mm = m % 60;
 const endTotal = m + stepMin;
 const timeLabel = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")} - ${String(Math.floor(endTotal / 60)).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`;
 // Quy tắc ca GIỜ VÀNG giống backend: bắt đầu 17h/18h/19h (không phải 16-19).
 const isPeak = isPeakSlot(timeLabel);
 dynamicSlots.push({
 time: timeLabel,
 price: `${Math.round((isPeak ? peakPrice : basePrice) / 1000)}k`,
 status: "AVAILABLE",
 tag: isPeak ? "⭐ Ca Vàng" : "Ca Thường"
 });
 }
 if (dynamicSlots.length === 0) {
 dynamicSlots.push(
 { time: "14:00 - 16:00", price: `${Math.round(basePrice / 1000)}k`, status: "AVAILABLE", tag: "Chiều Sớm" },
 { time: "16:00 - 18:00", price: `${Math.round(peakPrice / 1000)}k`, status: "AVAILABLE", tag: "Ca Thường" },
 { time: "18:00 - 20:00", price: `${Math.round(peakPrice / 1000)}k`, status: "AVAILABLE", tag: "⭐ Ca Vàng" },
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

 if (typeof window !== "undefined") {
   const params = new URLSearchParams(window.location.search);
   const pid = params.get("pitchId");
   if (pid) {
     const found = mapped.find((p: any) => String(p.id) === pid);
     if (found) setSelectedPitchForSlot(found);
   }
 }

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
  // Khung giờ (Ca Vàng / Ca Chiều / Ca Đêm)
  if (selectedTimeSlotFilter !== "ALL") {
    const slots: any[] = p.timeSlots ?? [];
    const hit = slots.some((s: any) => {
      if (selectedTimeSlotFilter === "PEAK") return isPeakSlot(s.time);
      if (selectedTimeSlotFilter === "AFTERNOON") return /^(14|16):/.test(s.time);
      if (selectedTimeSlotFilter === "NIGHT") return /^(20|22):/.test(s.time);
      return true;
    });
    if (!hit) return false;
  }
  // Quy mô sân con (mã trong CSDL: SAN_5/SAN_7/SAN_11)
  if (selectedPitchFormat !== "ALL" && !(p.pitchTypes ?? []).includes(selectedPitchFormat)) return false;
  // Chỉ xem cụm sân còn ca trống tối nay
  if (onlyAvailableTonight) {
    const openTonight = (p.timeSlots ?? []).some(
      (s: any) => s.status === "AVAILABLE" && /^(17|18|19|20|21|22):/.test(s.time)
    );
    if (!openTonight) return false;
  }
 return true;
 });

  // Reset về trang 1 khi thay đổi bất kỳ bộ lọc nào
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSport, selectedDistrict, maxBudget, selectedTimeSlotFilter, selectedPitchFormat, onlyAvailableTonight]);

  const totalPages = Math.ceil(filteredPitches.length / PITCHES_PER_PAGE) || 1;
  const paginatedPitches = useMemo(() => {
    const start = (currentPage - 1) * PITCHES_PER_PAGE;
    return filteredPitches.slice(start, start + PITCHES_PER_PAGE);
  }, [filteredPitches, currentPage]);

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
 onBack={handleBackFromPitch}
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
  ? Math.round((picked.priceDiscounted * ((picked.slotDurationMinutes ?? 120) / 60)) / 14)
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
 // Gui MA LOAI SAN THAT tu CSDL (pitchTypes) — truoc day doan ma tu ten san nen
 // sân có cả Sân 5 lại bi coi la chi co Sân 7 (AI tru diem 12 diem).
 pitch_types: (p.pitchTypes && p.pitchTypes.length > 0 ? p.pitchTypes : [p.sport === "SAN5" ? "SAN_5" : p.sport === "SAN11" ? "SAN_11" : "SAN_7"]) as any,
 rating: Number(p.rating ?? 4.5),
 image_url: p.imageUrl ?? null,
 address: p.address ?? null,
 }));
 // Ma loai san chuan cua backend (SAN_*).
 const sportMap: Record<string, string> = { SAN7: "SAN_7", SAN5: "SAN_5", SAN11: "SAN_11", FUTSAL: "FUTSAL", ALL: "SAN_7" };
 const res = await recommendPitches(clusters, {
 max_budget: maxBudget,
 pitch_type: sportMap[selectedSport] ?? "SAN_7",
 top_n: 3,
 });
 // res co the la {status:'ERROR'} (AI loi) -> khong co recommendations -> undefined
 // se lam aiResults.length nem loi va lam trang trong "find san" BI TRANG.
 setAiResults(Array.isArray(res?.recommendations) ? res.recommendations : []);
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

 {/* 1. THANH HỒ SƠ CẦU THỦ & GỢI Ý AI GỌN */}
 <section className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
   <div className="flex flex-wrap items-center justify-between gap-3">
     <div className="flex items-center gap-3 min-w-0">
       <div className="w-11 h-11 rounded-2xl bg-[#0369a1] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
         {userName.charAt(0)}
       </div>
       <div className="min-w-0">
         <h1 className="text-base sm:text-xl font-black text-slate-900 truncate">
           {hasUser ? `Xin chào, ${userName}` : "Tìm & Đặt Sân Turfzone"}
         </h1>
         <div className="flex flex-wrap items-center gap-2 text-[14px] text-slate-600 font-bold mt-0.5">
           <span>⚽ {user?.position ?? "Cầu thủ"}</span>
           <span>•</span>
           <span>📍 {user?.area ?? "Đà Nẵng"}</span>
           {myTeamEntry && (
             <>
               <span>•</span>
               <span className="text-[#0369a1]">🏆 {myTeamEntry.teamName} ({myRecord})</span>
             </>
           )}
         </div>
       </div>
     </div>

     <div className="flex flex-wrap items-center gap-2">
       <button
         type="button"
         onClick={() => setShowQrModal(true)}
         className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-[14px] transition-all flex items-center gap-1.5 cursor-pointer"
       >
         <QrCode className="w-4 h-4 text-[#0369a1]" />
         <span>Mã QR</span>
       </button>
       <button
         type="button"
         onClick={askAiRecommend}
         disabled={aiLoading || realPitches.length === 0}
         className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[14px] shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
       >
         {aiLoading ? (
           <><Loader2 className="w-4 h-4 animate-spin" /><span>Đang lọc…</span></>
         ) : (
           <><Sparkles className="w-4 h-4" /><span>AI Gợi Ý Sân</span></>
         )}
       </button>
     </div>
   </div>

   {aiResults !== null && aiResults.length > 0 && (
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
       {aiResults.map((r, i) => (
         <div key={r.id} className="rounded-xl border border-[#0369a1]/40 bg-sky-50/50 p-3 flex items-center justify-between gap-2">
           <div className="min-w-0">
             <span className="text-[14px] font-black text-sky-800">Top #{i + 1} • {Math.round(r.compatibility_score ?? 0)}đ</span>
             <p className="text-[14px] font-black text-slate-900 truncate">{r.name}</p>
           </div>
           <span className="text-[14px] font-mono font-black text-sky-700 shrink-0">
             {Math.round(Number(r.avg_price_per_hour || 0) / 1000)}k/h
           </span>
         </div>
       ))}
     </div>
   )}
 </section>

 {/* 2. BỘ LỌC TÌM SÂN GỌN */}
 <section className="w-full bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 space-y-3">
   <button
     type="button"
     onClick={() => setShowMobileFilters((v) => !v)}
     aria-expanded={showMobileFilters}
     className="sm:hidden w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-left cursor-pointer"
   >
     <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
       <SlidersHorizontal className="w-4 h-4 text-[#0b4f6c]" />
       Bộ lọc ({activeFilterCount})
     </span>
     <ChevronDown className={`w-4 h-4 transition-transform ${showMobileFilters ? "rotate-180" : ""}`} />
   </button>

   <div className={`${showMobileFilters ? "flex" : "hidden"} sm:flex flex-wrap items-center justify-between gap-2`}>
     <div className="flex items-center gap-1.5 flex-wrap">
       {sportsTabs.map((tab) => (
         <button
           key={tab.id}
           type="button"
           onClick={() => setSelectedSport(tab.id)}
           className={`px-3 py-1.5 rounded-xl text-[14px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
             selectedSport === tab.id
               ? "bg-[#0369a1] text-white shadow-xs"
               : "bg-slate-100 text-slate-700 hover:bg-slate-200"
           }`}
         >
           <span>{tab.icon}</span>
           <span>{tab.name}</span>
         </button>
       ))}
     </div>

     <button
       type="button"
       onClick={() => setOnlyAvailableTonight(!onlyAvailableTonight)}
       className={`px-3 py-1.5 rounded-xl text-[14px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
         onlyAvailableTonight
           ? "bg-[#0369a1]/10 border-[#0369a1] text-sky-700"
           : "bg-slate-50 border-slate-200 text-slate-600"
       }`}
     >
       <span className={`w-2 h-2 rounded-full ${onlyAvailableTonight ? "bg-[#0369a1] animate-ping" : "bg-slate-400"}`} />
       <span>Ca trống tối nay</span>
     </button>
   </div>

   <div className={`${showMobileFilters ? "grid" : "hidden"} sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5`}>
     <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 flex items-center gap-2">
       <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
       <select
         aria-label="Khu vực"
         value={selectedDistrict}
         onChange={(e) => setSelectedDistrict(e.target.value)}
         className="w-full bg-transparent text-[14px] font-bold text-slate-900 focus:outline-none cursor-pointer"
       >
         {districtList.map((d) => (
           <option key={d.id} value={d.id}>{d.name}</option>
         ))}
       </select>
     </div>

     <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 flex items-center gap-2">
       <Clock className="w-4 h-4 text-[#0b4f6c] shrink-0" />
       <select
         aria-label="Khung giờ"
         value={selectedTimeSlotFilter}
         onChange={(e) => setSelectedTimeSlotFilter(e.target.value)}
         className="w-full bg-transparent text-[14px] font-bold text-slate-900 focus:outline-none cursor-pointer"
       >
         <option value="ALL">Mọi khung giờ</option>
         <option value="PEAK">⭐ Giờ vàng (18h - 20h)</option>
         <option value="AFTERNOON">Ca chiều (14h - 18h)</option>
         <option value="NIGHT">Ca tối (20h - 22h)</option>
       </select>
     </div>

     <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 flex items-center gap-2">
       <Layers className="w-4 h-4 text-emerald-500 shrink-0" />
       <select
         aria-label="Loại sân"
         value={selectedPitchFormat}
         onChange={(e) => setSelectedPitchFormat(e.target.value)}
         className="w-full bg-transparent text-[14px] font-bold text-slate-900 focus:outline-none cursor-pointer"
       >
         <option value="ALL">Mọi cỡ sân</option>
         <option value="SAN_7">Sân 7 người</option>
         <option value="SAN_5">Sân 5 người</option>
         <option value="SAN_11">Sân 11 người</option>
       </select>
     </div>

     <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 flex items-center gap-2">
       <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
       <div className="flex-1 min-w-0">
         <div className="flex items-center justify-between text-[14px] font-bold">
           <span className="text-slate-500">Tối đa</span>
           <span className="text-sky-700 font-mono font-black">{Math.round(maxBudget / 1000)}k/h</span>
         </div>
         <input
           type="range"
           min="200000"
           max="800000"
           step="50000"
           value={maxBudget}
           onChange={(e) => setMaxBudget(Number(e.target.value))}
           aria-label="Ngân sách tối đa"
           className="w-full accent-[#0369a1] cursor-pointer h-1.5 mt-1"
         />
       </div>
     </div>
   </div>
 </section>

 {/* 3. DANH SÁCH CỤM SÂN & CHỢ KÈO */}
 <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-6 items-start">
   {pitchLoadError && (
     <div className="xl:col-span-12 flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3.5">
       <div className="flex items-center gap-2 text-[14px] font-bold text-amber-900">
         <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
         <span>{pitchLoadError}</span>
       </div>
       <button
         type="button"
         onClick={fetchPitches}
         disabled={loadingRealPitches}
         className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0369a1] text-white text-[14px] font-bold"
       >
         <RefreshCw className={`w-3.5 h-3.5 ${loadingRealPitches ? "animate-spin" : ""}`} />
         <span>Thử lại</span>
       </button>
     </div>
   )}

   {/* CỘT TRÁI (8 COLS): DANH SÁCH SÂN */}
   <main className="xl:col-span-8 space-y-3 sm:space-y-4">
     <div className="flex items-center justify-between">
       <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
         <span>Danh Sách Cụm Sân ({filteredPitches.length})</span>
       </h2>
     </div>

     <div className="space-y-3 sm:space-y-4">
       {loadingRealPitches ? (
         <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
           <Loader2 className="w-7 h-7 text-[#0b4f6c] animate-spin mx-auto" />
           <p className="text-[14px] font-bold text-slate-500">Đang tải danh sách sân...</p>
         </div>
       ) : filteredPitches.length === 0 ? (
         <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2 shadow-sm">
           <MapPin className="w-7 h-7 text-amber-600 mx-auto" />
           <h3 className="text-base font-black text-slate-900">Không có sân phù hợp bộ lọc</h3>
         </div>
       ) : (
         paginatedPitches.map((pitch) => (
           <article
             key={pitch.id}
             className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-sm sport-card-hover flex flex-col md:flex-row cursor-pointer"
           >
             <div
               onClick={() => handleOpenPitch(pitch)}
               className="md:w-5/12 relative min-h-[150px] md:min-h-[200px] overflow-hidden bg-slate-900"
             >
               <SafeImage
                 src={pitch.imageUrl}
                 alt={pitch.name}
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

               <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                 <span className="px-2.5 py-0.5 rounded-lg bg-slate-900/90 text-white font-extrabold text-[14px] flex items-center gap-1 border border-slate-700">
                   <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                   <span>{pitch.pitchTypes?.[0] ? pitchTypeLabel(pitch.pitchTypes[0]) : pitch.sportBadge}</span>
                 </span>
               </div>

               <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[14px] font-bold">
                 <span className="flex items-center gap-1 truncate">
                   <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                   <span className="truncate">{pitch.districtName}</span>
                 </span>
                 <span className="bg-[#0369a1]/90 px-2 py-0.5 rounded-md text-[14px] font-mono">
                   {pitch.openTime}-{pitch.closeTime}
                 </span>
               </div>
             </div>

             <div className="md:w-7/12 p-3.5 sm:p-5 flex flex-col justify-between space-y-3">
               <div className="space-y-2">
                 <div className="flex items-start justify-between gap-2">
                   <div className="min-w-0">
                     <h3
                       onClick={() => handleOpenPitch(pitch)}
                       className="text-base sm:text-lg font-black text-slate-900 group-hover:text-sky-700 transition-colors truncate"
                     >
                       {pitch.name}
                     </h3>
                     <p className="text-[14px] text-slate-500 font-medium truncate">
                       {pitch.address}
                     </p>
                   </div>
                   {pitch.rating ? (
                     <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0">
                       <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                       <span className="font-extrabold text-[14px] text-slate-900">{pitch.rating}</span>
                     </div>
                   ) : null}
                 </div>

                 {(pitch.amenities ?? []).length > 0 && (
                   <div className="flex flex-wrap gap-1.5">
                     {pitch.amenities.slice(0, 3).map((a: string) => (
                       <span
                         key={a}
                         className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-bold text-[14px] border border-sky-200"
                       >
                         {a}
                       </span>
                     ))}
                   </div>
                 )}
               </div>

               {/* Dải khung giờ gọn */}
               <div className="flex flex-wrap items-center gap-1.5">
                 {pitch.timeSlots.slice(0, 4).map((ts: any, i: number) => (
                   <button
                     key={i}
                     type="button"
                     onClick={() => handleOpenPitch(pitch)}
                     className="px-2.5 py-1 rounded-lg font-mono text-[14px] font-bold bg-slate-100 text-slate-800 hover:bg-[#0369a1] hover:text-white transition-all cursor-pointer"
                   >
                     {ts.time}
                   </button>
                 ))}
               </div>

               <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                 <div className="flex items-baseline gap-1.5">
                   <span className="text-lg font-black text-sky-700 font-mono">
                     {Math.round(pitch.priceDiscounted / 1000)}k
                   </span>
                   <span className="text-[14px] font-bold text-slate-500">/giờ • {pitch.slotDurationMinutes}p/ca</span>
                 </div>

                 <button
                   type="button"
                   onClick={() => handleOpenPitch(pitch)}
                   className="px-4 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[14px] shadow-sm transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                 >
                   <span>Đặt Sân</span>
                   <ChevronRight className="w-4 h-4" />
                 </button>
               </div>
             </div>
           </article>
         ))
       )}

       {/* Phân Trang 8 Sân / Trang */}
       {totalPages > 1 && (
         <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
           <span className="text-[14px] text-slate-500 font-bold">
             Trang {currentPage}/{totalPages} ({filteredPitches.length} sân)
           </span>
           <div className="flex items-center gap-1.5 flex-wrap">
             <button
               type="button"
               disabled={currentPage === 1}
               onClick={() => {
                 setCurrentPage((p) => Math.max(1, p - 1));
                 window.scrollTo({ top: 300, behavior: "smooth" });
               }}
               className="px-3 py-1.5 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
             >
               Trước
             </button>
             {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
               <button
                 key={page}
                 type="button"
                 onClick={() => {
                   setCurrentPage(page);
                   window.scrollTo({ top: 300, behavior: "smooth" });
                 }}
                 className={`w-8 h-8 rounded-xl text-[14px] font-black cursor-pointer ${
                   currentPage === page
                     ? "bg-[#0369a1] text-white"
                     : "border border-slate-200 text-slate-700 hover:bg-slate-50"
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
                 window.scrollTo({ top: 300, behavior: "smooth" });
               }}
               className="px-3 py-1.5 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
             >
               Sau
             </button>
           </div>
         </div>
       )}
     </div>
   </main>

   {/* CỘT PHẢI (4 COLS): CHỢ KÈO & TOP ĐỘI */}
   <aside className="xl:col-span-4 space-y-4">
     <section className="bg-white rounded-2xl sm:rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-[#0369a1] animate-ping" />
           <h3 className="font-black text-slate-900 text-sm">
             Chợ Kèo ({openPosts.length})
           </h3>
         </div>
         <button
           type="button"
           onClick={() => setShowCreateMatchModal(true)}
           className="text-[14px] font-bold text-[#0369a1] hover:underline flex items-center gap-1 cursor-pointer"
         >
           <PlusCircle className="w-3.5 h-3.5" />
           <span>Đăng Kèo</span>
         </button>
       </div>

       {postsLoading ? (
         <p className="p-3 rounded-xl bg-slate-50 text-[14px] text-slate-500 flex items-center gap-2">
           <Loader2 className="w-4 h-4 animate-spin" /> Đang tải…
         </p>
       ) : openPosts.length === 0 ? (
         <p className="p-3 rounded-xl bg-slate-50 text-[14px] text-slate-500">
           Chưa có kèo mở.
         </p>
       ) : (
         openPosts.slice(0, 3).map((p: any) => {
           const label =
             p.pitchType === "FUTSAL" ? "👟 Futsal" :
             p.pitchType === "SAN_5" ? "👟 Sân 5" :
             p.pitchType === "SAN_11" ? "🏟️ Sân 11" : "⚽ Sân 7";
           return (
             <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
               <div className="flex items-center justify-between">
                 <span className="px-2 py-0.5 rounded bg-[#0369a1]/15 text-sky-800 font-black text-[14px]">
                   {label}
                 </span>
                 <span className="font-mono text-[14px] font-bold text-slate-500">
                   {p.matchTime ?? "—"}
                 </span>
               </div>
               <h4 className="font-black text-[14px] text-slate-900 truncate">
                 {p.pitchName ?? "Chưa chọn sân"}
               </h4>
               <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                 <span className="text-[14px] font-bold text-slate-600 truncate pr-2">
                   {p.teamName}
                 </span>
                 <button
                   type="button"
                   onClick={() => handleAcceptFromWidget(p)}
                   className="px-3 py-1 rounded-lg font-bold text-[14px] bg-[#0369a1] hover:bg-[#075985] text-white cursor-pointer shrink-0"
                 >
                   Nhận Kèo
                 </button>
               </div>
             </div>
           );
         })
       )}
     </section>

     <section className="bg-white rounded-2xl sm:rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Trophy className="w-4 h-4 text-amber-600" />
           <h3 className="font-black text-slate-900 text-sm">Top Phong Độ</h3>
         </div>
       </div>

       <div className="space-y-1.5">
         {topTeamsByForm.length === 0 ? (
           <p className="text-[14px] text-slate-500">Chưa có dữ liệu.</p>
         ) : (
           topTeamsByForm.map((tm: any, idx: number) => (
             <div
               key={`${tm.teamName}-${idx}`}
               className={`flex items-center justify-between p-2 rounded-xl text-[14px] ${
                 idx === 0 ? "bg-amber-500/10 border border-amber-500/20" : "bg-slate-50"
               }`}
             >
               <div className="flex items-center gap-2 min-w-0">
                 <span className={`font-black font-mono ${idx === 0 ? "text-amber-700" : "text-slate-500"}`}>
                   #{idx + 1}
                 </span>
                 <span className="font-bold text-slate-900 truncate">{tm.teamName}</span>
               </div>
               <span className="font-mono font-bold text-slate-600 shrink-0">
                 {tm.winRate ?? 0}% thắng
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
 <label className="text-[14px] font-bold text-slate-700 block mb-1">
 Tên Đội / Tiêu đề kèo:
 </label>
 <input
 type="text"
 placeholder="Ví dụ: FC Anh Em Liên Chiểu tìm đối giao lưu vui vẻ"
 value={newMatchTitle}
 onChange={(e) => setNewMatchTitle(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 </div>

 <div>
 <label className="text-[14px] font-bold text-slate-700 block mb-1">
 Sân thi đấu:
 </label>
 <select
 aria-label="Sân thi đấu"
 value={newMatchPitchId}
 onChange={(e) => setNewMatchPitchId(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
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
 <label className="text-[14px] font-bold text-slate-700 block mb-1">
 Khung giờ thi đấu:
 </label>
 <select
 aria-label="Khung giờ thi đấu"
 value={newMatchSlot}
 onChange={(e) => setNewMatchSlot(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
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
 <label className="text-[14px] font-bold text-slate-700 block mb-1">
 Ghi chú / vị trí cần ghép:
 </label>
 <input
 type="text"
 placeholder="Ví dụ: Cần thêm 1 GK bắt gôn + 2 hậu vệ đá cánh"
 value={newMatchNeed}
 onChange={(e) => setNewMatchNeed(e.target.value)}
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 </div>
 </div>

 <div className="pt-2 flex items-center justify-end space-x-2">
 <button
 type="button"
 onClick={() => setShowCreateMatchModal(false)}
 className="px-4 py-2 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-100 "
 >
 Hủy bỏ
 </button>
 <button
 type="button"
 disabled={creatingPost}
 onClick={handleCreateFromWidget}
 className="px-5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] shadow-md transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
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
 <span className="text-[14px] font-black text-slate-900">
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
 <p className="text-[14px] text-slate-500 max-w-xs">
 Đưa mã này cho chủ sân đối chiếu thông tin của bạn khi tới nhận sân.
 </p>
 </div>

 <button
 type="button"
 onClick={() => {
 setShowQrModal(false);
 showToast("✓ Đã lưu mã QR vào thư viện ảnh thiết bị!");
 }}
 className="w-full py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] shadow-md"
 >
 Lưu Mã Về Điện Thoại
 </button>
 </div>
 </div>
 )}
 </div>
 );
}
