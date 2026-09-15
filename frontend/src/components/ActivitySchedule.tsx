import React, { useState, useEffect } from 'react';
import { 
  Home, ChevronRight, Calendar, PlusCircle, Radio, Clock, MapPin, Trophy, Users, 
  ShieldCheck, Zap, QrCode, Video, MessageSquare, AlertTriangle, Download, Wallet,
  TrendingUp, Activity, PhoneCall, CheckCircle2, ChevronDown, RefreshCw, XCircle,
  PlayCircle, FileText
} from 'lucide-react';

interface ActivityScheduleProps {
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ActivitySchedule: React.FC<ActivityScheduleProps> = ({
  onBackToHome,
  onNavigateTab
}) => {
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'tournaments' | 'matchmaking' | 'history' | 'cancelled'>('upcoming');
  const [secondsRemaining, setSecondsRemaining] = useState(1 * 3600 + 45 * 60 + 20);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <div className="w-full bg-[#f8f9ff] dark:bg-[#0b1c30] text-[#0b1c30] dark:text-[#f8f9ff] font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col w-full gap-6">

          {/* 1. SUB-HEADER / BREADCRUMB & HIGH-LEVEL ACTIONS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <button onClick={onBackToHome} className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>Trang chủ</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-900 dark:text-white font-bold">Lịch Hoạt Động & Đặt Chỗ</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">Tất cả lịch trình</span>
              </nav>

              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Lịch Trình & Vé Thi Đấu
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-lime-400 text-slate-950 font-black text-xs uppercase tracking-wide">
                  Mùa Giải 2025
                </span>
              </div>
            </div>

            {/* Top CTA Action Cluster */}
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => alert('Đã xuất file lịch thi đấu .ics và đồng bộ thành công với Google Calendar!')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
              >
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Xuất iCal / Google Calendar</span>
              </button>

              <button 
                onClick={() => onNavigateTab && onNavigateTab('booking')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Đặt Thêm Sân Mới</span>
              </button>
            </div>
          </div>

          {/* 2. FILTER RIBBON & TAB STRIP */}
          <div className="flex items-center justify-between overflow-x-auto pb-1 gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setActiveFilter('upcoming')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeFilter === 'upcoming' 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>Sắp diễn ra</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono text-[11px] font-bold">3</span>
              </button>

              <button 
                onClick={() => setActiveFilter('tournaments')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeFilter === 'tournaments' 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>Lịch đấu giải</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold">1</span>
              </button>

              <button 
                onClick={() => setActiveFilter('matchmaking')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeFilter === 'matchmaking' 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>Kèo đã ghép</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold">2</span>
              </button>

              <button 
                onClick={() => setActiveFilter('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeFilter === 'history' 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>Lịch sử đã đá/đánh</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold">28</span>
              </button>

              <button 
                onClick={() => setActiveFilter('cancelled')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeFilter === 'cancelled' 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>Đã hủy</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-mono text-[11px] font-bold">1</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Tự động đồng bộ IoT sân bãi theo thời gian thực
            </div>
          </div>

          {/* 3. PRIMARY 2-COLUMN RESPONSIVE LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Upcoming Matches & Historical Feed (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* HERO IMMINENT MATCH BANNER */}
              <div className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-md p-6 lg:p-7 flex flex-col gap-5 border border-slate-200/80 dark:border-slate-800">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-lime-400 to-teal-500"></div>

                {/* Header status with animated countdown */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping"></span>
                      TRẬN TIẾP THEO
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-rose-500" />
                      Khởi tranh sau: <span className="font-mono font-black tracking-wider text-base">{formatCountdown(secondsRemaining)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
                      Pickleball Đôi Nam
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                      Rating DUPR Official
                    </span>
                  </div>
                </div>

                {/* Match Info & Court Visual Splice */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="relative w-full md:w-48 h-36 rounded-lg overflow-hidden shrink-0 shadow-xs border border-slate-200 dark:border-slate-800">
                    <img 
                      src="https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=800&q=80" 
                      alt="Pickleball Match PB-01"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-slate-950/80 backdrop-blur-sm text-white font-mono text-xs font-bold">
                      Sân PB-01 Pro
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Pickleball Giao Lưu Cọ Xát & Cập Nhật DUPR 3.0 - 3.2
                    </h2>

                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        19:30 - 21:00 (Tối nay, 18/10 • 90 Phút)
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        Cụm D-Sport Oasis Q.7 (Thảm Cushion 8 lớp)
                      </span>
                    </div>

                    {/* Team Rosters & DUPR Rating Nodes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {/* Team A (Your Team) */}
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 flex flex-col gap-1.5 border border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span className="uppercase tracking-wider text-emerald-700 dark:text-emerald-400">ĐỘI CỦA BẠN (Cặp Đấu 1)</span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-400">Avg 3.07</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">AN</span>
                            <span>Bạn (Nguyễn Văn An)</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 font-mono text-emerald-600">3.05</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px]">TL</span>
                            <span>Tuấn Lê</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 font-mono text-slate-500">3.10</span>
                        </div>
                      </div>

                      {/* Team B (Opponents) */}
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 flex flex-col gap-1.5 border border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                          <span className="uppercase tracking-wider">ĐỐI THỦ (Cặp Đấu 2)</span>
                          <span className="font-mono">Avg 2.95</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px]">MK</span>
                            <span>Minh Khang</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 font-mono text-slate-500">2.90</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px]">QB</span>
                            <span>Quốc Bảo</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 font-mono text-slate-500">3.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* IoT Realtime Health Indicator Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Đã cọc 50% (45.000đ)
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Hệ thống IoT sẵn sàng (Bật đèn 19:25)
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                    <Video className="w-3.5 h-3.5 text-emerald-600" />
                    AI Smart Replay kích hoạt tự động
                  </div>
                </div>

                {/* Interactive Match Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      onClick={() => setShowQRModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-sm transition-all active:scale-95"
                    >
                      <QrCode className="w-4 h-4" />
                      Vé Vào Sân & Mở Tủ Đồ #09
                    </button>
                    <button 
                      onClick={() => alert('Đã mở sa bàn chiến thuật & phòng chat nhóm trận đấu!')}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      Sa Bàn & Kênh Nhóm (4)
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowCancelModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors" 
                    title="Đổi giờ hoặc hủy trước 2 tiếng miễn phí"
                  >
                    <XCircle className="w-4 h-4 text-rose-500" />
                    Báo Hủy / Đổi Giờ
                  </button>
                </div>
              </div>

              {/* UPCOMING QUEUE CARDS */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Các Trận Tiếp Theo Trong Tuần</h3>
                  <span className="text-xs text-slate-500 font-medium">Sắp xếp theo thứ tự thời gian</span>
                </div>

                {/* Match Card 2: Tournament Semi-Final */}
                <div className="rounded-xl bg-white dark:bg-slate-900 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center shrink-0 text-center border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-500">THỨ 7</span>
                      <span className="text-lg leading-none text-emerald-700 dark:text-emerald-400 font-black">19</span>
                      <span className="text-[9px] text-slate-400 font-bold">T10</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold text-[11px]">BÁN KẾT CÚP</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">VaoSan Mini Pickleball Cup 2025</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs">
                        <span className="flex items-center gap-1 text-slate-900 dark:text-white font-semibold">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          07:30 - 09:30 (Sáng mai)
                        </span>
                        <span>•</span>
                        <span>Sân PB-01 Cụm Oasis Q.7</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">Trọng tài VFF cấp 2</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Đối thủ: <strong className="text-slate-900 dark:text-white">Đức Duy / Quang Huy</strong> (Hạt giống số #2) • Thể thức 3 ván thắng 2 (11 điểm Rally)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-end gap-2 shrink-0 w-full md:w-auto justify-between md:justify-start">
                    <button className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      Xem Nhánh Đấu & Điều Lệ
                    </button>
                    <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1">
                      <span>Chỉ đường Google Maps</span>
                    </a>
                  </div>
                </div>

                {/* Match Card 3: Football Matchday */}
                <div className="rounded-xl bg-white dark:bg-slate-900 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center shrink-0 text-center border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-500">CHỦ NHẬT</span>
                      <span className="text-lg leading-none text-lime-600 dark:text-lime-400 font-black">20</span>
                      <span className="text-[9px] text-slate-400 font-bold">T10</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">Bóng Đá Sân 7 Phủi</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">FC Sài Gòn Warriors vs FC Anh Em Kiến Trúc</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs">
                        <span className="flex items-center gap-1 text-slate-900 dark:text-white font-semibold">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          18:00 - 19:30 (Chủ Nhật)
                        </span>
                        <span>•</span>
                        <span>Cụm Sân 7A Nam Sài Gòn (Cỏ FIFA Star 2)</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs pt-0.5">
                        <span className="px-2 py-0.5 rounded bg-lime-100 dark:bg-lime-950 text-lime-900 dark:text-lime-400 font-bold">Vị trí: Tiền vệ trung tâm</span>
                        <span className="text-slate-500">Áo Đen Số #10</span>
                        <span className="text-emerald-600 font-mono font-bold">Đã đủ 14/14 cầu thủ</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-end gap-2 shrink-0 w-full md:w-auto justify-between md:justify-start">
                    <button className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      Xem Đội Hình & Chiến Thuật
                    </button>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Quỹ FairPlay Đã Khóa
                    </span>
                  </div>
                </div>
              </div>

              {/* MATCH HISTORY & RECENT RESULTS */}
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Nhật Ký & Kết Quả Trận Đấu Gần Đây</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">Tháng 10/2025</span>
                  </div>
                  <a href="#" className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1">
                    <span>Xem toàn bộ 28 trận</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="rounded-xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden flex flex-col border border-slate-200/80 dark:border-slate-800">
                  {/* Item 1: Pickleball Win */}
                  <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-lime-400 text-slate-950 font-mono text-xs font-black">THẮNG 2 - 1</span>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Pickleball Cúp Giao Hữu Mùa Thu (Vòng Tứ Kết)</span>
                        <span className="text-[11px] text-slate-500">16/10/2025 • Tỉ số ván: 11-8, 9-11, 11-7 • Sân Oasis Q.7</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold">+0.05 DUPR</span>
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold transition-colors">
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                        AI Highlights (60s)
                      </button>
                    </div>
                  </div>

                  {/* Item 2: Football Win */}
                  <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-lime-400 text-slate-950 font-mono text-xs font-black">THẮNG 4 - 2</span>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Bóng Đá 7 Người Phủi Giao Lưu Cuối Tuần</span>
                        <span className="text-[11px] text-slate-500">13/10/2025 • Đóng góp: 1 Bàn thắng, 2 Kiến tạo (MVP Trận)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold">+18 Elo</span>
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold transition-colors">
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                        AI Highlights (45s)
                      </button>
                    </div>
                  </div>

                  {/* Item 3: Pickleball Loss */}
                  <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">THUA 1 - 2</span>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Pickleball Đơn Nam Xếp Hạng Elo</span>
                        <span className="text-[11px] text-slate-500">10/10/2025 • Tỉ số: 11-9, 7-11, 8-11 vs @HoangLong</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold">-0.02 DUPR</span>
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold transition-colors">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Xem Thống Kê Lỗi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Pass, Insights Radar & Policies (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* WIDGET 1: ACTIVE MATCHDAY PASS (QR ACCESSIBILITY) */}
              <div className="rounded-xl bg-white dark:bg-slate-900 shadow-md p-6 flex flex-col gap-4 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Vé Vào Sân Nhanh</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-lime-400 text-slate-950 font-mono text-[10px] font-black animate-pulse">SẴN SÀNG</span>
                </div>
                <p className="text-xs text-slate-500">
                  Quét tự động tại Barrier Cổng A & Tủ đồ thông minh CLB D-Sport Oasis.
                </p>

                {/* Dynamic QR Box Mockup */}
                <div className="relative bg-slate-50 dark:bg-slate-950 rounded-lg p-5 flex flex-col items-center justify-center gap-3 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-44 h-44 bg-white p-3 rounded-lg shadow-sm flex items-center justify-center relative overflow-hidden border border-slate-200">
                    {/* Simulated Clean SVG QR Code */}
                    <svg className="w-full h-full text-slate-900" fill="currentColor" viewBox="0 0 100 100">
                      <rect x="0" y="0" width="30" height="30" rx="3"></rect>
                      <rect x="5" y="5" width="20" height="20" fill="white"></rect>
                      <rect x="10" y="10" width="10" height="10"></rect>
                      
                      <rect x="70" y="0" width="30" height="30" rx="3"></rect>
                      <rect x="75" y="5" width="20" height="20" fill="white"></rect>
                      <rect x="80" y="10" width="10" height="10"></rect>

                      <rect x="0" y="70" width="30" height="30" rx="3"></rect>
                      <rect x="5" y="75" width="20" height="20" fill="white"></rect>
                      <rect x="10" y="80" width="10" height="10"></rect>

                      <rect x="40" y="10" width="20" height="6"></rect>
                      <rect x="40" y="22" width="12" height="6"></rect>
                      <rect x="10" y="40" width="6" height="20"></rect>
                      <rect x="45" y="45" width="10" height="10" fill="#059669"></rect>
                      <rect x="65" y="40" width="25" height="6"></rect>
                      <rect x="40" y="70" width="12" height="12"></rect>
                      <rect x="60" y="65" width="15" height="8"></rect>
                      <rect x="80" y="80" width="15" height="15"></rect>
                    </svg>
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-bounce"></div>
                  </div>

                  <div className="text-center flex flex-col gap-0.5">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">Mã vé: #VS-7829-PB</span>
                    <span className="text-[11px] text-slate-500">Hiệu lực: 19:15 - 21:15 tối nay</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => alert('Đã lưu mã QR vé vào thư viện ảnh!')}
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Lưu Mã Ảnh
                  </button>
                  <button 
                    onClick={() => alert('Đã thêm Smart Pass vào Apple Wallet / Google Wallet!')}
                    className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold flex items-center justify-center gap-1 hover:opacity-90 transition-opacity"
                  >
                    <Wallet className="w-4 h-4" />
                    Apple Wallet
                  </button>
                </div>
              </div>

              {/* WIDGET 2: PERFORMANCE & PLAYTIME METRICS */}
              <div className="rounded-xl bg-white dark:bg-slate-900 shadow-xs p-6 flex flex-col gap-5 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Chỉ Số Ra Sân Tháng 10</h3>
                  </div>
                  <span className="text-xs text-emerald-600 font-bold">Top 5% Tích Cực</span>
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 flex flex-col gap-1 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 font-medium">Tổng giờ trên sân</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-emerald-600 font-mono">24.5</span>
                      <span className="text-xs text-slate-500 font-semibold">Giờ</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      +18% so với T9
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 flex flex-col gap-1 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 font-medium">Trận đấu (Thắng-Thua)</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">16</span>
                      <span className="text-xs text-slate-500 font-semibold">Trận</span>
                    </div>
                    <span className="text-[10px] text-lime-600 dark:text-lime-400 font-extrabold">
                      11W - 5L (68.7% Win)
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 flex flex-col gap-1 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 font-medium">Ước tính tiêu hao</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">14.2k</span>
                      <span className="text-xs text-slate-500 font-semibold">kcal</span>
                    </div>
                    <span className="text-[10px] text-slate-500">~880 kcal/trận</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 flex flex-col gap-1 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 font-medium">Điểm DUPR / Elo</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-emerald-600 font-mono">3.05</span>
                      <span className="text-xs text-slate-500 font-semibold">DUPR</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">1,200 Elo Bóng đá</span>
                  </div>
                </div>

                {/* Sport Breakdown Distribution Bar */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Phân bổ bộ môn</span>
                    <span className="text-slate-900 dark:text-white font-bold">Pickleball chiếm đa số</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                    <div className="h-full bg-emerald-600" style={{ width: '55%' }} title="Pickleball: 55%"></div>
                    <div className="h-full bg-lime-400" style={{ width: '30%' }} title="Bóng đá: 30%"></div>
                    <div className="h-full bg-sky-500" style={{ width: '15%' }} title="Cầu lông: 15%"></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> Pickleball (55%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-lime-400"></span> Bóng đá (30%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> Cầu lông (15%)</span>
                  </div>
                </div>
              </div>

              {/* WIDGET 3: BOOKING INTEGRITY & REFUND POLICY */}
              <div className="rounded-xl bg-slate-100/80 dark:bg-slate-900/60 shadow-xs p-6 flex flex-col gap-4 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white text-base font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Chính Sách Giữ Chỗ & FairPlay</span>
                </div>
                <div className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Hoàn 100% tiền cọc:</strong> Nếu báo hủy trước thời điểm bắt đầu tối thiểu 2 giờ.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Hoàn 50% tiền cọc:</strong> Nếu hủy trước từ 1 đến 2 giờ. Tiền hoàn lập tức về Ví VaoSan.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Cam kết chống bùng kèo:</strong> Quỹ bảo chứng FairPlay tự động đền bù 100% chi phí sân nếu bạn ghép đối thủ bỏ trận vô cớ.</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-between border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white text-xs font-bold">
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                    <span>Hỗ trợ sự cố sân:</span>
                  </div>
                  <a href="tel:19006886" className="font-mono font-bold text-emerald-600 hover:underline text-xs">1900 6886 (24/7)</a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* QR Pass Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl animate-in fade-in zoom-in duration-200 text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold">Vé Vào Sân & Mở Tủ Đồ</h3>
            <p className="text-xs text-slate-500">Đưa mã QR này trước ống kính camera barrier cổng sân PB-01</p>
            <div className="w-56 h-56 mx-auto bg-white p-4 rounded-xl border border-slate-200 shadow-inner flex items-center justify-center">
              <QrCode className="w-full h-full text-slate-900" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-xs font-mono font-bold text-emerald-600">
              #VS-7829-PB • TỦ ĐỒ SỐ 09
            </div>
            <button 
              onClick={() => setShowQRModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200 text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold text-rose-600">Báo Hủy / Đổi Giờ Đặt Sân</h3>
            <p className="text-xs text-slate-500">
              Trận đấu còn hơn 1 giờ 45 phút nữa mới bắt đầu. Bạn được **hoàn 100% tiền cọc** (45.000đ) về Ví VaoSan ngay lập tức.
            </p>
            <div className="space-y-2 text-xs">
              <label className="block font-bold">Lý do hủy trận:</label>
              <select className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <option>Bận công việc đột xuất</option>
                <option>Thời tiết không thuận lợi</option>
                <option>Muốn đổi sang khung giờ khác</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                Giữ Lịch Trình
              </button>
              <button 
                onClick={() => {
                  alert('Đã hủy lịch thành công. Tiền cọc 45.000đ đã được hoàn vào ví VaoSan!');
                  setShowCancelModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md"
              >
                Xác Nhận Hủy & Hoàn Tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ActivitySchedule;
