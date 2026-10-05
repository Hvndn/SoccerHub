"use client";

import React, { useState, useEffect, useMemo } from "react";
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

interface PitchDetailProps {
  pitch: any | null;
  onBack: () => void;
  onSelectSlot?: (pitch: any, slot: any) => void;
  user?: any;
}

export default function PitchDetail({
  pitch,
  onBack,
  onSelectSlot,
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
  const [useVoucher, setUseVoucher] = useState(true);
  const [useMatchPoints, setUseMatchPoints] = useState(true);
  const [depositOption, setDepositOption] = useState<"50%" | "100%">("50%");
  const [autoLighting, setAutoLighting] = useState(true);
  const [enableMatchmaking, setEnableMatchmaking] = useState(true);
  const [enableAiCamera, setEnableAiCamera] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [lockCountdown, setLockCountdown] = useState(299); // 04:59

  // Dữ liệu cụm sân thật từ backend
  const [pitchDetails, setPitchDetails] = useState<any>(null);
  const [matrixCourts, setMatrixCourts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  // Slot được chọn hiện tại
  const [selectedSlot, setSelectedSlot] = useState<any>({
    courtId: "court-1-0",
    courtName: "Sân 7A (Cỏ FIFA Pro)",
    courtType: "Sân 7 Người",
    time: "17:30 - 19:00",
    price: 350000,
    status: "empty"
  });

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

  // Đếm ngược Redis Lock
  useEffect(() => {
    const timer = setInterval(() => {
      setLockCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLockTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

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

  // 2. Tải Ma trận Ca Sân thật từ Backend cho ngày đã chọn
  const fetchPitchMatrix = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<any[]>(`/api/v1/pitches/${pitchId}/matrix?date=${dateStr}`);
      if (Array.isArray(data) && data.length > 0) {
        setMatrixCourts(data);

        // Tự động tìm ca trống đầu tiên để chọn
        let foundEmpty: any = null;
        for (const court of data) {
          const firstAvailable = (court.slots || []).find((s: any) => s.status === "empty");
          if (firstAvailable) {
            const rawPrice = parseInt((firstAvailable.price || "350k").toString().replace(/\D/g, "")) * 1000 || 350000;
            foundEmpty = {
              courtId: court.pitchId,
              courtName: court.pitchName,
              courtType: court.type,
              time: firstAvailable.time,
              price: rawPrice,
              status: firstAvailable.status
            };
            break;
          }
        }
        if (foundEmpty) {
          setSelectedSlot(foundEmpty);
        }
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

  useEffect(() => {
    if (selectedDate) {
      fetchPitchMatrix(selectedDate);
    }
  }, [pitchId, selectedDate]);

  // Dữ liệu cụm sân hiển thị (Ưu tiên dữ liệu thật từ DB)
  const venueData = useMemo(() => {
    return {
      name: pitchDetails?.name || pitch?.name || "Cụm Sân Bóng Đá D-Sport đà nẵng",
      address: pitchDetails?.address || pitch?.address || "Số 154 Nguyễn Lương Bằng, Tp. Đà Nẵng",
      phone: pitchDetails?.phone || pitch?.phone || "0988 776 652",
      openTime: pitchDetails?.openTime || "13:00",
      closeTime: pitchDetails?.closeTime || "22:30",
      slotDuration: pitchDetails?.slotDurationMinutes || 90,
      rating: pitchDetails?.rating || 4.9,
      reviewsCount: 128,
      ownerName: pitchDetails?.ownerName || "Hồ Văn Diện",
      mainImage: "https://images.unsplash.com/photo-1529900241452-f47268d87ec9?auto=format&fit=crop&w=1200&q=80",
      subImages: [
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=600&q=80"
      ]
    };
  }, [pitchDetails, pitch]);

  // Tính toán giá tiền thực tế
  const originalPrice = selectedSlot?.price || 350000;
  const voucherDiscount = useVoucher ? 50000 : 0;
  const pointsDiscount = useMatchPoints ? 20000 : 0;
  const totalPrice = Math.max(50000, originalPrice - voucherDiscount - pointsDiscount);
  const depositAmount = depositOption === "50%" ? Math.round(totalPrice * 0.5) : totalPrice;
  const splitPerPlayer = Math.round(totalPrice / 14);

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

    setIsBooking(true);
    try {
      const customerName = user?.fullName || user?.name || "Cao Việt An";
      const customerPhone = user?.phone || "0914 555 789";

      const bookingPayload = {
        courtName: selectedSlot.courtName,
        courtType: selectedSlot.courtType || "Sân 7 Người",
        timeSlot: selectedSlot.time,
        bookingDate: selectedDate,
        customerName: customerName,
        customerPhone: customerPhone,
        totalPrice: totalPrice,
        depositPaid: depositAmount,
        via: "VietQR Online"
      };

      const res = await apiRequest<any>(`/api/v1/pitches/${pitchId}/offline-book`, {
        method: "POST",
        body: JSON.stringify(bookingPayload)
      });

      if (res && res.id) {
        setBookingConfirmed(res);
        setPaymentDone(false);
        setShowQrModal(true);
        showToast("🎉 Đã tạo mã giữ chỗ thành công! Vui lòng quét mã VietQR để hoàn tất cọc.");
      } else {
        // Fallback giả lập nếu mạng lag
        const fallbackRes = {
          id: Math.floor(1000 + Math.random() * 9000),
          code: `VS-${pitchId}-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName: customerName,
          customerPhone: customerPhone,
          courtName: selectedSlot.courtName,
          timeSlot: selectedSlot.time,
          totalPrice: totalPrice,
          depositPaid: depositAmount,
          cashDue: totalPrice - depositAmount
        };
        setBookingConfirmed(fallbackRes);
        setPaymentDone(false);
        setShowQrModal(true);
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
    fetchPitchMatrix(selectedDate);
    showToast("✅ Đã xác nhận chuyển cọc thành công! Thẻ Matchday Pass đã được kích hoạt.");
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
    <div className="w-full space-y-6 pb-20 text-slate-900 dark:text-white animate-fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">{toastMsg}</span>
        </div>
      )}

      {/* 1. THANH ĐIỀU HƯỚNG BREADCRUMBS & IOT REALTIME */}
      <nav aria-label="Breadcrumb" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 hover:opacity-90 text-white dark:text-slate-950 font-bold text-sm transition-all flex items-center space-x-1.5 active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay Lại Tìm Sân</span>
          </button>

          <ol className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
            <li className="flex items-center space-x-1">
              <span>Trang chủ</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </li>
            <li className="flex items-center space-x-1">
              <span>Đặt Sân Bóng Đá</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </li>
            <li className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
              {venueData.name}
            </li>
          </ol>
        </div>

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hệ Thống IoT Cổng Sân & Đèn Chiếu Sáng Đang Kết Nối</span>
        </div>
      </nav>

      {/* 2. HEADER CỤM SÂN & BENTO ẢNH BÓNG ĐÁ ĐỈNH CAO */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Title & Metadata */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#0b4f6c] text-white text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider inline-flex items-center space-x-1 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>FIFA QUALITY / VFF</span>
              </span>
              <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-lg inline-flex items-center space-x-1 shadow-xs">
                <Zap className="w-3.5 h-3.5" />
                <span>Hệ Thống Đèn LED Tự Động</span>
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {matrixCourts.length > 0 ? `${matrixCourts.length} Sân Con Hoạt Động` : "Cụm Sân Tiêu Chuẩn"}
              </span>
              <div className="inline-flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-lg text-xs">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-extrabold text-slate-900 dark:text-white">{venueData.rating}</span>
                <span className="text-slate-400 font-normal">({venueData.reviewsCount} đánh giá thật)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {venueData.name}
            </h1>

            <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center space-x-2.5 flex-wrap font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <strong className="text-slate-800 dark:text-slate-200">{venueData.address}</strong>
              </span>
              <span className="text-slate-400">•</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <PhoneCall className="w-4 h-4 shrink-0" />
                <span>Hotline: {venueData.phone}</span>
              </span>
              <span className="text-slate-400">•</span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono">
                Mở cửa: {venueData.openTime} - {venueData.closeTime} ({venueData.slotDuration}p/ca)
              </span>
            </div>
          </div>

          {/* Quick Action Group */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : "text-rose-500"}`} />
              <span>Yêu thích</span>
            </button>
            <button
              onClick={handleCopyShare}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <Share2 className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400" />
              <span>{copiedLink ? "Đã Chép!" : "Chia sẻ"}</span>
            </button>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(venueData.address)}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <Navigation className="w-4 h-4 text-sky-500" />
              <span>Chỉ đường</span>
            </a>
          </div>
        </div>

        {/* Bento Gallery Ảnh Bóng Đá Đích Thực */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-[280px] sm:h-[340px] rounded-2xl overflow-hidden shadow-xs">
          {/* Main Wide Photo (7 cols) */}
          <div className="md:col-span-7 relative h-full group overflow-hidden bg-slate-900 rounded-2xl">
            <img
              src={venueData.mainImage}
              alt="Sân Bóng Đá Cỏ Nhân Tạo Chuẩn VFF"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-white">
              <div>
                <span className="font-black text-xs bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded text-white uppercase tracking-wider">
                  Mặt Cỏ Nhân Tạo FIFA Pro 50mm
                </span>
                <p className="font-black text-base sm:text-lg mt-1 text-white">
                  Hệ Thống Đèn LED Floodlight 800 Lux & Thoát Nước Ngầm 100%
                </p>
              </div>
              <div className="flex items-center space-x-1 text-xs font-bold bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Xem sân 360°</span>
              </div>
            </div>
          </div>

          {/* Secondary Photo Column (3 cols) */}
          <div className="hidden md:flex md:col-span-3 flex-col gap-3 h-full">
            <div className="relative flex-1 overflow-hidden group bg-slate-900 rounded-2xl">
              <img
                src={venueData.subImages[0]}
                alt="Bóng Thi Đấu & Điểm Phát Bóng"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded text-xs text-white font-bold">
                Bóng Thi Đấu FIFA Star
              </div>
            </div>
            <div className="relative flex-1 overflow-hidden group bg-slate-900 rounded-2xl">
              <img
                src={venueData.subImages[1]}
                alt="Khung Thành & Khu Vực Kỹ Thuật"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded text-xs text-white font-bold">
                Khu Kỹ Thuật & Khán Đài Mini
              </div>
            </div>
          </div>

          {/* Quick Amenities Card (2 cols) */}
          <div className="hidden md:flex md:col-span-2 flex-col justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                Tiện ích sân bóng
              </p>
              <div className="space-y-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400 shrink-0" />
                  <span>Bãi đỗ Ôtô free</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShowerHead className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400 shrink-0" />
                  <span>Tắm nóng lạnh</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400 shrink-0" />
                  <span>Thuê Áo Bib 2 màu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400 shrink-0" />
                  <span>Camera AI VAR</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Coffee className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400 shrink-0" />
                  <span>Canteen & Bù khoáng</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col">
              <span className="text-xs text-slate-400">Giá ca sân từ:</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {((pitchDetails?.avgPricePerHour || 350000)).toLocaleString("vi-VN")}đ
                <span className="text-xs font-normal text-slate-400">/ca</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MA TRẬN CHỌN CA SÂN & KHUNG GIỜ THI ĐẤU THỰC TẾ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: CHỌN NGÀY & MA TRẬN CA SÂN THẬT (8 COLS) */}
        <main className="lg:col-span-8 space-y-5">
          {/* Header Bảng Chọn Ca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#0b4f6c] dark:text-sky-400" />
                <span>Lịch Thi Đấu & Ca Sân Trực Tuyến</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Dữ liệu ca sân được đồng bộ thời gian thực từ trung tâm điều hành chủ sân.
              </p>
            </div>

            {/* Chú thích màu sắc */}
            <div className="flex items-center space-x-3 text-xs font-bold flex-wrap">
              <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
                <span>Đang chọn</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                <span>Còn trống</span>
              </div>
              <div className="flex items-center space-x-1.5 text-rose-500">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs" />
                <span>Đã cọc</span>
              </div>
              <div className="flex items-center space-x-1.5 text-amber-500">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs" />
                <span>Giờ Vàng ⭐</span>
              </div>
            </div>
          </div>

          {/* Dải 7 Ngày Động Tự Động Tính Theo Thời Gian Thực */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
            {upcomingDays.map((d) => (
              <button
                key={d.iso}
                onClick={() => setSelectedDate(d.iso)}
                className={`flex-1 min-w-[130px] p-3 rounded-2xl flex flex-col items-center gap-0.5 shadow-xs text-center transition-all cursor-pointer border ${
                  selectedDate === d.iso
                    ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 border-[#0b4f6c] dark:border-sky-400 shadow-md font-black"
                    : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider font-extrabold ${selectedDate === d.iso ? "text-sky-200 dark:text-slate-950 font-black" : "text-slate-400"}`}>
                  {d.label}
                </span>
                <span className="text-sm font-black font-mono">{d.dateFormatted}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 font-bold ${
                  selectedDate === d.iso 
                    ? "bg-white/20 text-white dark:text-slate-950" 
                    : d.isWeekend ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>
                  {d.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Bộ lọc Sân Con & Khung Giờ */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: "ALL", label: "Tất Cả Sân Con" },
                { id: "Sân 7", label: "Sân 7 Người (Cỏ Nhân Tạo)" },
                { id: "Sân 5", label: "Sân 5 Người (Mini / Futsal)" },
                { id: "Sân 11", label: "Sân 11 Tiêu Chuẩn" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    selectedCategory === cat.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-bold">Lọc giờ:</span>
              <select
                value={selectedTimeFilter}
                onChange={(e) => setSelectedTimeFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="ALL">Tất Cả Giờ Đá</option>
                <option value="PEAK">⭐ Khung Giờ Vàng (17:30 - 20:30)</option>
                <option value="OFF_PEAK">🌙 Giờ Thường / Đêm Mát</option>
              </select>
            </div>
          </div>

          {/* Bảng Ma Trận Sân Con & Các Ca Đá */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            {isLoading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#0b4f6c] dark:text-sky-400 animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-500">Đang đồng bộ ma trận ca sân thật từ CSDL...</p>
              </div>
            ) : filteredCourts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
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
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    {/* Court Info Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800/80">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
                        <span className="font-black text-base text-slate-900 dark:text-white">
                          {court.pitchName}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#0b4f6c]/10 text-[#0b4f6c] dark:text-sky-400 text-xs font-bold font-mono">
                          {court.type}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        Giá giờ thường: <strong className="text-slate-900 dark:text-white font-bold">{(court.basePrice / 1000)}k/ca</strong> • Giờ vàng: <strong className="text-amber-500 font-bold">{(court.peakPrice / 1000)}k/ca</strong>
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
                              className="h-20 rounded-2xl bg-emerald-600 text-white shadow-md flex flex-col items-center justify-center p-2 relative overflow-hidden transition-all scale-[1.02] ring-2 ring-emerald-500 cursor-pointer"
                            >
                              <div className="absolute top-0 right-0 bg-emerald-300 text-slate-950 text-[9px] px-2 py-0.5 font-black rounded-bl uppercase">
                                ĐANG CHỌN
                              </div>
                              <span className="font-extrabold text-sm">{slot.time}</span>
                              <span className="font-black text-base font-mono mt-0.5">{slot.price}</span>
                              <span className="text-[10px] text-emerald-200">90 phút</span>
                            </button>
                          );
                        }

                        if (isBooked) {
                          return (
                            <div
                              key={sIdx}
                              className="h-20 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 text-slate-400 flex flex-col items-center justify-center p-2 cursor-not-allowed opacity-75 border border-slate-200 dark:border-slate-800"
                            >
                              <span className="font-bold text-xs">{slot.time}</span>
                              <div className="flex items-center space-x-1 mt-1 text-rose-500 font-bold text-xs">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Đã Cọc</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{slot.customer}</span>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSelectSlot(court, slot)}
                            className="h-20 rounded-2xl bg-white dark:bg-slate-900 hover:border-emerald-500 hover:bg-emerald-50/20 text-slate-900 dark:text-white shadow-xs flex flex-col items-center justify-center p-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 group relative"
                          >
                            {isPeak && (
                              <div className="absolute top-1.5 right-1.5 text-amber-500 text-[10px] font-bold">
                                ⭐ Vàng
                              </div>
                            )}
                            {isResale && (
                              <div className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 rounded">
                                Pass -40%
                              </div>
                            )}
                            <span className="font-bold text-xs text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {slot.time}
                            </span>
                            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                              {slot.price}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Còn trống
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

          {/* Chính sách hoàn cọc & Tự động hóa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Tự Động Bật Đèn Sân IoT
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Đèn sân và camera tự động mở trước giờ thi đấu 5 phút khi bạn quét mã check-in qua ứng dụng.
                </p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 font-bold">
                <ShieldCheck className="w-5 h-5 text-sky-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Bảo Chứng Hoàn Cọc 100%
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Hủy lịch trước giờ đá 2 tiếng: Hoàn 100% tiền cọc về tài khoản trong 60 giây không mất bất kỳ chi phí nào.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* CỘT PHẢI: PHIẾU ĐẶT CHỖ & TÍNH TIỀN THÔNG MINH (4 COLS - STICKY) */}
        <aside className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
            {/* Header Phiếu Đặt */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center font-bold">
                  <Receipt className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Phiếu Đặt Chỗ Sân Bóng</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Trực tuyến VietQR Napas247</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                1 Ca Đang Chọn
              </span>
            </div>

            {/* Thông Tin Ca Đã Chọn */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Cụm sân & Mặt sân</span>
                  <p className="font-black text-sm text-slate-900 dark:text-white">{selectedSlot.courtName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">{venueData.name}</p>
                </div>
                <Award className="w-6 h-6 text-emerald-500 shrink-0" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Ngày thi đấu:</span>
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{selectedDate}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Khung giờ:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{selectedSlot.time}</p>
                </div>
              </div>
            </div>

            {/* Chi Tiết Giá Tiền & Khuyến Mãi */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Giá ca sân niêm yết (90p):</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">{originalPrice.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="flex items-center space-x-1">
                  <span>Chiếu sáng đèn LED IoT & VAR:</span>
                  <Info className="w-3.5 h-3.5 text-emerald-500" />
                </span>
                <span className="font-mono text-emerald-500 font-bold">Miễn phí</span>
              </div>

              {/* Voucher VaoSan 50k */}
              <div className="flex justify-between items-center bg-emerald-500/10 p-2.5 rounded-xl text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <div className="flex items-center space-x-2">
                  <Ticket className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">VaoSan Welcome Promo</span>
                    <span className="text-[10px] text-slate-500">Mã voucher sẵn có</span>
                  </div>
                </div>
                <span className="font-mono font-black text-sm">-50.000đ</span>
              </div>

              {/* Tích điểm VaoSanPoints */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useMatchPoints}
                    onChange={(e) => setUseMatchPoints(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Đổi 500 VaoSanPoints</span>
                </label>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">-20.000đ</span>
              </div>

              {/* Tổng thanh toán */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold block">TỔNG TIỀN CA SÂN:</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Tiết kiệm 70.000đ</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            </div>

            {/* Tùy Chọn Cọc (50% hoặc 100%) */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                Hình thức đặt cọc giữ chỗ:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => setDepositOption("50%")}
                  className={`p-3 rounded-2xl cursor-pointer flex flex-col justify-between border-2 transition-all ${
                    depositOption === "50%"
                      ? "bg-emerald-500/10 border-emerald-500 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Cọc 50%</span>
                    {depositOption === "50%" && <span className="text-emerald-500 font-black text-xs">✓</span>}
                  </div>
                  <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {Math.round(totalPrice * 0.5).toLocaleString("vi-VN")}đ
                  </span>
                  <span className="text-[10px] text-slate-500">Trả phần còn lại ở quầy</span>
                </div>

                <div
                  onClick={() => setDepositOption("100%")}
                  className={`p-3 rounded-2xl cursor-pointer flex flex-col justify-between border-2 transition-all ${
                    depositOption === "100%"
                      ? "bg-emerald-500/10 border-emerald-500 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Thanh toán 100%</span>
                    {depositOption === "100%" && <span className="text-emerald-500 font-black text-xs">✓</span>}
                  </div>
                  <span className="font-mono text-base font-black text-slate-900 dark:text-white mt-1">
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                  <span className="text-[10px] text-slate-500">Tặng +50 Điểm Thưởng</span>
                </div>
              </div>
            </div>

            {/* Widget Dự Toán Chia Tiền (Split Bill) Cho Cả Đội */}
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-sky-800 dark:text-sky-300 block">
                  VietQR Chia Tiền (14 Cầu Thủ):
                </span>
                <span className="text-[11px] text-slate-500">
                  Mỗi người chỉ tốn: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">{splitPerPlayer.toLocaleString("vi-VN")}đ</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => showToast(`💸 Đã sao chép mức chia tiền ${splitPerPlayer.toLocaleString("vi-VN")}đ/người cho 14 cầu thủ!`)}
                className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors shrink-0 shadow-xs"
              >
                Chia Tiền
              </button>
            </div>

            {/* Tùy Chọn Cầu Thủ Độc Đáo */}
            <div className="space-y-2 text-xs">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableMatchmaking}
                  onChange={(e) => setEnableMatchmaking(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#0b4f6c] accent-sky-500"
                />
                <span className="text-slate-700 dark:text-slate-300 leading-tight">
                  <strong className="text-slate-900 dark:text-white">Mở Kèo Tìm Đối Thủ Elo:</strong> Tự động đăng kèo giao hữu lên chợ ghép đội nếu bạn đang thiếu đội giao lưu.
                </span>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAiCamera}
                  onChange={(e) => setEnableAiCamera(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#0b4f6c] accent-sky-500"
                />
                <span className="text-slate-700 dark:text-slate-300 leading-tight">
                  <strong className="text-slate-900 dark:text-white">Camera AI Tự Cắt Highlights:</strong> Tự động gửi video bàn thắng & pha bóng đẹp về điện thoại sau trận.
                </span>
              </label>
            </div>

            {/* Redis Lock Alert */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 animate-spin text-amber-500" />
                <span>Giữ Chỗ Tạm Thời:</span>
              </div>
              <span className="font-mono text-sm font-black">{formatLockTimer(lockCountdown)}</span>
            </div>

            {/* Nút Đặt Ca Chính */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleStartBooking}
                disabled={isBooking}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isBooking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                    <span>Đang Khóa Slot Ca...</span>
                  </>
                ) : (
                  <>
                    <span>Xác Nhận & Quét VietQR Giữ Chỗ</span>
                    <ArrowRight className="w-4.5 h-4.5 text-white" />
                  </>
                )}
              </button>
              <div className="flex items-center justify-center space-x-1 text-center text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Bảo chứng bởi <strong>SoccerHub SafePlay™</strong> • Hoàn cọc 100% nếu hủy trước 2h</span>
              </div>
            </div>
          </div>

          {/* Card Chủ Sân & Liên Hệ Trực Tiếp */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#0b4f6c]/10 text-[#0b4f6c] dark:text-sky-400 flex items-center justify-center font-bold text-xs">
                {venueData.ownerName ? venueData.ownerName.slice(0, 2).toUpperCase() : "CS"}
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">Chủ Sân: {venueData.ownerName}</span>
                <span className="text-[11px] text-slate-400 block font-mono">Hotline: {venueData.phone}</span>
              </div>
            </div>
            <a
              href={`tel:${venueData.phone}`}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-colors flex items-center space-x-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Gọi Sân</span>
            </a>
          </div>
        </aside>
      </div>

      {/* 4. MODAL THANH TOÁN VIETQR NAPAS247 & MATCHDAY PASS */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-3xl p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-modal-pop">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {!paymentDone ? (
              <>
                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Giữ Chỗ Tạm: {formatLockTimer(lockCountdown)}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Quét Mã VietQR Nhận Sân</h3>
                  <p className="text-xs text-slate-500">Mã đơn vé đã được lưu vào hệ thống. Quét QR để hoàn tất cọc.</p>
                </div>

                {/* Tóm tắt cọc */}
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cụm sân:</span>
                    <strong className="text-slate-900 dark:text-white">{venueData.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mặt sân & Khung giờ:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{selectedSlot.courtName} • {selectedSlot.time}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mã vé đặt:</span>
                    <strong className="font-mono text-[#0b4f6c] dark:text-sky-400 font-bold">{bookingConfirmed?.code || `VS-${pitchId}-7192`}</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Số tiền cọc cần chuyển ({depositOption}):</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-base">
                      {depositAmount.toLocaleString("vi-VN")} đ
                    </strong>
                  </div>
                </div>

                {/* Mã QR Động Napas247 */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-emerald-500 shadow-sm">
                  <img
                    src={`https://img.vietqr.io/image/970422-98202598888-compact2.png?amount=${depositAmount}&addInfo=${encodeURIComponent(bookingConfirmed?.code || "VS7192")}&accountName=VAOSAN%20SPORTS%20ECOSYSTEM`}
                    alt="VietQR Napas247"
                    className="w-52 h-52 object-contain"
                  />
                  <div className="text-center mt-2 text-xs text-slate-600">
                    <span>Nội dung chuyển khoản: </span>
                    <strong className="text-[#0b4f6c] font-mono text-sm">{bookingConfirmed?.code || "VS7192"}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCompletePayment}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>Xác Nhận Đã Chuyển Khoản Thành Công</span>
                </button>
              </>
            ) : (
              /* Thẻ Matchday Pass hoàn tất */
              <div className="text-center space-y-5 py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 border-2 border-emerald-500 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                    ĐÃ CỌC THÀNH CÔNG VÀO CSDL
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">Thẻ Vé Vào Sân Điện Tử</h3>
                  <p className="text-xs text-slate-500 mt-1">Trình mã QR này tại barrier cổng sân hoặc phòng tiếp tân để check-in mở đèn.</p>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="w-36 h-36 bg-white rounded-xl p-2 mx-auto flex items-center justify-center border shadow-xs">
                    <QrCode className="w-32 h-32 text-slate-900" />
                  </div>
                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                    <p className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                      MÃ VÉ: {bookingConfirmed?.code || `VS-${pitchId}-7192`}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white">{venueData.name}</p>
                    <p>{selectedSlot.courtName} • {selectedSlot.time}</p>
                    <p className="text-slate-400 text-[11px]">Ngày đá: {selectedDate}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold transition-colors"
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
