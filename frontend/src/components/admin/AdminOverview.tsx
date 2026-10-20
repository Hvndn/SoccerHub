"use client";

import React, { useEffect, useState } from "react";
import { Users, MapPin, Trophy, Ticket, MessagesSquare, Wallet } from "lucide-react";
import CountUp from "../CountUp";
import Reveal from "../Reveal";
import { SectionCard } from "./AdminUI";
import { getAdminOverview, getRevenueReport, cleanOrphanData, type AdminOverview } from "@/lib/adminService";
import AdminCharts from "./AdminCharts";
import { formatMoney } from "@/lib/tournamentService";

export default function AdminOverview({ notify }: { notify: (type: "ok" | "err", text: string) => void }) {
 const [data, setData] = useState<AdminOverview | null>(null);
 const [report, setReport] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 useEffect(() => {
 let alive = true;
 (async () => {
 try {
 const [ov, rep] = await Promise.all([
 getAdminOverview(),
 getRevenueReport().catch(() => null),
 ]);
 if (alive) {
 setData(ov);
 setReport(rep);
 }
 } catch (err: any) {
 if (alive) notify("err", err?.message || "Không tải được số liệu tổng quan.");
 } finally {
 if (alive) setLoading(false);
 }
 })();
 return () => {
 alive = false;
 };
 }, [notify]);

 const kpis = data
 ? [
 { label: "Người dùng", value: data.totalUsers, icon: <Users className="w-5 h-5" />, tone: "bg-sky-100 text-sky-700 " },
 { label: "Cụm sân", value: data.totalPitches, icon: <MapPin className="w-5 h-5" />, tone: "bg-sky-100 text-sky-800 " },
 { label: "Giải đấu (mở)", value: data.openTournaments, suffix: `/${data.totalTournaments}`, icon: <Trophy className="w-5 h-5" />, tone: "bg-amber-100 text-amber-700 " },
 { label: "Đơn đặt sân", value: data.totalBookings, icon: <Ticket className="w-5 h-5" />, tone: "bg-indigo-100 text-indigo-700 " },
 { label: "Tin chợ kèo", value: data.totalMatchmakingPosts, icon: <MessagesSquare className="w-5 h-5" />, tone: "bg-rose-100 text-rose-700 " },
 { label: "Cọc thu (đ)", value: data.totalRevenue, money: true, icon: <Wallet className="w-5 h-5" />, tone: "bg-sky-100 text-sky-800 " },
 ]
 : [];

 const monthly: any[] = Array.isArray(report?.monthlyChart) ? report.monthlyChart : [];
 const maxRev = Math.max(1, ...monthly.map((m) => Number(m.revenue) || 0));

 return (
 <div className="space-y-3 sm:space-y-5">
 <SectionCard>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h2 className="font-black text-slate-900 text-sm">Bảo trì dữ liệu</h2> <p className="hidden sm:block text-[13px] text-slate-500 mt-0.5">
 Xóa kết quả trận và bàn thắng mồ côi (giải đã bị xóa).
 </p>
 </div>
 <button
 type="button"
 onClick={async () => {
 try {
 const res = await cleanOrphanData();
 notify("ok", res.message);
 } catch (err: any) {
 notify("err", err?.message || "Dọn dữ liệu thất bại.");
 }
 }}
 className="shrink-0 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
 >
 Dọn dữ liệu mồ côi
 </button>
 </div>
 </SectionCard>

 <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
 {loading
 ? [0, 1, 2, 3, 4, 5].map((i) => (
 <div key={i} className="rounded-2xl bg-white border border-slate-200 p-3 sm:p-4 space-y-2">
 <div className="skeleton-shimmer h-4 w-1/2 rounded-lg" />
 <div className="skeleton-shimmer h-7 w-2/3 rounded-lg" />
 </div>
 ))
 : kpis.map((k, i) => (
 <Reveal key={k.label} delay={Math.min(i, 5) * 70}>
 <div className="rounded-2xl bg-white border border-slate-200 p-3 sm:p-4 flex items-center gap-3 h-full">
 <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.tone}`}>
 {k.icon}
 </div>
 <div className="min-w-0">
 <p className="text-[13px] font-bold text-slate-500 tracking-wide">{k.label}</p>
 <p className="font-mono font-black text-lg sm:text-xl text-slate-900 truncate">
 <CountUp
 value={k.value}
 format={(n) =>
 k.money
 ? `${Math.round(n).toLocaleString("vi-VN")}đ`
 : `${Math.round(n).toLocaleString("vi-VN")}${k.suffix ?? ""}`
 }
 />
 </p>
 </div>
 </div>
 </Reveal>
 ))}
 </div>

  <SectionCard>
  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
  <h3 className="font-black text-slate-900 text-sm">Tổng quan tháng</h3>
  {report && (
  <span className="text-[13px] font-mono text-slate-500">
  Tổng tháng này: {formatMoney(report.totalRevenueThisMonth)} • Lấp đầy TB: {report.avgOccupancyRate}
  </span>
  )}
  </div>
  {loading ? (
  <div className="skeleton-shimmer h-16 w-full rounded-xl" />
  ) : monthly.length === 0 ? (
  <p className="text-xs text-slate-500 text-center py-4">
  Chưa có dữ liệu doanh thu trong khoảng thời gian này.
  </p>
  ) : (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
  {monthly.map((m, i) => (
  <div key={i} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 min-w-0">
  <p className="text-[12px] font-bold text-slate-500 truncate">{String(m.month).replace(" (Dự kiến)", "*")}</p>
  <p className="font-mono font-black text-slate-900 text-[13px] truncate">{formatMoney(Number(m.revenue) || 0)}</p>
  </div>
  ))}
  </div>
  )}
  </SectionCard>
 {/* ===== BIỂU ĐỒ THỐNG KÊ (recharts) ===== */}
 <div className="pt-2">
 <div className="flex items-center gap-2 mb-3">
 <h3 className="font-black text-slate-900 text-sm">Biểu đồ thống kê</h3>
 <span className="text-[13px] text-slate-500">— dữ liệu trực tiếp từ CSDL</span>
 </div>
 <AdminCharts />
 </div>
 </div>
 );
}
