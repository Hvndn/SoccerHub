"use client";

import React, { useState } from "react";
import {
  Sparkles,
  MapPin,
  Clock,
  Zap,
  Star,
  ShieldCheck,
  Flame,
  Search,
  Filter,
  Users,
  PlusCircle,
  Trophy,
  Activity,
  CheckCircle2,
  ChevronDown,
  Award,
  CircleDollarSign,
  UserPlus,
  Tv,
  Lock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Info
} from "lucide-react";

interface MatchmakingMarketplaceProps {
  user?: any;
  onSelectMatch?: (match: any) => void;
  onCreateMatch?: () => void;
}

export default function MatchmakingMarketplace({
  user,
  onSelectMatch,
  onCreateMatch
}: MatchmakingMarketplaceProps) {
  const [selectedSport, setSelectedSport] = useState("PICKLEBALL");
  const [selectedLevel, setSelectedLevel] = useState("2.5 - 3.5");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("TONIGHT");
  const [radiusKm, setRadiusKm] = useState(5);
  const [matchFormat, setMatchFormat] = useState("DOUBLES_MALE");
  const [paymentModel, setPaymentModel] = useState("SPLIT_EQUAL");
  const [userDepositBalance, setUserDepositBalance] = useState(200000);
  const [joinedMatches, setJoinedMatches] = useState<string[]>([]);

  const userName = user?.name || "Nguyễn Văn An";
  const userElo = user?.eloRating || 1200;
  const userDupr = "3.0";

  const handleJoinMatch = (matchId: string, matchFee: number) => {
    if (joinedMatches.includes(matchId)) return;
    setJoinedMatches([...joinedMatches, matchId]);
    if (onSelectMatch) {
      onSelectMatch({ matchId, matchFee });
    }
  };

  return (
    <div className="w-full space-y-6 pb-20 text-slate-900 dark:text-white animate-fade-in">
      {/* 1. SUB-HEADER & LIVE BREADCRUMB RIBBON */}
      <section className="w-full bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Breadcrumb + AI Matchmaking Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="hover:text-[#006c49] cursor-pointer">Trang chủ</span>
              <span>/</span>
              <span>Chợ Kèo Ghép Đội</span>
              <span>/</span>
              <span className="text-[#006c49] font-bold">Sàn Ghép Cặp Tức Thì</span>
            </div>
            <div className="flex items-center space-x-2 pt-0.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#acf847] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#006c49]" />
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                Thuật toán AI Matchmaking v4.2
              </span>
              <span className="text-slate-400">•</span>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 text-[#006c49] font-bold text-xs">
                Đang kết nối 142 VĐV sẵn sàng ra sân
              </span>
            </div>
          </div>

          {/* Action Bar Right */}
          <div className="flex items-center space-x-2.5">
            <button className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors shadow-xs">
              <Filter className="w-4 h-4 text-[#006c49]" />
              <span>Bộ Lọc Kèo Quanh Tôi</span>
            </button>

            <button
              onClick={onCreateMatch}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>+ Tạo Kèo Giao Lưu Mới</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. FILTER CONSOLE & SPORTS SWITCHER */}
      <section className="w-full bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Sport Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedSport("PICKLEBALL")}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all ${
              selectedSport === "PICKLEBALL"
                ? "bg-[#006c49] text-white shadow-md shadow-[#006c49]/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🏓 Pickleball</span>
            <span className="px-2 py-0.5 rounded-full bg-[#acf847] text-[#102000] font-mono text-[10px] font-black">
              24 kèo mở
            </span>
          </button>

          <button
            onClick={() => setSelectedSport("FOOTBALL")}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all ${
              selectedSport === "FOOTBALL"
                ? "bg-[#006c49] text-white shadow-md shadow-[#006c49]/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>⚽ Bóng Đá 7 Người</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
              18 kèo
            </span>
          </button>

          <button
            onClick={() => setSelectedSport("BADMINTON")}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all ${
              selectedSport === "BADMINTON"
                ? "bg-[#006c49] text-white shadow-md shadow-[#006c49]/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🏸 Cầu Lông</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
              12 kèo
            </span>
          </button>

          <button
            onClick={() => setSelectedSport("TENNIS")}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-xs shrink-0 transition-all ${
              selectedSport === "TENNIS"
                ? "bg-[#006c49] text-white shadow-md shadow-[#006c49]/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>🎾 Tennis</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
              6 kèo
            </span>
          </button>
        </div>

        {/* Advanced Filter Metrics Bar (5 Cols Grid) */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          {/* Level / DUPR */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 uppercase font-extrabold text-[10px]">Trình độ DUPR / Elo</span>
              <span className="text-[#006c49] font-bold text-[11px]">Khớp DUPR {userDupr}</span>
            </div>
            <div className="flex items-center space-x-1 pt-0.5">
              {["2.0 - 2.5", "2.5 - 3.5", "3.5 - 4.5+"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    selectedLevel === lvl
                      ? "bg-[#006c49] text-white shadow-xs"
                      : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot */}
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-extrabold text-[10px] block">Khung giờ</span>
            <div className="flex items-center space-x-1 pt-0.5">
              <button
                onClick={() => setSelectedTimeSlot("TONIGHT")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  selectedTimeSlot === "TONIGHT"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                Tối nay (18:30-22h)
              </button>
              <button
                onClick={() => setSelectedTimeSlot("TOMORROW")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  selectedTimeSlot === "TOMORROW"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                Ngày mai
              </button>
            </div>
          </div>

          {/* Radius Filter */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 uppercase font-extrabold text-[10px]">Bán kính</span>
              <span className="text-slate-600 dark:text-slate-300 font-bold text-[11px]">&lt; {radiusKm}km (Q.7, Nhà Bè)</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-[#006c49] cursor-pointer mt-2"
            />
          </div>

          {/* Format Filter */}
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-extrabold text-[10px] block">Thể thức thi đấu</span>
            <select
              value={matchFormat}
              onChange={(e) => setMatchFormat(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="DOUBLES_MALE">Đôi Nam (Tính điểm Elo/DUPR)</option>
              <option value="MIXED">Đôi Nam Nữ Mixed</option>
              <option value="DOUBLES_FEMALE">Đôi Nữ</option>
              <option value="SINGLES">Đơn Kèo Giao Lưu</option>
            </select>
          </div>

          {/* Payment Model */}
          <div className="space-y-1">
            <span className="text-slate-500 uppercase font-extrabold text-[10px] block">Hình thức tiền sân</span>
            <select
              value={paymentModel}
              onChange={(e) => setPaymentModel(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="SPLIT_EQUAL">Chia đều tự động (~45k-60k)</option>
              <option value="LOSER_PAYS">Đội thua chịu 100% sân</option>
              <option value="HOST_COVER">Chủ kèo bao trọn gói</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. MAIN GRID CONTENT (68% LEFT + 32% RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: MATCH LISTINGS (68% WIDTH / 8 COLS) */}
        <main className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Kèo Đang Mở Đăng Ký</h2>
              <span className="px-3 py-1 rounded-full bg-[#acf847] text-[#102000] font-mono text-xs font-extrabold">
                Phù hợp 95%+ cho DUPR {userDupr}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
              <span>Sắp xếp:</span>
              <span className="text-[#006c49] font-bold cursor-pointer">Gần nhất & Sớm nhất ▼</span>
            </div>
          </div>

          {/* MATCH CARD 1: KÈO NÓNG - CẦN 1 CHÂN GẤP */}
          <article className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-xs animate-pulse border border-rose-500/30">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>KÈO NÓNG • CẦN 1 CHÂN GẤP (45 PHÚT NỮA ĐÁNH)</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                  Sân PB-02 (Outdoor Pro)
                </span>
              </div>
              <div className="flex items-center space-x-1 text-[#006c49] font-mono font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-[#006c49]" />
                <span>DUPR Rating Match</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Pickleball Đôi Nam 3.0+ Cọ Xát Tối Nay
                </h3>
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center space-x-1 text-slate-900 dark:text-white font-bold">
                    <MapPin className="w-4 h-4 text-[#006c49]" />
                    <span>Cụm Sân D-Sport Oasis</span>
                  </span>
                  <span>•</span>
                  <span>148 Huỳnh Tấn Phát, Q.7 (Cách bạn 1.8km)</span>
                </div>
              </div>

              <div className="flex flex-col md:items-end bg-slate-50 dark:bg-slate-800/60 md:bg-transparent p-3 md:p-0 rounded-xl">
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  45.000đ <span className="text-xs font-normal text-slate-400">/người</span>
                </div>
                <span className="text-[11px] font-bold text-[#006c49]">Đã áp voucher sân -10k</span>
              </div>
            </div>

            {/* Slots & Roster Visual */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900 dark:text-white">Đội hình hiện tại: 3/4 VĐV</span>
                <span className="text-[#006c49] font-bold">Vị trí trống: 1 Tay vợt DUPR 2.8 - 3.3</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-[#006c49] text-white font-bold text-xs flex items-center justify-center">TL</div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">@TuanLe</span>
                    <span className="font-mono text-[10px] text-[#006c49] font-bold">DUPR 3.1</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center">MK</div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">@MinhKhang</span>
                    <span className="font-mono text-[10px] text-[#006c49] font-bold">DUPR 2.9</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">QB</div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">@QuocBao</span>
                    <span className="font-mono text-[10px] text-[#006c49] font-bold">DUPR 3.0</span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-1.5 bg-[#acf847]/20 p-2.5 rounded-xl border border-[#acf847]/50 text-[#102000] dark:text-[#acf847] font-extrabold text-xs">
                  <UserPlus className="w-4 h-4" />
                  <span>BẠN GHÉP VÀO ĐÂY</span>
                </div>
              </div>
            </div>

            {/* Perks & Features */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center space-x-1 font-semibold">
                <Award className="w-4 h-4 text-[#006c49]" />
                <span>Bóng Dura Fast 40 có sẵn</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1 font-semibold">
                <Tv className="w-4 h-4 text-[#006c49]" />
                <span>Camera AI ghi Highlights</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1 font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#304f00] dark:text-[#acf847]" />
                <span>Kèo cọc FairPlay 100%</span>
              </span>
            </div>

            {/* Action Bottom */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-mono text-sm font-bold">
                <Clock className="w-4 h-4 text-[#006c49]" />
                <span>19:30 - 21:00 (Tối nay)</span>
              </div>

              <div className="flex items-center space-x-2">
                <button className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition-colors">
                  Xem Đội Hình
                </button>
                <button
                  onClick={() => handleJoinMatch("match-101", 45000)}
                  className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 active:scale-95 ${
                    joinedMatches.includes("match-101")
                      ? "bg-emerald-600 text-white cursor-default"
                      : "bg-[#006c49] hover:bg-[#005236] text-white"
                  }`}
                >
                  <Zap className="w-4 h-4 text-white" />
                  <span>{joinedMatches.includes("match-101") ? "✓ Đã Ghép Kèo" : "Bắt Cặp & Đặt Cọc Ngay (45k)"}</span>
                </button>
              </div>
            </div>
          </article>

          {/* MATCH CARD 2: BÓNG ĐÁ 7 - TÌM 2 TIỀN VỆ & THỦ MÔN */}
          <article className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs flex items-center space-x-1">
                  <span>⚽ BÓNG ĐÁ 7 NGƯỜI • ĐÁ PHỦI VĂN MINH</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#acf847] text-[#102000] font-bold text-xs">
                  Cần 2 Vị Trí
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-400">Mã kèo: #FB-7A-892</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  FC Sài Gòn Warriors tìm 2 chân đá phủi ca 20:00
                </h3>
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4 text-[#006c49]" />
                  <span>Cụm Sân Nam Sài Gòn (Sân 7A) • Nguyễn Văn Linh, Q.7 (Cách 3.2km)</span>
                </div>
              </div>

              <div className="flex flex-col md:items-end bg-slate-50 dark:bg-slate-800/60 md:bg-transparent p-3 md:p-0 rounded-xl">
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  60.000đ <span className="text-xs font-normal text-slate-400">/cầu thủ</span>
                </div>
                <span className="text-[11px] text-slate-400">Bao gồm nước khoáng + trọng tài VFF</span>
              </div>
            </div>

            {/* Match Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900">
                <span className="text-slate-400 block text-[10px]">Yêu cầu Elo</span>
                <span className="font-bold text-[#006c49]">1,150 - 1,250 Elo</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900">
                <span className="text-slate-400 block text-[10px]">Tình trạng slot</span>
                <span className="font-bold text-slate-900 dark:text-white">12 / 14 Cầu thủ</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900">
                <span className="text-slate-400 block text-[10px]">Vị trí khuyết</span>
                <span className="font-bold text-[#304f00] dark:text-[#acf847]">01 Tiền vệ & 01 Thủ môn</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900">
                <span className="text-slate-400 block text-[10px]">Màu áo thi đấu</span>
                <span className="font-bold text-slate-900 dark:text-white">Áo Đen (Có Bib)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-mono text-sm font-bold">
                <Clock className="w-4 h-4 text-[#006c49]" />
                <span>20:00 - 21:30 (Tối nay)</span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs">
                  Xem Danh Sách Đội
                </button>
                <button
                  onClick={() => handleJoinMatch("match-102", 60000)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs shadow-md"
                >
                  Đăng Ký Tham Gia
                </button>
              </div>
            </div>
          </article>
        </main>

        {/* RIGHT COLUMN: AI MATCH RADAR & ESCROW FAIRPLAY (32% WIDTH / 4 COLS) */}
        <aside className="lg:col-span-4 space-y-5">
          {/* WIDGET 1: AI MATCH RADAR (98% MATCH) */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#006c49] text-white flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">AI Match Radar</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#acf847] text-[#102000] font-mono text-xs font-black">
                98% Match
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 flex items-center justify-between border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold">Hồ sơ của bạn</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{userName}</span>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="font-extrabold text-[#006c49]">DUPR {userDupr}</div>
                <div className="text-slate-400 text-[10px]">Elo {userElo}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Khuyến nghị hoàn hảo tối nay:</span>
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-[#006c49]">
                <div className="flex items-center justify-between font-bold">
                  <span>Sân D-Sport Oasis (PB-02)</span>
                  <span className="font-mono">19:30 Tối nay</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  Trình độ tương đồng hoàn toàn với @TuanLe (3.1) và @QuocBao (3.0). Chỉ cách vị trí hiện tại của bạn 1.8km.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleJoinMatch("match-101", 45000)}
              className="w-full py-3 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Tham Gia Kèo Này Ngay (1-Click)</span>
            </button>
          </section>

          {/* WIDGET 2: ESCROW FAIRPLAY BALANCE */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#006c49]" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Ký Quỹ FairPlay™</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                Active
              </span>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-1 shadow-md">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Số dư ký quỹ bảo chứng</span>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-2xl font-black text-[#acf847]">
                  {userDepositBalance.toLocaleString("vi-VN")}đ
                </span>
                <span className="text-xs text-emerald-300 font-bold hover:underline cursor-pointer">
                  Nạp thêm →
                </span>
              </div>
              <p className="text-[11px] text-slate-300 pt-1">
                Bảo chứng không hủy kèo phút chót. Tự động hoàn lại sau khi quét mã QR vào sân.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Tỷ lệ uy tín thi đấu:</span>
                <span className="font-bold text-[#006c49] flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 fill-[#006c49] text-[#006c49]" />
                  <span>100% (5.0 / 5)</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-mono">
                <span>Số trận hoàn tất không vắng:</span>
                <span className="font-bold text-slate-900 dark:text-white">14/14 trận</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] flex items-start space-x-2">
                <Info className="w-4 h-4 text-[#006c49] shrink-0 mt-0.5" />
                <span>VĐV vắng mặt vô cớ sẽ chuyển toàn bộ tiền cọc làm bồi hoàn cho các thành viên còn lại.</span>
              </div>
            </div>
          </section>

          {/* WIDGET 3: LEADERBOARD BOARD OF HONOR */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Vinh Danh Ghép Kèo</h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">Tuần 42</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#acf847] text-[#102000] font-black text-xs flex items-center justify-center font-mono">
                    1
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Trần Quốc Nam</p>
                    <span className="text-[10px] text-slate-400">Ghép 18 trận • Thắng 15</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#006c49]">+45 Elo</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center font-mono">
                    2
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Lê Hoàng Yến</p>
                    <span className="text-[10px] text-slate-400">Ghép 14 trận • Chuỗi 8W</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#006c49]">+38 Elo</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center font-mono">
                    3
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Phạm Đăng Khoa</p>
                    <span className="text-[10px] text-slate-400">Ghép 12 trận • MVP Q.7</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#006c49]">+29 Elo</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
