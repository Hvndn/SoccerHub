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
  QrCode,
  Wrench,
  FileText,
  Printer,
  Copy,
  RotateCcw,
  Play,
  Trash2,
  AlertTriangle,
  Coffee,
  DollarSign,
  UserCheck,
  CreditCard,
  X,
  PlusCircle,
  MinusCircle
} from 'lucide-react';

export interface CourtBookingData {
  customerName: string;
  customerPhone: string;
  timeSlot: string;
  deposit: number;
  totalPrice: number;
  startTime?: number;
  bookingCode?: string;
  note?: string;
}

export interface Court {
  id: string;
  name: string;
  fieldType: 'san5' | 'san7' | 'san11' | 'futsal';
  fieldLabel: string;
  surface: string;
  status: 'available' | 'matching' | 'live' | 'booked' | 'maintenance' | 'completed';
  liveScore?: string;
  pricePerHour: number;
  features: string[];
  currentPlayers?: number;
  maxPlayers?: number;
  bookingData?: CourtBookingData;
  maintenanceReason?: string;
}

export const CANTEEN_CATALOG = [
  { id: "water", name: "Nước suối Aquafina", price: 10000, icon: "💧" },
  { id: "revive", name: "Revive chanh muối", price: 15000, icon: "⚡" },
  { id: "redbull", name: "Bò húc Thái Lan", price: 20000, icon: "🐂" },
  { id: "bib", name: "Thuê áo bib phân đội", price: 20000, icon: "🎽" },
  { id: "ball", name: "Thuê bóng thi đấu số 5", price: 30000, icon: "⚽" },
];

