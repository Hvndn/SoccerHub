"use client";

import React, { useState } from "react";
import { User, Lock, Mail, Phone, MapPin, ShieldCheck, CheckCircle2, Trophy, Zap } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "register";
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, initialMode = "login", onClose, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [role, setRole] = useState<"PLAYER" | "OWNER" | "REFEREE">("PLAYER");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("Tiền Đạo (ST)");
  const [area, setArea] = useState("Quận 7, TP.HCM");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userPayload = {
      name: fullName || (mode === "login" ? "Nguyễn Văn Hùng" : "Cầu thủ Kick-ON"),
      email: email || "hung.nguyen@kickon.vn",
      role: role,
      eloRating: role === "PLAYER" ? 1200 : 1500,
      position: position,
      area: area,
      avatar: (fullName || "KH").substring(0, 2).toUpperCase()
    };
    onLoginSuccess(userPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-panel max-w-lg w-full rounded-3xl p-6 sm:p-10 space-y-6 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold transition-colors"
        >
          ✕
        </button>

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-pitch-emerald mx-auto flex items-center justify-center stadium-shadow">
            <Zap className="w-7 h-7 text-pitch-navy fill-pitch-navy" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {mode === "login" ? "Đăng Nhập Kick-ON" : "Đăng Ký Tài Khoản Mới"}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === "login" ? "Nhập thông tin để tiếp tục đặt sân và tham gia giải đấu." : "Tạo tài khoản để mở khóa AI gợi ý sân & chỉ số Elo."}
          </p>
        </div>

        {/* Switch Mode Tabs */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
              mode === "login" ? "bg-pitch-emerald text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
              mode === "register" ? "bg-pitch-emerald text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Đăng Ký Tài Khoản
          </button>
        </div>

        {/* Role Selection (For Register) */}
        {mode === "register" && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Chọn Vai Trò Tài Khoản
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole("PLAYER")}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                  role === "PLAYER" ? "bg-pitch-emerald/20 border-pitch-emerald text-pitch-lime" : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Cầu Thủ</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("OWNER")}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                  role === "OWNER" ? "bg-pitch-emerald/20 border-pitch-emerald text-pitch-lime" : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Chủ Sân</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("REFEREE")}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                  role === "REFEREE" ? "bg-pitch-emerald/20 border-pitch-emerald text-pitch-lime" : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Trọng Tài</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400">Họ và Tên</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn Hùng"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-pitch-emerald"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">Email hoặc Số điện thoại</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hung.nguyen@kickon.vn hoặc 0901234567"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-pitch-emerald"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-pitch-emerald"
              />
            </div>
          </div>

          {mode === "register" && role === "PLAYER" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400">Vị trí thi đấu</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-xs font-semibold text-white focus:outline-none focus:border-pitch-emerald"
                >
                  <option value="Tiền Đạo (ST)">Tiền Đạo (ST)</option>
                  <option value="Tiền Vệ (CM)">Tiền Vệ (CM)</option>
                  <option value="Hậu Vệ (CB)">Hậu Vệ (CB)</option>
                  <option value="Thủ Môn (GK)">Thủ Môn (GK)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400">Khu vực</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-xs font-semibold text-white focus:outline-none focus:border-pitch-emerald"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-pitch-emerald hover:bg-pitch-darkEmerald text-white font-extrabold text-xs transition-all shadow-lg shadow-pitch-emerald/30 stadium-shadow"
          >
            {mode === "login" ? "Đăng Nhập Ngay" : "Tạo Tài Khoản & Bắt Đầu"}
          </button>
        </form>
      </div>
    </div>
  );
}
