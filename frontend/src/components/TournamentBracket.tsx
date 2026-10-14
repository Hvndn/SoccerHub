"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  RefreshCw,
  Award,
  Shield,
  Check,
  ListOrdered,
  Video,
  Flame,
  Clock,
  Users,
  Play,
  Pause,
  RotateCcw,
  FileText,
  QrCode,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Shuffle,
  UserPlus,
  Calendar
} from "lucide-react";
import DrawLotteryOverlay from "./DrawLotteryOverlay";
import { ConfirmModal } from "./admin/AdminUI";
import {
  Tournament,
  fetchTournaments,
  subscribeTournaments,
  fillSimulatedTeams,
  clearSimulatedTeams,
  drawTournamentBracket,
  confirmTeamPayment,
  saveMatchResult,
  registeredCount,
  isFull as isTournamentFull,
  fillPercent,
  formatDate,
  sportLabel,
  formatLabel,
  type TournamentBracketData,
  type BracketMatch,
} from "@/lib/tournamentService";

export default function TournamentBracket() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [fillBusy, setFillBusy] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);
  const [drawBusy, setDrawBusy] = useState(false);
  const [confirmingTeam, setConfirmingTeam] = useState<string | null>(null);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});
  const [scorerOpen, setScorerOpen] = useState<Record<string, boolean>>({});
  const [scorerRows, setScorerRows] = useState<Record<string, { player: string; team: string; goals: string; assists: string }[]>>({});
  const [confirmDraw, setConfirmDraw] = useState(false);
  const [lottery, setLottery] = useState<{ pairs: { matchId: string; teamA: string; teamB: string }[]; byes: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<"bracket" | "var_referee" | "standings" | "esheet">("bracket");

  // Scoreboard state for Live VAR console
  const [scoreA, setScoreA] = useState(3);
  const [scoreB, setScoreB] = useState(2);
  const [currentSet, setCurrentSet] = useState(2);
  const [cardsA, setCardsA] = useState(1);
  const [cardsB, setCardsB] = useState(0);
  const [timeoutsA, setTimeoutsA] = useState(1);
  const [timeoutsB, setTimeoutsB] = useState(2);
  const [varStatus, setVarStatus] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>("Cam 1 - Direct Baseline");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Danh sách giải thật (cache dùng chung)
  useEffect(() => {
    let alive = true;
    fetchTournaments()
      .then((list) => {
        if (!alive) return;
        setTournaments(list);
        setSelectedId((prev) => {
          if (prev && list.some((t) => String(t.id) === prev)) return prev;
          const open = list.find((t) => (t.status ?? "OPEN") === "OPEN");
          return open ? String(open.id) : list.length ? String(list[0].id) : "";
        });
      })
      .catch(() => {});
    return subscribeTournaments((list) => {
      if (!alive) return;
      setTournaments(list);
    });
  }, []);

  const selected = useMemo(
    () => tournaments.find((t) => String(t.id) === selectedId) ?? null,
    [tournaments, selectedId]
  );

  // Nhánh đấu đọc thẳng từ bracketJson trong cache (không request thừa, không 404 console).
  // Sau fill/draw, cache được refresh nên canvas tự đồng bộ.
  const bracket = useMemo<TournamentBracketData | null>(() => {
    if (!selected?.bracketJson) return null;
    try {
      const parsed = JSON.parse(selected.bracketJson) as TournamentBracketData;
      return parsed && Array.isArray(parsed.rounds) ? parsed : null;
    } catch {
      return null;
    }
  }, [selected]);

  const teamCount = selected ? registeredCount(selected) : 0;
  const teamCap = selected?.totalTeams ?? 0;
  const full = selected ? isTournamentFull(selected) : false;
  const simulatedCount = selected?.teams?.filter((t) => t.simulated).length ?? 0;
  const pendingTeams = useMemo(
    () => (selected?.teams ?? []).filter((t) => t.registrationStatus === "PENDING_PAYMENT"),
    [selected]
  );

  const handleConfirmPayment = async (teamName: string) => {
    if (!selected) return;
    try {
      setConfirmingTeam(teamName);
      const res = await confirmTeamPayment(selected.id, teamName);
      triggerToast(res.message);
    } catch (err: any) {
      triggerToast(err?.message || "Xác nhận thất bại.");
    } finally {
      setConfirmingTeam(null);
    }
  };

  const handleFill = async () => {
    if (!selected) return;
    try {
      setFillBusy(true);
      const res = await fillSimulatedTeams(selected.id);
      triggerToast(res.message);
    } catch (err: any) {
      triggerToast(err?.message || "Cần đăng nhập ORGANIZER hoặc ADMIN để giả lập.");
    } finally {
      setFillBusy(false);
    }
  };

  const handleClearSimulated = async () => {
    if (!selected) return;
    try {
      setClearBusy(true);
      const res = await clearSimulatedTeams(selected.id);
      triggerToast(res.message);
    } catch (err: any) {
      triggerToast(err?.message || "Cần đăng nhập ORGANIZER hoặc ADMIN để dọn đội Test.");
    } finally {
      setClearBusy(false);
    }
  };

  const startDraw = async () => {
    if (!selected) return;
    try {
      setDrawBusy(true);
      const res = await drawTournamentBracket(selected.id);
      const r1 = res.bracket.rounds[0]?.matches ?? [];
      const pairs = r1
        .filter((m) => m.status === "SCHEDULED" && m.teamA && m.teamB)
        .map((m) => ({ matchId: m.matchId, teamA: m.teamA!.name, teamB: m.teamB!.name }));
      const byes = r1.filter((m) => m.status === "BYE" && m.bye).map((m) => m.bye!.name);
      setLottery({ pairs, byes });
      setConfirmDraw(false);
    } catch (err: any) {
      triggerToast(err?.message || "Cần đăng nhập ORGANIZER hoặc ADMIN để bốc thăm.");
    } finally {
      setDrawBusy(false);
    }
  };

  // BXH thật: thắng/thua/điểm tính từ các trận DONE trong nhánh đấu.
  const tableRows = useMemo(() => {
    const base = new Map<string, { team: string; captain: string; elo: number; simulated: boolean; played: number; won: number; lost: number }>();
    (selected?.teams ?? []).forEach((t) =>
      base.set(t.teamName, {
        team: t.teamName,
        captain: t.captainName ?? "—",
        elo: t.eloRating ?? 1200,
        simulated: !!t.simulated,
        played: 0,
        won: 0,
        lost: 0,
      })
    );
    bracket?.rounds.forEach((r) =>
      r.matches.forEach((m) => {
        if (m.status !== "DONE" || !m.winner || !m.teamA || !m.teamB) return;
        const a = base.get(m.teamA.name);
        const b = base.get(m.teamB.name);
        if (a) a.played += 1;
        if (b) b.played += 1;
        const w = base.get(m.winner);
        if (w) w.won += 1;
        const loser = m.winner === m.teamA.name ? b : a;
        if (loser) loser.lost += 1;
      })
    );
    return Array.from(base.values())
      .map((r) => ({ ...r, points: r.won * 3 }))
      .sort((x, y) => y.points - x.points || y.elo - x.elo);
  }, [selected, bracket]);

  const handleSaveScore = async (m: BracketMatch) => {
    if (!selected || !m.teamA || !m.teamB) return;
    const s = scores[m.matchId] ?? { a: String(m.scoreA ?? 0), b: String(m.scoreB ?? 0) };
    const scoreA = Number(s.a);
    const scoreB = Number(s.b);
    if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) {
      triggerToast("Tỷ số phải là số nguyên lớn hơn hoặc bằng 0.");
      return;
    }
    if (scoreA === scoreB) {
      triggerToast("Vòng Knockout cần phân thắng bại, không nhận tỷ số hòa.");
      return;
    }
    const rows = (scorerRows[m.matchId] ?? [])
      .map((r) => ({
        playerName: r.player.trim(),
        teamName: r.team,
        goals: Math.max(0, Math.floor(Number(r.goals) || 0)),
        assists: Math.max(0, Math.floor(Number(r.assists) || 0)),
      }))
      .filter((r) => r.playerName && (r.goals > 0 || r.assists > 0));
    try {
      setSavingMatch(m.matchId);
      const res = await saveMatchResult(selected.id, {
        matchId: m.matchId,
        scoreA,
        scoreB,
        scorers: rows,
      });
      const deltas = res.eloChanges
        .map((c) => `${c.team} ${c.delta >= 0 ? "+" : ""}${Math.round(c.delta)}`)
        .join(" • ");
      triggerToast(`${res.message} Elo: ${deltas}${res.aiOnline ? "" : " (AI offline, tính local)"}`);
      setScorerRows((prev) => {
        const next = { ...prev };
        delete next[m.matchId];
        return next;
      });
    } catch (err: any) {
      triggerToast(err?.message || "Lưu kết quả thất bại.");
    } finally {
      setSavingMatch(null);
    }
  };

  const addScorerRow = (m: BracketMatch) => {
    if (!m.teamA || !m.teamB) return;
    setScorerRows((prev) => ({
      ...prev,
      [m.matchId]: [...(prev[m.matchId] ?? []), { player: "", team: m.teamA!.name, goals: "1", assists: "0" }],
    }));
  };

  const setScorerRow = (matchId: string, idx: number, patch: Partial<{ player: string; team: string; goals: string; assists: string }>) => {
    setScorerRows((prev) => ({
      ...prev,
      [matchId]: (prev[matchId] ?? []).map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    }));
  };

  const removeScorerRow = (matchId: string, idx: number) => {
    setScorerRows((prev) => ({
      ...prev,
      [matchId]: (prev[matchId] ?? []).filter((_, i) => i !== idx),
    }));
  };

  const handleVarCheck = (decision: string) => {
    setVarStatus(decision);
    triggerToast(`Đã ghi nhận VAR Replay: "${decision}"!`);
  };

  const renderMatch = (match: BracketMatch, idx: number) => {
    if (match.status === "BYE" && match.bye) {
      return (
        <div key={match.matchId} style={{ animationDelay: `${Math.min(idx, 6) * 60}ms` }} className="animate-fade-in-up bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-300 dark:border-amber-800 overflow-hidden text-xs">
          <div className="p-3 flex justify-between items-center gap-2">
            <span className="font-bold text-amber-900 dark:text-amber-200 truncate">{match.bye.name}</span>
            <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-black shrink-0">MIỄN VÒNG</span>
          </div>
          {match.bye.elo != null && (
            <div className="px-3 pb-2 text-[10px] font-mono text-amber-700 dark:text-amber-400">Elo {match.bye.elo} • Hạt giống #{match.bye.seed ?? "—"}</div>
          )}
        </div>
      );
    }
    const tbd = match.status === "TBD";
    const done = match.status === "DONE";
    const editable = match.status === "SCHEDULED" && match.teamA && !match.teamA.tbd && match.teamB && !match.teamB.tbd;
    const cur = scores[match.matchId] ?? { a: String(match.scoreA ?? 0), b: String(match.scoreB ?? 0) };
    const setScore = (side: "a" | "b", v: string) =>
      setScores((s) => ({ ...s, [match.matchId]: { a: side === "a" ? v : (s[match.matchId]?.a ?? String(match.scoreA ?? 0)), b: side === "b" ? v : (s[match.matchId]?.b ?? String(match.scoreB ?? 0)) } }));
    return (
      <div key={match.matchId} style={{ animationDelay: `${Math.min(idx, 6) * 60}ms` }} className={`animate-fade-in-up rounded-2xl border overflow-hidden text-xs shadow-xs ${done ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800" : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800"}`}>
        <div className="px-2.5 pt-2 font-mono text-[10px] font-black text-slate-400 flex items-center justify-between">
          <span>{match.matchId}</span>
          {done && <span className="text-emerald-600 dark:text-emerald-400">✓ ĐÃ ĐÁ</span>}
        </div>
        {[match.teamA, match.teamB].map((t, i) => {
          const isWinner = done && match.winner === t?.name;
          return (
            <div key={i}>
              {i === 1 && <div className="border-t border-slate-200 dark:border-slate-800" />}
              <div className={`p-3 flex justify-between items-center gap-2 ${t?.tbd ? "text-slate-400 dark:text-slate-500 italic" : isWinner ? "text-emerald-800 dark:text-emerald-200 font-black" : "text-slate-700 dark:text-slate-200 font-bold"}`}>
                <span className="truncate">{t?.name ?? "?"}{isWinner ? " 👑" : ""}</span>
                {t && !t.tbd && t.elo != null && (
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">{t.elo}</span>
                )}
              </div>
            </div>
          );
        })}
        {editable && (
          <div className="px-2.5 pb-2.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              aria-label={`Bàn thắng ${match.teamA?.name}`}
              value={cur.a}
              onChange={(e) => setScore("a", e.target.value)}
              className="w-14 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-center font-mono font-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="font-mono font-black text-slate-400">–</span>
            <input
              type="number"
              min={0}
              aria-label={`Bàn thắng ${match.teamB?.name}`}
              value={cur.b}
              onChange={(e) => setScore("b", e.target.value)}
              className="w-14 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-center font-mono font-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => handleSaveScore(match)}
              disabled={savingMatch === match.matchId}
              className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {savingMatch === match.matchId ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{savingMatch === match.matchId ? "Đang lưu…" : "Lưu KQ"}</span>
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setScorerOpen((o) => ({ ...o, [match.matchId]: !o[match.matchId] }))}
              aria-expanded={!!scorerOpen[match.matchId]}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              {scorerOpen[match.matchId] ? "▾ Ẩn ghi bàn/kiến tạo" : "＋ Ghi bàn/kiến tạo (tùy chọn)"}
            </button>
            {scorerOpen[match.matchId] && (
              <div className="mt-1.5 space-y-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2">
                {(scorerRows[match.matchId] ?? []).map((row, ri) => (
                  <div key={ri} className="grid grid-cols-[1fr_86px_44px_44px_24px] gap-1 items-center">
                    <input
                      type="text"
                      aria-label="Tên cầu thủ"
                      placeholder="Tên cầu thủ"
                      value={row.player}
                      onChange={(e) => setScorerRow(match.matchId, ri, { player: e.target.value })}
                      className="px-1.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[11px] min-w-0 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <select
                      aria-label="Đội của cầu thủ"
                      value={row.team}
                      onChange={(e) => setScorerRow(match.matchId, ri, { team: e.target.value })}
                      className="px-1 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
                    >
                      <option value={match.teamA?.name}>{match.teamA?.name}</option>
                      <option value={match.teamB?.name}>{match.teamB?.name}</option>
                    </select>
                    <input
                      type="number" min={0} aria-label="Số bàn" title="Bàn"
                      value={row.goals}
                      onChange={(e) => setScorerRow(match.matchId, ri, { goals: e.target.value })}
                      className="px-1 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[11px] font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <input
                      type="number" min={0} aria-label="Kiến tạo" title="Kiến tạo"
                      value={row.assists}
                      onChange={(e) => setScorerRow(match.matchId, ri, { assists: e.target.value })}
                      className="px-1 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[11px] font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      aria-label="Xóa dòng"
                      onClick={() => removeScorerRow(match.matchId, ri)}
                      className="text-rose-500 hover:text-rose-700 font-black"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Cột: tên • đội • bàn • kiến tạo</span>
                  <button
                    type="button"
                    onClick={() => addScorerRow(match)}
                    className="text-[11px] font-black text-sky-700 dark:text-sky-400 hover:underline"
                  >
                    + Thêm cầu thủ
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        )}
        {done && (
          <div className="px-2.5 pb-2.5 font-mono text-center text-sm font-black text-emerald-700 dark:text-emerald-300">
            {match.scoreA} – {match.scoreB}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:top-6 sm:right-6 z-50 bg-slate-900 dark:bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-400 animate-fade-in-up sm:max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-white shrink-0" />
          <span className="font-semibold text-xs sm:text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="min-w-0">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-3">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>{selected ? `${selected.title} • Nhánh đấu & VAR` : "Nhánh đấu & Bàn trọng tài Live VAR"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quản Lý Giải Đấu & Bốc Thăm Chia Cặp Thật
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              {selected
                ? `${sportLabel(selected.sportType)} • ${formatLabel(selected.format)} • ${teamCount}/${teamCap || "—"} đội • Khởi tranh ${formatDate(selected.startDate)}`
                : "Chọn một giải đấu để quản lý nhánh đấu."}
            </p>
          </div>

          {/* Tournament selector + management actions */}
          <div className="flex flex-col gap-3 min-w-0 lg:min-w-[320px]">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider" htmlFor="bracket-tournament">
              Giải đấu đang quản lý
            </label>
            <select
              id="bracket-tournament"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs font-extrabold text-white rounded-xl px-3.5 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-full"
            >
              {tournaments.length === 0 && <option value="">Chưa có giải đấu</option>}
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({registeredCount(t)}/{t.totalTeams ?? "—"} đội • {t.status})
                </option>
              ))}
            </select>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleFill}
                disabled={!selected || full || fillBusy}
                title="Sinh đội Test cho đủ sức chứa (chỉ dùng demo)"
                className="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs transition-all flex items-center space-x-1.5 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {fillBusy ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{full ? "Đã đủ đội" : `Giả lập đủ đội (Test)${selected && !full && teamCap ? ` +${teamCap - teamCount}` : ""}`}</span>
              </button>

              {simulatedCount > 0 && (
                <button
                  onClick={handleClearSimulated}
                  disabled={!selected || clearBusy}
                  title="Xóa đội Test đã giả lập, giữ nguyên đội đăng ký thật"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-xs transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-40"
                >
                  {clearBusy ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span>Dọn {simulatedCount} đội Test</span>
                </button>
              )}

              <button
                onClick={() => (bracket ? setConfirmDraw(true) : startDraw())}
                disabled={!selected || teamCount < 2 || drawBusy}
                title="Bốc thăm hạt giống theo Elo, lưu nhánh đấu vào CSDL"
                className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all flex items-center space-x-1.5 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {drawBusy ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Shuffle className="w-4 h-4" />
                )}
                <span>{bracket ? "Bốc thăm lại" : "Bốc thăm chia cặp"}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Giả lập & bốc thăm yêu cầu đăng nhập ORGANIZER hoặc ADMIN.
            </p>

            {/* Duyệt lệ phí: đội PENDING chờ BTC xác nhận đã thu tiền */}
            {pendingTeams.length > 0 && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 space-y-2">
                <p className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
                  Chờ xác nhận lệ phí ({pendingTeams.length})
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {pendingTeams.map((t) => (
                    <div key={t.teamName} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-200 font-bold truncate">
                        {t.teamName}
                        <span className="text-slate-400 font-medium"> • {t.captainPhone || "—"}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleConfirmPayment(t.teamName)}
                        disabled={confirmingTeam === t.teamName}
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition-all active:scale-95 disabled:opacity-50"
                      >
                        {confirmingTeam === t.teamName ? "…" : "Đã thu ✓"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Console Nav Tabs */}
        <div className="flex items-center space-x-2 mt-6 pt-6 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("bracket")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "bracket"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Cây Nhánh Đấu Interactive</span>
          </button>

          <button
            onClick={() => setActiveTab("var_referee")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "var_referee"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Video className="w-4 h-4 text-red-400" />
            <span>Bàn Trọng Tài Live VAR</span>
            <span className="bg-red-950 text-red-300 px-1.5 py-0.5 rounded text-[9px] uppercase font-mono">LIVE</span>
          </button>

          <button
            onClick={() => setActiveTab("standings")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "standings"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Bảng Xếp Hạng & Chỉ Số Elo VFF</span>
          </button>

          <button
            onClick={() => setActiveTab("esheet")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "esheet"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Biên Bản Điện Tử & Ký QR</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BRACKET CANVAS (render từ CSDL) */}
      {activeTab === "bracket" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-md overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-emerald-500" />
              <span>Cây Nhánh Đấu {bracket ? `— ${bracket.rounds.length} vòng` : ""}</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {bracket ? `Bốc thăm lúc ${bracket.drawnAt?.slice(0, 16).replace("T", " ")} • Xếp hạt giống theo Elo` : "Chưa có nhánh đấu"}
            </span>
          </div>

          {!selected ? (
            <div className="p-8 text-center">
              <Trophy className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Chưa có giải đấu nào trong CSDL.</p>
            </div>
          ) : !bracket ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <Shuffle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                Giải “{selected.title}” chưa bốc thăm chia cặp
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {teamCount < 2
                  ? `Mới có ${teamCount} đội — cần ít nhất 2 đội. Dùng nút “Giả lập đủ đội (Test)” nếu thiếu.`
                  : `Đã có ${teamCount} đội. Bấm “Bốc thăm chia cặp” để xếp hạt giống theo Elo.`}
              </p>
            </div>
          ) : (
            <div key={bracket.drawnAt} className="flex gap-6 pb-2 items-start overflow-x-auto">
              {bracket.rounds.map((round, ri) => (
                <div key={ri} className="min-w-[250px] flex-1 space-y-4">
                  <div className={`text-center text-xs font-extrabold uppercase tracking-wider py-2 rounded-xl border ${
                    ri === bracket.rounds.length - 1
                      ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30"
                      : "text-emerald-600 dark:text-emerald-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}>
                    {round.name} ({round.matches.length} trận)
                  </div>
                  {round.matches.map((m, mi) => renderMatch(m, mi))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE REFEREE VAR CONSOLE */}
      {activeTab === "var_referee" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Referee Scoreboard & Controls */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase mr-2 animate-pulse">LIVE VAR</span>
                <span className="font-extrabold text-base text-slate-900 dark:text-white">Trận Chung Kết Bóng Đá Sân 7 VFF Cup 2026</span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                Sân 7A • Khung Giờ 20:00
              </div>
            </div>

            {/* Giant Monospace Scoreboard */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 rounded-2xl border border-emerald-500/30 text-white text-center shadow-2xl space-y-4">
              <div className="flex items-center justify-center space-x-3 text-xs text-slate-400 uppercase font-mono tracking-widest font-bold">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>HIỆP 2 • THỜI GIAN THI ĐẤU: 48:15</span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4 py-2">
                {/* Team A */}
                <div className="space-y-2">
                  <div className="text-lg font-black text-emerald-400">FC Saigon Warriors</div>
                  <div className="text-xs text-slate-400">Elo 1,480 • Hạt Giống #1</div>
                  <div className="text-4xl sm:text-6xl font-mono font-black text-white bg-slate-900 py-3 rounded-2xl border border-slate-800 shadow-inner">
                    {scoreA}
                  </div>
                  <div className="flex justify-center space-x-2 pt-2">
                    <button
                      onClick={() => setScoreA(scoreA + 1)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow"
                    >
                      +1 Bàn Thắng
                    </button>
                    <button
                      onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-2 py-1.5 rounded-lg"
                    >
                      -1
                    </button>
                  </div>
                </div>

                {/* VS Indicator */}
                <div className="space-y-1">
                  <div className="text-xl font-extrabold text-amber-400 font-mono">VS</div>
                  <div className="text-[10px] text-slate-400 font-mono">Hiệp 1: 1 - 1</div>
                  {varStatus && (
                    <div className="bg-amber-400/20 text-amber-300 text-[10px] font-bold p-2 rounded-lg border border-amber-400/40">
                      VAR: {varStatus}
                    </div>
                  )}
                </div>

                {/* Team B */}
                <div className="space-y-2">
                  <div className="text-lg font-black text-cyan-400">FC Anh Em Kiến Trúc</div>
                  <div className="text-xs text-slate-400">Elo 1,465 • Hạt Giống #2</div>
                  <div className="text-4xl sm:text-6xl font-mono font-black text-white bg-slate-900 py-3 rounded-2xl border border-slate-800 shadow-inner">
                    {scoreB}
                  </div>
                  <div className="flex justify-center space-x-2 pt-2">
                    <button
                      onClick={() => setScoreB(scoreB + 1)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow"
                    >
                      +1 Bàn Thắng
                    </button>
                    <button
                      onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-2 py-1.5 rounded-lg"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* VAR Video Angles & Slow-Mo Controls */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Video className="w-4 h-4 text-red-500" />
                <span>Xem Lai VAR Camera Multi-Angle Slow-Mo</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Cam 1 - Direct Baseline', 'Cam 2 - Kitchen Line', 'Cam 3 - Overhead Angle', 'Cam 4 - AI Line Check'].map((cam) => (
                  <button
                    key={cam}
                    onClick={() => setSelectedCameraAngle(cam)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition border ${
                      selectedCameraAngle === cam
                        ? 'bg-red-500 text-white border-red-500 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    📹 {cam}
                  </button>
                ))}
              </div>

              {/* VAR Action Decisions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Quyết định Trọng Tài VAR Trực Tiếp ({selectedCameraAngle}):
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleVarCheck('Bóng Trong Sân (In-Bounds)')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                  >
                    ✅ Bóng Trong Sân (In-Bounds)
                  </button>
                  <button
                    onClick={() => handleVarCheck('Bóng Ngoài Sân (Out-of-Bounds)')}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                  >
                    ❌ Bóng Out (Out-of-Bounds)
                  </button>
                  <button
                    onClick={() => handleVarCheck('Phạm Lỗi Lưới (Kitchen Fault)')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg transition"
                  >
                    ⚠️ Lỗi Chân Vạch Kitchen
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Match Timeline & E-Sign Off */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Nhật Ký Diễn Biến Trận Đấu</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-emerald-500 font-mono">18:42</span> • Bàn thắng quyết định Set 3 của SG Titan (Dinking Master)
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-amber-500 font-mono">15:10</span> • Quyền Hội Ý Timeout của Eagles Pro Club (1/2)
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-red-500 font-mono">09:05</span> • VAR Review: Xác định bóng nằm trên vạch biên (In-Bounds)
                </div>
              </div>
            </div>

            {/* Referee E-Signature Widget */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-3xl p-6 border border-emerald-500/30 shadow-lg space-y-4">
              <div className="flex items-center space-x-3">
                <QrCode className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Chữ Ký Điện Tử Biên Bản</h4>
                  <p className="text-xs text-slate-300">Trọng tài chính: Phạm Hoàng Nam (Trọng tài Quốc gia VFF)</p>
                </div>
              </div>

              <button
                onClick={() => triggerToast("Đã ký số biên bản & tự động cập nhật kết quả lên BXH Bóng Đá Phủi toàn quốc!")}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold py-3 rounded-xl shadow-lg transition"
              >
                Xác Nhận & Cập Nhật Điểm Elo Tự Động
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BXH TỪ ĐỘI ĐĂNG KÝ THẬT (xếp theo Elo) */}
      {activeTab === "standings" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <ListOrdered className="w-5 h-5 text-emerald-500" />
              <span>Bảng Xếp Hạng {selected ? `— ${selected.title}` : ""}</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Thắng = 3 điểm • Elo cập nhật tự động sau mỗi trận
            </span>
          </div>

          {tableRows.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {selected ? "Giải chưa có đội nào ghi danh." : "Chưa chọn giải đấu."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-left border-collapse text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-3 px-2 sm:px-4 sticky left-0 bg-white dark:bg-slate-900 z-10">Hạng</th>
                    <th className="py-3 px-2 sm:px-4">Tên Đội / CLB</th>
                    <th className="py-3 px-2 sm:px-4 text-center">Trận</th>
                    <th className="py-3 px-2 sm:px-4 text-center">Thắng</th>
                    <th className="py-3 px-2 sm:px-4 text-center">Thua</th>
                    <th className="py-3 px-2 sm:px-4 text-center">Điểm</th>
                    <th className="py-3 px-2 sm:px-4 text-center">Elo Hiện Tại</th>
                    <th className="py-3 px-2 sm:px-4 text-right">Nguồn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                  {tableRows.map((row, idx) => (
                    <tr key={row.team} className={`hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors ${idx === 0 ? "bg-emerald-50 dark:bg-emerald-950/20 text-slate-900 dark:text-white font-bold" : "text-slate-700 dark:text-slate-300"}`}>
                      <td className="py-3.5 px-2 sm:px-4 font-bold text-emerald-600 dark:text-emerald-400 sticky left-0 bg-white dark:bg-slate-900 z-10">#{idx + 1}</td>
                      <td className="py-3.5 px-2 sm:px-4 font-bold text-slate-900 dark:text-white">
                        {idx === 0 && "👑 "}{row.team}
                      </td>
                      <td className="py-3.5 px-2 sm:px-4 text-center font-mono">{row.played}</td>
                      <td className="py-3.5 px-2 sm:px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{row.won}</td>
                      <td className="py-3.5 px-2 sm:px-4 text-center font-mono text-rose-500">{row.lost}</td>
                      <td className="py-3.5 px-2 sm:px-4 text-center font-mono font-black">{row.points}</td>
                      <td className="py-3.5 px-2 sm:px-4 text-center">
                        <span className="bg-amber-400/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-bold font-mono">
                          {row.elo.toLocaleString("vi-VN")}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 sm:px-4 text-right">
                        {row.simulated ? (
                          <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10px] font-black">TEST</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">CHÍNH THỨC</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ELECTRONIC SCORESHEET & PDF */}
      {activeTab === "esheet" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <span>Biên Bản Điện Tử Trận Đấu (E-Scoresheet & PDF Signature)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Biên bản chuẩn hóa Liên đoàn Bóng đá Việt Nam VFF & SoccerHub Official</p>
            </div>
            <button
              onClick={() => triggerToast("Đã tải xuống tệp PDF Biên bản trận đấu thành công!")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
            >
              Tải PDF Biên Bản
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Giải Đấu:</span>
                <div className="font-bold text-slate-900 dark:text-white">{selected?.title ?? "Saigon Football Premier Cup 2026"}</div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Vòng Đấu & Sân:</span>
                <div className="font-bold text-slate-900 dark:text-white">Chung Kết - Sân 7A SVĐ Oasis Q.7</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-900 dark:text-white">Kết Quả Chi Tiết Trận Đấu:</div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono space-y-1">
                <div>Hiệp 1: FC Saigon Warriors 2 - 1 FC Anh Em Kiến Trúc</div>
                <div>Hiệp 2: FC Saigon Warriors 3 - 2 FC Anh Em Kiến Trúc (Full Time)</div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-slate-900 dark:text-white">Đã xác nhận chữ ký Trọng tài chính & Đội trưởng 2 đội</span>
              </div>
              <span className="text-emerald-500 font-mono font-bold">Mã Xác Thực: #VSS-2026-9981</span>
            </div>
          </div>
        </div>
      )}

      {/* Overlay hiệu ứng bốc thăm */}
      {selected && (
        <DrawLotteryOverlay
          open={lottery !== null}
          tournamentTitle={selected.title}
          pairs={lottery?.pairs ?? []}
          byes={lottery?.byes ?? []}
          onDone={() => {
            setLottery(null);
            triggerToast("Nhánh đấu chính thức đã được lưu vào CSDL!");
          }}
        />
      )}

      {/* Xác nhận bốc thăm lại (ghi đè nhánh cũ) */}
      <ConfirmModal
        open={confirmDraw}
        title="Bốc thăm lại?"
        message={
          <>
            Giải <strong>“{selected?.title}”</strong> đã có nhánh đấu. Bốc thăm lại sẽ{" "}
            <strong>ghi đè toàn bộ nhánh cũ</strong>.
          </>
        }
        confirmLabel="Bốc thăm lại"
        danger={false}
        busy={drawBusy}
        onCancel={() => setConfirmDraw(false)}
        onConfirm={startDraw}
      />
    </div>
  );
}
