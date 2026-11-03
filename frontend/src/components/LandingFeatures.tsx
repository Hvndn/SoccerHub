"use client";

import React from "react";
import Reveal from "./Reveal";
import {
  ShieldCheck,
  Users,
  Trophy,
  Zap,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  PhoneOff,
  Store,
  Sparkles,
} from "lucide-react";

interface LandingFeaturesProps {
  onExplore: (role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
}

export default function LandingFeatures({ onExplore, onNavigateTab }: LandingFeaturesProps) {
  const pillars = [
    {
      id: "booking",
      title: "Đặt Sân & Chống Trùng Ca",
      badge: "Cầu Thủ",
      icon: Users,
      gradient: "from-[#0369a1] to-[#075985]",
      points: [
        "Tra cứu ca trống theo giờ",
        "Khoá ca tự động chống trùng",
        "Đặt cọc nhanh qua VietQR",
      ],
      metric: "3 bước đặt sân",
    },
    {
      id: "iot",
      title: "Quản Lý Sân & Doanh Thu",
      badge: "Chủ Sân",
      icon: ShieldCheck,
      gradient: "from-emerald-700 to-teal-600",
      points: [
        "Cấu hình giá theo khung giờ",
        "Quản lý lịch & duyệt tiền cọc",
        "Thống kê doanh thu trực quan",
      ],
      metric: "Tự động đối soát",
    },
    {
      id: "tournament",
      title: "Tổ Chức Giải Đấu Số",
      badge: "Ban Tổ Chức",
      icon: Trophy,
      gradient: "from-amber-600 to-orange-600",
      points: [
        "Tự động bốc thăm & chia nhánh",
        "Cập nhật tỷ số, BXH & Vua phá lưới",
        "Mời đội qua email hoặc mở tự do",
      ],
      metric: "Chuẩn thể thức VFF",
    },
    {
      id: "ai-form",
      title: "Chợ Kèo & Phong Độ",
      badge: "Cộng Đồng",
      icon: BrainCircuit,
      gradient: "from-purple-700 to-indigo-600",
      points: [
        "Ghép đối thủ cùng trình độ",
        "Chuỗi phong độ 5 trận gần nhất",
        "Hồ sơ CLB & lịch sử thi đấu",
      ],
      metric: "Kết nối đội bóng",
    },
  ];

  const traditionalIssues = [
    "Ghi sổ tay & Zalo dễ trùng lịch",
    "Bắt đối giao hữu dễ lệch trình độ",
    "Tính điểm, vẽ nhánh giải thủ công bằng Excel",
  ];

  const platformAdvantages = [
    "Khóa lịch tức thì trên hệ thống",
    "Đặt cọc VietQR & hoàn cọc minh bạch",
    "Tự động hóa lịch sân, cáp kèo & nhánh giải",
  ];

  return (
    <div className="space-y-8 sm:space-y-14">
      {/* --- SECTION 1: 4 TRỤ CỘT --- */}
      <section className="space-y-4 sm:space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0369a1]/10 text-[#0b4f6c] text-[13px] font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tính Năng Cốt Lõi</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Nền Tảng Thể Thao Số Toàn Diện
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {pillars.map((pillar, pi) => {
            const Icon = pillar.icon;
            return (
              <Reveal key={pillar.id} delay={pi * 60}>
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pillar.gradient} text-white flex items-center justify-center shadow-sm`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[13px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {pillar.badge}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      {pillar.title}
                    </h3>

                    <div className="space-y-2 pt-1">
                      {pillar.points.map((pt, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-[13px] font-bold text-slate-700">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[13px]">
                    <span className="text-sky-700 font-black">{pillar.metric}</span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* --- SECTION 2: SO SÁNH NHANH --- */}
      <section className="w-full bg-slate-100/80 p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-4">
        <h2 className="text-lg sm:text-2xl font-black text-slate-900 text-center">
          Truyền Thống vs Turfzone
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <PhoneOff className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Quản Lý Thủ Công</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[13px]">
                Dễ sai sót
              </span>
            </div>
            <div className="space-y-2">
              {traditionalIssues.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-rose-50/50 border border-rose-100">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="text-[13px] font-bold text-slate-800">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#0369a1]/40 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0369a1] text-white flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Nền Tảng Turfzone</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-extrabold text-[13px]">
                Tự động 99.9%
              </span>
            </div>
            <div className="space-y-2">
              {platformAdvantages.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-[#0369a1]/5 border border-[#0369a1]/15">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-[13px] font-bold text-slate-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 3: CTA BANNER --- */}
      <section className="rounded-2xl sm:rounded-3xl bg-white text-slate-900 p-5 sm:p-8 border border-slate-200 shadow-lg text-center space-y-4">
        <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Bắt Đầu Ngay Hôm Nay
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => onExplore("PLAYER")}
            className="px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[13px] sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Cổng Cầu Thủ</span>
          </button>

          <button
            type="button"
            onClick={() => onExplore("OWNER")}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-[13px] sm:text-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-[#0b4f6c]" />
            <span>Cổng Chủ Sân</span>
          </button>

          <button
            type="button"
            onClick={() => (onNavigateTab ? onNavigateTab("tournaments") : onExplore("ORGANIZER"))}
            className="px-5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 font-black text-[13px] sm:text-sm border border-sky-200 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Giải Đấu &amp; Nhánh Đấu</span>
          </button>
        </div>
      </section>
    </div>
  );
}
