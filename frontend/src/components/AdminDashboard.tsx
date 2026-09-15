"use client";

import React, { useState } from "react";
import { ShieldCheck, TrendingUp, Calendar, DollarSign, Settings, CheckCircle2, BarChart2 } from "lucide-react";

export default function AdminDashboard() {
  const [peakHourMultiplier, setPeakHourMultiplier] = useState(1.3);

  const monthlyData = [
    { month: "Tháng 4", revenue: 45000000, rate: 72 },
    { month: "Tháng 5", revenue: 52000000, rate: 78 },
    { month: "Tháng 6", revenue: 61000000, rate: 85 },
    { month: "Tháng 7", revenue: 58000000, rate: 81 },
    { month: "Tháng 8", revenue: 69000000, rate: 91 },
    { month: "Tháng 9 (Dự kiến)", revenue: 75000000, rate: 94 },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-pitch-emerald/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-pitch-emerald/10 border border-emerald-300 dark:border-pitch-emerald/30 text-emerald-800 dark:text-pitch-emerald text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4 text-pitch-emerald" />
              <span>Kick-ON Pro - Dashboard Chủ Sân & Quản Trị Viên</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Báo Cáo Doanh Thu & Điều Hành Ca Sân</h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">Theo dõi tỷ lệ lấp đầy ca sân real-time và cấu hình bảng giá linh hoạt Dynamic Pricing.</p>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tổng Doanh Thu Tháng 8</span>
          <span className="text-3xl font-extrabold text-pitch-emerald">69.000.000 đ</span>
          <span className="text-[11px] font-bold text-pitch-emerald flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> +18.9% so với tháng trước
          </span>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tỷ Lệ Lấp Đầy Trung Bình</span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">88%</span>
          <span className="text-[11px] font-bold text-pitch-emerald">Cao điểm 18:00 - 21:00 (96%)</span>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Lượt Đặt Ca Sân</span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">234 Ca</span>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">92% Đã cọc VietQR</span>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Chỉ Số Đánh Giá Sân</span>
          <span className="text-3xl font-extrabold text-amber-500">4.9 ★</span>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">128 Lượt đánh giá</span>
        </div>
      </div>

      {/* Revenue & Occupancy Monthly Chart Simulation */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
          <BarChart2 className="w-5 h-5 text-pitch-emerald mr-2" /> Biểu Đồ Doanh Thu & Tỷ Lệ Lấp Đầy Theo Tháng
        </h2>

        <div className="space-y-4">
          {monthlyData.map((item, idx) => (
            <div key={idx} className="space-y-1 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-900 dark:text-white">{item.month}</span>
                <span className="text-pitch-emerald">{item.revenue.toLocaleString('vi-VN')} đ ({item.rate}% lấp đầy)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-800">
                <div
                  className="bg-pitch-emerald h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Pricing Configuration Panel */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
          <Settings className="w-5 h-5 text-pitch-emerald mr-2" /> Cấu Hình Bảng Giá Dynamic Pricing
        </h2>

        <div className="bg-slate-50 dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-sm block">Hệ số giá giờ cao điểm (18:00 - 21:00)</span>
              <span className="text-slate-600 dark:text-slate-400">Tự động tăng giá ca sân theo thời gian thực khi tỷ lệ lấp đầy &gt; 80%</span>
            </div>
            <span className="text-xl font-extrabold text-pitch-emerald font-mono">x{peakHourMultiplier}</span>
          </div>

          <input
            type="range"
            min="1.0"
            max="1.8"
            step="0.1"
            value={peakHourMultiplier}
            onChange={(e) => setPeakHourMultiplier(Number(e.target.value))}
            className="w-full accent-pitch-emerald cursor-pointer"
          />

          <button className="px-4 py-2.5 rounded-xl bg-pitch-emerald text-white font-bold text-xs hover:bg-pitch-darkEmerald transition-colors flex items-center space-x-1.5 shadow-md">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span className="text-white">Lưu Cấu Hình Dynamic Pricing</span>
          </button>
        </div>
      </div>
    </div>
  );
}
