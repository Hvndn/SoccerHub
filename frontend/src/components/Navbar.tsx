"use client";

import React, { useState } from "react";
import {
  Trophy,
  MapPin,
  Users,
  ShieldCheck,
  Zap,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Calendar,
  Bell,
  Ticket,
  Star,
  Award,
  ChevronDown,
  Sparkles
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onLogout: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onLogout
}: NavbarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextMode = !prev;
      if (nextMode) {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark-theme");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark-theme");
      }
      return nextMode;
    });
  };

  const navItems = [
    { id: "booking", label: "Khám phá & Đặt sân", icon: Calendar, badge: null },
    { id: "community", label: "Chợ Kèo Ghép Đội", icon: Users, badge: "Match" },
    { id: "tournaments", label: "Giải Đấu & BXH", icon: Trophy, badge: null },
    { id: "admin", label: "Lịch Hoạt Động & Chủ Sân", icon: ShieldCheck, badge: null }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
        {/* BRAND LOGO (STITCH SPEC) */}
        <div
          onClick={() => setActiveTab("booking")}
          className="flex items-center space-x-2.5 cursor-pointer select-none shrink-0"
        >
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="VaoSan Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              VAO<span className="text-[#0b4f6c] dark:text-sky-400">SAN</span>
            </span>
            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#0b4f6c] text-white rounded-md shadow-xs">
              PRO
            </span>
          </div>
        </div>

        {/* DESKTOP NAV LINKS (STITCH EXACT LABELS & ICONS) */}
        <nav className="hidden lg:flex items-center space-x-1 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  isActive
                    ? "bg-[#0b4f6c] text-white shadow-md"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                      isActive
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveTab("booking")}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Thẻ Hội Viên</span>
          </button>
        </nav>

        {/* RIGHT SIDE WIDGETS (STITCH EXACT SPEC) */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Voucher & Points Widget (Stitch Desktop Badge) */}
          <div className="hidden xl:flex items-center space-x-3 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs font-bold font-mono">
            <div className="flex items-center space-x-1 text-slate-800 dark:text-slate-200">
              <Ticket className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400" />
              <span>50k Voucher</span>
            </div>
            <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center space-x-1 text-slate-800 dark:text-slate-200">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>850 MP</span>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-sky-400 border border-slate-200 dark:border-slate-700/80 transition-all flex items-center justify-center shrink-0 active:scale-95"
            title="Chuyển đổi giao diện Đen / Trắng"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-[#0b4f6c] fill-[#0b4f6c] transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Realtime Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700/80 transition-all"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 z-50 animate-modal-pop">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">Thông Báo Mới</span>
                  <span className="text-[10px] text-emerald-500 font-bold">Realtime Live</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white block">⚡ Ca Vàng D-Sport Oasis</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Khung giờ 19:30 tối nay đã mở 1 ca nhượng lại. Đặt ngay để nhận Voucher 50k.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Info / Auth CTA Buttons */}
          {user ? (
            <div className="relative">
              <div
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 cursor-pointer pl-1.5 py-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                    {user.name || "Trần Hoàng Long"}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                    <span className="text-[#0b4f6c] dark:text-sky-400 font-extrabold">DUPR 3.0</span> • Elo {user.eloRating || 1450}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#0b4f6c] border-2 border-sky-400 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : "TL")}
                </div>
              </div>

              {/* User Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 z-50 animate-modal-pop">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-extrabold text-xs text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-[10px] font-mono text-slate-400">{user.email || "@long_pro10"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("booking");
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <span>🏆</span>
                    <span>Hồ Sơ Thể Thao & BXH</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenAuth("login")}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs transition-all border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white flex items-center space-x-1"
              >
                <LogIn className="w-3.5 h-3.5 text-[#0b4f6c] dark:text-sky-400" />
                <span>Đăng Nhập</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth("register")}
                className="px-3.5 py-2 rounded-xl bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs transition-all shadow-md hidden sm:flex items-center space-x-1 active:scale-95"
              >
                <span>Đăng Ký</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE NAV BAR */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-200 dark:border-slate-800 py-2 bg-white/95 dark:bg-slate-900/95 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`p-2 rounded-xl flex flex-col items-center text-[10px] font-bold transition-all relative ${
                isActive
                  ? "text-[#0b4f6c] dark:text-sky-400 font-black"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span>{item.label.split(" & ")[0]}</span>
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#0b4f6c] dark:bg-sky-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
