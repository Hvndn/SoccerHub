"use client";

import React, { useMemo } from "react";
import {
  Trophy,
  Calendar,
  ChevronRight,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type {
  Tournament,
  TournamentBracketData,
  BracketMatch,
} from "@/lib/tournamentService";

interface UefaChampionsBracketProps {
  bracket: TournamentBracketData;
  tournament: Tournament;
  onSelectMatch: (match: BracketMatch, roundName?: string) => void;
  canManage?: boolean;
  isClosed?: boolean;
  myTeam?: any;
  savingMatch?: string | null;
  handleSaveScore?: (match: BracketMatch) => void;
  scores?: Record<string, { a: string; b: string }>;
  setScore?: (matchId: string, side: "a" | "b", val: string) => void;
  setConfirmUndo?: (match: BracketMatch) => void;
}

export default function UefaChampionsBracket({
  bracket,
  tournament,
  onSelectMatch,
  canManage = false,
  isClosed = false,
  myTeam,
  savingMatch,
  handleSaveScore,
  scores = {},
  setScore,
  setConfirmUndo,
}: UefaChampionsBracketProps) {
  const numRounds = bracket.rounds?.length || 0;

  // Trận chung kết ở trung tâm
  const finalRound = numRounds > 0 ? bracket.rounds[numRounds - 1] : null;
  const finalMatch = finalRound?.matches?.[0] || null;

  // Các vòng đấu dẫn tới chung kết (ngoài chung kết)
  const leadRounds = useMemo(() => {
    if (numRounds <= 1) return [];
    return bracket.rounds.slice(0, numRounds - 1);
  }, [bracket.rounds, numRounds]);

  // Chia đều linh hoạt theo số đội tham gia: Cánh Trái (Left Wing) và Cánh Phải (Right Wing)
  const { leftRounds, rightRounds } = useMemo(() => {
    const left: Array<{ name: string; roundIdx: number; matches: BracketMatch[] }> = [];
    const right: Array<{ name: string; roundIdx: number; matches: BracketMatch[] }> = [];

    leadRounds.forEach((r, ri) => {
      const total = r.matches?.length || 0;
      const half = Math.ceil(total / 2);
      const leftPart = (r.matches || []).slice(0, half);
      const rightPart = (r.matches || []).slice(half);

      left.push({ name: r.name, roundIdx: ri, matches: leftPart });
      right.push({ name: r.name, roundIdx: ri, matches: rightPart });
    });

    return { leftRounds: left, rightRounds: right };
  }, [leadRounds]);

  // Chiều cao tự động co giãn theo số lượng trận ở vòng đầu tiên
  const baseOuterMatches = Math.max(leftRounds[0]?.matches?.length || 1, 1);
  const canvasMinHeight = Math.max(baseOuterMatches * 145, 520);

  // Render thẻ đội bóng chuẩn UEFA Pill
  const renderTeamRow = (
    team: any,
    score: number | undefined,
    isWinner: boolean,
    isDone: boolean
  ) => {
    const isMy = Boolean(myTeam && team?.name && team.name === myTeam.teamName);
    const initial = (team?.name || "?").substring(0, 2);

    return (
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 transition-all ${
          isWinner
            ? "bg-gradient-to-r from-sky-400/25 via-sky-400/15 to-transparent text-white font-black"
            : "text-slate-200 font-semibold hover:bg-white/5"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Logo / Badge */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[13px] shrink-0 border ${
              isWinner
                ? "bg-sky-500 text-slate-950 border-sky-300 shadow-xs shadow-sky-500/50"
                : "bg-slate-800 text-sky-200 border-slate-700"
            }`}
          >
            {initial}
          </div>

          {/* Hạt giống (Seed) */}
          {team?.seed && (
            <span className="w-5 h-5 rounded-full bg-slate-800/90 border border-slate-700 text-sky-300 text-[13px] font-mono font-bold flex items-center justify-center shrink-0">
              {team.seed}
            </span>
          )}

          {/* Tên đội */}
          <span className="text-[13px] sm:text-[14px] truncate" title={team?.name}>
            {team?.name || (team?.tbd ? "Chờ xác định" : "TBD")}
          </span>

          {isWinner && <span className="text-amber-400 shrink-0">👑</span>}
          {isMy && (
            <span className="px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-300 text-[13px] font-bold border border-sky-400/50 shrink-0">
              Đội bạn
            </span>
          )}
        </div>

        {/* Tỷ số */}
        {isDone && typeof score === "number" && (
          <span
            className={`font-mono text-[14px] font-black px-2 py-0.5 rounded ${
              isWinner
                ? "bg-sky-400 text-slate-950 font-extrabold"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {score}
          </span>
        )}
      </div>
    );
  };

  // Render thẻ cặp đấu UEFA (Match Card)
  const renderUefaMatchCard = (
    match: BracketMatch,
    roundName: string,
    matchBadgeLabel?: string
  ) => {
    // Trường hợp trận có đội Miễn Vòng (BYE)
    if (match.status === "BYE" && match.bye) {
      return (
        <div
          onClick={() => onSelectMatch(match, roundName)}
          className="w-full min-w-[210px] max-w-[260px] p-3 rounded-xl bg-[#0c1f38]/90 border border-amber-500/40 text-amber-200 shadow-lg cursor-pointer hover:border-amber-400 transition-all select-none"
        >
          <div className="flex items-center justify-between gap-1 mb-1.5 text-[13px]">
            <span className="font-mono text-amber-400 font-bold">{matchBadgeLabel || match.matchId}</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[13px] font-black border border-amber-500/30">
              Miễn Vòng
            </span>
          </div>
          <div className="flex items-center gap-2 font-black text-[14px] text-white">
            <span className="text-amber-400">👑</span>
            <span className="truncate">{match.bye.name}</span>
          </div>
          <p className="text-[13px] text-slate-400 mt-1">Đã vào thẳng vòng tiếp theo</p>
        </div>
      );
    }

    const isDone = match.status === "DONE";
    const cur = scores[match.matchId] ?? {
      a: String(match.scoreA ?? 0),
      b: String(match.scoreB ?? 0),
    };
    const editable =
      canManage &&
      !isClosed &&
      match.status === "SCHEDULED" &&
      match.teamA &&
      !match.teamA.tbd &&
      match.teamB &&
      !match.teamB.tbd &&
      handleSaveScore &&
      setScore;

    return (
      <div className="relative group/card w-full min-w-[210px] max-w-[260px] select-none">
        {/* Khung thẻ chính phong cách UEFA broadcast */}
        <div
          onClick={() => onSelectMatch(match, roundName)}
          className={`cursor-pointer rounded-xl border backdrop-blur-md transition-all duration-200 overflow-hidden shadow-lg ${
            isDone
              ? "bg-[#0b1b36]/90 border-sky-400/40 hover:border-sky-300 hover:shadow-sky-500/20"
              : "bg-[#081326]/85 border-slate-700/80 hover:border-sky-400/60"
          }`}
        >
          {/* Header nhỏ: Mã trận & Lịch đấu */}
          <div className="px-2.5 py-1 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-[13px] text-slate-400">
            <span className="font-mono font-bold text-sky-400">
              {matchBadgeLabel || match.matchId}
            </span>
            <div className="flex items-center gap-1">
              {isDone ? (
                <span className="text-emerald-400 font-bold">Hết giờ</span>
              ) : match.matchDate ? (
                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="w-3 h-3 text-sky-400" />
                  {match.matchDate.split("-").slice(1).reverse().join("/")}
                </span>
              ) : (
                <span className="text-slate-400">Sắp đấu</span>
              )}
            </div>
          </div>

          {/* Hai hàng đội bóng */}
          <div className="divide-y divide-slate-800/60">
            {renderTeamRow(
              match.teamA,
              match.scoreA,
              Boolean(isDone && match.winner === match.teamA?.name),
              isDone
            )}
            {renderTeamRow(
              match.teamB,
              match.scoreB,
              Boolean(isDone && match.winner === match.teamB?.name),
              isDone
            )}
          </div>

          {/* Dải chân thẻ: Nút xem chi tiết */}
          <div className="px-2.5 py-1 bg-black/30 border-t border-slate-800/50 flex items-center justify-between text-[13px]">
            <span className="text-slate-400 flex items-center gap-1 group-hover/card:text-sky-300 transition-colors">
              <span>Chi tiết trận</span>
              <ChevronRight className="w-3 h-3 transition-transform group-hover/card:translate-x-0.5" />
            </span>
            {canManage && !isClosed && isDone && setConfirmUndo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmUndo(match);
                }}
                className="text-rose-400 hover:text-rose-300 font-bold hover:underline"
              >
                Huỷ KQ
              </button>
            )}
          </div>
        </div>

        {/* Khối nhập tỷ số nhanh cho Ban Tổ Chức (nếu đang ở trạng thái có thể đá) */}
        {editable && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-1.5 p-2 rounded-xl bg-slate-900/90 border border-sky-500/40 flex items-center gap-1.5"
          >
            <input
              type="number"
              min={0}
              value={cur.a}
              onChange={(e) => setScore && setScore(match.matchId, "a", e.target.value)}
              className="w-12 px-1.5 py-1 rounded bg-slate-800 text-white font-mono font-bold text-center text-[13px] border border-slate-700 focus:outline-none focus:border-sky-400"
            />
            <span className="text-slate-500 font-bold">-</span>
            <input
              type="number"
              min={0}
              value={cur.b}
              onChange={(e) => setScore && setScore(match.matchId, "b", e.target.value)}
              className="w-12 px-1.5 py-1 rounded bg-slate-800 text-white font-mono font-bold text-center text-[13px] border border-slate-700 focus:outline-none focus:border-sky-400"
            />
            <button
              type="button"
              disabled={savingMatch === match.matchId}
              onClick={() => handleSaveScore(match)}
              className="flex-1 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[13px] flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              {savingMatch === match.matchId ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              <span>Lưu</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-sky-900/50 bg-[#070e1f] text-white shadow-2xl">
      {/* Nền hiệu ứng Champions League sao đêm & vệt sáng Cyan */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,#0e3260_0%,#070e1f_70%,#040711_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf808_1px,transparent_1px),linear-gradient(to_bottom,#38bdf808_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Header Hoành Tráng: ROAD TO CHAMPION */}
      <div className="relative z-10 pt-8 pb-4 text-center px-4 space-y-1">
        <p className="text-[13px] sm:text-[14px] font-extrabold tracking-[0.25em] text-sky-400 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>CON ĐƯỜNG ĐẾN NGÔI VƯƠNG</span>
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </p>
        <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-cyan-300 drop-shadow-md">
          {tournament.title || "UEFA CHAMPIONS LEAGUE"}
        </h2>
        <p className="text-[13px] font-medium text-slate-400">
          {bracket.drawnAt
            ? `Bốc thăm chính thức: ${bracket.drawnAt.slice(0, 16).replace("T", " ")} • Sơ đồ linh hoạt ${bracket.teamCount || (bracket.rounds[0]?.matches?.length || 1) * 2} đội`
            : "Sơ đồ thi đấu trực tiếp"}
        </p>
      </div>

      {/* KHUNG CUỘN CHỨA CÂY NHÁNH ĐẤU ĐỐI XỨNG C1 */}
      <div className="relative z-10 p-4 sm:p-8 overflow-x-auto select-none">
        <div
          className="flex items-center justify-between min-w-[980px] lg:min-w-[1180px] gap-2 sm:gap-4 mx-auto"
          style={{ minHeight: `${canvasMinHeight}px` }}
        >
          {/* ======================================================== */}
          {/* CÁNH TRÁI (LEFT WING): NỬA TRÊN CỦA NHÁNH ĐẤU */}
          {/* ======================================================== */}
          <div className="flex-1 flex items-stretch justify-end gap-2 sm:gap-4">
            {leftRounds.map((lr, rIdx) => {
              const isLastLeft = rIdx === leftRounds.length - 1;
              const nextLeft = !isLastLeft ? leftRounds[rIdx + 1] : null;

              return (
                <React.Fragment key={`left-col-${rIdx}`}>
                  {/* Cột cặp đấu bên trái */}
                  <div className="flex flex-col justify-around py-2 w-[220px] sm:w-[250px] shrink-0">
                    {/* Tiêu đề vòng */}
                    <div className="text-center py-1.5 px-3 rounded-lg bg-slate-900/70 border border-sky-500/20 text-sky-300 text-[13px] font-bold mb-3 shadow-xs">
                      {lr.name}
                    </div>

                    {/* Danh sách trận */}
                    <div className="flex-1 flex flex-col justify-around gap-6">
                      {lr.matches.map((m, mIdx) => {
                        const totalRoundMatches = (bracket.rounds[lr.roundIdx]?.matches?.length || 1);
                        const badgeLabel =
                          totalRoundMatches >= 8
                            ? `R16-${mIdx + 1}`
                            : totalRoundMatches >= 4
                            ? `QF-${mIdx + 1}`
                            : `SF-1`;
                        return (
                          <div key={m.matchId || mIdx} className="w-full">
                            {renderUefaMatchCard(m, lr.name, badgeLabel)}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SVG CONNECTORS NỐI CỘT TRÁI SANG CỘT KẾ TIẾP (HƯỚNG VÀO GIỮA) */}
                  {nextLeft && (
                    <div className="w-10 sm:w-16 shrink-0 flex flex-col justify-around py-2">
                      <div className="h-[36px] mb-3" />
                      <div className="flex-1 flex flex-col justify-around">
                        {nextLeft.matches.map((_, pIdx) => {
                          const pA = lr.matches[2 * pIdx];
                          const pB = lr.matches[2 * pIdx + 1];
                          const topWin = pA?.status === "DONE" && pA.winner;
                          const botWin = pB?.status === "DONE" && pB.winner;

                          return (
                            <div key={`l-conn-${rIdx}-${pIdx}`} className="flex-1 relative flex items-center justify-center">
                              <svg className="w-full h-full overflow-visible" viewBox="0 0 50 100" preserveAspectRatio="none">
                                {/* Nối từ trận trên rẽ xuống */}
                                <path
                                  d="M 0 25 L 25 25 Q 35 25 35 35 L 35 50"
                                  fill="none"
                                  stroke={topWin ? "#38bdf8" : "#334155"}
                                  strokeWidth={topWin ? "3" : "2"}
                                />
                                {/* Nối từ trận dưới rẽ lên */}
                                <path
                                  d="M 0 75 L 25 75 Q 35 75 35 65 L 35 50"
                                  fill="none"
                                  stroke={botWin ? "#38bdf8" : "#334155"}
                                  strokeWidth={botWin ? "3" : "2"}
                                />
                                {/* Nhánh gộp đi thẳng tiếp sang phải */}
                                <path
                                  d="M 35 50 L 50 50"
                                  fill="none"
                                  stroke={topWin || botWin ? "#38bdf8" : "#334155"}
                                  strokeWidth={topWin || botWin ? "3" : "2"}
                                />
                                {/* Nút giao phát sáng */}
                                <circle
                                  cx="35"
                                  cy="50"
                                  r={topWin || botWin ? "3.5" : "2.5"}
                                  fill={topWin || botWin ? "#38bdf8" : "#64748b"}
                                />
                              </svg>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Nối từ Bán Kết 1 (SF-1) thẳng vào Cúp trung tâm */}
                  {isLastLeft && (
                    <div className="w-10 sm:w-16 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 50 100" preserveAspectRatio="none">
                        <path d="M 0 50 L 50 50" fill="none" stroke="#38bdf8" strokeWidth="3" />
                        <circle cx="50" cy="50" r="4" fill="#38bdf8" />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* TRUNG TÂM: CHIẾC CÚP VÔ ĐỊCH DANH GIÁ & TRẬN CHUNG KẾT */}
          {/* ======================================================== */}
          <div className="w-[280px] sm:w-[320px] shrink-0 flex flex-col items-center justify-center py-4 px-2 relative">
            {/* Vầng hào quang tỏa sáng phía sau cúp */}
            <div className="absolute w-48 h-48 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />

            {/* HUY HIỆU CÚP VÔ ĐỊCH CHAMPIONS LEAGUE SVG NGHỆ THUẬT */}
            <div className="relative mb-3 flex flex-col items-center">
              <div className="w-28 h-36 relative flex items-center justify-center drop-shadow-[0_10px_25px_rgba(56,189,248,0.4)]">
                <svg viewBox="0 0 100 125" className="w-full h-full">
                  <defs>
                    <linearGradient id="cupSilver" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f8fafc" />
                      <stop offset="25%" stopColor="#cbd5e1" />
                      <stop offset="50%" stopColor="#f1f5f9" />
                      <stop offset="75%" stopColor="#94a3b8" />
                      <stop offset="100%" stopColor="#e2e8f0" />
                    </linearGradient>
                    <linearGradient id="cupHandles" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#94a3b8" />
                      <stop offset="100%" stopColor="#64748b" />
                    </linearGradient>
                    <radialGradient id="cupShine" cx="50%" cy="30%" r="60%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Quai Cúp Tai Voi Trái */}
                  <path
                    d="M 34 24 C 10 24 6 58 36 68 L 36 62 C 14 54 18 30 34 30 Z"
                    fill="url(#cupHandles)"
                  />
                  {/* Quai Cúp Tai Voi Phải */}
                  <path
                    d="M 66 24 C 90 24 94 58 64 68 L 64 62 C 86 54 82 30 66 30 Z"
                    fill="url(#cupHandles)"
                  />
                  {/* Thân Cúp Chính */}
                  <path
                    d="M 32 20 L 68 20 C 66 58 60 76 50 82 C 40 76 34 58 32 20 Z"
                    fill="url(#cupSilver)"
                    stroke="#ffffff"
                    strokeWidth="0.8"
                  />
                  {/* Miệng cúp & viền */}
                  <ellipse cx="50" cy="20" rx="18" ry="4" fill="#ffffff" />
                  <ellipse cx="50" cy="20" rx="15" ry="2.5" fill="#64748b" />
                  {/* Ánh phản chiếu trên thân cúp */}
                  <ellipse cx="50" cy="45" rx="14" ry="25" fill="url(#cupShine)" />
                  {/* Ngôi sao UEFA trên cúp */}
                  <path
                    d="M 50 40 L 52 45 L 57 45 L 53 48 L 55 53 L 50 50 L 45 53 L 47 48 L 43 45 L 48 45 Z"
                    fill="#38bdf8"
                    opacity="0.9"
                  />
                  {/* Cổ cúp */}
                  <rect x="46" y="82" width="8" height="12" fill="url(#cupSilver)" />
                  {/* Đế Cúp 2 tầng */}
                  <path d="M 40 94 L 60 94 L 64 105 L 36 105 Z" fill="url(#cupSilver)" />
                  <rect x="32" y="105" width="36" height="6" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.5" />
                </svg>
              </div>

              {/* Huy hiệu Chung Kết Vàng */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/50 text-amber-300 text-[13px] font-black tracking-wide shadow-md">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>CHUNG KẾT TRANH CÚP</span>
              </div>
            </div>

            {/* Thẻ Trận Chung Kết */}
            {finalMatch ? (
              <div className="w-full">
                {renderUefaMatchCard(finalMatch, finalRound?.name || "Chung Kết", "CHUNG KẾT")}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-[13px]">
                Đang chờ xác định 2 đội tiến vào trận chung kết
              </div>
            )}

            {/* Banner Đội Vô Địch nếu trận Chung Kết đã xong */}
            {finalMatch?.status === "DONE" && finalMatch?.winner && (
              <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/30 via-amber-400/20 to-amber-500/30 border border-amber-400/60 text-center space-y-1 shadow-lg shadow-amber-500/10">
                <span className="text-[13px] font-extrabold text-amber-400 tracking-widest flex items-center justify-center gap-1">
                  <span>★</span>
                  <span>ĐỘI BÓNG VÔ ĐỊCH</span>
                  <span>★</span>
                </span>
                <h3 className="text-xl font-black text-white drop-shadow-sm">
                  👑 {finalMatch.winner}
                </h3>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* CÁNH PHẢI (RIGHT WING): NỬA DƯỚI CỦA NHÁNH ĐẤU (ĐỐI XỨNG) */}
          {/* ======================================================== */}
          <div className="flex-1 flex items-stretch justify-start gap-2 sm:gap-4">
            {/* Đảo ngược thứ tự các vòng để Bán kết nằm sát Cúp, Vòng ngoài cùng nằm xa nhất bên phải */}
            {rightRounds
              .slice()
              .reverse()
              .map((rr, rRevIdx) => {
                const originalIdx = rightRounds.length - 1 - rRevIdx;
                const isClosestToCup = rRevIdx === 0;

                return (
                  <React.Fragment key={`right-col-${originalIdx}`}>
                    {/* Nối từ Cúp trung tâm sang Bán Kết 2 (SF-2) */}
                    {isClosestToCup && (
                      <div className="w-10 sm:w-16 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 50 100" preserveAspectRatio="none">
                          <path d="M 0 50 L 50 50" fill="none" stroke="#38bdf8" strokeWidth="3" />
                          <circle cx="0" cy="50" r="4" fill="#38bdf8" />
                        </svg>
                      </div>
                    )}

                    {/* SVG CONNECTORS NỐI CỘT NGOÀI HƯỚNG VÀO TRONG BÊN PHẢI */}
                    {!isClosestToCup && (
                      <div className="w-10 sm:w-16 shrink-0 flex flex-col justify-around py-2">
                        <div className="h-[36px] mb-3" />
                        <div className="flex-1 flex flex-col justify-around">
                          {rightRounds[originalIdx]?.matches?.map((_, pIdx) => {
                            const outerMatches = rightRounds[originalIdx - 1]?.matches || [];
                            const pA = outerMatches[2 * pIdx];
                            const pB = outerMatches[2 * pIdx + 1];
                            const topWin = pA?.status === "DONE" && pA.winner;
                            const botWin = pB?.status === "DONE" && pB.winner;

                            return (
                              <div key={`r-conn-${originalIdx}-${pIdx}`} className="flex-1 relative flex items-center justify-center">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 50 100" preserveAspectRatio="none">
                                  {/* Nhánh gộp từ phải vào */}
                                  <path
                                    d="M 50 25 L 25 25 Q 15 25 15 35 L 15 50"
                                    fill="none"
                                    stroke={topWin ? "#38bdf8" : "#334155"}
                                    strokeWidth={topWin ? "3" : "2"}
                                  />
                                  <path
                                    d="M 50 75 L 25 75 Q 15 75 15 65 L 15 50"
                                    fill="none"
                                    stroke={botWin ? "#38bdf8" : "#334155"}
                                    strokeWidth={botWin ? "3" : "2"}
                                  />
                                  <path
                                    d="M 15 50 L 0 50"
                                    fill="none"
                                    stroke={topWin || botWin ? "#38bdf8" : "#334155"}
                                    strokeWidth={topWin || botWin ? "3" : "2"}
                                  />
                                  <circle
                                    cx="15"
                                    cy="50"
                                    r={topWin || botWin ? "3.5" : "2.5"}
                                    fill={topWin || botWin ? "#38bdf8" : "#64748b"}
                                  />
                                </svg>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Cột cặp đấu bên phải */}
                    <div className="flex flex-col justify-around py-2 w-[220px] sm:w-[250px] shrink-0">
                      {/* Tiêu đề vòng */}
                      <div className="text-center py-1.5 px-3 rounded-lg bg-slate-900/70 border border-sky-500/20 text-sky-300 text-[13px] font-bold mb-3 shadow-xs">
                        {rr.name}
                      </div>

                      {/* Danh sách trận */}
                      <div className="flex-1 flex flex-col justify-around gap-6">
                        {rr.matches.map((m, mIdx) => {
                          const totalRoundMatches = (bracket.rounds[rr.roundIdx]?.matches?.length || 1);
                          const baseIdx =
                            totalRoundMatches >= 8
                              ? 4 + mIdx + 1
                              : totalRoundMatches >= 4
                              ? 2 + mIdx + 1
                              : 2;
                          const badgeLabel =
                            totalRoundMatches >= 8
                              ? `R16-${baseIdx}`
                              : totalRoundMatches >= 4
                              ? `QF-${baseIdx}`
                              : `SF-2`;
                          return (
                            <div key={m.matchId || mIdx} className="w-full">
                              {renderUefaMatchCard(m, rr.name, badgeLabel)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
          </div>
        </div>
      </div>

      {/* DẢI GHI CHÚ CHÂN KHUNG NHÁNH ĐẤU */}
      <div className="relative z-10 p-3 sm:p-4 bg-slate-950/80 border-t border-sky-900/40 flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-400 inline-block" />
            <span className="text-slate-300 font-semibold">Đội chiến thắng đi tiếp</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" />
            <span>Sắp diễn ra</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sky-400 font-medium">
          <span>* Bấm vào bất kỳ cặp đấu nào để mở chi tiết trận đấu chuẩn FotMob/Flashscore</span>
        </div>
      </div>
    </div>
  );
}
