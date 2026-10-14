"use client";

import React, { useEffect, useState } from "react";
import { Users, MapPin, Trophy, Ticket, MessagesSquare, Wallet } from "lucide-react";
import CountUp from "../CountUp";
import Reveal from "../Reveal";
import { SectionCard } from "./AdminUI";
import { getAdminOverview, getRevenueReport, type AdminOverview } from "@/lib/adminService";
import { formatMoney } from "@/lib/tournamentService";

export default function AdminOverview({ notify }: { notify: (type: "ok" | "err", text: string) => void }) {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartIn, setChartIn] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setChartIn(true));
    return () => cancelAnimationFrame(raf);
  }, []);

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
        { label: "Người dùng", value: data.totalUsers, icon: <Users className="w-5 h-5" />, tone: "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300" },
        { label: "Cụm sân", value: data.totalPitches, icon: <MapPin className="w-5 h-5" />, tone: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" },
        { label: "Giải đấu (mở)", value: data.openTournaments, suffix: `/${data.totalTournaments}`, icon: <Trophy className="w-5 h-5" />, tone: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300" },
        { label: "Đơn đặt sân", value: data.totalBookings, icon: <Ticket className="w-5 h-5" />, tone: "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300" },
        { label: "Tin chợ kèo", value: data.totalMatchmakingPosts, icon: <MessagesSquare className="w-5 h-5" />, tone: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300" },
        { label: "Cọc thu (đ)", value: data.totalRevenue, money: true, icon: <Wallet className="w-5 h-5" />, tone: "bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-300" },
      ]
    : [];

  const monthly: any[] = Array.isArray(report?.monthlyChart) ? report.monthlyChart : [];
  const maxRev = Math.max(1, ...monthly.map((m) => Number(m.revenue) || 0));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {loading
          ? [0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <div className="skeleton-shimmer h-4 w-1/2 rounded-lg" />
                <div className="skeleton-shimmer h-7 w-2/3 rounded-lg" />
              </div>
            ))
          : kpis.map((k, i) => (
              <Reveal key={k.label} delay={Math.min(i, 5) * 70}>
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex items-center gap-3 h-full">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.tone}`}>
                    {k.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{k.label}</p>
                    <p className="font-mono font-black text-lg sm:text-xl text-slate-900 dark:text-white truncate">
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-900 dark:text-white text-sm">Doanh thu theo tháng</h3>
          {report && (
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Tổng tháng này: {formatMoney(report.totalRevenueThisMonth)} • Lấp đầy TB: {report.avgOccupancyRate}
            </span>
          )}
        </div>
        {loading ? (
          <div className="skeleton-shimmer h-40 w-full rounded-xl" />
        ) : monthly.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8">
            Chưa có dữ liệu báo cáo. {report === null ? "Backend /admin/revenue-report hiện trả số liệu mẫu." : ""}
          </p>
        ) : (
          <div className="flex items-end gap-2 h-44" role="img" aria-label="Biểu đồ doanh thu theo tháng">
            {monthly.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0 h-full justify-end">
                <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  {(Number(m.revenue) / 1000000).toFixed(0)}tr
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-sky-500 transition-all duration-700"
                  style={{ height: chartIn ? `${Math.max(4, Math.round((Number(m.revenue) / maxRev) * 100))}%` : "4%", transitionDelay: `${i * 60}ms` }}
                />
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate w-full text-center">
                  {String(m.month).replace(" (Dự kiến)", "*")}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
