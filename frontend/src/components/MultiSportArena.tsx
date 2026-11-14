"use client";

import React, { useState, useEffect } from 'react';
import { 
 Trophy, 
 Users, 
 Calendar, 
 Clock, 
 ShieldCheck, 
 Zap, 
 Plus, 
 CheckCircle2, 
 Flame, 
 SlidersHorizontal,
 ChevronRight,
 Sparkles,
 Search,
 Check,
 Video,
 Activity,
 QrCode
} from 'lucide-react';

import { API_BASE_URL, apiRequest, ensureLoggedIn, fetchWithTimeout } from '@/lib/api';
import { pitchTypeLabel } from "@/lib/pitchLabels";
import { broadcastBookingEvent } from "@/lib/realtimeService";
import SafeImage from "@/components/SafeImage";
import { getPitchVisual } from "@/lib/pitchVisuals";
import { Camera } from "lucide-react";

interface Court {
 id: string;
 name: string;
 fieldType: 'san5' | 'san7' | 'san11' | 'futsal';
 fieldLabel: string;
 surface: string;
 status: 'available' | 'matching' | 'live' | 'booked';
 liveScore?: string;
 pricePerHour: number;
 features: string[];
 currentPlayers?: number;
 maxPlayers?: number;
}

interface MatchQueue {
 id: string;
 title: string;
 time: string;
 court: string;
 formInfo: string;
 currentPlayers: number;
 maxPlayers: number;
 costPerPerson: number;
 hostName: string;
 hostAvatar: string;
 hostForm: string;
 category: string;
}

