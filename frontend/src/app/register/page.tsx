"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  Trophy,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  MapPin,
  Flame,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { markPlayerSetupPending } from "@/components/PlayerSetup";

type Role = "PLAYER" | "OWNER" | "ORGANIZER";

const ROLES: { id: Role; label: string; desc: string; icon: React.ReactNode; badge: string }[] = [
  {
    id: "PLAYER",
    label: "Cầu Thủ",
    desc: "Tìm & đặt sân cực nhanh, ghép kèo giao lưu, tham gia giải đấu và theo dõi phong độ ELO.",
    icon: <User className="w-6 h-6 text-[#0369a1]" />,
    badge: "Phổ biến nhất",
  },
  {
    id: "OWNER",
    label: "Chủ Cụm Sân",
    desc: "Số hóa lịch sân theo ma trận trực quan, quản lý cọc tự động qua VietQR và tăng doanh thu giờ vàng.",
    icon: <Building2 className="w-6 h-6 text-emerald-600" />,
    badge: "Tối ưu doanh thu",
  },
  {
    id: "ORGANIZER",
    label: "Ban Tổ Chức Giải",
    desc: "Tạo giải đấu sân 5/7/11, bốc thăm phân nhánh tự động, quản lý lệ phí và bảng xếp hạng phong độ.",
    icon: <Trophy className="w-6 h-6 text-amber-600" />,
    badge: "Tổ chức chuyên nghiệp",
  },
];

const POSITIONS = [
  "Thủ Môn (GK)",
  "Hậu Vệ (CB)",
  "Hậu Vệ Cánh (RB/LB)",
  "Tiền Vệ (CM)",
  "Tiền Vệ Cánh (LM/RM)",
  "Tiền Đạo (ST)",
];

const AREAS = [
  "Quận Hải Châu, Đà Nẵng",
  "Quận Cẩm Lệ, Đà Nẵng",
  "Quận Thanh Khê, Đà Nẵng",
  "Quận Sơn Trà, Đà Nẵng",
  "Quận Liên Chiểu, Đà Nẵng",
  "Quận Ngũ Hành Sơn, Đà Nẵng",
  "Huyện Hòa Vàng, Đà Nẵng",
  "Khu vực lân cận",
];

const LEVELS = ["Mới chơi", "Phong trào", "Bán chuyên", "Chuyên nghiệp"];
const SPORTS = ["Bóng Đá Sân 7", "Bóng Đá Sân 5", "Bóng Đá Sân 11", "Futsal Trong Nhà"];

function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 6) s += 1;
  if (pw.length >= 8) s += 1;
  if (/[A-ZÀ-Ỹ]/.test(pw) && /[a-zà-ỹ]/.test(pw)) s += 1;
  if (/\d/.test(pw) && /[^A-Za-zÀ-ỹà-ỹ0-9]/.test(pw)) s += 1;
  return Math.min(s, 4);
}

