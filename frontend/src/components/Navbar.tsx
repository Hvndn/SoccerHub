"use client";

import React, { useState } from "react";
import { Trophy, MapPin, Users, CalendarCheck, ShieldCheck, Zap, Sun, Moon, LogIn, LogOut, Home, Lock } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onLogout: () => void;
}

export default function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onLogout }: NavbarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextMode = !prev;
      if (nextMode) {
        document.body.classList.add("dark-theme");
      } else {
        document.body.classList.remove("dark-theme");
      }
      return nextMode;
    });
  };

  const handleTabClick = (tabId: string) => {
    if (!user && tabId !== "landing") {
      // Prompt Auth Modal when guest clicks locked tabs
      onOpenAuth("login");
      return;
    }
    setActiveTab(tabId);
  };

  const navItems = [
    { id: "landing", label: "Trang Chủ", icon: Home, badge: null, locked: false },
    { id: "booking", label: "Đặt Sân & AI Gợi Ý", icon: MapPin, badge: "AI", locked: !user },
    { id: "tournaments", label: "Giải Đấu & Bracket", icon: Trophy, badge: null, locked: !user },
    { id: "community", label: "Cộng Đồng & Elo", icon: Users, badge: "Match", locked: !user },
    { id: "admin", label: "Chủ Sân & Báo Cáo", icon: ShieldCheck, badge: null, locked: !user },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-700/50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => setActiveTab("landing")}>
          <div className="w-11 h-11 rounded-xl bg-pitch-emerald flex items-center justify-center stadium-shadow shrink-0">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">KICK-<span className="text-pitch-emerald">ON</span></span>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase bg-emerald-600 text-white rounded-full shadow-sm">PRO</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Intelligent Pitch & Tournament Platform</p>
          </div>
        </div>

        {/* Desktop Nav Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 sm:space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center space-x-2 ${
                  isActive
                    ? "bg-pitch-emerald text-white shadow-lg shadow-pitch-emerald/30"
                    : item.locked
                    ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                    : "text-slate-700 hover:text-pitch-emerald hover:bg-emerald-50/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span className={isActive ? "text-white" : ""}>{item.label}</span>
                {item.locked && (
                  <Lock className="w-3 h-3 text-slate-400" />
                )}
                {item.badge && !item.locked && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                    isActive ? "bg-slate-900 text-pitch-lime" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Auth Buttons / User Profile */}
        <div className="flex items-center space-x-3">
          {/* Icon Only Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-pitch-lime border border-slate-200 dark:border-slate-700/80 transition-all flex items-center justify-center shadow-sm shrink-0 active:scale-95"
            title="Chuyển đổi giao diện Đen / Trắng"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-amber-400 fill-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-5 h-5 text-pitch-emerald fill-pitch-emerald transition-transform duration-300 -rotate-12 hover:rotate-0" />
            )}
          </button>

          {user ? (
            /* Logged In User State */
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                <span className="text-[11px] text-pitch-emerald font-semibold">{user.position || "Cầu thủ"} • {user.eloRating || 1200} Elo</span>
              </div>

              <div className="w-10 h-10 rounded-full bg-emerald-50 border-2 border-pitch-emerald flex items-center justify-center font-bold text-pitch-emerald text-xs shrink-0">
                {user.avatar || "FC"}
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Guest Auth Buttons */
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth("login")}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center space-x-1.5 border border-slate-200"
              >
                <LogIn className="w-3.5 h-3.5 text-pitch-emerald" />
                <span>Đăng Nhập</span>
              </button>
              <button
                onClick={() => onOpenAuth("register")}
                className="px-4 py-2 rounded-xl bg-pitch-emerald hover:bg-pitch-darkEmerald text-white font-bold text-xs transition-all shadow-md hidden sm:flex items-center space-x-1"
              >
                <span className="text-white">Đăng Ký</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-200 py-2.5 bg-white/90 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`p-2 rounded-xl flex flex-col items-center text-[10px] font-semibold transition-all ${
                isActive ? "bg-pitch-emerald text-white shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span>{item.label.split("&")[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
