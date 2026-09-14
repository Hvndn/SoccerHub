"use client";

import React from "react";
import { Sparkles, QrCode, Trophy, Users, ShieldCheck, Star, ArrowRight } from "lucide-react";

interface LandingFeaturesProps {
  onExplore: () => void;
}

export default function LandingFeatures({ onExplore }: LandingFeaturesProps) {
  const features = [
    {
      icon: Sparkles,
      title: "AI Gợi Ý Sân Bóng PostGIS",
      desc: "Tự động phân tích vị trí địa lý, ngân sách, loại sân (5/7/11 người) và khung giờ rảnh để đề xuất 3-5 cụm sân tối ưu nhất cho bạn.",
      color: "text-pitch-emerald",
      bg: "bg-pitch-emerald/10",
      border: "border-pitch-emerald/30"
    },
    {
      icon: QrCode,
      title: "Đặt Ca Ca Sân & VietQR Lock",
      desc: "Sử dụng Redis Distributed Lock để giữ ca sân tạm 5 phút, thanh toán cọc VietQR tự động và sinh vé QR Code check-in tại quầy.",
      color: "text-pitch-lime",
      bg: "bg-pitch-lime/10",
      border: "border-pitch-lime/30"
    },
    {
      icon: Trophy,
      title: "Tự Động Bốc Thăm & Bracket Tree",
      desc: "Khởi tạo giải đấu vòng tròn / loại trực tiếp, tự động sinh sơ đồ cây nhánh đấu interactive, tính điểm và cập nhật BXH live.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30"
    },
    {
      icon: Users,
      title: "Cộng Đồng Elo & Chợ Kèo Khẩn Cấp",
      desc: "Ghép trận giao hữu ngang trình Elo rating và hỗ trợ tìm cầu thủ viện trợ thiếu vị trí tức thời trước giờ bóng lăn.",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/30"
    }
  ];

  const testimonials = [
    {
      name: "Trần Tuấn Anh",
      role: "Đội Trưởng FC Phù Đổng Q7",
      comment: "Kick-ON giúp đội mình tìm kèo giao hữu cực kỳ chuẩn trình Elo. Đặt sân cọc VietQR nhanh 10 giây là có vé QR ngay!",
      rating: 5,
      avatar: "TA"
    },
    {
      name: "Nguyễn Minh Đức",
      role: "Chủ Cụm Sân ProHub Q7",
      comment: "Hệ thống quản lý ca sân của Kick-ON giúp cụm sân mình tăng 25% tỷ lệ lấp đầy ca trống nhờ tính năng Dynamic Pricing.",
      rating: 5,
      avatar: "MĐ"
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Feature Pillars Section */}
      <div className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1.5 rounded-full bg-pitch-emerald/10 border border-pitch-emerald/30 text-pitch-emerald text-xs font-extrabold uppercase tracking-wider">
            Tính Năng Vượt Trội
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">4 Trụ Cột Đột Phá Của Kick-ON</h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Giải pháp toàn diện số hóa toàn bộ quy trình đặt sân, tổ chức giải đấu và kết nối cộng đồng cầu thủ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`glass-panel p-8 rounded-3xl border ${item.border} hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between space-y-6 shadow-xl`}
              >
                <div className="space-y-4">
                  <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center border ${item.border}`}>
                    <Icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white leading-snug">{item.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>

                <button
                  onClick={onExplore}
                  className={`text-xs font-bold ${item.color} flex items-center space-x-1 hover:underline pt-2`}
                >
                  <span>Khám phá ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Testimonials */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-white">Được Tin Dùng Bởi Cầu Thủ & Chủ Sân</h3>
            <p className="text-xs text-slate-400 mt-1">Phản hồi từ cộng đồng hơn 8,500+ thành viên tại TP.HCM</p>
          </div>
          <div className="flex items-center space-x-1 text-amber-400 font-extrabold text-sm bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>4.9 / 5.0 Đánh giá hài lòng</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((item, idx) => (
            <div key={idx} className="bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm italic leading-relaxed">"{item.comment}"</p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-pitch-emerald/20 border-2 border-pitch-emerald font-bold text-pitch-emerald text-xs flex items-center justify-center">
                  {item.avatar}
                </div>
                <div>
                  <span className="font-bold text-white text-sm block">{item.name}</span>
                  <span className="text-xs text-slate-400">{item.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
