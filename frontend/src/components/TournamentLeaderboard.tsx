import React, { useState } from 'react';
import { 
  Trophy, Award, Flame, Search, Filter, Calendar, MapPin, Users, ChevronRight, 
  PlayCircle, Zap, ArrowUpRight, ShieldCheck, CheckCircle2, UserCheck, PlusCircle,
  Radio, RefreshCw, Star, Info, Share2, Sparkles, Check, Home, Video, ChevronDown,
  Activity
} from 'lucide-react';

interface TournamentLeaderboardProps {
  onBackToHome?: () => void;
  onSelectTournament?: (id: string) => void;
}

export const TournamentLeaderboard: React.FC<TournamentLeaderboardProps> = ({
  onBackToHome,
  onSelectTournament
}) => {
  const [activeSport, setActiveSport] = useState<'all' | 'pickleball' | 'football' | 'badminton' | 'tennis'>('pickleball');
  const [activeTab, setActiveTab] = useState<'open' | 'live' | 'bracket' | 'rankings'>('open');
  const [selectedLevel, setSelectedLevel] = useState('Tất cả DUPR/Elo');
  const [selectedScale, setSelectedScale] = useState('Open Cup & CLB Mở Rộng');
  const [selectedLocation, setSelectedLocation] = useState('TP. Hồ Chí Minh (Q.7, Q.1, Thủ Đức)');
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedTourneyForReg, setSelectedTourneyForReg] = useState<string | null>(null);

  // Top Pickleball Leaderboard (Stitch exact)
  const topDuprPlayers = [
    { rank: 1, name: 'Lê Hoàng Yến', dpr: '4.65', note: '+45 điểm tuần này', crown: true },
    { rank: 2, name: 'Trần Quốc Nam', dpr: '4.52', note: '+30 điểm', crown: false },
    { rank: 3, name: 'Phạm Đăng Khoa', dpr: '4.40', note: '+18 điểm', crown: false },
    { rank: 4, name: 'Vũ Minh Tuấn', dpr: '4.25', note: 'Giữ hạng', crown: false },
    { rank: 5, name: 'Đặng Ngọc Long', dpr: '4.18', note: 'Giữ hạng', crown: false },
  ];

  return (
    <div className="w-full bg-[#f8f9ff] dark:bg-[#0b1c30] text-[#0b1c30] dark:text-[#f8f9ff] font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col w-full gap-6">
          
          {/* 1. BREADCRUMBS & LIVE TICKER BAR */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <button onClick={onBackToHome} className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span>Trang chủ</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-900 dark:text-white font-bold">Giải Đấu & Bảng Xếp Hạng</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-bold">
                Mùa Giải Q4-2025
              </span>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full shadow-xs border border-slate-200 dark:border-slate-800">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">LIVE 14:35:</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-xs sm:max-w-md font-medium">
                BK1 Pickleball Sân PB-01: Minh Khang / Tuấn Lê chuẩn bị Match Point!
              </span>
            </div>
          </div>

          {/* 2. MULTI-SPORT FILTER RIBBON & QUICK ACTIONS */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800">
            {/* Sport Switcher Ribbon */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <button 
                onClick={() => setActiveSport('all')}
                className={`group flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  activeSport === 'all'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Tất cả môn</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">48</span>
              </button>

              <button 
                onClick={() => setActiveSport('pickleball')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  activeSport === 'pickleball'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>🏓 Pickleball</span>
                <span className="px-1.5 py-0.5 rounded-full bg-lime-400 text-slate-950 text-[11px] font-black">18 giải</span>
              </button>

              <button 
                onClick={() => setActiveSport('football')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  activeSport === 'football'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>⚽ Bóng Đá 7 Người</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">16</span>
              </button>

              <button 
                onClick={() => setActiveSport('badminton')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  activeSport === 'badminton'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>🏸 Cầu Lông</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">10</span>
              </button>

              <button 
                onClick={() => setActiveSport('tennis')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  activeSport === 'tennis'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>🎾 Tennis</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">4</span>
              </button>
            </div>

            {/* Quick CTAs */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button 
                onClick={() => {
                  const eloSection = document.getElementById('search-elo-section');
                  eloSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
              >
                <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tra cứu BXH Cá Nhân</span>
              </button>

              <button 
                onClick={() => setShowRegModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Đăng Ký Đội Thi Đấu</span>
              </button>
            </div>
          </div>

          {/* 3. SECONDARY FILTER DROPDOWNS BAR */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              <Filter className="w-3.5 h-3.5" />
              Lọc nhanh:
            </span>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs shadow-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="text-slate-500">Trình độ:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{selectedLevel}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs shadow-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="text-slate-500">Quy mô:</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedScale}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs shadow-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold text-slate-900 dark:text-white">{selectedLocation}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button 
                onClick={() => {
                  setSelectedLevel('Tất cả DUPR/Elo');
                  setSelectedScale('Open Cup & CLB Mở Rộng');
                  setSelectedLocation('TP. Hồ Chí Minh (Q.7, Q.1, Thủ Đức)');
                }}
                className="text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:underline flex items-center gap-0.5"
              >
                <span>Thiết lập lại bộ lọc</span>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4. FEATURED TOURNAMENT HERO BANNER CARD (STITCH EXACT SPOTLIGHT) */}
          <div className="relative overflow-hidden rounded-2xl bg-[#1e293b] dark:bg-[#0f172a] text-white shadow-xl p-6 sm:p-8 border border-slate-700">
            {/* Ambient Stadium Glow */}
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-lime-500/10 blur-3xl pointer-events-none"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Content */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-lime-400 text-slate-950 text-[11px] uppercase tracking-wider font-black flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    GIẢI ĐẤU TIÊU ĐIỂM TRONG THÁNG
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 text-[11px] font-bold flex items-center gap-1 border border-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    DUPR Official Sanctioned
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 text-[11px] font-bold flex items-center gap-1 border border-rose-500/30">
                    <Activity className="w-3.5 h-3.5" />
                    Hạn chót: Còn 3 ngày
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                    VaoSan Pickleball Championship 2025
                  </h1>
                  <p className="text-lg sm:text-xl text-emerald-400 font-bold mt-1">
                    Cúp Mùa Thu Mở Rộng • Tranh Cúp Vô Địch & Điểm Tích Lũy DUPR
                  </p>
                </div>

                {/* Metric Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="flex flex-col p-2.5 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tổng Giải Thưởng</span>
                    <span className="text-lg sm:text-xl font-black text-lime-400 font-mono mt-0.5">35.000.000đ</span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Thời Gian Diễn Ra</span>
                    <span className="text-sm font-bold text-white mt-0.5">26/10 - 27/10/2025</span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Thể Thức Hạng Đấu</span>
                    <span className="text-sm font-bold text-white mt-0.5">Đôi Nam & Đôi Nam-Nữ</span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-slate-900/60 backdrop-blur-sm border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Địa Điểm Chuẩn Olympic</span>
                    <span className="text-sm font-bold text-white mt-0.5">D-Sport Oasis, Q.7</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-300">Tiến độ ghi danh:</span>
                      <span className="font-mono font-bold text-lime-400">28 / 32 Cặp VĐV (88%)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 font-bold text-[11px] animate-pulse">Chỉ còn 4 suất cuối!</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full transition-all duration-500" style={{ width: '88%' }}></div>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setSelectedTourneyForReg('tourney-1');
                      setShowRegModal(true);
                    }}
                    className="px-5 py-3 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-lime-400/20 transition-all transform hover:-translate-y-0.5"
                  >
                    <span>🏓 Đăng Ký Tham Gia Ngay (600k/cặp)</span>
                  </button>
                  <button className="px-4 py-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 backdrop-blur-sm border border-slate-700 transition-all">
                    <span>📜 Điều Lệ & Thể Thức Bốc Thăm</span>
                  </button>
                </div>
              </div>

              {/* Right Media Spotlight */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="relative overflow-hidden rounded-xl bg-slate-900/80 backdrop-blur-md p-4 border border-slate-800 flex flex-col gap-3">
                  <div className="relative w-full h-44 rounded-lg overflow-hidden shadow-inner">
                    <img 
                      src="https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=800&q=80" 
                      alt="Pickleball Championship"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                        🏆 8 Sân Đạt Chuẩn USAPA
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[11px] font-bold">
                        HD Livestream AI
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                    <span className="flex items-center gap-1">
                      ⭐ Huy chương mạ vàng + Áo thi đấu chính hãng
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. MAIN NAVIGATION TABS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button 
              onClick={() => setActiveTab('open')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'open' 
                  ? 'bg-emerald-700 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Giải Đấu Đang Mở Đăng Ký (18)</span>
            </button>

            <button 
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'live' 
                  ? 'bg-emerald-700 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Lịch Thi Đấu & Kết Quả Live (8)</span>
            </button>

            <button 
              onClick={() => setActiveTab('bracket')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'bracket' 
                  ? 'bg-emerald-700 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Bảng Đấu & Nhánh Bracket</span>
            </button>

            <button 
              onClick={() => setActiveTab('rankings')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'rankings' 
                  ? 'bg-emerald-700 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Bảng Xếp Hạng Elo & DUPR</span>
            </button>
          </div>

          {/* 6. MAIN 2-COLUMN WORKSPACE: 70% LEFT / 30% RIGHT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN (70% - Col span 8): TOURNAMENT CARDS & LIVE BRACKET */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* LIVE QUICK BRACKET / MATCH PROGRESSION PREVIEW WIDGET */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-[11px] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      TRỰC TIẾP
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Vòng Bán Kết - VaoSan Mini Cup Sân PB-01
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-bold">
                    Chung kết: 17:30 Chiều nay
                  </span>
                </div>

                {/* Bracket Dual-Match Flow Module */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* BK1 Result Box */}
                  <div className="md:col-span-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex flex-col gap-2 border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>BÁN KẾT 1 • ĐÃ KẾT THÚC</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">2 - 0 (FT)</span>
                    </div>

                    {/* Advancing Team Row */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 shadow-xs border border-emerald-500/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-6 rounded-full bg-emerald-600 shrink-0"></span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">Minh Khang / Tuấn Lê</span>
                          <span className="text-[10px] text-slate-500">Seed #1 • DUPR 3.48</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 pl-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950">11</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950">11</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>

                    {/* Eliminated Team Row */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100/60 dark:bg-slate-900/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-6 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0"></span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">Hoàng Nam / Gia Bảo</span>
                          <span className="text-[10px] text-slate-400">Seed #4 • DUPR 3.32</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-slate-400 pl-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">8</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">9</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow Connector */}
                  <div className="hidden md:flex md:col-span-2 flex-col items-center justify-center text-center">
                    <ChevronRight className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Tiến Vào CK</span>
                  </div>

                  {/* Grand Final Live Teaser Box */}
                  <div className="md:col-span-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex flex-col gap-2 border border-emerald-500/30">
                    <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-400 font-bold">
                      <span>CHUNG KẾT TRANH VÔ ĐỊCH</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px]">SÂN 1</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Minh Khang / Tuấn Lê</span>
                        <span className="font-mono text-[11px] text-emerald-600 font-bold">Team 1</span>
                      </div>
                      <div className="text-center font-mono text-slate-400 font-bold text-[10px] tracking-widest uppercase">VS</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Đức Duy / Quang Huy</span>
                        <span className="font-mono text-[11px] text-amber-500 font-bold">Team 2</span>
                      </div>
                    </div>
                    <button className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                      <Video className="w-3.5 h-3.5 text-lime-400" />
                      <span>Xem Livestream AI Cam & Điểm Live</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* TOURNAMENT CARD 1: Sài Gòn League 7v7 (Football) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow flex flex-col gap-4 border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <span className="text-2xl">⚽</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">Bóng Đá 7 Người</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-bold text-[11px]">Chuẩn VFF Phủi Pro</span>
                        <span className="px-2 py-0.5 rounded bg-lime-100 dark:bg-lime-950 text-lime-900 dark:text-lime-400 font-bold text-[11px]">Cup & Tiền Mặt</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        Sài Gòn League 7v7 - Mùa Thu 2025
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          Cụm Sân Nam Sài Gòn, Huyện Nhà Bè
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Khởi tranh: 02/11/2025 (Kéo dài 8 tuần)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Giải Thưởng</span>
                    <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">50.000.000đ</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Số đội: <strong className="text-slate-900 dark:text-white">14 / 16 Đội</strong> (Còn 2 slot)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Trọng tài: <strong className="text-slate-900 dark:text-white">VFF Cấp 2 điều hành</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-emerald-600" />
                    <span>Công nghệ: <strong className="text-slate-900 dark:text-white">Camera AI bắt việt vị</strong></span>
                  </div>
                </div>

                {/* Progress & CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="w-36 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: '87.5%' }}></div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">87.5% Slot đã khóa</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors">
                      Chi Tiết Điều Lệ
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedTourneyForReg('tourney-2');
                        setShowRegModal(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Nộp Danh Sách Đội
                    </button>
                  </div>
                </div>
              </div>

              {/* TOURNAMENT CARD 2: Cầu Lông Đôi Yonex Open (Badminton) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow flex flex-col gap-4 border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center shrink-0 border border-sky-500/20">
                      <span className="text-2xl">🏸</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">Cầu Lông Đôi Nam-Nữ</span>
                        <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-400 font-bold text-[11px]">Trình độ: Trung Bình - Khá</span>
                        <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 font-bold text-[11px]">Đã Đủ Đội • Chờ Bốc Thăm</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        Yonex Open Sài Gòn 2025 - Cup Đôi Vợt Bạc
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          CLB Cầu Lông Tân Hưng, Q.7
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Thi đấu: 08/11/2025 (Chủ Nhật)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Giải Thưởng</span>
                    <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">15.000.000đ + Vợt Yonex</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">24/24 Cặp VĐV đã xác nhận hồ sơ y tế và trình độ hợp lệ.</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 font-bold">Bốc thăm: 20:00 ngày 05/11</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5">
                    <span>Xem Danh Sách VĐV & Nhánh Đấu Dự Kiến</span>
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (30% - Col span 4): LEADERBOARDS & ATHLETE PROFILE WIDGETS */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* WIDGET 1: ATHLETE PERSONAL ELO/DUPR STATUS CARD */}
              <div id="search-elo-section" className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-extrabold flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Vị Trí Của Bạn Trên Hệ Thống
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 text-[11px] font-bold">Xác Thực DUPR</span>
                </div>

                {/* Athlete Profile Snippet */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shrink-0">
                    VA
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm truncate">Nguyễn Văn An</span>
                    <span className="text-xs text-slate-500">VĐV CLB VaoSan Phú Mỹ Hưng</span>
                  </div>
                </div>

                {/* Metric dual box */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Pickleball DUPR</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">3.05</span>
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">#142 Q.7</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5">Top 15% VĐV tích cực</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Bóng Đá Phủi Elo</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">1,215</span>
                      <span className="text-[11px] font-bold text-amber-500">#86 Div 2</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5">+45 điểm trong tháng</span>
                  </div>
                </div>

                {/* Achievements List */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Huy Hiệu Giải Đấu Đã Đạt</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-semibold">
                      🥇 Top 8 VaoSan Summer Cup 2024
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 text-xs font-semibold">
                      🔥 Chuỗi 5 Trận Bất Bại
                    </span>
                  </div>
                </div>

                <button className="w-full py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                  <span>Nộp Biên Bản Trận Đấu Mới</span>
                </button>
              </div>

              {/* WIDGET 2: TOP DUPR PICKLEBALL LEADERBOARD (STITCH EXACT MATCH) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      Bảng Vàng DUPR Pickleball
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">TP.HCM • T10</span>
                </div>

                {/* Leaderboard Rows */}
                <div className="flex flex-col gap-1 pt-1">
                  {topDuprPlayers.map(p => (
                    <div 
                      key={p.rank} 
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                        p.rank === 1 
                          ? 'bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                          p.rank === 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {p.rank}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            {p.name} {p.crown && '👑'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">{p.note}</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">{p.dpr}</span>
                    </div>
                  ))}
                </div>

                <a href="#" className="pt-2 text-center text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center justify-center gap-1">
                  <span>Xem Top 100 VĐV Toàn Quốc</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* WIDGET 3: GUARANTEE & FAIRPLAY TRUST BADGES */}
              <div className="p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white text-sm font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Bảo Chứng Giải Đấu VaoSan</span>
                </div>
                <div className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>100% Trọng tài</strong> có chứng chỉ liên đoàn và kiểm duyệt độc lập trước trận.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Smart Bracket Algorithm:</strong> Bốc thăm minh bạch tự động, chống ghép cặp ưu tiên hạt giống.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Ký quỹ giải thưởng an toàn:</strong> Tiền thưởng được ký gửi ký quỹ ngân hàng, giải ngân trong 24h.</span>
                  </div>
                </div>
                <div className="pt-2">
                  <a href="#" className="text-xs text-slate-900 dark:text-white hover:text-emerald-600 font-bold flex items-center gap-1">
                    <span>Đọc chi tiết Chính Sách FairPlay & Trọng Tài</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Modal Quick Registration */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Đăng Ký Tham Gia Giải Đấu
              </h3>
              <button 
                onClick={() => setShowRegModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              alert('Đăng ký giải đấu thành công! Mã xác nhận đã gửi về ứng dụng Kick-ON.');
              setShowRegModal(false);
            }} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">Họ & Tên Trưởng Đội / VĐV 1</label>
                <input 
                  type="text" 
                  required 
                  defaultValue="Nguyễn Văn An"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">Số Điện Thoại / Zalo Nhận Thông Báo</label>
                <input 
                  type="tel" 
                  required 
                  defaultValue="0908 123 456"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">Tên Đội / Tên Đôi Nam Nữ</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ví dụ: Đội Sài Gòn Smashers"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">Mã DUPR VĐV 1</label>
                  <input 
                    type="text" 
                    defaultValue="DUPR#88219"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold mb-1">Mã DUPR VĐV 2 (Nếu Đôi)</label>
                  <input 
                    type="text" 
                    placeholder="DUPR#..."
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Lệ phí giải đấu:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-bold">600.000đ / Đôi</strong>
                </div>
                <div className="flex justify-between">
                  <span>Phương thức thanh toán:</span>
                  <span className="text-slate-500 dark:text-slate-400">Quét mã VietQR nhận Smart Pass</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-extrabold transition shadow-md"
                >
                  Xác Nhận & Đăng Ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TournamentLeaderboard;
