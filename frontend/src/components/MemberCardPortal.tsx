import React, { useState } from "react";
import {
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
    <div className="w-full py-4 sm:py-6 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xs border border-slate-300 p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0b4f6c] text-white flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Thẻ Hội Viên Turfzone
              </h1>
              <p className="text-[13px] text-slate-600">
                Mã VĐV dùng để check-in sân và tham gia giải đấu
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Đã kích hoạt
          </span>
        </div>

        {/* Digital Pass Card */}
        <div className="w-full bg-[#0f172a] rounded-lg p-5 text-white border border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-8 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono text-[13px] font-bold border border-sky-400/30">
                  {memberId}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[13px] font-bold">
                  {userLevel}
                </span>
              </div>

              <div>
                <p className="text-[13px] text-slate-400">Vận động viên</p>
                <p className="text-lg sm:text-xl font-bold text-white">{userName}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-300 pt-1">
                <span>Sân 5 · Sân 7 · Sân 11 · Futsal</span>
                <span>•</span>
                <span>{user?.area || "Đà Nẵng"}</span>
              </div>
            </div>

            <div className="sm:col-span-4 flex sm:justify-end">
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col items-center hover:bg-slate-50 transition-colors cursor-pointer"
                title="Bấm để sao chép mã VĐV"
              >
                <QrCode className="w-16 h-16 text-slate-900" />
                <span className="font-mono text-[13px] text-slate-800 font-bold mt-1">
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
            className="p-3.5 bg-slate-50 hover:bg-sky-50 rounded-lg border border-slate-300 flex items-center gap-3 text-left transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-md bg-[#0b4f6c]/10 text-[#0b4f6c] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-slate-900">Đặt Sân Ngay</p>
              <p className="text-[13px] text-slate-600">Chọn ca trống & cọc VietQR</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.("matchmaking")}
            className="p-3.5 bg-slate-50 hover:bg-amber-50 rounded-lg border border-slate-300 flex items-center gap-3 text-left transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-slate-900">Chợ Kèo Giao Hữu</p>
              <p className="text-[13px] text-slate-600">Tìm đối thủ cùng trình độ</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {onBackToHome && (
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={onBackToHome}
              className="px-3.5 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
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
