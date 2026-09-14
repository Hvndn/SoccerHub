"use client";

import React from "react";
import { Sparkles, ArrowRight, ShieldCheck, Users, Trophy, Zap, CheckCircle2, User } from "lucide-react";

interface LandingHeroProps {
  onOpenAuth: (mode: "login" | "register") => void;
}

export default function LandingHero({ onOpenAuth }: LandingHeroProps) {
  const stats = [
    { label: "CỤM SÂN LIÊN KẾT", value: "120+", icon: ShieldCheck, color: "text-emerald-500" },
    { label: "CẦU THỦ & ĐỘI BÓNG", value: "8,500+", icon: Users, color: "text-emerald-500" },
    { label: "GIẢI ĐẤU ĐÃ TỔ CHỨC", value: "350+", icon: Trophy, color: "text-amber-500" },
    { label: "TỶ LỆ ĐẶT CA THÀNH CÔNG", value: "99.4%", icon: Zap, color: "text-rose-500" },
  ];

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50/30 via-white to-emerald-50/20 p-8 sm:p-14 lg:p-16 border border-slate-200/90 shadow-sm">
      {/* Background Soft Glows matching reference image */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-emerald-100/50 via-emerald-50/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-emerald-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-10 sm:space-y-12">
        {/* Main Hero Header Content */}
        <div className="max-w-3xl space-y-6 text-left">
          {/* Top Badge Ribbon */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-600 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 animate-pulse" />
            <span>KICK-ON PLATFORM V2.6 • HỆ THỐNG QUẢN LÝ SÂN BÓNG & GIẢI ĐẤU AI</span>
          </div>

          {/* Headline Matching Exact Line Breaks */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Nền Tảng Đặt Sân <br />
            & Tổ Chức Giải Đấu <span className="text-emerald-500">Thông <br /> Minh</span>
          </h1>

          {/* Subtitle Paragraph */}
          <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed max-w-2xl">
            Tự động gợi ý sân bóng tối ưu bằng AI, đặt ca chống trùng lịch bằng Redis Distributed Lock, bốc thăm giải đấu tương tác và ghép trận giao hữu theo chỉ số Elo chuẩn xác.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
            <button
              onClick={() => onOpenAuth("login")}
              className="px-6 py-3.5 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <span>Khám Phá Sân Bóng Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenAuth("register")}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-emerald-600 font-bold text-sm border border-slate-200 shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Đăng Ký Tài Khoản Mới</span>
            </button>
          </div>

          {/* Checkmarks Feature Highlights */}
          <div className="pt-2 flex flex-wrap gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" /> AI Gợi Ý Theo Vị Trí PostGIS</span>
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" /> Thanh Toán VietQR Tự Động</span>
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1.5 text-amber-500" /> Sơ Đồ Nhánh Đấu Bracket</span>
          </div>
        </div>

        {/* Thin Divider Line */}
        <div className="border-t border-slate-200/90" />

        {/* 4 Bottom Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className={`text-3xl sm:text-4xl font-extrabold ${stat.color} font-mono tracking-tight block`}>
                  {stat.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
