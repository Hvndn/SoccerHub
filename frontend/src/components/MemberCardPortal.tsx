import React, { useState } from "react";
import {
  Award,
  Trophy,
  ShieldCheck,
  QrCode,
  Calendar,
  Users,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface MemberCardPortalProps {
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
  user?: any;
}

export const MemberCardPortal: React.FC<MemberCardPortalProps> = ({
  onBackToHome,
  onNavigateTab,
  user,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const userName = user?.fullName || user?.name || "Khách chưa đăng nhập";
  const userLevel = user?.level ?? "Phong trào";
  const memberId = user?.id ? `#SH-${user.id}` : "#SH-—";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(memberId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full py-4 sm:py-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 p-5 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0369a1] text-white flex items-center justify-center shadow-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Thẻ Hội Viên Turfzone
              </h1>
              <p className="text-[14px] text-slate-500">
                Mã VĐV dùng để check-in sân và tham gia giải đấu
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[14px] font-black flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Đã kích hoạt
          </span>
        </div>

        {/* Digital Pass Card */}
        <div className="w-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center relative z-10">
            <div className="sm:col-span-8 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[14px] font-bold border border-sky-400/30">
                  {memberId}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[14px] font-bold">
                  {userLevel}
                </span>
              </div>

              <div>
                <p className="text-[14px] text-slate-400">Vận động viên</p>
                <p className="text-xl sm:text-2xl font-black text-white">{userName}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-300 pt-1">
                <span>⚽ Sân 5 · 7 · 11 · Futsal</span>
                <span>•</span>
                <span>📍 {user?.area || "Đà Nẵng"}</span>
              </div>
            </div>

            <div className="sm:col-span-4 flex sm:justify-end">
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-3 bg-white rounded-2xl shadow-md flex flex-col items-center hover:scale-105 transition-transform"
                title="Bấm để sao chép mã VĐV"
              >
                <QrCode className="w-16 h-16 text-slate-900" />
                <span className="font-mono text-[13px] text-slate-800 font-black mt-1">
                  {copiedCode ? "Đã chép mã!" : "Sao chép mã"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab?.("booking")}
            className="p-4 bg-slate-50 hover:bg-sky-50 rounded-2xl border border-slate-200 flex items-center gap-3 text-left transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-slate-900">Đặt Sân Ngay</p>
              <p className="text-[14px] text-slate-500">Chọn ca trống & cọc VietQR</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.("matchmaking")}
            className="p-4 bg-slate-50 hover:bg-amber-50 rounded-2xl border border-slate-200 flex items-center gap-3 text-left transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-slate-900">Chợ Kèo Giao Hữu</p>
              <p className="text-[14px] text-slate-500">Tìm đối thủ cùng trình độ</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {onBackToHome && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onBackToHome}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-[14px] font-bold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberCardPortal;
