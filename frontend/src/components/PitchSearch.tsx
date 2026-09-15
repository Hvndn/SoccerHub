"use client";

import React, { useState } from "react";
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
  Timer
} from "lucide-react";

interface PitchSearchProps {
  user?: any;
  onSelectSlot: (pitch: any, slot: any) => void;
}

export default function PitchSearch({ user, onSelectSlot }: PitchSearchProps) {
  const [selectedSport, setSelectedSport] = useState("ALL");
  const [selectedFormat, setSelectedFormat] = useState("ALL");
  const [selectedTime, setSelectedTime] = useState("NIGHT");
  const [maxBudget, setMaxBudget] = useState(400000);
  const [selectedPitchForSlot, setSelectedPitchForSlot] = useState<any>(null);
  const [appliedVoucher, setAppliedVoucher] = useState(false);
  const [joinedMatch, setJoinedMatch] = useState<string | null>(null);

  const userName = user?.name || "Trần Hoàng Long";
  const userElo = user?.eloRating || 1450;

  const sportsList = [
    { id: "ALL", name: "Tất Cả Môn", icon: "🏆" },
    { id: "PICKLEBALL", name: "Pickleball (Ưu tiên)", icon: "🏓", badge: "DUPR Verified" },
    { id: "FOOTBALL", name: "Bóng Đá (5/7/11)", icon: "⚽" },
    { id: "BADMINTON", name: "Cầu Lông", icon: "🏸" },
    { id: "TENNIS", name: "Tennis", icon: "🎾" }
  ];

  const mockPitches = [
    {
      id: "pitch-101",
      sport: "PICKLEBALL",
      sportBadge: "🏓 Chuẩn DUPR Tour",
      name: "Sân Pickleball D-Sport Oasis",
      address: "Đường số 7, Tân Phú, Quận 7 (Cạnh Crescent Mall)",
      distanceKm: 1.8,
      rating: 4.9,
      reviewsCount: 128,
      priceOriginal: 160000,
      priceDiscounted: 110000,
      pitchTypes: ["8 sân có mái", "Thảm PVC chuẩn USA"],
      amenities: ["Máy bắn bóng", "Tắm nóng lạnh", "Bãi xe 4 bánh", "Ghép điểm DUPR"],
      imageUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80",
      aiReason: "Gần vị trí của bạn 1.8km • Sân có mái che • Ca vàng 19:30 còn trống • Đánh giá 4.9★",
      timeSlots: [
        { time: "18:00 - 19:30", price: "110.000đ", status: "AVAILABLE", tag: null },
        { time: "19:30 - 21:00", price: "110.000đ", status: "ACTIVE", tag: "Ca Vàng" },
        { time: "21:00 - 22:30", price: "100.000đ", status: "AVAILABLE", tag: null }
      ]
    },
    {
      id: "pitch-102",
      sport: "FOOTBALL",
      sportBadge: "⚡ IoT Auto-Light",
      name: "Khu Phức Hợp Thể Thao Nam Sài Gòn",
      address: "Nguyễn Hữu Thọ, Phước Kiển, Nhà Bè (giáp Q7)",
      distanceKm: 3.2,
      rating: 4.8,
      reviewsCount: 94,
      priceOriginal: 330000,
      priceDiscounted: 280000,
      pitchTypes: ["4 Sân 7 + 6 Sân PB", "Cỏ FIFA"],
      amenities: ["Cỏ nhân tạo chuẩn FIFA", "Trọng tài VFF", "Căng tin thể thao"],
      imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
      aiReason: "Sân 7 rộng chuẩn VFF • Đèn chiếu sáng 800 Lux • Đã có 4 đội đặt hôm nay",
      timeSlots: [
        { time: "18:00 - 19:30", price: "280.000đ", status: "ACTIVE", tag: "Sân 7A" },
        { time: "19:30 - 21:00", price: "280.000đ", status: "AVAILABLE", tag: "Sân 7B" },
        { time: "20:30 - 22:00", price: "250.000đ", status: "AVAILABLE", tag: "PB Court 3" }
      ]
    },
    {
      id: "pitch-103",
      sport: "BADMINTON",
      sportBadge: "🏸 Thảm Yonex Thi Đấu",
      name: "CLB Cầu Lông & Tennis Tân Hưng",
      address: "Lê Văn Lương, Tân Hưng, Quận 7",
      distanceKm: 2.4,
      rating: 4.7,
      reviewsCount: 62,
      priceOriginal: 150000,
      priceDiscounted: 120000,
      pitchTypes: ["12 Sân Thảm Yonex", "Máy Lạnh 24°C"],
      amenities: ["Điều hoà 24°C", "Thuê vợt Pro", "Nước Ion kiềm free"],
      imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
      aiReason: "Thảm Yonex chống trơn trượt • Có máy lạnh tổng • Nước uống miễn phí",
      timeSlots: [
        { time: "19:00 - 20:00", price: "120.000đ", status: "AVAILABLE", tag: null },
        { time: "20:00 - 22:00", price: "220.000đ", status: "ACTIVE", tag: "Sân 3" }
      ]
    }
  ];

  const filteredPitches = mockPitches.filter((p) => {
    if (selectedSport !== "ALL" && p.sport !== selectedSport) return false;
    if (p.priceDiscounted > maxBudget) return false;
    return true;
  });

  const modalSlots = [
    { id: "slot-1", time: "18:00 - 19:30", price: 110000, status: "AVAILABLE", pitchType: "Sân Pickleball PB-01 (Mái Che)" },
    { id: "slot-2", time: "19:30 - 21:00", price: 110000, status: "HOLD", pitchType: "Sân Pickleball PB-02 (Ca Vàng)" },
    { id: "slot-3", time: "21:00 - 22:30", price: 100000, status: "AVAILABLE", pitchType: "Sân Pickleball PB-01 (Tối)" },
    { id: "slot-4", time: "18:00 - 19:30", price: 280000, status: "AVAILABLE", pitchType: "Sân Bóng Đá 7A (Cỏ FIFA)" },
    { id: "slot-5", time: "19:30 - 21:00", price: 280000, status: "BOOKED", pitchType: "Sân Bóng Đá 7B (Đã Khóa)" },
    { id: "slot-6", time: "20:00 - 22:00", price: 120000, status: "AVAILABLE", pitchType: "Sân Cầu Lông #3 (Máy Lạnh)" }
  ];

  return (
    <div className="space-y-6">
      {/* 1. WELCOME HERO BANNER (PLACED DIRECTLY ON TOP UNDER NAVBAR) */}
      <section className="relative w-full rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden shadow-2xl p-6 sm:p-8 border border-slate-800">
        <div className="absolute -right-16 -top-20 w-96 h-96 bg-[#0b4f6c]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-24 w-72 h-72 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div className="flex-1 space-y-3.5">
            <div className="flex items-center space-x-3 flex-wrap">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs uppercase tracking-wider border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>VaoSan Sports Pass • Đã kích hoạt</span>
              </span>
              <span className="font-mono text-xs font-bold text-sky-300">VĐV ID: #VS-20269</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Chào mừng trở lại, <span className="text-sky-400">{userName}!</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Hệ sinh thái thể thao VaoSan đã chuẩn bị mặt sân tiêu chuẩn và bạn chơi tương xứng theo chỉ số chuyên môn của bạn.
            </p>

            {/* Voucher Alert Bar */}
            <div className="inline-flex items-center space-x-3 p-2 rounded-2xl bg-white/10 backdrop-blur-md max-w-xl border border-white/10">
              <div className="w-8 h-8 rounded-xl bg-[#0b4f6c] text-sky-300 flex items-center justify-center shrink-0 font-bold">
                <Gift className="w-4 h-4" />
              </div>
              <div className="text-left pr-2">
                <p className="text-xs font-extrabold text-white">Voucher 50.000đ thành viên mới sẵn sàng</p>
                <p className="text-[10px] text-slate-300 font-medium">Tự động trừ trực tiếp cho phiên đặt sân bất kỳ tối nay</p>
              </div>
              <button
                type="button"
                onClick={() => setAppliedVoucher(true)}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-md ${
                  appliedVoucher
                    ? "bg-emerald-500 text-slate-950 cursor-default"
                    : "bg-[#0b4f6c] hover:bg-[#07384d] text-white active:scale-95"
                }`}
              >
                {appliedVoucher ? "✓ Đã áp dụng" : "Áp dụng ngay"}
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex flex-row xl:flex-col gap-2.5 w-full xl:w-auto shrink-0">
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex-1 xl:flex-none min-w-[230px]">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-bold">
                🏓
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Chỉ số Pickleball</span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-lg font-black text-emerald-400 font-mono">3.0</span>
                  <span className="text-[10px] text-slate-300 font-bold">DUPR Verified</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex-1 xl:flex-none min-w-[230px]">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-lg font-bold">
                ⚽
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Chỉ số Bóng đá 7</span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-lg font-black text-sky-400 font-mono">{userElo}</span>
                  <span className="text-[10px] text-slate-300 font-bold">Elo Division 2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NEAT & COMPACT SMART FILTER BAR (FULL FUNCTIONALITY) */}
      <section className="w-full bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800 space-y-3">
        {/* Row 1: Sport Tabs + Location Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 max-w-full scrollbar-none">
            {sportsList.map((sp) => (
              <button
                key={sp.id}
                type="button"
                onClick={() => setSelectedSport(sp.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
                  selectedSport === sp.id
                    ? "bg-[#0b4f6c] text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>{sp.icon}</span>
                <span>{sp.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold">
            <MapPin className="w-3.5 h-3.5 text-[#0b4f6c] dark:text-sky-400" />
            <span>Quận 7 & Nhà Bè (&lt; 5km)</span>
          </div>
        </div>

        {/* Row 2: Compact Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Time Slot Select */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none">Khung Giờ</span>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="NIGHT">Tối nay (18:30 - 22:00)</option>
                <option value="AFTERNOON">Chiều (15:00 - 18:00)</option>
                <option value="MORNING">Sáng sớm (06:00 - 09:00)</option>
                <option value="LATE">Tối muộn (21:00 - 23:00)</option>
              </select>
            </div>
          </div>

          {/* Pitch Format Select */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none">Quy Mô Sân</span>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất Cả Loại Sân</option>
                <option value="PITCH_5">Sân 5 Futsal / Cỏ</option>
                <option value="PITCH_7">Sân 7 Tiêu Chuẩn</option>
                <option value="PITCH_11">Sân 11 FIFA</option>
                <option value="PVC">Thảm PVC Pickleball / Yonex</option>
              </select>
            </div>
          </div>

          {/* Price Select / Slider */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-extrabold uppercase leading-none">
                <span>Ngân Sách Max</span>
                <span className="text-[#0b4f6c] dark:text-sky-400">{maxBudget.toLocaleString('vi-VN')}đ</span>
              </div>
              <input
                type="range"
                min="100000"
                max="600000"
                step="50000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-[#0b4f6c] dark:accent-sky-400 cursor-pointer h-1.5 mt-1"
              />
            </div>
          </div>

          {/* Filter CTA Button */}
          <button
            type="button"
            className="w-full bg-[#0b1c30] hover:bg-slate-900 text-white rounded-xl px-4 py-2 flex items-center justify-center space-x-1.5 transition-all shadow-sm text-xs font-extrabold active:scale-95"
          >
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>Lọc 18 Sân Trống</span>
          </button>
        </div>
      </section>

      {/* 2.5 AI RECOMMENDATION ENGINE & REDIS DISTRIBUTED LOCK VISUALIZER (MOVED UP) */}
      <section className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column (7 Cols): Scikit-Learn Match Optimizer Banner */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-[#0b4f6c] text-white font-extrabold text-[10px] rounded-lg flex items-center uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-sky-300" />
                    AI SMART RECOMMENDATION
                  </span>
                  <span className="font-mono text-xs font-extrabold text-[#0b4f6c] dark:text-sky-400">
                    Độ khớp 98.4%
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                  Scikit-Learn Model v2
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                Đề xuất tối ưu cho Đội của bạn: <span className="text-[#0b4f6c] dark:text-sky-400">Chuyên Việt Sport Center</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Dựa trên lịch sử 24 trận gần nhất, chỉ số thể lực của {userName} (Elo {userElo}) và tình trạng giao thông đường Nguyễn Thị Thập Q7 lúc 18h45.
              </p>

              {/* Highlights 3 Checklist Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Khung giờ Vàng</span>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">19:00 - 20:30</div>
                  <span className="text-[11px] font-bold text-[#0b4f6c] dark:text-sky-400 block">Đủ 90 phút thể lực</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Quy chuẩn mặt cỏ</span>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">Sân 7A - Cao Su TPE</div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">Chống lật cổ chân</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Đối thủ chờ sẵn</span>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">FC Bách Khoa Q7</div>
                  <span className="text-[11px] font-bold text-amber-500 block">Elo 1.435 (Lệch 15)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Ưu đãi giảm 15% tự động áp dụng qua VietQR Pay</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPitchForSlot(mockPitches[1])}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs shadow-lg shadow-[#0b4f6c]/30 transition-all flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>Khóa Slot Này Ngay</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Right Column (5 Cols): Redis Real-time Slot Mutex Monitor */}
          <div className="lg:col-span-5 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <span className="font-extrabold text-base text-white">Redis Distributed Lock</span>
                </div>
                <span className="font-mono text-[10px] font-extrabold px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5" />
                  Live Sync
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium">
                Hệ thống phòng chống đụng slot (Double Booking Prevention) trên cụm 4 máy chủ Redis Cluster.
              </p>

              {/* State Matrix Legend */}
              <div className="flex items-center space-x-4 text-xs font-semibold pt-1">
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5" /> Sẵn Sàng</span>
                <span className="flex items-center text-amber-400"><span className="w-3 h-3 rounded-full bg-amber-400 mr-1.5 animate-pulse" /> Giữ Chỗ (300s)</span>
                <span className="flex items-center text-slate-400"><span className="w-3 h-3 rounded-full bg-slate-600 mr-1.5" /> Đã Cọc 100%</span>
              </div>

              {/* Pitch Timeline Slots Dynamic List */}
              <div className="space-y-2.5 font-mono text-xs pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-400">17:30 - 19:00</span>
                    <span className="text-[11px] text-slate-400 font-sans">Sân 7B • Chuyên Việt</span>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-700/80 text-slate-300 text-[10px] font-bold rounded-lg font-sans">
                    Đã Khóa (FC Xây Dựng)
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-amber-400">19:00 - 20:30</span>
                    <span className="text-[11px] text-slate-200 font-sans">Sân 7A • Chuyên Việt</span>
                  </div>
                  <div className="flex items-center space-x-1 text-amber-400 text-[10px] font-bold font-sans">
                    <Timer className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang giữ chỗ (03:42)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b4f6c]/40 border border-[#0b4f6c]/60">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-sky-300">20:30 - 22:00</span>
                    <span className="text-[11px] text-slate-200 font-sans">Sân 7C • Chuyên Việt</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPitchForSlot(mockPitches[1])}
                    className="px-3 py-1 bg-[#0b4f6c] hover:bg-[#07384d] text-white text-[10px] font-bold rounded-lg font-sans shadow-sm transition-colors"
                  >
                    Giữ 5 Phút
                  </button>
                </div>
              </div>
            </div>

            <div className="text-right pt-2 border-t border-slate-800">
              <span className="font-mono text-[10px] text-slate-500">
                TTL Lock Keyspace: mutex:pitch:cv_7a_1900
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN COCKPIT LAYOUT (8 COLS + 4 COLS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PITCH EXPLORATION & DIRECT BOOKING (8 cols) */}
        <main className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Sân Trống Khả Dụng Khung Giờ Tối</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold uppercase animate-pulse border border-emerald-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ưu tiên cụm sân quanh Nguyễn Thị Thập, Huỳnh Tấn Phát & Phú Mỹ Hưng</p>
            </div>
            <div className="hidden sm:flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button className="px-3 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg shadow-xs">Gần nhất</button>
              <button className="px-3 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-900">Giá tốt nhất</button>
              <button className="px-3 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-900">Đánh giá cao</button>
            </div>
          </div>

          {/* PITCH CARDS */}
          <div className="space-y-6">
            {filteredPitches.map((pitch) => (
              <article
                key={pitch.id}
                className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row"
              >
                {/* Thumbnail Visual */}
                <div className="md:w-5/12 relative min-h-[220px] overflow-hidden">
                  <img
                    src={pitch.imageUrl}
                    alt={pitch.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-white font-extrabold text-[11px] flex items-center space-x-1 border border-slate-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                      <span>{pitch.sportBadge}</span>
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>{pitch.distanceKm} km • Quận 7</span>
                    </div>
                    <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px]">
                      {pitch.pitchTypes[0]}
                    </span>
                  </div>
                </div>

                {/* Info & Booking Slots */}
                <div className="md:w-7/12 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-[#0b4f6c] dark:group-hover:text-sky-400 transition-colors">
                          {pitch.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{pitch.address}</p>
                      </div>
                      <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">{pitch.rating}</span>
                        <span className="text-[10px] text-slate-400">({pitch.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Facility Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pitch.amenities.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]"
                        >
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Time Ribbon Selection */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Ca trống khả dụng tối nay:
                    </span>
                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                      {pitch.timeSlots.map((ts, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedPitchForSlot(pitch)}
                          className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold shrink-0 transition-all ${
                            ts.status === "ACTIVE"
                              ? "bg-[#0b1c30] text-white shadow-xs border border-sky-400/40"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          {ts.time} {ts.tag ? `(${ts.tag})` : ""}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pricing & Direct Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-xl font-extrabold text-[#0b4f6c] dark:text-sky-400 font-mono">
                          {pitch.priceDiscounted.toLocaleString("vi-VN")}đ
                        </span>
                        <span className="text-xs text-slate-400 line-through">
                          {pitch.priceOriginal.toLocaleString("vi-VN")}đ
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                          -50k Pass
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Đã tính chiết khấu voucher thành viên mới</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPitchForSlot(pitch)}
                      className="px-5 py-2.5 rounded-xl bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center space-x-1"
                    >
                      <span>Đặt Ngay</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>

        {/* RIGHT COLUMN: AI MATCHMAKING & REALTIME WIDGETS (4 cols) */}
        <aside className="xl:col-span-4 space-y-6">
          {/* WIDGET 1: EMERGENCY MATCH FINDER (KÈO GẤP TỐI NAY) */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Chợ Kèo Ghép Đội - Tối Nay</h3>
              </div>
              <span className="text-[11px] font-extrabold text-[#0b4f6c] dark:text-sky-400">Tìm chân gấp</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Hệ thống AI ghép kèo tự động khớp dựa theo chỉ số <strong class="text-slate-900 dark:text-white">DUPR 3.0</strong> & <strong class="text-slate-900 dark:text-white">Elo {userElo}</strong> của bạn.
            </p>

            {/* Match Tile 1: Pickleball Doubles */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-extrabold text-[10px] uppercase">
                  🏓 Pickleball Đôi Nam
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">19:30 - 21:00</span>
              </div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Sân D-Sport Oasis • Đang thiếu 1 chân</h4>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Trình độ: <strong className="text-slate-900 dark:text-white">DUPR 2.8 - 3.2</strong></span>
                <span className="font-mono font-extrabold text-emerald-500">~45k / người</span>
              </div>

              {/* Team Slot Visualizer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-[#0b4f6c] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-900">
                    TM
                  </div>
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-900">
                    LL
                  </div>
                  <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-900">
                    HN
                  </div>
                  <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 border-2 border-dashed border-sky-400 flex items-center justify-center text-[10px] font-bold">
                    ?
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setJoinedMatch("pb")}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                    joinedMatch === "pb"
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-[#0b4f6c] hover:bg-[#07384d] text-white active:scale-95"
                  }`}
                >
                  {joinedMatch === "pb" ? "✓ Đã Bắt Kèo" : "Tham Gia Kèo"}
                </button>
              </div>
            </div>

            {/* Match Tile 2: Football 7-a-side */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] uppercase">
                  ⚽ Bóng Đá Sân 7
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">20:00 - 21:30</span>
              </div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Sân Tân Thuận Q7 • Thiếu tiền vệ / hậu vệ</h4>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Trình độ: <strong className="text-slate-900 dark:text-white">Elo 1,150 - 1,250</strong></span>
                <span className="font-mono font-extrabold text-emerald-500">60k quỹ trận</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500">👥 Đã có 13/14 cầu thủ</span>
                <button
                  type="button"
                  onClick={() => setJoinedMatch("fb")}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                    joinedMatch === "fb"
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-[#0b1c30] hover:bg-slate-900 text-white active:scale-95"
                  }`}
                >
                  {joinedMatch === "fb" ? "✓ Đã Bắt Kèo" : "Bắt Kèo"}
                </button>
              </div>
            </div>
          </section>

          {/* WIDGET 2: QUICK DIGITAL MEMBERSHIP PASS (CHECK-IN GATEWAY) */}
          <section className="bg-gradient-to-br from-[#0b1c30] to-[#0b4f6c] text-white rounded-3xl p-5 shadow-lg border border-sky-400/30 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white">VaoSan QuickPass</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[9px] uppercase">
                Quét Không Chạm
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-between space-x-3 border border-white/10">
              <div className="bg-white p-2 rounded-xl shrink-0 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-slate-950" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="font-extrabold text-xs text-white truncate">{userName}</h4>
                <p className="font-mono text-[11px] text-sky-300">ID: #VS-20269</p>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-emerald-400 font-bold">
                  <span>DUPR 3.0</span>
                  <span>•</span>
                  <span>Elo {userElo}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95"
            >
              Mở Thẻ Check-in Sân →
            </button>
          </section>
        </aside>
      </div>

      {/* SLOT MATRIX MODAL */}
      {selectedPitchForSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 max-w-3xl w-full rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedPitchForSlot(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold transition-colors"
            >
              ✕
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-xs font-extrabold text-[#0b4f6c] dark:text-sky-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ma Trận Khung Giờ Ca Sân Trực Tiếp</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{selectedPitchForSlot.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{selectedPitchForSlot.address}</p>
            </div>

            {/* Timeline Matrix */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                <span>Chọn ca đấu ngày: <strong className="text-slate-900 dark:text-white">Hôm nay (15/09/2026)</strong></span>
                <div className="flex items-center space-x-4 text-xs font-semibold">
                  <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5" /> Trống</span>
                  <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-1.5" /> Khóa 5p</span>
                  <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-700 mr-1.5" /> Đã Đặt</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modalSlots.map((slot) => {
                  const isAvailable = slot.status === "AVAILABLE";
                  const isHold = slot.status === "HOLD";
                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                        isAvailable
                          ? "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-[#0b4f6c] cursor-pointer shadow-xs"
                          : isHold
                          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/40 opacity-90"
                          : "bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[11px] font-extrabold text-[#0b4f6c] dark:text-sky-400 block">{slot.pitchType}</span>
                        <span className="text-base font-extrabold text-slate-900 dark:text-white block font-mono">{slot.time}</span>
                        <span className="text-xs font-extrabold text-emerald-500">{slot.price.toLocaleString("vi-VN")} đ</span>
                      </div>

                      {isAvailable ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSlot(selectedPitchForSlot, slot);
                            setSelectedPitchForSlot(null);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#0b4f6c] text-white text-xs font-extrabold hover:bg-[#07384d] transition-all shadow-md active:scale-95"
                        >
                          Đặt Ca →
                        </button>
                      ) : (
                        <span className={`text-[11px] px-3 py-1.5 rounded-xl font-bold ${
                          isHold ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-500"
                        }`}>
                          {isHold ? "Khóa 5p" : "Đã Đặt"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
