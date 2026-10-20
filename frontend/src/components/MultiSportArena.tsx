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

 // ---- Dữ liệu thật từ CSDL ----
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
 surface: p.pitchTypes?.length ? p.pitchTypes.join(' · ') : 'Chưa khai báo loại mặt sân',
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
 opponentCaptainPhone: user.phone,
 }),
 }
 );
 handleActionToast(`Đã nhận kèo ${joiningMatch.id} thành công — kèo đã chốt trong CSDL.`);
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
 <span className="bg-[#0369a1]/10 text-sky-800 border border-[#0369a1]/30 text-[13px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
 <ShieldCheck className="w-3.5 h-3.5" /> Danh sách đọc từ CSDL
 </span>
 <span className="bg-[#0369a1]/10 text-sky-700 border border-[#0369a1]/30 text-[13px] font-bold px-3 py-1 rounded-full">
 {courts[0]?.name || "Chưa có cụm sân nào"}
 </span>
 </div>
 <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-slate-900 ">
 Ma Trận Cụm Sân Bóng Đá
 </h1>
 <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl hidden sm:block">
 Đặt ca sân 5, sân 7, sân 11 và Futsal trong nhà tự động 24/7. Tìm đối thủ ghép trận theo phong độ, giữ chỗ tức thì qua mã đặt chỗ.
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
 className={`px-3.5 py-2 rounded-lg text-[13px] font-extrabold transition-all ${
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

 {/* Quick Stats Strip — số liệu đếm trực tiếp từ CSDL */}
 <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 min-w-0">
 <div className="text-lg sm:text-2xl font-bold text-emerald-600">{courts.length} Sân</div>
 <div className="text-[13px] text-slate-500 mt-0.5 break-words">Đang hoạt động</div>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 min-w-0">
 <div className="text-lg sm:text-2xl font-bold text-sky-700">{matchQueues.length} Kèo Mở</div>
 <div className="text-[13px] text-slate-500 mt-0.5 break-words">Chờ ghép đối thủ</div>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 min-w-0">
 <div className="text-lg sm:text-2xl font-bold text-cyan-700">5 · 7 · 11</div>
 <div className="text-[13px] text-slate-500 mt-0.5 break-words">Loại mặt sân đang khai thác</div>
 </div>
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 min-w-0">
 <div className="text-lg sm:text-2xl font-bold text-amber-600">Cọc 50%</div>
 <div className="text-[13px] text-slate-500 mt-0.5 break-words">Thanh toán qua VietQR khi đặt</div>
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
 <p className="text-[13px] sm:text-sm text-slate-500 mt-1 hidden sm:block">
 Danh sách cụm sân trực tiếp từ hệ thống. Bấm “Đặt Ca” để giữ chỗ thật.
 </p>
 </div>
 </div>

 {/* Color Legend Bar */}
 <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3 sm:gap-4 text-[13px]">
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

 <div className="text-slate-500 text-[13px] flex items-center">
 <QrCode className="w-4 h-4 mr-1 text-emerald-500" /> Thanh toán cọc VietQR khi đặt
 </div>
 </div>

 {/* Courts Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
 {loadingCourts ? (
 <p className="col-span-full text-sm text-slate-500 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 ">
 Đang tải danh sách sân từ CSDL…
 </p>
 ) : filteredCourts.length === 0 ? (
 <p className="col-span-full text-sm text-slate-500 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 ">
 Chưa có sân nào khớp bộ lọc này trong CSDL.
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
 <span className="bg-[#0369a1]/20 text-sky-800 text-[13px] font-bold px-2.5 py-0.5 rounded-full border border-[#0369a1]/30 flex items-center gap-1">
 <Check className="w-3 h-3" /> Ca Trống
 </span>
 )}
 {court.status === 'matching' && (
 <span className="bg-amber-500/20 text-amber-700 text-[13px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
 <Users className="w-3 h-3" /> Ghép Kèo ({court.currentPlayers}/{court.maxPlayers})
 </span>
 )}
 {court.status === 'live' && (
 <span className="bg-red-500/20 text-red-600 text-[13px] font-bold px-2.5 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1 animate-pulse">
 <Flame className="w-3 h-3" /> Live Score
 </span>
 )}
 {court.status === 'booked' && (
 <span className="bg-slate-200 text-slate-600 text-[13px] font-bold px-2.5 py-0.5 rounded-full">
 Đã Khóa Sân
 </span>
 )}
 </div>

 <h3 className="font-bold text-sm text-slate-800 line-clamp-1 mb-1">
 {court.name}
 </h3>

 <div className="text-[13px] text-slate-500 space-y-1 mb-3">
 <div>⚽ <span className="font-semibold text-slate-700 ">{court.fieldLabel}</span></div>
 <div>🌱 {court.surface}</div>
 </div>

 {/* Live score if active */}
 {court.status === 'live' && court.liveScore && (
 <div className="bg-red-950/40 border border-red-500/30 p-2.5 rounded-lg mb-3 text-[13px] text-red-200 font-mono">
 <div className="flex items-center text-[13px] text-red-400 font-sans mb-1 tracking-wider font-bold">
 <Video className="w-3 h-3 mr-1" /> Trận Đấu Trực Tiếp
 </div>
 {court.liveScore}
 </div>
 )}

 {/* Features tags */}
 <div className="flex flex-wrap gap-1 mb-4">
 {court.features.length === 0 ? (
 <span className="text-[13px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
 Chưa khai báo tiện ích
 </span>
 ) : (
 court.features.map((feat, i) => (
 <span key={i} className="text-[13px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
 {feat}
 </span>
 ))
 )}
 </div>
 </div>

 {/* Bottom Action */}
 <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
 <div>
 <span className="text-[13px] text-slate-500">Giá ca:</span>
 <div className="text-sm font-extrabold text-sky-700 ">
 {court.pricePerHour.toLocaleString()}đ<span className="text-[13px] font-normal text-slate-500">/giờ</span>
 </div>
 </div>

 {court.status === 'available' && (
 <button
 onClick={() => setBookingCourt(court)}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold px-3 py-2 rounded-lg shadow transition"
 >
 Đặt Sân Ngay
 </button>
 )}

 {court.status === 'matching' && (
 <button
 onClick={() => handleActionToast(`Bạn đã gửi yêu cầu tham gia ghép đội tại ${court.id}!`)}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold px-3 py-2 rounded-lg shadow transition"
 >
 Vào Kèo Ngay
 </button>
 )}

 {court.status === 'live' && (
 <button
 onClick={() => handleActionToast(`Đang kết nối camera AI VAR live stream ${court.id}...`)}
 className="bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold px-3 py-2 rounded-lg shadow transition flex items-center gap-1"
 >
 <Video className="w-3 h-3" /> Xem VAR Live
 </button>
 )}

 {court.status === 'booked' && (
 <span className="text-[13px] text-slate-500 font-medium italic">Không khả dụng</span>
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
 <p className="text-[13px] sm:text-sm text-slate-500 mt-1 hidden sm:block">
 Gia nhập các kèo bóng đá đang thiếu cầu thủ, tự động chia tiền sân theo đầu người qua VietQR
 </p>
 </div>

 <button
 onClick={() => onNavigateToChokego?.()}
 className="bg-gradient-to-r from-[#0369a1] to-[#075985] hover:from-[#075985] hover:to-[#0369a1] text-white text-[13px] font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 transition"
 >
 <Plus className="w-4 h-4" />
 <span>+ Tạo Kèo Mới</span>
 </button>
 </div>

 {/* Queue Cards */}
 <div className="space-y-3 sm:space-y-4">
 {loadingMatches ? (
 <p className="text-sm text-slate-500 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 ">
 Đang tải kèo từ CSDL…
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
 <span className="bg-amber-400/20 text-amber-600 text-[13px] font-bold px-2 py-0.5 rounded border border-amber-400/30">
 {match.category}
 </span>
 <span className="text-[13px] text-slate-500">
 Đội Trưởng: <span className="font-semibold text-slate-800 ">{match.hostName}</span> ({match.hostForm ? `phong độ ${match.hostForm}` : "tân binh"})
 </span>
 </div>

 <h3 className="font-bold text-slate-900 text-base mt-1">
 {match.title}
 </h3>

 <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-[13px] text-slate-500">
 <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-emerald-500" /> {match.time}</span>
 <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#0369a1]" /> {match.court}</span>
 <span className="flex items-center"><Trophy className="w-3.5 h-3.5 mr-1 text-amber-700" /> Yêu cầu: {match.formInfo}</span>
 </div>
 </div>
 </div>

 <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 ">
 <div className="text-left sm:text-right mb-2">
 <div className="text-[13px] text-slate-500">Chi phí / cầu thủ:</div>
 <div className="text-lg font-black text-sky-700 ">
 {match.costPerPerson.toLocaleString()}đ
 </div>
 </div>

 <button
 onClick={() => setJoiningMatch(match)}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold px-4 py-2 rounded-lg shadow transition flex items-center space-x-1"
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
 return <p className="text-sm text-slate-500">Đang tải tiện ích từ CSDL…</p>;
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
 className="text-[13px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1.5 rounded-lg"
 >
 {a}
 </span>
 ))}
 </div>
 );
 })()}

 <p className="text-[13px] text-slate-500 mt-4 leading-relaxed hidden sm:block">
 Dịch vụ thuê áo, bóng hay trọng tài do từng cụm sân cung cấp — hỏi trực tiếp chủ
 sân theo số điện thoại trong hồ sơ khi tới nhận sân.
 </p>
 </div>

 </div>
 </div>

 </div>

 {/* Court Booking Modal */}
 {bookingCourt && (
 <div id="inline-bookingcourt" className="w-full animate-fade-in">
 <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-5">
 <div className="flex items-center justify-between border-b border-slate-200 pb-3">
 <h3 className="font-extrabold text-lg text-slate-900 ">
 Xác Nhận Đặt Ca Sân {bookingCourt.id}
 </h3>
 <button
 onClick={() => setBookingCourt(null)}
 className="text-slate-500 hover:text-slate-700 text-xl font-bold"
 >
 ✕
 </button>
 </div>

 <div className="space-y-3 text-sm text-slate-600 ">
 <div className="flex justify-between">
 <span>Tên sân:</span>
 <span className="font-bold text-slate-900 ">{bookingCourt.name}</span>
 </div>
 <div className="flex justify-between">
 <span>Loại sân:</span>
 <span className="font-medium text-emerald-500 font-bold">{bookingCourt.fieldLabel}</span>
 </div>
 <div className="flex justify-between">
 <span>Mặt sân:</span>
 <span className="font-medium">{bookingCourt.surface}</span>
 </div>
 <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-900 ">
 <span>Tổng tiền cọc VietQR:</span>
 <span className="text-emerald-500">{bookingCourt.pricePerHour.toLocaleString()}đ</span>
 </div>
 </div>

 <div className="bg-slate-50 p-3 rounded-xl text-[13px] text-slate-500 space-y-1">
 <div className="font-semibold text-slate-700 ">ℹ️ Quy trình đặt ca:</div>
 <div>• Chọn ngày & khung giờ ở tab Đặt Sân.</div>
 <div>• Cọc 50% giá ca qua VietQR; hoàn cọc theo từng sân.</div>
 </div>

 <div className="flex space-x-3 pt-2">
 <button
 onClick={() => setBookingCourt(null)}
 className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-[13px] text-slate-700 hover:bg-slate-100 "
 >
 Hủy Bỏ
 </button>
 <button
 onClick={() => {
 setBookingCourt(null);
 onNavigateToBooking?.();
 }}
 className="w-1/2 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] shadow-lg transition"
 >
 Chọn Khung Giờ
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Match Joining Modal */}
 {joiningMatch && (
 <div id="inline-joiningmatch" className="w-full animate-fade-in">
 <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-5">
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
 className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-[13px] text-slate-700 hover:bg-slate-100 "
 >
 Để Sau
 </button>
 <button
 onClick={handleAcceptMatch}
 disabled={accepting}
 className="w-1/2 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] shadow-lg transition disabled:opacity-60"
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

