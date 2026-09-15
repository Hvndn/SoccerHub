import React, { useState } from 'react';
import { 
  Award, Trophy, ShieldCheck, CheckCircle2, Ticket, Sparkles, QrCode, 
  Calendar, Users, ArrowRight, ArrowLeft, Lock, Zap, Activity, Check, RefreshCw
} from 'lucide-react';

interface MemberCardPortalProps {
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
  user?: any;
}

export const MemberCardPortal: React.FC<MemberCardPortalProps> = ({
  onBackToHome,
  onNavigateTab,
  user
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const userName = user?.name || "Nguyễn Văn An";
  const userElo = user?.eloRating || 1200;

  const handleCopyCode = () => {
    navigator.clipboard.writeText("#VS-20259");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full min-h-[calc(100vh-120px)] bg-[#f8f9ff] dark:bg-[#0b1c30] text-[#0b1c30] dark:text-[#f8f9ff] font-sans flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      
      {/* Outer Card Container (Matching Stitch 100%) */}
      <div className="w-full max-w-[1240px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[720px]">
          
          {/* CỘT TRÁI (Slate / Emerald Stadium Lighting - 5 Cols) */}
          <div className="lg:col-span-5 bg-[#213145] dark:bg-[#0f172a] text-white p-6 sm:p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
            {/* Stadium Floodlight Glow Effects */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-10 right-0 w-64 h-64 bg-lime-400/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Left Header & Tagline */}
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-400 font-extrabold bg-slate-900/80 border border-emerald-500/30 px-3 py-1 rounded-full">
                  VAOSAN 4.0
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400"></span>
                <span className="text-[11px] tracking-wide text-slate-300 font-bold uppercase">
                  HỆ SINH THÁI THỂ THAO ĐA MÔN
                </span>
              </div>

              {/* Achievement Badge */}
              <div className="relative inline-block my-2">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-lg shadow-emerald-600/30 flex items-center justify-center">
                  <div className="w-full h-full bg-[#213145] rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/10"></div>
                    <Trophy className="w-10 h-10 text-lime-400" />
                  </div>
                </div>
                <span className="absolute -bottom-2 -right-2 bg-lime-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-slate-900">
                  <ShieldCheck className="w-3 h-3" /> READY
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  Tuyệt Vời,<br />
                  <span className="text-emerald-400">Hồ Sơ Đã Sẵn Sàng!</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                  Chúc mừng bạn đã gia nhập cộng đồng hơn 68.000 vận động viên phong trào và bán chuyên trên toàn quốc.
                </p>
              </div>

              {/* Activated Privileges List */}
              <div className="space-y-3 pt-2">
                <div className="bg-slate-900/60 p-3 rounded-xl flex items-start gap-3 border border-slate-700/60 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">Đã cộng voucher 50.000đ</p>
                    <p className="text-[11px] text-slate-300">Sẵn sàng áp dụng cho ca đặt sân đầu tiên</p>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl flex items-start gap-3 border border-slate-700/60 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-lg bg-lime-400/20 text-lime-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">Mã thẻ VĐV: #VS-20259</p>
                    <p className="text-[11px] text-slate-300">Định danh tích điểm, hạng bậc & check-in tự động</p>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl flex items-start gap-3 border border-slate-700/60 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">Xác thực trình độ tự động</p>
                    <p className="text-[11px] text-slate-300">Khởi tạo DUPR 3.0 / Football Elo 1,200 chuẩn xác</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Footer: Multi-Sport Sync */}
            <div className="relative z-10 pt-6 mt-4 border-t border-slate-700/60">
              <div className="flex items-center justify-between text-slate-300 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Hệ thống tích hợp 4 bộ môn</span>
                <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
                  <span className="font-mono text-[10px] text-lime-400 font-bold tracking-wide">LIVE SYNC</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-white font-semibold">
                <span className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700">⚽ Bóng Đá</span>
                <span className="text-slate-500">•</span>
                <span className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700">🏓 Pickleball</span>
                <span className="text-slate-500">•</span>
                <span className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700">🏸 Cầu Lông</span>
                <span className="text-slate-500">•</span>
                <span className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700">🎾 Tennis</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (Nền Trắng Sáng - Hoàn Tất & Kích Hoạt - 7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Stepper & Title */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                    HOÀN TẤT THIẾT LẬP
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-extrabold flex items-center gap-1 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bước 3/3
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="w-6 h-1.5 rounded-full bg-emerald-600"></span>
                  <span className="w-6 h-1.5 rounded-full bg-emerald-600"></span>
                  <span className="w-6 h-1.5 rounded-full bg-emerald-600"></span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Thẻ Hội Viên Điện Tử Của Bạn
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Hệ thống đã tạo sẵn thẻ định danh và quét 12 cụm sân thể thao gần bạn có ca trống tối nay.
                </p>
              </div>

              {/* DIGITAL ATHLETE PASS (Thẻ Member Card) */}
              <div className="w-full bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
                {/* Decorative Field Blueprint Lines */}
                <div className="absolute right-0 bottom-0 w-48 h-48 opacity-10 pointer-events-none">
                  <svg className="w-full h-full fill-none stroke-white" strokeWidth="2" viewBox="0 0 100 100">
                    <rect x="10" y="10" width="80" height="80" rx="4"></rect>
                    <line x1="50" y1="10" x2="50" y2="90"></line>
                    <circle cx="50" cy="50" r="16"></circle>
                  </svg>
                </div>

                {/* Header Thẻ */}
                <div className="flex items-center justify-between relative z-10 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold tracking-tight text-white">VaoSan SPORTS PASS</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Universal Athlete ID</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-lime-400/20 text-lime-400 font-mono text-xs font-black border border-lime-400/30">
                    TIER: PRO-AM
                  </span>
                </div>

                {/* Body Thẻ: User Info + Rating + QR Code */}
                <div className="grid grid-cols-12 gap-3 items-center relative z-10 my-4">
                  <div className="col-span-8 space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Họ và Tên Vận Động Viên</span>
                      <div className="flex items-center gap-2">
                        <p className="text-lg sm:text-xl font-extrabold text-white">{userName}</p>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">Phong Trào</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-medium">Môn thi đấu</span>
                        <span className="text-xs font-bold text-emerald-400">Pickleball & Bóng Đá</span>
                      </div>
                      <div className="w-px h-6 bg-slate-800"></div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-medium">Chỉ số xếp hạng</span>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                          <span className="text-lime-400">DUPR 3.0</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-white">Elo {userElo}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Check-in Box */}
                  <div className="col-span-4 flex flex-col items-end">
                    <div 
                      onClick={handleCopyCode}
                      className="p-2 bg-white rounded-xl shadow-md flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                      title="Bấm để sao chép mã VĐV"
                    >
                      <QrCode className="w-14 h-14 text-slate-900" />
                      <span className="font-mono text-[9px] text-slate-700 font-black mt-1 uppercase">
                        {copiedCode ? "ĐÃ CHÉP MÃ!" : "CHECK-IN CA"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Thẻ */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between relative z-10 text-[11px]">
                  <span className="font-mono text-slate-400 tracking-wider">#VS-20259-VN • HO CHI MINH CITY</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> ĐÃ KÍCH HOẠT THÀNH CÔNG
                  </span>
                </div>
              </div>

              {/* Quick Action Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => onNavigateTab && onNavigateTab('booking')}
                  className="text-left p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition truncate">Đặt sân gần bạn ngay</p>
                      <span className="text-[10px] text-lime-800 dark:text-lime-400 font-extrabold bg-lime-400/20 px-1.5 py-0.5 rounded">-50K</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">Ca đẹp từ 18:30 - 21:00 tối nay</p>
                  </div>
                </button>

                <button 
                  onClick={() => onNavigateTab && onNavigateTab('community')}
                  className="text-left p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition truncate">Chợ Kèo Khẩn Cấp</p>
                      <span className="text-[10px] text-rose-600 font-extrabold bg-rose-500/10 px-1.5 py-0.5 rounded">8 KÈO</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">Đang thiếu 1-2 chân tối nay</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button 
                  onClick={() => onNavigateTab ? onNavigateTab('booking') : onBackToHome && onBackToHome()}
                  className="w-full sm:flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                >
                  <span>Vào Bảng Điều Khiển / Khám Phá Sân Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={onBackToHome}
                  className="w-full sm:w-auto px-4 h-12 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <p>Thẻ hội viên đã được đồng bộ tự động với tài khoản và ví thể thao của bạn.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MemberCardPortal;
