"use client";

import React, { useState, useEffect } from "react";
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
  Tv,
  Coffee,
  Calendar,
  ChevronRight,
  Sparkles,
  Lock,
  ArrowRight,
  Info,
  ThumbsUp,
  MessageSquare,
  Award,
  Sun,
  Wind,
  Users,
  AlertCircle,
  Receipt,
  Ticket,
  Check,
  MessageCircle,
  Video,
  Flame,
  ShieldAlert
} from "lucide-react";

interface PitchDetailProps {
  pitch: any | null;
  onBack: () => void;
  onSelectSlot: (pitch: any, slot: any) => void;
}

export default function PitchDetail({
  pitch,
  onBack,
  onSelectSlot
}: PitchDetailProps) {
  const [selectedDate, setSelectedDate] = useState("TODAY");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [useMatchPoints, setUseMatchPoints] = useState(true);
  const [depositOption, setDepositOption] = useState<"50%" | "100%">("50%");
  const [autoLighting, setAutoLighting] = useState(true);
  const [enableMatchmaking, setEnableMatchmaking] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(299); // 04:59

  // Default selected slot state matching Stitch screenshot
  const [selectedSlot, setSelectedSlot] = useState<{
    courtId: string;
    courtName: string;
    courtSpec: string;
    time: string;
    price: number;
    duration: string;
  }>({
    courtId: "pb-01",
    courtName: "Sân PB-01 (Mặt Thảm Pro)",
    courtSpec: "Thảm PVC Cushion 8mm • Mái che cao 11m",
    time: "19:30 - 21:00",
    price: 160000,
    duration: "90 phút"
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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

  const venueData = {
    name: pitch?.name || "CLB & Khu Phức Hợp Thể Thao D-Sport Oasis",
    address: pitch?.address || "Đường số 7, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh (Cách Crescent Mall 400m)",
    distanceKm: pitch?.distanceKm || 1.8,
    rating: pitch?.rating || 4.9,
    reviewsCount: pitch?.reviewsCount || 128,
    mainImage: pitch?.imageUrl || "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80",
    subImages: [
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=600&q=80"
    ]
  };

  // Pricing calculations
  const originalPrice = selectedSlot.price;
  const voucherDiscount = 50000;
  const pointsDiscount = useMatchPoints ? 20000 : 0;
  const totalPrice = Math.max(0, originalPrice - voucherDiscount - pointsDiscount);
  const depositAmount = depositOption === "50%" ? Math.round(totalPrice * 0.5) : totalPrice;

  const datesList = [
    { id: "TODAY", label: "Tối Nay", dateStr: "Thứ 6, 18/10", badge: "14 khung giờ mở", active: true },
    { id: "TOMORROW", label: "Ngày Mai", dateStr: "Thứ 7, 19/10", badge: "21 khung giờ mở", active: false },
    { id: "WEEKEND", label: "Cuối Tuần", dateStr: "Chủ Nhật, 20/10", badge: "18 khung giờ mở", active: false },
    { id: "MONDAY", label: "Đầu Tuần", dateStr: "Thứ Hai, 21/10", badge: "32 khung giờ mở", active: false }
  ];

  // Matrix courts matching exact Stitch canvas HTML
  const matrixCourts = [
    {
      id: "pb-01",
      name: "Sân PB-01",
      badge: "Pro Mat",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      spec: "Thảm PVC Cushion 8mm • Mái che cao 11m",
      slots: [
        { time: "17:00 - 18:00", price: 110000, status: "AVAILABLE" },
        { time: "18:00 - 19:30", price: 160000, status: "BOOKED" },
        { time: "19:30 - 21:00", price: 160000, status: "SELECTED" },
        { time: "21:00 - 22:30", price: 120000, status: "AVAILABLE" }
      ]
    },
    {
      id: "pb-02",
      name: "Sân PB-02",
      badge: "Cộng đồng",
      badgeColor: "bg-lime-500/20 text-lime-700 dark:text-lime-400",
      spec: "Sàn sơn nhám giảm chấn • Đèn LED Floodlight",
      slots: [
        { time: "17:00 - 18:00", price: 110000, status: "AVAILABLE" },
        { time: "18:00 - 19:30", price: 160000, status: "DUPR_MATCH", duprInfo: "Ghép kèo DUPR 3.0 (3/4)" },
        { time: "19:30 - 21:00", price: 160000, status: "BOOKED" },
        { time: "21:00 - 22:30", price: 120000, status: "AVAILABLE" }
      ]
    },
    {
      id: "pb-03",
      name: "Sân PB-03",
      badge: "AI Cam",
      badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      spec: "Camera 4K AI tự động cắt Highlights trận đấu",
      slots: [
        { time: "17:00 - 18:00", price: 110000, status: "AVAILABLE" },
        { time: "18:00 - 19:30", price: 160000, status: "BOOKED" },
        { time: "19:30 - 21:00", price: 160000, status: "AVAILABLE" },
        { time: "21:00 - 22:30", price: 120000, status: "AVAILABLE" }
      ]
    },
    {
      id: "pb-05",
      name: "Sân PB-05 (Center)",
      badge: "VIP Khán Đài",
      badgeColor: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
      spec: "Sân trung tâm có 120 ghế khán đài VIP & Bảng điện tử",
      slots: [
        { time: "17:00 - 18:00", price: 140000, status: "AVAILABLE" },
        { time: "18:00 - 19:30", price: 200000, status: "AVAILABLE" },
        { time: "19:30 - 21:00", price: 200000, status: "BOOKED" },
        { time: "21:00 - 22:30", price: 150000, status: "AVAILABLE" }
      ]
    }
  ];

  const handleSelectMatrixSlot = (court: any, slot: any) => {
    if (slot.status === "BOOKED") return;
    setSelectedSlot({
      courtId: court.id,
      courtName: `${court.name} (${court.badge})`,
      courtSpec: court.spec,
      time: slot.time,
      price: slot.price,
      duration: "90 phút"
    });
  };

  const handleCheckout = () => {
    onSelectSlot(pitch || venueData, {
      time: selectedSlot.time,
      price: depositAmount.toLocaleString("vi-VN") + "đ",
      pitchType: selectedSlot.courtName
    });
  };

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full space-y-6 pb-20 text-slate-900 dark:text-white animate-fade-in">
      {/* 1. BREADCRUMBS & IOT REALTIME HEADER */}
      <nav aria-label="Breadcrumb" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white font-extrabold text-xs transition-all flex items-center space-x-2 active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span>← Quay Lại Danh Sách Sân</span>
          </button>

          <ol className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
            <li className="flex items-center space-x-1">
              <span className="text-slate-400">Trang chủ</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </li>
            <li className="flex items-center space-x-1">
              <span className="text-slate-400">Khám phá & Đặt sân</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </li>
            <li className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
              {venueData.name}
            </li>
          </ol>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#006c49] dark:text-emerald-400 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[#006c49] animate-pulse" />
          <span>Hệ Thống IoT Kết Nối Thời Gian Thực</span>
        </div>
      </nav>

      {/* 2. VENUE HEADER & ARCHITECTURAL MEDIA BENTO */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
        {/* Title & Metadata */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#006c49] text-white text-[11px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider inline-flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>DUPR Verified</span>
              </span>
              <span className="bg-[#acf847] text-[#102000] text-[11px] font-extrabold px-2.5 py-1 rounded inline-flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-[#304f00]" />
                <span>Hệ Thống IoT Auto-Light</span>
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold px-2.5 py-1 rounded">
                8 Sân Tiêu Chuẩn Mái Che
              </span>
              <div className="inline-flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="font-extrabold text-slate-900 dark:text-white">4.9</span>
                <span className="text-slate-400 font-normal">(128 lượt đánh giá)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {venueData.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-center space-x-2 flex-wrap">
              <MapPin className="w-4 h-4 text-[#006c49] shrink-0" />
              <span>{venueData.address}</span>
              <span className="text-slate-400">•</span>
              <span className="font-mono text-[#006c49] font-bold">1.8 km từ vị trí của bạn</span>
              <span className="text-slate-400">•</span>
              <span className="bg-[#102000] text-[#91db2a] px-2 py-0.5 rounded text-[11px] font-bold">
                Đang mở cửa: 05:30 - 23:00
              </span>
            </p>
          </div>

          {/* Quick Action Group */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : "text-rose-500"}`} />
              <span>Yêu thích</span>
            </button>
            <button
              onClick={handleCopyShare}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <Share2 className="w-4 h-4 text-[#006c49]" />
              <span>{copiedLink ? "Đã Chép!" : "Chia sẻ sân"}</span>
            </button>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(venueData.address)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <Navigation className="w-4 h-4 text-slate-500" />
              <span>Chỉ đường</span>
            </a>
          </div>
        </div>

        {/* Venue Gallery Bento Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-[320px] rounded-2xl overflow-hidden shadow-sm">
          {/* Main Wide Photo (7 cols) */}
          <div className="md:col-span-7 relative h-full group overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-xl">
            <img
              src={venueData.mainImage}
              alt="Sân Center Court VIP"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-white">
              <div>
                <span className="font-bold text-[11px] bg-[#006c49]/80 backdrop-blur-md px-2 py-0.5 rounded text-white uppercase tracking-wider">
                  Sân Center Court VIP
                </span>
                <p className="font-extrabold text-sm sm:text-base mt-1 text-white">
                  Sàn Acrylic Cushion 8 Lớp Chuẩn Olympic 2024
                </p>
              </div>
              <div className="flex items-center space-x-1 text-xs font-bold bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded border border-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-[#acf847]" />
                <span>Xem tất cả 16 ảnh</span>
              </div>
            </div>
          </div>

          {/* Secondary Photo Column (3 cols) */}
          <div className="hidden md:flex md:col-span-3 flex-col gap-3 h-full">
            <div className="relative flex-1 overflow-hidden group bg-slate-100 dark:bg-slate-800 rounded-xl">
              <img
                src={venueData.subImages[0]}
                alt="Phòng thay đồ VIP"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-2 left-2 bg-slate-950/70 backdrop-blur px-2 py-0.5 rounded text-[11px] text-white font-semibold">
                Phòng thay đồ VIP
              </div>
            </div>
            <div className="relative flex-1 overflow-hidden group bg-slate-100 dark:bg-slate-800 rounded-xl">
              <img
                src={venueData.subImages[1]}
                alt="Cộng đồng DUPR 3.0+"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-2 left-2 bg-slate-950/70 backdrop-blur px-2 py-0.5 rounded text-[11px] text-white font-semibold">
                Cộng đồng DUPR 3.0+
              </div>
            </div>
          </div>

          {/* Quick Amenities & Price Card (2 cols) */}
          <div className="hidden md:flex md:col-span-2 flex-col justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Tiện ích nổi bật
              </p>
              <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-[#006c49]" />
                  <span>Bãi đỗ Ôtô rộng</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShowerHead className="w-4 h-4 text-[#006c49]" />
                  <span>Tắm nóng lạnh</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-[#006c49]" />
                  <span>Thuê vợt Carbon Pro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-[#006c49]" />
                  <span>Camera Replay AI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Coffee className="w-4 h-4 text-[#006c49]" />
                  <span>Canteen & Whey Bar</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Giá dao động từ:</span>
              <span className="text-lg font-black text-[#006c49] font-mono">
                110.000đ<span className="text-xs font-normal text-slate-400">/giờ</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN INTERACTIVE TWO-COLUMN ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
        {/* LEFT COLUMN: INTERACTIVE COURT & TIME SLOT MATRIX (8 COLS / ~65% WIDTH) */}
        <main className="lg:col-span-8 space-y-5">
          {/* Section Heading with Live Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#006c49]" />
                <span>Chọn Sân & Khung Giờ Thi Đấu</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Khung giờ ca vàng (18:00 - 21:00) bao gồm hệ thống chiếu sáng LED IoT tự động
              </p>
            </div>

            {/* Legend Bar */}
            <div className="flex items-center space-x-3 text-xs font-bold flex-wrap">
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded bg-[#006c49]" />
                <span>Đang chọn</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
                <span>Còn trống</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-700" />
                <span className="text-slate-400">Đã đặt</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded bg-[#acf847]" />
                <span className="text-[#102000]">Ghép kèo DUPR</span>
              </div>
            </div>
          </div>

          {/* Interactive Date Picker Strip */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
            {datesList.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDate(d.id)}
                className={`flex-1 min-w-[140px] p-3 rounded-2xl flex flex-col items-center gap-0.5 shadow-sm text-center transition-all cursor-pointer border ${
                  selectedDate === d.id
                    ? "bg-[#006c49] text-white border-[#006c49] shadow-md shadow-[#006c49]/20"
                    : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider font-extrabold ${selectedDate === d.id ? "text-emerald-200" : "text-slate-400"}`}>
                  {d.label}
                </span>
                <span className="text-sm font-black">{d.dateStr}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 font-bold ${
                  selectedDate === d.id ? "bg-emerald-500/30 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}>
                  {d.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Filter Court Category Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
            {["Tất cả cụm sân (8)", "Pickleball Trong Nhà (PB 01 - 04)", "Pickleball VIP Khán Đài (PB 05 - 06)", "Sân Cỏ Nhân Tạo 7 (Sân A & B)"].map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(idx === 0 ? "ALL" : `CAT_${idx}`)}
                className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-colors shadow-xs ${
                  (selectedCategory === "ALL" && idx === 0) || selectedCategory === `CAT_${idx}`
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold"
                    : "bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Matrix Grid Container */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            {/* Matrix Timeline Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="col-span-4 uppercase tracking-wider font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                <span>Mặt sân & Chi tiết</span>
              </div>
              <div className="col-span-2 text-center font-extrabold">
                17:00 - 18:00
                <span className="block text-[10px] font-normal text-slate-400">Ca thường</span>
              </div>
              <div className="col-span-2 text-center font-extrabold text-[#006c49]">
                18:00 - 19:30
                <span className="block text-[10px] font-bold text-amber-500">Ca Vàng ⭐</span>
              </div>
              <div className="col-span-2 text-center font-extrabold text-[#006c49]">
                19:30 - 21:00
                <span className="block text-[10px] font-bold text-rose-500">Ca Siêu Vàng 🔥</span>
              </div>
              <div className="col-span-2 text-center font-extrabold">
                21:00 - 22:30
                <span className="block text-[10px] font-normal text-slate-400">Đêm mát</span>
              </div>
            </div>

            {/* Matrix Rows */}
            {matrixCourts.map((court) => (
              <div
                key={court.id}
                className={`grid grid-cols-12 gap-2 items-center py-2.5 px-2 rounded-2xl transition-colors ${
                  court.id === selectedSlot.courtId
                    ? "bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                {/* Court Info Col (4 cols) */}
                <div className="col-span-4 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]" />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">{court.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${court.badgeColor}`}>
                      {court.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                    {court.spec}
                  </p>
                </div>

                {/* Timeline Slots (8 cols -> 4 slots x 2 cols each) */}
                {court.slots.map((slot, idx) => {
                  const isSelected = selectedSlot.courtId === court.id && selectedSlot.time === slot.time;
                  const isBooked = slot.status === "BOOKED";
                  const isDuprMatch = slot.status === "DUPR_MATCH";

                  return (
                    <div key={idx} className="col-span-2">
                      {isSelected ? (
                        <button
                          type="button"
                          className="w-full h-14 rounded-xl bg-[#006c49] text-white shadow-md flex flex-col items-center justify-center p-1 relative overflow-hidden transition-all transform scale-[1.02] ring-2 ring-[#006c49]"
                        >
                          <div className="absolute top-0 right-0 bg-[#acf847] text-[#102000] text-[9px] px-1 font-black rounded-bl uppercase">
                            ĐANG CHỌN
                          </div>
                          <span className="font-black text-sm text-white">{(slot.price / 1000)}k</span>
                          <span className="text-[10px] text-emerald-200 font-bold">90 phút</span>
                        </button>
                      ) : isBooked ? (
                        <div className="w-full h-14 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex flex-col items-center justify-center p-1 cursor-not-allowed opacity-75">
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-bold">Đã đặt</span>
                        </div>
                      ) : isDuprMatch ? (
                        <div className="w-full h-14 rounded-xl bg-[#acf847]/30 text-[#102000] dark:text-[#acf847] flex flex-col items-center justify-center p-1 cursor-pointer hover:bg-[#acf847]/50 transition-colors border border-[#acf847]/40">
                          <div className="flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5 text-[#304f00] dark:text-[#acf847]" />
                            <span className="text-[11px] font-extrabold">Ghép kèo</span>
                          </div>
                          <span className="text-[10px] font-bold">{slot.duprInfo}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectMatrixSlot(court, slot)}
                          className="w-full h-14 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white shadow-xs flex flex-col items-center justify-center p-1 transition-all group cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          <span className="font-black text-xs text-[#006c49] font-mono">{(slot.price / 1000)}k</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">
                            Còn trống
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Venue Policy & Pitch Amenities Detailed Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Info: Lighting IoT */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#acf847] text-[#102000] flex items-center justify-center shrink-0 font-bold">
                <Zap className="w-5 h-5 text-[#304f00]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Công Nghệ Tự Động Hóa VaoSan IoT
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Hệ thống đèn sân và camera tự kích hoạt trước giờ thi đấu 5 phút khi bạn quét mã check-in qua App, không cần chờ nhân viên sân.
                </p>
              </div>
            </div>

            {/* Right Info: Cancellation Policy */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#006c49] flex items-center justify-center shrink-0 font-bold">
                <ShieldCheck className="w-5 h-5 text-[#006c49]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Chính Sách Hoàn Cọc Linh Hoạt
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Hủy lịch trước giờ thi đấu 2 tiếng: Hoàn 100% về ví VaoSan hoặc tài khoản ngân hàng liên kết trong 60 giây không mất phí.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: BOOKING ORDER SUMMARY & CHECKOUT CARD (STICKY TOP-24 / ~35% WIDTH) */}
        <aside className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 border border-slate-200 dark:border-slate-800 space-y-5">
            {/* Summary Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#006c49] text-white flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Thông Tin Đặt Chỗ</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Mã dự kiến: #VS-7829-PB</span>
                </div>
              </div>
              <span className="text-xs font-bold text-[#006c49] bg-emerald-500/10 px-2.5 py-1 rounded-full">
                1 Sân Đã Chọn
              </span>
            </div>

            {/* Selected Slot Quick Overview Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Địa điểm & Sân</span>
                  <p className="font-black text-sm text-slate-900 dark:text-white">{selectedSlot.courtName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Khu Phức Hợp D-Sport Oasis • Q.7</p>
                </div>
                <Award className="w-6 h-6 text-[#006c49]" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Ngày thi đấu</span>
                  <p className="font-bold text-slate-900 dark:text-white">Hôm nay (18/10)</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Khung giờ</span>
                  <p className="font-bold text-[#006c49]">{selectedSlot.time} ({selectedSlot.duration})</p>
                </div>
              </div>
            </div>

            {/* Price Breakdown Calculation */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Giá gốc ca vàng (90 phút):</span>
                <span className="font-mono text-slate-900 dark:text-white font-bold">{originalPrice.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="flex items-center space-x-1">
                  <span>Hệ thống IoT chiếu sáng:</span>
                  <Info className="w-3.5 h-3.5 text-[#006c49]" />
                </span>
                <span className="font-mono text-[#006c49] font-bold">Miễn phí</span>
              </div>

              {/* Voucher applied tag */}
              <div className="flex justify-between items-center bg-emerald-500/10 p-2.5 rounded-xl text-[#006c49] border border-emerald-500/20">
                <div className="flex items-center space-x-2">
                  <Ticket className="w-4 h-4 text-[#006c49]" />
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">VaoSan Welcome Promo</span>
                    <span className="text-[10px] text-slate-500">Mã: #VS-20259</span>
                  </div>
                </div>
                <span className="font-mono font-extrabold text-sm">-50.000đ</span>
              </div>

              {/* MatchPoints Loyalty deduction */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useMatchPoints}
                    onChange={(e) => setUseMatchPoints(e.target.checked)}
                    className="w-4 h-4 rounded text-[#006c49] accent-[#006c49] cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Đổi 500 MatchPoints</span>
                </label>
                <span className="font-mono text-[#304f00] dark:text-[#acf847] font-bold text-xs">-20.000đ</span>
              </div>

              {/* Total Summary Row */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold block">TỔNG THANH TOÁN:</span>
                  <span className="text-[11px] text-[#006c49] font-bold">Tiết kiệm 70.000đ</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            </div>

            {/* Deposit Options Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Hình thức thanh toán giữ chỗ
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* Option 1: Deposit 50% */}
                <div
                  onClick={() => setDepositOption("50%")}
                  className={`p-3 rounded-2xl cursor-pointer flex flex-col justify-between border-2 transition-all ${
                    depositOption === "50%"
                      ? "bg-emerald-500/10 border-[#006c49]"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Cọc 50%</span>
                    {depositOption === "50%" && (
                      <span className="w-4 h-4 rounded-full bg-[#006c49] text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-base font-black text-[#006c49] mt-1">
                    {Math.round(totalPrice * 0.5).toLocaleString("vi-VN")}đ
                  </span>
                  <span className="text-[10px] text-slate-500">Trả phần còn lại tại sân</span>
                </div>

                {/* Option 2: Pay 100% */}
                <div
                  onClick={() => setDepositOption("100%")}
                  className={`p-3 rounded-2xl cursor-pointer flex flex-col justify-between border-2 transition-all ${
                    depositOption === "100%"
                      ? "bg-emerald-500/10 border-[#006c49]"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Trả full 100%</span>
                    {depositOption === "100%" && (
                      <span className="w-4 h-4 rounded-full bg-[#006c49] text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-base font-black text-slate-900 dark:text-white mt-1">
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                  <span className="text-[10px] text-slate-500">Tặng ngay +50 MP</span>
                </div>
              </div>
            </div>

            {/* Smart Preferences Toggles */}
            <div className="space-y-2 text-xs">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoLighting}
                  onChange={(e) => setAutoLighting(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#006c49] accent-[#006c49]"
                />
                <span className="text-slate-700 dark:text-slate-300 leading-tight">
                  <strong>Tự động kích hoạt đèn sân</strong> đúng 19:25 qua mã VaoSan QuickPass
                </span>
              </label>
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableMatchmaking}
                  onChange={(e) => setEnableMatchmaking(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#006c49] accent-[#006c49]"
                />
                <span className="text-slate-700 dark:text-slate-300 leading-tight">
                  <strong>Bật Kèo Ghép Đội</strong> cho các thành viên DUPR cùng trình độ tìm tới giao lưu
                </span>
              </label>
            </div>

            {/* Redis Lock Timer Alert */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 animate-spin text-amber-500" />
                <span>Redis Lock Giữ Sân:</span>
              </div>
              <span className="font-mono text-sm font-black">{formatLockTimer(lockCountdown)}</span>
            </div>

            {/* Main Booking CTA Button */}
            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white font-black text-sm shadow-lg shadow-[#006c49]/30 flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
              >
                <span>Xác Nhận & Tạo Mã VietQR</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center justify-center space-x-1 text-center text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006c49]" />
                <span>Bảo chứng bởi <strong>VaoSan SafePlay™</strong> • Hoàn cọc 100% nếu hủy trước 2h</span>
              </div>
            </div>
          </div>

          {/* Live Venue Host Card */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#006c49]/10 text-[#006c49] flex items-center justify-center font-bold text-xs">
                DO
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">Ban Quản Lý D-Sport Oasis</span>
                <span className="text-[11px] text-slate-400 block">Phản hồi tin nhắn: ~3 phút</span>
              </div>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#006c49] font-bold text-xs transition-colors flex items-center space-x-1"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#006c49]" />
              <span>Hỏi sân</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
