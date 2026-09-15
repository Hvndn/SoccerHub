"use client";

import React, { useState } from "react";
import {
  User,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Trophy,
  Zap,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Gift,
  QrCode,
  Sparkles,
  X,
  PhoneCall,
  Check,
  Calendar,
  Clock,
  MapPin,
  Flame,
  Award,
  ArrowLeft,
  Activity,
  CheckCheck
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "register";
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export default function AuthModal({
  isOpen,
  initialMode = "login",
  onClose,
  onLoginSuccess
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [role, setRole] = useState<"PLAYER" | "OWNER" | "ORGANIZER">("PLAYER");
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);

  // Onboarding Step State (0: Auth Modal, 1: Step 1 Sport Profile, 2: Step 2 Habits & Slots, 3: Step 3 Card & Finish)
  const [onboardingStep, setOnboardingStep] = useState<number>(0);

  // Onboarding Form States
  const [selectedSport, setSelectedSport] = useState<"football" | "pickleball" | "badminton" | "tennis">("football");
  const [selectedLevel, setSelectedLevel] = useState<string>("Nghiệp dư");
  const [selectedElo, setSelectedElo] = useState<string>("DUPR 3.0 / Elo 1,200");
  const [selectedRegion, setSelectedRegion] = useState<string>("q7");
  const [selectedSlots, setSelectedSlots] = useState<string[]>(["afternoon", "night"]);
  const [selectedDays, setSelectedDays] = useState<string[]>(["sat", "sun"]);
  const [matchMode, setMatchMode] = useState<string>("free");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      const userPayload = {
        name: "Trần Hoàng Long",
        email: identifier || "long_pro10@vaosan.vn",
        role: role,
        position: role === "PLAYER" ? "Cầu Thủ Pro" : role === "OWNER" ? "Chủ Cụm Sân" : "Ban Tổ Chức",
        eloRating: role === "PLAYER" ? 1450 : 1500,
        area: "Quận 7, TP.HCM",
        avatar: "TL"
      };
      onLoginSuccess(userPayload);
      onClose();
    } else {
      // Move to Onboarding Step 1
      setOnboardingStep(1);
    }
  };

  const handleFinalComplete = () => {
    const roleTitles = {
      PLAYER: "Cầu Thủ Pro",
      OWNER: "Chủ Cụm Sân",
      ORGANIZER: "Ban Tổ Chức"
    };

    const sportLabels = {
      football: "Bóng Đá",
      pickleball: "Pickleball",
      badminton: "Cầu Lông",
      tennis: "Tennis"
    };

    const regionLabels: Record<string, string> = {
      q7: "Quận 7 & Nhà Bè, TP.HCM",
      binh_thanh: "Bình Thạnh & Thủ Đức, TP.HCM",
      q2: "Thảo Điền, Quận 2, TP.HCM",
      cau_giay: "Cầu Giấy, Hà Nội"
    };

    const userPayload = {
      name: fullName || "Người Dùng Mới",
      email: identifier || "newuser@vaosan.vn",
      role: role,
      position: roleTitles[role],
      eloRating: selectedSport === "pickleball" ? 1450 : 1300,
      area: regionLabels[selectedRegion] || "Quận 7, TP.HCM",
      avatar: (fullName || "ND").substring(0, 2).toUpperCase(),
      athleteId: "#VS-20269",
      voucher: "50.000đ",
      sportPreference: sportLabels[selectedSport],
      skillLevel: selectedLevel,
      playHabits: {
        slots: selectedSlots,
        days: selectedDays,
        mode: matchMode
      }
    };

    onLoginSuccess(userPayload);
    setOnboardingStep(0);
    onClose();
  };

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 my-auto animate-modal-pop">
        {/* Top Header Strip */}
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
          {/* Left Brand Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="VaoSan Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              VAO<span className="text-[#0b4f6c] dark:text-sky-400">SAN</span>
            </span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-[#0b4f6c] text-white rounded">
              PRO
            </span>
          </div>

          {/* Right Info Badges & Close Button */}
          <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {onboardingStep > 0 ? (
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full bg-[#0b4f6c]/10 text-[#0b4f6c] dark:bg-sky-400/20 dark:text-sky-300 text-[11px] font-extrabold uppercase">
                  Setup Hồ Sơ Bước {onboardingStep}/3
                </span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                <PhoneCall className="w-3.5 h-3.5 text-[#0b4f6c] dark:text-sky-400" />
                <span>Hotline: <strong className="text-slate-800 dark:text-slate-200 font-mono">1900 8888</strong></span>
              </div>
            )}
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <div className="flex items-center space-x-1 font-mono text-[11px] font-bold text-slate-500">
              <span className="text-[#0b4f6c] dark:text-sky-400 font-extrabold">VI</span>
              <span>/</span>
              <span>EN</span>
            </div>
            <button
              onClick={() => {
                if (onboardingStep > 0) setOnboardingStep(0);
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STEP 0: LOGIN & REGISTER MODAL */}
        {onboardingStep === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px] bg-white dark:bg-slate-900 relative">
            {/* LEFT COLUMN: Dark Slate Navy Panel */}
            <div className="lg:col-span-5 bg-[#0b1c30] text-white p-6 sm:p-8 lg:pr-14 flex flex-col justify-between space-y-6 relative overflow-hidden lg:[clip-path:polygon(0_0,100%_0,85%_100%,0_100%)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0b4f6c]/30 rounded-full blur-3xl pointer-events-none" />

              <div className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-20">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                  <line x1="100" y1="0" x2="85" y2="100" stroke="#0b4f6c" strokeWidth="1.5" vectorEffect="non-scaling-stroke" shapeRendering="geometricPrecision" />
                </svg>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-sky-300 text-[10px] font-extrabold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>HỆ SINH THÁI THỂ THAO VAOSAN 4.0</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    {mode === "login" ? (
                      <>
                        Một Tài Khoản. <br />
                        <span className="text-sky-400">Kết Nối Mọi Sân Đấu.</span>
                      </>
                    ) : (
                      <>
                        Gia Nhập Cộng Đồng. <br />
                        <span className="text-sky-400">Kết Nối Đam Mê.</span>
                      </>
                    )}
                  </h1>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {mode === "login"
                      ? "Tích hợp hệ thống đặt sân, bắt đối tác/đội tự động và thi đấu giao lưu đa môn tiện lợi."
                      : "Kết nối với 68.000+ cầu thủ, phòng chống bùng kèo tức thì nhờ Napas247 & tiêu chuẩn quốc tế."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] font-bold text-slate-200">
                    ⚽ Bóng đá
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] font-bold text-slate-200">
                    🏓 Pickleball
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] font-bold text-slate-200">
                    🏸 Cầu lông
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] font-bold text-slate-200">
                    🎾 Tennis
                  </span>
                </div>

                {mode === "login" ? (
                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-3 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-full bg-[#0b4f6c] border-2 border-sky-400 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md">
                        TL
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-sm">Trần Hoàng Long</h3>
                        <p className="text-[11px] text-slate-400 font-medium">@long_pro10 • Saigon Arena</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-center font-mono text-xs">
                      <div className="bg-slate-900/60 p-2 rounded-xl">
                        <span className="text-base font-extrabold text-white block">24</span>
                        <span className="text-[10px] text-slate-400 font-sans block">Trận đấu</span>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-xl">
                        <span className="text-base font-extrabold text-sky-400 block">1.450</span>
                        <span className="text-[10px] text-slate-400 font-sans block">Elo Rating</span>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-xl">
                        <span className="text-xs font-extrabold text-amber-400 block pt-0.5">Bạch Kim</span>
                        <span className="text-[10px] text-slate-400 font-sans block">Hạng Pro</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                    <span className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider block">
                      QUYỀN LỢI THÀNH VIÊN VAOSAN
                    </span>
                    <div className="space-y-2.5 text-xs text-slate-200">
                      <div className="flex items-start space-x-2">
                        <span className="text-sm">🎁</span>
                        <span><strong>Tặng voucher 50.000đ</strong> cho lần đặt đầu tiên</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-sm">⚡</span>
                        <span>Giao dịch tự động Napas247 & Khóa ca tức thì</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-sm">🏆</span>
                        <span>Tích điểm VaoSanPoints hoàn tiền hàng tháng</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800 font-mono text-center">
                <div>
                  <span className="text-lg font-extrabold text-sky-400 block">450+</span>
                  <span className="text-[10px] text-slate-400 font-sans block">Cụm sân</span>
                </div>
                <div>
                  <span className="text-lg font-extrabold text-white block">68.000+</span>
                  <span className="text-[10px] text-slate-400 font-sans block">Người chơi</span>
                </div>
                <div>
                  <span className="text-lg font-extrabold text-emerald-400 block">100%</span>
                  <span className="text-[10px] text-slate-400 font-sans block">Bảo mật VietQR</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Clean Form Panel */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:pl-6 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className={`px-4 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                        mode === "login"
                          ? "bg-[#0b1c30] text-white shadow-md"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Đăng Nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className={`px-4 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                        mode === "register"
                          ? "bg-[#0b1c30] text-white shadow-md"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Đăng Ký Mới
                    </button>
                  </div>

                  <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0b4f6c] dark:text-sky-400" />
                    <span>Bảo mật SSL 256-bit</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {mode === "login"
                      ? "Đăng nhập để đặt sân nhanh, tìm Đội và tham gia giải đấu..."
                      : "Đăng ký nhanh chóng để kết nối với hơn 68.000 vận động viên toàn quốc."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Vai trò của bạn
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("PLAYER")}
                      className={`py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
                        role === "PLAYER"
                          ? "border-[#0b4f6c] bg-[#0b4f6c]/10 text-[#0b4f6c] dark:text-sky-400 dark:border-sky-400 dark:bg-sky-400/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Người chơi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("OWNER")}
                      className={`py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
                        role === "OWNER"
                          ? "border-[#0b4f6c] bg-[#0b4f6c]/10 text-[#0b4f6c] dark:text-sky-400 dark:border-sky-400 dark:bg-sky-400/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Chủ cụm sân</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("ORGANIZER")}
                      className={`py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
                        role === "ORGANIZER"
                          ? "border-[#0b4f6c] bg-[#0b4f6c]/10 text-[#0b4f6c] dark:text-sky-400 dark:border-sky-400 dark:bg-sky-400/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Ban tổ chức</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {mode === "register" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Họ và tên</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nguyễn Văn An"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0b4f6c]"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Số điện thoại hoặc Email
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="(090) 345 678 hoặc email@domain.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0b4f6c]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Mật khẩu</label>
                      {mode === "login" && (
                        <a href="#" className="text-[11px] text-[#0b4f6c] dark:text-sky-400 font-bold hover:underline">
                          Quên mật khẩu?
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="🔒 Nhập ít nhất 8 ký tự"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0b4f6c]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    {mode === "login" ? (
                      <label className="flex items-center space-x-2 cursor-pointer text-slate-600 dark:text-slate-300 font-medium">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded accent-[#0b4f6c] w-4 h-4 cursor-pointer"
                        />
                        <span>Ghi nhớ đăng nhập</span>
                      </label>
                    ) : (
                      <label className="flex items-center space-x-2 cursor-pointer text-slate-600 dark:text-slate-300 font-medium">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="rounded accent-[#0b4f6c] w-4 h-4 cursor-pointer"
                        />
                        <span>Tôi đồng ý với Quy chuẩn Dịch vụ & Điều khoản.</span>
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <span>{mode === "login" ? "Đăng Nhập Vào VaoSan →" : "Tạo Tài Khoản VaoSan →"}</span>
                  </button>
                </form>

                <div className="relative flex items-center justify-center pt-1">
                  <div className="w-full h-px bg-slate-200 dark:border-slate-800" />
                  <span className="absolute px-3 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    HOẶC TIẾP TỤC VỚI
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center justify-center space-x-1.5 py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" fill="#4285F4" />
                      <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z" fill="#34A853" />
                      <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
                      <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center justify-center space-x-1.5 py-2 px-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-xs border border-sky-500/20 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-sky-500" />
                    <span>Zalo OTP</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center justify-center space-x-1.5 py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <span>Apple</span>
                  </button>
                </div>

                <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {mode === "login" ? (
                    <span>
                      Bạn là chủ cụm sân?{" "}
                      <button
                        type="button"
                        onClick={() => setRole("OWNER")}
                        className="text-[#0b4f6c] dark:text-sky-400 font-bold hover:underline"
                      >
                        Đăng ký tại đây
                      </button>
                    </span>
                  ) : (
                    <span>
                      Đã có tài khoản VaoSan?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-[#0b4f6c] dark:text-sky-400 font-bold hover:underline"
                      >
                        Đăng nhập ngay →
                      </button>
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 text-center text-[10px] text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800">
                Bằng việc tiếp tục, bạn đồng ý với <a href="#" className="underline">Điều khoản dịch vụ</a> & <a href="#" className="underline">Chính sách bảo mật</a> của VaoSan.
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: ONBOARDING SETUP BƯỚC 1/3 (TÙY CHỈNH HỒ SƠ THỂ THAO) */}
        {onboardingStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] bg-white dark:bg-slate-900 relative">
            {/* LEFT COLUMN: Dark Navy Reward Summary */}
            <div className="lg:col-span-5 bg-[#0b1c30] text-white p-6 sm:p-8 lg:pr-14 flex flex-col justify-between space-y-6 relative overflow-hidden lg:[clip-path:polygon(0_0,100%_0,85%_100%,0_100%)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0b4f6c]/30 rounded-full blur-3xl pointer-events-none" />

              <div className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-20">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                  <line x1="100" y1="0" x2="85" y2="100" stroke="#0b4f6c" strokeWidth="1.5" vectorEffect="non-scaling-stroke" shapeRendering="geometricPrecision" />
                </svg>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-[#0b4f6c] text-sky-400 flex items-center justify-center font-extrabold text-sm shadow-md">
                    VS
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-white text-base tracking-tight">VaoSan</span>
                      <span className="bg-emerald-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">4.0</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Hệ Sinh Thái Thể Thao Đa Môn</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="w-14 h-14 rounded-2xl bg-[#0b4f6c]/40 border border-sky-400/40 flex items-center justify-center text-sky-400 mb-2 shadow-inner">
                    <Award className="w-8 h-8 text-amber-400" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    Chào Mừng Thành Viên Mới!
                  </h1>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Tài khoản của bạn đã được kích hoạt thành công trên toàn bộ hệ thống sân đấu, trọng tài và cộng đồng VaoSan.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center space-x-3 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-white text-xs">Đã cộng voucher 50.000đ</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-black rounded uppercase">VÍ</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">Áp dụng ngay cho lượt đặt sân đầu tiên</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center space-x-3 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-white text-xs block">Cấp mã VĐV chính thức</span>
                      <span className="font-mono text-xs font-extrabold text-sky-400">ID: #VS-20269</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center space-x-3 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-white text-xs block">Bảo mật tài khoản 2FA</span>
                      <p className="text-[11px] text-slate-400 font-medium">Sẵn sàng kích hoạt với số điện thoại</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 font-mono text-center">
                <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider mb-2">
                  <span>TÍCH HỢP 4 BỘ MÔN</span>
                  <span className="text-sky-400 font-bold">LIVE SYNC</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  <div className="p-1.5 rounded-lg bg-slate-800/60 text-white font-bold">⚽ Bóng Đá</div>
                  <div className="p-1.5 rounded-lg bg-slate-800/60 text-white font-bold">🏓 Pickleball</div>
                  <div className="p-1.5 rounded-lg bg-slate-800/60 text-white font-bold">🏸 Cầu Lông</div>
                  <div className="p-1.5 rounded-lg bg-slate-800/60 text-white font-bold">🎾 Tennis</div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Setup Form */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:pl-6 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[#0b4f6c] dark:text-sky-400 font-extrabold text-[11px] uppercase tracking-wider">
                    ⚡ Thiết lập nhanh trong 30 giây
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#0b4f6c] text-white font-extrabold text-xs">
                      Bước 1/3
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-500">33%</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    Tùy Chỉnh Hồ Sơ Thể Thao
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Giúp VaoSan đề xuất sân đấu chuẩn gần bạn nhất và tự động ghép kèo thi đấu ngang điểm trình.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* 1. Sport Choice */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                      1. Chọn môn thể thao ưu tiên chính
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSport("football");
                          setSelectedElo("V-Rank 1,200 (Sân 7)");
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedSport === "football"
                            ? "border-[#0b4f6c] bg-[#0b4f6c]/10 dark:bg-sky-400/20 text-[#0b4f6c] dark:text-sky-400 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="text-lg mb-1">⚽</div>
                        <div className="font-extrabold text-xs">Bóng Đá</div>
                        <div className="text-[10px] text-slate-400">Sân 5 / 7 / 11</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSport("pickleball");
                          setSelectedElo("DUPR 3.0 / Elo 1,200");
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedSport === "pickleball"
                            ? "border-[#0b4f6c] bg-[#0b4f6c]/10 dark:bg-sky-400/20 text-[#0b4f6c] dark:text-sky-400 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="text-lg mb-1">🏓</div>
                        <div className="font-extrabold text-xs">Pickleball</div>
                        <div className="text-[10px] text-emerald-500 font-bold">DUPR Verified</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSport("badminton");
                          setSelectedElo("Elo BWF 1,200");
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedSport === "badminton"
                            ? "border-[#0b4f6c] bg-[#0b4f6c]/10 dark:bg-sky-400/20 text-[#0b4f6c] dark:text-sky-400 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="text-lg mb-1">🏸</div>
                        <div className="font-extrabold text-xs">Cầu Lông</div>
                        <div className="text-[10px] text-slate-400">Đơn & Đôi</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSport("tennis");
                          setSelectedElo("ITR 3.0 / Elo 1,250");
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedSport === "tennis"
                            ? "border-[#0b4f6c] bg-[#0b4f6c]/10 dark:bg-sky-400/20 text-[#0b4f6c] dark:text-sky-400 shadow-sm"
                            : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="text-lg mb-1">🎾</div>
                        <div className="font-extrabold text-xs">Tennis</div>
                        <div className="text-[10px] text-slate-400">Sân cứng / Đất nện</div>
                      </button>
                    </div>
                  </div>

                  {/* 2. Skill Level */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        2. Trình độ đánh giá khởi điểm
                      </label>
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#0b4f6c] dark:text-sky-400">
                        {selectedElo}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { title: "Mới chơi", sub: "< 3 tháng", elo: "Elo 900" },
                        { title: "Nghiệp dư", sub: "Đã nắm luật", elo: "Elo 1,200" },
                        { title: "Khá - Bán chuyên", sub: "Giao lưu tốt", elo: "Elo 1,600" },
                        { title: "Pro / Thi đấu", sub: "Giải phong trào", elo: "Elo 2,000+" }
                      ].map((lvl) => (
                        <button
                          key={lvl.title}
                          type="button"
                          onClick={() => {
                            setSelectedLevel(lvl.title);
                            setSelectedElo(`${lvl.title} (${lvl.elo})`);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            selectedLevel === lvl.title
                              ? "border-[#0b4f6c] bg-[#0b4f6c] text-white shadow-sm"
                              : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="font-extrabold text-xs">{lvl.title}</div>
                          <div className="text-[10px] opacity-80">{lvl.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Region Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                      3. Vị trí & Khu vực hoạt động ưu tiên
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400 absolute left-3.5 top-3 pointer-events-none" />
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#0b4f6c]"
                      >
                        <option value="q7">TP. Hồ Chí Minh — Quận 7 & Nhà Bè (Pickleball & Bóng đá)</option>
                        <option value="binh_thanh">TP. Hồ Chí Minh — Bình Thạnh & Thủ Đức</option>
                        <option value="q2">TP. Hồ Chí Minh — Thảo Điền & An Phú (Quận 2)</option>
                        <option value="cau_giay">Hà Nội — Cầu Giấy & Nam Từ Liêm</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(2)}
                    className="flex-1 py-3 rounded-xl bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Tiếp tục (Bước 2/3)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalComplete}
                    className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
                  >
                    Để sau, vào Trang chủ
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center font-medium">
                  Bạn luôn có thể tùy chỉnh lại thông tin trong Hồ sơ cá nhân bất kỳ lúc nào.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ONBOARDING SETUP BƯỚC 2/3 (KHUNG GIỜ & THÓI QUEN RA SÂN) */}
        {onboardingStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] bg-white dark:bg-slate-900 relative">
            {/* LEFT COLUMN: Dark Navy Matchmaking Pitch */}
            <div className="lg:col-span-5 bg-[#0b1c30] text-white p-6 sm:p-8 lg:pr-14 flex flex-col justify-between space-y-6 relative overflow-hidden lg:[clip-path:polygon(0_0,100%_0,85%_100%,0_100%)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0b4f6c]/30 rounded-full blur-3xl pointer-events-none" />

              <div className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-20">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                  <line x1="100" y1="0" x2="85" y2="100" stroke="#0b4f6c" strokeWidth="1.5" vectorEffect="non-scaling-stroke" shapeRendering="geometricPrecision" />
                </svg>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-sky-300 text-[10px] font-extrabold uppercase tracking-wider">
                  <Zap className="w-3 h-3 text-sky-400" />
                  <span>AI MATCHMAKING ENGINE</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    Bắt Cặp & Đặt Sân Tự Động!
                  </h1>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Hệ thống AI sẽ quét và đề xuất đối thủ hoặc đồng đội tương đương điểm trình DUPR / Elo trong khung giờ bạn rảnh rỗi.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      ⚖️
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-xs">Tự động ghép kèo Fair-play</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Kiểm soát chênh lệch điểm trình &lt; 15% DUPR/Elo, cân bằng đội hình tuyệt đối.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      🔔
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-xs">Thông báo ca sân trống giờ vàng</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Nhận cảnh báo đẩy tức thì ngay khi có hội nhóm hủy slot hoặc nhượng ca nóng.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      🛡️
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-xs">Bảo chứng uy tín trận đấu</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Cam kết 100% không bỏ kèo, không trễ giờ thông qua cọc phòng chờ thông minh.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-center font-mono text-[11px] text-slate-400 flex items-center justify-between">
                <span>Hệ Thống Tự Động Khóa Ca</span>
                <span className="text-emerald-400 font-bold">Napas247 VietQR</span>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Setup Form */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:pl-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[#0b4f6c] dark:text-sky-400 font-extrabold text-[11px] uppercase tracking-wider">
                    ⚡ Lịch Thi Đấu & Thói Quen
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#0b4f6c] text-white font-extrabold text-xs">
                      Bước 2/3
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-500">66%</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    Khung Giờ & Thói Quen Ra Sân
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Tùy chọn thời gian bạn thường rảnh để VaoSan nhắc lịch và giữ sân ưu tiên.
                  </p>
                </div>

                {/* 1. Time Slots */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      1. Khung giờ bạn hay thi đấu nhất (Chọn nhiều)
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "morning", title: "Sáng sớm", time: "05:30 - 08:00", tag: null },
                      { id: "noon", title: "Trưa / Nghỉ trưa", time: "11:30 - 13:30", tag: null },
                      { id: "afternoon", title: "Chiều tan làm", time: "17:30 - 19:30", tag: "Top Pick" },
                      { id: "night", title: "Tối muộn", time: "19:30 - 22:00", tag: "Hot" }
                    ].map((slot) => {
                      const isSelected = selectedSlots.includes(slot.id);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => toggleSlot(slot.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? "border-[#0b4f6c] bg-[#0b4f6c]/10 dark:bg-sky-400/20 text-[#0b4f6c] dark:text-sky-400 shadow-xs"
                              : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-extrabold text-xs">{slot.title}</span>
                              {slot.tag && (
                                <span className="px-1.5 py-0.2 rounded bg-[#0b4f6c] text-white text-[9px] font-extrabold uppercase">
                                  {slot.tag}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 block mt-0.5">{slot.time}</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isSelected ? "bg-[#0b4f6c] text-white" : "bg-slate-200 dark:bg-slate-800 text-transparent"}`}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Days of week */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                    2. Ngày trong tuần bạn thường chơi
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {[
                      { id: "mon", label: "2" },
                      { id: "tue", label: "3" },
                      { id: "wed", label: "4" },
                      { id: "thu", label: "5" },
                      { id: "fri", label: "6" },
                      { id: "sat", label: "7" },
                      { id: "sun", label: "CN" }
                    ].map((day) => {
                      const isSelected = selectedDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleDay(day.id)}
                          className={`py-2 rounded-xl font-mono text-center text-xs font-extrabold transition-all ${
                            isSelected
                              ? "bg-[#0b1c30] text-white shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <span className="block text-[9px] opacity-70 uppercase font-sans">Thứ</span>
                          <span>{day.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Matching Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                    3. Nhu cầu ghép đội / Tìm đối thủ
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: "free", title: "Tự do ghép kèo", sub: "Mở nhận lời mời giao lưu từ CLB & đối thủ cân trình trong 7km", tag: "Khuyên Dùng" },
                      { id: "fixed_team", title: "Đã có đội cố định", sub: "Chỉ cần tìm sân bãi, giữ ca định kỳ hàng tuần và chia tiền sân", tag: null },
                      { id: "solo_join", title: "Tìm người đá / đánh ké", sub: "Muốn gia nhập các nhóm thiếu 1-2 vị trí phút chót", tag: null }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMatchMode(opt.id)}
                        className={`w-full p-3 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                          matchMode === opt.id
                            ? "border-[#0b4f6c] bg-[#0b4f6c]/10 dark:bg-sky-400/20 text-[#0b4f6c] dark:text-sky-400 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border ${matchMode === opt.id ? "border-[#0b4f6c] bg-[#0b4f6c]" : "border-slate-300"}`}>
                          {matchMode === opt.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-xs">{opt.title}</span>
                            {opt.tag && (
                              <span className="px-2 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                                {opt.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{opt.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between space-x-3">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(1)}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1 hover:bg-slate-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại Bước 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnboardingStep(3)}
                  className="flex-1 py-3 rounded-xl bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Tiếp tục (Bước 3/3)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ONBOARDING SETUP BƯỚC 3/3 (HOÀN TẤT & THẺ HỘI VIÊN) */}
        {onboardingStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] bg-white dark:bg-slate-900 relative">
            {/* LEFT COLUMN: Dark Navy VIP Member Card Preview */}
            <div className="lg:col-span-5 bg-[#0b1c30] text-white p-6 sm:p-8 lg:pr-14 flex flex-col justify-between space-y-6 relative overflow-hidden lg:[clip-path:polygon(0_0,100%_0,85%_100%,0_100%)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0b4f6c]/30 rounded-full blur-3xl pointer-events-none" />

              <div className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-20">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                  <line x1="100" y1="0" x2="85" y2="100" stroke="#0b4f6c" strokeWidth="1.5" vectorEffect="non-scaling-stroke" shapeRendering="geometricPrecision" />
                </svg>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>VAOSAN PRO ATHLETE CARD</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    Sẵn Sàng Xuất Phát!
                  </h1>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Thẻ hội viên điện tử VaoSan Pro của bạn đã được kích hoạt chính thức. Dùng thẻ để nhận ưu đãi đặt sân và tích điểm hoàn tiền.
                  </p>
                </div>

                {/* VIP Digital Card Widget */}
                <div className="bg-gradient-to-br from-[#0b4f6c] to-[#0b1c30] p-5 rounded-3xl border border-sky-400/40 shadow-2xl space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-white text-slate-950 font-black text-xs flex items-center justify-center">
                        VS
                      </div>
                      <span className="font-extrabold text-white text-sm tracking-tight">VAOSAN PRO</span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                      VIP PASS
                    </span>
                  </div>

                  <div className="pt-2">
                    <h3 className="font-extrabold text-white text-base">{fullName || "Trần Hoàng Long"}</h3>
                    <p className="text-[11px] text-sky-300 font-mono">ID: #VS-20269 • {selectedLevel}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sky-500/30 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Môn ưu tiên:</span>
                      <span className="font-bold text-white uppercase">{selectedSport}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Ví ưu đãi:</span>
                      <span className="font-bold text-emerald-400">50.000đ</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400 font-medium">
                VaoSan Multi-Sport Platform • 2026
              </div>
            </div>

            {/* RIGHT COLUMN: Celebration & Finish Action */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 lg:pl-6 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-extrabold text-[11px] uppercase tracking-wider flex items-center space-x-1">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Setup Hoàn Tất 100%</span>
                  </span>
                  <span className="font-mono font-bold text-xs text-emerald-500">Bước 3/3</span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    Hồ Sơ Đã Sẵn Sàng!
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Cảm ơn bạn đã hoàn thành thiết lập. Bây giờ bạn có thể bắt đầu đặt sân và ghép kèo tức thì.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      TỔNG QUAN TÀI KHOẢN VỪA KHỞI TẠO
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <div>🏆 Môn thi đấu: <strong className="text-slate-900 dark:text-white uppercase">{selectedSport}</strong></div>
                      <div>📈 Trình độ: <strong className="text-slate-900 dark:text-white">{selectedLevel}</strong></div>
                      <div>📍 Khu vực: <strong className="text-slate-900 dark:text-white">Quận 7 & TP.HCM</strong></div>
                      <div>🎁 Ví quà tặng: <strong className="text-emerald-500 font-bold">50.000đ</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={handleFinalComplete}
                  className="w-full py-3.5 rounded-xl bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs shadow-lg shadow-[#0b4f6c]/20 transition-all flex items-center justify-center space-x-2 active:scale-95"
                >
                  <span>Bắt Đầu Khám Phá Sân & Ghép Trận Ngay →</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
