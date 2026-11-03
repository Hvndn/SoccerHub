"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Calendar,
  Search,
  Loader2,
  ChevronRight,
  Shield,
} from "lucide-react";
import { fetchTournaments, sportLabel } from "@/lib/tournamentService";

interface TeamClubManagementProps {
  user?: any;
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function TeamClubManagement({
  user,
  onNavigateTab,
}: TeamClubManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<"roster" | "matches">("roster");
  const [searchMember, setSearchMember] = useState("");
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const myPhone = (user?.phone ?? "").toString().replace(/\s/g, "");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchTournaments();
        if (alive) setTournaments(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (alive) setError(e?.message || "Không tải được danh sách giải");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const myTeams = useMemo(() => {
    if (!myPhone) return [];
    const out: any[] = [];
    for (const t of tournaments) {
      for (const z of t.teams ?? []) {
        if (String(z.captainPhone ?? "").replace(/\s/g, "") !== myPhone) continue;
        out.push({ ...z, tournament: t });
      }
    }
    return out;
  }, [tournaments, myPhone]);

  const primaryTeam = myTeams[0] ?? null;

  const myMatches = useMemo(() => {
    const out: any[] = [];
    if (!primaryTeam?.teamName) return out;
    for (const t of tournaments) {
      const team = (t.teams ?? []).find(
        (z: any) => String(z.captainPhone ?? "").replace(/\s/g, "") === myPhone
      );
      if (!team?.teamName || !t.bracketJson) continue;
      let bracket: any = null;
      try {
        bracket = JSON.parse(t.bracketJson);
      } catch {
        continue;
      }
      if (!Array.isArray(bracket?.rounds)) continue;
      for (const r of bracket.rounds) {
        for (const m of r.matches ?? []) {
          if (!m.teamA || !m.teamB) continue;
          const isA = m.teamA.name === team.teamName;
          const isB = m.teamB.name === team.teamName;
          if (!isA && !isB) continue;
          out.push({
            id: `${t.id}-${m.matchId}`,
            round: r.name ?? r.roundName ?? "Vòng",
            date: m.matchDate ?? "—",
            time: m.timeSlot ?? "—",
            pitch: m.pitchName ?? t.pitchName ?? t.location ?? "Chưa xếp sân",
            myTeam: isA ? m.teamA.name : m.teamB.name,
            opponent: isA ? m.teamB.name : m.teamA.name,
            status: m.status ?? "PENDING",
            score: m.status === "DONE" ? `${m.scoreA ?? 0} - ${m.scoreB ?? 0}` : "Chưa đấu",
            format: sportLabel(t.sportType),
          });
        }
      }
    }
    return out;
  }, [tournaments, primaryTeam, myPhone]);

  const subTabs = [
    { key: "roster", label: `Đội Đã Đăng Ký (${myTeams.length})`, icon: Users },
    { key: "matches", label: `Lịch Đấu Của Đội (${myMatches.length})`, icon: Calendar },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-300 p-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-600 text-[14px]">
            <Loader2 className="w-5 h-5 animate-spin text-[#0369a1]" /> Đang tải đội bóng của bạn…
          </div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-rose-600">{error}</p>
        ) : primaryTeam ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-200">
            <div className="w-14 h-14 rounded-lg bg-sky-50 border border-sky-200 text-[#0369a1] flex items-center justify-center shrink-0">
              <Shield className="w-7 h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-slate-900 truncate">{primaryTeam.teamName}</h2>
              <p className="text-[14px] text-slate-600 mt-0.5">
                Giải đang tham gia: <strong>{primaryTeam.tournament?.title || "—"}</strong> •{" "}
                {primaryTeam.tournament?.location || primaryTeam.tournament?.pitchName || "Chưa xếp sân"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5">
              <div>
                <p className="text-base font-bold text-emerald-700 font-mono">
                  {primaryTeam.record ?? "0-0-0"}
                </p>
                <p className="text-[12px] text-slate-600 font-semibold">Thành tích</p>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 font-mono">
                  {primaryTeam.memberCount ?? "—"}
                </p>
                <p className="text-[12px] text-slate-600 font-semibold">Cầu thủ</p>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 font-mono">{myTeams.length}</p>
                <p className="text-[12px] text-slate-600 font-semibold">Giải đấu</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-2.5 pb-4 border-b border-slate-200">
            <p className="text-[15px] font-bold text-slate-800">
              Bạn chưa đăng ký đội bóng nào trong giải đấu.
            </p>
            <p className="text-[14px] text-slate-600">
              Khi đăng ký tham gia giải đấu, đội bóng của bạn sẽ tự động hiển thị tại đây.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab?.("tournaments")}
              className="px-4 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] inline-flex items-center gap-1.5 cursor-pointer"
            >
              Xem Giải Đấu <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {subTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSubTab(tab.key)}
                className={`px-4 py-2 rounded-md text-[14px] font-bold border transition-colors cursor-pointer ${
                  activeSubTab === tab.key
                    ? "bg-[#0369a1] text-white border-[#0369a1]"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeSubTab === "roster" && myTeams.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="Tìm tên đội hoặc giải…"
                className="pl-9 pr-3 py-1.5 rounded-md border border-slate-300 bg-white text-[14px] w-full focus:outline-none focus:border-[#0369a1]"
              />
            </div>
          )}
        </div>
      </div>

      {activeSubTab === "roster" && (
        <div className="bg-white rounded-lg border border-slate-300 overflow-hidden">
          {myTeams.length === 0 ? (
            <p className="p-8 text-center text-[14px] text-slate-600">Chưa có đội bóng nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-slate-700">
                    <th className="p-3 font-bold">Tên Đội</th>
                    <th className="p-3 font-bold">Giải Đấu</th>
                    <th className="p-3 font-bold">Quân Số</th>
                    <th className="p-3 font-bold">Phong Độ</th>
                    <th className="p-3 font-bold">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {myTeams
                    .filter(
                      (z) =>
                        !searchMember ||
                        z.teamName.toLowerCase().includes(searchMember.toLowerCase()) ||
                        (z.tournament?.title ?? "").toLowerCase().includes(searchMember.toLowerCase())
                    )
                    .map((z, i) => (
                      <tr key={`${z.tournament?.id}-${i}`} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{z.teamName}</td>
                        <td className="p-3 text-slate-600">{z.tournament?.title || "—"}</td>
                        <td className="p-3 font-mono">{z.memberCount ?? "—"} người</td>
                        <td className="p-3 font-mono text-emerald-700 font-bold">
                          {z.record && z.record !== "0-0-0"
                            ? `${z.record} • Thắng ${z.winRate ?? 0}%`
                            : "Đội mới"}
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[13px]">
                            {z.registrationStatus === "CONFIRMED"
                              ? "Đã xác nhận"
                              : z.registrationStatus === "PENDING_PAYMENT"
                              ? "Chờ xác nhận cọc"
                              : z.registrationStatus || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "matches" && (
        <div className="bg-white rounded-lg border border-slate-300 overflow-hidden">
          {myMatches.length === 0 ? (
            <p className="p-8 text-center text-[14px] text-slate-600">
              Chưa có trận đấu nào được xếp lịch cho đội của bạn.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:gap-px bg-slate-200">
              {myMatches.map((m) => (
                <div
                  key={m.id}
                  className="p-4 bg-white flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-[15px] truncate">
                      {m.myTeam} <span className="text-slate-400 font-normal">vs</span> {m.opponent}
                    </p>
                    <p className="text-[13px] text-slate-600 mt-0.5 truncate">
                      {m.round} • {m.date} {m.time !== "—" ? `• ${m.time}` : ""} • {m.pitch}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-slate-900 text-[15px]">{m.score}</p>
                    <p
                      className={`text-[13px] font-bold ${
                        m.status === "DONE" ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {m.status === "DONE" ? "Đã kết thúc" : "Sắp diễn ra"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
