"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, TrendingUp, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/admin/AdminUI";
import { apiRequest } from "@/lib/api";
import { formatMoney } from "@/lib/tournamentService";

const BRAND = ["#0369a1", "#0d9488", "#f59e0b", "#e11d48", "#7c3aed", "#64748b"];

function moneyTip(v: any) {
  return [formatMoney(Number(v)), "Doanh thu"];
}

export default function OwnerCharts({ activePitch }: { activePitch?: any }) {
  const [report, setReport] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [rep, st] = await Promise.all([
          apiRequest<any>("/api/v1/admin/revenue-report").catch(() => null),
          activePitch?.id
            ? apiRequest<any>(`/api/v1/pitches/${activePitch.id}/stats`).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (!alive) return;
        setReport(rep);
        setStats(st);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activePitch?.id]);

  const revenueData = useMemo(() => {
    const rows: any[] = report?.monthlyChart ?? [];
    return rows.map((m: any) => ({
      month: String(m.month ?? "").replace(" (Dự kiến)", "*"),
      revenue: Number(m.revenue ?? 0),
      bookings: Number(m.bookings ?? 0),
      occupancy: Number(m.occupancyRate ?? 0),
    }));
  }, [report]);

  // Doanh thu theo ca trong ngày (để chủ sân biết khung giờ nào hot)
  const hourData = useMemo(() => {
    const map = new Map<number, number>();
    const slots = stats?.hourlyBookings ?? stats?.slotsByHour;
    if (Array.isArray(slots)) {
      for (const s of slots) {
        const h = Number(s.hour ?? s.h ?? 0);
        const c = Number(s.count ?? s.bookings ?? 0);
        map.set(h, (map.get(h) ?? 0) + c);
      }
    }
    const result: { hour: string; bookings: number }[] = [];
    for (let h = 6; h <= 22; h++) {
      result.push({ hour: `${String(h).padStart(2, "0")}h`, bookings: map.get(h) ?? 0 });
    }
    return result;
  }, [stats]);

  const hasAnyBooking = revenueData.some((d) => d.bookings > 0) || hourData.some((d) => d.bookings > 0);

  const empty = (msg: string) => (
    <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
      <BarChart3 className="w-8 h-8 text-slate-300" />
      <p className="text-xs font-bold text-slate-500">{msg}</p>
    </div>
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Hàng 1: Doanh thu theo tháng + tỷ lệ lấp đầy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm text-slate-900">Doanh thu theo tháng</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">6 tháng gần nhất · tiền cọc + tiền mặt đã thu</p>
            </div>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0369a1]" />
            </div>
          ) : revenueData.some((d) => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={revenueData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="ownerRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(v) => (v >= 1000000 ? (v / 1000000).toFixed(0) + "tr" : v / 1000 + "k")}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={moneyTip}
                />
                <Bar dataKey="revenue" fill="url(#ownerRevGrad)" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            empty("Chưa có doanh thu trong 6 tháng gần nhất.")
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm text-slate-900">Tỷ lệ lấp đầy theo tháng</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Số ca đã bán / tổng số ca có thể bán</p>
            </div>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0369a1]" />
            </div>
          ) : revenueData.some((d) => d.bookings > 0) ? (
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={revenueData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  domain={[0, 100]}
                  unit="%"
                  axisLine={false}
                  tickLine={false}
                  width={38}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: any) => [`${v}%`, "Lấp đầy"]}
                />
                <Line
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#0369a1"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#0369a1", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            empty("Chưa có dữ liệu lấp đầy.")
          )}
        </div>
      </div>

      {/* Hàng 2: Nhu cầu theo khung giờ trong ngày */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-start gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-sm text-slate-900">Nhu cầu theo khung giờ trong ngày</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Giúp chủ sân biết giờ nào hot nhất để tăng giá giờ vàng
              {activePitch?.name ? ` · ${activePitch.name}` : ""}
            </p>
          </div>
        </div>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#0369a1]" />
          </div>
        ) : hourData.some((d) => d.bookings > 0) ? (
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={hourData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fill: "#64748b" }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748b" }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v: any) => [`${v} đơn`, "Số đơn"]}
              />
              <Bar dataKey="bookings" fill="#0369a1" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          empty("Chưa đủ dữ liệu đặt sân để vẽ biểu đồ khung giờ.")
        )}
      </div>
    </div>
  );
}