import { API_BASE_URL, apiRequest, ensureLoggedIn, fetchWithTimeout } from '@/lib/api';
import { pitchTypeLabel } from "@/lib/pitchLabels";
import { broadcastBookingEvent } from "@/lib/realtimeService";
import SafeImage from "@/components/SafeImage";
import { getPitchVisual } from "@/lib/pitchVisuals";
import { Camera } from "lucide-react";

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

  // States cho Hóa Đơn Tất Toán POS & Tính Giờ Live
  const [checkoutCourt, setCheckoutCourt] = useState<Court | null>(null);
  const [invoiceCanteen, setInvoiceCanteen] = useState<Record<string, number>>({});
  const [invoiceCustomExtra, setInvoiceCustomExtra] = useState(0);
  const [invoiceCustomNote, setInvoiceCustomNote] = useState("");
  const [invoiceSplitCount, setInvoiceSplitCount] = useState(10);
  const [copiedZaloSuccess, setCopiedZaloSuccess] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Live timer tick 1s/lần cho các sân đang đá
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

 // Form hien INLINE (khong popup) -> tu cuon toi khi mo.
 useEffect(() => {
  if (!bookingCourt && !joiningMatch) return;
  const raf = requestAnimationFrame(() => {
   document.querySelector('[id^="inline-bookingcourt"], [id^="inline-checkoutcourt"], [id^="inline-joiningmatch"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
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

  // Định dạng thời gian đã đá (Live Timer)
  const formatElapsedTime = (startTime?: number) => {
    if (!startTime) return "00:00";
    const diffSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      const remainMins = mins % 60;
      return `${hrs}h ${remainMins < 10 ? "0" : ""}${remainMins}m ${secs < 10 ? "0" : ""}${secs}s`;
    }
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Xác nhận khách nhận sân & vào đá (chuyển sang 'live' và bắt đầu đếm giờ)
  const handleCheckinCourt = (courtId: string) => {
    setCourts(prev => prev.map(c => {
      if (c.id === courtId) {
        const prevBooking = c.bookingData || {
          customerName: "Khách lẻ tại quầy",
          customerPhone: "0905.123.456",
          timeSlot: "Trực tiếp",
          deposit: 0,
          totalPrice: c.pricePerHour * 2,
          bookingCode: "LIVE" + Math.floor(100000 + Math.random() * 900000)
        };
        return {
          ...c,
          status: 'live',
          bookingData: {
            ...prevBooking,
            startTime: Date.now()
          }
        };
      }
      return c;
    }));
    handleActionToast(`⚽ Check-in thành công! Sân ${courtId} bắt đầu tính giờ thi đấu.`);
  };

  // Chuyển đổi trạng thái Bảo Trì sân
  const handleToggleMaintenance = (courtId: string) => {
    setCourts(prev => prev.map(c => {
      if (c.id === courtId) {
        const nextStatus = c.status === 'maintenance' ? 'available' : 'maintenance';
        return {
          ...c,
          status: nextStatus,
          maintenanceReason: nextStatus === 'maintenance' ? 'Bảo dưỡng hạt cao su, lu mặt cỏ & sửa đèn LED' : undefined
        };
      }
      return c;
    }));
    handleActionToast(`🔧 Đã cập nhật trạng thái hoạt động cho sân ${courtId}!`);
  };

  // Hủy ca đặt trả về Ca Trống
  const handleCancelCourt = (courtId: string) => {
    setCourts(prev => prev.map(c => {
      if (c.id === courtId) {
        return {
          ...c,
          status: 'available',
          bookingData: undefined
        };
      }
      return c;
    }));
    if (checkoutCourt?.id === courtId) setCheckoutCourt(null);
    handleActionToast(`Đã hủy ca đặt và trả sân ${courtId} về Ca Trống!`);
  };

  // Mở Hóa Đơn & Tất Toán POS
  const handleOpenInvoice = (court: Court) => {
    setCheckoutCourt(court);
    setBookingCourt(null);
    setInvoiceCanteen({});
    setInvoiceCustomExtra(0);
    setInvoiceCustomNote("");
    setInvoiceSplitCount(10);
    setCopiedZaloSuccess(false);
  };

  // Xác nhận Tất Toán & Trả Sân (Giải phóng sân về available)
  const handleCompleteCheckout = (courtId: string, totalAmount: number) => {
    setCourts(prev => prev.map(c => {
      if (c.id === courtId) {
        return {
          ...c,
          status: 'available',
          bookingData: undefined,
          liveScore: undefined
        };
      }
      return c;
    }));
    setCheckoutCourt(null);
    handleActionToast(`🏁 Tất toán thành công ${totalAmount.toLocaleString("vi-VN")}đ! Sân ${courtId} đã sẵn sàng cho lượt tiếp theo.`);
  };

  // Sao chép bill gửi Zalo chia tiền đội
  const handleCopyZaloBill = (court: Court, totalDue: number, perPerson: number, courtFee: number, deposit: number) => {
    const code = court.bookingData?.bookingCode || court.id;
    const timePlayed = formatElapsedTime(court.bookingData?.startTime);
    const canteenLines = Object.entries(invoiceCanteen)
      .filter(([_, qty]) => (Number(qty) || 0) > 0)
      .map(([id, qty]) => {
        const item = CANTEEN_CATALOG.find(i => i.id === id);
        const q = typeof qty === 'number' ? qty : Number(qty) || 0;
        return item ? `+ ${item.name} x${q}: ${(item.price * q).toLocaleString("vi-VN")}đ` : "";
      })
      .filter(Boolean)
      .join("\n");

    const extraLine = invoiceCustomExtra > 0 ? `+ Phụ phí khác (${invoiceCustomNote || 'Phát sinh'}): ${invoiceCustomExtra.toLocaleString("vi-VN")}đ\n` : "";

    const text = `📢 [TURFZONE] HÓA ĐƠN CA ĐÁ & CHIA TIỀN ĐỘI
⚽ Sân: ${court.name} (${court.fieldLabel})
👤 Khách: ${court.bookingData?.customerName || "Đội bóng"} • Khung giờ: ${court.bookingData?.timeSlot || "Trực tiếp"}
⏱️ Thời gian thi đấu: ${timePlayed}
─────────────────────
💰 Tiền thuê sân: ${courtFee.toLocaleString("vi-VN")}đ
${canteenLines ? `🍹 Canteen & Dịch vụ:\n${canteenLines}\n` : ""}${extraLine}${deposit > 0 ? `💳 Tiền cọc đã trừ: -${deposit.toLocaleString("vi-VN")}đ\n` : ""}─────────────────────
👉 TỔNG TIỀN CÒN PHẢI THU: ${totalDue.toLocaleString("vi-VN")}đ
👥 Chia đều cho ${invoiceSplitCount} người: ${perPerson.toLocaleString("vi-VN")}đ / người
🏦 STK chuyển khoản: 0905123456 - MB Bank (Chủ Sân Turfzone)
Nội dung: ${code} - ${court.bookingData?.customerName || "Tien San"}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedZaloSuccess(true);
      setTimeout(() => setCopiedZaloSuccess(false), 3000);
    }
  };

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
              className={`rounded-2xl border-2 p-3.5 sm:p-4.5 transition-all duration-200 flex flex-col justify-between relative ${
                court.status === 'available'
                  ? 'border-sky-200 bg-white hover:border-[#0369a1] hover:shadow-md'
                  : court.status === 'booked'
                  ? 'border-sky-400 bg-sky-50/50 shadow-xs'
                  : court.status === 'live'
                  ? 'border-rose-400 bg-rose-50/40 shadow-md ring-1 ring-rose-200'
                  : court.status === 'maintenance'
                  ? 'border-amber-300 bg-amber-50/40 opacity-90'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              {/* Court Top Badge & Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-base text-slate-900">
                    {court.id}
                  </span>
                  
                  {court.status === 'available' && (
                    <span className="bg-sky-50 text-[#0369a1] text-[13px] font-bold px-2.5 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Chưa Đặt
                    </span>
                  )}
                  {court.status === 'booked' && (
                    <span className="bg-[#0369a1] text-white text-[13px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                      <Calendar className="w-3 h-3" /> Đã Đặt / Chờ Đá
                    </span>
                  )}
                  {court.status === 'live' && (
                    <span className="bg-rose-600 text-white text-[13px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-pulse">
                      <Flame className="w-3 h-3" /> Đang Đá (Live)
                    </span>
                  )}
                  {court.status === 'maintenance' && (
                    <span className="bg-amber-100 text-amber-800 text-[13px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> Đang Bảo Trì
                    </span>
                  )}
                  {court.status === 'matching' && (
                    <span className="bg-amber-500/20 text-amber-700 text-[13px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Ghép Kèo
                    </span>
                  )}
                </div>

                {/* Live Match Timer Banner if Playing */}
                {court.status === 'live' && (
                  <div className="mb-2.5 p-2 rounded-xl bg-rose-100/80 border border-rose-200 flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                      <Clock className="w-4 h-4 text-rose-600 animate-spin" style={{ animationDuration: '6s' }} />
                      <span>Thời gian đá:</span>
                    </div>
                    <span className="font-mono font-black text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs">
                      ⏱️ {formatElapsedTime(court.bookingData?.startTime)}
                    </span>
                  </div>
                )}

                {/* Thông tin khách đã đặt */}
                {court.status === 'booked' && court.bookingData && (
                  <div className="mb-2.5 p-2 rounded-xl bg-sky-100/70 border border-sky-200 space-y-1 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Khách:</span>
                      <strong className="text-slate-900 font-bold truncate max-w-[150px]">{court.bookingData.customerName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Khung giờ:</span>
                      <strong className="text-[#0369a1] font-mono font-bold">{court.bookingData.timeSlot}</strong>
                    </div>
                  </div>
                )}

                {/* Thông tin bảo trì */}
                {court.status === 'maintenance' && (
                  <div className="mb-2.5 p-2 rounded-xl bg-amber-100/70 border border-amber-200 text-[12px] text-amber-900 font-medium">
                    🛠️ {court.maintenanceReason || "Bảo dưỡng hạt cao su & dàn đèn"}
                  </div>
                )}

                {/* Ảnh sân con trực quan */}
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

                <div className="text-[13px] text-slate-500 space-y-1 mb-3">
                  <div>⚽ <span className="font-semibold text-slate-700">{court.fieldLabel}</span></div>
                  <div>🌱 {court.surface}</div>
                </div>

                {/* Features tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {court.features.length === 0 ? (
                    <span className="text-[12px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                      Tiện ích tiêu chuẩn
                    </span>
                  ) : (
                    court.features.slice(0, 3).map((feat, i) => (
                      <span key={i} className="text-[12px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {feat}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Action Area */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-500">Đơn giá:</span>
                  <div className="text-sm font-extrabold text-[#0369a1]">
                    {court.pricePerHour.toLocaleString()}đ<span className="text-[12px] font-normal text-slate-500">/giờ</span>
                  </div>
                </div>

                {/* NÚT THAO TÁC THEO TRẠNG THÁI */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {court.status === 'available' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingCourt(court);
                          setDirectCustomer("");
                          setDirectPhone("");
                          setDirectDeposit("");
                          setDirectNote("");
                        }}
                        className="flex-1 bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold py-2 px-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Đăng ký ca sân trực tiếp tại quầy"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Đặt Ca</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleMaintenance(court.id)}
                        className="bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 text-[13px] font-bold py-2 px-2.5 rounded-xl border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                        title="Tạm khóa sân để bảo dưỡng cỏ, đèn"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Bảo Trì</span>
                      </button>
                    </>
                  )}

                  {court.status === 'booked' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCheckinCourt(court.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold py-2 px-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        title="Xác nhận khách vào sân và tính thời gian"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Vào Đá</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenInvoice(court)}
                        className="bg-white hover:bg-slate-100 text-slate-800 text-[13px] font-bold py-2 px-2.5 rounded-xl border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                        title="Xem chi tiết hóa đơn & phụ phí"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#0369a1]" />
                        <span>Hóa Đơn</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelCourt(court.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-[13px] font-bold p-2 rounded-xl border border-rose-200 transition cursor-pointer"
                        title="Hủy đơn đặt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {court.status === 'live' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenInvoice(court)}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold py-2 px-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        title="Mở hóa đơn tính tiền và tất toán trả sân"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Checkout & Tất Toán</span>
                      </button>
                    </>
                  )}

                  {court.status === 'maintenance' && (
                    <button
                      type="button"
                      onClick={() => handleToggleMaintenance(court.id)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-bold py-2 px-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Hoàn tất bảo trì và mở lại sân"
                    >
                      <Check className="w-4 h-4" />
                      <span>Hoàn Tất Bảo Trì (Mở Sân)</span>
                    </button>
                  )}

                  {court.status === 'matching' && (
                    <button
                      type="button"
                      onClick={() => handleActionToast(`Đã gửi yêu cầu ghép đội tại ${court.id}!`)}
                      className="w-full bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold py-2 px-3 rounded-xl shadow transition"
                    >
                      Vào Kèo Ngay
                    </button>
                  )}
                </div>
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

      {/* ========================================================================= */}
      {/* KHỐI HÓA ĐƠN & PHIẾU THU TẤT TOÁN POS TẠI QUẦY (INLINE 100%, KHÔNG MODAL) */}
      {/* ========================================================================= */}
      {checkoutCourt && (() => {
        const courtFee = checkoutCourt.bookingData?.totalPrice || checkoutCourt.pricePerHour * 2;
        const deposit = checkoutCourt.bookingData?.deposit || 0;
        
        // Tính tổng tiền canteen
        const canteenTotal = Object.entries(invoiceCanteen).reduce((acc, [id, qty]) => {
          const item = CANTEEN_CATALOG.find(i => i.id === id);
          const q = typeof qty === 'number' ? qty : Number(qty) || 0;
          return acc + (item ? item.price * q : 0);
        }, 0);

        const customExtra = Number(invoiceCustomExtra) || 0;
        const totalDue = Math.max(0, courtFee + canteenTotal + customExtra - deposit);
        const splitPerPerson = invoiceSplitCount > 0 ? Math.ceil(totalDue / invoiceSplitCount) : totalDue;
        const bookingCode = checkoutCourt.bookingData?.bookingCode || checkoutCourt.id;

        return (
          <div 
            onClick={(e) => { if (e.target === e.currentTarget) setCheckoutCourt(null); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
          >
            <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col">
              {/* Header Phiếu Thu */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-xl text-slate-900 leading-tight">
                      Hóa Đơn Tất Toán & Phiếu Thu POS: {checkoutCourt.name}
                    </h3>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      Mã ca: <strong className="font-mono text-[#0369a1]">#{bookingCode}</strong> &bull; {checkoutCourt.fieldLabel} &bull; Trạng thái: {checkoutCourt.status === 'live' ? 'Đang đá' : 'Đã đặt'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutCourt(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Đóng hóa đơn"
                >
                  ✕
                </button>
              </div>

              {/* Nội dung cuộn linh hoạt cho màn hình nhỏ */}
              <div className="overflow-y-auto space-y-4 pr-1 flex-1">

              {/* Thông tin ca sân & thời gian */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px]">
                <div>
                  <span className="text-slate-500 block">Khách hàng:</span>
                  <strong className="text-slate-900 font-bold truncate block">{checkoutCourt.bookingData?.customerName || "Khách tại quầy"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Số điện thoại:</span>
                  <strong className="text-slate-900 font-mono font-bold block">{checkoutCourt.bookingData?.customerPhone || "0905.xxx.xxx"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Khung giờ:</span>
                  <strong className="text-[#0369a1] font-mono font-bold block">{checkoutCourt.bookingData?.timeSlot || "Trực tiếp"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Thời gian đã đá:</span>
                  <strong className="text-rose-600 font-mono font-black block">⏱️ {formatElapsedTime(checkoutCourt.bookingData?.startTime)}</strong>
                </div>
              </div>

              {/* BẢNG TÍNH TIỀN & THÊM DỊCH VỤ CANTEEN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                {/* Cột Trái: Tiền sân + Bộ chọn nhanh Canteen */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-slate-700 pb-2 border-b border-slate-100">
                    <span className="font-bold">1. Tiền thuê sân:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{courtFee.toLocaleString("vi-VN")}đ</span>
                  </div>

                  {/* Danh mục Canteen bấm + / - */}
                  <div className="space-y-2">
                    <span className="text-[12px] font-bold text-slate-500 block">2. Đồ uống & Phụ phí Canteen:</span>
                    <div className="space-y-1.5">
                      {CANTEEN_CATALOG.map((item) => {
                        const qty = invoiceCanteen[item.id] || 0;
                        return (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                            <div className="flex items-center gap-2">
                              <span>{item.icon}</span>
                              <span className="font-bold text-slate-800">{item.name}</span>
                              <span className="text-slate-500 font-mono text-[12px]">({item.price.toLocaleString("vi-VN")}đ)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInvoiceCanteen(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
                                className="w-6 h-6 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold flex items-center justify-center cursor-pointer text-sm"
                              >
                                -
                              </button>
                              <span className="font-mono font-black text-slate-900 w-5 text-center">{qty}</span>
                              <button
                                type="button"
                                onClick={() => setInvoiceCanteen(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                                className="w-6 h-6 rounded bg-[#0369a1] hover:bg-[#075985] text-white font-bold flex items-center justify-center cursor-pointer text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Phụ phí tùy chỉnh khác */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">3. Phụ phí khác / Lố giờ:</span>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={invoiceCustomExtra || ""}
                        onChange={(e) => setInvoiceCustomExtra(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        placeholder="0đ"
                        className="w-28 px-2 py-1 rounded-lg border border-slate-300 font-mono font-bold text-right text-[13px] text-slate-900 bg-slate-50 focus:outline-none focus:border-[#0369a1]"
                      />
                    </div>
                    <input
                      type="text"
                      value={invoiceCustomNote}
                      onChange={(e) => setInvoiceCustomNote(e.target.value)}
                      placeholder="Ghi chú phụ phí (VD: Đá lố 15p, hỏng bóng...)"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white"
                    />
                  </div>
                </div>

                {/* Cột Phải: Tóm Tắt Thanh Toán, Chia Tiền & VietQR */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  {/* Tóm tắt tiền */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[13px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Tổng tiền sân & dịch vụ:</span>
                      <span className="font-mono font-bold text-slate-900">{(courtFee + canteenTotal + customExtra).toLocaleString("vi-VN")}đ</span>
                    </div>
                    {deposit > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Tiền cọc đã thanh toán trước:</span>
                        <span className="font-mono font-bold">-{deposit.toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="font-extrabold text-base text-slate-900">TỔNG CÒN PHẢI THU:</span>
                      <span className="font-mono font-black text-xl text-[#0369a1]">{totalDue.toLocaleString("vi-VN")}đ</span>
                    </div>
                  </div>

                  {/* Chia Tiền Zalo */}
                  <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-bold text-slate-800">Chia đều tiền đội (Campuchia):</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInvoiceSplitCount(Math.max(2, invoiceSplitCount - 1))}
                          className="w-6 h-6 rounded bg-white border border-slate-300 font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-[#0369a1] px-1.5">{invoiceSplitCount} người</span>
                        <button
                          type="button"
                          onClick={() => setInvoiceSplitCount(invoiceSplitCount + 1)}
                          className="w-6 h-6 rounded bg-white border border-slate-300 font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-slate-600">Mỗi người đóng:</span>
                      <strong className="font-mono font-black text-rose-600 text-sm">{splitPerPerson.toLocaleString("vi-VN")}đ</strong>
                    </div>
                  </div>

                  {/* VietQR Chuyển Khoản Nhanh */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <div className="w-20 h-20 shrink-0 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs overflow-hidden">
                      <SafeImage
                        src={`https://img.vietqr.io/image/970422-0905123456-compact2.png?amount=${totalDue}&addInfo=${encodeURIComponent(`TT ${checkoutCourt.id} ${checkoutCourt.bookingData?.customerName || "SAN"}`)}&accountName=CHU%20SAN%20TURFZONE`}
                        alt="VietQR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-0.5 text-[12px]">
                      <div className="flex items-center gap-1 text-[#0369a1] font-bold">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>VietQR Quét Trả Nhanh</span>
                      </div>
                      <p className="text-slate-500">Khách quét mã chuyển chính xác số tiền còn lại.</p>
                      <span className="inline-block text-[11px] font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">MB: 0905123456 (Chủ Sân)</span>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Nút Hành Động Ở Chân Hóa Đơn */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyZaloBill(checkoutCourt, totalDue, splitPerPerson, courtFee, deposit)}
                    className="px-3.5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0369a1] text-[13px] font-bold border border-sky-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedZaloSuccess ? "Đã Sao Chép!" : "Sao Chép Phiếu Thu"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") window.print();
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In Bill POS</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutCourt(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold transition cursor-pointer"
                  >
                    Đóng
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompleteCheckout(checkoutCourt.id, totalDue)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-extrabold shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác Nhận Tất Toán & Trả Sân</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


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

