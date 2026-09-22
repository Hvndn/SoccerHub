"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  Clock,
  Zap,
  Tag,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  Gavel,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  QrCode,
  MapPin,
  Sparkles,
  ChevronRight,
  Share2,
  RefreshCw,
  SlidersHorizontal,
  Info
} from "lucide-react";

interface UrgentSlotMarketplaceProps {
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
  onSelectSlot?: (pitch: any, slot: any) => void;
}

export default function UrgentSlotMarketplace({
  onBackToHome,
  onNavigateTab,
  onSelectSlot
}: UrgentSlotMarketplaceProps) {
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedFilter, setSelectedFilter] = useState("discount");
  const [customDiscount, setCustomDiscount] = useState(40);
  const [biddingState, setBiddingState] = useState<Record<number, number>>({ 2: 280000 });

  // Mock Urgent Resale Slots Data (Stitch Spec: Urgent Pass-On & Live Auction)
  const resaleSlots = [
    {
      id: 1,
      tag: "FLASH SALE -50%",
      isAuction: false,
      pitchName: "Sân Bóng Đá Đại Nam (Sân A1 - Cỏ FIFA 7 Người)",
      location: "Quận 7, TP.HCM (Cách 1.8km)",
      sport: "Bóng Đá 7 Người",
      time: "19:30 - 21:00 (Tối Nay)",
      timeLeft: "00:18:45",
      originalPrice: 650000,
      resalePrice: 325000,
      discountPct: 50,
      reason: "Đội mưa bão thiếu 4 người cần pass gấp",
      seller: "Trần Hoàng Long (@long_captain)",
      verified: true
    },
    {
      id: 2,
      tag: "LIVE BID - ĐẤU GIÁ",
      isAuction: true,
      pitchName: "Cụm Pickleball Central D-Sport (Sân PB-02 VIP)",
      location: "Quận 2, TP.HCM (Cách 3.2km)",
      sport: "Pickleball Pro",
      time: "18:00 - 20:00 (Tối Nay)",
      timeLeft: "00:09:12",
      originalPrice: 450000,
      resalePrice: 280000,
      startingBid: 100000,
      totalBids: 9,
      discountPct: 38,
      reason: "Bận đi công tác đột xuất",
      seller: "Nguyễn Minh Châu (@chau_pickle)",
      verified: true
    },
    {
      id: 3,
      tag: "PASS GẤP -35%",
      isAuction: false,
      pitchName: "Sân Cầu Lông Sky Court (Sân 04 Thảm Yonex)",
      location: "Bình Thạnh, TP.HCM (Cách 2.5km)",
      sport: "Cầu Lông",
      time: "20:00 - 21:30 (Tối Nay)",
      timeLeft: "00:35:10",
      originalPrice: 200000,
      resalePrice: 130000,
      discountPct: 35,
      reason: "Công ty đột xuất tăng ca đêm",
      seller: "Phạm Quốc Bảo (@bao_badminton)",
      verified: true
    },
    {
      id: 4,
      tag: "SUPER DEAL -40%",
      isAuction: false,
      pitchName: "Cụm Sân Bóng Đá Sport Plus (Sân 5 Cỏ Mới)",
      location: "Tân Bình, TP.HCM (Cách 4.1km)",
      sport: "Bóng Đá 5 Người",
      time: "21:00 - 22:30 (Tối Nay)",
      timeLeft: "01:05:00",
      originalPrice: 400000,
      resalePrice: 240000,
      discountPct: 40,
      reason: "Thủ môn chấn thương không đủ đội",
      seller: "Đặng Tuấn Anh (@tanh_futsal)",
      verified: true
    }
  ];

  const handlePlaceBid = (id: number) => {
    setBiddingState((prev) => ({
      ...prev,
      [id]: (prev[id] || 280000) + 20000
    }));
  };

  const filteredSlots = resaleSlots.filter((slot) => {
    if (selectedSport !== "all" && !slot.sport.toLowerCase().includes(selectedSport.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* HERO BANNER REALTIME TICKER (STITCH EXACT SPEC) */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-[#0b4f6c] to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-2xl border border-slate-700/60">
        <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-6 pointer-events-none">
          <Flame className="w-96 h-96 text-emerald-400" />
        </div>

        <div className="relative z-10 space-y-4">
          {/* REALTIME TICKER BAR */}
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 px-3.5 py-1 rounded-full border border-emerald-400/30 text-emerald-300 text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Chợ Nhượng Ca Sân Khẩn Cấp 24/7 • 12 ca vừa sang nhượng trong 15 phút qua</span>
          </div>

          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              SÀN NHƯỢNG CA SÂN & ĐẤU GIÁ GIỜ VÀNG TỨC THÌ
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Giải cứu ca trận phút chót, thu hồi cọc tới 70% khi bận việc đột xuất. Săn ca giờ vàng giảm sâu <span className="text-emerald-400 font-extrabold">-30% đến -60%</span> bảo chứng 100% qua Napas247 VietQR.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-2">
            <div className="flex items-center space-x-1.5 text-emerald-400 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Bảo Chứng Cọc VietQR 100%</span>
            </div>
            <div className="flex items-center space-x-1.5 text-amber-300 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800">
              <Zap className="w-4 h-4" />
              <span>Chuyển Mã Vào Sân Trong 1s</span>
            </div>
            <div className="flex items-center space-x-1.5 text-sky-300 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800">
              <TrendingDown className="w-4 h-4" />
              <span>Tiết Kiệm Trung Bình 280k / Ca</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN MARKETPLACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT 2 COLUMNS: FILTERS & SLOT CARDS */}
        <div className="lg:col-span-2 space-y-6">
          {/* SMART FILTER RIBBON */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedSport("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  selectedSport === "all"
                    ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Tất Cả Môn (86)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSport("bóng đá")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  selectedSport === "bóng đá"
                    ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                ⚽ Bóng Đá 7/5
              </button>
              <button
                type="button"
                onClick={() => setSelectedSport("pickleball")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  selectedSport === "pickleball"
                    ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                🏓 Pickleball Pro
              </button>
              <button
                type="button"
                onClick={() => setSelectedSport("cầu lông")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  selectedSport === "cầu lông"
                    ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                🏸 Cầu Lông Yonex
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
              <SlidersHorizontal className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400" />
              <span>Gần Bạn (&lt;3km)</span>
            </div>
          </div>

          {/* LIST OF RESALE SLOT CARDS */}
          <div className="space-y-4">
            {filteredSlots.map((slot) => (
              <div
                key={slot.id}
                className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-[#0b4f6c] dark:hover:border-sky-500 transition-all space-y-4 relative"
              >
                {/* CARD HEADER TAGS */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        slot.isAuction
                          ? "bg-amber-500/10 text-amber-500 border border-amber-400/30"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-400/30"
                      }`}
                    >
                      {slot.tag}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{slot.sport}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 text-xs font-mono font-black text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-400/20">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>Còn {slot.timeLeft}</span>
                  </div>
                </div>

                {/* PITCH & LOCATION */}
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                    {slot.pitchName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>{slot.location}</span>
                  </p>
                </div>

                {/* REASON & TIME SLOT INFO */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-900 dark:text-white font-extrabold">
                    <span>Khung Giờ: {slot.time}</span>
                    <span className="text-emerald-500 font-mono">Xác thực chính chủ</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 italic font-medium">
                    "{slot.reason}" — bởi <span className="font-bold text-slate-700 dark:text-slate-300">{slot.seller}</span>
                  </p>
                </div>

                {/* PRICING & ACTION CTAS */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-baseline space-x-2">
                      {slot.isAuction ? (
                        <>
                          <span className="text-[10px] uppercase text-slate-400 font-bold">Giá Đấu Hiện Tại:</span>
                          <span className="text-xl font-black font-mono text-amber-500">
                            {(biddingState[slot.id] || slot.resalePrice).toLocaleString()} VNĐ
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl font-black font-mono text-emerald-500">
                            {slot.resalePrice.toLocaleString()} VNĐ
                          </span>
                          <span className="text-xs text-slate-400 line-through font-mono">
                            {slot.originalPrice.toLocaleString()} VNĐ
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                      Tiết kiệm {(slot.originalPrice - (biddingState[slot.id] || slot.resalePrice)).toLocaleString()} VNĐ qua VietQR
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    {slot.isAuction ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePlaceBid(slot.id)}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center space-x-1"
                        >
                          <Gavel className="w-4 h-4" />
                          <span>Đặt Giá (+20k)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectSlot && onSelectSlot(slot, { price: slot.resalePrice })}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 font-black text-xs transition-all shadow-md"
                        >
                          Mua Đứt Ngay
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectSlot && onSelectSlot(slot, { price: slot.resalePrice })}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 active:scale-95"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Nhận Ca Ngay (VietQR 1s)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK RESALE FORM & DEPOSIT GUARANTEE */}
        <div className="lg:col-span-1 space-y-6">
          {/* QUICK RESALE FORM WIDGET */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Đăng Nhượng Ca Trong 30s</h3>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block">
                  Chọn Ca Đặt Sân Của Bạn (Tối Nay):
                </label>
                <select className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#0b4f6c]">
                  <option>Ca 20:30 - Sân Bóng Đá F7 Phú Nhuận (Đã Cọc 500k)</option>
                  <option>Ca 19:00 - Sân Pickleball D-Sport PB-04 (Đã Cọc 300k)</option>
                </select>
              </div>

              {/* AI SUGGESTED DISCOUNT SLIDER */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <div className="flex justify-between font-extrabold text-slate-900 dark:text-white">
                  <span>Mức Giảm Giá Đề Xuất:</span>
                  <span className="text-emerald-500 font-mono font-black">-{customDiscount}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="70"
                  value={customDiscount}
                  onChange={(e) => setCustomDiscount(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  💡 Gợi ý AI: Giảm <span className="font-bold text-slate-700 dark:text-slate-300">-{customDiscount}%</span> giúp tỷ lệ nhượng thành công đạt 95% trong 5 phút.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold flex justify-between">
                <span>Số tiền thu về ví:</span>
                <span>{(500000 * (1 - customDiscount / 100)).toLocaleString()} VNĐ</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0b4f6c] dark:bg-sky-500 hover:bg-[#07384d] dark:hover:bg-sky-400 text-white dark:text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <Flame className="w-4 h-4" />
                <span>Đẩy Lên Chợ Khẩn Cấp Ngay</span>
              </button>
            </form>
          </div>

          {/* VIETQR GUARANTEE RULES */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-500 font-extrabold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Quy Trình Bảo Chứng Cọc VietQR</span>
            </div>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p><strong className="text-slate-900 dark:text-white">Thanh toán VietQR Napas247:</strong> Khóa ca ngay lập tức trong 1 giây không lo bị trùng slot.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p><strong className="text-slate-900 dark:text-white">Tự động chuyển Mã Vé QR:</strong> Mã check-in cổng sân tự động cập nhật vào ứng dụng VaoSan của bạn.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p><strong className="text-slate-900 dark:text-white">Hoàn tiền 100% bảo hiểm:</strong> Nếu chủ sân bận lý do kỹ thuật, hệ thống tự hoàn tiền 100% trong 30s.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
