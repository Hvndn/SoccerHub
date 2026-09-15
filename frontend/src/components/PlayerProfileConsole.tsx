"use client";

import React, { useState } from "react";
import {
  User,
  ShieldCheck,
  Trophy,
  Award,
  Zap,
  Activity,
  Heart,
  Flame,
  Star,
  Share2,
  Edit,
  Swords,
  Video,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Filter,
  Sparkles,
  RefreshCw,
  Dumbbell,
  Check
} from "lucide-react";

interface PlayerProfileConsoleProps {
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function PlayerProfileConsole({
  onBackToHome,
  onNavigateTab
}: PlayerProfileConsoleProps) {
  // Active Sport Tab State
  const [activeSport, setActiveSport] = useState<"pickleball" | "football" | "badminton" | "tennis">("pickleball");
  
  // History Filter State
  const [historyFilter, setHistoryFilter] = useState<"all" | "win" | "loss" | "ai_video">("all");

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* ATHLETE PROFILE HERO BANNER */}
      <section className="relative w-full rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Dynamic Athletic Mesh Cover Graphic */}
        <div className="relative h-48 sm:h-64 lg:h-72 w-full bg-gradient-to-r from-slate-900 via-slate-950 to-[#0b4f6c] overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500 via-sky-500 to-transparent" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Geometric Court Linework */}
          <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none" viewBox="0 0 1200 300">
            <line stroke="white" strokeDasharray="10 10" strokeWidth="2" x1="0" x2="1200" y1="150" y2="150" />
            <line stroke="white" strokeWidth="2" x1="300" x2="300" y1="0" y2="300" />
            <line stroke="white" strokeWidth="2" x1="900" x2="900" y1="0" y2="300" />
            <circle cx="600" cy="150" fill="none" r="90" stroke="white" strokeWidth="2" />
          </svg>

          {/* Monogram Watermark */}
          <div className="absolute right-8 bottom-4 text-white/10 text-6xl font-black select-none pointer-events-none tracking-tighter">
            VS•PRO ATHLETE
          </div>
        </div>

        {/* Athlete Identity Bar */}
        <div className="px-6 sm:px-10 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            
            {/* Avatar + Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl p-1 bg-white dark:bg-slate-900 shadow-2xl shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"
                  alt="Nguyễn Văn An Avatar"
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-full shadow-lg border-2 border-white dark:border-slate-900" title="Đã xác thực danh tính VĐV">
                  <ShieldCheck className="w-5 h-5 fill-emerald-400 stroke-slate-950" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    Nguyễn Văn An
                  </h1>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1 border border-amber-500/30">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> Gold Member
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">
                    #VS-8899
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="font-bold text-slate-800 dark:text-slate-200">@An_Flash98</span>
                  <span>•</span>
                  <span>26 tuổi</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> TP. Hồ Chí Minh (Q.7, Nhà Bè)
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-medium pt-1">
                  Đam mê Pickleball & Bóng đá 7 người. Đánh cọ xát giao lưu cuối tuần và giải phong trào. Tinh thần FairPlay 100%.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => alert("Đã mở modal Chỉnh sửa thông tin Vận động viên!")}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center space-x-2 active:scale-95"
              >
                <Edit className="w-4 h-4 text-sky-500" />
                <span>Chỉnh Sửa Hồ Sơ</span>
              </button>

              <button
                onClick={() => alert("Đã sao chép liên kết trang cá nhân VaoSan!")}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all active:scale-95"
                title="Chia sẻ trang cá nhân"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => alert("Đã gửi lời mời Thách đấu / Ghép kèo thành công!")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 active:scale-95"
              >
                <Swords className="w-4 h-4" />
                <span>Mời Ghép Đội / Thách Đấu</span>
              </button>
            </div>

          </div>

          {/* Quick Stats Ribbon (Bento Strip) */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Stat 1 */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Trận Đã Đấu</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">48</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Thắng 33</span>
                <span className="text-xs font-bold text-rose-500">Bại 15</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden flex">
                <div className="bg-emerald-500 h-full" style={{ width: "68.8%" }} />
                <div className="bg-rose-500 h-full" style={{ width: "31.2%" }} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">Tỉ lệ thắng: <strong className="text-slate-900 dark:text-white">68.8%</strong></span>
            </div>

            {/* Stat 2 */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Chuỗi Phong Độ</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">5 Trận</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">Hot Streak</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {["W", "W", "W", "W", "W"].map((res, i) => (
                  <span key={i} className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                    {res}
                  </span>
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">Chưa bị ngắt quãng</span>
            </div>

            {/* Stat 3 */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Chỉ Số FairPlay</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">5.0</span>
                <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
                <span className="ml-auto text-emerald-600 dark:text-emerald-400 text-xs font-bold">Tuyệt Đối</span>
              </div>
              <div className="flex items-center text-amber-400 gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">100% đánh đúng giờ, tôn trọng luật</span>
            </div>

            {/* Stat 4 */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Bộ Sưu Tập Giải Đấu</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-500 font-mono">02</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Cúp Vô Địch</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs font-bold">
                <span className="flex items-center gap-1 text-amber-500">
                  <Trophy className="w-4 h-4" /> 2 Mini Cup
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-sky-500">
                  <Award className="w-4 h-4" /> 4 Huy Chương
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">Cập nhật hệ thống VaoSan Pro</span>
            </div>
          </div>
        </div>
      </section>

      {/* TWO COLUMN GRID: LEFT 8 COLS (STATS & MATCHES) + RIGHT 4 COLS (HEALTH & EQUIPMENT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 8 COLS */}
        <div className="lg:col-span-8 space-y-8">

          {/* 1. MULTI-SPORT RATING & PERFORMANCE METRICS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Đánh Giá Năng Lực & Chỉ Số Kỹ Năng
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Hệ thống phân hạng tự động qua thuật toán DUPR & Elo VaoSan 4.0
                </p>
              </div>

              {/* Sport Switcher Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {[
                  { id: "pickleball", label: "Pickleball" },
                  { id: "football", label: "Bóng Đá 7" },
                  { id: "badminton", label: "Cầu Lông" },
                  { id: "tennis", label: "Tennis" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSport(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      activeSport === tab.id
                        ? "bg-white dark:bg-slate-900 text-[#0b4f6c] dark:text-sky-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Sport Scorecards (Pickleball & Football) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Pickleball DUPR Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center text-sm border border-emerald-500/30">
                      PB
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Official DUPR</span>
                      <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">3.05</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                      Top 15% Active
                    </span>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">#142 Quận 7</p>
                  </div>
                </div>

                {/* DUPR Sparkline Chart */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">Tăng trưởng 6 tháng:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> 2.65 → 3.05 (+0.40)
                    </span>
                  </div>
                  
                  {/* Inline Sparkline SVG */}
                  <div className="w-full h-14 relative">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 320 60">
                      <polygon fill="rgba(16, 185, 129, 0.15)" points="0,55 0,48 55,42 110,40 165,32 220,22 320,8 320,55" />
                      <polyline fill="none" points="0,48 55,42 110,40 165,32 220,22 320,8" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                      <circle cx="0" cy="48" fill="#10b981" r="3" />
                      <circle cx="165" cy="32" fill="#10b981" r="3" />
                      <circle cx="320" cy="8" fill="#84cc16" r="4.5" stroke="#10b981" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                    <span>Thg 5</span>
                    <span>Thg 7</span>
                    <span>Thg 9</span>
                    <span className="text-emerald-500">Hiện tại</span>
                  </div>
                </div>
              </div>

              {/* Football 7 Elo Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 font-black flex items-center justify-center text-sm border border-sky-500/30">
                      F7
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Elo Phủi Sài Gòn</span>
                      <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">1,215</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase border border-sky-500/30">
                      Division 2
                    </span>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Serie B Open</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Vị trí sở trường:</span>
                    <span className="font-bold text-slate-900 dark:text-white">Tiền vệ trung tâm (CM)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Số trận giải phủi:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">19 trận (11 bàn, 8 kiến tạo)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Thẻ phạt nhận:</span>
                    <span className="font-bold text-amber-500">0 Thẻ Đỏ • 1 Thẻ Vàng</span>
                  </div>
                </div>
              </div>

            </div>

            {/* RADAR SKILL MATRIX & PROGRESS BARS */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8">
              
              {/* Radar Chart SVG */}
              <div className="w-full md:w-5/12 flex flex-col items-center justify-center">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                  Biểu Đồ Kỹ Năng Toàn Diện
                </span>
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200">
                    <polygon fill="none" opacity="0.4" points="100,20 180,68 152,160 48,160 20,68" stroke="#94a3b8" strokeWidth="0.8" />
                    <polygon fill="none" opacity="0.4" points="100,45 155,79 135,145 65,145 45,79" stroke="#94a3b8" strokeWidth="0.8" />
                    <polygon fill="none" opacity="0.4" points="100,70 130,90 118,130 82,130 70,90" stroke="#94a3b8" strokeWidth="0.8" />
                    <polygon fill="rgba(16, 185, 129, 0.25)" points="100,34 159,80 141,156 64,148 31,77" stroke="#10b981" strokeWidth="2.5" />
                    <circle cx="100" cy="34" fill="#84cc16" r="3.5" stroke="#10b981" strokeWidth="1.5" />
                    <circle cx="159" cy="80" fill="#84cc16" r="3.5" stroke="#10b981" strokeWidth="1.5" />
                    <circle cx="141" cy="156" fill="#84cc16" r="3.5" stroke="#10b981" strokeWidth="1.5" />
                    <circle cx="64" cy="148" fill="#84cc16" r="3.5" stroke="#10b981" strokeWidth="1.5" />
                    <circle cx="31" cy="77" fill="#84cc16" r="3.5" stroke="#10b981" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="w-full md:w-7/12 space-y-3 text-xs font-medium">
                {[
                  { name: "Kỹ năng Dinking & Bỏ nhỏ lưới", score: 82, color: "bg-emerald-500" },
                  { name: "Giao bóng & Third Shot Drop", score: 78, color: "bg-emerald-500" },
                  { name: "Tốc độ phản xạ & Thể lực di chuyển", score: 88, color: "bg-emerald-500" },
                  { name: "Đập bóng overhead & Drive cuối sân", score: 75, color: "bg-emerald-500" },
                  { name: "Phối hợp đồng đội & Nhãn quan chiến thuật", score: 90, color: "bg-amber-400", label: "90 / 100 (Xuất sắc)" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>{item.name}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {item.label || `${item.score} / 100`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* 2. RECENT MATCH HISTORY & AI VIDEO HIGHLIGHTS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Lịch Sử Trận Đấu Gần Đây
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Ghi nhận biên bản số điện tử và AI Camera Highlight
                </p>
              </div>

              {/* History Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: "all", label: "Tất cả (48)" },
                  { id: "win", label: "Thắng (33)" },
                  { id: "loss", label: "Thua (15)" },
                  { id: "ai_video", label: "Có Video AI" }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setHistoryFilter(f.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      historyFilter === f.id
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Match Cards List */}
            <div className="space-y-4">
              
              {/* Match 1: PB Win */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                      THẮNG 2 - 1
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Bán Kết Mini Cup • Sân PB-01 D-Sport Oasis Q.7
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500" /> MVP Trận Đấu
                    </span>
                    <span className="font-mono text-xs font-black text-emerald-500">+0.05 DUPR</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-7 flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 font-black flex items-center justify-center text-xs shrink-0">
                        VS
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Nguyễn Văn An / Tuấn Lê</p>
                        <span className="text-[10px] text-slate-400 font-semibold">Seed #1 (DUPR 3.05 + 3.10)</span>
                      </div>
                    </div>
                    <span className="font-mono text-2xl font-black text-emerald-500 px-2">2</span>
                  </div>

                  <div className="md:col-span-5 flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs shrink-0">
                        ĐD
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">Đức Duy / Quang Huy</p>
                        <span className="text-[10px] text-slate-400 font-semibold">Seed #4</span>
                      </div>
                    </div>
                    <span className="font-mono text-2xl font-bold text-slate-400 px-2">1</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-medium border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center space-x-2 font-mono text-slate-500 dark:text-slate-400">
                    <span>Sets:</span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white">11 - 8</span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-400">9 - 11</span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white">11 - 7</span>
                    <span className="text-[11px] text-slate-400 ml-2">42 phút thi đấu</span>
                  </div>

                  <button
                    onClick={() => alert("Đang phát AI Highlight Video 4K 60s...")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all flex items-center space-x-1.5 active:scale-95"
                  >
                    <Video className="w-4 h-4" />
                    <span>Xem Video AI Highlight 4K (60s)</span>
                  </button>
                </div>
              </div>

              {/* Match 2: Football Win */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                      THẮNG 4 - 2
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Bóng đá 7 người • Vòng 5 Sài Gòn Serie B • Sân Nam Sài Gòn
                    </span>
                  </div>
                  <span className="font-mono text-xs font-black text-sky-500">+18 Elo Team</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-7 flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-500 font-black flex items-center justify-center text-xs shrink-0">
                        SW
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">FC Sài Gòn Warriors (Home)</p>
                        <span className="text-[10px] text-slate-400 font-semibold">Nguyễn Văn An đá trọn 60' (#10 CM)</span>
                      </div>
                    </div>
                    <span className="font-mono text-2xl font-black text-sky-500 px-2">4</span>
                  </div>

                  <div className="md:col-span-5 flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs shrink-0">
                        KT
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">FC Anh Em Kiến Trúc</p>
                        <span className="text-[10px] text-slate-400 font-semibold">Hạng 4 BXH Phủi</span>
                      </div>
                    </div>
                    <span className="font-mono text-2xl font-bold text-slate-400 px-2">2</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 3. TROPHY CABINET & BADGES */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Phòng Truyền Thống & Danh Hiệu
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Thành tích thi đấu chính thức và danh hiệu cống hiến phong trào
                </p>
              </div>
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                5 Huy Hiệu Hoạt Động
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { title: "Quán Quân VaoSan Summer Cup 2024", desc: "Vô địch bảng Đôi Nam DUPR < 3.25", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
                { title: "Vô Địch Sài Gòn Phủi Open Serie B", desc: "Cùng FC Sài Gòn Warriors nâng cúp sân 7", icon: Award, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { title: "Chiến Binh Bất Bại", desc: "Đạt chuỗi 5 trận toàn thắng liên tiếp", icon: Flame, color: "text-rose-500", bg: "bg-rose-500/10" },
                { title: "Đại Sứ FairPlay 100%", desc: "Không bao giờ bùng kèo, đúng giờ 35+ trận", icon: ShieldCheck, color: "text-sky-500", bg: "bg-sky-500/10" },
                { title: "Máy Quét Sân Đấu (12 buổi/tháng)", desc: "Duy trì cường độ thể thao 3.2 buổi/tuần", icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10" }
              ].map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-slate-300 transition-all">
                    <div className={`w-10 h-10 rounded-xl ${badge.bg} ${badge.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {badge.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {badge.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT 4 COLS (FITNESS METRICS & UPCOMING MATCHES) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* 1. HEALTH & FITNESS METRICS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 fill-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Dữ Liệu Thể Lực</h3>
                  <span className="text-[10px] font-bold text-slate-400">Sync: Apple Health & Garmin</span>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" title="Đồng bộ 10 phút trước" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Calo Tiêu Hao Tuần</span>
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">3,450</span>
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +12% so tuần trước
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Nhịp Tim Tr.Bình</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">142</span>
                  <span className="text-[10px] font-mono text-slate-400">bpm</span>
                </div>
                <span className="text-[10px] font-bold text-rose-500 block">Max 178 bpm (F7)</span>
              </div>
            </div>

            {/* Distance Metrics */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs font-medium">
              <span className="font-bold text-slate-900 dark:text-white block text-[11px]">
                Quãng Đường Di Chuyển Trung Bình
              </span>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Pickleball / trận</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">4.8 km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Bóng đá sân 7 / trận</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">7.2 km</span>
              </div>
            </div>
          </div>

          {/* 2. UPCOMING MATCHES & BOOKINGS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Lịch Thi Đấu & Đặt Sân Sắp Tới
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>Pickleball Đôi Nam Nữ</span>
                  <span className="text-emerald-500 font-mono text-[11px]">18:00 Hôm Nay</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Sân P-02 D-Sport Oasis Q.7 • Với Tuấn Lê
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>Trận Bóng Đá 7 Người (Serie B)</span>
                  <span className="text-sky-500 font-mono text-[11px]">20:00 Thứ 6</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Sân Nam Sài Gòn • FC Sài Gòn Warriors vs FC Lộc Phát
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