const STRENGTH_LABEL = ["Quá ngắn", "Yếu", "Trung bình", "Khá an toàn", "Rất mạnh"];
const STRENGTH_COLOR = ["bg-slate-200", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-[#0369a1]"];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>("PLAYER");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile preferences (Step 2)
  const [position, setPosition] = useState(POSITIONS[3]);
  const [area, setArea] = useState(AREAS[0]);
  const [level, setLevel] = useState(LEVELS[1]);
  const [favoriteSport, setFavoriteSport] = useState(SPORTS[0]);
  const [pitchOrOrgName, setPitchOrOrgName] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const strength = passwordScore(password);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fullName.trim().length < 3) {
      setErrorMsg("Vui lòng nhập họ và tên đầy đủ (tối thiểu 3 ký tự).");
      return;
    }

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg("Vui lòng nhập địa chỉ email hoặc số điện thoại.");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanId);
    const isPhone = /^[0-9+ ]{9,13}$/.test(cleanId);
    if (!isEmail && !isPhone) {
      setErrorMsg("Email hoặc số điện thoại không hợp lệ (số điện thoại từ 9 đến 11 số).");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự để bảo đảm an toàn.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu nhập lại không khớp với mật khẩu đã nhập.");
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const cleanId = identifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanId);

      const user = await register({
        fullName: fullName.trim(),
        email: isEmail ? cleanId : `${cleanId}@phone.turfzone.vn`,
        phone: isEmail ? undefined : cleanId,
        password: password,
        role: role,
        position: role === "PLAYER" ? position : undefined,
        area: area,
        favoriteSport: favoriteSport,
        level: role === "PLAYER" ? level : undefined,
      });

      if (role === "PLAYER" && user?.email) {
        markPlayerSetupPending(user.email);
      }

      router.push(role === "PLAYER" ? "/player-setup" : "/");
    } catch (err: any) {
      setErrorMsg(err?.message || "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin và thử lại.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-white text-slate-900 pb-16">
      {/* Top Brand Bar */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0369a1] to-sky-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform">
              T
            </span>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Turf<span className="text-[#0369a1]">Zone</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[14px] text-slate-600 hidden sm:inline">Đã có tài khoản?</span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-[14px] font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Về trang chủ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 pt-8 sm:pt-12">
        {/* Header Introduction */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-[#0369a1] text-[13px] font-black mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tham gia hệ sinh thái thể thao Đà Nẵng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Tạo tài khoản Turfzone
          </h1>
          <p className="mt-2 text-[14px] sm:text-base text-slate-600 leading-relaxed">
            Chỉ với 2 bước nhanh chóng để đặt sân, giao lưu kèo đấu và tổ chức giải phủi chuẩn mực.
          </p>

          {/* Stepper Progress */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all ${
              step === 1 ? "bg-[#0369a1] text-white shadow-sm" : "bg-emerald-100 text-emerald-800"
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-black ${
                step === 1 ? "bg-white text-[#0369a1]" : "bg-emerald-600 text-white"
              }`}>
                {step > 1 ? "✓" : "1"}
              </span>
              <span>Tài khoản & Vai trò</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300" />

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all ${
              step === 2 ? "bg-[#0369a1] text-white shadow-sm" : "bg-slate-100 text-slate-500"
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-black ${
                step === 2 ? "bg-white text-[#0369a1]" : "bg-slate-200 text-slate-600"
              }`}>
                2
              </span>
              <span>Thông tin thi đấu & Hoạt động</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-[14px] font-bold leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Step 1: Account credentials & Role Selection */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-6">
            {/* Role Card Selection */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">1. Chọn vai trò của bạn</h2>
                  <p className="text-[13px] text-slate-500">Mỗi vai trò sẽ có giao diện và tính năng tối ưu chuyên biệt</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {ROLES.map((r) => {
                  const selected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`relative text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        selected
                          ? "border-[#0369a1] bg-sky-50/40 shadow-md ring-2 ring-sky-500/10"
                          : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${selected ? "bg-white shadow-sm" : "bg-slate-100"}`}>
                          {r.icon}
                        </div>
                        <span className={`text-[12px] font-black px-2.5 py-0.5 rounded-full ${
                          selected ? "bg-[#0369a1] text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          {r.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-slate-900 mb-1 flex items-center justify-between">
                          <span>{r.label}</span>
                          {selected && <CheckCircle2 className="w-5 h-5 text-[#0369a1]" />}
                        </h3>
                        <p className="text-[13px] text-slate-600 leading-relaxed">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Credentials */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-900 mb-2">2. Thông tin đăng nhập</h2>

              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-1.5">
                  Họ và tên của bạn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Cầu Thủ"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1] transition-all"
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-1.5">
                  Email hoặc số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ví dụ: player@turfzone.vn hoặc 0912345678"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-1.5">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              i < strength ? STRENGTH_COLOR[strength] : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-[12px] font-bold text-slate-500">
                        Độ bảo mật: <span className="text-slate-700">{STRENGTH_LABEL[strength]}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-1.5">
                    Xác nhận mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu ở trên"
                      className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-[12px] font-bold text-rose-600">Mật khẩu xác nhận chưa khớp.</p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 flex items-center justify-between gap-4">
                <Link
                  href="/"
                  className="px-5 py-3 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Quay lại đăng nhập
                </Link>

                <button
                  type="submit"
                  className="flex-1 max-w-xs py-3 px-6 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[15px] shadow-lg shadow-sky-700/20 hover:shadow-sky-700/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Tiếp tục bước 2</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Google Fast Register */}
              <div className="pt-6 border-t border-slate-100 text-center">
                <p className="text-[13px] text-slate-500 font-bold mb-3">Hoặc tạo tài khoản nhanh qua Google</p>
                <div className="flex justify-center">
                  <GoogleLoginButton
                    mode="register"
                    onSuccess={(u) => {
                      router.push(u?.role === "PLAYER" ? "/player-setup" : "/");
                    }}
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Step 2: Sport / Business Profile Details */}
        {step === 2 && (
          <form onSubmit={handleFinalRegister} className="space-y-6">
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {role === "PLAYER"
                      ? "Hồ sơ thể thao cầu thủ"
                      : role === "OWNER"
                      ? "Thông tin cụm sân quản lý"
                      : "Thông tin đơn vị tổ chức"}
                  </h2>
                  <p className="text-[13px] text-slate-500">
                    {role === "PLAYER"
                      ? "Giúp bạn ghép đội, tìm kèo đúng trình độ và nhận đề xuất sân gần nhất"
                      : "Giúp người chơi và các đội bóng dễ dàng tìm thấy bạn trên bản đồ"}
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-sky-100 text-[#0369a1] text-[13px] font-black">
                  {role === "PLAYER" ? "Cầu Thủ" : role === "OWNER" ? "Chủ Sân" : "Ban Tổ Chức"}
                </span>
              </div>

              {role === "PLAYER" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[14px] font-bold text-slate-700 mb-1.5">
                        Vị trí sở trường trên sân
                      </label>
                      <select
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
                      >
                        {POSITIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[14px] font-bold text-slate-700 mb-1.5">
                        Trình độ thi đấu tự đánh giá
                      </label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
                      >
                        {LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[14px] font-bold text-slate-700 mb-1.5">
                        Môn bóng đá yêu thích
                      </label>
                      <select
                        value={favoriteSport}
                        onChange={(e) => setFavoriteSport(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
                      >
                        {SPORTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[14px] font-bold text-slate-700 mb-1.5">
                        Khu vực hoạt động chính
                      </label>
                      <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
                      >
                        {AREAS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {role === "OWNER" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[14px] font-bold text-slate-700 mb-1.5">
                      Tên cụm sân của bạn (nếu có)
                    </label>
                    <input
                      type="text"
                      value={pitchOrOrgName}
                      onChange={(e) => setPitchOrOrgName(e.target.value)}
                      placeholder="Ví dụ: Cụm Sân Bóng Đá Đại Nắng"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-bold text-slate-700 mb-1.5">
                      Quận / Huyện đặt sân tại Đà Nẵng
                    </label>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
                    >
                      {AREAS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {role === "ORGANIZER" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[14px] font-bold text-slate-700 mb-1.5">
                      Tên ban tổ chức / Đơn vị tổ chức giải
                    </label>
                    <input
                      type="text"
                      value={pitchOrOrgName}
                      onChange={(e) => setPitchOrOrgName(e.target.value)}
                      placeholder="Ví dụ: Ban Tổ Chức Giải Sân 7 Phủi Đà Nẵng"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-bold text-slate-700 mb-1.5">
                      Khu vực tổ chức thường niên
                    </label>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]"
                    >
                      {AREAS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Policy agreement */}
              <div className="pt-2 text-[13px] text-slate-500 leading-relaxed">
                Bằng việc bấm <strong>Hoàn tất đăng ký</strong>, bạn đồng ý với Quy chế hoạt động và Điều khoản bảo mật
                thông tin thể thao của Turfzone.
              </div>

              {/* Nav Buttons */}
              <div className="pt-4 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 max-w-xs py-3 px-6 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[15px] shadow-lg shadow-sky-700/20 hover:shadow-sky-700/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo tài khoản…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hoàn tất đăng ký</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
