"use client";

import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/admin/AdminUI";

/**
 * Biểu đồ tiến độ giải đấu — số trận thắng của từng đội theo vòng.
 * Dữ liệu lấy từ bracketJson (rounds[].matches[]) hoặc match_results.
 */
export default function TournamentProgressChart({ tournament }: { tournament: any }) {
  const data = useMemo(() => {
    if (!tournament) return [];
    const rounds: any[] = tournament?.bracketJson?.rounds ?? tournament?.bracket?.rounds ?? [];
    const wins: Record<string, number> = {};
    const played: Record<string, number> = {};

    for (const r of rounds) {
      const matches = r?.matches ?? [];
      for (const m of matches) {
        const a = m?.teamA?.name ?? m?.teamA;
        const b = m?.teamB?.name ?? m?.teamB;
        const sa = Number(m?.scoreA ?? 0);
        const sb = Number(m?.scoreB ?? 0);
        if (a) { played[a] = (played[a] ?? 0) + 1; }
        if (b) { played[b] = (played[b] ?? 0) + 1; }
        if (a && sa > sb) wins[a] = (wins[a] ?? 0) + 1;
        if (b && sb > sa) wins[b] = (wins[b] ?? 0) + 1;
      }
    }

    // Nếu không có bracket, fallback sang teams của giải với winRate
    if (Object.keys(wins).length === 0 && Array.isArray(tournament?.teams)) {
      for (const t of tournament.teams) {
        const name = t?.teamName ?? t?.team?.name;
        if (!name) continue;
        wins[name] = Math.max(0, Math.round((t.winRate ?? 0) / 20));
        played[name] = t.played ?? 0;
      }
    }

    return Object.keys(wins)
      .map((name) => ({ team: name, wins: wins[name], played: played[name] ?? 0 }))
      .sort((a, b) => b.wins - a.wins || b.played - a.played)
      .slice(0, 12);
  }, [tournament]);

  if (!tournament) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mt-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-black text-sm text-slate-900">Tiến độ giải đấu — số trận thắng theo đội</h3>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Tính từ nhánh đấu (bracket) · {tournament.title ?? "Giải đấu"}
          </p>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-[13px] font-bold text-slate-500">
          Giải chưa có trận nào có kết quả. Bốc thăm và nhập tỷ số để xem biểu đồ.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 34)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#64748b" }}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="team"
              tick={{ fontSize: 12, fill: "#334155", fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
              formatter={(v: any, _n: any, p: any) => [`${v} thắng / ${p?.payload?.played ?? 0} trận`, "Thành tích"]}
            />
            <Bar dataKey="wins" fill="#0369a1" radius={[0, 8, 8, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}