export default function MultiSportArena({
 user,
 onNavigateToBooking,
 onNavigateToChokego,
}: {
 user?: any;
 onNavigateToBooking?: () => void;
 onNavigateToChokego?: () => void;
} = {}) {
 const [activeFilter, setActiveFilter] = useState<'all' | 'san5' | 'san7' | 'san11' | 'futsal'>('all');
 const [bookingCourt, setBookingCourt] = useState<Court | null>(null);
 const [directCustomer, setDirectCustomer] = useState("");
 const [directPhone, setDirectPhone] = useState("");
 const [directTimeSlot, setDirectTimeSlot] = useState("18:00 - 20:00");
 const [directDeposit, setDirectDeposit] = useState("");
 const [directPaymentMethod, setDirectPaymentMethod] = useState("TIEN_MAT");
 const [directNote, setDirectNote] = useState("");
 const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);
 const [joiningMatch, setJoiningMatch] = useState<MatchQueue | null>(null);

 // Form hien INLINE (khong popup) -> tu cuon toi khi mo.
 useEffect(() => {
  if (!bookingCourt && !joiningMatch) return;
  const raf = requestAnimationFrame(() => {
   document.querySelector('[id^="inline-bookingcourt"], [id^="inline-joiningmatch"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  return () => cancelAnimationFrame(raf);
 }, [bookingCourt, joiningMatch]);
 const [successToast, setSuccessToast] = useState<string | null>(null);

 // ---- Dữ liệu thật  ----
 const [courts, setCourts] = useState<Court[]>([]);
 const [loadingCourts, setLoadingCourts] = useState(true);
 const [matchQueues, setMatchQueues] = useState<MatchQueue[]>([]);
 const [loadingMatches, setLoadingMatches] = useState(true);

 const fieldKind = (p: any): Court['fieldType'] => {
 const t = `${(p.pitchTypes || []).join(' ')} ${p.type || ''}`;
 if (/futsal|gỗ|go /i.test(t)) return 'futsal';
 if (/11/i.test(t)) return 'san11';
 if (/(^|\D)5(\D|$)/i.test(t)) return 'san5';
 return 'san7';
 };

 const FIELD_LABEL: Record<Court['fieldType'], string> = {
 san5: 'Sân 5 Người',
 san7: 'Sân 7 Người',
 san11: 'Sân 11 Người',
 futsal: 'Futsal Trong Nhà',
 };

 // Sân thật: GET /api/v1/pitches
 const loadCourts = async () => {
 try {
 const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/pitches`);
 const data = await res.json();
 const list: any[] = Array.isArray(data) ? data : [];
 setCourts(
 list.map((p) => {
 const kind = fieldKind(p);
 return {
 id: `P${p.id}`,
 name: p.name || `Cụm sân #${p.id}`,
 fieldType: kind,
 fieldLabel: FIELD_LABEL[kind],
 surface: p.pitchTypes?.length ? p.pitchTypes.map(pitchTypeLabel).join(' · ') : 'Chưa khai báo loại mặt sân',
 status: 'available',
 pricePerHour: p.avgPricePerHour ?? 0,
 features: p.amenities?.length ? p.amenities : [],
 } as Court;
 })
 );
 } catch (e) {
 console.warn('Không tải được danh sách sân:', e);
 setCourts([]);
 } finally {
 setLoadingCourts(false);
 }
 };

 // Kèo đang mở thật: GET /api/v1/community/matchmaking-posts
 const loadMatches = async () => {
 try {
 const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/community/matchmaking-posts`);
 const data = await res.json();
 const list: any[] = Array.isArray(data) ? data : [];
 setMatchQueues(
 list
 .filter((p) => p.status === 'OPEN')
 .map((p) => ({
 id: String(p.id),
 title: p.note ? `${p.teamName} • ${p.note}` : `${p.teamName} đang tìm đối`,
 time: p.matchTime || 'Chưa chọn khung giờ',
 court: p.pitchName || 'Chưa chọn sân',
 formInfo: p.record && p.record !== "0-0-0" ? `Thành tích ${p.record}` : 'Tân binh chưa có lịch sử',
 currentPlayers: 0,
 maxPlayers: 0,
 costPerPerson: p.estimatedFee ?? 0,
 hostName: p.captainName || p.teamName || 'Chưa cập nhật',
 hostAvatar: '',
 hostForm: p.form ?? '',
 category:
 p.pitchType === 'FUTSAL'
 ? 'Futsal'
 : p.pitchType === 'SAN_5'
 ? 'Sân 5'
 : p.pitchType === 'SAN_11'
 ? 'Sân 11'
 : 'Kèo Phủi Sân 7',
 }))
 );
 } catch (e) {
 console.warn('Không tải được danh sách kèo:', e);
 setMatchQueues([]);
 } finally {
 setLoadingMatches(false);
 }
 };

 useEffect(() => {
 loadCourts();
 loadMatches();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const [accepting, setAccepting] = useState(false);

  const handleDirectBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCourt) return;
    if (!directCustomer.trim() || !directPhone.trim()) {
      handleActionToast("❌ Vui lòng nhập tên khách và số điện thoại!");
      return;
    }
    setIsSubmittingDirect(true);
    try {
      const defaultPrice = bookingCourt.pricePerHour * 2;
      const depositAmount = Number(directDeposit) || 0;
      await apiRequest("/api/v1/pitches/1/offline-booking", {
        method: "POST",
        body: JSON.stringify({
          courtName: bookingCourt.name,
          timeSlot: directTimeSlot,
          customerName: directCustomer.trim(),
          customerPhone: directPhone.trim(),
          price: defaultPrice,
          depositPaid: depositAmount,
          paymentMethod: directPaymentMethod,
          note: directNote.trim() || "Chủ sân đăng ký trực tiếp tại quầy",
          bookingDate: new Date().toISOString().split("T")[0],
        }),
      });
      setCourts((prev) =>
        prev.map((c) =>
          c.id === bookingCourt.id ? { ...c, status: "booked" } : c
        )
      );
      try {
        broadcastBookingEvent({
          type: "BOOKING_CREATED",
          pitchId: 1,
          courtName: bookingCourt.name,
          timeSlot: directTimeSlot,
          customerName: directCustomer.trim(),
          customerPhone: directPhone.trim(),
          totalPrice: defaultPrice,
          via: "Chủ sân đăng ký trực tiếp",
        });
      } catch {}
      handleActionToast(`🎉 Đã đăng ký thành công ca [${directTimeSlot}] cho ${directCustomer.trim()} tại ${bookingCourt.name}!`);
      setBookingCourt(null);
      setDirectCustomer("");
      setDirectPhone("");
      setDirectDeposit("");
      setDirectNote("");
    } catch (err: any) {
      handleActionToast(`❌ Lỗi đăng ký ca: ${err.message || "Không thể lưu"}`);
    } finally {
      setIsSubmittingDirect(false);
    }
  };

 const handleActionToast = (msg: string) => {
 setSuccessToast(msg);
 setTimeout(() => setSuccessToast(null), 4000);
 };

 // Nhận kèo thật: POST /api/v1/community/matchmaking-posts/{id}/accept
 const handleAcceptMatch = async () => {
 if (!joiningMatch) return;
 if (!user?.phone) {
 handleActionToast("Bạn cần đăng nhập (có số điện thoại) để nhận kèo này.");
 return;
 }
 setAccepting(true);
 try {
 if (!ensureLoggedIn('nhận kèo')) return;
 // apiRequest tự gắn Authorization — endpoint nhận kèo yêu cầu đăng nhập
 await apiRequest(
 `/api/v1/community/matchmaking-posts/${joiningMatch.id}/accept`,
 {
 method: "POST",
 body: JSON.stringify({
 opponentTeamName: user.fullName || user.name || "Đội của tôi",
  opponentCaptainName: user.fullName || user.name || "",
 opponentCaptainPhone: user.phone,
 }),
 }
 );
 handleActionToast(`Đã nhận kèo ${joiningMatch.id} thành công — kèo đã chốt .`);
 loadMatches();
 } catch (e: any) {
 handleActionToast(e?.message || "Không nhận được kèo (kèo có thể đã có người khác chốt).");
 } finally {
 setAccepting(false);
 setJoiningMatch(null);
 }
 };

 const filteredCourts = courts.filter(c => {
 if (activeFilter === 'all') return true;
 return c.fieldType === activeFilter;
 });

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 p-3 sm:p-6 lg:p-8">
 {/* Toast Notification */}
 {successToast && (
 <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:top-6 sm:right-6 z-50 bg-[#0369a1] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 border border-sky-400 animate-bounce">
 <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
 <span className="font-semibold">{successToast}</span>
 </div>
 )}

 {/* Top Header Banner */}
 <div className="w-full mb-8">
 <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 text-slate-900 shadow-xl relative overflow-hidden">
 <div className="absolute top-0 right-0 w-96 h-96 bg-[#0369a1]/10 rounded-full blur-3xl pointer-events-none"></div>

 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-6 relative z-10">
 <div>
 <div className="flex items-center space-x-3 mb-3">
 <span className="bg-[#0369a1]/10 text-sky-800 border border-[#0369a1]/30 text-[14px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
 <ShieldCheck className="w-3.5 h-3.5" /> Trực tiếp
 </span>
 <span className="bg-[#0369a1]/10 text-sky-700 border border-[#0369a1]/30 text-[14px] font-bold px-3 py-1 rounded-full">
 {courts[0]?.name || "Chưa có cụm sân nào"}
 </span>
 </div>
 <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-slate-900 ">
 Cụm Sân Bóng Đá
 </h1>
 <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl hidden sm:block">
 
 </p>
 </div>

 {/* Field Type Selector Tabs */}
 <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2 self-start lg:self-auto">
 {[
 { id: 'all', label: 'Tất Cả Sân' },
 { id: 'san5', label: '⚽ Sân 5 Người' },
 { id: 'san7', label: '⚽ Sân 7 Người' },
 { id: 'san11', label: '🏟️ Sân 11 Người' },
 { id: 'futsal', label: '👟 Futsal Trong Nhà' },
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveFilter(tab.id as any)}
 className={`px-3.5 py-2 rounded-lg text-[14px] font-extrabold transition-all ${
 activeFilter === tab.id
 ? 'bg-[#0369a1] text-white shadow-lg'
 : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200 '
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>
 </div>

 {/* Quick Stats Strip — số liệu đếm trực tiếp  */}
 <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 min-w-0">
 <div className="text-lg sm:text-2xl font-bold text-emerald-600">{courts.length} Sân</div>
 <div className="text-[14px] text-slate-500 mt-0.5 break-words">Đang hoạt động</div>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 min-w-0">
 <div className="text-lg sm:text-2xl font-bold text-sky-700">{matchQueues.length} Kèo Mở</div>
 <div className="text-[14px] text-slate-500 mt-0.5 break-words">Chờ ghép đối thủ</div>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 min-w-0">
 <div className="text-lg sm:text-2xl font-bold text-cyan-700">5 · 7 · 11</div>
 <div className="text-[14px] text-slate-500 mt-0.5 break-words">Loại mặt sân đang khai thác</div>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 min-w-0">
 <div className="text-lg sm:text-2xl font-bold text-amber-600">Cọc 50%</div>
 <div className="text-[14px] text-slate-500 mt-0.5 break-words">Thanh toán qua VietQR khi đặt</div>
 </div>
 </div>
 </div>
 </div>

 {/* Main Grid Section */}
 <div className="w-full space-y-4 sm:space-y-8">

 {/* Section 1: Court Matrix Filter & Legend */}
 <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-md">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-6">
 <div>
 <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
 <Activity className="w-5 h-5 text-emerald-500" />
 <span>Trạng Thái Các Sân Bóng Trực Tiếp</span>
 </h2>
 <p className="text-[14px] sm:text-sm text-slate-500 mt-1 hidden sm:block">
 
 </p>
 </div>
 </div>

 {/* Color Legend Bar */}
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3 sm:gap-4 text-[14px]">
 <div className="flex items-center space-x-6 flex-wrap gap-y-2">
 <div className="flex items-center space-x-2">
 <span className="w-3 h-3 rounded-full bg-[#0369a1]"></span>
 <span className="font-medium text-slate-700 ">Xanh Emerald: đang mở đặt ca</span>
 </div>
 <div className="flex items-center space-x-2">
 <span className="w-3 h-3 rounded-full bg-slate-400"></span>
 <span className="font-medium text-slate-700 ">Xám: không khả dụng</span>
 </div>
 </div>

 <div className="text-slate-500 text-[14px] flex items-center">
 <QrCode className="w-4 h-4 mr-1 text-emerald-500" /> Thanh toán cọc VietQR khi đặt
 </div>
 </div>

 {/* Courts Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
 {loadingCourts ? (
 <p className="col-span-full text-sm text-slate-500 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 ">
 Đang tải danh sách sân …
 </p>
 ) : filteredCourts.length === 0 ? (
 <p className="col-span-full text-sm text-slate-500 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 ">
 Chưa có sân nào khớp bộ lọc này .
 </p>
 ) : null}
 {filteredCourts.map((court) => (
 <div
 key={court.id}
 className={`rounded-xl border p-3 sm:p-4 transition-all duration-200 flex flex-col justify-between relative ${
 court.status === 'available'
 ? 'border-sky-300 bg-sky-50/40 hover:shadow-lg hover:border-emerald-500'
 : court.status === 'matching'
 ? 'border-amber-300 bg-amber-50/40 hover:shadow-lg hover:border-amber-500'
 : court.status === 'live'
 ? 'border-red-300 bg-red-50/40 hover:shadow-lg'
 : 'border-slate-200 bg-slate-100 opacity-80'
 }`}
 >
 {/* Court Top Badge & Status */}
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="font-extrabold text-base text-slate-900 ">
 {court.id}
 </span>
 {court.status === 'available' && (
 <span className="bg-[#0369a1]/20 text-sky-800 text-[14px] font-bold px-2.5 py-0.5 rounded-full border border-[#0369a1]/30 flex items-center gap-1">
 <Check className="w-3 h-3" /> Ca Trống
 </span>
 )}
 {court.status === 'matching' && (
 <span className="bg-amber-500/20 text-amber-700 text-[14px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
 <Users className="w-3 h-3" /> Ghép Kèo ({court.currentPlayers}/{court.maxPlayers})
 </span>
 )}
 {court.status === 'live' && (
 <span className="bg-red-500/20 text-red-600 text-[14px] font-bold px-2.5 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1 animate-pulse">
 <Flame className="w-3 h-3" /> Đang Diễn Ra
 </span>
 )}
 {court.status === 'booked' && (
 <span className="bg-slate-200 text-slate-600 text-[14px] font-bold px-2.5 py-0.5 rounded-full">
 Đã Khóa Sân
 </span>
 )}
 </div>

 {/* Ảnh sân con trực quan (Không có nhãn Rê xem ảnh) */}
 <div className="w-full h-32 rounded-lg overflow-hidden relative bg-slate-900 mb-2.5 group">
   <SafeImage
     src={getPitchVisual(court.fieldType).imageUrl}
     alt={court.name}
     className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
   />
   <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
   <div className="absolute top-2 left-2">
     <span className={`px-2 py-0.5 rounded text-[12px] font-bold border shadow-xs ${getPitchVisual(court.fieldType).badgeBg} ${getPitchVisual(court.fieldType).badgeText} ${getPitchVisual(court.fieldType).badgeBorder}`}>
       {getPitchVisual(court.fieldType).shortLabel}
     </span>
   </div>
   <div className="absolute bottom-2 left-2 right-2 text-white flex items-center justify-between text-[12px]">
     <span className="font-mono text-slate-200 font-bold bg-slate-950/70 px-2 py-0.5 rounded">{getPitchVisual(court.fieldType).dimensions}</span>
   </div>
 </div>

 <h3 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1 flex items-center gap-1.5">
   <span>{court.name}</span>
   <Camera className="w-3.5 h-3.5 text-slate-400 shrink-0" />
 </h3>

 <div className="text-[14px] text-slate-500 space-y-1 mb-3">
 <div>⚽ <span className="font-semibold text-slate-700 ">{court.fieldLabel}</span></div>
 <div>🌱 {court.surface}</div>
 </div>

 {/* Live score if active */}
 {court.status === 'live' && court.liveScore && (
 <div className="bg-red-950/40 border border-red-500/30 p-2.5 rounded-lg mb-3 text-[14px] text-red-200 font-mono">
 <div className="flex items-center text-[14px] text-red-400 font-sans mb-1 tracking-wider font-bold">
 <Video className="w-3 h-3 mr-1" /> Trận Đấu Trực Tiếp
 </div>
 {court.liveScore}
 </div>
 )}

 {/* Features tags */}
 <div className="flex flex-wrap gap-1 mb-4">
 {court.features.length === 0 ? (
 <span className="text-[14px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
 Chưa khai báo tiện ích
 </span>
 ) : (
 court.features.map((feat, i) => (
 <span key={i} className="text-[14px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
 {feat}
 </span>
 ))
 )}
 </div>
 </div>

 {/* Bottom Action */}
 <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
 <div>
 <span className="text-[14px] text-slate-500">Giá ca:</span>
 <div className="text-sm font-extrabold text-sky-700 ">
 {court.pricePerHour.toLocaleString()}đ<span className="text-[14px] font-normal text-slate-500">/giờ</span>
 </div>
 </div>

 {court.status === 'available' && (
 <button
 onClick={() => {
   setBookingCourt(court);
   setDirectCustomer("");
   setDirectPhone("");
   setDirectDeposit("");
   setDirectNote("");
 }}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold px-3.5 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
 title="Đăng ký ca sân trực tiếp cho khách vãng lai hoặc chủ sân giữ ca"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>+ Đăng Ký Ca</span>
 </button>
 )}

 {court.status === 'matching' && (
 <button
 onClick={() => handleActionToast(`Bạn đã gửi yêu cầu tham gia ghép đội tại ${court.id}!`)}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold px-3 py-2 rounded-lg shadow transition"
 >
 Vào Kèo Ngay
 </button>
 )}

 {court.status === 'live' && (
 <button
 onClick={() => handleActionToast(`Đang kết nối camera AI VAR live stream ${court.id}...`)}
 className="bg-rose-600 hover:bg-rose-700 text-white text-[14px] font-bold px-3 py-2 rounded-lg shadow transition flex items-center gap-1"
 >
 <Video className="w-3 h-3" /> Xem VAR Live
 </button>
 )}

 {court.status === 'booked' && (
 <span className="text-[14px] text-slate-500 font-medium italic">Không khả dụng</span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Section 2: Football Matchmaking Queue */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
 <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-md">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
 <Zap className="w-5 h-5 text-amber-700" />
 <span>Sàn Ghép Kèo Đội Bóng Đá Phủi</span>
 </h2>
 <p className="text-[14px] sm:text-sm text-slate-500 mt-1 hidden sm:block">
 
 </p>
 </div>

 <button
 onClick={() => onNavigateToChokego?.()}
 className="bg-gradient-to-r from-[#0369a1] to-[#075985] hover:from-[#075985] hover:to-[#0369a1] text-white text-[14px] font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 transition"
 >
 <Plus className="w-4 h-4" />
 <span>+ Tạo Kèo Mới</span>
 </button>
 </div>

 {/* Queue Cards */}
 <div className="space-y-3 sm:space-y-4">
 {loadingMatches ? (
 <p className="text-sm text-slate-500 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 ">
 Đang tải kèo …
 </p>
 ) : matchQueues.length === 0 ? (
 <p className="text-sm text-slate-500 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 ">
 Chưa có kèo nào đang mở. Vào tab <strong>Chợ Kèo</strong> để đăng đội của bạn.
 </p>
 ) : null}
 {matchQueues.map((match) => (
 <div
 key={match.id}
 className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-5 hover:border-amber-400/50 transition-all duration-200"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
 <div className="flex items-start space-x-4">
 <div className="w-12 h-12 rounded-full border-2 border-[#0369a1] bg-[#0369a1] text-white flex items-center justify-center font-black text-sm flex-shrink-0">
 {(match.hostName || "?").trim().charAt(0).toUpperCase()}
 </div>
 <div>
 <div className="flex items-center space-x-2">
 <span className="bg-amber-400/20 text-amber-600 text-[14px] font-bold px-2 py-0.5 rounded border border-amber-400/30">
 {match.category}
 </span>
 <span className="text-[14px] text-slate-500">
 Đội Trưởng: <span className="font-semibold text-slate-800 ">{match.hostName}</span> ({match.hostForm ? `phong độ ${match.hostForm}` : "tân binh"})
 </span>
 </div>

 <h3 className="font-bold text-slate-900 text-base mt-1">
 {match.title}
 </h3>

 <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-[14px] text-slate-500">
 <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-emerald-500" /> {match.time}</span>
 <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#0369a1]" /> {match.court}</span>
 <span className="flex items-center"><Trophy className="w-3.5 h-3.5 mr-1 text-amber-700" /> Yêu cầu: {match.formInfo}</span>
 </div>
 </div>
 </div>

 <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 ">
 <div className="text-left sm:text-right mb-2">
 <div className="text-[14px] text-slate-500">Chi phí / cầu thủ:</div>
 <div className="text-lg font-black text-sky-700 ">
 {match.costPerPerson.toLocaleString()}đ
 </div>
 </div>

 <button
 onClick={() => setJoiningMatch(match)}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold px-4 py-2 rounded-lg shadow transition flex items-center space-x-1"
 >
 <span>Gia Nhập Đội</span>
 <ChevronRight className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Section 3: Tiện ích thật từ hồ sơ sân (bảng pitch_amenities) */}
 <div className="space-y-3 sm:space-y-6">
 <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-md">
 <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
 <Sparkles className="w-5 h-5 text-emerald-500" />
 <span>Tiện Ích Cụm Sân Trong Hồ Sơ</span>
 </h2>

 {(() => {
 const amenities = Array.from(
 new Set(courts.flatMap((c) => c.features))
 ).slice(0, 8);
 if (loadingCourts) {
 return <p className="text-sm text-slate-500">Đang tải tiện ích …</p>;
 }
 if (amenities.length === 0) {
 return (
 <p className="text-sm text-slate-500">
 Chủ sân chưa khai báo tiện ích trong hồ sơ.
 </p>
 );
 }
 return (
 <div className="flex flex-wrap gap-2">
 {amenities.map((a) => (
 <span
 key={a}
 className="text-[14px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1.5 rounded-lg"
 >
 {a}
 </span>
 ))}
 </div>
 );
 })()}

 <p className="text-[14px] text-slate-500 mt-4 leading-relaxed hidden sm:block">
 Dịch vụ thuê áo, bóng hay trọng tài do từng cụm sân cung cấp — hỏi trực tiếp chủ
 sân theo số điện thoại trong hồ sơ khi tới nhận sân.
 </p>
 </div>

 </div>
 </div>

 </div>

 {/* Form Đăng Ký Ca Sân Trực Tiếp Cho Chủ Sân (Inline 100%, Không modal che màn hình) */}
  {bookingCourt && (
  <div id="inline-bookingcourt" className="w-full animate-fade-in my-6">
    <div className="bg-white border-2 border-sky-400 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-md space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0369a1] flex items-center justify-center font-bold">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-900">
              Đăng Ký Ca Trực Tiếp Tại Quầy: {bookingCourt.name} ({bookingCourt.id})
            </h3>
            <p className="text-[13px] text-slate-500">
              Dành cho khách vãng lai đến sân đá trực tiếp hoặc Chủ Sân đăng ký giữ ca
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setBookingCourt(null)}
          className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-md hover:bg-slate-100 cursor-pointer"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleDirectBookingSubmit} className="space-y-4">
        {/* Thông tin tóm tắt sân */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[13px]">
          <div>
            <span className="text-slate-500 block">Loại sân:</span>
            <strong className="text-slate-800">{bookingCourt.fieldLabel}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Mặt sân:</span>
            <strong className="text-slate-800">{bookingCourt.surface}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Đơn giá:</span>
            <strong className="text-[#0369a1] font-mono">{bookingCourt.pricePerHour.toLocaleString()}đ/h</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Giá ca 2 tiếng:</span>
            <strong className="text-emerald-700 font-mono font-bold">{(bookingCourt.pricePerHour * 2).toLocaleString()}đ</strong>
          </div>
        </div>

        {/* Khung giờ thi đấu */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 text-[13px] block">Khung Giờ Thi Đấu:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {["14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"].map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setDirectTimeSlot(slot)}
                className={`py-2 px-2.5 rounded-lg text-[13px] font-bold border transition-colors cursor-pointer text-center ${
                  directTimeSlot === slot
                    ? "bg-[#0369a1] text-white border-[#0369a1] shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Tên khách & SĐT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 text-[13px] block">
              Tên Khách Hàng / Đội Bóng: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={directCustomer}
              onChange={(e) => setDirectCustomer(e.target.value)}
              placeholder="VD: FC Anh Ba (hoặc Tên Khách)"
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 text-[13px] focus:outline-none focus:border-[#0369a1]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 text-[13px] block">
              Số Điện Thoại Liên Hệ: <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={directPhone}
              onChange={(e) => setDirectPhone(e.target.value)}
              placeholder="VD: 0912 345 678"
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900 text-[13px] focus:outline-none focus:border-[#0369a1]"
            />
          </div>
        </div>

        {/* Tiền cọc & Phương thức thanh toán */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 text-[13px] block">
              Tiền Đã Nhận / Cọc Trước (VNĐ):
            </label>
            <input
              type="number"
              value={directDeposit}
              onChange={(e) => setDirectDeposit(e.target.value)}
              placeholder="VD: 200000 (hoặc 0 nếu thanh toán sau)"
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900 text-[13px] focus:outline-none focus:border-[#0369a1]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 text-[13px] block">
              Hình Thức Thanh Toán:
            </label>
            <select
              value={directPaymentMethod}
              onChange={(e) => setDirectPaymentMethod(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 text-[13px] focus:outline-none focus:border-[#0369a1] cursor-pointer"
            >
              <option value="TIEN_MAT">Tiền mặt tại quầy</option>
              <option value="VIETQR">Chuyển khoản VietQR</option>
              <option value="CHUA_THANH_TOAN">Chưa thanh toán (Thu sau trận)</option>
            </select>
          </div>
        </div>

        {/* Ghi chú */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 text-[13px] block">Ghi Chú Ca Sân (Tùy chọn):</label>
          <input
            type="text"
            value={directNote}
            onChange={(e) => setDirectNote(e.target.value)}
            placeholder="VD: Khách lấy thêm 1 lốc nước suối, mượn 2 áo bib..."
            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-[13px] focus:outline-none focus:border-[#0369a1]"
          />
        </div>

        {/* Nút bấm hành động */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setBookingCourt(null)}
            className="px-4 py-2.5 rounded-lg border border-slate-300 font-bold text-[13px] text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmittingDirect}
            className="px-5 py-2.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmittingDirect ? "Đang lưu ca..." : "💾 Xác Nhận Khóa Ca Sân"}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
  )}

 {/* Match Joining Modal */}
 {joiningMatch && (
 <div id="inline-joiningmatch" className="w-full animate-fade-in">
 <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-5">
 <div className="flex items-center justify-between border-b border-slate-200 pb-3">
 <h3 className="font-extrabold text-lg text-slate-900 ">
 Gia Nhập Kèo {joiningMatch.category}
 </h3>
 <button
 onClick={() => setJoiningMatch(null)}
 className="text-slate-500 hover:text-slate-700 text-xl font-bold"
 >
 ✕
 </button>
 </div>

 <div className="space-y-3 text-sm text-slate-600 ">
 <div className="font-bold text-slate-900 ">{joiningMatch.title}</div>
 <div className="flex justify-between">
 <span>Thời gian & Sân:</span>
 <span className="font-medium text-emerald-500">{joiningMatch.time} ({joiningMatch.court})</span>
 </div>
 <div className="flex justify-between">
 <span>Phong độ đội chủ kèo:</span>
 <span className="font-bold">{joiningMatch.formInfo}</span>
 </div>
 <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-900 ">
 <span>Mức chia tiền sân:</span>
 <span className="text-amber-700">{joiningMatch.costPerPerson.toLocaleString()}đ / cầu thủ</span>
 </div>
 </div>

 <div className="flex space-x-3 pt-2">
 <button
 onClick={() => setJoiningMatch(null)}
 className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-[14px] text-slate-700 hover:bg-slate-100 "
 >
 Để Sau
 </button>
 <button
 onClick={handleAcceptMatch}
 disabled={accepting}
 className="w-1/2 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] shadow-lg transition disabled:opacity-60"
 >
 {accepting ? "Đang chốt..." : "Xác Nhận Tham Gia"}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

