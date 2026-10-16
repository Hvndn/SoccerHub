"use client";

import React, { useEffect, useState } from "react";
import MatchmakingMarketplace from "./MatchmakingMarketplace";
import TournamentLeaderboard from "./TournamentLeaderboard";
import TournamentOrganizerPortal from "./TournamentOrganizerPortal";
import { fetchTournaments } from "@/lib/tournamentService";
import { apiUrl } from "@/lib/api";
import FormDots from "./FormDots";
import { Users, Trophy, Cpu, PlusCircle, Sparkles, ShieldCheck, Flame, Radio } from "lucide-react";

interface CommunityFormProps {
  user?: any;
  onSelectSlot?: any;
  defaultSubTab?: "matchmaking" | "tournaments" | "organizer";
  onOpenAuth?: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
}

export default function CommunityForm({ user, onSelectSlot, defaultSubTab = "matchmaking", onOpenAuth }: CommunityFormProps) {
  const [subTab, setSubTab] = useState<"matchmaking" | "tournaments" | "organizer" | "formboard">(defaultSubTab as any);
  const [tournamentCount, setTournamentCount] = useState<number | null>(null);
  const [formBoard, setFormBoard] = useState<any[]>([]);

  // Bảng phong độ đội (tính từ lịch sử thi đấu thật, không điểm số)
  useEffect(() => {
    if (subTab !== "formboard" || formBoard.length > 0) return;
    let alive = true;
    fetch(apiUrl("/api/v1/community/players/leaderboard"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!alive) return;
        const rows = Array.isArray(d) ? d : [];
        // Chỉ nhận dòng bảng-phong-độ mới (có teamName); API cũ trả users thì coi như trống.
        setFormBoard(rows.filter((r: any) => r.teamName != null));
      })
      .catch(() => { /* backend chưa lên */ });
    return () => { alive = false; };
  }, [subTab]);

  // Badge "N giải" lấy từ CSDL (cache dùng chung — không gọi API trùng lặp)
  useEffect(() => {
    let alive = true;
    fetchTournaments()
      .then((list) => { if (alive) setTournamentCount(list.length); })
      .catch(() => { /* backend chưa lên — giữ nguyên dấu "—" */ });
    return () => { alive = false; };
  }, []);

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-10 sm:pb-16">
      {/* ========================================================= */}
      {/* HEADER COCKPIT BANNER: CỘNG ĐỒNG CẦU THỦ & GIẢI ĐẤU PRO     */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm relative isolate overflow-hidden transition-colors">
        <div className="hidden sm:block absolute -z-10 top-0 right-0 w-80 h-80 bg-sky-50/60 dark:bg-sky-950/40 rounded-full blur-3xl pointer-events-none" />
        <div className="hidden sm:block absolute -z-10 -bottom-10 left-1/3 w-72 h-72 bg-sky-50/50 dark:bg-sky-950/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-sky-50 text-sky-700 border border-sky-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                Chuẩn Phong Độ Phủi 4.0
              </span>
            </div>

            <h1 className="text-lg sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Cộng Đồng Kèo Cáp &amp; Giải Đấu Bóng Đá</span>
              <Trophy className="w-7 h-7 text-amber-700 hidden sm:inline-block shrink-0" />
            </h1>

            <p className="hidden sm:block text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-medium">
              Không gian thi đấu toàn diện cho Cầu thủ, Đội bóng & Ban tổ chức: Ghép kèo cáp theo phong độ 5 trận gần nhất, tham gia các giải đấu phong trào quy mô lớn và điều hành nhánh đấu Knockout với Tòa Trọng Tài VAR.
            </p>
          </div>

          {/* User Quick Badge */}
          {user && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3 shrink-0 self-start lg:self-auto shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#0ea5e9] text-white font-black text-sm flex items-center justify-center shadow-xs">
                {user.fullName ? user.fullName.charAt(0) : "U"}
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{user.fullName || user.name || "Cầu Thủ"}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-extrabold border border-amber-200">
                    {user?.level ?? "Cầu thủ"}
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  {user.role === "OWNER" ? "Chủ Sân" : "Cầu Thủ Phủi Tự Do"} • Sẵn sàng nhận kèo
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* TAB CHUYỂN ĐỔI CHÍNH 3 TRỤ CỘT CỦA CỘNG ĐỒNG             */}
        {/* ========================================================= */}
        <div className="relative z-10 mt-3 sm:mt-6 pt-3 sm:pt-5 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1.5 max-w-full scroll-smooth">
          <button
            type="button"
            onClick={() => setSubTab("matchmaking")}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              subTab === "matchmaking"
                ? "bg-[#0ea5e9] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60"
            }`}
          >
            <Users className={`w-4 h-4 ${subTab === "matchmaking" ? "text-sky-100" : "text-sky-700"}`} />
            <span className="sm:hidden">Chợ Kèo</span>
            <span className="hidden sm:inline">1. Chợ Kèo Ghép Đội &amp; Phong Độ</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">HOT</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("tournaments")}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              subTab === "tournaments"
                ? "bg-[#0ea5e9] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60"
            }`}
          >
            <Trophy className={`w-4 h-4 ${subTab === "tournaments" ? "text-amber-200" : "text-amber-700"}`} />
            <span className="sm:hidden">Giải Đấu</span>
            <span className="hidden sm:inline">2. Danh Sách Giải Đấu &amp; Nhánh Bracket</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-900 font-black border border-sky-200">
              {tournamentCount === null ? "…" : `${tournamentCount} GIẢI`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("organizer")}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              subTab === "organizer"
                ? "bg-[#0ea5e9] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60"
            }`}
          >
            <Cpu className={`w-4 h-4 ${subTab === "organizer" ? "text-sky-100" : "text-sky-600"}`} />
            <span className="sm:hidden">Điều Hành</span>
            <span className="hidden sm:inline">3. Điều Hành Giải Đấu &amp; Tòa VAR AI</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-800 font-black border border-sky-200">BTC PRO</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("formboard")}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              subTab === "formboard"
                ? "bg-[#0ea5e9] text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60"
            }`}
          >
            <Flame className={`w-4 h-4 ${subTab === "formboard" ? "text-amber-200" : "text-amber-700"}`} />
            <span className="sm:hidden">Phong Độ</span>
            <span className="hidden sm:inline">4. BXH Phong Độ 5 Trận</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* NỘI DUNG TƯƠNG ỨNG THEO SUBTAB                             */}
      {/* ========================================================= */}
      <div className="w-full">
        {subTab === "matchmaking" && (
          <MatchmakingMarketplace user={user} onSelectMatch={onSelectSlot} />
        )}

        {subTab === "tournaments" && (
          <TournamentLeaderboard
            user={user}
            onBackToHome={() => setSubTab("matchmaking")}
            onRequestLogin={onOpenAuth ? () => onOpenAuth("login", "PLAYER") : undefined}
          />
        )}

        {subTab === "organizer" && (
          <TournamentOrganizerPortal />
        )}

        {subTab === "formboard" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-700" />
                Bảng Phong Độ (lịch sử thật, không điểm số)
              </h3>
              <span className="text-[11px] text-slate-500">Top {formBoard.length} đội • xếp theo tỷ lệ thắng</span>
            </div>
            {formBoard.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Chưa có đội nào có lịch sử thi đấu. Nhập kết quả trận đấu trong giải để bảng tự cập nhật.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full text-xs border-collapse min-w-[520px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th scope="col" className="py-2 pr-2 font-bold">#</th>
                      <th scope="col" className="py-2 pr-2 font-bold">Đội Bóng</th>
                      <th scope="col" className="py-2 pr-2 font-bold">5 Trận Gần Nhất</th>
                      <th scope="col" className="py-2 pr-2 font-bold text-center">T-H-B</th>
                      <th scope="col" className="py-2 font-bold text-right">Thắng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formBoard.map((r: any) => (
                      <tr key={r.teamName ?? r.name ?? r.rank} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                        <td className="py-2.5 pr-2 font-black text-slate-500">{r.rank}</td>
                        <td className="py-2.5 pr-2 font-bold text-slate-900 dark:text-white truncate max-w-[160px]">{r.teamName ?? r.name ?? "—"}</td>
                        <td className="py-2.5 pr-2"><FormDots form={r.form} size="sm" /></td>
                        <td className="py-2.5 pr-2 text-center font-mono font-bold text-slate-600 dark:text-slate-300">{r.record ?? "0-0-0"}</td>
                        <td className="py-2.5 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">{r.winRate ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
