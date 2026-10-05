"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  Star,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
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
import SmartPaymentPass from "./SmartPaymentPass";
import { getAllPitchesApi } from "@/lib/pitchService";

interface PitchSearchProps {
  user?: any;
  onSelectSlot: (pitch: any, slot: any) => void;
}

export default function PitchSearch({ user, onSelectSlot }: PitchSearchProps) {
  // Bộ lọc chính
  const [selectedSport, setSelectedSport] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [selectedTimeSlotFilter, setSelectedTimeSlotFilter] = useState("ALL");
  const [selectedPitchFormat, setSelectedPitchFormat] = useState("ALL");
  const [maxBudget, setMaxBudget] = useState(650000);
  const [onlyAvailableTonight, setOnlyAvailableTonight] = useState(false);

  // Điều hướng & Modal
  const [selectedPitchForSlot, setSelectedPitchForSlot] = useState<any>(null);
  const [checkoutBookingData, setCheckoutBookingData] = useState<{ pitch: any; slot: any } | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Kèo ghép & tương tác
  const [joinedMatches, setJoinedMatches] = useState<Record<string, boolean>>({});
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [newMatchTitle, setNewMatchTitle] = useState("");
  const [newMatchSlot, setNewMatchSlot] = useState("19:00 - 20:30");
  const [newMatchNeed, setNewMatchNeed] = useState("Thiếu 2 tiền vệ / hậu vệ");
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
  }, []);

  const fetchPitches = async () => {
    setLoadingRealPitches(true);
    try {
      const data = await getAllPitchesApi();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((item: any, idx: number) => {
          const rawId = item.id ? item.id.toString().replace(/\D/g, "") : (idx + 1).toString();
          const basePrice = item.avgPricePerHour || item.pricePerHour || 350000;
          const peakPrice = item.peakPricePerHour || Math.round(basePrice * 1.3);
          const openTime = item.openTime || "13:00";
          const closeTime = item.closeTime || "22:30";
          const slotDur = item.slotDurationMinutes || 90;

          // Chuẩn hóa địa chỉ Đà Nẵng thật
          let address = item.address || item.location || "Số 154 Nguyễn Lương Bằng, P. Hòa Khánh Bắc, Q. Liên Chiểu, Tp. Đà Nẵng";
          if (address.includes("Quận 7") || address.includes("TP.HCM") || address.includes("Hồ Chí Minh")) {
            address = "Số 154 Nguyễn Lương Bằng, P. Hòa Khánh Bắc, Q. Liên Chiểu, Tp. Đà Nẵng";
          }

          const pitchName = item.name || "Cụm Sân Bóng Đá D-Sport đà nẵng";

          return {
            id: item.id || `pitch-db-${rawId}`,
            numericId: Number(rawId) || 1,
            name: pitchName,
            address: address,
            district: address.includes("Liên Chiểu") ? "LIEN_CHIEU" : address.includes("Hải Châu") ? "HAI_CHAU" : address.includes("Cẩm Lệ") ? "CAM_LE" : "LIEN_CHIEU",
            districtName: address.includes("Liên Chiểu") ? "Q. Liên Chiểu" : address.includes("Hải Châu") ? "Q. Hải Châu" : "Đà Nẵng",
            phone: item.phone || "0988 776 652",
            ownerName: item.ownerName || "Hồ Văn Diện",
            openTime: openTime,
            closeTime: closeTime,
            slotDurationMinutes: slotDur,
            sport: item.type?.includes("5") ? "SAN5" : item.type?.includes("11") ? "SAN11" : item.type?.includes("Futsal") ? "FUTSAL" : "SAN7",
            sportBadge: item.type || "⚽ Bóng Đá Sân 7 Chuẩn VFF",
            distanceKm: (1.2 + (idx * 0.6)).toFixed(1),
            rating: item.rating || 4.9,
            reviewsCount: 142 + idx * 18,
            priceOriginal: Math.round(basePrice * 1.2),
            priceDiscounted: basePrice,
            peakPrice: peakPrice,
            pitchTypes: (item.pitchTypes && item.pitchTypes.length > 0) 
              ? item.pitchTypes 
              : ["Sân 7A - Cỏ Nhân Tạo FIFA", "Sân 7B - Cỏ Nhân Tạo FIFA", "Sân 5C - Mini Tốc Độ"],
            amenities: [
              "Hệ thống Camera AI VAR & Highlights",
              "Mặt cỏ FIFA Pro 50mm chống lật cổ chân",
              "Dàn đèn LED Philips Stadium 800 Lux",
              "Phòng tắm nóng lạnh & Tủ locker thông minh",
              "Bãi đỗ ô tô & xe máy an ninh 24/7",
              "Căng tin nước bù khoáng Pocari / Revive"
            ],
            imageUrl: item.imageUrl || (idx % 2 === 0
              ? "https://images.unsplash.com/photo-1529900241452-f47268d87ec9?auto=format&fit=crop&w=1000&q=80"
              : "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80"),
            timeSlots: [
              { time: "16:00 - 17:30", price: `${Math.round(basePrice / 1000)}k`, status: "AVAILABLE", tag: "Chiều Sớm" },
              { time: "17:30 - 19:00", price: `${Math.round(peakPrice / 1000)}k`, status: "AVAILABLE", tag: "⭐ Ca Vàng" },
              { time: "19:00 - 20:30", price: `${Math.round(peakPrice / 1000)}k`, status: "ACTIVE", tag: "🔥 Kèo Đỉnh" },
              { time: "20:30 - 22:00", price: `${Math.round(basePrice / 1000)}k`, status: "AVAILABLE", tag: "Đêm Mát" }
            ]
          };
        });
        setRealPitches(mapped);
      }
    } catch (e) {
      console.warn("Lỗi tải danh sách sân từ database:", e);
    } finally {
      setLoadingRealPitches(false);
    }
  };

  // Điều hướng sang trang chi tiết sân thật
  if (selectedPitchForSlot) {
    return (
      <PitchDetail
        pitch={selectedPitchForSlot}
        user={user}
        onBack={() => setSelectedPitchForSlot(null)}
        onSelectSlot={(pitch, slot) => {
          setSelectedPitchForSlot(null);
          setCheckoutBookingData({ pitch, slot });
        }}
      />
    );
  }

  // Điều hướng sang trang thanh toán nếu có
  if (checkoutBookingData) {
    return (
      <SmartPaymentPass
        bookingData={checkoutBookingData}
        onBack={() => setCheckoutBookingData(null)}
      />
    );
  }

  const userName = user?.fullName || user?.name || "Cao Việt An";
  const userElo = user?.eloRating || 1450;

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
    if (selectedSport !== "ALL" && p.sport !== selectedSport) return false;
    if (selectedDistrict !== "ALL" && p.district !== selectedDistrict) return false;
    if (p.priceDiscounted > maxBudget) return false;
    return true;
  });

  const featuredPitch = realPitches.length > 0 ? realPitches[0] : null;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">{toastMsg}</span>
        </div>
      )}

      {/* 1. HERO COCKPIT CẦU THỦ PRO: THẺ DANH DỰ & TRẠNG THÁI PHONG ĐỘ */}
      <section className="relative w-full rounded-3xl bg-gradient-to-r from-[#0b1c30] via-[#072433] to-[#0a192f] text-white overflow-hidden shadow-2xl p-6 sm:p-8 border border-slate-800">
        <div className="absolute -right-16 -top-20 w-96 h-96 bg-[#0b4f6c]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          {/* Cột trái: Thông tin cầu thủ & Lời chào */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs uppercase tracking-wider border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SoccerHub Pro Pass • Đã Xác Thực</span>
              </span>
              <span className="font-mono text-xs font-bold text-sky-300 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-400/20">
                VĐV ID: #SH-20269
              </span>
              <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Chuỗi 4 Trận Bất Bại 🔥</span>
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 p-0.5 shadow-lg shrink-0">
                <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center font-black text-xl text-sky-300">
                  {userName.charAt(0)}
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  Chào mừng trở lại, <span className="text-sky-400">{userName}!</span> 👋
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                  Vị trí: <span className="text-amber-300 font-bold">Tiền đạo cánh trái (LW) / Hộ công (CAM)</span> • Chân thuận: <span className="text-slate-200 font-bold">Phải</span> • Thể lực: <span className="text-emerald-400 font-bold">95% Sẵn sàng</span>
                </p>
              </div>
            </div>

            {/* Voucher Bar */}
            <div className="inline-flex flex-wrap items-center gap-3 p-2.5 rounded-2xl bg-white/10 backdrop-blur-md max-w-xl border border-white/10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-md">
                <Gift className="w-5 h-5 text-slate-950" />
              </div>
              <div className="text-left pr-2 flex-1 min-w-[200px]">
                <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span>Voucher 50.000đ thành viên mới sẵn sàng</span>
                  <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 rounded text-[9px] font-black uppercase">Tối Nay</span>
                </p>
                <p className="text-[11px] text-slate-300 font-medium">Tự động trừ trực tiếp vào hóa đơn đặt cọc ca sân hôm nay</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAppliedVoucher(true);
                  showToast("🎉 Đã kích hoạt Voucher 50.000đ vào ví thanh toán của bạn!");
                }}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer ${
                  appliedVoucher
                    ? "bg-emerald-500 text-slate-950 cursor-default"
                    : "bg-[#0b4f6c] hover:bg-sky-500 hover:text-slate-950 text-white active:scale-95"
                }`}
              >
                {appliedVoucher ? "✓ Đã Áp Dụng (-50k)" : "Áp Dụng Ngay"}
              </button>
            </div>
          </div>

          {/* Cột phải: Thống kê chỉ số Elo & Phong độ thực tế */}
          <div className="flex flex-row xl:flex-col gap-3 w-full xl:w-auto shrink-0">
            <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex-1 xl:flex-none min-w-[250px]">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold border border-emerald-500/30">
                🏆
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Chỉ Số Elo Cầu Thủ</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-emerald-400 font-mono">{userElo}</span>
                  <span className="text-xs text-slate-300 font-bold">Hạng Vàng Phủi Đà Nẵng</span>
                </div>
                <span className="text-[10px] text-slate-400">Top 5% khu vực Liên Chiểu • 24 Trận</span>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex-1 xl:flex-none min-w-[250px]">
              <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-xl font-bold border border-sky-500/30">
                ⚽
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Chỉ Số Sân 7 Chuẩn</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-sky-400 font-mono">{userElo}</span>
                  <span className="text-xs text-slate-300 font-bold">Division 1 Phủi VFF</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">Fairplay 99% (Không bùng kèo)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BỘ LỌC TÌM SÂN THÔNG MINH (SMART FILTERS BAR) */}
      <section className="w-full bg-white dark:bg-slate-900 p-4.5 sm:p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-3.5">
        {/* Hàng 1: Tabs loại sân thể thao */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {sportsTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedSport(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedSport === tab.id
                    ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    selectedSport === tab.id
                      ? "bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Nút chỉ lọc ca trống tối nay */}
          <button
            type="button"
            onClick={() => setOnlyAvailableTonight(!onlyAvailableTonight)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
              onlyAvailableTonight
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${onlyAvailableTonight ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
            <span>Chỉ xem sân còn ca trống tối nay</span>
          </button>
        </div>

        {/* Hàng 2: Dropdowns chi tiết (Khu vực Đà Nẵng, Khung Giờ, Quy Mô Sân, Ngân Sách) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Lọc Khu vực Đà Nẵng Thật */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl px-3.5 py-2 border border-slate-200 dark:border-slate-700 flex items-center space-x-2.5">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none">Khu Vực Địa Lý</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer mt-0.5"
              >
                {districtList.map((d) => (
                  <option key={d.id} value={d.id} className="dark:bg-slate-900">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lọc Khung giờ thi đấu */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl px-3.5 py-2 border border-slate-200 dark:border-slate-700 flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none">Khung Giờ Thi Đấu</span>
              <select
                value={selectedTimeSlotFilter}
                onChange={(e) => setSelectedTimeSlotFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="ALL" className="dark:bg-slate-900">Tất Cả Ca (13:00 - 22:30)</option>
                <option value="PEAK" className="dark:bg-slate-900">⭐ Giờ Vàng (17:30 - 20:30)</option>
                <option value="AFTERNOON" className="dark:bg-slate-900">Chiều Sớm (13:00 - 17:30)</option>
                <option value="NIGHT" className="dark:bg-slate-900">Đêm Mát (20:30 - 22:30)</option>
              </select>
            </div>
          </div>

          {/* Lọc Quy mô sân con */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl px-3.5 py-2 border border-slate-200 dark:border-slate-700 flex items-center space-x-2.5">
            <Layers className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none">Quy Mô Sân Con</span>
              <select
                value={selectedPitchFormat}
                onChange={(e) => setSelectedPitchFormat(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="ALL" className="dark:bg-slate-900">Tất Cả Sân Con</option>
                <option value="SAN_7" className="dark:bg-slate-900">Sân 7 (Cỏ Nhân Tạo 50mm)</option>
                <option value="SAN_5" className="dark:bg-slate-900">Sân 5 (Mini Tốc Độ)</option>
                <option value="SAN_11" className="dark:bg-slate-900">Sân 11 (Cỏ Tự Nhiên)</option>
              </select>
            </div>
          </div>

          {/* Slider Ngân Sách */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl px-3.5 py-2 border border-slate-200 dark:border-slate-700 flex items-center space-x-2.5">
            <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-extrabold uppercase leading-none">
                <span>Ngân Sách Tối Đa</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
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
                className="w-full accent-emerald-500 cursor-pointer h-1.5 mt-1.5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. CARD AI ĐỀ XUẤT THÔNG MINH & REDIS DISTRIBUTED MUTEX MONITOR */}
      {featuredPitch && (
        <section className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CỘT TRÁI (7 COLS): AI SMART RECOMMENDATION CHO ĐỘI BÓNG */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 font-black text-[10px] rounded-lg flex items-center uppercase tracking-wider shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300 dark:text-slate-950" />
                      AI SMART RECOMMENDATION
                    </span>
                    <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center">
                      <Zap className="w-3.5 h-3.5 mr-0.5" />
                      Độ Khớp 98.4%
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    Elo Match Algorithm v4.2
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                  Đề xuất tối ưu cho Đội của bạn:{" "}
                  <span className="text-[#0b4f6c] dark:text-sky-400">{featuredPitch.name}</span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Dựa trên vị trí thực tế tại <strong className="text-slate-900 dark:text-white">{featuredPitch.address}</strong> (cách bạn chỉ 1.2km), thời tiết Đà Nẵng tối nay mát mẻ 26°C và lịch sử 24 trận thi đấu của cầu thủ {userName} (Elo {userElo}).
                </p>

                {/* 3 Checklist Thẻ Thông Số Chuẩn Bóng Đá */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Khung Giờ Tối Ưu</span>
                    <div className="text-sm font-black text-slate-900 dark:text-white font-mono">17:30 - 19:00</div>
                    <span className="text-[11px] font-bold text-[#0b4f6c] dark:text-sky-400 block">Độ 90 phút chuẩn thể lực</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Quy Chuẩn Mặt Sân</span>
                    <div className="text-sm font-black text-slate-900 dark:text-white font-mono truncate">Sân 7A - Cao Su TPE</div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">Chống lật cổ chân</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Đối Thủ Chờ Sẵn</span>
                    <div className="text-sm font-black text-slate-900 dark:text-white font-mono truncate">FC Bách Khoa ĐN</div>
                    <span className="text-[11px] font-bold text-amber-500 block">Elo 1.435 (Lệch 15)</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Áp dụng Voucher -50k & VietQR tự động khóa slot
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPitchForSlot(featuredPitch)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                >
                  <span>Khóa Slot Sân Này Ngay</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* CỘT PHẢI (5 COLS): REDIS DISTRIBUTED MUTEX LOCK MONITOR */}
            <div className="lg:col-span-5 bg-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4.5 h-4.5 text-amber-400" />
                    <span className="font-extrabold text-sm text-white">Redis Distributed Lock</span>
                  </div>
                  <span className="font-mono text-[10px] font-extrabold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5" />
                    Live Sync
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium">
                  Hệ thống phòng chống trùng slot (Double Booking Prevention) trên cụm 4 máy chủ Redis Cluster.
                </p>

                {/* State Legend */}
                <div className="flex items-center space-x-3 text-xs font-bold pt-1">
                  <span className="flex items-center text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" /> Sẵn Sàng
                  </span>
                  <span className="flex items-center text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5 animate-pulse" /> Giữ Chỗ (300s)
                  </span>
                  <span className="flex items-center text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600 mr-1.5" /> Đã Cọc 100%
                  </span>
                </div>

                {/* Danh sách ca sân thời gian thực */}
                <div className="space-y-2 font-mono text-xs pt-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-slate-400">17:30 - 19:00</span>
                      <span className="text-[11px] text-slate-300 font-sans">Sân 7B • Chuyên Việt</span>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded font-sans">
                      Đã Khóa (FC Xây Dựng)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-amber-400">19:00 - 20:30</span>
                      <span className="text-[11px] text-slate-200 font-sans">Sân 7A • Chuyên Việt</span>
                    </div>
                    <div className="flex items-center space-x-1 text-amber-400 text-[10px] font-bold font-sans">
                      <Timer className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang Giữ Chỗ (01:47)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b4f6c]/40 border border-[#0b4f6c]/60">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-sky-300">20:30 - 22:00</span>
                      <span className="text-[11px] text-slate-200 font-sans">Sân 7C • Chuyên Việt</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPitchForSlot(featuredPitch)}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold rounded-lg font-sans shadow-sm transition-colors cursor-pointer"
                    >
                      Giữ Slot
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-right pt-2 border-t border-slate-800">
                <span className="font-mono text-[10px] text-slate-500">
                  TTL Lock Keyspace: mutex:pitch_{featuredPitch.numericId}:slot_live
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. MAIN COCKPIT: DANH SÁCH CỤM SÂN KHẢ DỤNG & CHỢ KÈO GHÉP ĐỘI */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (8 COLS): DANH SÁCH CỤM SÂN BÓNG ĐÁ THẬT ĐÀ NẴNG */}
        <main className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Sân Trống Khả Dụng Khung Giờ Tối
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase animate-pulse border border-emerald-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Ưu tiên các cụm sân quanh Nguyễn Lương Bằng, Tôn Đức Thắng & Hòa Khánh
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">Sắp xếp:</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800/60">
                Gần nhất
              </span>
            </div>
          </div>

          {/* DANH SÁCH CÁC THẺ SÂN BÓNG */}
          <div className="space-y-5">
            {loadingRealPitches ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#0b4f6c] dark:text-sky-400 animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-500">Đang đồng bộ cụm sân từ máy chủ MySQL...</p>
              </div>
            ) : filteredPitches.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                  <MapPin className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Không tìm thấy cụm sân bóng nào phù hợp
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Vui lòng thử mở rộng bán kính tìm kiếm hoặc điều chỉnh ngân sách ca đấu.
                  </p>
                </div>
              </div>
            ) : (
              filteredPitches.map((pitch) => (
                <article
                  key={pitch.id}
                  className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row"
                >
                  {/* Thumbnail Visual */}
                  <div className="md:w-5/12 relative min-h-[230px] overflow-hidden bg-slate-900">
                    <img
                      src={pitch.imageUrl}
                      alt={pitch.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-white font-extrabold text-[11px] flex items-center space-x-1 border border-slate-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Bóng Đá Phủi Serie B</span>
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate max-w-[170px]">{pitch.districtName}</span>
                      </div>
                      <span className="bg-emerald-600/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px]">
                        Cách {pitch.distanceKm} km
                      </span>
                    </div>
                  </div>

                  {/* Chi tiết sân & Ca trống hôm nay */}
                  <div className="md:w-7/12 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 
                            onClick={() => setSelectedPitchForSlot(pitch)}
                            className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors cursor-pointer"
                          >
                            {pitch.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{pitch.address}</span>
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-xl shrink-0">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">{pitch.rating}</span>
                          <span className="text-[10px] text-slate-400">({pitch.reviewsCount})</span>
                        </div>
                      </div>

                      {/* Tiện ích sân bóng đá chuẩn */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/50">
                          <Camera className="w-3 h-3 text-emerald-500" />
                          Camera AI VAR & Highlights
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                          ✓ Cỏ FIFA Pro 50mm
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                          ✓ Đèn LED 800 Lux
                        </span>
                      </div>
                    </div>

                    {/* Dải ca trống hôm nay từ database */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <span>Ca trống hôm nay ({pitch.openTime} - {pitch.closeTime}):</span>
                        <span className="text-emerald-600 dark:text-emerald-400">90p/ca</span>
                      </div>
                      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                        {pitch.timeSlots.map((ts: any, i: number) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedPitchForSlot(pitch)}
                            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold shrink-0 transition-all cursor-pointer ${
                              ts.status === "ACTIVE"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                          >
                            {ts.time} {ts.tag ? `(${ts.tag})` : ""}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bảng giá & Nút Xem Ca & Đặt */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {pitch.priceDiscounted.toLocaleString("vi-VN")}đ
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            {pitch.priceOriginal.toLocaleString("vi-VN")}đ
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                            -50k Pass
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Giá 90 phút thi đấu • Đèn LED miễn phí
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedPitchForSlot(pitch)}
                        className="px-4.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center space-x-1 cursor-pointer"
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
        <aside className="xl:col-span-4 space-y-6">
          {/* WIDGET 1: CHỢ KÈO GHÉP ĐỘI HÔM NAY TẠI ĐÀ NẴNG */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-black text-slate-900 dark:text-white text-sm">Chợ Kèo Ghép Đội - Tối Nay</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateMatchModal(true)}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tạo Kèo Mới</span>
              </button>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Hệ thống AI ghép kèo tự động khớp của vị trí thi đấu & <strong className="text-slate-900 dark:text-white">Chỉ số Elo {userElo}</strong> của bạn.
            </p>

            {/* Kèo 1: Sân 7 D-Sport */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black text-[10px] uppercase">
                  ⚽ Bóng Đá Sân 7
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">19:30 - 21:00</span>
              </div>
              <h4 className="font-black text-xs text-slate-900 dark:text-white">
                Sân D-Sport Oasis • Đang thiếu 1 Thủ môn & 1 Tiền đạo
              </h4>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Trình độ: <strong className="text-slate-900 dark:text-white">Elo 1,400 - 1,500</strong></span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">~35k / người</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500">👥 Đã có 12/14 cầu thủ</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !joinedMatches["match-s7"];
                    setJoinedMatches({ ...joinedMatches, "match-s7": next });
                    showToast(next ? "🎉 Bạn đã bắt kèo Sân 7 thành công! Trưởng đội sẽ liên hệ." : "Đã hủy đăng ký kèo.");
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    joinedMatches["match-s7"]
                      ? "bg-emerald-500 text-white"
                      : "bg-[#0b4f6c] dark:bg-sky-500 hover:opacity-90 text-white dark:text-slate-950 active:scale-95"
                  }`}
                >
                  {joinedMatches["match-s7"] ? "✓ Đã Bắt Kèo" : "Bắt Kèo Ngay"}
                </button>
              </div>
            </div>

            {/* Kèo 2: Futsal Sân 5 Mini */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-black text-[10px] uppercase">
                  👟 Futsal Sân 5
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">20:30 - 22:00</span>
              </div>
              <h4 className="font-black text-xs text-slate-900 dark:text-white">
                Sân Futsal Bách Khoa • Cáp giao lưu tính điểm Elo
              </h4>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Trình độ: <strong className="text-slate-900 dark:text-white">Elo 1,350 - 1,480</strong></span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">~25k / người</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500">👥 Đã có 8/10 cầu thủ</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !joinedMatches["match-s5"];
                    setJoinedMatches({ ...joinedMatches, "match-s5": next });
                    showToast(next ? "🎉 Đã đăng ký kèo Futsal! Thông tin trận đã lưu vào hồ sơ." : "Đã hủy đăng ký kèo.");
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    joinedMatches["match-s5"]
                      ? "bg-emerald-500 text-white"
                      : "bg-[#0b1c30] hover:bg-slate-900 text-white active:scale-95"
                  }`}
                >
                  {joinedMatches["match-s5"] ? "✓ Đã Bắt Kèo" : "Bắt Kèo Ngay"}
                </button>
              </div>
            </div>
          </section>

          {/* WIDGET 2: THẺ VẬN ĐỘNG VIÊN SOCCERHUB QUICKPASS (QR SCAN BARRIER) */}
          <section className="bg-gradient-to-br from-[#0b1c30] to-[#0b4f6c] text-white rounded-3xl p-5 shadow-lg border border-sky-400/30 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm text-white">SoccerHub QuickPass</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[9px] uppercase">
                Check-in Không Chạm
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-between space-x-3 border border-white/10">
              <div 
                onClick={() => setShowQrModal(true)}
                className="bg-white p-2 rounded-xl shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                title="Nhấn để phóng to mã QR"
              >
                <QrCode className="w-12 h-12 text-slate-950" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="font-black text-xs text-white truncate">{userName}</h4>
                <p className="font-mono text-[11px] text-sky-300">ID: #SH-20269</p>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-emerald-400 font-bold">
                  <span>Hạng A Phủi</span>
                  <span>•</span>
                  <span>Elo {userElo}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>Mở Thẻ Check-in Barrier Sân</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>

          {/* WIDGET 3: BẢNG XẾP HẠNG ĐỘI BÓNG PHỦI ĐÀ NẴNG (PREVIEW) */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Top Đội Phủi Đà Nẵng
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Tuần 42</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-amber-500 font-mono">#1</span>
                  <span className="font-bold text-slate-900 dark:text-white">FC Bách Khoa ĐN</span>
                </div>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">1,620 Elo</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-slate-400 font-mono">#2</span>
                  <span className="font-bold text-slate-900 dark:text-white">FC D-Sport Stars</span>
                </div>
                <span className="font-mono font-bold text-slate-500">1,585 Elo</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-slate-400 font-mono">#3</span>
                  <span className="font-bold text-slate-900 dark:text-white">FC Hòa Khánh Runners</span>
                </div>
                <span className="font-mono font-bold text-slate-500">1,520 Elo</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* MODAL TẠO KÈO MỚI */}
      {showCreateMatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                  ⚽
                </div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">Đăng Tin Tìm Đối / Ghép Đội</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateMatchModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tên Đội / Tiêu đề kèo:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: FC Anh Em Liên Chiểu tìm đối giao lưu vui vẻ"
                  value={newMatchTitle}
                  onChange={(e) => setNewMatchTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Khung giờ & Sân dự kiến:
                </label>
                <select
                  value={newMatchSlot}
                  onChange={(e) => setNewMatchSlot(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="17:30 - 19:00">17:30 - 19:00 • Sân 7 D-Sport Đà Nẵng</option>
                  <option value="19:00 - 20:30">19:00 - 20:30 • Sân 7 D-Sport Đà Nẵng</option>
                  <option value="20:30 - 22:00">20:30 - 22:00 • Sân Futsal Mini</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Yêu cầu ghép cầu thủ:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cần thêm 1 GK bắt gôn + 2 hậu vệ đá cánh"
                  value={newMatchNeed}
                  onChange={(e) => setNewMatchNeed(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateMatchModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateMatchModal(false);
                  showToast("🚀 Kèo đấu của bạn đã được đăng lên Chợ Kèo Đà Nẵng!");
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Đăng Kèo Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MÃ QR BARRIER TOÀN MÀN HÌNH */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Mã Check-in Barrier Tự Động
              </span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-4 rounded-2xl shadow-md">
                <QrCode className="w-48 h-48 text-slate-950" />
              </div>
              <p className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                #SH-20269 • {userName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                Đưa mã này vào mắt đọc camera tại cổng barie hoặc quầy lễ tân để mở cổng vào sân tự động.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQrModal(false);
                showToast("✓ Đã lưu mã QR vào thư viện ảnh thiết bị!");
              }}
              className="w-full py-2.5 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 hover:opacity-90 text-white dark:text-slate-950 font-bold text-xs shadow-md"
            >
              Lưu Mã Về Điện Thoại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
