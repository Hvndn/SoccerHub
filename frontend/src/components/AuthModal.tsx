"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "register";
  initialRole?: "PLAYER" | "OWNER" | "ORGANIZER";
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export default function AuthModal({
  isOpen,
  initialMode = "login",
  initialRole = "PLAYER",
  onClose,
  onLoginSuccess
}: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [role, setRole] = useState<"PLAYER" | "OWNER" | "ORGANIZER">(initialRole);
  const [showPassword, setShowPassword] = useState(false);

  // Form inputs
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialMode) setMode(initialMode);
      if (initialRole) setRole(initialRole);
      setErrorMsg(null);
    }
  }, [isOpen, initialMode, initialRole]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Quick Demo Login Handler
  const handleQuickDemoLogin = async (demoEmail: string, demoRole: "PLAYER" | "OWNER" | "ORGANIZER") => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setRole(demoRole);
    try {
      const user = await login({ email: demoEmail, password: "123456" });
      onLoginSuccess({ ...user, role: demoRole, isNewOwner: false });
      onClose();
    } catch {
      // Fallback local demo account if backend offline
      const demoUser = {
        fullName: demoRole === "PLAYER" ? "Trần Hoàng Long" : demoRole === "OWNER" ? "Nguyễn Văn Sân" : "Lê Văn Giải",
        email: demoEmail,
        role: demoRole,
        position: demoRole === "PLAYER" ? "Cầu Thủ Pro" : demoRole === "OWNER" ? "Chủ Cụm Sân ProHub" : "Ban Tổ Chức Giải Đấu",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      setErrorMsg("Please enter your name or email.");
      return;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const user = await login({ email: cleanIdentifier, password });
        onLoginSuccess({ ...user, isNewOwner: false });
        onClose();
      } else {
        if (!fullName.trim()) {
          setErrorMsg("Please enter your full name.");
          setIsSubmitting(false);
          return;
        }

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier);
        const newUser = await register({
          fullName: fullName.trim(),
          email: isEmail ? cleanIdentifier : `${cleanIdentifier}@phone.turfzone.vn`,
          phone: isEmail ? undefined : cleanIdentifier,
          password: password,
          role: role,
          area: "Đà Nẵng (Hải Châu / Cẩm Lệ)",
          favoriteSport: "football7",
          level: "Bán chuyên"
        });
        onLoginSuccess({ ...newUser, isNewOwner: role === "OWNER" });
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      
      {/* Outer Card with exact aspect ratio and visual styling of Dribbble Shot */}
      <div 
        className="relative w-full max-w-[820px] aspect-[802/590] min-h-[560px] sm:min-h-[580px] rounded-lg overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.95)] my-auto select-none"
        style={{
          background: "radial-gradient(circle at 68% 28%, #6d4778 0%, #4c305c 35%, #2c1c43 70%, #1a122e 100%)"
        }}
      >
        
        {/* ============================================================
            BACKGROUND ARTWORK: EXACT CRISTIANO RONALDO + POLYGON CUTS
           ============================================================ */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Ronaldo Cutout on Left */}
          <img 
            src="/images/sports-ronaldo-cutout.png" 
            alt="Sports Superstar" 
            className="absolute left-0 bottom-0 top-0 h-full w-[49%] object-cover object-left-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
          />
          
          {/* Subtle lighting bloom on top right behind brand logo */}
          <div className="absolute -top-10 right-10 w-72 h-72 bg-[#a855f7]/30 rounded-full blur-[80px]" />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-40 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
          title="Close (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* ============================================================
            FOREGROUND CONTENT LAYER: EXACT LAYOUT FROM DRIBBLE SHOT
           ============================================================ */}
        <div className="relative z-20 w-full h-full flex flex-col justify-between p-6 sm:p-10 pl-[38%] sm:pl-[44%] pr-8 sm:pr-12">
          
          {/* 1. TOP RIGHT BRAND LOGO: 'TURFZONE' (Replacing 'FUTBALMANIA') */}
          <div className="flex items-center justify-end pt-1">
            <div className="flex items-center space-x-2">
              <img 
                src="/turfzone-logo-dark.png" 
                alt="TurfZone Logo" 
                className="h-7 sm:h-8 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
              />
              <span 
                className="text-2xl sm:text-3xl font-black italic tracking-wide uppercase text-white"
                style={{
                  fontFamily: "Impact, 'Arial Black', sans-serif",
                  letterSpacing: "0.04em",
                  textShadow: "0 0 20px rgba(192, 132, 252, 0.95), 0 0 35px rgba(168, 85, 247, 0.6)"
                }}
              >
                TURFZONE
              </span>
            </div>
          </div>

          {/* 2. MAIN CENTER SECTION: HEADLINE, INPUTS, SUBMIT BUTTON */}
          <div className="my-auto py-2">
            
            {/* Headline: 'ONLINE MEMBER LOGIN FOR PLAYERS' */}
            <div className="mb-6">
              <h1 
                className="text-2xl sm:text-[32px] leading-[1.1] font-black italic uppercase text-white tracking-wide"
                style={{
                  fontFamily: "Impact, 'Arial Black', sans-serif",
                  letterSpacing: "0.03em"
                }}
              >
                {mode === "login" ? (
                  <>
                    ONLINE MEMBER LOGIN <br />
                    FOR PLAYERS
                  </>
                ) : (
                  <>
                    ONLINE MEMBER REGISTER <br />
                    FOR PLAYERS
                  </>
                )}
              </h1>

              {/* Role Toggle Switch (Subtle Pill Style) */}
              <div className="flex items-center space-x-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => setRole("PLAYER")}
                  className={`text-[11px] font-black italic uppercase tracking-wider px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                    role === "PLAYER" 
                      ? "bg-purple-500/30 text-purple-200 border-b-2 border-purple-400" 
                      : "text-purple-300/50 hover:text-white"
                  }`}
                >
                  Cầu Thủ
                </button>
                <button
                  type="button"
                  onClick={() => setRole("OWNER")}
                  className={`text-[11px] font-black italic uppercase tracking-wider px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                    role === "OWNER" 
                      ? "bg-purple-500/30 text-purple-200 border-b-2 border-purple-400" 
                      : "text-purple-300/50 hover:text-white"
                  }`}
                >
                  Chủ Sân
                </button>
                <button
                  type="button"
                  onClick={() => setRole("ORGANIZER")}
                  className={`text-[11px] font-black italic uppercase tracking-wider px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                    role === "ORGANIZER" 
                      ? "bg-purple-500/30 text-purple-200 border-b-2 border-purple-400" 
                      : "text-purple-300/50 hover:text-white"
                  }`}
                >
                  Ban Tổ Chức
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-3 p-2 rounded bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs italic flex items-center space-x-1.5 animate-shake">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Inputs (NAME, PASSWORD, SUBMIT) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Extra Full Name input when mode is register */}
              {mode === "register" && (
                <div className="space-y-1">
                  <label 
                    className="block text-xs sm:text-[13px] font-black italic uppercase tracking-widest text-purple-200"
                    style={{ fontFamily: "'Arial Black', sans-serif" }}
                  >
                    FULL NAME
                  </label>
                  <div className="relative border-b border-purple-300/30 focus-within:border-purple-200 transition-colors pb-0.5">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Trần Hoàng Long"
                      className="w-full bg-transparent text-sm font-semibold italic text-white placeholder-purple-300/30 focus:outline-none py-1"
                      required
                    />
                  </div>
                </div>
              )}

              {/* NAME Field */}
              <div className="space-y-1">
                <label 
                  className="block text-xs sm:text-[13px] font-black italic uppercase tracking-widest text-purple-200"
                  style={{ fontFamily: "'Arial Black', sans-serif" }}
                >
                  NAME
                </label>
                <div className="relative border-b border-purple-300/30 focus-within:border-purple-200 transition-colors pb-0.5">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="player@soccerhub.vn hoặc tên tài khoản"
                    className="w-full bg-transparent text-sm font-semibold italic text-white placeholder-purple-300/30 focus:outline-none py-1"
                    required
                  />
                </div>
              </div>

              {/* PASSWORD Field */}
              <div className="space-y-1">
                <label 
                  className="block text-xs sm:text-[13px] font-black italic uppercase tracking-widest text-purple-200"
                  style={{ fontFamily: "'Arial Black', sans-serif" }}
                >
                  PASSWORD
                </label>
                <div className="relative border-b border-purple-300/30 focus-within:border-purple-200 transition-colors pb-0.5 flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm font-semibold italic text-white placeholder-purple-300/30 focus:outline-none py-1 tracking-wider"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-purple-300/50 hover:text-white transition-colors ml-2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* SUBMIT Button: Skewed trapezoid/diagonal dark button matching exact shot */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#241a39] hover:bg-[#2d2146] active:bg-[#1a1329] text-white font-black italic uppercase tracking-widest text-base shadow-[0_6px_20px_rgba(0,0,0,0.6)] border border-purple-500/25 hover:border-purple-400/50 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center space-x-2"
                  style={{
                    fontFamily: "Impact, 'Arial Black', sans-serif",
                    letterSpacing: "0.08em"
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                      <span>PROCESSING...</span>
                    </>
                  ) : (
                    <span>{mode === "login" ? "SUBMIT" : "CREATE ACCOUNT"}</span>
                  )}
                </button>
              </div>

              {/* Forgot password? Link */}
              <div className="text-center pt-0.5">
                {mode === "login" ? (
                  <button
                    type="button"
                    onClick={() => alert("Gợi ý: Bạn có thể chọn tài khoản Demo 1-chạm bên dưới để đăng nhập ngay mà không cần nhớ mật khẩu!")}
                    className="text-xs italic text-purple-200/70 hover:text-white transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-xs italic text-purple-200/70 hover:text-white transition-colors cursor-pointer"
                  >
                    Already have an account? Log in!
                  </button>
                )}
              </div>

            </form>
          </div>

          {/* 3. FOOTER SECTION: 'Play and win exciting prizes...' + 'Register here!' & Quick Demo Pills */}
          <div className="pt-2 pb-1 space-y-2 text-center">
            <div>
              <p className="text-[11px] sm:text-xs italic text-purple-200/60 leading-tight">
                Play and win exciting prizes and its absolutely free!
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setErrorMsg(null);
                }}
                className="text-xs sm:text-[13px] font-black italic text-white hover:text-purple-200 underline mt-0.5 transition-colors cursor-pointer"
              >
                {mode === "login" ? "Register here!" : "Back to login!"}
              </button>
            </div>

            {/* Mini 1-Click Demo Accounts Bar for Thesis Evaluators */}
            <div className="pt-2 border-t border-purple-300/15 flex items-center justify-center space-x-2">
              <span className="text-[10px] italic text-purple-300/60 font-semibold uppercase">Demo 1-Click:</span>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("player@soccerhub.vn", "PLAYER")}
                className="text-[10px] font-bold italic px-2 py-0.5 rounded bg-black/40 hover:bg-purple-900/40 text-purple-200 border border-purple-400/30 transition-all cursor-pointer"
              >
                ⚽ Cầu Thủ
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("owner@soccerhub.vn", "OWNER")}
                className="text-[10px] font-bold italic px-2 py-0.5 rounded bg-black/40 hover:bg-purple-900/40 text-purple-200 border border-purple-400/30 transition-all cursor-pointer"
              >
                🏟️ Chủ Sân
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("organizer@soccerhub.vn", "ORGANIZER")}
                className="text-[10px] font-bold italic px-2 py-0.5 rounded bg-black/40 hover:bg-purple-900/40 text-purple-200 border border-purple-400/30 transition-all cursor-pointer"
              >
                🏆 Ban Tổ Chức
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
