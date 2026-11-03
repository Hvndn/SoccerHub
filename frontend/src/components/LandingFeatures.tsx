"use client";

import React from "react";
import {
  ShieldCheck,
  Users,
  Trophy,
  CheckCircle2,
  Store,
  Calendar,
} from "lucide-react";

interface LandingFeaturesProps {
  onExplore: (role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
}

export default function LandingFeatures({ onExplore, onNavigateTab }: LandingFeaturesProps) {
  const services = [
    {
      id: "booking",
      title: "Đặt Sân Bóng Trực Tuyến",
      badge: "Cầu thủ",
      icon: Calendar,
      points: [
        "Xem bảng giờ trống thực tế của từng sân",
        "Giữ ca và thanh toán tiền cọc qua VietQR",
        "Đổi lịch hoặc hủy ca theo quy định chủ sân",
      ],
    },
    {
      id: "owner",
      title: "Quản Lý Cụm Sân & Lịch Đặt",
      badge: "Chủ sân",
      icon: ShieldCheck,
      points: [
        "Cài đặt khung giờ hoạt động và bảng giá",
        "Theo dõi lịch đặt sân, duyệt cọc và khóa ca",
        "Báo cáo doanh thu theo ngày và tháng",
      ],
    },
    {
      id: "tournament",
      title: "Tổ Chức & Quản Lý Giải Đấu",
      badge: "Ban tổ chức",
      icon: Trophy,
      points: [
        "Tạo giải đấu mở tự do hoặc mời qua email",
        "Bốc thăm chia bảng và tạo lịch thi đấu",
        "Cập nhật tỷ số, bảng xếp hạng và thẻ phạt",
      ],
    },
    {
      id: "matchmaking",
      title: "Tìm Đối Giao Hữu & Đội Bóng",
      badge: "Cộng đồng",
      icon: Users,
      points: [
        "Đăng tin tìm đối thủ giao lưu theo khung giờ",
        "Quản lý danh sách thành viên câu lạc bộ",
        "Trao đổi trực tiếp với chủ sân và đội bạn",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="border-b border-slate-300 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Dịch Vụ Trên Hệ Thống Turfzone
            </h2>
            <p className="text-[14px] text-slate-600">
              Đặt sân, tìm đối giao hữu và quản lý giải đấu bóng đá phong trào
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white rounded-lg p-5 border border-slate-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-300 text-[#0369a1] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[14px] font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {item.title}
                  </h3>

                  <div className="space-y-2 pt-1">
                    {item.points.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-[14px] text-slate-700">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 sm:p-6 border border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-slate-900">
            Bạn muốn đặt sân hoặc đăng ký quản lý cụm sân?
          </h3>
          <p className="text-[14px] text-slate-600">
            Chọn vai trò phù hợp để sử dụng đầy đủ chức năng của hệ thống.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => onExplore("PLAYER")}
            className="px-4 py-2.5 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] cursor-pointer flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Tài Khoản Cầu Thủ</span>
          </button>

          <button
            type="button"
            onClick={() => onExplore("OWNER")}
            className="px-4 py-2.5 rounded-md bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-[14px] cursor-pointer flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-[#0369a1]" />
            <span>Tài Khoản Chủ Sân</span>
          </button>

          <button
            type="button"
            onClick={() => (onNavigateTab ? onNavigateTab("tournaments") : onExplore("ORGANIZER"))}
            className="px-4 py-2.5 rounded-md bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-[14px] cursor-pointer flex items-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>Xem Giải Đấu</span>
          </button>
        </div>
      </section>
    </div>
  );
}
