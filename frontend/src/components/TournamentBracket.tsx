"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
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
 Dices,
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
import FormDots from "./FormDots";
import { ConfirmModal } from "./admin/AdminUI";
import {
 Tournament,
 fetchTournaments,
 subscribeTournaments,
 fillSimulatedTeams,
 clearSimulatedTeams,
 drawTournamentBracket,
 simulateTournamentResults,
 generateTournamentSchedule,
 undoMatchResult,
 confirmTeamPayment,
 saveMatchResult,
 registeredCount,
 refreshTournamentInCache,
 isFull as isTournamentFull,
 fillPercent,
 formatDate,
 sportLabel,
 formatLabel,
 type TournamentBracketData,
 type BracketMatch,
} from "@/lib/tournamentService";

export default function TournamentBracket({
 initialTournamentId,
}: {
 /** Mã giải cần mở sẵn (VD: giải vừa bốc thăm xong từ card giải ở tab "Giải đấu"). */
 initialTournamentId?: number | string | null;
}) {
 const [tournaments, setTournaments] = useState<Tournament[]>([]);
 const [selectedId, setSelectedId] = useState("");

 // Quyền quản trị giải đấu — backend chỉ cho ADMIN / ORGANIZER / OWNER.
 const { user: authUser } = useAuth();
 const canManage =
  authUser?.role === "ORGANIZER" || authUser?.role === "ADMIN" || authUser?.role === "OWNER";
 const [fillBusy, setFillBusy] = useState(false);
// Số đội Test muốn thêm vào giải đang chọn (API fill-teams nhận {"count": n}).
const [addCount, setAddCount] = useState("4");
 const [clearBusy, setClearBusy] = useState(false);
 const [drawBusy, setDrawBusy] = useState(false);
 const [scheduleBusy, setScheduleBusy] = useState(false);
 const [showScheduleForm, setShowScheduleForm] = useState(false);
 const [scheduleForm, setScheduleForm] = useState({
 startDate: "",
 matchesPerDay: "2",
 daysBetweenRounds: "2",
 startHour: "17",
 matchMinutes: "120",
 });
 const [confirmingTeam, setConfirmingTeam] = useState<string | null>(null);
 const [savingMatch, setSavingMatch] = useState<string | null>(null);
 const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});
 const [scorerOpen, setScorerOpen] = useState<Record<string, boolean>>({});
 const [scorerRows, setScorerRows] = useState<Record<string, { player: string; team: string; goals: string; assists: string }[]>>({});
 const [matchStats, setMatchStats] = useState<Record<string, { yellowA?: string; yellowB?: string; redA?: string; redB?: string; subA?: string; subB?: string; mvp?: string; notes?: string }>>({});
 const [statsOpen, setStatsOpen] = useState<Record<string, boolean>>({});
 const [confirmDraw, setConfirmDraw] = useState(false);
 const [confirmUndo, setConfirmUndo] = useState<BracketMatch | null>(null);

 const [confirmSimulate, setConfirmSimulate] = useState(false);
 // Tu cuon toi hop xac nhan inline de BTC khong phai tim (xac nhan hien ngay duoi hang nut).
 useEffect(() => {
 if (!confirmDraw && !confirmSimulate && confirmUndo === null) return;
 const raf = requestAnimationFrame(() => {
  document.getElementById("confirm-inline-box")?.scrollIntoView({ behavior: "smooth", block: "center" });
 });
 return () => cancelAnimationFrame(raf);
 }, [confirmDraw, confirmSimulate, confirmUndo]);
 const [simulateBusy, setSimulateBusy] = useState(false);
 const [lottery, setLottery] = useState<{ pairs: { matchId: string; teamA: string; teamB: string }[]; byes: string[] } | null>(null);
 const [activeTab, setActiveTab] = useState<"bracket" | "var_referee" | "standings" | "esheet">("bracket");

 // --- Tòa VAR: chọn trận thật trong nhánh đấu để điều khiển tỷ số ---
 const [varMatchId, setVarMatchId] = useState<string>("");
 const [varScoreA, setVarScoreA] = useState(0);
 const [varScoreB, setVarScoreB] = useState(0);
 // Nhật ký VAR ghi lại trong phiên làm việc của BTC (không bịa sẵn)
 const [varLog, setVarLog] = useState<{ time: string; text: string; tone: "ok" | "warn" | "bad" }[]>([]);

 const [varStatus, setVarStatus] = useState<string | null>(null);
 const [toastMessage, setToastMessage] = useState<string | null>(null);
 const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>("Cam 1 - Direct Baseline");

 const triggerToast = (msg: string) => {
 setToastMessage(msg);
 setTimeout(() => setToastMessage(null), 3500);
 };

 /** "2026-11-02" -> "02/11/2026" (dd/MM/yyyy) */
 const prettyDate = (iso?: string) => {
 if (!iso) return "";
 const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
 return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
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

 // Mở sẵn giải được chỉ định (giải vừa bốc thăm) — không thì tab "Nhánh Đấu" mở ra
 // sẽ không chọn giải nào và BTC phải tự chọn lại.
 useEffect(() => {
  if (initialTournamentId === null || initialTournamentId === undefined || initialTournamentId === "") return;
  setSelectedId(String(initialTournamentId));
 }, [initialTournamentId]);

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

 /** Số trận đã có lịch (BTC đã bấm "Xếp lịch thi đấu"). */
 const scheduledCount = useMemo(
 () =>
 (bracket?.rounds ?? []).reduce(
 (sum, r) => sum + r.matches.filter((m) => !!m.matchDate && m.status !== "BYE").length,
 0
 ),
 [bracket]
 );

 /**
 * Danh sách trận cho Tòa VAR + Biên bản: mọi trận có 2 đội thật.
 * Ưu tiên trận chưa đánh (để nhập tỷ số) rồi tới trận đã đánh gần nhất.
 */
 const playableMatches = useMemo(() => {
 const rows: { match: BracketMatch; roundName: string }[] = [];
 for (const r of bracket?.rounds ?? []) {
 for (const m of r.matches) {
 if (!m.teamA || !m.teamB) continue;
 if (m.teamA.tbd || m.teamB.tbd) continue;
 rows.push({ match: m, roundName: r.name });
 }
 }
 return rows.sort((a, b) => {
 const rank = (m: BracketMatch) => (m.status === "DONE" ? 1 : 0);
 return rank(a.match) - rank(b.match) || (a.match.matchDate ?? "").localeCompare(b.match.matchDate ?? "");
 });
 }, [bracket]);

 const varMatch = useMemo(
 () => playableMatches.find((p) => p.match.matchId === varMatchId)?.match ?? null,
 [playableMatches, varMatchId]
 );
 const varRound = useMemo(
 () => playableMatches.find((p) => p.match.matchId === varMatchId)?.roundName ?? "",
 [playableMatches, varMatchId]
 );

 // Mặc định chọn trận đầu tiên trong danh sách và nạp tỷ số hiện có.
 useEffect(() => {
 if (!playableMatches.length) {
 setVarMatchId("");
 return;
 }
 if (!playableMatches.some((p) => p.match.matchId === varMatchId)) {
 setVarMatchId(playableMatches[0].match.matchId);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [playableMatches]);

 useEffect(() => {
 setVarScoreA(varMatch?.scoreA ?? 0);
 setVarScoreB(varMatch?.scoreB ?? 0);
 setVarStatus(null);
 setVarLog([]);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [varMatchId]);

 const pushVarLog = (text: string, tone: "ok" | "warn" | "bad") =>
 setVarLog((prev) => [
 {
 time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
 text,
 tone,
 },
 ...prev,
 ]);

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

 const handleFill = async (count?: number) => {
 if (!selected) return;
 try {
 setFillBusy(true);
 const res = await fillSimulatedTeams(selected.id, count);
 // Lam moi giai vua thay doi (so doi, danh sach doi, reset nhanh dau) trong cache
 await refreshTournamentInCache(selected.id);
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
 await refreshTournamentInCache(selected.id);
 triggerToast(res.message);
 } catch (err: any) {
 triggerToast(err?.message || "Cần đăng nhập ORGANIZER hoặc ADMIN để dọn đội Test.");
 } finally {
 setClearBusy(false);
 }
 };

 const startSimulate = async () => {
 if (!selected) return;
 try {
 setSimulateBusy(true);
 const res = await simulateTournamentResults(selected.id);
 // Tai lai giai de ket qua gia lap hien ngay tren cay nhanh dau
 await refreshTournamentInCache(selected.id);
 triggerToast(res.message);
 setConfirmSimulate(false);
 } catch (err: any) {
 triggerToast(err?.message || "Cần đăng nhập ORGANIZER hoặc ADMIN để giả lập.");
 } finally {
 setSimulateBusy(false);
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
 // Tai lai giai de cay nhanh dau (bracketJson moi) hien ngay, khong can F5
 await refreshTournamentInCache(selected.id);
 } catch (err: any) {
 triggerToast(err?.message || "Cần đăng nhập ORGANIZER hoặc ADMIN để bốc thăm.");
 } finally {
 setDrawBusy(false);
 }
 };

 /** BTC sinh lịch thật cho toàn bộ trận (ngày + khung giờ + sân) rồi lưu vào CSDL. */
 const handleSchedule = async () => {
 if (!selected) return;
 try {
 setScheduleBusy(true);
 const num = (v: string, fb: number) => {
 const n = parseInt(v, 10);
 return Number.isFinite(n) && n > 0 ? n : fb;
 };
 const res = await generateTournamentSchedule(selected.id, {
 startDate: scheduleForm.startDate.trim() || undefined,
 matchesPerDay: num(scheduleForm.matchesPerDay, 2),
 daysBetweenRounds: parseInt(scheduleForm.daysBetweenRounds, 10) || 0,
 startHour: num(scheduleForm.startHour, 17),
 matchMinutes: num(scheduleForm.matchMinutes, 120),
 });
 triggerToast(res.message);
 setShowScheduleForm(false);
 setActiveTab("bracket");
 // Tai lai giai de lich da sinh hien ngay tren cay nhanh dau
 await refreshTournamentInCache(selected.id);
 } catch (err: any) {
 triggerToast(err?.message || "Cần đăng nhập ORGANIZER hoặc ADMIN để xếp lịch.");
 } finally {
 setScheduleBusy(false);
 }
 };

 // BXH thật: thắng/hòa/thua/điểm/hiệu số tính từ các trận DONE trong nhánh đấu.
 // Thắng = 3đ, Hòa = 1đ. Xếp: điểm → hiệu số → tỷ lệ thắng.
 const tableRows = useMemo(() => {
 const base = new Map<string, { team: string; captain: string; winRate: number; form: string; simulated: boolean; played: number; won: number; drawn: number; lost: number; gf: number; ga: number }>();
 (selected?.teams ?? []).forEach((t) =>
 base.set(t.teamName, {
 team: t.teamName,
 captain: t.captainName ?? "—",
 winRate: t.winRate ?? 0,
 form: t.form ?? "",
 simulated: !!t.simulated,
 played: 0,
 won: 0,
 drawn: 0,
 lost: 0,
 gf: 0,
 ga: 0,
 })
 );
 bracket?.rounds.forEach((r) =>
 r.matches.forEach((m) => {
 if (m.status !== "DONE" || !m.teamA || !m.teamB) return;
 const a = base.get(m.teamA.name);
 const b = base.get(m.teamB.name);
 const sa = m.scoreA ?? 0;
 const sb = m.scoreB ?? 0;
 if (a) {
 a.played += 1;
 a.gf += sa;
 a.ga += sb;
 }
 if (b) {
 b.played += 1;
 b.gf += sb;
 b.ga += sa;
 }
 if (!m.winner) {
 if (a) a.drawn += 1;
 if (b) b.drawn += 1;
 } else if (m.winner === m.teamA.name) {
 if (a) a.won += 1;
 if (b) b.lost += 1;
 } else {
 if (b) b.won += 1;
 if (a) a.lost += 1;
 }
 })
 );
 return Array.from(base.values())
 .map((r) => ({ ...r, points: r.won * 3 + r.drawn, diff: r.gf - r.ga }))
 .sort((x, y) => y.points - x.points || y.diff - x.diff || (y.winRate ?? 0) - (x.winRate ?? 0));
 }, [selected, bracket]);

 /** Huỷ kết quả để nhập lại — backend xoá bản ghi và cầu thủ ghi bàn, phong độ tự tính lại. */
 const handleUndoScore = async (m: BracketMatch) => {
 if (!selected) return;
 try {
 setSavingMatch(m.matchId);
 const res = await undoMatchResult(selected.id, m.matchId);
 triggerToast(
 `${res.message}` +
 (res.goalEventsRemoved ? ` • Đã xoá ${res.goalEventsRemoved} dòng cầu thủ ghi bàn.` : "")
 );
 setScorerOpen((o) => {
 const next = { ...o };
 delete next[m.matchId];
  setMatchStats((prev) => {
    const next = { ...prev };
    delete next[m.matchId];
    return next;
  });
 return next;
 });
 setScorerRows((prev) => {
 const next = { ...prev };
 delete next[m.matchId];
  setMatchStats((prev) => {
    const next = { ...prev };
    delete next[m.matchId];
    return next;
  });
 return next;
 });
 } catch (err: any) {
 triggerToast(err?.message || "Huỷ kết quả thất bại.");
 } finally {
 setSavingMatch(null);
 }
 };

 const handleSaveScore = async (m: BracketMatch) => {
 if (!selected || !m.teamA || !m.teamB) return;
 const s = scores[m.matchId] ?? { a: String(m.scoreA ?? 0), b: String(m.scoreB ?? 0) };
 const scoreA = Number(s.a);
 const scoreB = Number(s.b);
 if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) {
 triggerToast("Tỷ số phải là số nguyên lớn hơn hoặc bằng 0.");
 return;
 }
 const isLeague = selected.format === "ROUND_ROBIN";
 if (scoreA === scoreB && !isLeague) {
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
  yellowCardsA: Number((matchStats[m.matchId] ?? {}).yellowA ?? 0),
  yellowCardsB: Number((matchStats[m.matchId] ?? {}).yellowB ?? 0),
  redCardsA: Number((matchStats[m.matchId] ?? {}).redA ?? 0),
  redCardsB: Number((matchStats[m.matchId] ?? {}).redB ?? 0),
  substitutionsA: Number((matchStats[m.matchId] ?? {}).subA ?? 0),
  substitutionsB: Number((matchStats[m.matchId] ?? {}).subB ?? 0),
  mvpPlayer: ((matchStats[m.matchId] ?? {}).mvp ?? "").trim() || undefined,
  notes: ((matchStats[m.matchId] ?? {}).notes ?? "").trim() || undefined,
 });
 const forms = (res.formChanges ?? [])
 .map((c: any) => `${c.team} ${c.after?.record ?? ""}`)
 .join(" • ");
 triggerToast(`${res.message}${forms ? ` | Phong độ: ${forms}` : ""}`);
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

 const handleVarCheck = (decision: string, tone: "ok" | "warn" | "bad") => {
 setVarStatus(decision);
 pushVarLog(`VAR Replay (${selectedCameraAngle}): ${decision}`, tone);
 triggerToast(`Đã ghi nhận VAR Replay: "${decision}"!`);
 };

 /** Lưu tỷ số từ Tòa VAR xuống CSDL — cùng endpoint nhập kết quả, lịch sử tự cập nhật. */
 const saveVarScore = async () => {
 if (!selected || !varMatch) return;
 const isLeague = selected.format === "ROUND_ROBIN";
 if (varScoreA === varScoreB && !isLeague) {
 triggerToast("Vòng Knockout cần phân thắng bại, không nhận tỷ số hòa.");
 return;
 }
 if (varMatch.status === "DONE") {
 triggerToast("Trận này đã có kết quả. Dùng nút “Huỷ KQ” trên thẻ trận để nhập lại.");
 return;
 }
 try {
 setSavingMatch(varMatch.matchId);
 const res = await saveMatchResult(selected.id, {
 matchId: varMatch.matchId,
 scoreA: varScoreA,
 scoreB: varScoreB,
 });
 const forms = (res.formChanges ?? [])
 .map((c: any) => `${c.team} ${c.after?.record ?? ""}`)
 .join(" • ");
 pushVarLog(
 `Kết quả ${varMatch.teamA?.name} ${varScoreA}-${varScoreB} ${varMatch.teamB?.name} — Phong độ: ${forms}`,
 "ok"
 );
 triggerToast(`${res.message}${forms ? ` | Phong độ: ${forms}` : ""}`);
 } catch (err: any) {
 triggerToast(err?.message || "Lưu kết quả thất bại.");
 } finally {
 setSavingMatch(null);
 }
 };

 const renderMatch = (match: BracketMatch, idx: number) => {
 if (match.status === "BYE" && match.bye) {
 return (
 <div key={match.matchId} style={{ animationDelay: `${Math.min(idx, 6) * 60}ms` }} className="animate-fade-in-up bg-amber-50 rounded-2xl border border-amber-300 overflow-hidden text-[13px]">
 <div className="p-3 flex justify-between items-center gap-2">
 <span className="font-bold text-amber-900 truncate">{match.bye.name}</span>
 <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[13px] font-black shrink-0">Miễn vòng</span>
 </div>
 {match.bye.record && (
 <div className="px-3 pb-2 text-[13px] font-mono text-amber-700 ">Thành tích {match.bye.record} • Hạt giống #{match.bye.seed ?? "—"}</div>
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
 <div key={match.matchId} style={{ animationDelay: `${Math.min(idx, 6) * 60}ms` }} className={`animate-fade-in-up rounded-2xl border overflow-hidden text-[13px] shadow-xs ${done ? "bg-sky-50 border-sky-300 " : "bg-slate-50 border-slate-200 "}`}>
 <div className="px-2.5 pt-2 font-mono text-[13px] font-black text-slate-500 flex items-center justify-between gap-1">
 <span>{match.matchId}</span>
 <div className="flex items-center gap-1">
 {done && <span className="text-sky-700 ">{match.winner ? "✓ ĐÃ ĐÁ" : "= HÒA"}</span>}
 {done && (
 <button
 type="button"
 title="Huỷ kết quả: mở lại trận để nhập tỷ số mới (phong độ tự tính lại)"
 aria-label={`Huỷ kết quả trận ${match.matchId}`}
 disabled={savingMatch === match.matchId}
 onClick={() => setConfirmUndo(match)}
 className="px-1.5 py-0.5 rounded-md border border-rose-300 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all text-[13px] font-black disabled:opacity-40 active:scale-95"
 >
 {savingMatch === match.matchId ? "…" : "Huỷ KQ"}
 </button>
 )}
 </div>
 </div>
 {/* Lịch thi đấu thật do BTC sinh (POST /schedule) */}
 {match.matchDate && (
 <div className="px-2.5 pt-1.5 flex flex-wrap items-center gap-1">
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 text-[13px] font-black">
 <Calendar className="w-2.5 h-2.5" />
 {prettyDate(match.matchDate)}
 </span>
 {match.timeSlot && (
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[13px] font-mono font-bold">
 <Clock className="w-2.5 h-2.5" />
 {match.timeSlot}
 </span>
 )}
 {match.pitchName && (
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[13px] font-bold truncate max-w-full">
 {match.pitchName}
 </span>
 )}
 </div>
 )}
 {[match.teamA, match.teamB].map((t, i) => {
 const isWinner = done && match.winner === t?.name;
 return (
 <div key={i}>
 {i === 1 && <div className="border-t border-slate-200 " />}
 <div className={`p-3 flex justify-between items-center gap-2 ${t?.tbd ? "text-slate-500 italic" : isWinner ? "text-sky-900 font-black" : "text-slate-700 font-bold"}`}>
 <span className="truncate">{t?.name ?? "?"}{isWinner ? " 👑" : ""}</span>
 {t && !t.tbd && (t.record || t.form) && (
 <span className="font-mono text-[13px] text-slate-500 shrink-0">{t.record ?? t.form}</span>
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
 className="w-14 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-center font-mono font-black text-sm focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 <span className="font-mono font-black text-slate-500">–</span>
 <input
 type="number"
 min={0}
 aria-label={`Bàn thắng ${match.teamB?.name}`}
 value={cur.b}
 onChange={(e) => setScore("b", e.target.value)}
 className="w-14 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-center font-mono font-black text-sm focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 <button
 type="button"
 onClick={() => handleSaveScore(match)}
 disabled={savingMatch === match.matchId}
 className="flex-1 py-1.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
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
 className="text-[13px] font-bold text-sky-800 hover:underline"
 >
 {scorerOpen[match.matchId] ? "▾ Ẩn ghi bàn/kiến tạo" : "＋ Ghi bàn/kiến tạo (tùy chọn)"}
 </button>
 {scorerOpen[match.matchId] && (
 <div className="mt-1.5 space-y-1.5 rounded-lg bg-white border border-slate-200 p-2">
 {(scorerRows[match.matchId] ?? []).map((row, ri) => (
 <div key={ri} className="grid grid-cols-[1fr_86px_44px_44px_24px] gap-1 items-center">
 <input
 type="text"
 aria-label="Tên cầu thủ"
 placeholder="Tên cầu thủ"
 value={row.player}
 onChange={(e) => setScorerRow(match.matchId, ri, { player: e.target.value })}
 className="px-1.5 py-1 rounded-md border border-slate-300 bg-white text-[13px] min-w-0 focus:outline-none focus:ring-1 focus:ring-[#0369a1]"
 />
 <select
 aria-label="Đội của cầu thủ"
 value={row.team}
 onChange={(e) => setScorerRow(match.matchId, ri, { team: e.target.value })}
 className="px-1 py-1 rounded-md border border-slate-300 bg-white text-[13px] font-bold focus:outline-none focus:ring-1 focus:ring-[#0369a1] truncate"
 >
 <option value={match.teamA?.name}>{match.teamA?.name}</option>
 <option value={match.teamB?.name}>{match.teamB?.name}</option>
 </select>
 <input
 type="number" min={0} aria-label="Số bàn" title="Bàn"
 value={row.goals}
 onChange={(e) => setScorerRow(match.matchId, ri, { goals: e.target.value })}
 className="px-1 py-1 rounded-md border border-slate-300 bg-white text-[13px] font-mono text-center focus:outline-none focus:ring-1 focus:ring-[#0369a1]"
 />
 <input
 type="number" min={0} aria-label="Kiến tạo" title="Kiến tạo"
 value={row.assists}
 onChange={(e) => setScorerRow(match.matchId, ri, { assists: e.target.value })}
 className="px-1 py-1 rounded-md border border-slate-300 bg-white text-[13px] font-mono text-center focus:outline-none focus:ring-1 focus:ring-[#0369a1]"
 />
 <button
 type="button"
 aria-label="Xóa dòng"
 onClick={() => removeScorerRow(match.matchId, ri)}
 className="text-rose-600 hover:text-rose-700 font-black"
 >
 ×
 </button>
 </div>
 ))}
 <div className="flex items-center justify-between">
 <span className="text-[13px] text-slate-500">Cột: tên • đội • bàn • kiến tạo</span>
 <button
 type="button"
 onClick={() => addScorerRow(match)}
 className="text-[13px] font-black text-sky-700 hover:underline"
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
 <div className="px-2.5 pb-2.5 font-mono text-center text-sm font-black text-sky-800 ">
 {match.scoreA} – {match.scoreB}
 </div>
 )}
 </div>
 );
 };

 return (
 <div className="space-y-4 sm:space-y-8 text-slate-900 transition-colors duration-200">
 {/* Toast Notification */}
 {toastMessage && (
 <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:top-6 sm:right-6 z-50 bg-slate-900 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-sky-400 animate-fade-in-up sm:max-w-sm">
 <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
 <span className="font-semibold text-[13px] sm:text-sm">{toastMessage}</span>
 </div>
 )}

 {/* Main Header Banner */}
 <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-slate-900 shadow-xl relative overflow-hidden">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-6 relative z-10">
 <div className="min-w-0">
 <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0369a1]/10 border border-[#0369a1]/30 text-sky-800 text-[13px] font-bold mb-3">
 <Trophy className="w-4 h-4 text-sky-700 " />
 <span>{selected ? `${selected.title} • Nhánh đấu & VAR` : "Nhánh đấu & Bàn trọng tài Live VAR"}</span>
 </div>
 <h1 className="text-lg sm:text-3xl font-extrabold tracking-tight text-slate-900 ">
 Quản Lý Giải Đấu & Bốc Thăm Chia Cặp Thật
 </h1>
 <p className="text-slate-600 text-[13px] sm:text-sm mt-1 max-w-2xl">
 {selected
 ? `${sportLabel(selected.sportType)} • ${formatLabel(selected.format)} • ${teamCount}/${teamCap || "—"} đội • Khởi tranh ${formatDate(selected.startDate)}`
 : "Chọn một giải đấu để quản lý nhánh đấu."}
 </p>
 </div>

 {/* Tournament selector + management actions */}
 <div className="flex flex-col gap-3 min-w-0 lg:min-w-[320px]">
 <label className="text-[13px] font-bold text-slate-500 tracking-wider" htmlFor="bracket-tournament">
 Giải đấu đang quản lý
 </label>
 <select
 id="bracket-tournament"
 value={selectedId}
 onChange={(e) => setSelectedId(e.target.value)}
 className="bg-slate-50 border border-slate-200 text-[13px] font-extrabold text-slate-900 rounded-xl px-3.5 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0369a1] max-w-full"
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
 onClick={() => handleFill()}
 disabled={!canManage || !selected || full || fillBusy}
 title="Sinh đội Test kèm đủ quân số + danh sách thành viên cho đủ sức chứa (chỉ dùng demo)"
 className="px-3.5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[13px] transition-all flex items-center space-x-1.5 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
 >
 {fillBusy ? (
 <RefreshCw className="w-4 h-4 animate-spin" />
 ) : (
 <UserPlus className="w-4 h-4" />
 )}
 <span>{full ? "Đã đủ đội" : `Giả lập đủ đội (Test)${selected && !full && teamCap ? ` +${teamCap - teamCount}` : ""}`}</span>
 </button>
  {/* THÊM N ĐỘI NGẪU NHIÊN — chọn số đội rồi thêm đúng N đội vào giải đang chọn.
      API: POST /api/v1/tournaments/{id}/fill-teams {"count": n} */}
  {selected && !full && (
  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5">
  <UserPlus className="w-3.5 h-3.5 text-[#0369a1] shrink-0" />
  <input
  type="number"
  min={1}
  max={Math.max(1, teamCap - teamCount)}
  value={addCount}
  onChange={(e) => setAddCount(e.target.value.replace(/[^0-9]/g, ""))}
  aria-label="Số đội Test muốn thêm vào giải"
  title="Nhập số đội muốn thêm (tối đa sức chứa còn trống)"
  className="w-12 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[13px] font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
  />
  <span className="text-[13px] font-bold text-slate-500 shrink-0">đội</span>
  <button
  onClick={() => handleFill(Number(addCount))}
  disabled={fillBusy || !canManage || !Number(addCount)}
  title="Thêm đúng số đội Test đã nhập vào giải đang chọn"
  className="px-2.5 py-1.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
  >
  {fillBusy ? "..." : "Thêm đội"}
  </button>
  </div>
  )}

 {simulatedCount > 0 && (
 <button
 onClick={handleClearSimulated}
 disabled={!canManage || !selected || clearBusy}
 title="Xóa đội Test đã giả lập, giữ nguyên đội đăng ký thật"
 className="px-3.5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-[13px] transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-40"
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
 disabled={!canManage || !selected || teamCount < 2 || drawBusy}
 title="Bốc thăm hạt giống theo thứ tự đăng ký, lưu nhánh đấu vào CSDL"
 className="px-3.5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[13px] transition-all flex items-center space-x-1.5 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
 >
 {drawBusy ? (
 <RefreshCw className="w-4 h-4 animate-spin" />
 ) : (
 <Shuffle className="w-4 h-4" />
 )}
 <span>{bracket ? "Bốc thăm lại" : selected?.format === "ROUND_ROBIN" ? "Xếp lịch vòng tròn" : "Bốc thăm chia cặp"}</span>
 </button>

 {bracket && (
 <button
 onClick={() => setConfirmSimulate(true)}
 disabled={!canManage || !selected || simulateBusy}
 title="Tự random tỷ số + cầu thủ ghi bàn cho mọi trận chưa đá (chỉ dùng demo)"
 className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-[13px] transition-all flex items-center space-x-1.5 shadow-md border border-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
 >
 {simulateBusy ? (
 <RefreshCw className="w-4 h-4 animate-spin" />
 ) : (
 <Dices className="w-4 h-4" />
 )}
 <span>Giả lập KQ cả giải</span>
 </button>
 )}

 {/* Xếp lịch thi đấu — chỉ có ý nghĩa sau khi đã bốc thăm tạo nhánh đấu */}
 {bracket && (
 <button
 onClick={() => setShowScheduleForm((v) => !v)}
 disabled={!canManage || !selected || scheduleBusy}
 title="Sinh ngày + khung giờ + sân cho từng trận, lưu vào CSDL"
 className={`px-3.5 py-2.5 rounded-xl font-extrabold text-[13px] transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-40 ${
 showScheduleForm
 ? "bg-[#0369a1] text-white shadow-lg"
 : "bg-[#0369a1]/20 text-sky-300 hover:bg-[#0369a1]/30 border border-[#0369a1]/40"
 }`}
 >
 <Calendar className="w-4 h-4" />
 <span>Xếp lịch thi đấu</span>
 </button>
 )}
 </div>
 {!canManage && (
 <p className="hidden sm:block text-[13px] text-slate-500">
 Cần đăng nhập ORGANIZER hoặc ADMIN.
 </p>
 )}

  {/* Xac nhan inline (khong popup) — hien ngay duoi hang nut quan tri */}
  <div id="confirm-inline-box" className="w-full space-y-3">
 <ConfirmModal
 open={confirmDraw}
 inline
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

 {/* Xác nhận giả lập kết quả toàn giải */}
 <ConfirmModal
 open={confirmSimulate}
 inline
 title="Giả lập kết quả cả giải?"
 message={
 <>
 Hệ thống sẽ <strong>tự random tỷ số</strong> cho mọi trận chưa đá của giải{" "}
 <strong>“{selected?.title}”</strong> (kèm cầu thủ ghi bàn ngẫu nhiên), đội thắng đi
 tiếp, giải có nhà vô địch. Trận đã có kết quả được giữ nguyên.
 </>
 }
 confirmLabel="Giả lập ngay"
 danger={false}
 busy={simulateBusy}
 onCancel={() => setConfirmSimulate(false)}
 onConfirm={startSimulate}
 />

 {/* Xác nhận huỷ kết quả (xoá bản ghi + cầu thủ ghi bàn, phong độ tự tính lại) */}
 <ConfirmModal
 open={confirmUndo !== null}
 inline
 title="Huỷ kết quả trận đấu?"
 message={
 confirmUndo ? (
 <>
 Trận <strong>{confirmUndo.matchId}</strong> (
 <strong>
 {confirmUndo.teamA?.name} {confirmUndo.scoreA ?? 0}-{confirmUndo.scoreB ?? 0}{" "}
 {confirmUndo.teamB?.name}
 </strong>
 ) sẽ được mở lại. Hệ thống sẽ <strong>mở lại trận</strong> và{" "}
 <strong>xoá danh sách cầu thủ ghi bàn</strong> của trận này (phong độ tính lại từ các trận còn lại).
 </>
 ) : null
 }
 confirmLabel="Huỷ kết quả"
 danger
 busy={savingMatch !== null}
 onCancel={() => setConfirmUndo(null)}
 onConfirm={async () => {
 const m = confirmUndo;
 setConfirmUndo(null);
 if (m) await handleUndoScore(m);
 }}
 />

  </div>
 {/* Form tham số xếp lịch */}
 {showScheduleForm && bracket && (
 <div className="rounded-xl bg-[#0369a1]/10 border border-[#0369a1]/30 p-3 space-y-3">
 <p className="text-[13px] font-black text-sky-300 tracking-wider">
 Tham số xếp lịch
 </p>
 <div className="grid grid-cols-2 gap-2">
 <label className="col-span-2 sm:col-span-1 block">
 <span className="text-[13px] font-bold text-slate-300 block mb-1">
 Ngày thi đấu đầu tiên
 </span>
 <input
 type="date"
 value={scheduleForm.startDate}
 onChange={(e) => setScheduleForm((f) => ({ ...f, startDate: e.target.value }))}
 className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 {!scheduleForm.startDate && (
 <span className="text-[13px] text-slate-500">
 Để trống = dùng ngày khai giải ({prettyDate(selected?.startDate) || "—"}).
 </span>
 )}
 </label>
 <label className="block">
 <span className="text-[13px] font-bold text-slate-300 block mb-1">Trận / ngày</span>
 <input
 type="number"
 min={1}
 max={12}
 value={scheduleForm.matchesPerDay}
 onChange={(e) => setScheduleForm((f) => ({ ...f, matchesPerDay: e.target.value }))}
 className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 </label>
 <label className="block">
 <span className="text-[13px] font-bold text-slate-300 block mb-1">Cách giữa vòng (ngày)</span>
 <input
 type="number"
 min={0}
 max={14}
 value={scheduleForm.daysBetweenRounds}
 onChange={(e) => setScheduleForm((f) => ({ ...f, daysBetweenRounds: e.target.value }))}
 className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 </label>
 <label className="block">
 <span className="text-[13px] font-bold text-slate-300 block mb-1">Giờ bắt đầu</span>
 <input
 type="number"
 min={0}
 max={23}
 value={scheduleForm.startHour}
 onChange={(e) => setScheduleForm((f) => ({ ...f, startHour: e.target.value }))}
 className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 </label>
 <label className="block">
 <span className="text-[13px] font-bold text-slate-300 block mb-1">Độ dài trận (phút)</span>
 <input
 type="number"
 min={30}
 max={240}
 step={15}
 value={scheduleForm.matchMinutes}
 onChange={(e) => setScheduleForm((f) => ({ ...f, matchMinutes: e.target.value }))}
 className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 </label>
 </div>
 <button
 type="button"
 onClick={handleSchedule}
 disabled={scheduleBusy}
 className="w-full px-3.5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[13px] transition-all flex items-center justify-center space-x-1.5 shadow-md active:scale-95 disabled:opacity-50"
 >
 {scheduleBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
 <span>{scheduleBusy ? "Đang xếp lịch…" : "Sinh lịch & lưu vào CSDL"}</span>
 </button>
 <p className="hidden sm:block text-[13px] text-slate-500 leading-relaxed">
 Sân lấy từ <span className="font-bold text-slate-500">{selected?.pitchName || selected?.location || "Sân BTC"}</span> trong hồ sơ giải. Xếp lại sẽ ghi đè lịch cũ.
 </p>
 </div>
 )}

 {/* Duyệt lệ phí: đội PENDING chờ BTC xác nhận đã thu tiền */}
 {pendingTeams.length > 0 && (
 <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 space-y-2">
 <p className="text-[13px] font-black text-amber-300 tracking-wider">
 Chờ xác nhận lệ phí ({pendingTeams.length})
 </p>
 <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
 {pendingTeams.map((t) => (
 <div key={t.teamName} className="flex items-center justify-between gap-2 text-[13px]">
 <span className="text-slate-200 font-bold truncate">
 {t.teamName}
 <span className="text-slate-500 font-medium"> • {t.captainPhone || "—"}</span>
 </span>
 <button
 type="button"
 onClick={() => handleConfirmPayment(t.teamName)}
 disabled={confirmingTeam === t.teamName}
 className="shrink-0 px-2.5 py-1 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black transition-all active:scale-95 disabled:opacity-50"
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
 <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800 overflow-x-auto no-scrollbar">
 <button
 onClick={() => setActiveTab("bracket")}
 className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center space-x-2 ${
 activeTab === "bracket"
 ? "bg-[#0369a1] text-white shadow-md"
 : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
 }`}
 >
 <Trophy className="w-4 h-4" />
 <span>Cây Nhánh Đấu</span>
 </button>

 <button
 onClick={() => setActiveTab("var_referee")}
 className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center space-x-2 ${
 activeTab === "var_referee"
 ? "bg-[#0369a1] text-white shadow-md"
 : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
 }`}
 >
 <Video className="w-4 h-4 text-red-400" />
 <span>Bàn VAR</span>
 <span className="bg-red-950 text-red-300 px-1.5 py-0.5 rounded text-[13px] font-mono">TRỰC TIẾP</span>
 </button>

 <button
 onClick={() => setActiveTab("standings")}
 className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center space-x-2 ${
 activeTab === "standings"
 ? "bg-[#0369a1] text-white shadow-md"
 : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
 }`}
 >
 <ListOrdered className="w-4 h-4" />
 <span>Bảng Xếp Hạng</span>
 </button>

 <button
 onClick={() => setActiveTab("esheet")}
 className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center space-x-2 ${
 activeTab === "esheet"
 ? "bg-[#0369a1] text-white shadow-md"
 : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
 }`}
 >
 <FileText className="w-4 h-4" />
 <span>Biên Bản & QR</span>
 </button>
 </div>
 </div>

 {/* TAB 1: BRACKET CANVAS (render từ CSDL) */}
 {activeTab === "bracket" && (
 <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-6 shadow-md overflow-x-auto">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
 <Trophy className="w-5 h-5 text-emerald-500" />
 <span>Cây Nhánh Đấu {bracket ? `— ${bracket.rounds.length} vòng` : ""}</span>
 </h2>
 <span className="text-[13px] text-slate-500 font-medium">
 {bracket ? `Bốc thăm lúc ${bracket.drawnAt?.slice(0, 16).replace("T", " ")} • Hạt giống theo thứ tự đăng ký` : "Chưa có nhánh đấu"}
 </span>
 </div>

 {/* Nhắc BTC khi chưa xếp lịch */}
 {bracket && scheduledCount === 0 && (
 <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-sky-400/50 bg-[#0369a1]/5 px-3 py-2.5">
 <p className="text-[13px] font-bold text-sky-700 ">
 <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
 Chưa có lịch thi đấu — bấm “Xếp lịch thi đấu” ở bảng điều hành để sinh ngày, giờ và sân cho từng trận.
 </p>
 </div>
 )}
 {bracket && scheduledCount > 0 && (
 <p className="text-[13px] font-bold text-sky-800 ">
 <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
 Đã xếp lịch {scheduledCount} trận — ngày, khung giờ và sân lấy trực tiếp từ CSDL.
 </p>
 )}

 {!selected ? (
 <div className="p-4 sm:p-8 text-center">
 <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
 <p className="mt-3 text-sm text-slate-500">Chưa có giải đấu nào trong CSDL.</p>
 </div>
 ) : !bracket ? (
 <div className="p-4 sm:p-8 text-center rounded-2xl border border-dashed border-slate-300 ">
 <Shuffle className="w-8 h-8 text-slate-300 mx-auto" />
 <p className="mt-3 text-sm font-bold text-slate-700 ">
 Giải “{selected.title}” chưa bốc thăm chia cặp
 </p>
 <p className="mt-1 text-[13px] text-slate-500">
 {teamCount < 2
 ? `Mới có ${teamCount} đội — cần ít nhất 2 đội. Dùng nút “Giả lập đủ đội (Test)” nếu thiếu.`
 : `Đã có ${teamCount} đội. Bấm “Bốc thăm chia cặp” (hạt giống theo thứ tự đăng ký).`}
 </p>
 </div>
 ) : (
 <div key={bracket.drawnAt} className="flex gap-3 sm:gap-6 pb-2 items-start overflow-x-auto">
 {bracket.rounds.map((round, ri) => (
 <div key={ri} className="min-w-[250px] flex-1 space-y-3 sm:space-y-4">
 <div className={`text-center text-[13px] font-extrabold py-2 rounded-xl border ${
 ri === bracket.rounds.length - 1
 ? "text-amber-600 bg-amber-500/10 border-amber-500/30"
 : "text-sky-700 bg-slate-100 border-slate-200 "
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

 {/* TAB 2: TÒA TRỌNG TÀI VAR — chạy trên trận thật trong nhánh đấu */}
 {activeTab === "var_referee" && (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
 <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-3 sm:space-y-6">
 <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
 <div className="min-w-0">
 <span className="bg-red-500 text-white text-[13px] font-black px-2 py-0.5 rounded mr-2">VAR</span>
 <span className="font-extrabold text-base text-slate-900 ">
 {varMatch
 ? `${varRound} · ${varMatch.teamA?.name} vs ${varMatch.teamB?.name}`
 : "Chọn một trận để điều khiển tỷ số"}
 </span>
 </div>
 <div className="text-[13px] font-mono font-bold text-slate-500">
 {varMatch?.matchDate
 ? `${varMatch.matchDate.split("-").reverse().join("/")} • ${varMatch.timeSlot ?? ""} • ${varMatch.pitchName ?? "Chưa xếp sân"}`
 : "Chưa xếp lịch"}
 </div>
 </div>

 {!varMatch ? (
 <div className="p-10 text-center">
 <Video className="w-8 h-8 text-slate-300 mx-auto" />
 <p className="mt-3 text-sm text-slate-500">
 {playableMatches.length
 ? "Chưa chọn trận nào."
 : "Giải chưa bốc thăm hoặc chưa có cặp đấu nào đủ 2 đội thật."}
 </p>
 </div>
 ) : (
 <>
 {varMatch.status === "DONE" && (
 <p className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-[13px] font-bold text-amber-700 ">
 Trận này đã có kết quả {varMatch.scoreA}-{varMatch.scoreB}. Muốn sửa thì bấm “Huỷ KQ”
 trên thẻ trận ở tab Cây Nhánh Đấu — hệ thống sẽ mở lại trận và tính lại phong độ.
 </p>
 )}

 <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 text-slate-900 text-center shadow-2xl space-y-3 sm:space-y-4">
 <div className="flex items-center justify-center space-x-3 text-[13px] text-slate-500 font-monost font-bold">
 <Clock className="w-4 h-4 text-sky-700 " />
 <span>
 {varMatch.status === "DONE" ? "ĐÃ KẾT THÚC" : "ĐANG ĐIỀU KHIỂN"} • TỶ SỐ THỜI GIAN THỰC
 </span>
 </div>

 <div className="grid grid-cols-3 items-center gap-3 sm:gap-4 py-2">
 <div className="space-y-2 min-w-0">
 <div className="text-base sm:text-lg font-black text-sky-800 truncate">
 {varMatch.teamA?.name}
 </div>
 <div className="text-[13px] text-slate-500 font-mono">Thành tích {varMatch.teamA?.record ?? varMatch.teamA?.form ?? "—"}</div>
 <div className="text-2xl sm:text-6xl font-mono font-black text-slate-900 bg-slate-100 py-3 rounded-2xl border border-slate-200 shadow-inner">
 {varScoreA}
 </div>
 {varMatch.status !== "DONE" && (
 <div className="flex justify-center space-x-2 pt-2">
 <button
 onClick={() => setVarScoreA(varScoreA + 1)}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-extrabold px-3 py-1.5 rounded-lg shadow"
 >
 +1 Bàn
 </button>
 <button
 onClick={() => setVarScoreA(Math.max(0, varScoreA - 1))}
 className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold px-2 py-1.5 rounded-lg"
 >
 -1
 </button>
 </div>
 )}
 </div>

 <div className="space-y-1">
 <div className="text-xl font-extrabold text-amber-600 font-mono">VS</div>
 <div className="text-[13px] text-slate-500 font-mono">{varMatch.matchId}</div>
 {varStatus && (
 <div className="bg-amber-500/10 text-amber-700 text-[13px] font-bold p-2 rounded-lg border border-amber-500/30 ">
 VAR: {varStatus}
 </div>
 )}
 </div>

 <div className="space-y-2 min-w-0">
 <div className="text-base sm:text-lg font-black text-cyan-700 truncate">
 {varMatch.teamB?.name}
 </div>
 <div className="text-[13px] text-slate-500 font-mono">Thành tích {varMatch.teamB?.record ?? varMatch.teamB?.form ?? "—"}</div>
 <div className="text-2xl sm:text-6xl font-mono font-black text-slate-900 bg-slate-100 py-3 rounded-2xl border border-slate-200 shadow-inner">
 {varScoreB}
 </div>
 {varMatch.status !== "DONE" && (
 <div className="flex justify-center space-x-2 pt-2">
 <button
 onClick={() => setVarScoreB(varScoreB + 1)}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-extrabold px-3 py-1.5 rounded-lg shadow"
 >
 +1 Bàn
 </button>
 <button
 onClick={() => setVarScoreB(Math.max(0, varScoreB - 1))}
 className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold px-2 py-1.5 rounded-lg"
 >
 -1
 </button>
 </div>
 )}
 </div>
 </div>

 {varMatch.status !== "DONE" && (
 <button
 onClick={saveVarScore}
 disabled={savingMatch === varMatch.matchId}
 className="w-full bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-extrabold py-3 rounded-xl shadow-lg transition active:scale-[0.99] disabled:opacity-50"
 >
 {savingMatch === varMatch.matchId
 ? "Đang lưu…"
 : `Lưu kết quả ${varScoreA}-${varScoreB} & lưu lịch sử thi đấu`}
 </button>
 )}
 </div>

 {/* Chọn trận */}
 <div className="space-y-2">
 <label className="text-[13px] font-bold text-slate-700 ">
 Chọn trận để điều khiển ({playableMatches.length} trận có đủ 2 đội)
 </label>
 <select
 value={varMatchId}
 onChange={(e) => setVarMatchId(e.target.value)}
 className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 >
 {playableMatches.map((p) => (
 <option key={p.match.matchId} value={p.match.matchId}>
 {p.roundName} · {p.match.matchId} · {p.match.teamA?.name} vs {p.match.teamB?.name}
 {p.match.status === "DONE" ? ` (đã đá ${p.match.scoreA}-${p.match.scoreB})` : ""}
 </option>
 ))}
 </select>
 </div>

 {/* VAR replay + quyết định */}
 <div className="space-y-3">
 <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
 <Video className="w-4 h-4 text-red-500" />
 <span>Xem Lại VAR — Camera Multi-Angle</span>
 </h3>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 {["Cam 1 - Direct Baseline", "Cam 2 - Kitchen Line", "Cam 3 - Overhead Angle", "Cam 4 - AI Line Check"].map((cam) => (
 <button
 key={cam}
 onClick={() => setSelectedCameraAngle(cam)}
 className={`p-2.5 rounded-xl text-[13px] font-bold transition border ${
 selectedCameraAngle === cam
 ? "bg-rose-600 text-white border-rose-600 shadow-md"
 : "bg-slate-100 text-slate-700 border-slate-200 "
 }`}
 >
 📹 {cam}
 </button>
 ))}
 </div>

 <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
 <div className="text-[13px] font-bold text-slate-700 ">
 Quyết định Trọng Tài ({selectedCameraAngle}):
 </div>
 <div className="flex flex-wrap gap-2">
 <button
 onClick={() => handleVarCheck("Bóng trong sân (In-Bounds)", "ok")}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold px-3 py-2 rounded-lg transition"
 >
 ✅ Bóng Trong Sân
 </button>
 <button
 onClick={() => handleVarCheck("Bóng ngoài sân (Out-of-Bounds)", "bad")}
 className="bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold px-3 py-2 rounded-lg transition"
 >
 ❌ Bóng Out
 </button>
 <button
 onClick={() => handleVarCheck("Lỗi chân vạch Kitchen", "warn")}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold px-3 py-2 rounded-lg transition"
 >
 ⚠️ Lỗi Kitchen
 </button>
 </div>
 <p className="hidden sm:block text-[13px] text-slate-500 leading-relaxed">
 Camera là bộ công cụ mô phỏng dùng để minh hoạ luồng VAR. Quyết định bấm ở đây được ghi vào
 nhật ký phiên làm việc của BTC, không ghi vào CSDL.
 </p>
 </div>
 </div>
 </>
 )}
 </div>

 {/* Nhật ký + biên bản */}
 <div className="space-y-3 sm:space-y-6">
 <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-3 sm:space-y-4">
 <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
 <Zap className="w-5 h-5 text-amber-700" />
 <span>Nhật Ký Phiên VAR</span>
 </h3>

 {varLog.length === 0 ? (
 <p className="text-[13px] text-slate-500">
 Chưa có mốc nào trong phiên làm việc này. Các quyết định VAR và lần lưu kết quả sẽ hiện ở đây.
 </p>
 ) : (
 <div className="space-y-2 text-[13px] max-h-72 overflow-y-auto pr-1">
 {varLog.map((e, i) => (
 <div
 key={i}
 className="p-3 bg-slate-50 rounded-xl border border-slate-200 "
 >
 <span
 className={`font-bold font-mono mr-1 ${
 e.tone === "ok"
 ? "text-emerald-500"
 : e.tone === "warn"
 ? "text-amber-700"
 : "text-red-500"
 }`}
 >
 {e.time}
 </span>
 <span className="text-slate-600 ">{e.text}</span>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-lg space-y-3 sm:space-y-4">
 <div className="flex items-center space-x-3">
 <QrCode className="w-8 h-8 text-sky-700 flex-shrink-0" />
 <div>
 <h4 className="font-bold text-sm">Biên Bản Trận Đấu</h4>
 <p className="text-[13px] text-slate-600 ">
 {varMatch
 ? `Mã biên bản: ${selected?.title ? selected.title.slice(0, 18) : "SH"}-${varMatch.matchId}-${(varMatch.matchDate ?? "").replace(/-/g, "") || "CHUALICH"}`
 : "Chọn trận để tạo biên bản"}
 </p>
 </div>
 </div>

 <button
 onClick={() => setActiveTab("esheet")}
 disabled={!varMatch}
 className="w-full bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-extrabold py-3 rounded-xl shadow-lg transition active:scale-[0.99] disabled:opacity-40"
 >
 Mở Biên Bản Điện Tử
 </button>
 </div>
 </div>
 </div>
 )}

 {/* TAB 3: BXH TỪ ĐỘI ĐĂNG KÝ THẬT (xếp theo điểm, hiệu số, phong độ) */}
 {activeTab === "standings" && (
 <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-4 shadow-md">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
 <ListOrdered className="w-5 h-5 text-emerald-500" />
 <span>Bảng Xếp Hạng {selected ? `— ${selected.title}` : ""}</span>
 </h2>
 <span className="text-[13px] text-slate-500">
 Thắng = 3 điểm • Phong độ cập nhật tự động từ lịch sử sau mỗi trận
 </span>
 </div>

 {tableRows.length === 0 ? (
 <div className="p-4 sm:p-8 text-center">
 <Users className="w-8 h-8 text-slate-300 mx-auto" />
 <p className="mt-3 text-sm text-slate-500">
 {selected ? "Giải chưa có đội nào ghi danh." : "Chưa chọn giải đấu."}
 </p>
 </div>
 ) : (
 <div className="overflow-x-auto -mx-1 px-1">
 <table className="w-full text-left border-collapse text-[13px] min-w-[640px]">
 <thead>
 <tr className="border-b border-slate-200 text-slate-500 font-bold text-[13px] tracking-wider">
 <th className="py-3 px-2 sm:px-4 sticky left-0 bg-white z-10">Hạng</th>
 <th className="py-3 px-2 sm:px-4">Tên Đội / CLB</th>
 <th className="py-3 px-2 sm:px-4 text-center">Trận</th>
 <th className="py-3 px-2 sm:px-4 text-center">Thắng</th>
 <th className="py-3 px-2 sm:px-4 text-center">Hòa</th>
 <th className="py-3 px-2 sm:px-4 text-center">Thua</th>
 <th className="py-3 px-2 sm:px-4 text-center">HS</th>
 <th className="py-3 px-2 sm:px-4 text-center">Điểm</th>
 <th className="py-3 px-2 sm:px-4 text-center">Phong Độ 5 Trận</th>
 <th className="py-3 px-2 sm:px-4 text-right">Nguồn</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 font-medium">
 {tableRows.map((row, idx) => (
 <tr key={row.team} className={`hover:bg-slate-100 transition-colors ${idx === 0 ? "bg-sky-50 text-slate-900 font-bold" : "text-slate-700 "}`}>
 <td className="py-3.5 px-2 sm:px-4 font-bold text-sky-700 sticky left-0 bg-white z-10">#{idx + 1}</td>
 <td className="py-3.5 px-2 sm:px-4 font-bold text-slate-900 ">
 {idx === 0 && "👑 "}{row.team}
 </td>
 <td className="py-3.5 px-2 sm:px-4 text-center font-mono">{row.played}</td>
 <td className="py-3.5 px-2 sm:px-4 text-center font-mono font-bold text-sky-700 ">{row.won}</td>
 <td className="py-3.5 px-2 sm:px-4 text-center font-mono text-amber-600 ">{row.drawn}</td>
 <td className="py-3.5 px-2 sm:px-4 text-center font-mono text-rose-600">{row.lost}</td>
 <td className="py-3.5 px-2 sm:px-4 text-center font-mono">{row.diff > 0 ? `+${row.diff}` : row.diff}</td>
 <td className="py-3.5 px-2 sm:px-4 text-center font-mono font-black">{row.points}</td>
 <td className="py-3.5 px-2 sm:px-4 text-center">
 <FormDots form={row.form} size="sm" />
 </td>
 <td className="py-3.5 px-2 sm:px-4 text-right">
 {row.simulated ? (
 <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[13px] font-black">Thử nghiệm</span>
 ) : (
 <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 text-[13px] font-black">Chính thức</span>
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

 {/* TAB 4: BIÊN BẢN ĐIỆN TỬ — in thật từ dữ liệu trận trong CSDL */}
 {activeTab === "esheet" && (
 <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-6 shadow-md">
 <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 print:border-0 print:pb-0">
 <div>
 <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
 <FileText className="w-5 h-5 text-emerald-500" />
 <span>Biên Bản Trận Đấu — E-Scoresheet</span>
 </h2>
 <p className="text-[13px] text-slate-500 mt-1">
 Dữ liệu lấy trực tiếp từ bảng <span className="font-mono">tournaments</span> &amp;{" "}
 <span className="font-mono">match_results</span> trong CSDL
 </p>
 </div>
 <div className="flex items-center gap-2">
 <select
 value={varMatchId}
 onChange={(e) => setVarMatchId(e.target.value)}
 aria-label="Chọn trận cho biên bản"
 className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] max-w-[240px]"
 >
 {playableMatches.map((p) => (
 <option key={p.match.matchId} value={p.match.matchId}>
 {p.match.matchId} · {p.match.teamA?.name} vs {p.match.teamB?.name}
 </option>
 ))}
 </select>
 <button
 onClick={() => window.print()}
 disabled={!varMatch}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold px-4 py-2.5 rounded-xl shadow transition active:scale-95 disabled:opacity-40 print:hidden"
 >
 In / Lưu PDF
 </button>
 </div>
 </div>

 {!varMatch ? (
 <div className="p-10 text-center">
 <FileText className="w-8 h-8 text-slate-300 mx-auto" />
 <p className="mt-3 text-sm text-slate-500">
 Chưa có trận nào đủ 2 đội thật để lập biên bản. Bốc thăm giải trước đã.
 </p>
 </div>
 ) : (
 <div className="esheet-print bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-3 sm:space-y-5 text-[13px] print:bg-white print:border-0 print:p-0">
 {/* Header */}
 <div className="text-center space-y-1 pb-4 border-b border-slate-200 print:border-slate-400">
 <p className="text-[13px] font-black tracking-widest text-slate-500">Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam</p>
 <p className="text-[13px] font-bold text-slate-500">Độc lập – Tự do – Hạnh phúc</p>
 <h3 className="text-base font-black text-slate-900">
 Biên Bản Trận Đấu — {selected ? sportLabel(selected.sportType) : "Bóng Đá Sân 7 Phủi"}
 </h3>
 <p className="text-[13px] font-mono text-slate-500">
 Mã biên bản: {(selected?.title ?? "SH").slice(0, 20)}-{varMatch.matchId}-
 {(varMatch.matchDate ?? "").replace(/-/g, "") || "CHUALICH"}
 </p>
 </div>

 {/* Thông tin trận */}
 <div className="grid grid-cols-2 gap-x-6 gap-y-2">
 <div>
 <span className="text-slate-500">Giải đấu:</span>{" "}
 <span className="font-bold text-slate-900 ">{selected?.title ?? "—"}</span>
 </div>
 <div>
 <span className="text-slate-500">Thể thức:</span>{" "}
 <span className="font-bold text-slate-900 ">{formatLabel(selected?.format)}</span>
 </div>
 <div>
 <span className="text-slate-500">Vòng đấu:</span>{" "}
 <span className="font-bold text-slate-900 ">
 {varRound || "—"} ({varMatch.matchId})
 </span>
 </div>
 <div>
 <span className="text-slate-500">Thời gian:</span>{" "}
 <span className="font-bold text-slate-900 ">
 {varMatch.matchDate ? prettyDate(varMatch.matchDate) : "Chưa xếp lịch"}
 {varMatch.timeSlot ? ` · ${varMatch.timeSlot}` : ""}
 </span>
 </div>
 <div>
 <span className="text-slate-500">Địa điểm:</span>{" "}
 <span className="font-bold text-slate-900 ">
 {varMatch.pitchName ?? selected?.pitchName ?? selected?.location ?? "Chưa xếp sân"}
 </span>
 </div>
 <div>
 <span className="text-slate-500">Trạng thái:</span>{" "}
 <span className="font-bold text-slate-900 ">
 {varMatch.status === "DONE" ? "Đã thi đấu xong" : "Chưa nhập kết quả"}
 </span>
 </div>
 </div>

 {/* Bảng tỷ số */}
 <div className="overflow-x-auto">
 <table className="w-full border border-slate-300 text-left">
 <thead>
 <tr className="bg-slate-100 text-[13px] text-slate-600 ">
 <th className="py-2 px-3 font-black">Đội</th>
 <th className="py-2 px-3 font-black">Trọng tài</th>
 <th className="py-2 px-3 font-black text-center">Phong độ (T-H-B)</th>
 <th className="py-2 px-3 font-black text-center">Bàn thắng</th>
 <th className="py-2 px-3 font-black text-center">Kết quả</th>
 </tr>
 </thead>
 <tbody className="font-mono">
 {[varMatch.teamA, varMatch.teamB].map((team, i) => (
 <tr key={i} className="border-t border-slate-200 ">
 <td className="py-2.5 px-3 font-bold font-sans text-slate-900 ">
 {team?.name}
 </td>
 <td className="py-2.5 px-3 text-slate-500">—</td>
 <td className="py-2.5 px-3 text-center">{team?.record ?? team?.form ?? "—"}</td>
 <td className="py-2.5 px-3 text-center font-black text-base">
 {i === 0 ? (varMatch.scoreA ?? 0) : (varMatch.scoreB ?? 0)}
 </td>
 <td className="py-2.5 px-3 text-center font-bold text-[13px]">
 {varMatch.status !== "DONE"
 ? "Chưa có"
 : varMatch.winner === team?.name
 ? "Thắng"
 : !varMatch.winner
 ? "Hòa"
 : "Thua"}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Ghi chú trung thực */}
 <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 print:border-slate-400">
 <div className="flex items-center gap-2">
 <CheckCircle2
 className={`w-5 h-5 ${varMatch.status === "DONE" ? "text-emerald-500" : "text-slate-500"}`}
 />
 <span className="font-bold text-slate-900 ">
 {varMatch.status === "DONE"
 ? "Kết quả đã được BTC nhập và lưu lịch sử trong CSDL."
 : "Chưa có kết quả — biên bản chỉ mang tính dự thảo."}
 </span>
 </div>
 <span className="font-mono text-slate-500">
 In lúc {new Date().toLocaleString("vi-VN")} • Người lập: BTC
 </span>
 </div>
 </div>
 )}
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

 </div>
 );
}
