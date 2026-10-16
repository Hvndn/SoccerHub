"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Building2,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "register";
  initialRole?: "PLAYER" | "OWNER" | "ORGANIZER";
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

type Role = "PLAYER" | "OWNER" | "ORGANIZER";

const ROLES: { id: Role; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "PLAYER", label: "Cầu Thủ", desc: "Đặt sân, ghép kèo & leo hạng Elo", icon: <User className="w-5 h-5" /> },
  { id: "OWNER", label: "Chủ Sân", desc: "Quản lý cụm sân & doanh thu", icon: <Building2 className="w-5 h-5" /> },
  { id: "ORGANIZER", label: "Ban Tổ Chức", desc: "Tạo & điều hành giải đấu", icon: <Trophy className="w-5 h-5" /> },
];

const POSITIONS = ["Thủ Môn (GK)", "Hậu Vệ (CB)", "Hậu Vệ Cánh (RB/LB)", "Tiền Vệ (CM)", "Tiền Vệ Cánh (LM/RM)", "Tiền Đạo (ST)"];
const AREAS = ["Q. Hải Châu, Đà Nẵng", "Q. Cẩm Lệ, Đà Nẵng", "Q.7, TP.HCM", "Q.1, TP.HCM", "TP. Thủ Đức, TP.HCM", "Khu vực khác"];
const LEVELS = ["Mới chơi", "Phong trào", "Bán chuyên", "Chuyên nghiệp"];
const SPORTS = ["Bóng Đá Sân 5", "Bóng Đá Sân 7", "Bóng Đá Sân 11", "Futsal"];

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400 transition-shadow";
const labelCls = "block text-xs font-bold text-slate-700 mb-1.5";

function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 6) s += 1;
  if (pw.length >= 8) s += 1;
  if (/[A-ZÀ-Ỹ]/.test(pw) && /[a-zà-ỹ]/.test(pw)) s += 1;
  if (/\d/.test(pw) && /[^A-Za-zÀ-ỹà-ỹ0-9]/.test(pw)) s += 1;
  return Math.min(s, 4);
}

const STRENGTH_LABEL = ["Quá yếu", "Yếu", "Trung bình", "Khá", "Mạnh"];
const STRENGTH_COLOR = ["bg-slate-200", "bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-emerald-500"];

