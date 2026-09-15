import React, { useState } from 'react';
import { 
  Trophy, Award, Flame, Search, Filter, Calendar, MapPin, Users, ChevronRight, 
  PlayCircle, Zap, ArrowUpRight, ShieldCheck, CheckCircle2, UserCheck, PlusCircle,
  Radio, RefreshCw, Star, Info, Share2, Sparkles
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
  const [searchEloQuery, setSearchEloQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedTourneyForReg, setSelectedTourneyForReg] = useState<string | null>(null);

  // Mock Tournaments List
  const tournaments = [
    {
      id: 'tourney-1',
      title: 'VaoSan Pickleball Championship 2025 - Cúp Mùa Thu Mở Rộng',
      sport: 'pickleball',
      prize: '35.000.000đ',
      date: '26/10 - 27/10/2025',
      location: 'Cụm 8 Sân Pickleball D-Sports, Q.7, TP.HCM',
      level: 'DUPR 3.0 - 4.5 Mở Rộng',
      registered: 28,
      maxSlots: 32,
      fee: '600.000đ / Đôi',
      badge: 'Giải Nổi Bật',
      badgeColor: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
      isHot: true,
      image: 'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=800&q=80',
      organizer: 'VaoSan & D-Sports Academy',
      features: ['Trọng tài VPA', 'Live AI Camera', 'Cấp chứng nhận DUPR']
    },
    {
      id: 'tourney-2',
      title: 'Giải Bóng Đá 7 Người Các CLB Nam Sài Gòn 2025',
      sport: 'football',
      prize: '50.000.000đ',
      date: '02/11 - 15/11/2025',
      location: 'Sân SVĐ Kick-ON Tân Thuận, Q.7',
      level: 'Phong Trào Hạng A & B',
      registered: 14,
      maxSlots: 16,
      fee: '2.500.000đ / Đội',
      badge: 'Giải Đấu Lớn',
      badgeColor: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      isHot: true,
      image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
      organizer: 'Kick-ON Football League',
      features: ['VAR AI Hỗ Trợ', 'Livestream Full HD', 'Bảo hiểm chấn thương']
    },
    {
      id: 'tourney-3',
      title: 'Khơi Nguồn Đam Mê - Pickleball Đôi Nam Nữ Rookie 2025',
      sport: 'pickleball',
      prize: '15.000.000đ',
      date: '18/10/2025 (Chủ Nhật)',
      location: 'VaoSan PB Club - Bình Thạnh',
      level: 'DUPR < 3.25 (Rookie)',
      registered: 24,
      maxSlots: 24,
      fee: '400.000đ / Đôi',
      badge: 'Đã Đầy Đội',
      badgeColor: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
      isHot: false,
      image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
      organizer: 'Bình Thạnh PB Community',
      features: ['Bóng thi đấu Franklin X-40', 'Hệ thống tính điểm tự động']
    },
    {
      id: 'tourney-4',
      title: 'Giải Cầu Lông Đôi Nam Nữ Thường Niên TP. Thủ Đức',
      sport: 'badminton',
      prize: '20.000.000đ',
      date: '05/11 - 06/11/2025',
      location: 'Cụm Sân Cầu Lông ProBad Thủ Đức',
      level: 'Hạng B & C',
      registered: 18,
      maxSlots: 32,
      fee: '500.000đ / Đôi',
      badge: 'Mở Đăng Ký',
      badgeColor: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      isHot: false,
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      organizer: 'Thủ Đức Badminton Hub',
      features: ['Thảm thi đấu tiêu chuẩn BWF', 'Quà tặng tài trợ']
    }
  ];

  // Top Players / Rankings Mock Data
  const topPlayers = [
    { rank: 1, name: 'Trần Minh Khang', sport: 'Pickleball', rating: 'DUPR 4.62', matches: 84, winRate: '82%', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', club: 'D-Sports Pro' },
    { rank: 2, name: 'Lê Tuấn Anh', sport: 'Pickleball', rating: 'DUPR 4.45', matches: 62, winRate: '78%', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', club: 'Saigon Smashers' },
    { rank: 3, name: 'FC Tân Thuận Star', sport: 'Bóng Đá 7 Người', rating: 'Elo 1,840', matches: 45, winRate: '85%', avatar: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=150&q=80', club: 'Q.7 Super League' },
    { rank: 4, name: 'Nguyễn Hoàng Nam', sport: 'Tennis', rating: 'Elo 1,650', matches: 38, winRate: '73%', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', club: 'Phú Mỹ Hưng Tennis Club' },
    { rank: 5, name: 'Vũ Quốc Hùng', sport: 'Cầu Lông', rating: 'Elo 1,580', matches: 50, winRate: '70%', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80', club: 'Thủ Đức Badminton Pro' }
  ];

  // Live Matches Mock
  const liveMatches = [
    {
      id: 'm1',
      tournament: 'VaoSan Pickleball Championship 2025',
      stage: 'Bán Kết 1 - Đôi Nam DUPR 4.0+',
      court: 'Sân PB-01 (HD Live stream)',
      teamA: 'Minh Khang / Tuấn Lê',
      scoreA: [11, 9, 10],
      teamB: 'Hoàng Nam / Đức Anh',
      scoreB: [8, 11, 8],
      status: 'Match Point (Set 3)',
      isLive: true
    },
    {
      id: 'm2',
      tournament: 'Giải Bóng Đá 7 Người Nam Sài Gòn',
      stage: 'Vòng Bảng - Bảng A',
      court: 'Sân SVĐ Kick-ON 1',
      teamA: 'FC Tân Thuận Star',
      scoreA: [2],
      teamB: 'FC Rồng Vàng Q.4',
      scoreB: [1],
      status: 'Phút 58 / Hiệp 2',
      isLive: true
    }
  ];

  const filteredTournaments = tournaments.filter(t => {
    if (activeSport !== 'all' && t.sport !== activeSport) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d131f] text-slate-900 dark:text-slate-100 font-sans pb-16 transition-colors duration-300">
      {/* Top Ticker Bar */}
      <div className="bg-emerald-500/10 dark:bg-emerald-950/60 border-b border-emerald-500/20 px-4 py-2 text-xs flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-3 whitespace-nowrap">
          <span className="flex items-center text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 animate-pulse">
            <Radio className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" /> LIVE STREAM
          </span>
          <span className="text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">LIVE 14:35:</strong> BK1 Pickleball Sân PB-01: Minh Khang / Tuấn Lê chuẩn bị Match Point!
          </span>
        </div>
        <div className="flex items-center space-x-4 text-slate-500 dark:text-slate-400 text-xs">
          <span>Hệ Thống Xếp Hạng DUPR & Elo Độc Quyền Kick-ON</span>
          <span className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center font-semibold">
            Tra cứu Elo cá nhân <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Page Title & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer font-medium" onClick={onBackToHome}>Trang chủ</span>
              <span>/</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Giải Đấu & Bảng Xếp Hạng</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500 dark:text-amber-400 shrink-0" />
              Giải Đấu & Bảng Xếp Hạng Đa Môn
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                Official VaoSan League
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const eloSection = document.getElementById('search-elo-section');
                eloSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Tra Cứu DUPR / Elo
            </button>
            <button 
              onClick={() => setShowRegModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-600 text-white dark:text-slate-950 font-extrabold text-sm shadow-md transition flex items-center gap-2 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Tạo Giải Đấu / Đăng Ký
            </button>
          </div>
        </div>

        {/* Sports Switcher Ribbon */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 mb-6">
          <button
            onClick={() => setActiveSport('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-2 ${
              activeSport === 'all'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Tất Cả Môn <span className="text-xs opacity-75">(48)</span>
          </button>
          <button
            onClick={() => setActiveSport('pickleball')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-2 ${
              activeSport === 'pickleball'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            🏓 Pickleball <span className="text-xs opacity-75">(18 giải)</span>
          </button>
          <button
            onClick={() => setActiveSport('football')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-2 ${
              activeSport === 'football'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            ⚽ Bóng Đá 7 Người <span className="text-xs opacity-75">(16)</span>
          </button>
          <button
            onClick={() => setActiveSport('badminton')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-2 ${
              activeSport === 'badminton'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            🏸 Cầu Lông <span className="text-xs opacity-75">(10)</span>
          </button>
          <button
            onClick={() => setActiveSport('tennis')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-2 ${
              activeSport === 'tennis'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            🎾 Tennis <span className="text-xs opacity-75">(4)</span>
          </button>
        </div>

        {/* Featured Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 border border-slate-800 dark:border-emerald-500/30 p-6 md:p-8 mb-8 shadow-xl text-white">
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Giải Nổi Bật Đang Mở Đăng Ký
                </span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-red-400 animate-ping" /> AI Live Camera Included
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                VaoSan Pickleball Championship 2025
                <span className="block text-emerald-400 text-xl sm:text-2xl font-semibold mt-1">Cúp Mùa Thu Mở Rộng - Tổng Giải Thưởng 35.000.000đ</span>
              </h2>

              <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-slate-300 pt-1">
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>26/10 - 27/10/2025</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Cụm 8 Sân USAPA D-Sports, Q.7</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Hệ DUPR 3.0 - 4.5 Mở Rộng</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Tiến độ đăng ký đội: <strong className="text-emerald-400">28 / 32 Đội (88% slot)</strong></span>
                  <span className="text-amber-400">Chỉ còn 4 suất cuối!</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                  <div className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full w-[88%]"></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 bg-slate-900/90 backdrop-blur-md rounded-xl p-5 border border-slate-700 space-y-4">
              <div className="text-center border-b border-slate-800 pb-3">
                <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">Lệ phí đăng ký đôi</span>
                <span className="text-2xl font-black text-emerald-400">600.000đ <span className="text-xs font-normal text-slate-400">/ Đôi</span></span>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Đơn vị tổ chức:</span>
                  <span className="font-semibold text-white">VaoSan & D-Sports</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Trọng tài chính:</span>
                  <span className="font-semibold text-emerald-400">Chứng nhận VPA</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tích điểm BXH:</span>
                  <span className="font-semibold text-amber-400">+120 Elo / +0.15 DUPR</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedTourneyForReg('tourney-1');
                  setShowRegModal(true);
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition shadow-md flex items-center justify-center gap-2"
              >
                Giữ Suất Thi Đấu Ngay <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Nav Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                activeTab === 'open' 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Giải Đấu Đang Mở Đăng Ký (18)
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 ${
                activeTab === 'live' 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" /> Kết Quả Live (8)
            </button>
            <button
              onClick={() => setActiveTab('bracket')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                activeTab === 'bracket' 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Nhánh Bảng Đấu (Bracket)
            </button>
            <button
              onClick={() => setActiveTab('rankings')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                activeTab === 'rankings' 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              BXH Elo & DUPR
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg shadow-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Trình độ:</span>
              <select 
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-900">Tất cả trình độ</option>
                <option value="dupr3" className="bg-white dark:bg-slate-900">DUPR 3.0 - 3.5</option>
                <option value="dupr4" className="bg-white dark:bg-slate-900">DUPR 4.0+</option>
                <option value="elo1200" className="bg-white dark:bg-slate-900">Elo 1,200+</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Khu vực:</span>
              <select 
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-900">Tất cả khu vực</option>
                <option value="q7" className="bg-white dark:bg-slate-900">Quận 7, TP.HCM</option>
                <option value="binhthanh" className="bg-white dark:bg-slate-900">Bình Thạnh</option>
                <option value="thuduc" className="bg-white dark:bg-slate-900">TP. Thủ Đức</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Dual-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (70%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Bracket Simulation Preview */}
            {(activeTab === 'live' || activeTab === 'bracket') && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-emerald-500/30 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Cập Nhật Trận Đấu Trực Tiếp</h3>
                  </div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30 font-semibold">
                    Sân PB-01 & PB-02
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveMatches.map(match => (
                    <div key={match.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between mb-2">
                        <span className="truncate">{match.stage}</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">{match.status}</span>
                      </div>
                      
                      <div className="space-y-2 py-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" /> {match.teamA}
                          </span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            {match.scoreA.join(' - ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" /> {match.teamB}
                          </span>
                          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            {match.scoreB.join(' - ')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>📍 {match.court}</span>
                        <button className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">
                          <PlayCircle className="w-3.5 h-3.5" /> Xem AI Stream
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tournaments Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                  Danh Sách Giải Đấu Mở Đăng Ký
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Hiển thị {filteredTournaments.length} giải đấu phù hợp</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredTournaments.map((t) => (
                  <div 
                    key={t.id} 
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition overflow-hidden group flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      {/* Image Header */}
                      <div className="relative h-44 overflow-hidden">
                        <img 
                          src={t.image} 
                          alt={t.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                        
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${t.badgeColor}`}>
                            {t.badge}
                          </span>
                        </div>

                        <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-xs text-amber-400 font-extrabold">
                          Giải Thưởng: {t.prize}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition line-clamp-2">
                          {t.title}
                        </h4>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span>{t.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span className="truncate">{t.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                            <span>Trình độ: <strong className="text-slate-900 dark:text-white">{t.level}</strong></span>
                          </div>
                        </div>

                        {/* Features Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {t.features.map((feat, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-medium">
                              ✓ {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer Progress & Action */}
                    <div className="p-4 pt-0 space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Số lượng đăng ký</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t.registered}/{t.maxSlots} đội</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full" 
                            style={{ width: `${(t.registered / t.maxSlots) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Lệ phí</span>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">{t.fee}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedTourneyForReg(t.id);
                            setShowRegModal(true);
                          }}
                          className="px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1 active:scale-95"
                        >
                          Đăng Ký Ngay <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (30%) */}
          <div className="space-y-6">
            {/* Personal Elo / DUPR Lookup Card */}
            <div id="search-elo-section" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Tra Cứu DUPR & Elo Cá Nhân
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold">Live Data</span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text" 
                  placeholder="Nhập tên VĐV, Mã DUPR hoặc SĐT..."
                  value={searchEloQuery}
                  onChange={(e) => setSearchEloQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              {/* Sample User Elo Card */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
                    alt="Nguyễn Văn An"
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Nguyễn Văn An</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">CLB Pickleball Q.7 • DUPR ID: #88219</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-slate-200 dark:border-slate-900">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Chỉ số DUPR</span>
                    <span className="text-base font-extrabold text-amber-500 dark:text-amber-400">3.85 ⭐</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Xếp Hạng Elo</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">1,420 p.t</span>
                  </div>
                </div>

                <button className="w-full py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-emerald-700 dark:text-emerald-400 font-bold border border-slate-200 dark:border-slate-800 transition flex items-center justify-center gap-1">
                  Xem Lịch Sử Thi Đấu & Hồ Sơ <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Global Leaderboard Widget */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                  Bảng Xếp Hạng Top VĐV
                </h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer">Xem tất cả</span>
              </div>

              <div className="space-y-3">
                {topPlayers.map((player) => (
                  <div key={player.rank} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex items-center space-x-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        player.rank === 1 ? 'bg-amber-400 text-slate-950' :
                        player.rank === 2 ? 'bg-slate-300 text-slate-950' :
                        player.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {player.rank}
                      </span>
                      <img 
                        src={player.avatar} 
                        alt={player.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{player.name}</h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{player.sport} • {player.club}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 block">{player.rating}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{player.winRate} Thắng</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Organizers & Sponsors */}
            <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-bold">Đơn Vị Đồng Hành & Bảo Trợ</span>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded bg-white dark:bg-slate-900">VPA Official</span>
                <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded bg-white dark:bg-slate-900">Kick-ON IoT</span>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded bg-white dark:bg-slate-900">D-Sports</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Quick Registration */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
