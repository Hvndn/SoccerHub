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
  fieldType: 'san5' | 'san7' | 'san11' | 'futsal';
  fieldLabel: string;
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
  eloRequired: string;
  currentPlayers: number;
  maxPlayers: number;
  costPerPerson: number;
  hostName: string;
  hostAvatar: string;
  hostElo: string;
  category: string;
}

export default function MultiSportArena() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'san5' | 'san7' | 'san11' | 'futsal'>('all');
  const [bookingCourt, setBookingCourt] = useState<Court | null>(null);
  const [joiningMatch, setJoiningMatch] = useState<MatchQueue | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const courts: Court[] = [
    {
      id: 'FB-01',
      name: 'Sân 7A: Nam Sài Gòn Serie B',
      fieldType: 'san7',
      fieldLabel: 'Sân 7 Người',
      surface: 'Cỏ Nhân Tạo Đạt Chuẩn FIFA 50mm',
      status: 'available',
      pricePerHour: 350000,
      features: ['Camera AI VAR Replay', 'Đèn LED 1000 Lux', 'Mái Che Khán Đài'],
    },
    {
      id: 'FB-02',
      name: 'Sân 7B: Kèo Giao Lưu Phủi Sài Gòn',
      fieldType: 'san7',
      fieldLabel: 'Sân 7 Người',
      surface: 'Cỏ Nhân Tạo Đạt Chuẩn FIFA 50mm',
      status: 'live',
      liveScore: 'Hiệp 2 (52\'): 3 - 2 (FC Warriors vs FC Kiến Trúc)',
      pricePerHour: 380000,
      features: ['Live Streaming HD 4K', 'Bảng Điểm Điện Tử LED', 'Trọng Tài FIFA'],
      currentPlayers: 14,
      maxPlayers: 14,
    },
    {
      id: 'FB-03',
      name: 'Sân 5A: Futsal Trong Nhà Máy Lạnh',
      fieldType: 'futsal',
      fieldLabel: 'Futsal Trong Nhà',
      surface: 'Mặt Sân Gỗ Thi Đấu Chống Trượt',
      status: 'matching',
      pricePerHour: 280000,
      features: ['Ký Quỹ VietQR', 'Máy Lạnh 24°C', 'Bóng Động Lực Futsal'],
      currentPlayers: 8,
      maxPlayers: 10,
    },
    {
      id: 'FB-04',
      name: 'Sân 5B: Sân 5 Cỏ Nhân Tạo VIP',
      fieldType: 'san5',
      fieldLabel: 'Sân 5 Người',
      surface: 'Cỏ Nhân Tạo Monofilament 45mm',
      status: 'available',
      pricePerHour: 250000,
      features: ['Cảm Biến Tốc Độ Sút', 'Hệ Thống Phủ Hạt Cao Su EPDM', 'Lưới Chắn Bóng Cao 8m'],
    },
    {
      id: 'FB-05',
      name: 'Sân 11A: Sân 11 Cỏ Tự Nhiên Chuẩn Quốc Tế',
      fieldType: 'san11',
      fieldLabel: 'Sân 11 Người',
      surface: 'Cỏ Tự Nhiên Bermutab',
      status: 'booked',
      pricePerHour: 1200000,
      features: ['Phòng Thay Đồ VIP', 'Vòi Tắm Nóng Lạnh', 'Trọng Tài Cấp Quốc Gia'],
    },
    {
      id: 'FB-06',
      name: 'Sân 7C: Kèo Ghép Đội Tìm Đối Thủ',
      fieldType: 'san7',
      fieldLabel: 'Sân 7 Người',
      surface: 'Cỏ Nhân Tạo Đạt Chuẩn FIFA 50mm',
      status: 'matching',
      pricePerHour: 350000,
      features: ['Thiếu 2 Cầu Thủ (Tiền Vệ / Hậu Vệ)', 'Chia Tiền Tự Động VietQR', 'Nước Uống Miễn Phí'],
      currentPlayers: 12,
      maxPlayers: 14,
    },
    {
      id: 'FB-07',
      name: 'Sân 5C: Ca Khung Giờ Vàng (19:00 - 20:30)',
      fieldType: 'san5',
      fieldLabel: 'Sân 5 Người',
      surface: 'Cỏ Nhân Tạo Monofilament 45mm',
      status: 'available',
      pricePerHour: 260000,
      features: ['Giảm 10% Cho Học Sinh / Sinh Viên', 'Cho Thuê Áo Bit Phản Quang', 'Khóa Sân 10s VietQR'],
    },
    {
      id: 'FB-08',
      name: 'Sân 7D: Ca Đêm Đèn Sáng (20:30 - 22:00)',
      fieldType: 'san7',
      fieldLabel: 'Sân 7 Người',
      surface: 'Cỏ Nhân Tạo Đạt Chuẩn FIFA 50mm',
      status: 'available',
      pricePerHour: 320000,
      features: ['Hệ Thống Đèn Chiếu Sáng Đêm', 'Phòng Tắm & Tủ Đồ Cá Nhân', 'Bảo Vệ Giữ Xe Miễn Phí'],
    },
  ];

  const matchQueues: MatchQueue[] = [
    {
      id: 'MATCH-FB-101',
      title: 'Kèo Sân 7 Giao Lưu Phủi (Cần 2 Cầu Thủ Tiền Vệ / Hậu Vệ)',
      time: '19:30 - 21:00 Hôm nay',
      court: 'Sân 7B - D-Sport Oasis Q.7',
      eloRequired: 'Elo 1350 - 1500 (Trung Bình)',
      currentPlayers: 12,
      maxPlayers: 14,
      costPerPerson: 45000,
      hostName: 'Nguyễn Văn An',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      hostElo: 'Elo 1450',
      category: 'Kèo Phủi Sân 7',
    },
    {
      id: 'MATCH-FB-102',
      title: 'Kèo Thách Đấu Sân 5 Futsal (Cược Thưởng Nước Cọc)',
      time: '20:00 - 21:30 Hôm nay',
      court: 'Sân 5A Trong Nhà',
      eloRequired: 'Elo 1550+ (Khá / Giỏi)',
      currentPlayers: 8,
      maxPlayers: 10,
      costPerPerson: 55000,
      hostName: 'Phạm Quốc Bảo',
      hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      hostElo: 'Elo 1620',
      category: 'Thách Đấu Futsal',
    },
    {
      id: 'MATCH-FB-103',
      title: 'Kèo Sân 11 Thi Đấu Cuối Tuần (Cần 1 Thủ Môn + 3 Cầu Thủ)',
      time: '07:30 - 09:30 Chủ Nhật',
      court: 'Sân 11A Cỏ Tự Nhiên',
      eloRequired: 'Tất Cả Trình Độ',
      currentPlayers: 18,
      maxPlayers: 22,
      costPerPerson: 75000,
      hostName: 'Trần Minh Tuấn',
      hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      hostElo: 'Elo 1400',
      category: 'Bóng Đá Sân 11',
    },
  ];

  const gearItems = [
    {
      id: 'gear-1',
      name: 'Bộ 10 Áo Bít Phản Quang Chia Đội',
      price: '30.000đ / trận',
      desc: 'Chất liệu thun lạnh thoáng khí, giặt sấy tiệt trùng sau mỗi trận đấu',
      badge: 'Cần thiết cho giao lưu',
    },
    {
      id: 'gear-2',
      name: 'Bóng Thi Đấu FIFA Quality Pro Động Lực',
      price: '40.000đ / trận',
      desc: 'Bóng UCV 3.05 chuẩn V-League, độ nảy và đường bay chuẩn xác 100%',
      badge: 'Chuẩn V-League',
    },
    {
      id: 'gear-3',
      name: 'Giày Đinh TF Wika / Mizuno Chính Hãng (Size 39-44)',
      price: '50.000đ / trận',
      desc: 'Đế cao su đinh TF bám sân cỏ nhân tạo tốt, êm chân chống lật cổ chân',
      badge: 'An toàn chấn thương',
    },
  ];

  const handleActionToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const filteredCourts = courts.filter(c => {
    if (activeFilter === 'all') return true;
    return c.fieldType === activeFilter;
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
        <div className="bg-gradient-to-r from-slate-900 via-[#0b4f6c] to-slate-900 border border-sky-500/30 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Sân Cỏ Đạt Chuẩn FIFA & VFF
                </span>
                <span className="bg-sky-400/20 text-sky-300 border border-sky-400/30 text-xs font-bold px-3 py-1 rounded-full">
                  Cụm Sân Cỏ D-Sport Oasis Q.7
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Ma Trận Sơ Đồ Cụm Sân Bóng Đá Real-Time
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                Đặt ca sân 5, sân 7, sân 11 và Futsal trong nhà tự động 24/7. Tìm đối thủ ghép trận theo chỉ số Elo, giữ chỗ tức thì qua VietQR Napas247.
              </p>
            </div>

            {/* Field Type Selector Tabs */}
            <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 flex flex-wrap items-center gap-2 self-start lg:self-auto">
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
                  className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all ${
                    activeFilter === tab.id
                      ? 'bg-emerald-500 text-slate-950 shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <div className="text-2xl font-bold text-emerald-400">8 Sân Bóng</div>
              <div className="text-xs text-slate-400 mt-0.5">Sân 5, 7, 11 & Futsal</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <div className="text-2xl font-bold text-sky-400">36 Ca Trống</div>
              <div className="text-xs text-slate-400 mt-0.5">Đặt Sân Trực Tuyến Trong Ngày</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
              <div className="text-2xl font-bold text-cyan-400">Elo 1200 - 1800</div>
              <div className="text-xs text-slate-400 mt-0.5">Xếp Hạng Cầu Thủ Phủi</div>
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
                <span>Trạng Thái Các Sân Bóng Trực Tiếp (Live Football Pitch Matrix)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Theo dõi trực tiếp từ FB-01 đến FB-08, tham gia ghép đội hoặc cọc ca trống theo giờ
              </p>
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
                <span className="font-medium text-slate-700 dark:text-slate-300">Cam Ánh Vàng: Đang Ghép Đội (Thiếu Cầu Thủ)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Đỏ Live: Trận Đấu Đang Diễn Ra (Tỷ Số Live)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Xám Khóa: Đã Đặt Lịch Giải Đấu / Tập Luyện</span>
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
                        <Users className="w-3 h-3" /> Ghép Kèo ({court.currentPlayers}/{court.maxPlayers})
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
                    <div>⚽ <span className="font-semibold text-slate-700 dark:text-slate-300">{court.fieldLabel}</span></div>
                    <div>🌱 {court.surface}</div>
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
                      Đặt Sân Ngay
                    </button>
                  )}

                  {court.status === 'matching' && (
                    <button
                      onClick={() => handleActionToast(`Bạn đã gửi yêu cầu tham gia ghép đội tại ${court.id}!`)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg shadow transition"
                    >
                      Vào Kèo Ngay
                    </button>
                  )}

                  {court.status === 'live' && (
                    <button
                      onClick={() => handleActionToast(`Đang kết nối camera AI VAR live stream ${court.id}...`)}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition flex items-center gap-1"
                    >
                      <Video className="w-3 h-3" /> Xem VAR Live
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

        {/* Section 2: Football Matchmaking Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>Sàn Ghép Kèo Đội Bóng Đá Phủi (Football Matchmaking Queue)</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Gia nhập các kèo bóng đá đang thiếu cầu thủ, tự động chia tiền sân theo đầu người qua VietQR
                </p>
              </div>

              <button
                onClick={() => handleActionToast("Đang mở form khởi tạo kèo Bóng Đá mới...")}
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
                            Đội Trưởng: <span className="font-semibold text-slate-800 dark:text-slate-200">{match.hostName}</span> ({match.hostElo})
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                          {match.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-emerald-500" /> {match.time}</span>
                          <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-cyan-500" /> {match.court}</span>
                          <span className="flex items-center"><Trophy className="w-3.5 h-3.5 mr-1 text-amber-500" /> Yêu cầu: {match.eloRequired}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 dark:border-slate-800">
                      <div className="text-left sm:text-right mb-2">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Chi phí / cầu thủ:</div>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {match.costPerPerson.toLocaleString()}đ
                        </div>
                      </div>

                      <button
                        onClick={() => setJoiningMatch(match)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg shadow transition flex items-center space-x-1"
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

          {/* Section 3: Football Gear & Referee Rental */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <span>Dịch Vụ & Dụng Cụ Bóng Đá Tại Sân</span>
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
                        onClick={() => handleActionToast(`Đã thêm ${gear.name} vào dịch vụ trận đấu!`)}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-emerald-500 underline"
                      >
                        Thuê Ngay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referee Booking Widget */}
            <div className="bg-gradient-to-br from-slate-900 to-[#0b4f6c] text-white rounded-2xl p-6 border border-sky-500/30 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center font-black text-sky-400 text-lg">
                  FIFA
                </div>
                <div>
                  <h3 className="font-bold text-base">Trọng Tài FIFA Nguyễn Hữu Tiến</h3>
                  <div className="text-xs text-slate-300">Bắt chính 150+ trận phủi Sài Gòn Serie A/B</div>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-4">
                Điều hành trận đấu chuyên nghiệp, bắt luật chuẩn xác, hỗ trợ chấm điểm MOTM và ghi nhận biên bản số điện tử.
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-sm font-extrabold text-sky-400">250.000đ / trận</span>
                <button
                  onClick={() => handleActionToast("Đã gửi yêu cầu đặt Trọng Tài bắt chính!")}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg shadow transition"
                >
                  Mời Trọng Tài
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
                <span>Loại sân:</span>
                <span className="font-medium text-emerald-500 font-bold">{bookingCourt.fieldLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>Mặt sân:</span>
                <span className="font-medium">{bookingCourt.surface}</span>
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
                Gia Nhập Kèo {joiningMatch.category}
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
                <span>Trình độ Elo yêu cầu:</span>
                <span className="font-bold">{joiningMatch.eloRequired}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-base font-extrabold text-slate-900 dark:text-white">
                <span>Mức chia tiền sân:</span>
                <span className="text-amber-500">{joiningMatch.costPerPerson.toLocaleString()}đ / cầu thủ</span>
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
                  handleActionToast(`Bạn đã tham gia kèo bóng đá ${joiningMatch.id} thành công!`);
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
