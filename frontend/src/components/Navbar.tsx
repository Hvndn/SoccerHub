"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import {
  Trophy,
  Users,
  ShieldCheck,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Calendar,
  Bell,
  Ticket,
  Star,
  Award,
  Cpu,
  User,
  Shield,
  Clock,
  ChevronDown,
  Flame,
  Zap,
  Building
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any | null;
  onOpenAuth: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onLogout: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onLogout
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Grouped Dropdown States
  const [showPitchMenu, setShowPitchMenu] = useState(false);
  const [showTournamentMenu, setShowTournamentMenu] = useState(false);

  const pitchMenuRef = useRef<HTMLDivElement>(null);
  const tournamentMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pitchMenuRef.current && !pitchMenuRef.current.contains(event.target as Node)) {
        setShowPitchMenu(false);
      }
      if (tournamentMenuRef.current && !tournamentMenuRef.current.contains(event.target as Node)) {
        setShowTournamentMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSubTab = (tabId: string) => {
    setActiveTab(tabId);
    setShowPitchMenu(false);
    setShowTournamentMenu(false);
    setShowNotifications(false);
    setShowUserDropdown(false);
  };

  const isPitchActive = ["booking", "urgent-resale", "post-match", "admin", "owner-onboarding", "multi-sport", "iot-console"].includes(activeTab);
  const isTournamentActive = ["community", "team-management", "tournaments", "organizer"].includes(activeTab);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300 w-full">
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-[50px] h-13 sm:h-16 flex items-center justify-between gap-1 sm:gap-4">
        {/* BRAND LOGO */}
        <div
          onClick={() => handleSelectSubTab("booking")}
          className="flex items-center space-x-1.5 cursor-pointer select-none shrink-0"
        >
          <div className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="VaoSan Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-sm sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              VAO<span className="text-[#0b4f6c] dark:text-sky-400">SAN</span>
            </span>
            <span className="hidden xs:inline-block px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 rounded-md shadow-xs">
              PRO
            </span>
          </div>
        </div>

        {/* CONSOLIDATED DESKTOP NAV */}
        <nav className="hidden lg:flex items-center space-x-2 shrink-0">
          {user?.role === "OWNER" ? (
            /* OWNER ROLE NAVBAR ITEMS */
            <>
              <button
                type="button"
                onClick={() => handleSelectSubTab("admin")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "admin"
                    ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span>Quản Lý Cụm Sân & Doanh Thu</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSubTab("iot-console")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "iot-console"
                    ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Zap className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                <span>Điều Hành IoT Đèn & Barrier</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSubTab("multi-sport")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "multi-sport"
                    ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Clock className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span>Sơ Đồ Ca Sân Realtime</span>
              </button>
            </>
          ) : (
            /* PLAYER / GUEST NAVBAR ITEMS */
            <>
              <button
                type="button"
                onClick={() => handleSelectSubTab("booking")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "booking"
                    ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Calendar className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span>Đặt Sân Bóng Đá</span>
              </button>

          {/* GROUP 1: TIỆN ÍCH SÂN & NHƯỢNG CA */}
          <div className="relative" ref={pitchMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowPitchMenu(!showPitchMenu);
                setShowTournamentMenu(false);
                setShowNotifications(false);
                setShowUserDropdown(false);
              }}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                isPitchActive && activeTab !== "booking"
                  ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Clock className="w-4.5 h-4.5 text-sky-500 shrink-0" />
              <span>Dịch Vụ & Nhượng Ca</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPitchMenu ? "rotate-180" : ""}`} />
            </button>

            {/* Pitch Dropdown Menu */}
            {showPitchMenu && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 z-50 animate-modal-pop">
                <button
                  type="button"
                  onClick={() => handleSelectSubTab("multi-sport")}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
                    activeTab === "multi-sport" ? "bg-slate-100 dark:bg-slate-800 font-black" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0b4f6c]/10 text-[#0b4f6c] dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                      <span>Ma Trận Sân Bóng Đá (Sân 5, 7, 11)</span>
                      <span className="text-[9px] px-1 bg-emerald-500 text-slate-950 rounded font-black">LIVE</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Sơ đồ cụm sân cỏ nhân tạo & Ghép kèo bóng đá</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSubTab("urgent-resale")}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
                    activeTab === "urgent-resale" ? "bg-slate-100 dark:bg-slate-800 font-black" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                      <span>Chợ Nhượng Ca Khẩn Cấp</span>
                      <span className="text-[9px] px-1 bg-rose-500 text-white rounded">HOT</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Đấu giá ca giờ vàng & Pass gấp -50%</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSubTab("post-match")}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
                    activeTab === "post-match" ? "bg-slate-100 dark:bg-slate-800 font-black" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                      <span>Tiện Ích Hậu Trận</span>
                      <span className="text-[9px] px-1 bg-emerald-500 text-white rounded">LIVE</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Chia tiền VietQR & Chấm MOTM</div>
                  </div>
                </button>

              </div>
            )}
          </div>

          {/* GROUP 2: GIẢI ĐẤU & CLB THỂ THAO */}
          <div className="relative" ref={tournamentMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowTournamentMenu(!showTournamentMenu);
                setShowPitchMenu(false);
                setShowNotifications(false);
                setShowUserDropdown(false);
              }}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                isTournamentActive
                  ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Trophy className="w-4.5 h-4.5 text-amber-500 shrink-0" />
              <span>Cộng Đồng & Giải Đấu</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTournamentMenu ? "rotate-180" : ""}`} />
            </button>

            {/* Tournament & Team Dropdown Menu */}
            {showTournamentMenu && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 z-50 animate-modal-pop">
                <button
                  type="button"
                  onClick={() => handleSelectSubTab("community")}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
                    activeTab === "community" ? "bg-slate-100 dark:bg-slate-800 font-black" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                      <span>Chợ Kèo Ghép Đội</span>
                      <span className="text-[9px] px-1 bg-sky-500 text-white rounded">Elo</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Ghép đối thủ & Thách đấu Elo</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSubTab("team-management")}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
                    activeTab === "team-management" ? "bg-slate-100 dark:bg-slate-800 font-black" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                      <span>Quản Lý Đội & CLB</span>
                      <span className="text-[9px] px-1 bg-indigo-500 text-white rounded">CLB</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Quỹ đội, Roster & Tuyển quân</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSubTab("tournaments")}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
                    activeTab === "tournaments" ? "bg-slate-100 dark:bg-slate-800 font-black" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">Giải Đấu & Bảng Xếp Hạng</div>
                    <div className="text-[10px] text-slate-400 font-medium">Cây nhánh đấu Interactive Bracket</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSubTab("organizer")}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
                    activeTab === "organizer" ? "bg-slate-100 dark:bg-slate-800 font-black" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                      <span>Cổng Ban Tổ Chức Pro</span>
                      <span className="text-[9px] px-1 bg-purple-500 text-white rounded">PRO</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Điều hành giải & Biên bản live</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSelectSubTab("membership")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "membership"
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Award className="w-4.5 h-4.5 text-amber-500 shrink-0" />
            <span>Thẻ Hội Viên</span>
          </button>
          </>
          )}
        </nav>

        {/* RIGHT SIDE WIDGETS */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          <div className="hidden xl:flex items-center space-x-3 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-sm font-bold font-mono">
            <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200">
              <Ticket className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400" />
              <span>50k Voucher</span>
            </div>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>850 MP</span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-sky-400 border border-slate-200 dark:border-slate-700/80 transition-all flex items-center justify-center shrink-0 active:scale-95"
            title={theme === "dark" ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0b4f6c] fill-[#0b4f6c] transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowPitchMenu(false);
                setShowTournamentMenu(false);
                setShowUserDropdown(false);
              }}
              className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700/80 transition-all"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="absolute top-1 right-1 sm:top-2 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3 z-50 animate-modal-pop">
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

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <div
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowPitchMenu(false);
                  setShowTournamentMenu(false);
                  setShowNotifications(false);
                }}
                className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer pl-1 py-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="text-right hidden sm:block max-w-[130px] md:max-w-[170px]">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                    {user.fullName || user.name || "Người Dùng"}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono flex items-center justify-end space-x-1 whitespace-nowrap">
                    <span className="text-[#0b4f6c] dark:text-sky-400 font-extrabold shrink-0">
                      {user.role === 'OWNER' ? 'Chủ Sân' : user.role === 'ORGANIZER' ? 'BTC' : 'Cầu Thủ Pro'}
                    </span>
                    <span className="shrink-0">• Elo {user.eloRating || 1450}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0b4f6c] dark:bg-sky-500 border-2 border-sky-400 text-white dark:text-slate-950 font-extrabold text-[10px] sm:text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {user.avatar || (user.fullName ? user.fullName.substring(0, 2).toUpperCase() : user.name ? user.name.substring(0, 2).toUpperCase() : "SH")}
                </div>
              </div>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1.5 z-50 animate-modal-pop">
                  <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate max-w-[140px]">
                        {user.fullName || user.name || "Người Dùng"}
                      </p>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#0b4f6c]/10 dark:bg-sky-400/20 text-[#0b4f6c] dark:text-sky-400">
                        {user.role === 'OWNER' ? 'Chủ Sân' : user.role === 'ORGANIZER' ? 'Ban Tổ Chức' : 'Cầu Thủ'}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                      {user.email || user.phone || ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSubTab("profile");
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                  >
                    <User className="w-4 h-4 text-sky-500" />
                    <span>Hồ Sơ VĐV & Rating</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSubTab("my-activities");
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span>Lịch Trình & Vé Đã Đặt</span>
                  </button>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng Xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-1 shrink-0">
              <button
                type="button"
                onClick={() => onOpenAuth("login")}
                className="px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-[10px] sm:text-xs transition-all border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white flex items-center space-x-0.5 sm:space-x-1 active:scale-95 shrink-0"
              >
                <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0b4f6c] dark:text-sky-400" />
                <span className="whitespace-nowrap">Đăng Nhập</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth("register")}
                className="px-3.5 py-2 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 hover:bg-[#07384d] dark:hover:bg-sky-400 text-white dark:text-slate-950 font-extrabold text-xs transition-all shadow-md hidden sm:flex items-center space-x-1 active:scale-95"
              >
                <span>Đăng Ký</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION DOCK (ROLE-BASED FOR MOBILE UX) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 py-1 px-1 sm:px-3 flex items-center justify-around shadow-2xl">
        {user?.role === "OWNER" ? (
          <>
            <button
              type="button"
              onClick={() => handleSelectSubTab("admin")}
              className={`px-1.5 sm:px-3 py-1 rounded-xl flex flex-col items-center text-[9px] sm:text-[10px] font-extrabold transition-all shrink-0 ${
                activeTab === "admin"
                  ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 text-emerald-500" />
              <span>Quản Lý</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSubTab("iot-console")}
              className={`px-1.5 sm:px-3 py-1 rounded-xl flex flex-col items-center text-[9px] sm:text-[10px] font-extrabold transition-all shrink-0 ${
                activeTab === "iot-console"
                  ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 text-amber-500" />
              <span>IoT Đèn</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSubTab("multi-sport")}
              className={`px-1.5 sm:px-3 py-1 rounded-xl flex flex-col items-center text-[9px] sm:text-[10px] font-extrabold transition-all shrink-0 ${
                activeTab === "multi-sport"
                  ? "text-[#0b4f6c] dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 text-sky-500" />
              <span>Sơ Đồ Ca</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSubTab("profile")}
              className={`px-1.5 sm:px-3 py-1 rounded-xl flex flex-col items-center text-[9px] sm:text-[10px] font-extrabold transition-all shrink-0 ${
                activeTab === "profile"
                  ? "text-[#0b4f6c] dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
              <span>Hồ Sơ</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleSelectSubTab("booking")}
              className={`px-1.5 sm:px-3 py-1 rounded-xl flex flex-col items-center text-[9px] sm:text-[10px] font-extrabold transition-all shrink-0 ${
                activeTab === "booking"
                  ? "text-[#0b4f6c] dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 text-emerald-500" />
              <span>Đặt Sân</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSubTab("urgent-resale")}
              className={`px-1.5 sm:px-3 py-1 rounded-xl flex flex-col items-center text-[9px] sm:text-[10px] font-extrabold transition-all shrink-0 ${
                activeTab === "urgent-resale"
                  ? "text-rose-500 bg-rose-50 dark:bg-rose-950/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 text-rose-500" />
              <span>Nhượng Ca</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSubTab("team-management")}
              className={`px-1.5 sm:px-3 py-1 rounded-xl flex flex-col items-center text-[9px] sm:text-[10px] font-extrabold transition-all shrink-0 ${
                activeTab === "team-management"
                  ? "text-[#0b4f6c] dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
              <span>Đội Bóng</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSubTab("tournaments")}
              className={`px-1.5 sm:px-3 py-1 rounded-xl flex flex-col items-center text-[9px] sm:text-[10px] font-extrabold transition-all shrink-0 ${
                activeTab === "tournaments"
                  ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 text-amber-500" />
              <span>Giải Đấu</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSubTab("profile")}
              className={`px-1.5 sm:px-3 py-1 rounded-xl flex flex-col items-center text-[9px] sm:text-[10px] font-extrabold transition-all shrink-0 ${
                activeTab === "profile"
                  ? "text-[#0b4f6c] dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
              <span>Hồ Sơ</span>
            </button>
          </>
        )}
      </div>
    </header>

  );
}
