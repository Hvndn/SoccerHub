"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3, PieChart as PieIcon, TrendingUp, Loader2 } from "lucide-react";
import { SectionCard } from "./AdminUI";
import { apiRequest } from "@/lib/api";
import { formatMoney } from "@/lib/tournamentService";

/** Bảng màu thương hiệu — dùng nhất quán với nút #0369a1. */
const BRAND = ["#0369a1", "#0d9488", "#f59e0b", "#e11d48", "#7c3aed", "#64748b"];

interface ChartCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
}

function ChartCard({ title, desc, icon, children, loading }: ChartCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-black text-sm text-slate-900">{title}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      {loading ? (
        <div className="h-56 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#0369a1]" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/** Tooltip dùng chung, format tiền kiểu Việt Nam. */
const moneyTip = (v: any) => [formatMoney(Number(v)), "Doanh thu"];
const countTip = (v: any) => [`${Number(v)} đơn`, "Số đơn"];

export default function AdminCharts() {
  const [overview, setOverview] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ov, rep, bks, ins] = await Promise.all([
          apiRequest<any>("/api/v1/admin/overview").catch(() => null),
          apiRequest<any>("/api/v1/admin/revenue-report").catch(() => null),
          apiRequest<any[]>("/api/v1/admin/bookings?limit=500").catch(() => []),
          apiRequest<any>("/api/v1/admin/insights").catch(() => null),
        ]);
        if (!alive) return;
        setOverview(ov);
        setReport(rep);
        setBookings(Array.isArray(bks) ? bks : []);
        setInsights(ins);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ------------------------------------------------------------------
  //  1. Doanh thu theo tháng (cột)
  // ------------------------------------------------------------------
  const revenueData = useMemo(() => {
    // Backend trả về `monthlyChart` (mảng {month, revenue, bookings, occupancyRate})
    const rows: any[] = report?.monthlyChart ?? report?.monthly ?? [];
    return rows.map((m: any) => ({
      month: String(m.month ?? "").replace(" (Dự kiến)", "*"),
      revenue: Number(m.revenue ?? 0),
      bookings: Number(m.bookings ?? m.count ?? 0),
    }));
  }, [report]);

  // ------------------------------------------------------------------
  //  2. Phân bố trạng thái đơn đặt sân (tròn)
  // ------------------------------------------------------------------
  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      const s = b?.status || "BOOKED";
      map.set(s, (map.get(s) ?? 0) + 1);
    }
    const label: Record<string, string> = {
      BOOKED: "Đã cọc",
      PLAYING: "Đang đá",
      COMPLETED: "Hoàn tất",
      CANCELLED: "Đã huỷ",
      RESALE: "Nhượng",
    };
    return Array.from(map.entries()).map(([k, v]) => ({
      name: label[k] ?? k,
      value: v,
    }));
  }, [bookings]);

  // ------------------------------------------------------------------
  //  3. Phân bố vai trò người dùng (tròn)
  // ------------------------------------------------------------------
  const roleData = useMemo(() => {
    const byRole = overview?.countByRole;
    if (byRole && typeof byRole === "object" && Object.keys(byRole).length) {
      const label: Record<string, string> = {
        PLAYER: "Cầu thủ",
        OWNER: "Chủ sân",
        ORGANIZER: "Ban tổ chức",
        ADMIN: "Quản trị",
      };
      return Object.entries(byRole)
        .filter(([, v]) => Number(v) > 0)
        .map(([k, v]) => ({ name: label[k] ?? k, value: Number(v) }));
    }
    return [];
  }, [overview]);

  // ------------------------------------------------------------------
  //  4. Đơn đặt theo ngày trong tuần (đường) — thể hiện nhu cầu theo thói quen chơi bóng
  // ------------------------------------------------------------------
  const weekdayData = useMemo(() => {
    // Nhãn ngắn gọn: CN (Chủ Nhật), T2..T7 (Thứ Hai → Thứ Bảy)
    const names = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const shortLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const counts = new Array(7).fill(0);
    const revenue = new Array(7).fill(0);
    for (const b of bookings) {
      if (!b?.bookingDate) continue;
      // yyyy-MM-dd -> parse an toàn theo giờ địa phương (tránh lệch múi giờ UTC)
      const parts = String(b.bookingDate).split("-");
      if (parts.length !== 3) continue;
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (isNaN(d.getTime())) continue;
      if (b.status === "CANCELLED") continue;
      const dow = d.getDay(); // 0 = Chủ Nhật
      counts[dow] += 1;
      revenue[dow] += (b.totalPrice ?? b.depositPaid ?? 0) + (b.cashDue ?? 0);
    }
    return names.map((n, i) => ({
      day: shortLabels[i],
      fullDay: n,
      bookings: counts[i],
      revenue: revenue[i],
    }));
  }, [bookings]);

  // ------------------------------------------------------------------
  //  5. Top cụm sân doanh thu (cột ngang)
  // ------------------------------------------------------------------
  const topPitchData = useMemo(
    () =>
      (insights?.topPitches ?? []).map((p: any) => ({
        name: String(p.pitchName ?? "—").length > 22
          ? String(p.pitchName).slice(0, 20) + "…"
          : p.pitchName,
        full: p.pitchName,
        revenue: Number(p.revenue ?? 0),
      })),
    [insights]
  );

  const emptyHint = (msg: string) => (
    <div className="h-56 flex flex-col items-center justify-center gap-2 text-center">
      <BarChart3 className="w-8 h-8 text-slate-300" />
      <p className="text-xs font-bold text-slate-500">{msg}</p>
    </div>
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Hàng 1: Doanh thu theo tháng + trạng thái đơn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard
          title="Doanh thu theo tháng"
          desc="Tiền cọc + tiền mặt đã thu, 6 tháng gần nhất"
          icon={<BarChart3 className="w-4 h-4" />}
          loading={loading}
        >
          {revenueData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
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
                  labelFormatter={(l) => "Tháng " + l}
                />
                <Bar dataKey="revenue" fill="url(#revGrad)" radius={[8, 8, 0, 0]} maxBarSize={46} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            emptyHint("Chưa có dữ liệu doanh thu.")
          )}
        </ChartCard>

        <ChartCard
          title="Trạng thái đơn đặt sân"
          desc="Phân bổ hiện tại của toàn bộ đơn trên hệ thống"
          icon={<PieIcon className="w-4 h-4" />}
          loading={loading}
        >
          {statusData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                  label={(e: any) => `${e.name}: ${e.value}`}
                  labelLine={false}
                  style={{ fontSize: 10, fontWeight: 700 }}
                >
                  {statusData.map((_d, i) => (
                    <Cell key={i} fill={BRAND[i % BRAND.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            emptyHint("Chưa có đơn đặt sân nào.")
          )}
        </ChartCard>
      </div>

      {/* Hàng 2: Nhu cầu theo ngày trong tuần + vai trò người dùng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard
          title="Nhu cầu đặt sân theo ngày trong tuần"
          desc="Giúp chủ sân chọn ngày mở ca có nhiều khách nhất"
          icon={<TrendingUp className="w-4 h-4" />}
          loading={loading}
        >
          {weekdayData.some((d) => d.bookings > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weekdayData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  width={34}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
formatter={countTip}
                  labelFormatter={(l) => {
                    const hit = weekdayData.find((d) => d.day === l);
                    return hit?.fullDay ?? l;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#0369a1"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#0369a1", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            emptyHint("Chưa đủ dữ liệu đặt sân để vẽ biểu đồ.")
          )}
        </ChartCard>

        <ChartCard
          title="Cơ cấu người dùng"
          desc="Số tài khoản theo vai trò trên hệ thống"
          icon={<PieIcon className="w-4 h-4" />}
          loading={loading}
        >
          {roleData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={roleData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                  label={(e: any) => `${e.name}: ${e.value}`}
                  labelLine={false}
                  style={{ fontSize: 10, fontWeight: 700 }}
                >
                  {roleData.map((_d, i) => (
                    <Cell key={i} fill={BRAND[i % BRAND.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            emptyHint("Chưa có dữ liệu người dùng.")
          )}
        </ChartCard>
      </div>

      {/* Hàng 3: Top cụm sân doanh thu */}
      <ChartCard
        title="Top cụm sân theo doanh thu"
        desc="5 cụm sân đóng góp doanh thu nhiều nhất trên hệ thống"
        icon={<BarChart3 className="w-4 h-4" />}
        loading={loading}
      >
        {topPitchData.length ? (
          <ResponsiveContainer width="100%" height={Math.max(200, topPitchData.length * 52)}>
            <BarChart
              data={topPitchData}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickFormatter={(v) => (v >= 1000000 ? (v / 1000000).toFixed(0) + "tr" : v / 1000 + "k")}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "#334155", fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                width={128}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={moneyTip}
                labelFormatter={(l) => {
                  const hit = topPitchData.find((p) => p.name === l);
                  return hit?.full ?? l;
                }}
              />
              <Bar dataKey="revenue" fill="#0369a1" radius={[0, 8, 8, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          emptyHint("Chưa có doanh thu để xếp hạng.")
        )}
      </ChartCard>
    </div>
  );
}
