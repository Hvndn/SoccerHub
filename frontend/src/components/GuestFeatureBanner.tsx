"use client";

import React from "react";
import { LogIn, UserPlus } from "lucide-react";

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
  icon: Icon,
  onOpenAuth,
}: GuestFeatureBannerProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-5 stadium-shadow animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0369a1] text-white flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{title}</h2>
            <p className="text-[14px] text-slate-500">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => onOpenAuth("login")}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0b4f6c] font-bold text-[14px] flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng Nhập</span>
          </button>
          <button
            onClick={() => onOpenAuth("register")}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] shadow-sm flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Đăng Ký</span>
          </button>
        </div>
      </div>
    </div>
  );
}
