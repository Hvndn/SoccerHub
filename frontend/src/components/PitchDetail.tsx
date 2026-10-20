"use client";

import React, { useState, useEffect, useMemo } from "react";
import SafeImage from "@/components/SafeImage";
import {
 ArrowLeft,
 MapPin,
 Star,
 Share2,
 Heart,
 Navigation,
 ShieldCheck,
 Zap,
 CheckCircle2,
 Clock,
 Car,
 Wifi,
 ShowerHead,
 Calendar,
 ChevronRight,
 Sparkles,
 Lock,
 ArrowRight,
 Info,
 Ticket,
 QrCode,
 Users,
 Check,
 PhoneCall,
 Award,
 Coffee,
 Receipt,
 AlertCircle,
 Video,
 Flame,
 RefreshCw,
 Copy,
 Swords,
 Layers,
 CircleDollarSign,
 X
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { broadcastBookingEvent, subscribeToBookingEvents } from "@/lib/realtimeService";

interface PitchDetailProps {
 pitch: any | null;
 onBack: () => void;
 user?: any;
}

export default function PitchDetail({
 pitch,
 onBack,
 user
}: PitchDetailProps) {
 // Lấy pitchId thật từ prop hoặc mặc định là 1 (Cụm sân thật trong database)
 const pitchId = useMemo(() => {
 if (!pitch?.id) return 1;
 const cleanId = pitch.id.toString().replace(/\D/g, "");
 return Number(cleanId) || 1;
 }, [pitch]);

 // Sinh 7 ngày liên tiếp tính từ ngày hiện tại của thiết bị (Hôm nay, Ngày mai...)
 const upcomingDays = useMemo(() => {
 const days = [];
 const now = new Date();
 const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
 for (let i = 0; i < 7; i++) {
 const d = new Date(now);
 d.setDate(now.getDate() + i);
 const year = d.getFullYear();
 const month = String(d.getMonth() + 1).padStart(2, "0");
 const date = String(d.getDate()).padStart(2, "0");
 const iso = `${year}-${month}-${date}`;
 const dayOfWeek = dayNames[d.getDay()];
 const dateFormatted = `${date}/${month}`;
 const label = i === 0 ? "Hôm Nay" : i === 1 ? "Ngày Mai" : dayOfWeek;
 days.push({
 iso,
 dayOfWeek,
 dateFormatted,
 label,
 display: `${label} (${dateFormatted})`,
 badge: i === 0 ? "🔥 Ca Tối" : i === 1 ? "⭐ Đặt Sớm" : "12 Ca Mở",
 isWeekend: d.getDay() === 0 || d.getDay() === 6
 });
 }
 return days;
 }, []);

 const [selectedDate, setSelectedDate] = useState<string>(upcomingDays[0].iso);
 const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
 const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>("ALL");
 const [depositOption, setDepositOption] = useState<"50%" | "100%">("50%");
 const [autoLighting, setAutoLighting] = useState(true);
 const [isLiked, setIsLiked] = useState(false);
 const [copiedLink, setCopiedLink] = useState(false);
 const [toastMsg, setToastMsg] = useState<string | null>(null);

 // Dữ liệu cụm sân thật từ backend
 const [pitchDetails, setPitchDetails] = useState<any>(null);
 const [matrixCourts, setMatrixCourts] = useState<any[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [isBooking, setIsBooking] = useState(false);
 // Số người chia tiền — người dùng tự nhập, không mặc định roster có sẵn
 const [splitCount, setSplitCount] = useState(14);

 // Thời lượng ca thi đấu CỐ ĐỊNH do Chủ Sân quy định (Mặc định 120 phút = 2 tiếng, bao gồm thi đấu và giao/trả ca)
 const fixedSlotDuration = useMemo(() => {
 return pitchDetails?.slotDurationMinutes || pitch?.slotDurationMinutes || 120;
 }, [pitchDetails, pitch]);

 // Slot được chọn hiện tại (Mặc định null, người dùng bấm vào ca mới hiển thị phiếu đặt)
 const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

 // Modal QR Code thanh toán & Thẻ Vé điện tử
 const [showQrModal, setShowQrModal] = useState(false);
 const [bookingConfirmed, setBookingConfirmed] = useState<any | null>(null);
 const [paymentDone, setPaymentDone] = useState(false);

 const showToast = (msg: string) => {
 setToastMsg(msg);
 setTimeout(() => setToastMsg(null), 3500);
 };

 useEffect(() => {
 window.scrollTo({ top: 0, behavior: "smooth" });
 }, []);

 // 1. Tải thông tin chi tiết Cụm Sân thật từ CSDL
 useEffect(() => {
 async function loadPitchInfo() {
 try {
 const data = await apiRequest<any>(`/api/v1/pitches/${pitchId}`);
 if (data) {
 setPitchDetails(data);
 }
 } catch (err) {
 console.warn("Không tải được chi tiết sân từ API, dùng dữ liệu sân truyền vào");
 }
 }
 loadPitchInfo();
 }, [pitchId]);

 // 2. Tải Ma trận Ca Sân thật từ Backend theo ca cố định của Chủ Sân
 const fetchPitchMatrix = async (dateStr: string, durationMin: number) => {
 setIsLoading(true);
 try {
 const data = await apiRequest<any[]>(`/api/v1/pitches/${pitchId}/matrix?date=${dateStr}&duration=${durationMin}`);
 if (Array.isArray(data) && data.length > 0) {
 setMatrixCourts(data);
 } else {
 setMatrixCourts([]);
 }
 } catch (err) {
 console.warn("Lỗi tải ma trận ca sân từ API:", err);
 setMatrixCourts([]);
 } finally {
 setIsLoading(false);
 }
 };

 // Re-fetch khi ngày hoặc thời lượng cố định của sân thay đổi
 useEffect(() => {
 if (selectedDate) {
 fetchPitchMatrix(selectedDate, fixedSlotDuration);
 }
 }, [pitchId, selectedDate, fixedSlotDuration]);

 // Lắng nghe sự kiện Realtime cập nhật ca sân
 useEffect(() => {
 const unsubscribe = subscribeToBookingEvents((_event: any) => {
 if (selectedDate) {
 fetchPitchMatrix(selectedDate, fixedSlotDuration);
 }
 });
 return () => unsubscribe();
 }, [pitchId, selectedDate, fixedSlotDuration]);

 // Dữ liệu cụm sân hiển thị (Ưu tiên dữ liệu thật từ DB, không bịa fallback)
 const venueData = useMemo(() => {
 return {
 name: pitchDetails?.name || pitch?.name || "Cụm sân chưa đặt tên",
 address: pitchDetails?.address || pitch?.address || "Chưa khai báo địa chỉ",
 phone: pitchDetails?.phone || pitch?.phone || "Chưa khai báo số điện thoại",
 openTime: pitchDetails?.openTime || pitch?.openTime || "—",
 closeTime: pitchDetails?.closeTime || pitch?.closeTime || "—",
 slotDuration: pitchDetails?.slotDurationMinutes || pitch?.slotDurationMinutes || 90,
 rating: pitchDetails?.rating ?? pitch?.rating ?? null,
 reviewsCount: pitchDetails?.reviewsCount ?? pitch?.reviewsCount ?? 0,
 ownerName: pitchDetails?.ownerName || pitch?.ownerName || "Chưa khai báo",
 mainImage: "https://images.unsplash.com/photo-1529900241452-f47268d87ec9?auto=format&fit=crop&w=1200&q=80",
 subImages: [
 "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80",
 "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=600&q=80"
 ]
 };
 }, [pitchDetails, pitch]);

 // Tính toán giá tiền thực tế
 const originalPrice = selectedSlot?.price || 0;
 // Không áp voucher/điểm ảo: tổng = giá ca sân theo ma trận CSDL
 const totalPrice = originalPrice;
 const depositAmount = depositOption === "50%" ? Math.round(totalPrice * 0.5) : totalPrice;
 const splitPerPlayer = Math.round(totalPrice / Math.max(1, splitCount));

 // Chọn ca sân trên ma trận
 const handleSelectSlot = (court: any, slot: any) => {
 if (slot.status === "booked" || slot.status === "playing") {
 showToast(`⚠️ Ca [${slot.time}] của ${court.pitchName} đã được cọc trước! Vui lòng chọn ca trống.`);
 return;
 }
 const rawPrice = parseInt((slot.price || "350k").toString().replace(/\D/g, "")) * 1000 || 350000;
 setSelectedSlot({
 courtId: court.pitchId,
 courtName: court.pitchName,
 courtType: court.type,
 time: slot.time,
 price: rawPrice,
 status: slot.status
 });
 showToast(`⚽ Đã chọn: ${court.pitchName} • Khung giờ: ${slot.time}`);
 };

 // Xác nhận đặt sân & tạo đơn cọc trên CSDL thật
 const handleStartBooking = async () => {
 if (!selectedSlot || selectedSlot.status === "booked") {
 showToast("❌ Vui lòng chọn một ca sân còn trống.");
 return;
 }

 if (!user) {
 showToast("Bạn cần đăng nhập để đặt sân (hệ thống lưu tên & SĐT của bạn vào đơn).");
 return;
 }

 setIsBooking(true);
 try {
 const customerName = user.fullName || user.name || "";
 const customerPhone = user.phone || "";
 if (!customerPhone) {
 showToast("Tài khoản chưa có số điện thoại — hãy cập nhật SĐT trong hồ sơ trước khi đặt.");
 return;
 }

 const bookingPayload = {
 courtName: selectedSlot.courtName,
 courtType: selectedSlot.courtType || "Sân 7 Người",
 timeSlot: selectedSlot.time,
 bookingDate: selectedDate,
 customerName: customerName,
 customerPhone: customerPhone,
 totalPrice: totalPrice,
 depositPaid: depositAmount,
 via: "Đặt qua Website"
 };

 const res = await apiRequest<any>(`/api/v1/pitches/${pitchId}/book-offline`, {
 method: "POST",
 body: JSON.stringify(bookingPayload)
 });

 if (res && res.id) {
 setBookingConfirmed(res);
 setPaymentDone(false);
 setShowQrModal(true);
 showToast("🎉 Đã tạo mã giữ chỗ. Bắt đầu cọc với chủ sân để giữ chắc ca.");

 // Phát sự kiện Realtime thông báo cho Chủ Sân ngay tức thì
 broadcastBookingEvent({
 type: "BOOKING_CREATED",
 pitchId: pitchId,
 bookingId: res.id,
 code: res.code,
 customerName: customerName,
 customerPhone: customerPhone,
 courtName: selectedSlot.courtName,
 courtType: selectedSlot.courtType || "Sân 7",
 timeSlot: selectedSlot.time,
 bookingDate: selectedDate,
 totalPrice: totalPrice,
 depositPaid: depositAmount,
 via: "Đặt qua Website"
 });
 } else {
 // Không tạo được đơn thật thì báo lỗi — tuyệt đối không bịa mã đơn
 showToast("❌ Không tạo được đơn giữ chỗ, vui lòng thử lại.");
 }
 } catch (err: any) {
 showToast(`❌ Lỗi đặt sân: ${err.message || "Không thể kết nối máy chủ"}`);
 } finally {
 setIsBooking(false);
 }
 };

 // Xử lý xác nhận thanh toán xong từ phía cầu thủ
 const handleCompletePayment = () => {
 setPaymentDone(true);
 // Reload lại ma trận ca sân thật để slot vừa đặt chuyển sang BOOKED
 fetchPitchMatrix(selectedDate, fixedSlotDuration);
 showToast("✅ Đã ghi nhận yêu cầu thanh toán cọc của bạn. Chủ sân sẽ đối soát tiền khi bạn check-in.");

 // Gửi sự kiện cập nhật trạng thái thanh toán
 if (bookingConfirmed) {
 broadcastBookingEvent({
 type: "BOOKING_CREATED",
 pitchId: pitchId,
 bookingId: bookingConfirmed.id,
 code: bookingConfirmed.code,
 customerName: bookingConfirmed.customerName,
 customerPhone: bookingConfirmed.customerPhone,
 courtName: bookingConfirmed.courtName,
 timeSlot: bookingConfirmed.timeSlot,
 bookingDate: selectedDate,
 totalPrice: bookingConfirmed.totalPrice,
 depositPaid: bookingConfirmed.depositPaid,
 via: "Đặt qua Website (Chờ chủ sân đối soát tiền)"
 });
 }
 };

 const handleCopyShare = () => {
 navigator.clipboard?.writeText(window.location.href);
 setCopiedLink(true);
 setTimeout(() => setCopiedLink(false), 2000);
 showToast("📋 Đã sao chép liên kết cụm sân vào bộ nhớ tạm!");
 };

 // Lọc sân theo danh mục và khung giờ
 const filteredCourts = matrixCourts.filter((court) => {
 if (selectedCategory !== "ALL") {
 if (!court.type?.toLowerCase().includes(selectedCategory.toLowerCase()) && 
 !court.pitchName?.toLowerCase().includes(selectedCategory.toLowerCase())) {
 return false;
 }
 }
 return true;
 });

 return (
 <div className="w-full space-y-4 sm:space-y-6 pb-20 text-slate-900 animate-fade-in">
 {/* Toast Notification */}
 {toastMsg && (
 <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in-up">
 <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
 <span className="text-sm font-bold">{toastMsg}</span>
 </div>
 )}

 {/* 1. THANH ĐIỀU HƯỚNG BREADCRUMBS & IOT REALTIME */}
 <nav aria-label="Breadcrumb" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
 <div className="flex items-center space-x-3">
 <button
 onClick={onBack}
 className="shrink-0 px-4 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-sm transition-all flex items-center space-x-1.5 active:scale-95 shadow-xs"
 >
 <ArrowLeft className="w-4 h-4 shrink-0" />
 <span className="whitespace-nowrap">Quay Lại Tìm Sân</span>
 </button>

 <ol className="hidden sm:flex min-w-0 flex-1 items-center space-x-1.5 text-[13px] text-slate-500 overflow-hidden">
 <li className="flex items-center space-x-1">
 <span>Trang chủ</span>
 <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
 </li>
 <li className="flex items-center space-x-1">
 <span>Đặt Sân Bóng Đá</span>
 <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
 </li>
 <li className="font-bold text-slate-900 truncate max-w-xs">
 {venueData.name}
 </li>
 </ol>
 </div>

 <div className="shrink-0 hidden lg:inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0369a1]/10 border border-[#0369a1]/20 text-sky-700 text-[13px] font-bold">
 <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1] animate-pulse" />
 <span>Thông tin ca sân cập nhật theo thời gian thực</span>
 </div>
 </nav>

 {/* 2. HEADER CỤM SÂN & BENTO ẢNH BÓNG ĐÁ ĐỈNH CAO */}
 <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
 {/* Title & Metadata */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
 <div className="space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 <span className="bg-[#0369a1] text-white text-[13px] font-black px-3 py-1 rounded-lg inline-flex items-center space-x-1 shadow-xs">
 <ShieldCheck className="w-3.5 h-3.5" />
 <span>{pitchDetails?.pitchTypes?.[0] || "Sân cỏ nhân tạo"}</span>
 </span>
 <span className="bg-[#0369a1] text-white text-[13px] font-black px-3 py-1 rounded-lg inline-flex items-center space-x-1 shadow-xs">
 <Zap className="w-3.5 h-3.5" />
 <span>Đèn LED chiếu sáng sân</span>
 </span>
 <span className="bg-slate-100 text-slate-700 text-[13px] font-bold px-3 py-1 rounded-lg border border-slate-200 ">
 {matrixCourts.length > 0 ? `${matrixCourts.length} Sân Con Hoạt Động` : "Cụm Sân Tiêu Chuẩn"}
 </span>
 {venueData.rating ? (
 <div className="inline-flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-[13px]">
 <Star className="w-4 h-4 text-amber-700 fill-amber-500" />
 <span className="font-extrabold text-slate-900 ">{venueData.rating}</span>
 <span className="text-slate-500 font-normal">({venueData.reviewsCount} đánh giá)</span>
 </div>
 ) : null}
 </div>

 <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 ">
 {venueData.name}
 </h1>

 <div className="text-sm text-slate-600 flex items-center space-x-2.5 flex-wrap font-medium">
 <span className="flex items-center gap-1.5">
 <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
 <strong className="text-slate-800 ">{venueData.address}</strong>
 </span>
 <span className="text-slate-500">•</span>
 <span className="flex items-center gap-1 text-sky-700 font-bold">
 <PhoneCall className="w-4 h-4 shrink-0" />
 <span>Hotline: {venueData.phone}</span>
 </span>
 <span className="text-slate-500">•</span>
 <span className="bg-[#0369a1]/10 text-sky-700 border border-[#0369a1]/20 px-2.5 py-0.5 rounded-lg text-[13px] font-bold font-mono">
 Mở cửa: {venueData.openTime} - {venueData.closeTime} (Linh hoạt 1h - 2h)
 </span>
 </div>
 </div>

 {/* Quick Action Group */}
 <div className="flex items-center space-x-2 shrink-0">
 <button
 onClick={() => setIsLiked(!isLiked)}
 className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors flex items-center space-x-1.5 shadow-xs"
 >
 <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-600" : "text-rose-600"}`} />
 <span>Yêu thích</span>
 </button>
 <button
 onClick={handleCopyShare}
 className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors flex items-center space-x-1.5 shadow-xs"
 >
 <Share2 className="w-4 h-4 text-[#0b4f6c] " />
 <span>{copiedLink ? "Đã Chép!" : "Chia sẻ"}</span>
 </button>
 <a
 href={`https://maps.google.com/?q=${encodeURIComponent(venueData.address)}`}
 target="_blank"
 rel="noreferrer"
 className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors flex items-center space-x-1.5 shadow-xs"
 >
 <Navigation className="w-4 h-4 text-[#0369a1]" />
 <span>Chỉ đường</span>
 </a>
 </div>
 </div>

 {/* Bento Gallery Ảnh Bóng Đá Đích Thực */}
 <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[280px] sm:min-h-[340px] rounded-2xl overflow-hidden shadow-xs">
 {/* Main Wide Photo (7 cols) */}
 <div className="md:col-span-6 lg:col-span-7 min-w-0 relative h-full group overflow-hidden bg-slate-900 rounded-2xl">
 <SafeImage
 src={venueData.mainImage}
 alt="Sân Bóng Đá Cỏ Nhân Tạo Chuẩn VFF"
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />
 <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-white">
 <div>
 <span className="font-black text-[13px] bg-[#0369a1]/90 backdrop-blur-md px-2.5 py-1 rounded text-white">
 {pitchDetails?.pitchTypes?.[0] || pitch?.sportBadge || "Sân bóng đá"}
 </span>
 <p className="font-black text-base sm:text-lg mt-1 text-white break-words">
 {pitchDetails?.description || venueData.address}
 </p>
 </div>
 </div>
 </div>

 {/* Secondary Photo Column (3 cols) */}
 <div className="hidden md:flex md:col-span-3 min-w-0 flex-col gap-3 h-full">
 <div className="relative flex-1 overflow-hidden group bg-slate-900 rounded-2xl">
 <SafeImage
 src={venueData.subImages[0]}
 alt="Bóng Thi Đấu & Điểm Phát Bóng"
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
 />
 <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded text-[13px] text-white font-bold">
 {venueData.name}
 </div>
 </div>
 <div className="relative flex-1 overflow-hidden group bg-slate-900 rounded-2xl">
 <SafeImage
 src={venueData.subImages[1]}
 alt="Khung Thành & Khu Vực Kỹ Thuật"
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
 />
 <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded text-[13px] text-white font-bold">
 {venueData.name}
 </div>
 </div>
 </div>

 {/* Quick Amenities Card (2 cols) — đọc từ cột amenities của bảng pitches */}
 <div className="hidden md:flex md:col-span-3 lg:col-span-2 min-w-0 flex-col justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 ">
 <div>
 <p className="text-[13px] font-black text-slate-500 mb-2.5 break-words">
 Tiện ích sân bóng
 </p>
 <div className="space-y-2.5 text-[13px] font-semibold text-slate-700 ">
 {pitchDetails?.amenities?.length ? (
 pitchDetails.amenities.map((a: string) => (
 <div key={a} className="flex items-start space-x-2 min-w-0">
 <CheckCircle2 className="w-4 h-4 text-[#0b4f6c] shrink-0" />
 <span className="min-w-0 break-words">{a}</span>
 </div>
 ))
 ) : (
 <span className="text-slate-500">Chủ sân chưa khai báo tiện ích.</span>
 )}
 </div>
 </div>

 <div className="pt-3 border-t border-slate-200 flex flex-col min-w-0">
 <span className="text-[13px] text-slate-500">Giá ca sân từ:</span>
 <span className="text-lg font-black text-sky-700 font-mono leading-tight break-words">
 {pitchDetails?.avgPricePerHour
 ? pitchDetails.avgPricePerHour.toLocaleString("vi-VN")
 : "—"}
 <span className="text-[13px] font-normal text-slate-500">đ/ca</span>
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* 3. MA TRẬN CHỌN CA SÂN & KHUNG GIỜ THI ĐẤU THỰC TẾ */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
 {/* CỘT TRÁI: CHỌN NGÀY & MA TRẬN CA SÂN THẬT (8 COLS) */}
 <main className="lg:col-span-8 space-y-5">
 {/* Header Bảng Chọn Ca */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
 <div>
 <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
 <Calendar className="w-5 h-5 text-[#0b4f6c] " />
 <span>Lịch Thi Đấu & Ca Sân Trực Tuyến</span>
 </h2>
 <p className="text-[13px] text-slate-500 mt-1">
 Dữ liệu ca sân được đồng bộ thời gian thực từ trung tâm điều hành chủ sân.
 </p>
 </div>

 {/* Chú thích màu sắc */}
 <div className="flex items-center space-x-3 text-[13px] font-bold flex-wrap">
 <div className="flex items-center space-x-1.5 text-sky-700 ">
 <span className="w-3 h-3 rounded-full bg-[#0369a1] shadow-xs" />
 <span>Đang chọn</span>
 </div>
 <div className="flex items-center space-x-1.5 text-slate-600 ">
 <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300 " />
 <span>Còn trống</span>
 </div>
 <div className="flex items-center space-x-1.5 text-rose-600">
 <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs" />
 <span>Đã cọc</span>
 </div>
 <div className="flex items-center space-x-1.5 text-amber-700">
 <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs" />
 <span>Giờ Vàng ⭐</span>
 </div>
 </div>
 </div>

 {/* Dải 7 Ngày Động Tự Động Tính Theo Thời Gian Thực */}
 <div className="flex items-center gap-2 pb-1 flex-wrap">
 {upcomingDays.map((d) => (
 <button
 key={d.iso}
 onClick={() => setSelectedDate(d.iso)}
 className={`flex-1 min-w-[130px] p-3 rounded-2xl flex flex-col items-center gap-0.5 shadow-xs text-center transition-all cursor-pointer border ${
 selectedDate === d.iso
 ? "bg-[#0369a1] text-white border-[#0369a1] shadow-md font-black"
 : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900 "
 }`}
 >
 <span className={`text-[13px] tracking-wider font-extrabold ${selectedDate === d.iso ? "text-white font-black" : "text-slate-500"}`}>
 {d.label}
 </span>
 <span className="text-sm font-black font-mono">{d.dateFormatted}</span>
 <span className={`text-[13px] px-2 py-0.5 rounded-full mt-1 font-bold ${
 selectedDate === d.iso 
 ? "bg-white/20 text-white " 
 : d.isWeekend ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
 }`}>
 {d.badge}
 </span>
 </button>
 ))}
 </div>

 {/* THÔNG TIN CA ĐÁ CỐ ĐỊNH NIÊM YẾT BỞI CHỦ SÂN */}
 <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 rounded-2xl bg-[#0369a1] text-white flex items-center justify-center shrink-0 shadow-md">
 <Clock className="w-5 h-5" />
 </div>
 <div>
 <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
 <span>Khung Giờ Thi Đấu Cố Định</span>
 <span className="px-2 py-0.5 rounded-md bg-[#0369a1]/10 text-sky-700 text-[13px] font-bold font-mono border border-[#0369a1]/30">
 {fixedSlotDuration} phút/ca
 </span>
 </span>
 <span className="text-[13px] text-slate-500">
 Lịch ca đấu đã được Chủ Sân chuẩn hóa cố định ({venueData.openTime} - {venueData.closeTime}) để đảm bảo tính liên tục của mặt sân.
 </span>
 </div>
 </div>

 <div className="flex items-center space-x-2 shrink-0">
 <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[13px] font-bold text-slate-700 ">
 🔒 Ca đấu cố định
 </span>
 </div>
 </div>

 {/* Bộ lọc Sân Con & Khung Giờ */}
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2 pb-1 flex-wrap">
 {[
 { id: "ALL", label: "Tất Cả Sân Con" },
 { id: "Sân 7", label: "Sân 7 Người (Cỏ Nhân Tạo)" },
 { id: "Sân 5", label: "Sân 5 Người (Mini / Futsal)" },
 { id: "Sân 11", label: "Sân 11 Tiêu Chuẩn" }
 ].map((cat) => (
 <button
 key={cat.id}
 onClick={() => setSelectedCategory(cat.id)}
 className={`px-3.5 py-2 rounded-xl text-[13px] font-bold shrink-0 transition-all ${
 selectedCategory === cat.id
 ? "bg-slate-900 text-white shadow-sm"
 : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
 }`}
 >
 {cat.label}
 </button>
 ))}
 </div>

 <div className="flex items-center space-x-2">
 <span className="text-[13px] text-slate-500 font-bold">Lọc giờ:</span>
 <select
 aria-label="Lọc giờ đá"
 value={selectedTimeFilter}
 onChange={(e) => setSelectedTimeFilter(e.target.value)}
 className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-800 cursor-pointer"
 >
 <option value="ALL">Tất Cả Giờ Đá</option>
 <option value="PEAK">⭐ Khung Giờ Vàng (17:30 - 20:30)</option>
 <option value="OFF_PEAK">🌙 Giờ Thường / Đêm Mát</option>
 </select>
 </div>
 </div>

 {/* Bảng Ma Trận Sân Con & Các Ca Đá */}
 <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
 {isLoading ? (
 <div className="py-16 text-center space-y-3">
 <RefreshCw className="w-8 h-8 text-[#0b4f6c] animate-spin mx-auto" />
 <p className="text-sm font-bold text-slate-500">Đang đồng bộ ma trận ca sân thật từ CSDL...</p>
 </div>
 ) : filteredCourts.length === 0 ? (
 <div className="py-12 text-center text-slate-500 space-y-2">
 <AlertCircle className="w-8 h-8 mx-auto text-slate-500" />
 <p className="font-bold text-sm">Không tìm thấy sân con nào phù hợp với bộ lọc.</p>
 </div>
 ) : (
 filteredCourts.map((court) => {
 const courtSlots = (court.slots || []).filter((s: any) => {
 if (selectedTimeFilter === "PEAK") {
 return s.time.includes("17:30") || s.time.includes("18:") || s.time.includes("19:00");
 }
 if (selectedTimeFilter === "OFF_PEAK") {
 return !s.time.includes("17:30") && !s.time.includes("18:") && !s.time.includes("19:00");
 }
 return true;
 });

 return (
 <div
 key={court.pitchId}
 className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
 >
 {/* Court Info Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 ">
 <div className="flex items-center space-x-2.5">
 <span className="w-3 h-3 rounded-full bg-[#0369a1] shadow-xs" />
 <span className="font-black text-base text-slate-900 ">
 {court.pitchName}
 </span>
 <span className="px-2.5 py-0.5 rounded-lg bg-[#0369a1]/10 text-[#0b4f6c] text-[13px] font-bold font-mono">
 {court.type}
 </span>
 </div>
 <div className="text-[13px] font-mono text-slate-500">
 Giá giờ thường: <strong className="text-slate-900 font-bold">{(court.basePrice / 1000)}k/ca</strong> • Giờ vàng: <strong className="text-amber-700 font-bold">{(court.peakPrice / 1000)}k/ca</strong>
 </div>
 </div>

 {/* Slots Grid */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
 {courtSlots.map((slot: any, sIdx: number) => {
 const isSelected = selectedSlot?.courtName === court.pitchName && selectedSlot?.time === slot.time;
 const isBooked = slot.status === "booked" || slot.status === "playing";
 const isResale = slot.status === "resale";
 const isPeak = slot.time.includes("17:") || slot.time.includes("18:") || slot.time.includes("19:");

 if (isSelected) {
 return (
 <button
 key={sIdx}
 type="button"
 className="h-20 rounded-2xl bg-[#0369a1] text-white shadow-lg shadow-sky-950/20 flex flex-col items-center justify-center p-2 relative overflow-hidden transition-all slot-selected-bounce ring-2 ring-white/70 btn-shimmer cursor-pointer"
 >
 <div className="absolute top-0 right-0 bg-white text-[#0b4f6c] text-[13px] px-2 py-0.5 font-black rounded-bl shadow-xs">
 ĐANG CHỌN ⚽
 </div>
 <span className="font-extrabold text-sm">{slot.time}</span>
 <span className="font-black text-base font-mono mt-0.5">{slot.price}</span>
 <span className="text-[13px] text-cyan-50 font-semibold">{slot.durationMinutes || fixedSlotDuration || 120} phút (2 tiếng)</span>
 </button>
 );
 }

 if (isBooked) {
 const isOwner = user?.role === "OWNER";
 return (
 <div
 key={sIdx}
 className="h-20 rounded-2xl bg-slate-200/70 text-slate-500 flex flex-col items-center justify-center p-2 cursor-not-allowed opacity-75 border border-slate-200 "
 title={isOwner ? `Khách: ${slot.customer || "Khách"} - SĐT: ${slot.phone || "N/A"}` : "Ca đã có khách đặt trước"}
 >
 <span className="font-bold text-[13px]">{slot.time}</span>
 <div className="flex items-center space-x-1 mt-1 text-rose-600 font-bold text-[13px]">
 <Lock className="w-3.5 h-3.5" />
 <span>Đã Cọc</span>
 </div>
 {isOwner ? (
 <span className="text-[13px] text-slate-600 font-mono truncate max-w-[120px] font-semibold">
 {slot.customer || slot.phone || "Khách cọc"}
 </span>
 ) : (
 <span className="text-[13px] text-slate-500 font-medium">
 Khóa ca
 </span>
 )}
 </div>
 );
 }

 return (
 <button
 key={sIdx}
 type="button"
 onClick={() => handleSelectSlot(court, slot)}
 className={`h-20 rounded-2xl shadow-xs flex flex-col items-center justify-center p-2 transition-all cursor-pointer border group relative ${
 slot.isGapSlot
 ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-400/80 text-amber-950 ring-1 ring-amber-400/40"
 : "bg-white hover:border-[#0369a1] hover:bg-sky-50/20 text-slate-900 border-slate-200 "
 }`}
 >
 {slot.isGapSlot ? (
 <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 text-[13px] font-black px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
 <span>⚡ Lọt Khe</span>
 </div>
 ) : isPeak ? (
 <div className="absolute top-1.5 right-1.5 text-amber-700 text-[13px] font-bold">
 ⭐ Vàng
 </div>
 ) : isResale ? (
 <div className="absolute top-1 right-1 bg-amber-500 text-white text-[13px] font-bold px-1.5 rounded">
 Pass -40%
 </div>
 ) : null}
 <span className={`font-bold text-[13px] ${slot.isGapSlot ? "text-amber-700 font-extrabold" : "text-slate-700 group-hover:text-sky-700 "}`}>
 {slot.time}
 </span>
 <span className={`font-black text-sm font-mono mt-0.5 ${slot.isGapSlot ? "text-amber-600 " : "text-sky-700 "}`}>
 {slot.price}
 </span>
 <span className={`text-[13px] font-medium ${slot.isGapSlot ? "text-amber-600/80 font-bold" : "text-slate-500"}`}>
 {slot.isGapSlot ? `${slot.durationMinutes}p linh hoạt` : "Còn trống"}
 </span>
 </button>
 );
 })}
 </div>
 </div>
 );
 })
 )}
 </div>

 {/* Quy trình nhận sân & chính sách cọc (mô tả đúng luồng đang chạy) */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-3 sm:p-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex items-start space-x-3">
 <div className="w-10 h-10 rounded-xl bg-[#0369a1]/10 text-sky-700 flex items-center justify-center shrink-0 font-bold">
 <QrCode className="w-5 h-5 text-emerald-500" />
 </div>
 <div className="space-y-1">
 <h3 className="font-bold text-sm text-slate-900 ">
 Check-in bằng mã giữ chỗ
 </h3>
 <p className="text-[13px] text-slate-500 leading-relaxed">
 Sau khi đặt, hệ thống sinh mã đơn. Chủ sân nhập mã này tại tab Ma trận để
 check-in cho bạn khi tới sân.
 </p>
 </div>
 </div>

 <div className="p-3 sm:p-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex items-start space-x-3">
 <div className="w-10 h-10 rounded-xl bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center shrink-0 font-bold">
 <ShieldCheck className="w-5 h-5 text-[#0369a1]" />
 </div>
 <div className="space-y-1">
 <h3 className="font-bold text-sm text-slate-900 ">
 Cọc & hủy lịch
 </h3>
 <p className="text-[13px] text-slate-500 leading-relaxed">
 Bạn chọn cọc 50% hoặc 100% giá ca khi đặt. Chính sách hoàn cọc do từng chủ sân
 quy định — liên hệ số điện thoại của sân để thoả thuận khi cần hủy.
 </p>
 </div>
 </div>
 </div>
 </main>

 {/* CỘT PHẢI: PHIẾU ĐẶT CHỖ & TÍNH TIỀN THÔNG MINH (4 COLS - STICKY) */}
 <aside className="lg:col-span-4 sticky top-20 space-y-4">
 {selectedSlot ? (
 <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border border-slate-200 space-y-4 sm:space-y-5 animate-fade-in">
 {/* Header Phiếu Đặt */}
 <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 ">
 <div className="flex items-center space-x-2.5">
 <div className="w-8 h-8 rounded-xl bg-[#0369a1] text-white flex items-center justify-center font-bold">
 <Receipt className="w-[18px] h-[18px]" />
 </div>
 <div>
 <h3 className="font-black text-sm text-slate-900 ">Phiếu Đặt Chỗ Sân Bóng</h3>
 <span className="text-[13px] text-slate-500 font-mono">Giữ chỗ qua mã đơn</span>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setSelectedSlot(null)}
 className="text-[13px] font-bold text-rose-600 hover:text-rose-600 bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
 title="Bỏ chọn ca này"
 >
 Bỏ chọn ✕
 </button>
 </div>

 {/* Thông Tin Ca Đã Chọn */}
 <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
 <div className="flex items-start justify-between">
 <div>
 <span className="text-[13px] text-slate-500 font-extrabold tracking-wider">Cụm sân & Mặt sân</span>
 <p className="font-black text-sm text-slate-900 ">{selectedSlot.courtName}</p>
 <p className="text-[13px] text-slate-500 truncate max-w-[220px]">{venueData.name}</p>
 </div>
 <Award className="w-6 h-6 text-emerald-500 shrink-0" />
 </div>

 <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[13px]">
 <div>
 <span className="text-[13px] text-slate-500 font-bold">Ngày thi đấu:</span>
 <p className="font-bold text-slate-900 font-mono">{selectedDate}</p>
 </div>
 <div>
 <span className="text-[13px] text-slate-500 font-bold">Khung giờ:</span>
 <p className="font-bold text-sky-700 font-mono">{selectedSlot.time}</p>
 </div>
 </div>
 </div>

 {/* Chi Tiết Giá Tiền & Khuyến Mãi */}
 <div className="space-y-2.5 text-[13px]">
 <div className="flex justify-between items-center text-slate-600 ">
 <span>Giá ca sân niêm yết ({fixedSlotDuration} phút/ca):</span>
 <span className="font-mono text-slate-900 font-bold">{originalPrice.toLocaleString("vi-VN")}đ</span>
 </div>

 {/* Tổng thanh toán */}
 <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
 <div>
 <span className="text-[13px] text-slate-500 font-extrabold block">TỔNG TIỀN CA SÂN:</span>
 <span className="text-[13px] text-sky-700 font-bold">Theo giá niêm yết của sân</span>
 </div>
 <div className="text-right">
 <span className="text-2xl font-black text-slate-900 font-mono">
 {totalPrice.toLocaleString("vi-VN")}đ
 </span>
 </div>
 </div>
 </div>

 {/* Tùy Chọn Cọc (50% hoặc 100%) */}
 <div className="space-y-2">
 <label className="text-[13px] font-extrabold tracking-wider text-slate-500 block">
 Hình thức đặt cọc giữ chỗ:
 </label>
 <div className="grid grid-cols-2 gap-2">
 <div
 onClick={() => setDepositOption("50%")}
 className={`p-3 rounded-2xl cursor-pointer flex flex-col justify-between border-2 transition-all ${
 depositOption === "50%"
 ? "bg-[#0369a1]/10 border-[#0369a1] shadow-xs"
 : "bg-slate-50 border-slate-200 "
 }`}
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-[13px] text-slate-900 ">Cọc 50%</span>
 {depositOption === "50%" && <span className="text-emerald-500 font-black text-[13px]">✓</span>}
 </div>
 <span className="font-mono text-base font-black text-sky-700 mt-1">
 {Math.round(totalPrice * 0.5).toLocaleString("vi-VN")}đ
 </span>
 <span className="text-[13px] text-slate-500">Trả phần còn lại ở quầy</span>
 </div>

 <div
 onClick={() => setDepositOption("100%")}
 className={`p-3 rounded-2xl cursor-pointer flex flex-col justify-between border-2 transition-all ${
 depositOption === "100%"
 ? "bg-[#0369a1]/10 border-[#0369a1] shadow-xs"
 : "bg-slate-50 border-slate-200 "
 }`}
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-[13px] text-slate-900 ">Thanh toán 100%</span>
 {depositOption === "100%" && <span className="text-emerald-500 font-black text-[13px]">✓</span>}
 </div>
 <span className="font-mono text-base font-black text-slate-900 mt-1">
 {totalPrice.toLocaleString("vi-VN")}đ
 </span>
 <span className="text-[13px] text-slate-500">Tặng +50 Điểm Thưởng</span>
 </div>
 </div>
 </div>

 {/* Widget Dự Toán Chia Tiền (Split Bill) Cho Cả Đội */}
 <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 space-y-2">
 <span className="text-[13px] font-bold text-sky-800 block">
 Ước Tính Chia Tiền:
 </span>
 <div className="flex items-center justify-between gap-2">
 <span className="text-[13px] text-slate-500">Số người chia:</span>
 <input
 type="number"
 min={1}
 max={40}
 value={splitCount}
 onChange={(e) => setSplitCount(Math.max(1, Number(e.target.value) || 1))}
 aria-label="Số người được chia tiền"
 className="w-16 px-2 py-1 rounded-lg border border-sky-200 bg-white text-[13px] font-mono font-bold text-center"
 />
 </div>
 <div className="flex items-center justify-between gap-2">
 <span className="text-[13px] text-slate-500">
 Mỗi người ~ <strong className="text-sky-700 font-mono font-bold text-[13px]">{splitPerPlayer.toLocaleString("vi-VN")}đ</strong>
 </span>
 <button
 type="button"
 onClick={() => showToast(`💸 Đã sao chép mức chia ${splitPerPlayer.toLocaleString("vi-VN")}đ/người (${splitCount} người)!`)}
 className="px-2.5 py-1.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] transition-colors shrink-0 shadow-xs"
 >
 Chia Tiền
 </button>
 </div>
 </div>

 {/* Nút Đặt Ca Chính */}
 <div className="space-y-2 pt-1">
 <button
 type="button"
 onClick={handleStartBooking}
 disabled={isBooking}
 className="w-full py-3.5 px-4 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm sm:text-base shadow-lg shadow-[#0369a1]/30 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
 >
 {isBooking ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin mr-1" />
 <span>Đang tạo đơn giữ chỗ...</span>
 </>
 ) : (
 <>
 <span>Xác Nhận Giữ Chỗ</span>
 <ArrowRight className="w-[18px] h-[18px] text-white" />
 </>
 )}
 </button>
 <div className="flex items-center justify-center space-x-1 text-center text-[13px] text-slate-500">
 <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
 <span>Mức cọc do từng sân quy định</span>
 </div>
 </div>
 </div>
 ) : (
 /* Placeholder khi chưa chọn ca nào */
 <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 border border-dashed border-slate-300 text-center space-y-4 animate-fade-in">
 <div className="w-16 h-16 rounded-2xl bg-[#0369a1]/10 text-[#0b4f6c] mx-auto flex items-center justify-center">
 <Calendar className="w-8 h-8 text-[#0b4f6c] animate-pulse" />
 </div>
 <div className="space-y-1.5">
 <h3 className="font-black text-base text-slate-900 ">
 Chưa Chọn Ca Thi Đấu
 </h3>
 <p className="text-[13px] text-slate-500 leading-relaxed max-w-[260px] mx-auto">
 Vui lòng bấm vào một khung giờ <strong>Còn trống</strong> trên sơ đồ bên trái để xem chi tiết giá và mở phiếu đặt chỗ.
 </p>
 </div>
 <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 text-[13px] font-bold">
 <span className="w-2 h-2 rounded-full bg-[#0369a1] animate-ping inline-block" />
 <span>Sẵn sàng giữ chỗ thời gian thực</span>
 </div>
 </div>
 )}

 {/* Card Chủ Sân & Liên Hệ Trực Tiếp */}
 <div className="p-3 sm:p-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 rounded-full bg-[#0369a1]/10 text-[#0b4f6c] flex items-center justify-center font-bold text-[13px]">
 {venueData.ownerName ? venueData.ownerName.slice(0, 2).toUpperCase() : "CS"}
 </div>
 <div>
 <span className="font-bold text-[13px] text-slate-900 block">Chủ Sân: {venueData.ownerName}</span>
 <span className="text-[13px] text-slate-500 block font-mono">Hotline: {venueData.phone}</span>
 </div>
 </div>
 <a
 href={`tel:${venueData.phone}`}
 className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sky-700 font-bold text-[13px] transition-colors flex items-center space-x-1"
 >
 <PhoneCall className="w-3.5 h-3.5" />
 <span>Gọi Sân</span>
 </a>
 </div>
 </aside>
 </div>

 {/* 4. MODAL THANH TOÁN VIETQR NAPAS247 & MATCHDAY PASS */}
 {showQrModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
 <div className="bg-white max-w-lg w-full rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-4 sm:space-y-5 border border-slate-200 shadow-2xl relative animate-modal-pop my-auto max-h-[92vh] overflow-y-auto">
 <button
 type="button"
 onClick={() => setShowQrModal(false)}
 aria-label="Đóng cửa sổ mã giữ chỗ"
 className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center font-bold transition-colors"
 >
 <X className="w-4 h-4" />
 </button>

 {!paymentDone ? (
 <>
 <div className="text-center space-y-1.5">
 <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[13px] font-bold">
 <Clock className="w-3.5 h-3.5" />
 <span>Đơn giữ chỗ đã lưu trong hệ thống</span>
 </div>
 <h3 className="text-2xl font-black text-slate-900 ">Mã Giữ Chỗ Của Bạn</h3>
 <p className="text-[13px] text-slate-500">Cọc trực tiếp với chủ sân để giữ chỗ. Hệ thống không tự trừ tiền.</p>
 </div>

 {/* Tóm tắt cọc */}
 <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-[13px]">
 <div className="flex justify-between">
 <span className="text-slate-500">Cụm sân:</span>
 <strong className="text-slate-900 ">{venueData.name}</strong>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-500">Mặt sân & Khung giờ:</span>
 <strong className="text-sky-700 ">{selectedSlot.courtName} • {selectedSlot.time}</strong>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-500">Mã vé đặt:</span>
 <strong className="font-mono text-[#0b4f6c] font-bold">{bookingConfirmed?.code || "—"}</strong>
 </div>
 <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
 <span className="font-bold text-slate-800 ">Mức cọc dự kiến ({depositOption}):</span>
 <strong className="font-mono text-sky-700 font-black text-base">
 {depositAmount.toLocaleString("vi-VN")} đ
 </strong>
 </div>
 </div>

 {/* Mã QR vé giữ chỗ (không phải mã ngân hàng) */}
 <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-emerald-500 shadow-sm">
 <div className="w-44 h-44 flex items-center justify-center">
 <QrCode className="w-40 h-40 text-slate-900" />
 </div>
 <div className="text-center mt-2 text-[13px] text-slate-600">
 <span>Mã giữ chỗ: </span>
 <strong className="text-[#0b4f6c] font-mono text-sm">{bookingConfirmed?.code || "—"}</strong>
 </div>
 <p className="text-[13px] text-slate-500 mt-1">Liên hệ chủ sân để hoàn tất cọc và xác nhận ca.</p>
 </div>

 <button
 type="button"
 onClick={handleCompletePayment}
 className="w-full py-3.5 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
 >
 <CheckCircle2 className="w-5 h-5 text-white" />
 <span>Đã Đặt Giữ Chỗ Thành Công</span>
 </button>
 </>
 ) : (
 /* Vé điện tử đã lưu trong CSDL */
 <div className="text-center space-y-5 py-2">
 <div className="w-14 h-14 rounded-full bg-sky-100 text-sky-700 border-2 border-[#0369a1] mx-auto flex items-center justify-center">
 <CheckCircle2 className="w-8 h-8 text-emerald-500" />
 </div>

 <div>
 <span className="px-3 py-1 rounded-full bg-[#0369a1]/10 text-sky-700 text-[13px] font-bold border border-[#0369a1]/30">
 Đơn giữ chỗ đã lưu vào CSDL
 </span>
 <h3 className="text-2xl font-black text-slate-900 mt-2">Thẻ Vé Vào Sân Điện Tử</h3>
 <p className="text-[13px] text-slate-500 mt-1">Cho chủ sân xem mã này khi tới sân để check-in.</p>
 </div>

 <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
 <div className="w-36 h-36 bg-white rounded-xl p-2 mx-auto flex items-center justify-center border shadow-xs">
 <QrCode className="w-32 h-32 text-slate-900" />
 </div>
 <div className="text-[13px] space-y-1 text-slate-600 font-medium">
 <p className="font-mono text-sky-700 font-black text-sm">
 MÃ VÉ: {bookingConfirmed?.code || "—"}
 </p>
 <p className="font-bold text-slate-900 ">{venueData.name}</p>
 <p>{selectedSlot.courtName} • {selectedSlot.time}</p>
 <p className="text-slate-500 text-[13px]">Ngày đá: {selectedDate}</p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setShowQrModal(false)}
 className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-[13px] font-bold transition-colors"
 >
 Đóng & Xem Lịch Đặt
 </button>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
}
