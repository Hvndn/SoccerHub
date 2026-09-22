'use me';
"use client";

import React, { useState } from 'react';
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

interface Court {
  id: string;
  name: string;
  sport: 'pickleball' | 'badminton' | 'tennis';
  duprTier: string;
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
  duprRequired: string;
  currentPlayers: number;
  maxPlayers: number;
  costPerPerson: number;
  hostName: string;
  hostAvatar: string;
  hostDupr: string;
  category: string;
}

export default function MultiSportArena() {
  const [activeSport, setActiveSport] = useState<'pickleball' | 'badminton' | 'tennis'>('pickleball');
  const [selectedDuprFilter, setSelectedDuprFilter] = useState<string>('all');
  const [bookingCourt, setBookingCourt] = useState<Court | null>(null);
  const [joiningMatch, setJoiningMatch] = useState<MatchQueue | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [rentingGear, setRentingGear] = useState<string | null>(null);

  const courts: Court[] = [
    {
      id: 'PB-01',
      name: 'PB-01: Open Play Mọi Trình Độ',
      sport: 'pickleball',
      duprTier: 'Tự Do (2.0 - 4.0)',
      surface: 'Thảm Cushion Coban 8mm',
      status: 'available',
      pricePerHour: 180000,
      features: ['Camera AI Chấm Điểm', 'Đèn LED 500 Lux', 'Mái Che Tự Động'],
    },
    {
      id: 'PB-02',
      name: 'PB-02: DUPR 3.0 - 3.5 Giao Lưu',
      sport: 'pickleball',
      duprTier: 'DUPR 3.0 - 3.5',
      surface: 'Thảm Cushion Coban 8mm',
      status: 'live',
      liveScore: 'Set 2: 9 - 7 (Trần Huy / Minh Anh vs Quốc Bảo / Thu Trang)',
      pricePerHour: 200000,
      features: ['Live Streaming HD', 'Bảng Điểm Điện Tử', 'Trọng Tài AI'],
      currentPlayers: 4,
      maxPlayers: 4,
    },
    {
      id: 'PB-03',
      name: 'PB-03: DUPR 3.5+ Thách Đấu High-Level',
      sport: 'pickleball',
      duprTier: 'DUPR 3.5+',
      surface: 'Thảm Cushion Coban 8mm',
      status: 'matching',
      pricePerHour: 220000,
      features: ['Ký Quỹ VietQR', 'Thưởng Chuỗi Thắng', 'Review Var Replay'],
      currentPlayers: 3,
      maxPlayers: 4,
    },
    {
      id: 'PB-04',
      name: 'PB-04: DUPR 4.0+ Pro Challenge',
      sport: 'pickleball',
      duprTier: 'DUPR 4.0+ Bán Chuyên',
      surface: 'Mặt Sân Decoturf USAPA',
      status: 'available',
      pricePerHour: 250000,
      features: ['Máy Bắn Bóng Spinshot', 'Cảm Biến Tốc Độ Smash', 'Thảm Đạt Chuẩn USAPA'],
    },
    {
      id: 'PB-05',
      name: 'PB-05: Sân Huấn Luyện IPTPA Masterclass',
      sport: 'pickleball',
      duprTier: 'Huấn Luyện / Masterclass',
      surface: 'Thảm Cushion Coban 8mm',
      status: 'booked',
      pricePerHour: 350000,
      features: ['Chuyên Đề Kitchen Drop', 'Sửa Duyên Dinking', 'HLV DUPR 5.2 Kèm 1-1'],
    },
    {
      id: 'PB-06',
      name: 'PB-06: Open Doubles Kèo Khẩn Cấp',
      sport: 'pickleball',
      duprTier: 'DUPR 3.2 - 3.8',
      surface: 'Thảm Cushion Coban 8mm',
      status: 'matching',
      pricePerHour: 180000,
      features: ['Giao Lưu Nhanh', 'Thiếu 1 Tay Vợt Nữ', 'Chia Tiền Sân Tự Động'],
      currentPlayers: 3,
      maxPlayers: 4,
    },
    {
      id: 'PB-07',
      name: 'PB-07: Ca Trống Khung Giờ Vàng (18:30 - 20:00)',
      sport: 'pickleball',
      duprTier: 'Mọi Trình Độ',
      surface: 'Thảm Cushion Coban 8mm',
      status: 'available',
      pricePerHour: 180000,
      features: ['Giảm 10% Cho Hội Viên', 'Hỗ Trợ Bóng Franklin X-40', 'VietQR Khóa Sân 10s'],
    },
    {
      id: 'PB-08',
      name: 'PB-08: Ca Trống Khung Đêm (20:00 - 21:30)',
      sport: 'pickleball',
      duprTier: 'Mọi Trình Độ',
      surface: 'Thảm Cushion Coban 8mm',
      status: 'available',
      pricePerHour: 180000,
      features: ['Giờ Vàng Thể Thao', 'Nước Uống Ion Miễn Phí', 'Đèn LED Chống Chói'],
    },
  ];

  const matchQueues: MatchQueue[] = [
    {
      id: 'MATCH-101',
      title: 'Kèo Đôi Nam Nữ DUPR 3.2+ (Cần 1 Nữ Đánh Lưới)',
      time: '19:00 - 20:30 Hôm nay',
      court: 'Sân PB-02',
      duprRequired: 'DUPR 3.0 - 3.5',
      currentPlayers: 3,
      maxPlayers: 4,
      costPerPerson: 65000,
      hostName: 'Lê Hoàng Nam',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      hostDupr: 'DUPR 3.45',
      category: 'Đôi Nam Nữ Giao Lưu',
    },
    {
      id: 'MATCH-102',
      title: 'Kèo Thách Đấu Đôi Nam DUPR 4.0+ (Cược Thưởng Cọc)',
      time: '20:30 - 22:00 Hôm nay',
      court: 'Sân PB-04',
      duprRequired: 'DUPR 4.0+',
      currentPlayers: 2,
      maxPlayers: 4,
      costPerPerson: 85000,
      hostName: 'Nguyễn Văn Đạt',
      hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      hostDupr: 'DUPR 4.20',
      category: 'Thách Đấu Cực Đỉnh',
    },
    {
      id: 'MATCH-103',
      title: 'Kèo Open Play Nhập Môn & Ôn Bài Dinking',
      time: '17:30 - 19:00 Hôm nay',
      court: 'Sân PB-01',
      duprRequired: 'DUPR 2.0 - 3.0',
      currentPlayers: 2,
      maxPlayers: 4,
      costPerPerson: 50000,
      hostName: 'Phạm Thu Trang',
      hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      hostDupr: 'DUPR 2.80',
      category: 'Nhập Môn Rèn Luyện',
    },
  ];

  const gearItems = [
    {
      id: 'gear-1',
      name: 'Vợt Selkirk Vanguard Power Air Invikta',
      price: '50.000đ / buổi',
      desc: 'Công nghệ lỗ Aerodynamic, tặng kèm 2 quả bóng Franklin X-40',
      badge: 'Bán chạy nhất',
    },
    {
      id: 'gear-2',
      name: 'Vợt Joola Ben Johns Perseus CFS 16mm Carbon 3K',
      price: '60.000đ / buổi',
      desc: 'Mặt carbon nhám tối ưu xoáy Dinking & Fast Hands ở Kitchen line',
      badge: 'Chuẩn Pro DUPR',
    },
    {
      id: 'gear-3',
      name: 'Máy Bắn Bóng Tập Dinking & Erne Spinshot',
      price: '100.000đ / giờ',
      desc: 'Tự động bắn 60 bóng/phút với 12 chế độ đường bóng xoáy top & backspin',
      badge: 'Công nghệ AI',
    },
  ];

  const handleActionToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const filteredCourts = courts.filter(c => {
    if (selectedDuprFilter === 'all') return true;
    if (selectedDuprFilter === 'dupr-open' && c.duprTier.includes('Tự Do')) return true;
    if (selectedDuprFilter === 'dupr-30' && c.duprTier.includes('3.0')) return true;
    if (selectedDuprFilter === 'dupr-40' && c.duprTier.includes('4.0')) return true;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 p-4 sm:p-6 lg:p-8">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Đạt Chuẩn USAPA & BWF
                </span>
                <span className="bg-lime-400/20 text-lime-300 border border-lime-400/30 text-xs font-bold px-3 py-1 rounded-full">
                  D-Sport Oasis Q.7
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Trung Tâm Đa Môn Pickleball & Cầu Lông DUPR Arena
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                Hệ thống ma trận sơ đồ sân real-time, ghép kèo theo chuẩn DUPR quốc tế, tự động đồng bộ điểm xếp hạng và bảo chứng cọc VietQR Napas247 100%.
              </p>
            </div>

            {/* Sport Selector Tabs */}
            <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 flex items-center space-x-2 self-start lg:self-auto">
              <button
                onClick={() => setActiveSport('pickleball')}
                className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 flex items-center space-x-2 ${
                  activeSport === 'pickleball'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span>🏓 Pickleball Pro</span>
                <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.5 rounded text-emerald-200">8 Sân</span>
              </button>

              <button
                onClick={() => setActiveSport('badminton')}
                className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 flex items-center space-x-2 ${
                  activeSport === 'badminton'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span>🏸 Cầu Lông Yonex</span>
                <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.5 rounded text-emerald-200">6 Sân</span>
              </button>

              <button
                onClick={() => setActiveSport('tennis')}
                className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 flex items-center space-x-2 ${
                  activeSport === 'tennis'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span>🎾 Tennis Outdoor</span>
                <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.5 rounded text-emerald-200">4 Sân</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <div className="text-2xl font-bold text-emerald-400">8 Sân</div>
              <div className="text-xs text-slate-400 mt-0.5">Mặt Thảm Cushion USAPA</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <div className="text-2xl font-bold text-lime-400">42 Ca Trống</div>
              <div className="text-xs text-slate-400 mt-0.5">Đặt Sân Tự Động Trong Ngày</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <div className="text-2xl font-bold text-cyan-400">DUPR 3.0 - 4.5+</div>
              <div className="text-xs text-slate-400 mt-0.5">Tự Động Phân Hạng Elo</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <div className="text-2xl font-bold text-amber-400">VietQR 100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Bảo Chứng Giữ Sân 10 giây</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Section 1: Court Matrix Filter & Legend */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                <span>Ma Trận Sơ Đồ Cụm Sân Real-Time (Live Court Layout Matrix)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Theo dõi tình trạng trực tiếp từ PB-01 đến PB-08, tham gia kèo hoặc cọc ca trống theo giờ
              </p>
            </div>

            {/* DUPR Rating Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1" /> Lọc Trình Độ:
              </span>
              <button
                onClick={() => setSelectedDuprFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDuprFilter === 'all'
                    ? 'bg-slate-900 dark:bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Tất Cả DUPR
              </button>
              <button
                onClick={() => setSelectedDuprFilter('dupr-open')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDuprFilter === 'dupr-open'
                    ? 'bg-slate-900 dark:bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Sân Open Play
              </button>
              <button
                onClick={() => setSelectedDuprFilter('dupr-30')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDuprFilter === 'dupr-30'
                    ? 'bg-slate-900 dark:bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                DUPR 3.0 - 3.5
              </button>
              <button
                onClick={() => setSelectedDuprFilter('dupr-40')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDuprFilter === 'dupr-40'
                    ? 'bg-slate-900 dark:bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                DUPR 4.0+ Pro
              </button>
            </div>
          </div>

          {/* Color Legend Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-6 flex-wrap gap-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Xanh Emerald: Ca Trống Đặt Ngay</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Cam Ánh Vàng: Đang Ghép Kèo (Thiếu 1-2 Người)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Đỏ Live: Trận Đang Diễn Ra (Tỷ Số Trực Tiếp)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Xám Khóa: Đã Đặt Lịch HLV / Giải Đấu</span>
              </div>
            </div>

            <div className="text-slate-500 dark:text-slate-400 text-xs flex items-center">
              <QrCode className="w-4 h-4 mr-1 text-emerald-500" /> Thanh toán VietQR Napas247 giữ chỗ 10s
            </div>
          </div>

          {/* Courts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCourts.map((court) => (
              <div
                key={court.id}
                className={`rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between relative ${
                  court.status === 'available'
                    ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 hover:shadow-lg hover:border-emerald-500'
                    : court.status === 'matching'
                    ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20 hover:shadow-lg hover:border-amber-500'
                    : court.status === 'live'
                    ? 'border-red-300 dark:border-red-500/40 bg-red-50/40 dark:bg-red-950/20 hover:shadow-lg'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 opacity-80'
                }`}
              >
                {/* Court Top Badge & Status */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {court.id}
                    </span>
                    {court.status === 'available' && (
                      <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ca Trống
                      </span>
                    )}
                    {court.status === 'matching' && (
                      <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Đang Ghép Kèo ({court.currentPlayers}/{court.maxPlayers})
                      </span>
                    )}
                    {court.status === 'live' && (
                      <span className="bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1 animate-pulse">
                        <Flame className="w-3 h-3" /> Live Score
                      </span>
                    )}
                    {court.status === 'booked' && (
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        Đã Khóa Sân
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1 mb-1">
                    {court.name}
                  </h3>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-3">
                    <div>🎯 <span className="font-semibold text-slate-700 dark:text-slate-300">{court.duprTier}</span></div>
                    <div>🏟️ {court.surface}</div>
                  </div>

                  {/* Live score if active */}
                  {court.status === 'live' && court.liveScore && (
                    <div className="bg-red-950/40 border border-red-500/30 p-2.5 rounded-lg mb-3 text-xs text-red-200 font-mono">
                      <div className="flex items-center text-[10px] text-red-400 font-sans mb-1 uppercase tracking-wider font-bold">
                        <Video className="w-3 h-3 mr-1" /> Trận Đấu Trực Tiếp
                      </div>
                      {court.liveScore}
                    </div>
                  )}

                  {/* Features tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {court.features.map((feat, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Giá ca:</span>
                    <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {court.pricePerHour.toLocaleString()}đ<span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">/giờ</span>
                    </div>
                  </div>

                  {court.status === 'available' && (
                    <button
                      onClick={() => setBookingCourt(court)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition"
                    >
                      Đặt Ca Ngay
                    </button>
                  )}

                  {court.status === 'matching' && (
                    <button
                      onClick={() => handleActionToast(`Bạn đã gửi yêu cầu tham gia ghép kèo tại ${court.id}!`)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg shadow transition"
                    >
                      Vào Kèo Ngay
                    </button>
                  )}

                  {court.status === 'live' && (
                    <button
                      onClick={() => handleActionToast(`Đang kết nối camera AI live stream ${court.id}...`)}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition flex items-center gap-1"
                    >
                      <Video className="w-3 h-3" /> Xem Live
                    </button>
                  )}

                  {court.status === 'booked' && (
                    <span className="text-xs text-slate-400 font-medium italic">Không khả dụng</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: DUPR Matchmaking Queue & Open Play */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>Sàn Ghép Kèo Pickleball Đôi & DUPR Matchmaking Queue</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Gia nhập các kèo Open Play đang chờ slot, tự động tính tiền sân theo đầu người
                </p>
              </div>

              <button
                onClick={() => handleActionToast("Đang mở form khởi tạo kèo Pickleball Open Play mới...")}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Kèo Mới</span>
              </button>
            </div>

            {/* Queue Cards */}
            <div className="space-y-4">
              {matchQueues.map((match) => (
                <div
                  key={match.id}
                  className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 hover:border-amber-400/50 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src={match.hostAvatar}
                        alt={match.hostName}
                        className="w-12 h-12 rounded-full border-2 border-emerald-500 object-cover flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-amber-400/20 text-amber-600 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/30">
                            {match.category}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Host: <span className="font-semibold text-slate-800 dark:text-slate-200">{match.hostName}</span> ({match.hostDupr})
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                          {match.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-emerald-500" /> {match.time}</span>
                          <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-cyan-500" /> {match.court}</span>
                          <span className="flex items-center"><Trophy className="w-3.5 h-3.5 mr-1 text-amber-500" /> Yêu cầu: {match.duprRequired}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 dark:border-slate-800">
                      <div className="text-left sm:text-right mb-2">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Chi phí / người:</div>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {match.costPerPerson.toLocaleString()}đ
                        </div>
                      </div>

                      <button
                        onClick={() => setJoiningMatch(match)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg shadow transition flex items-center space-x-1"
                      >
                        <span>Tham Gia Kèo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DUPR Verification CTA Banner */}
            <div className="mt-6 bg-gradient-to-r from-emerald-900/40 to-slate-900 p-4 rounded-xl border border-emerald-500/30 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <Trophy className="w-8 h-8 text-amber-400 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white text-sm">Chưa có Điểm Trình DUPR Chính Thức?</h4>
                  <p className="text-xs text-slate-300">Đăng ký kiểm tra trình độ cùng Ban Trọng Tài IPTPA tại sân để cấp chứng nhận DUPR Official.</p>
                </div>
              </div>
              <button
                onClick={() => handleActionToast("Đã gửi yêu cầu đăng ký thẩm định DUPR cùng Ban Trọng Tài!")}
                className="bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Xác Thực Điểm Trình DUPR
              </button>
            </div>
          </div>

          {/* Section 3: Pro Gear Rental & Coaching Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <span>Thuê Dụng Cụ Carbon Pro tại Sân</span>
              </h2>

              <div className="space-y-4">
                {gearItems.map((gear) => (
                  <div key={gear.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{gear.name}</span>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{gear.price}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{gear.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                        {gear.badge}
                      </span>
                      <button
                        onClick={() => handleActionToast(`Đã thêm ${gear.name} vào đơn đặt ca!`)}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-emerald-500 underline"
                      >
                        Thuê Ngay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach Booking Widget */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-6 border border-emerald-500/30 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-lg">
                  5.2
                </div>
                <div>
                  <h3 className="font-bold text-base">HLV Phạm Minh Triết</h3>
                  <div className="text-xs text-slate-300">Chứng chỉ IPTPA Level 2 • DUPR 5.2</div>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-4">
                Giáo án 1-1 chuyên sâu: Kỹ thuật Erne, Third Shot Drop, Speed-up phản xạ Kitchen line & Chiến thuật đánh đôi DUPR High-Level.
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-sm font-extrabold text-emerald-400">350.000đ / ca</span>
                <button
                  onClick={() => handleActionToast("Đã gửi yêu cầu đặt lịch tập cùng HLV Minh Triết!")}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition"
                >
                  Đặt Lịch HLV
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Court Booking Modal */}
      {bookingCourt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Xác Nhận Đặt Ca Sân {bookingCourt.id}
              </h3>
              <button
                onClick={() => setBookingCourt(null)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Tên sân:</span>
                <span className="font-bold text-slate-900 dark:text-white">{bookingCourt.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Mặt sân:</span>
                <span className="font-medium">{bookingCourt.surface}</span>
              </div>
              <div className="flex justify-between">
                <span>Khung giờ:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">18:30 - 20:00 (Hôm nay)</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-base font-extrabold text-slate-900 dark:text-white">
                <span>Tổng tiền cọc VietQR:</span>
                <span className="text-emerald-500">{bookingCourt.pricePerHour.toLocaleString()}đ</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-200">🛡️ Bảo Chứng Giữ Sân VietQR Napas247:</div>
              <div>• Tiền cọc giữ chỗ tự động khóa lịch trong 10s.</div>
              <div>• Hoàn cọc 100% nếu hủy trước 6 tiếng thi đấu.</div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setBookingCourt(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={() => {
                  setBookingCourt(null);
                  handleActionToast(`Đã thanh toán VietQR giữ chỗ thành công cho sân ${bookingCourt.id}!`);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
              >
                Thanh Toán VietQR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Joining Modal */}
      {joiningMatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Tham Gia Kèo {joiningMatch.category}
              </h3>
              <button
                onClick={() => setJoiningMatch(null)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-900 dark:text-white">{joiningMatch.title}</div>
              <div className="flex justify-between">
                <span>Thời gian & Sân:</span>
                <span className="font-medium text-emerald-500">{joiningMatch.time} ({joiningMatch.court})</span>
              </div>
              <div className="flex justify-between">
                <span>Trình độ yêu cầu:</span>
                <span className="font-bold">{joiningMatch.duprRequired}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-base font-extrabold text-slate-900 dark:text-white">
                <span>Mức chia tiền sân:</span>
                <span className="text-amber-500">{joiningMatch.costPerPerson.toLocaleString()}đ / người</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setJoiningMatch(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Để Sau
              </button>
              <button
                onClick={() => {
                  setJoiningMatch(null);
                  handleActionToast(`Bạn đã tham gia kèo thành công! Hãy chuẩn bị vợt đúng ${joiningMatch.time}.`);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition"
              >
                Xác Nhận Tham Gia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
