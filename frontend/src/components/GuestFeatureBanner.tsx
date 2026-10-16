"use client";

import React from "react";
import { Sparkles, LogIn, UserPlus, CheckCircle2 } from "lucide-react";

interface GuestFeatureBannerProps {
  title: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  onOpenAuth: (mode: "login" | "register") => void;
}

export default function GuestFeatureBanner({
  title,
  description,
  features,
  icon: Icon,
  onOpenAuth,
}: GuestFeatureBannerProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-8 mb-6 sm:mb-8 stadium-shadow relative overflow-hidden animate-fade-in-up">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="hidden sm:inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0ea5e9]/15 text-[#0b4f6c] dark:text-sky-400 dark:bg-[#0ea5e9]/20 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#0b4f6c] dark:text-sky-400" />
            <span>Giới Thiệu Chức Năng</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0ea5e9] text-white flex items-center justify-center shrink-0 shadow-md">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
          </div>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {description}
          </p>

          <div className="hidden sm:flex flex-wrap gap-4 pt-1 text-xs font-bold text-slate-700 dark:text-slate-200">
            {features.map((feat, idx) => (
              <span key={idx} className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400 shrink-0" />
                <span>{feat}</span>
              </span>
            ))}
          </div>
        </div>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
          <button
            onClick={() => onOpenAuth("login")}
            className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#0b4f6c] dark:text-white font-bold text-xs border border-[#0ea5e9]/30 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <LogIn className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400" />
            <span>Đăng Nhập Ngay</span>
          </button>
          <button
            onClick={() => onOpenAuth("register")}
            className="px-5 py-3 rounded-2xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>Đăng Ký Tài Khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
}
