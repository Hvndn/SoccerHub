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
  AlertCircle
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
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"BOOKING" | "RULES" | "REVIEWS">("BOOKING");
  const [isLiked, setIsLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(300); // 5 mins lock simulation

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (selectedSlots.length > 0) {
      setLockCountdown(300);
      const timer = setInterval(() => {
        setLockCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedSlots.length]);

  // Venue metadata matching exact Stitch canvas specification
  const venueData = {
    name: pitch?.name || "CLB & Khu Phức Hợp Thể Thao D-Sport Oasis",
    address: pitch?.address || "Đường số 7, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh (Cách Crescent Mall 400m)",
    distanceKm: pitch?.distanceKm || 1.8,
    rating: pitch?.rating || 4.9,
    reviewsCount: pitch?.reviewsCount || 128,
    sportBadge: pitch?.sportBadge || "🏓 Chuẩn DUPR Tour",
    mainImage: pitch?.imageUrl || "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80",
    subImages: [
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=600&q=80"
    ]
  };

  const datesList = [
    { id: "TODAY", label: "Hôm Nay", dateStr: "T4, 16/09", badge: "Ca Vàng Hot" },
    { id: "TOMORROW", label: "Ngày Mai", dateStr: "T5, 17/09", badge: null },
    { id: "DAY3", label: "Thứ Sáu", dateStr: "T6, 18/09", badge: null },
    { id: "DAY4", label: "Thứ Bảy", dateStr: "T7, 19/09", badge: "Cuối Tuần" }
  ];

  // Matrix of courts and their available time slots
  const courtMatrix = [
    {
      courtId: "c1",
      courtName: "Sân VIP Center (Mái Che Acrylic)",
      badge: "Sân Đấu DUPR Pro",
      slots: [
        { id: "c1-1730", time: "17:30 - 19:00", price: 140000, status: "AVAILABLE", isHot: true },
        { id: "c1-1900", time: "19:00 - 20:30", price: 160000, status: "LOCKED_OTHER", isHot: true, lockMsg: "Đang giữ chỗ 2ph" },
        { id: "c1-2030", time: "20:30 - 22:00", price: 130000, status: "AVAILABLE", isHot: false }
      ]
    },
    {
      courtId: "c2",
      courtName: "Sân PB Standard 01 (Indoor)",
      badge: "Thảm PVC 8 Lớp",
      slots: [
        { id: "c2-1730", time: "17:30 - 19:00", price: 120000, status: "BOOKED", isHot: false },
        { id: "c2-1900", time: "19:00 - 20:30", price: 135000, status: "AVAILABLE", isHot: true },
        { id: "c2-2030", time: "20:30 - 22:00", price: 110000, status: "AVAILABLE", isHot: false }
      ]
    },
    {
      courtId: "c3",
      courtName: "Sân PB Standard 02 (Outdoor Đèn Lux 800)",
      badge: "Máy Bắn Bóng AI",
      slots: [
        { id: "c3-1730", time: "17:30 - 19:00", price: 110000, status: "AVAILABLE", isHot: false },
        { id: "c3-1900", time: "19:00 - 20:30", price: 125000, status: "AVAILABLE", isHot: true },
        { id: "c3-2030", time: "20:30 - 22:00", price: 100000, status: "AVAILABLE", isHot: false }
      ]
    }
  ];

  const handleToggleSlot = (court: any, slot: any) => {
    if (slot.status !== "AVAILABLE") return;
    const exists = selectedSlots.some((s) => s.id === slot.id);
    if (exists) {
      setSelectedSlots(selectedSlots.filter((s) => s.id !== slot.id));
    } else {
      setSelectedSlots([...selectedSlots, { ...slot, courtName: court.courtName }]);
    }
  };

  const handleConfirmBooking = () => {
    if (selectedSlots.length === 0) return;
    const firstSlot = selectedSlots[0];
    onSelectSlot(pitch || venueData, {
      time: `${firstSlot.time} (${selectedSlots.length} ca đã chọn)`,
      price: totalPrice.toLocaleString("vi-VN") + "đ",
      pitchType: firstSlot.courtName
    });
  };

  const totalPrice = selectedSlots.reduce((sum, item) => sum + item.price, 0);

  const formatLockTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full space-y-6 pb-24 animate-fade-in text-slate-900 dark:text-white">
      {/* 1. TOP STICKY BAR: BACK BUTTON & IOT STATUS INDICATOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-2xl bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs transition-all flex items-center space-x-2 active:scale-95 shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span>← Quay Lại Danh Sách Sân</span>
          </button>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Trang Chủ</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Chi Tiết Sân Sài Gòn</span>
            <ChevronRight className="w-3.5 h-3.5 text-pitch-emerald" />
            <span className="text-pitch-emerald font-bold truncate max-w-[200px]">{venueData.name}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>IoT Auto-Light Online • 8/8 Sân Sẵn Sàng</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN COCKPIT LAYOUT (GRID 12 COLS: 8 COLS MAIN + 4 COLS SIDEBAR) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: MAIN VENUE DETAILS & SLOT MATRIX (8 COLS) */}
        <main className="xl:col-span-8 space-y-6">
          {/* Main Title Header */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-pitch-emerald/10 border border-pitch-emerald/30 text-pitch-emerald text-xs font-extrabold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>DUPR Verified 3.0+</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>IoT Smart-Lighting</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
                    ☂️ 8 Sân Tiêu Chuẩn Mái Che
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {venueData.name}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center space-x-1 text-amber-500 font-bold bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-500/20">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{venueData.rating}</span>
                    <span className="text-slate-400 font-normal">({venueData.reviewsCount} đánh giá)</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-pitch-emerald" />
                    <span>{venueData.address}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-3 rounded-2xl border transition-all flex items-center space-x-2 text-xs font-bold ${
                    isLiked
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                  <span>{isLiked ? "Đã Thích" : "Yêu Thích"}</span>
                </button>

                <button
                  onClick={handleCopyShare}
                  className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center space-x-2 text-xs font-bold"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copiedLink ? "Đã Chép!" : "Chia Sẻ"}</span>
                </button>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(venueData.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 rounded-2xl bg-pitch-emerald hover:bg-pitch-darkEmerald text-white font-extrabold text-xs transition-all flex items-center space-x-1.5 shadow-md shadow-pitch-emerald/20 active:scale-95"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Chỉ Đường ({venueData.distanceKm}km)</span>
                </a>
              </div>
            </div>

            {/* Bento Grid Architecture Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-3xl overflow-hidden pt-2">
              <div className="md:col-span-2 relative group overflow-hidden rounded-2xl h-72 md:h-80 border border-slate-200 dark:border-slate-800">
                <img
                  src={venueData.mainImage}
                  alt="Sân Pickleball Acrylic 8 lớp"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-5">
                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-md bg-pitch-emerald text-white text-xs font-black uppercase tracking-wider">
                      VIP Center Court
                    </span>
                    <p className="text-white font-bold text-sm sm:text-base">Thảm Cushion Acrylic 8 Lớp Chuẩn Giải Đấu USA</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-1 gap-3 h-72 md:h-80">
                <div className="relative group overflow-hidden rounded-2xl h-full border border-slate-200 dark:border-slate-800">
                  <img
                    src={venueData.subImages[0]}
                    alt="Phòng Thay Đồ VIP"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-3">
                    <p className="text-white font-bold text-xs">Phòng Tắm Hot-Water & Locker Smart</p>
                  </div>
                </div>
                <div className="relative group overflow-hidden rounded-2xl h-full border border-slate-200 dark:border-slate-800">
                  <img
                    src={venueData.subImages[1]}
                    alt="Khu Căng Tin & Whey Bar"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-3">
                    <p className="text-white font-bold text-xs">Whey Bar & Căng Tin Máy Lạnh</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Amenities Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Tiện Nghi & Hạ Tầng Tiêu Chuẩn Quốc Tế
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <span>Bãi Ô Tô 4 bánh</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <ShowerHead className="w-4 h-4" />
                  </div>
                  <span>Tắm Nóng Lạnh</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Tv className="w-4 h-4" />
                  </div>
                  <span>AI Camera Replay</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <span>Wifi Mesh 6</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <span>Whey Protein Bar</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>Ghép Điểm DUPR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Tabs Container (Booking Matrix & Rules & Reviews) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-6 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("BOOKING")}
                className={`pb-4 font-extrabold text-sm border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
                  activeTab === "BOOKING"
                    ? "border-pitch-emerald text-pitch-emerald"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt Khung Giờ Sân (Live Matrix)</span>
              </button>
              <button
                onClick={() => setActiveTab("RULES")}
                className={`pb-4 font-extrabold text-sm border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
                  activeTab === "RULES"
                    ? "border-pitch-emerald text-pitch-emerald"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Info className="w-4 h-4" />
                <span>Nội Quy & Chính Sách Ca Sân</span>
              </button>
              <button
                onClick={() => setActiveTab("REVIEWS")}
                className={`pb-4 font-extrabold text-sm border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
                  activeTab === "REVIEWS"
                    ? "border-pitch-emerald text-pitch-emerald"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Đánh Giá Của VĐV (128)</span>
              </button>
            </div>

            {/* TAB 1: BOOKING MATRIX */}
            {activeTab === "BOOKING" && (
              <div className="space-y-6">
                {/* Date Selector Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1">
                    {datesList.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDate(d.id)}
                        className={`px-5 py-3 rounded-2xl border text-xs font-bold shrink-0 transition-all flex flex-col items-center min-w-[110px] ${
                          selectedDate === d.id
                            ? "bg-pitch-emerald text-white border-pitch-emerald shadow-lg shadow-pitch-emerald/20"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="font-extrabold">{d.label}</span>
                        <span className="text-[10px] opacity-80">{d.dateStr}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center space-x-1.5 text-emerald-500 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Trống</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-amber-500 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Đang giữ chỗ</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-slate-400 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span>Đã đặt</span>
                    </span>
                  </div>
                </div>

                {/* Court Rows Matrix */}
                <div className="space-y-4">
                  {courtMatrix.map((court) => (
                    <div
                      key={court.courtId}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-base text-slate-900 dark:text-white">
                            {court.courtName}
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold">
                            {court.badge}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Kích thước chuẩn BWF/DUPR
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {court.slots.map((slot) => {
                          const isSelected = selectedSlots.some((s) => s.id === slot.id);
                          const isAvailable = slot.status === "AVAILABLE";
                          const isLockedOther = slot.status === "LOCKED_OTHER";

                          return (
                            <button
                              key={slot.id}
                              disabled={!isAvailable}
                              onClick={() => handleToggleSlot(court, slot)}
                              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-28 ${
                                isSelected
                                  ? "bg-pitch-emerald/10 border-2 border-pitch-emerald text-pitch-emerald shadow-md"
                                  : isAvailable
                                  ? "bg-white dark:bg-slate-900 hover:border-pitch-emerald/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                                  : isLockedOther
                                  ? "bg-amber-500/5 border-amber-500/30 text-amber-600 dark:text-amber-400 cursor-not-allowed opacity-80"
                                  : "bg-slate-200/50 dark:bg-slate-800/30 border-slate-300 dark:border-slate-800 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs font-black tracking-tight">{slot.time}</span>
                                {slot.isHot && isAvailable && (
                                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                                    HOT 🔥
                                  </span>
                                )}
                                {isSelected && (
                                  <CheckCircle2 className="w-5 h-5 text-pitch-emerald fill-pitch-emerald/20" />
                                )}
                              </div>

                              <div className="flex items-end justify-between w-full mt-2">
                                <div>
                                  <span className="text-base font-black">
                                    {slot.price.toLocaleString("vi-VN")}đ
                                  </span>
                                  <span className="text-[10px] block opacity-75 font-normal">/ ca 90 phút</span>
                                </div>

                                <div>
                                  {isAvailable && (
                                    <span
                                      className={`px-3 py-1 rounded-lg text-xs font-extrabold ${
                                        isSelected ? "bg-pitch-emerald text-white" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      }`}
                                    >
                                      {isSelected ? "Đã Chọn" : "Đặt Ngay"}
                                    </span>
                                  )}
                                  {isLockedOther && (
                                    <span className="text-xs font-bold text-amber-600 flex items-center space-x-1">
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>{slot.lockMsg}</span>
                                    </span>
                                  )}
                                  {slot.status === "BOOKED" && (
                                    <span className="text-xs font-bold text-slate-400">Đã Hết</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: RULES */}
            {activeTab === "RULES" && (
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 space-y-4 text-xs">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-pitch-emerald" />
                  <span>Quy Định Sử Dụng Sân & Hoàn Tiền Cọc</span>
                </h4>

                <ul className="space-y-2.5 list-disc list-inside text-slate-600 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
                  <li>Vui lòng mang giày thể thao thảm non-marking (không gây vệt đen lên mặt sân Acrylic/PVC).</li>
                  <li>Không mang đồ ăn nhiều dầu mỡ và nước có ga màu đậm vào khu vực thi đấu.</li>
                  <li>Hủy ca trước 12 tiếng: Hoàn lại 100% tiền cọc vào ví SoccerHub / Tài khoản ngân hàng.</li>
                  <li>Hủy ca trước 4 tiếng: Hoàn 50% tiền cọc. Hủy dưới 4 tiếng không hỗ trợ hoàn cọc.</li>
                  <li>Hệ thống đèn IoT sẽ tự động kích hoạt 5 phút trước ca giờ thi đấu.</li>
                </ul>
              </div>
            )}

            {/* TAB 3: REVIEWS */}
            {activeTab === "REVIEWS" && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl font-black text-slate-900 dark:text-white">4.9</div>
                    <div>
                      <div className="flex items-center text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-500" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">128 đánh giá xác thực từ VĐV</span>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                    98% Hài Lòng
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-pitch-emerald text-white font-bold flex items-center justify-center">
                        NV
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Nguyễn Văn Khang (DUPR 3.45)</p>
                        <span className="text-[10px] text-slate-400">Đã đá ca 19:30 - Hôm qua</span>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span className="font-bold ml-1">5.0</span>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    "Sân mới làm thảm 8 lớp cực kỳ mượt, bám giày tốt không bị trơn. Đèn IoT bứt phá sáng chuẩn 800 lux không rát mắt. Có căng tin phục vụ Whey mát lạnh sau trận!"
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: SIDEBAR WIDGETS MATCHING STITCH SPEC (4 COLS) */}
        <aside className="xl:col-span-4 space-y-6">
          {/* SIDEBAR WIDGET 1: QUICK VENUE SUMMARY & MINI MAP */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-[#0b4f6c] dark:text-sky-400">
              <MapPin className="w-4 h-4" />
              <span>Vị Trí & Bản Đồ Sân Trực Tiếp</span>
            </div>

            {/* Mini Map Placeholder */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <img
                src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80"
                alt="Map view"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center">
                <div className="px-3 py-1.5 rounded-full bg-slate-900/90 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg border border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-pitch-emerald animate-ping" />
                  <span>D-Sport Oasis Q7 (Cách 1.8km)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Giờ mở cửa:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">05:00 - 23:30 (Hàng ngày)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Hỗ trợ hotline:</span>
                <span className="font-extrabold text-pitch-emerald font-mono">0908 123 456</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 dark:text-slate-400">Giữ ca bằng:</span>
                <span className="font-extrabold text-amber-500">VietQR cọc 50%</span>
              </div>
            </div>
          </section>

          {/* SIDEBAR WIDGET 2: DUPR MATCHMAKING AT THIS VENUE */}
          <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="font-extrabold text-sm text-white">Kèo Ghép Đội Tại Sân Này</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                DUPR 3.0+
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-sky-300">🏓 Pickleball Đôi Nam</span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                  Thiếu 1 Chân
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Ca 19:30 - 21:00 tối nay tại Sân VIP Center. Đã có 3 VĐV chỉ số DUPR 3.2.
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-[11px] font-mono font-bold text-emerald-400">Share phí: 40.000đ/người</span>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-pitch-emerald hover:bg-pitch-darkEmerald text-white font-extrabold text-[11px] transition-all"
                >
                  Tham Gia Kèo →
                </button>
              </div>
            </div>
          </section>

          {/* SIDEBAR WIDGET 3: LIVE WEATHER & AIR QUALITY AT PITCH */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-900 dark:text-white">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Thời Tiết Sân Trực Tiếp</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <Sun className="w-8 h-8 text-amber-500" />
                <div>
                  <span className="text-base font-black text-slate-900 dark:text-white block">29°C • Nắng Nhẹ</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">AQI 28 (Không khí rất tốt)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-500 block">Tốt Cho Thể Thao</span>
                <span className="text-[10px] text-slate-400">Gió 12 km/h</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* STICKY BOTTOM BOOKING BAR */}
      {selectedSlots.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-800 z-40 shadow-2xl animate-slide-up flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto rounded-t-3xl">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center space-x-2">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Redis Lock: {formatLockTimer(lockCountdown)}</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Đã chọn {selectedSlots.length} ca giờ</span>
              <span className="text-xl font-black text-pitch-emerald">
                {totalPrice.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => setSelectedSlots([])}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors shrink-0"
            >
              Xóa Chọn
            </button>

            <button
              onClick={handleConfirmBooking}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-pitch-emerald hover:bg-pitch-darkEmerald text-white font-extrabold text-xs transition-all shadow-lg shadow-pitch-emerald/30 flex items-center justify-center space-x-2 active:scale-95"
            >
              <span>Xác Nhận Đặt & Thanh Toán VietQR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