export default function AuthModal({
  isOpen,
  initialMode = "login",
  initialRole = "PLAYER",
  onClose,
  onLoginSuccess
}: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  // Form inputs
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  // Hồ sơ thi đấu (bước 2 đăng ký — gửi thật lên API, không hardcode)
  const [position, setPosition] = useState(POSITIONS[3]);
  const [area, setArea] = useState(AREAS[0]);
  const [level, setLevel] = useState(LEVELS[1]);
  const [favoriteSport, setFavoriteSport] = useState(SPORTS[1]);

  // States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialMode) setMode(initialMode);
      if (initialRole) setRole(initialRole);
      setErrorMsg(null);
      setRegStep(1);
    }
  }, [isOpen, initialMode, initialRole]);

  // ESC + focus-trap + khóa scroll nền + trả focus khi đóng
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      cardRef.current
        ?.querySelector<HTMLElement>("input:not([disabled]), select:not([disabled]), button:not([disabled])")
        ?.focus();
    }, 80);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !cardRef.current) return;
      const items = Array.from(
        cardRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]'
        )
      ).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Quick Demo Login Handler
  // Mật khẩu tài khoản demo đã seed ở backend (DataInitializer)
  const DEMO_PASSWORD: Record<Role, string> = {
    PLAYER: "player123",
    OWNER: "owner123",
    ORGANIZER: "organizer123",
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoRole: Role) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setRole(demoRole);
    try {
      const user = await login({ email: demoEmail, password: DEMO_PASSWORD[demoRole] });
      onLoginSuccess({ ...user, role: demoRole, isNewOwner: false });
      onClose();
    } catch {
      // Fallback local demo account if backend offline
      const demoUser = {
        fullName: demoRole === "PLAYER" ? "Trần Hoàng Long" : demoRole === "OWNER" ? "Nguyễn Văn Sân" : "Lê Văn Giải",
        email: demoEmail,
        role: demoRole,
        position: demoRole === "PLAYER" ? "Tiền Vệ (CM)" : demoRole === "OWNER" ? "Chủ Cụm Sân ProHub" : "Ban Tổ Chức Giải Đấu",
        eloRating: demoRole === "PLAYER" ? 1450 : 1500,
        area: "Đà Nẵng / TP.HCM",
        avatar: demoRole === "PLAYER" ? "TL" : demoRole === "OWNER" ? "NS" : "LG",
        isNewOwner: false
      };
      onLoginSuccess(demoUser);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMsg("Vui lòng nhập email hoặc số điện thoại.");
      return;
    }
    if (!password) {
      setErrorMsg("Vui lòng nhập mật khẩu.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await login({ email: cleanIdentifier, password });
      onLoginSuccess({ ...user, isNewOwner: false });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (regStep === 1) {
      if (fullName.trim().length < 3) {
        setErrorMsg("Vui lòng nhập họ tên (ít nhất 3 ký tự).");
        return;
      }
      const cleanIdentifier = identifier.trim();
      if (!cleanIdentifier) {
        setErrorMsg("Vui lòng nhập email hoặc số điện thoại.");
        return;
      }
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier);
      if (!isEmail && !/^[0-9+ ]{9,13}$/.test(cleanIdentifier)) {
        setErrorMsg("Số điện thoại chưa đúng (9–13 chữ số).");
        return;
      }
      if (!password) {
        setErrorMsg("Vui lòng nhập mật khẩu.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
      }
      setRegStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanIdentifier = identifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier);
      const newUser = await register({
        fullName: fullName.trim(),
        email: isEmail ? cleanIdentifier : `${cleanIdentifier}@phone.soccerhub.vn`,
        phone: isEmail ? undefined : cleanIdentifier,
        password: password,
        role: role,
        position: role === "PLAYER" ? position : undefined,
        area: area,
        favoriteSport: favoriteSport,
        level: role === "PLAYER" ? level : undefined
      });
      onLoginSuccess({ ...newUser, isNewOwner: role === "OWNER" });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setRegStep(1);
    setErrorMsg(null);
  };

  const strength = passwordScore(password);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="animate-modal-pop relative w-full max-w-[880px] my-auto grid md:grid-cols-[2fr,3fr] rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-2xl max-h-[94vh]"
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp thoại đăng nhập"
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-slate-900/10 hover:bg-slate-900/25 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Panel trái: ảnh sân + brand (ẩn trên mobile) */}
        <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-[#0b4f6c] text-white p-8 min-h-[560px]">
          <img
            src="https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=800&q=80"
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b4f6c] via-[#0b4f6c]/70 to-[#0b4f6c]/25" />
          <div className="relative">
            <p className="text-xl font-black tracking-tight">
              <span className="text-emerald-400">Turf</span>Zone
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-emerald-200/80">
              Sân phủi • Giải đấu • Elo
            </p>
          </div>
          <div className="relative space-y-4">
            <p className="text-2xl font-black leading-snug tracking-tight">
              Sân có sẵn.
              <br />
              Kèo có sẵn.
              <br />
              Chỉ thiếu bạn.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                ["120+", "Cụm sân"],
                ["850+", "Giải đấu"],
                ["12K+", "Cầu thủ"],
              ].map(([num, label]) => (
                <div key={label} className="rounded-xl bg-white/10 backdrop-blur px-2 py-2.5 text-center border border-white/15">
                  <p className="font-mono font-black text-emerald-300">{num}</p>
                  <p className="text-[10px] font-bold text-white/80 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel phải: form */}
        <div className="p-5 sm:p-8 overflow-y-auto">
          <h2 id="auth-title" className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            {mode === "login" ? "Đăng nhập" : "Tạo tài khoản mới"}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {mode === "login"
              ? "Chào mừng trở lại sân. Nhập thông tin để tiếp tục."
              : "Miễn phí. Mất chưa tới 1 phút để vào sân."}
          </p>

          {/* Tabs Đăng nhập / Đăng ký */}
          <div className="auth-tab-track mt-4 grid grid-cols-2 gap-1 rounded-xl p-1" role="tablist" aria-label="Chọn đăng nhập hoặc đăng ký">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`py-2 rounded-lg text-xs font-black transition-all ${
                  mode === m
                    ? "bg-white shadow text-[#0b4f6c]"
                    : "auth-tab-btn-inactive"
                }`}
              >
                {m === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
            ))}
          </div>

          {/* Bước đăng ký 1/2 */}
          {mode === "register" && (
            <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-slate-500" aria-hidden>
              <span className={`flex items-center gap-1 ${regStep >= 1 ? "text-emerald-700" : ""}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono ${regStep >= 1 ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500"}`}>1</span>
                Tài khoản & vai trò
              </span>
              <span className="text-slate-300">›</span>
              <span className={`flex items-center gap-1 ${regStep >= 2 ? "text-emerald-700" : ""}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono ${regStep >= 2 ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500"}`}>2</span>
                Hồ sơ thi đấu
              </span>
            </div>
          )}

          {/* Banner lỗi */}
          {errorMsg && (
            <div
              role="alert"
              className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="mt-3 space-y-3 sm:mt-4 sm:space-y-4" noValidate={false}>
              <div>
                <label htmlFor="auth-identifier" className={labelCls}>Email hoặc số điện thoại</label>
                <input
                  id="auth-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="vidu@soccerhub.vn hoặc 0909…"
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label htmlFor="auth-password" className={labelCls}>Mật khẩu</label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={(e) => setCapsOn(!!(e as any).getModifierState?.("CapsLock"))}
                    placeholder="••••••••"
                    className={`${inputCls} pr-11`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {capsOn && password && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-600">
                    Đang bật Caps Lock — kiểm tra lại mật khẩu.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-shimmer w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đăng nhập…</span>
                  </>
                ) : (
                  <span>Đăng nhập</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
              {regStep === 1 ? (
                <>
                  <div>
                    <label htmlFor="reg-name" className={labelCls}>Họ & tên *</label>
                    <input
                      id="reg-name"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Trần Hoàng Long"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-identifier" className={labelCls}>Email hoặc số điện thoại *</label>
                    <input
                      id="reg-identifier"
                      type="text"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="vidu@soccerhub.vn hoặc 0909…"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-password" className={labelCls}>Mật khẩu (tối thiểu 6 ký tự) *</label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputCls} pr-11`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2" aria-live="polite">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <span
                              key={i}
                              className={`h-1.5 flex-1 rounded-full ${i < strength ? STRENGTH_COLOR[strength] : "bg-slate-200"}`}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-[11px] font-bold text-slate-500">
                          Độ mạnh: {STRENGTH_LABEL[strength]}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className={labelCls} id="reg-role-label">Bạn là ai trên sân? *</span>
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="reg-role-label">
                      {ROLES.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          role="radio"
                          aria-checked={role === r.id}
                          onClick={() => setRole(r.id)}
                          className={`auth-role-card rounded-xl p-2.5 flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                            role === r.id ? "auth-role-card-active" : ""
                          }`}
                        >
                          {r.icon}
                          <span className="text-[11px] font-black leading-tight">{r.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      {ROLES.find((r) => r.id === role)?.desc}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {role === "PLAYER" && (
                      <div>
                        <label htmlFor="reg-position" className={labelCls}>Vị trí sở trường</label>
                        <select
                          id="reg-position"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          className={inputCls}
                        >
                          {POSITIONS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label htmlFor="reg-area" className={labelCls}>Khu vực thi đấu</label>
                      <select
                        id="reg-area"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className={inputCls}
                      >
                        {AREAS.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                    {role === "PLAYER" && (
                      <div>
                        <label htmlFor="reg-level" className={labelCls}>Trình độ</label>
                        <select
                          id="reg-level"
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className={inputCls}
                        >
                          {LEVELS.map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label htmlFor="reg-sport" className={labelCls}>Môn yêu thích</label>
                      <select
                        id="reg-sport"
                        value={favoriteSport}
                        onChange={(e) => setFavoriteSport(e.target.value)}
                        className={inputCls}
                      >
                        {SPORTS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Nav bước đăng ký */}
              <div className="flex items-center gap-2.5 pt-1">
                {mode === "register" && regStep === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setRegStep(1);
                      setErrorMsg(null);
                    }}
                    className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-shimmer flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý…</span>
                    </>
                  ) : regStep === 1 ? (
                    <>
                      <span>Tiếp tục</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tạo tài khoản</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Demo 1-click */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dành cho hội đồng chấm — vào ngay 1 chạm
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickDemoLogin("player@soccerhub.vn", "PLAYER")}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-200 transition-all disabled:opacity-50"
              >
                ⚽ Cầu Thủ
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickDemoLogin("owner@soccerhub.vn", "OWNER")}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-200 transition-all disabled:opacity-50"
              >
                🏟️ Chủ Sân
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickDemoLogin("organizer@soccerhub.vn", "ORGANIZER")}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-200 transition-all disabled:opacity-50"
              >
                🏆 Ban Tổ Chức
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              {mode === "login" ? (
                <>Chưa có tài khoản?{" "}
                  <button type="button" onClick={() => switchMode("register")} className="font-bold text-emerald-700 hover:underline">
                    Đăng ký miễn phí
                  </button>
                </>
              ) : (
                <>Đã có tài khoản?{" "}
                  <button type="button" onClick={() => switchMode("login")} className="font-bold text-emerald-700 hover:underline">
                    Đăng nhập
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
