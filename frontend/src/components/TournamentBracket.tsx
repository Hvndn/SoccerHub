"use client";

import TournamentInviteModal from "./TournamentInviteModal";
import { Mail } from "lucide-react";
import SafeImage from "@/components/SafeImage";

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
 Calendar,
 Filter
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
 simulateTournamentResults,
 generateTournamentSchedule,
 undoMatchResult,
 confirmTeamPayment,
 saveMatchResult,
 registeredCount,
 confirmedCount,
 refreshTournamentInCache,
 isFull as isTournamentFull,
 fillPercent,
 formatDate,
 formatMoney,
 sportLabel,
 formatLabel,
  shortTournamentCode,
 type TournamentBracketData,
 type BracketMatch,
} from "@/lib/tournamentService";
import { apiRequest } from "@/lib/api";

export default function TournamentBracket({
 initialTournamentId,
}: {
 /** Mã giải cần mở sẵn (VD: giải vừa bốc thăm xong từ card giải ở tab "Giải đấu"). */
 initialTournamentId?: number | string | null;
}) {
 const [tournaments, setTournaments] = useState<Tournament[]>([]);
 const [selectedId, setSelectedId] = useState("");
 const [showInviteModal, setShowInviteModal] = useState(false);

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

 const scheduleErrors = useMemo(() => {
   const errs: Record<string, string> = {};
   if (scheduleForm.startDate) {
     const todayStr = new Date().toISOString().split("T")[0];
     if (scheduleForm.startDate < todayStr) {
       errs.startDate = "Ngày thi đấu không được nằm trong quá khứ.";
     }
   }
   const mpd = parseInt(scheduleForm.matchesPerDay, 10);
   if (!Number.isFinite(mpd) || mpd < 1 || mpd > 12) {
     errs.matchesPerDay = "Số trận/ngày phải từ 1 đến 12 trận.";
   }
   const dbr = parseInt(scheduleForm.daysBetweenRounds, 10);
   if (!Number.isFinite(dbr) || dbr < 0 || dbr > 14) {
     errs.daysBetweenRounds = "Khoảng cách giữa các vòng phải từ 0 đến 14 ngày.";
   }
   const sh = parseInt(scheduleForm.startHour, 10);
   if (!Number.isFinite(sh) || sh < 0 || sh > 23) {
     errs.startHour = "Giờ bắt đầu phải từ 0h đến 23h.";
   }
   const mm = parseInt(scheduleForm.matchMinutes, 10);
   if (!Number.isFinite(mm) || mm < 30 || mm > 240) {
     errs.matchMinutes = "Độ dài mỗi trận phải từ 30 đến 240 phút.";
   }
   return errs;
 }, [scheduleForm]);

 const isScheduleValid = Object.keys(scheduleErrors).length === 0;
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
 const [confirmStageSimulate, setConfirmStageSimulate] = useState(false);
 // Tu cuon toi hop xac nhan inline de BTC khong phai tim (xac nhan hien ngay duoi hang nut).
 useEffect(() => {
 if (!confirmDraw && !confirmSimulate && !confirmStageSimulate && confirmUndo === null) return;
 const raf = requestAnimationFrame(() => {
  document.getElementById("confirm-inline-box")?.scrollIntoView({ behavior: "smooth", block: "center" });
 });
 return () => cancelAnimationFrame(raf);
 }, [confirmDraw, confirmSimulate, confirmStageSimulate, confirmUndo]);
 const [simulateBusy, setSimulateBusy] = useState(false);
 const [lottery, setLottery] = useState<{ pairs: { matchId: string; teamA: string; teamB: string }[]; byes: string[] } | null>(null);

 // Tự cuộn mượt tới sân khấu bốc thăm khi lễ bốc thăm bắt đầu
 useEffect(() => {
   if (lottery !== null) {
     const raf = requestAnimationFrame(() => {
       document.getElementById("draw-lottery-stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
     });
     return () => cancelAnimationFrame(raf);
   }
 }, [lottery]);
 const [activeTab, setActiveTab] = useState<"bracket" | "var_referee" | "standings" | "esheet" | "schedule">("bracket");
 const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>("ALL");

 // --- Tòa VAR: chọn trận thật trong nhánh đấu để điều khiển tỷ số ---
 const [varMatchId, setVarMatchId] = useState<string>("");
 const [varScoreA, setVarScoreA] = useState(0);
 const [varScoreB, setVarScoreB] = useState(0);
 // Nhật ký VAR ghi lại trong phiên làm việc của BTC (không bịa sẵn)
 const [varLog, setVarLog] = useState<{ time: string; text: string; tone: "ok" | "warn" | "bad" }[]>([]);

 const [varStatus, setVarStatus] = useState<string | null>(null);
 const [toastMessage, setToastMessage] = useState<string | null>(null);
 const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>("Cam 1 - Góc Chính");

 // Vua phá lưới & Sự kiện biên bản trận đấu
 const [standingsSubTab, setStandingsSubTab] = useState<"teams" | "scorers">("teams");
 const [topScorers, setTopScorers] = useState<any[]>([]);
 const [loadingScorers, setLoadingScorers] = useState(false);

 // VAR Live Match Events
 const [varEvents, setVarEvents] = useState<{
 id: string;
 type: "GOAL" | "YELLOW_CARD" | "RED_CARD";
 teamName: string;
 playerName: string;
 minute?: string;
 }[]>([]);
 const [newEventTeam, setNewEventTeam] = useState<string>("");
 const [newEventPlayer, setNewEventPlayer] = useState<string>("");
 const [newEventMinute, setNewEventMinute] = useState<string>("");
 const [newEventType, setNewEventType] = useState<"GOAL" | "YELLOW_CARD" | "RED_CARD">("GOAL");

 const loadTopScorers = async (tournamentId: number) => {
 try {
 setLoadingScorers(true);
 const res = await apiRequest<any[]>(`/api/v1/tournaments/${tournamentId}/scorers`);
 setTopScorers(Array.isArray(res) ? res : []);
 } catch (e) {
 console.warn("Lỗi tải Vua phá lưới:", e);
 setTopScorers([]);
 } finally {
 setLoadingScorers(false);
 }
 };

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
   // List chưa về (cache rỗng) -> giữ lựa chọn hiện tại, không reset về ""
   // (nếu reset, <select> sẽ hiển thị option đầu tiên dù state đang trỏ giải khác).
   if (!list.length) return prev;
 if (prev && list.some((t) => String(t.id) === prev)) return prev;
 const open = list.find((t) => (t.status ?? "OPEN") === "OPEN");
 return open ? String(open.id) : list.length ? String(list[0].id) : "";
 });
 })
 .catch(() => {});
  // Cleanup: phai SET alive = false truoc khi huy subscription, neu khong
  // setState sau unmount van chay (canh bao React + memory leak).
  const unsubscribe = subscribeTournaments((list) => {
   if (!alive) return;
   setTournaments(list);
  });
  return () => {
   alive = false;
   unsubscribe();
  };
  }, []);

 const selected = useMemo(
  () => tournaments.find((t) => String(t.id) === selectedId) ?? null,
  [tournaments, selectedId]
 );

 useEffect(() => {
  if (selected?.id) {
    loadTopScorers(selected.id);
  }
 }, [selected?.id, activeTab]);

  // Kiểm tra giải đấu đã kết thúc hoặc hết thời gian tổ chức
  const isClosed = Boolean(
    selected?.status === "COMPLETED" ||
    selected?.status === "FINISHED" ||
    (selected?.endDate && new Date(selected.endDate) < new Date(new Date().toDateString()))
  );

  // Chỉ cho phép tác động (bốc thăm, giả lập, xếp lịch...) khi có quyền VÀ giải chưa kết thúc
  const canAct = canManage && !isClosed;

 // Mở sẵn giải được chỉ định (giải vừa bốc thăm) — không thì tab "Nhánh Đấu" mở ra
 // sẽ không chọn giải nào và BTC phải tự chọn lại.
 useEffect(() => {
  if (initialTournamentId === null || initialTournamentId === undefined || initialTournamentId === "") return;
  setSelectedId(String(initialTournamentId));
  }, [initialTournamentId, tournaments]);

  useEffect(() => {
    setSelectedRoundFilter("ALL");
  }, [selectedId]);

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

 const nextPlayableStage = useMemo(() => {
   if (!bracket?.rounds) return null;
   for (const r of bracket.rounds) {
     const hasPlayable = (r.matches ?? []).some(
       (m) =>
         m.status !== "DONE" &&
         m.status !== "BYE" &&
         m.teamA &&
         m.teamB &&
         !m.teamA.tbd &&
         !m.teamB.tbd
     );
     if (hasPlayable) {
       return r.name;
     }
   }
   return null;
 }, [bracket]);

 // Chi dem doi DA VAO GIAI (da cong le phi) — doi cho phep phi chua duoc tinh vao suc chua
 const teamCount = selected ? confirmedCount(selected) : 0;
 const teamCap = selected?.totalTeams ?? 0;
 const full = selected ? isTournamentFull(selected) : false;
 const simulatedCount = selected?.teams?.filter((t) => t.simulated).length ?? 0;
 const pendingTeams = useMemo(
 () => (selected?.teams ?? []).filter((t) => t.registrationStatus === "PENDING_PAYMENT"),
 [selected]
 );

 // Ràng buộc kiểm duyệt điều kiện thi đấu (Validation Gates)
 const isTeamCountValid = teamCount >= 2 && (!teamCap || teamCount >= teamCap);
 const isPaymentValid = pendingTeams.length === 0;
 const isBracketValid = !!bracket && (bracket.rounds?.length ?? 0) > 0;

 const stageValidation = useMemo(() => {
 if (!bracket?.rounds || !nextPlayableStage) {
 return { isValid: false, uncompletedStage: null as string | null };
 }
 const currentRoundIdx = bracket.rounds.findIndex((r) => r.name === nextPlayableStage);
 if (currentRoundIdx <= 0) {
 return { isValid: true, uncompletedStage: null as string | null };
 }
 for (let i = 0; i < currentRoundIdx; i++) {
 const prevRound = bracket.rounds[i];
 const hasUnfinished = (prevRound.matches ?? []).some(
 (m) => m.status !== "DONE" && m.status !== "BYE"
 );
 if (hasUnfinished) {
 return { isValid: false, uncompletedStage: prevRound.name };
 }
 }
 return { isValid: true, uncompletedStage: null as string | null };
 }, [bracket, nextPlayableStage]);

 const canSimulateNextStage = isTeamCountValid && isPaymentValid && isBracketValid && stageValidation.isValid;
 const canSimulateAll = isTeamCountValid && isPaymentValid && isBracketValid;

 /** Số trận đã có lịch (BTC đã bấm "Xếp lịch thi đấu"). */
 const scheduledCount = useMemo(
 () =>
 (bracket?.rounds ?? []).reduce(
 (sum, r) => sum + (r.matches ?? []).filter((m) => !!m.matchDate && m.status !== "BYE").length,
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
 for (const m of (r.matches ?? [])) {
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

   // Tìm đội bóng của Cầu thủ hiện tại trong giải này (nếu có)
  const myTeam = useMemo(() => {
    if (!selected || !authUser) return null;
    const myEmail = (authUser.email || "").toLowerCase().trim();
    const myPhone = (authUser.phone || "").trim();
    const myName = (authUser.fullName || (authUser as any)?.name || "").toLowerCase().trim();

    return (selected.teams ?? []).find((t: any) => {
      const tEmail = (t.captainEmail || "").toLowerCase().trim();
      const tPhone = (t.captainPhone || "").trim();
      const tName = (t.captainName || "").toLowerCase().trim();
      const members = String(t.memberNames || "").toLowerCase();

      return (
        (myEmail && tEmail === myEmail) ||
        (myPhone && tPhone === myPhone) ||
        (myName && tName === myName) ||
        (myName && members.includes(myName))
      );
    }) ?? null;
  }, [selected, authUser]);

  // Kiểm tra Cầu thủ này có nằm trong danh sách email được mời không
  const isInvited = useMemo(() => {
    if (!selected) return false;
    const myEmail = (authUser?.email || "").toLowerCase().trim();
    if (!myEmail) return false;
    return (selected.invitedEmails ?? []).some((e) => (e ?? "").toLowerCase().trim() === myEmail);
  }, [selected, authUser?.email]);

  // Trận đấu tiếp theo của đội Cầu thủ (nếu giải đã bốc thăm và có lịch)
  const myNextMatch = useMemo(() => {
    if (!bracket?.rounds || !myTeam) return null;
    for (const r of bracket.rounds) {
      for (const m of (r.matches ?? [])) {
        if (!m.teamA || !m.teamB || m.status === "BYE") continue;
        const isTeamA = m.teamA.name === myTeam.teamName;
        const isTeamB = m.teamB.name === myTeam.teamName;
        if (isTeamA || isTeamB) {
          const opponent = isTeamA ? m.teamB : m.teamA;
          return {
            match: m,
            roundTitle: r.name || (r as any)?.title || "Vòng đấu",
            opponentName: opponent.name || "Chưa xác định",
            isDone: m.status === "DONE",
            scoreA: m.scoreA,
            scoreB: m.scoreB,
            myScore: isTeamA ? m.scoreA : m.scoreB,
            oppScore: isTeamA ? m.scoreB : m.scoreA,
            matchDate: m.matchDate,
            timeSlot: m.timeSlot,
            pitchName: m.pitchName,
          };
        }
      }
    }
    return null;
  }, [bracket, myTeam]);

  // Danh sách toàn bộ các trận đã có lịch để hiển thị cho Cầu thủ
  const allScheduledMatches = useMemo(() => {
    if (!bracket?.rounds) return [];
    const rows: { match: BracketMatch; roundName: string }[] = [];
    for (const r of bracket.rounds) {
      for (const m of (r.matches ?? [])) {
        if (!m.teamA || !m.teamB || m.status === "BYE") continue;
        rows.push({ match: m, roundName: r.name });
      }
    }
    return rows.sort((a, b) => {
      const da = a.match.matchDate ?? "9999-99-99";
      const db = b.match.matchDate ?? "9999-99-99";
      return da.localeCompare(db) || (a.match.timeSlot ?? "").localeCompare(b.match.timeSlot ?? "");
    });
  }, [bracket]);

  // Tự động chuyển tab thông minh theo thể thức giải đấu
  useEffect(() => {
    if (!selected) return;
    if (selected.format === "ROUND_ROBIN") {
      setActiveTab("standings");
    } else {
      setActiveTab("bracket");
    }
  }, [selected?.id, selected?.format]);

  // Trận cầu nổi bật dành cho khán giả vãng lai
  const guestSpotlightMatch = useMemo(() => {
    if (!allScheduledMatches.length) return null;
    const live = allScheduledMatches.find((m) => m.match.status === "IN_PROGRESS");
    if (live) return live;
    const upcoming = allScheduledMatches.find(
      (m) =>
        m.match.status === "SCHEDULED" &&
        m.match.teamA &&
        !m.match.teamA.tbd &&
        m.match.teamB &&
        !m.match.teamB.tbd
    );
    if (upcoming) return upcoming;
    return allScheduledMatches[0] || null;
  }, [allScheduledMatches]);

  // Đội quán quân của giải đấu (nếu đã xong trận chung kết)
  const tournamentChampion = useMemo(() => {
    if (!bracket?.rounds?.length) return null;
    const finalRound = bracket.rounds[bracket.rounds.length - 1];
    const finalMatch = finalRound?.matches?.[0];
    return finalMatch?.status === "DONE" && finalMatch?.winner ? finalMatch.winner : null;
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

   const syncTournamentUpdate = (updated: Tournament | null) => {
    if (!updated) return;
    setTournaments((prev) => {
      const idx = prev.findIndex((t) => t.id === updated.id);
      if (idx >= 0) {
        return [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)];
      }
      return [updated, ...prev];
    });
  };

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
    if (!canManage) {
      triggerToast("Chỉ Ban tổ chức (BTC) hoặc Quản trị viên mới có quyền duyệt lệ phí.");
      return;
    }
    try {
      setConfirmingTeam(teamName);
      const res = await confirmTeamPayment(selected.id, teamName);
      const updated = await refreshTournamentInCache(selected.id);
      syncTournamentUpdate(updated);
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
 const updated = await refreshTournamentInCache(selected.id);
   syncTournamentUpdate(updated);
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
 const updated = await refreshTournamentInCache(selected.id);
   syncTournamentUpdate(updated);
 triggerToast(res.message);
 } catch (err: any) {
 triggerToast(err?.message || "Cần đăng nhập ORGANIZER hoặc ADMIN để dọn đội Test.");
 } finally {
 setClearBusy(false);
 }
 };

   const startSimulate = async (nextStageOnly: boolean = false) => {
  if (!selected) return;
  try {
  setSimulateBusy(true);
  const res = await simulateTournamentResults(selected.id, nextStageOnly);
  // Tai lai giai de ket qua gia lap hien ngay tren cay nhanh dau
  const updated = await refreshTournamentInCache(selected.id);
  syncTournamentUpdate(updated);
  triggerToast(res.message);
  setConfirmSimulate(false);
  setConfirmStageSimulate(false);
  } catch (err: any) {
  triggerToast(err?.message || "Cần đăng nhập ORGANIZER, OWNER hoặc ADMIN để giả lập.");
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
 const updated = await refreshTournamentInCache(selected.id);
   syncTournamentUpdate(updated);
 } catch (err: any) {
 triggerToast(err?.message || "Cần đăng nhập ORGANIZER hoặc ADMIN để bốc thăm.");
 } finally {
 setDrawBusy(false);
 }
 };

 /** BTC sinh lịch thật cho toàn bộ trận (ngày + khung giờ + sân) rồi lưu vào hệ thống. */
 const handleSchedule = async () => {
 if (!selected || !isScheduleValid) return;
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
 const updated = await refreshTournamentInCache(selected.id);
   syncTournamentUpdate(updated);
 } catch (err: any) {
 triggerToast(err?.message || "Cần đăng nhập ORGANIZER hoặc ADMIN để xếp lịch.");
 } finally {
 setScheduleBusy(false);
 }
 };

 // BXH thật: thắng/hòa/thua/điểm/hiệu số/bàn thắng/bàn thua tính từ các trận DONE trong nhánh đấu.
 // Thắng = 3đ, Hòa = 1đ. Xếp: điểm → hiệu số → bàn thắng → tỷ lệ thắng.
 const tableRows = useMemo(() => {
 const base = new Map<string, { team: string; captain: string; winRate: number; simulated: boolean; played: number; won: number; drawn: number; lost: number; gf: number; ga: number }>();
 (selected?.teams ?? []).forEach((t) =>
 base.set(t.teamName, {
 team: t.teamName,
 captain: t.captainName ?? "—",
 winRate: t.winRate ?? 0,
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

 const getStageStatus = (teamName: string) => {
 if (!bracket?.rounds || bracket.rounds.length === 0) {
 return { label: "Đã ghi danh", tone: "bg-slate-100 text-slate-700 border-slate-200" };
 }
 const totalRounds = bracket.rounds.length;
 const finalRound = bracket.rounds[totalRounds - 1];
 const finalMatch = finalRound?.matches?.[0];

 if (finalMatch?.status === "DONE" && finalMatch.winner) {
 if (finalMatch.winner === teamName) {
 return { label: "Vô Địch 🏆", tone: "bg-amber-100 text-amber-900 border-amber-300 font-black shadow-xs" };
 }
 if ((finalMatch.teamA?.name === teamName || finalMatch.teamB?.name === teamName) && finalMatch.winner !== teamName) {
 return { label: "Á Quân 🥈", tone: "bg-slate-100 text-slate-800 border-slate-300 font-bold" };
 }
 }

 for (let ri = totalRounds - 1; ri >= 0; ri--) {
 const round = bracket.rounds[ri];
 for (const m of (round.matches ?? [])) {
 const isInMatch = m.teamA?.name === teamName || m.teamB?.name === teamName;
 if (!isInMatch) continue;

 if (m.status === "DONE") {
 if (m.winner === teamName) {
 return { label: `Thắng ${round.name}`, tone: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold" };
 } else if (m.winner && m.winner !== teamName) {
 return { label: `Dừng bước (${round.name})`, tone: "bg-slate-50 text-slate-500 border-slate-200" };
 }
 } else {
 const isFinal = ri === totalRounds - 1;
 return {
 label: isFinal ? "Tranh Chung Kết 🔥" : `Đang đấu ${round.name}`,
 tone: isFinal ? "bg-amber-50 text-amber-800 border-amber-200 font-bold" : "bg-sky-50 text-sky-800 border-sky-200 font-bold"
 };
 }
 }
 }

 return { label: "Đang thi đấu", tone: "bg-sky-50 text-sky-700 border-sky-200" };
 };

 return Array.from(base.values())
 .map((r) => ({
 ...r,
 points: r.won * 3 + r.drawn,
 diff: r.gf - r.ga,
 stageStatus: getStageStatus(r.team),
 }))
 .sort((x, y) => y.points - x.points || y.diff - x.diff || y.gf - x.gf || (y.winRate ?? 0) - (x.winRate ?? 0));
 }, [selected, bracket]);

 /** Huỷ kết quả để nhập lại — backend xóa bản ghi và cầu thủ ghi bàn, phong độ tự tính lại. */
 const handleUndoScore = async (m: BracketMatch) => {
 if (!selected) return;
 try {
 setSavingMatch(m.matchId);
 const res = await undoMatchResult(selected.id, m.matchId);
 triggerToast(
 `${res.message}` +
 (res.goalEventsRemoved ? ` • Đã xóa ${res.goalEventsRemoved} dòng cầu thủ ghi bàn.` : "")
 );
 setScorerOpen((o) => {
 const next = { ...o };
 delete next[m.matchId];
 return next;
 });
 setMatchStats((prev) => {
  const next = { ...prev };
  delete next[m.matchId];
  return next;
 });
 setScorerRows((prev) => {
 const next = { ...prev };
 delete next[m.matchId];
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
 triggerToast("Vòng loại trực tiếp cần phân thắng bại, không nhận tỷ số hòa.");
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
 if (selected?.id) loadTopScorers(selected.id);
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
 triggerToast("Vòng loại trực tiếp cần phân thắng bại, không nhận tỷ số hòa.");
 return;
 }
 if (varMatch.status === "DONE") {
 triggerToast("Trận này đã có kết quả. Dùng nút “Huỷ KQ” trên thẻ trận để nhập lại.");
 return;
 }
 try {
 setSavingMatch(varMatch.matchId);
 const goalEvents = varEvents
   .filter((e) => e.type === "GOAL")
   .map((e) => ({
     playerName: e.playerName.trim(),
     teamName: e.teamName,
     goals: 1,
     assists: 0,
   }));
 const yellowA = varEvents.filter((e) => e.type === "YELLOW_CARD" && e.teamName === varMatch.teamA?.name).length;
 const yellowB = varEvents.filter((e) => e.type === "YELLOW_CARD" && e.teamName === varMatch.teamB?.name).length;
 const redA = varEvents.filter((e) => e.type === "RED_CARD" && e.teamName === varMatch.teamA?.name).length;
 const redB = varEvents.filter((e) => e.type === "RED_CARD" && e.teamName === varMatch.teamB?.name).length;
 const res = await saveMatchResult(selected.id, {
 matchId: varMatch.matchId,
 scoreA: varScoreA,
 scoreB: varScoreB,
 scorers: goalEvents.length > 0 ? goalEvents : undefined,
 yellowCardsA: yellowA,
 yellowCardsB: yellowB,
 redCardsA: redA,
 redCardsB: redB,
 });
 const forms = (res.formChanges ?? [])
 .map((c: any) => `${c.team} ${c.after?.record ?? ""}`)
 .join(" • ");
 pushVarLog(
 `Kết quả ${varMatch.teamA?.name} ${varScoreA}-${varScoreB} ${varMatch.teamB?.name} — Phong độ: ${forms}`,
 "ok"
 );
 triggerToast(`${res.message}${forms ? ` | Phong độ: ${forms}` : ""}`);
 if (selected?.id) loadTopScorers(selected.id);
 } catch (err: any) {
 triggerToast(err?.message || "Lưu kết quả thất bại.");
 } finally {
 setSavingMatch(null);
 }
 };

 const renderMatch = (match: BracketMatch, idx: number) => {
 if (match.status === "BYE" && match.bye) {
 return (
 <div key={match.matchId} style={{ animationDelay: `${Math.min(idx, 6) * 60}ms` }} className="animate-fade-in-up bg-amber-50 rounded-2xl border border-amber-300 overflow-hidden text-[14px]">
 <div className="p-3 flex justify-between items-center gap-2">
 <span className="font-bold text-amber-900 truncate">{match.bye.name}</span>
 <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[14px] font-black shrink-0">Miễn vòng</span>
 </div>
 {match.bye.record && (
 <div className="px-3 pb-2 text-[14px] font-mono text-amber-700 ">Thành tích {match.bye.record} • Hạt giống #{match.bye.seed ?? "—"}</div>
 )}
 </div>
 );
 }
 const tbd = match.status === "TBD";
 const done = match.status === "DONE";
 const isMyMatch = Boolean(myTeam && (match.teamA?.name === myTeam.teamName || match.teamB?.name === myTeam.teamName));
  const editable = canManage && !isClosed && match.status === "SCHEDULED" && match.teamA && !match.teamA.tbd && match.teamB && !match.teamB.tbd;
 const cur = scores[match.matchId] ?? { a: String(match.scoreA ?? 0), b: String(match.scoreB ?? 0) };
 const setScore = (side: "a" | "b", v: string) =>
 setScores((s) => ({ ...s, [match.matchId]: { a: side === "a" ? v : (s[match.matchId]?.a ?? String(match.scoreA ?? 0)), b: side === "b" ? v : (s[match.matchId]?.b ?? String(match.scoreB ?? 0)) } }));
 return (
 <div key={match.matchId} style={{ animationDelay: `${Math.min(idx, 6) * 60}ms` }} className={`animate-fade-in-up rounded-2xl border overflow-hidden text-[14px] shadow-xs ${isMyMatch ? "ring-2 ring-[#0369a1] border-sky-400 bg-sky-50/70" : done ? "bg-sky-50 border-sky-300 " : "bg-slate-50 border-slate-200 "}`}>
 <div className="px-2.5 pt-2 font-mono text-[14px] font-black text-slate-500 flex items-center justify-between gap-1">
 <span>{match.matchId} {isMyMatch && <span className="ml-1 px-1.5 py-0.5 rounded bg-[#0369a1] text-white text-[13px] font-bold">Trận của bạn</span>}</span>
 <div className="flex items-center gap-1">
 {done && <span className="text-sky-700 ">{match.winner ? "✓ ĐÃ ĐÁ" : "= HÒA"}</span>}
 {canManage && !isClosed && done && (
 <button
 type="button"
 title="Huỷ kết quả: mở lại trận để nhập tỷ số mới (phong độ tự tính lại)"
 aria-label={`Huỷ kết quả trận ${match.matchId}`}
 disabled={savingMatch === match.matchId}
 onClick={() => setConfirmUndo(match)}
 className="px-1.5 py-0.5 rounded-md border border-rose-300 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all text-[14px] font-black disabled:opacity-40 active:scale-95"
 >
 {savingMatch === match.matchId ? "…" : "Huỷ KQ"}
 </button>
 )}
 </div>
 </div>
 {/* Lịch thi đấu thật do BTC sinh (POST /schedule) */}
 {match.matchDate && (
 <div className="px-2.5 pt-1.5 flex flex-wrap items-center gap-1">
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 text-[14px] font-black">
 <Calendar className="w-2.5 h-2.5" />
 {prettyDate(match.matchDate)}
 </span>
 {match.timeSlot && (
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[14px] font-mono font-bold">
 <Clock className="w-2.5 h-2.5" />
 {match.timeSlot}
 </span>
 )}
 {match.pitchName && (
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[14px] font-bold truncate max-w-full">
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
 <span className="truncate flex items-center gap-1">{t?.name ?? "?"}{isWinner ? " 👑" : ""}{myTeam && t?.name === myTeam.teamName && <span className="px-1.5 py-0.2 rounded bg-sky-200 text-sky-900 font-black text-[13px]">Đội bạn</span>}</span>
 {t && !t.tbd && (t.record || t.form) && (
 <span className="font-mono text-[14px] text-slate-500 shrink-0">{t.record ?? t.form}</span>
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
 className="flex-1 py-1.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
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
 className="text-[14px] font-bold text-sky-800 hover:underline"
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
 className="px-1.5 py-1 rounded-md border border-slate-300 bg-white text-[14px] min-w-0 focus:outline-none focus:ring-1 focus:ring-[#0369a1]"
 />
 <select
 aria-label="Đội của cầu thủ"
 value={row.team}
 onChange={(e) => setScorerRow(match.matchId, ri, { team: e.target.value })}
 className="px-1 py-1 rounded-md border border-slate-300 bg-white text-[14px] font-bold focus:outline-none focus:ring-1 focus:ring-[#0369a1] truncate"
 >
 <option value={match.teamA?.name}>{match.teamA?.name}</option>
 <option value={match.teamB?.name}>{match.teamB?.name}</option>
 </select>
 <input
 type="number" min={0} aria-label="Số bàn" title="Bàn"
 value={row.goals}
 onChange={(e) => setScorerRow(match.matchId, ri, { goals: e.target.value })}
 className="px-1 py-1 rounded-md border border-slate-300 bg-white text-[14px] font-mono text-center focus:outline-none focus:ring-1 focus:ring-[#0369a1]"
 />
 <input
 type="number" min={0} aria-label="Kiến tạo" title="Kiến tạo"
 value={row.assists}
 onChange={(e) => setScorerRow(match.matchId, ri, { assists: e.target.value })}
 className="px-1 py-1 rounded-md border border-slate-300 bg-white text-[14px] font-mono text-center focus:outline-none focus:ring-1 focus:ring-[#0369a1]"
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
 <span className="text-[14px] text-slate-600">Cột: tên • đội • bàn • kiến tạo</span>
 <button
 type="button"
 onClick={() => addScorerRow(match)}
 className="text-[14px] font-black text-sky-700 hover:underline"
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

      {/* BANNER THÔNG BÁO GIẢI ĐÃ KẾT THÚC / CHẾ ĐỘ CHỈ XEM */}
      {isClosed && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800 shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                🏆 Giải Đấu Đã Kết Thúc (Chế Độ Lưu Trữ / Chỉ Xem)
              </h4>
              <p className="text-[14px] text-amber-800 mt-0.5">
                Toàn bộ kết quả, tỷ số các vòng và nhánh đấu đã được đóng băng. Bạn chỉ có thể tra cứu và xem lại dữ liệu lịch sử.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[14px] self-start sm:self-auto shrink-0 shadow-xs">
            Đã Hoàn Tất
          </span>
        </div>
      )}
 {/* Toast Notification */}
 {toastMessage && (
 <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:top-6 sm:right-6 z-50 bg-slate-900 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-sky-400 animate-fade-in-up sm:max-w-sm">
 <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
 <span className="font-semibold text-[14px] sm:text-sm">{toastMessage}</span>
 </div>
 )}

 {/* Banner Ảnh Bìa Giải Đấu Trực Quan */}
 {selected && (
   <div className="relative h-44 sm:h-56 w-full rounded-2xl bg-slate-900 overflow-hidden border border-slate-200 shadow-xs">
     <SafeImage
       src={selected.bannerUrl || (selected as any).imageUrl || "/images/copa-action.png"}
       alt={selected.title}
       className="w-full h-full object-cover brightness-75"
     />
     <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
     <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 text-white">
       <div>
         <div className="flex items-center gap-2 mb-1.5 flex-wrap">
           <span className="px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white font-bold text-[13px] border border-white/20">
             {sportLabel(selected.sportType)}
           </span>
           <span className="px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white font-bold text-[13px] border border-white/20">
             {formatLabel(selected.format)}
           </span>
           <span className="px-2.5 py-0.5 rounded-md bg-emerald-600/90 text-white font-bold text-[13px]">
             {selected.status === "ONGOING" ? "Đang diễn ra" : selected.status === "COMPLETED" ? "Đã kết thúc" : "Đang mở"}
           </span>
         </div>
         <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-sm">
           {selected.title}
         </h2>
         <p className="text-[13px] text-slate-300 font-medium mt-1">
           📍 {selected.pitchName || selected.location || "Đà Nẵng"} • 🏆 Thưởng: {formatMoney(selected.prizePool)}
         </p>
       </div>

       <div className="text-right shrink-0">
         <span className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-amber-300 font-bold text-[13px] border border-amber-300/30">
           👥 {teamCount}/{teamCap || "—"} Đội Thi Đấu
         </span>
       </div>
     </div>
   </div>
 )}

 {/* Main Header Banner */}
 <div className="bg-white border border-slate-300 rounded-lg p-5 text-slate-900">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-6 relative z-10">
 <div className="min-w-0">
 <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0369a1]/10 border border-[#0369a1]/30 text-sky-800 text-[14px] font-bold mb-3">
 <Trophy className="w-4 h-4 text-sky-700 " />
 <span>
   {canManage
     ? (selected ? `${selected.title} • Quản Trị & Bàn VAR` : "Quản trị giải đấu & Bàn trọng tài VAR")
     : (selected ? `${selected.title} • Bảng Đấu & Lịch Thi Đấu` : "Theo dõi giải đấu & Lịch thi đấu")}
 </span>
 </div>
 <h1 className="text-lg sm:text-3xl font-extrabold tracking-tight text-slate-900 ">
   {canManage ? "Quản Trị Nhánh Đấu & Lịch Trình" : "Bảng Đấu & Lịch Thi Đấu"}
 </h1>
 <p className="text-slate-600 text-[14px] sm:text-sm mt-1 max-w-2xl">
 {selected
 ? `${sportLabel(selected.sportType)} • ${formatLabel(selected.format)} • ${teamCount}/${teamCap || "—"} đội • Khởi tranh ${formatDate(selected.startDate)}`
 : canManage
 ? "Chọn một giải đấu để quản lý nhánh đấu và xếp lịch."
 : "Chọn giải đấu để theo dõi bảng đấu, nhánh thi đấu và phong độ các đội."}
 </p>
 </div>

 {/* Tournament selector + management actions */}
 <div className="flex flex-col gap-3 min-w-0 lg:min-w-[320px]">
 {canManage ? (
   <>
     <label className="text-[14px] font-bold text-slate-500 tracking-wider" htmlFor="bracket-tournament">
       Giải đấu đang quản lý
     </label>
     <select
       id="bracket-tournament"
       value={selectedId}
       onChange={(e) => setSelectedId(e.target.value)}
       className="bg-slate-50 border border-slate-200 text-[14px] font-extrabold text-slate-900 rounded-xl px-3.5 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0369a1] max-w-full"
     >
       {tournaments.length === 0 && <option value="">Chưa có giải đấu</option>}
       {[...tournaments].sort((a, b) => Number(b.id) - Number(a.id)).map((t) => (
         <option key={t.id} value={t.id}>
           {t.title} ({confirmedCount(t)}/{t.totalTeams ?? "—"} đội • {t.status})
         </option>
       ))}
     </select>

     <div className="flex flex-wrap items-center gap-2">
       {selected?.joinMode === "INVITE_ONLY" && (
         <button
           type="button"
           onClick={() => setShowInviteModal(true)}
           title="Giải có ràng buộc mời qua email — Mở popup gửi thư mời"
           className="px-3.5 py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-extrabold text-[14px] transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
         >
           <Mail className="w-4 h-4 text-amber-700" />
           <span>Mời Email</span>
         </button>
       )}
       <button
         onClick={() => handleFill()}
         disabled={!canAct || !selected || full || fillBusy}
         title="Tự động thêm đúng số đội ngẫu nhiên còn thiếu cho đủ quy mô giải, giữ nguyên 100% các đội thủ công bạn đã tạo"
         className="px-3.5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[14px] transition-all flex items-center space-x-1.5 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
       >
         {fillBusy ? (
           <RefreshCw className="w-4 h-4 animate-spin" />
         ) : (
           <UserPlus className="w-4 h-4" />
         )}
         <span>{full ? "Đã đủ đội" : `+ Điền Ngẫu Nhiên (${selected && teamCap ? teamCap - teamCount : ""} Đội)`}</span>
       </button>

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
             className="w-12 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[14px] font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
           />
           <span className="text-[14px] font-bold text-slate-500 shrink-0">đội</span>
           <button
             onClick={() => handleFill(Number(addCount))}
             disabled={fillBusy || !canManage || !Number(addCount)}
             title="Thêm đúng số đội Test đã nhập vào giải đang chọn"
             className="px-2.5 py-1.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
           >
             {fillBusy ? "..." : "Thêm đội"}
           </button>
         </div>
       )}

       {simulatedCount > 0 && (
         <button
           onClick={handleClearSimulated}
           disabled={!canAct || !selected || clearBusy}
           title="Xóa đội ngẫu nhiên đã giả lập, giữ nguyên 100% các đội thủ công bạn đã tạo"
           className="px-3.5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-[14px] transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-40"
         >
           {clearBusy ? (
             <RefreshCw className="w-4 h-4 animate-spin" />
           ) : (
             <RotateCcw className="w-4 h-4" />
           )}
           <span>Xoá {simulatedCount} Đội Ngẫu Nhiên</span>
         </button>
       )}

       <button
         onClick={() => (bracket ? setConfirmDraw(true) : startDraw())}
         disabled={!canAct || !selected || teamCount < 2 || drawBusy}
         title="Bốc thăm hạt giống theo thứ tự đăng ký, lưu nhánh đấu vào hệ thống"
         className="px-3.5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[14px] transition-all flex items-center space-x-1.5 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
       >
         {drawBusy ? (
           <RefreshCw className="w-4 h-4 animate-spin" />
         ) : (
           <Shuffle className="w-4 h-4" />
         )}
         <span>{bracket ? "Bốc thăm lại" : selected?.format === "ROUND_ROBIN" ? "Xếp lịch" : "Bốc thăm"}</span>
       </button>

       {bracket && (
         <>
           <button
             type="button"
             onClick={() => setConfirmStageSimulate(true)}
             disabled={!canAct || !selected || simulateBusy || !nextPlayableStage}
             title={nextPlayableStage ? `Giả lập kết quả vòng ${nextPlayableStage}` : "Đã hoàn thành toàn bộ các vòng đấu"}
             className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[14px] transition-all flex items-center space-x-1.5 shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
           >
             {simulateBusy ? (
               <RefreshCw className="w-4 h-4 animate-spin" />
             ) : (
               <Play className="w-4 h-4 fill-white" />
             )}
             <span>{nextPlayableStage ? `Giả lập: ${nextPlayableStage}` : "Đã xong tất cả vòng"}</span>
           </button>

           {nextPlayableStage && (
             <button
               type="button"
               onClick={() => setConfirmSimulate(true)}
               disabled={!canAct || !selected || simulateBusy}
               title="Tự random tỷ số tất cả các vòng còn lại một lèo"
               className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-[14px] transition-all flex items-center space-x-1.5 shadow-sm border border-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
             >
               <Dices className="w-4 h-4 text-slate-500" />
               <span className="hidden sm:inline">Giả lập cả giải</span>
             </button>
           )}
         </>
       )}

       {bracket && (
         <button
           onClick={() => setShowScheduleForm((v) => !v)}
           disabled={!canAct || !selected || scheduleBusy}
           title="Sinh ngày + khung giờ + sân cho từng trận, lưu vào hệ thống"
           className={`px-3.5 py-2.5 rounded-xl font-extrabold text-[14px] transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-40 ${
             showScheduleForm
               ? "bg-[#0369a1] text-white shadow-lg"
               : "bg-white text-[#0369a1] hover:bg-[#0369a1]/10 border border-[#0369a1]/40"
           }`}
         >
           <Calendar className="w-4 h-4" />
           <span>Xếp Lịch</span>
         </button>
       )}
     </div>
   </>
 ) : (
   /* GIAO DIỆN CẦU THỦ & KHÁN GIẢ XEM GIẢI */
   <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
     <div className="flex-1">
       <label className="text-[13px] font-bold text-slate-600 block mb-1" htmlFor="bracket-tournament">
         Chọn giải đấu để theo dõi:
       </label>
       <select
         id="bracket-tournament"
         value={selectedId}
         onChange={(e) => setSelectedId(e.target.value)}
         className="w-full bg-slate-50 border border-slate-300 text-[14px] font-bold text-slate-900 rounded-xl px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
       >
         {tournaments.length === 0 && <option value="">Chưa có giải đấu</option>}
         {[...tournaments].sort((a, b) => Number(b.id) - Number(a.id)).map((t) => (
           <option key={t.id} value={t.id}>
             {t.title} ({confirmedCount(t)}/{t.totalTeams ?? "—"} đội • {sportLabel(t.sportType)})
           </option>
         ))}
       </select>
     </div>
     {!full && !myTeam && !isClosed && (
       <a
         href={`/tournaments/register?tournamentId=${selected?.id}`}
         className="px-4 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] shadow-sm flex items-center justify-center gap-1.5 transition-all shrink-0 sm:mt-5 cursor-pointer"
       >
         <UserPlus className="w-4 h-4" />
         <span>Đăng Ký Đội</span>
       </a>
     )}
   </div>
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

 {/* Xác nhận giả lập từng giai đoạn */}
 <ConfirmModal
 open={confirmStageSimulate}
 inline
 title={`Kiểm tra điều kiện & giả lập: ${nextPlayableStage || "giai đoạn tiếp theo"}`}
 disabled={!canSimulateNextStage}
 message={
 <div className="space-y-3">
 <p className="text-[14px] text-slate-700">
 Hệ thống sẽ tự động phân định kết quả các trận thuộc <strong>“{nextPlayableStage}”</strong> của giải{" "}
 <strong>“{selected?.title}”</strong> sau khi kiểm tra đạt các tiêu chuẩn thi đấu:
 </p>

 <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[13px] space-y-2">
 <div className="font-extrabold text-slate-900 flex items-center justify-between pb-1.5 border-b border-slate-200">
 <span>Tiêu chuẩn thi đấu ({nextPlayableStage})</span>
 <span
 className={`px-2.5 py-0.5 rounded-lg text-[13px] font-bold ${
 canSimulateNextStage
 ? "bg-emerald-100 text-emerald-800"
 : "bg-rose-100 text-rose-800"
 }`}
 >
 {canSimulateNextStage ? "Đủ điều kiện" : "Chưa đủ điều kiện"}
 </span>
 </div>

 <div className="flex items-center justify-between">
 <span className="flex items-center gap-1.5 text-slate-600">
 {isTeamCountValid ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 ) : (
 <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
 )}
 <span>Quân số đăng ký theo điều lệ</span>
 </span>
 <span className={`font-bold ${isTeamCountValid ? "text-emerald-700" : "text-rose-600"}`}>
 {teamCount}/{teamCap || "—"} Đội {isTeamCountValid ? "(Đạt)" : "(Chưa đủ)"}
 </span>
 </div>

 <div className="flex items-center justify-between">
 <span className="flex items-center gap-1.5 text-slate-600">
 {isPaymentValid ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 ) : (
 <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
 )}
 <span>Xác nhận lệ phí tham gia</span>
 </span>
 <span className={`font-bold ${isPaymentValid ? "text-emerald-700" : "text-rose-600"}`}>
 {isPaymentValid ? "100% Đã thu phí" : `Còn ${pendingTeams.length} đội chờ thu phí`}
 </span>
 </div>

 <div className="flex items-center justify-between">
 <span className="flex items-center gap-1.5 text-slate-600">
 {isBracketValid ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 ) : (
 <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
 )}
 <span>Sơ đồ phân nhánh thi đấu</span>
 </span>
 <span className={`font-bold ${isBracketValid ? "text-emerald-700" : "text-rose-600"}`}>
 {isBracketValid ? "Đã bốc thăm" : "Chưa bốc thăm"}
 </span>
 </div>

 <div className="flex items-center justify-between">
 <span className="flex items-center gap-1.5 text-slate-600">
 {stageValidation.isValid ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 ) : (
 <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
 )}
 <span>Tiến độ các vòng trước</span>
 </span>
 <span className={`font-bold ${stageValidation.isValid ? "text-emerald-700" : "text-rose-600"}`}>
 {stageValidation.isValid ? "Đã hoàn tất 100%" : `Chưa xong ${stageValidation.uncompletedStage}`}
 </span>
 </div>
 </div>

 {!canSimulateNextStage && (
 <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13px] flex items-start gap-2">
 <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
 <span>
 {!isPaymentValid
 ? `Vui lòng bấm nút "Đã thu phí" cho ${pendingTeams.length} đội ở danh sách phía trên trước khi tiến hành thi đấu.`
 : !isTeamCountValid
 ? `Giải đấu chưa đủ ${teamCap} đội theo điều lệ. Hãy điền hoặc thêm đủ đội trước khi giả lập.`
 : !stageValidation.isValid
 ? `Cần hoàn tất các trận của vòng "${stageValidation.uncompletedStage}" trước khi tiến hành vòng này.`
 : "Chưa đủ điều kiện khởi tranh."}
 </span>
 </div>
 )}
 </div>
 }
 confirmLabel={canSimulateNextStage ? `Giả lập ${nextPlayableStage || "giai đoạn này"}` : "Chưa đủ điều kiện"}
 danger={false}
 busy={simulateBusy}
 onCancel={() => setConfirmStageSimulate(false)}
 onConfirm={() => startSimulate(true)}
 />

 {/* Xác nhận giả lập kết quả toàn giải */}
 <ConfirmModal
 open={confirmSimulate}
 inline
 title="Kiểm tra điều kiện & giả lập kết quả cả giải"
 disabled={!canSimulateAll}
 message={
 <div className="space-y-3">
 <p className="text-[14px] text-slate-700">
 Hệ thống sẽ tự động phân định kết quả cho mọi trận chưa đấu của giải{" "}
 <strong>“{selected?.title}”</strong> để tìm ra nhà vô địch sau khi kiểm tra các điều kiện:
 </p>

 <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[13px] space-y-2">
 <div className="font-extrabold text-slate-900 flex items-center justify-between pb-1.5 border-b border-slate-200">
 <span>Tiêu chuẩn thi đấu toàn giải</span>
 <span
 className={`px-2.5 py-0.5 rounded-lg text-[13px] font-bold ${
 canSimulateAll
 ? "bg-emerald-100 text-emerald-800"
 : "bg-rose-100 text-rose-800"
 }`}
 >
 {canSimulateAll ? "Đủ điều kiện" : "Chưa đủ điều kiện"}
 </span>
 </div>

 <div className="flex items-center justify-between">
 <span className="flex items-center gap-1.5 text-slate-600">
 {isTeamCountValid ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 ) : (
 <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
 )}
 <span>Quân số đăng ký</span>
 </span>
 <span className={`font-bold ${isTeamCountValid ? "text-emerald-700" : "text-rose-600"}`}>
 {teamCount}/{teamCap || "—"} Đội {isTeamCountValid ? "(Đạt)" : "(Chưa đủ)"}
 </span>
 </div>

 <div className="flex items-center justify-between">
 <span className="flex items-center gap-1.5 text-slate-600">
 {isPaymentValid ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 ) : (
 <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
 )}
 <span>Lệ phí tham gia</span>
 </span>
 <span className={`font-bold ${isPaymentValid ? "text-emerald-700" : "text-rose-600"}`}>
 {isPaymentValid ? "100% Đã thu phí" : `Còn ${pendingTeams.length} đội chờ thu phí`}
 </span>
 </div>

 <div className="flex items-center justify-between">
 <span className="flex items-center gap-1.5 text-slate-600">
 {isBracketValid ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 ) : (
 <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
 )}
 <span>Sơ đồ phân nhánh</span>
 </span>
 <span className={`font-bold ${isBracketValid ? "text-emerald-700" : "text-rose-600"}`}>
 {isBracketValid ? "Đã bốc thăm" : "Chưa bốc thăm"}
 </span>
 </div>
 </div>

 {!canSimulateAll && (
 <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13px] flex items-start gap-2">
 <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
 <span>
 {!isPaymentValid
 ? `Vui lòng bấm nút "Đã thu phí" cho ${pendingTeams.length} đội ở danh sách phía trên trước khi tiến hành thi đấu.`
 : !isTeamCountValid
 ? `Giải đấu chưa đủ ${teamCap} đội theo điều lệ. Hãy điền hoặc thêm đủ đội trước khi giả lập.`
 : "Chưa đủ điều kiện khởi tranh."}
 </span>
 </div>
 )}
 </div>
 }
 confirmLabel={canSimulateAll ? "Giả lập toàn bộ" : "Chưa đủ điều kiện"}
 danger={false}
 busy={simulateBusy}
 onCancel={() => setConfirmSimulate(false)}
 onConfirm={() => startSimulate(false)}
 />

 {/* Xác nhận huỷ kết quả (xóa bản ghi + cầu thủ ghi bàn, phong độ tự tính lại) */}
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
 <strong>xóa danh sách cầu thủ ghi bàn</strong> của trận này (phong độ tính lại từ các trận còn lại).
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
 <p className="text-[14px] font-black text-[#0b4f6c] tracking-wider">
 Tham số xếp lịch
 </p>
 <div className="grid grid-cols-2 gap-2">
 <label className="col-span-2 sm:col-span-1 block">
 <span className="text-[14px] font-bold text-slate-700 block mb-1">
 Ngày thi đấu đầu tiên
 </span>
 <input
 type="date"
 value={scheduleForm.startDate}
 onChange={(e) => setScheduleForm((f) => ({ ...f, startDate: e.target.value }))}
 className={`w-full px-2.5 py-1.5 rounded-lg border bg-white text-slate-900 text-[14px] focus:outline-none focus:ring-2 ${
   scheduleErrors.startDate ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
 }`}
 />
 {scheduleErrors.startDate ? (
   <p className="mt-1 text-[13px] font-semibold text-rose-600">{scheduleErrors.startDate}</p>
 ) : !scheduleForm.startDate ? (
   <span className="text-[14px] text-slate-600">
   Để trống = dùng ngày khai giải ({prettyDate(selected?.startDate) || "—"}).
   </span>
 ) : null}
 </label>
 <label className="block">
 <span className="text-[14px] font-bold text-slate-700 block mb-1">Trận / ngày</span>
 <input
 type="number"
 min={1}
 max={12}
 value={scheduleForm.matchesPerDay}
 onChange={(e) => setScheduleForm((f) => ({ ...f, matchesPerDay: e.target.value }))}
 className={`w-full px-2.5 py-1.5 rounded-lg border bg-white text-slate-900 text-[14px] font-mono focus:outline-none focus:ring-2 ${
   scheduleErrors.matchesPerDay ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
 }`}
 />
 {scheduleErrors.matchesPerDay && (
   <p className="mt-1 text-[13px] font-semibold text-rose-600">{scheduleErrors.matchesPerDay}</p>
 )}
 </label>
 <label className="block">
 <span className="text-[14px] font-bold text-slate-700 block mb-1">Cách giữa vòng (ngày)</span>
 <input
 type="number"
 min={0}
 max={14}
 value={scheduleForm.daysBetweenRounds}
 onChange={(e) => setScheduleForm((f) => ({ ...f, daysBetweenRounds: e.target.value }))}
 className={`w-full px-2.5 py-1.5 rounded-lg border bg-white text-slate-900 text-[14px] font-mono focus:outline-none focus:ring-2 ${
   scheduleErrors.daysBetweenRounds ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
 }`}
 />
 {scheduleErrors.daysBetweenRounds && (
   <p className="mt-1 text-[13px] font-semibold text-rose-600">{scheduleErrors.daysBetweenRounds}</p>
 )}
 </label>
 <label className="block">
 <span className="text-[14px] font-bold text-slate-700 block mb-1">Giờ bắt đầu</span>
 <input
 type="number"
 min={0}
 max={23}
 value={scheduleForm.startHour}
 onChange={(e) => setScheduleForm((f) => ({ ...f, startHour: e.target.value }))}
 className={`w-full px-2.5 py-1.5 rounded-lg border bg-white text-slate-900 text-[14px] font-mono focus:outline-none focus:ring-2 ${
   scheduleErrors.startHour ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
 }`}
 />
 {scheduleErrors.startHour && (
   <p className="mt-1 text-[13px] font-semibold text-rose-600">{scheduleErrors.startHour}</p>
 )}
 </label>
 <label className="block">
 <span className="text-[14px] font-bold text-slate-700 block mb-1">Độ dài trận (phút)</span>
 <input
 type="number"
 min={30}
 max={240}
 step={15}
 value={scheduleForm.matchMinutes}
 onChange={(e) => setScheduleForm((f) => ({ ...f, matchMinutes: e.target.value }))}
 className={`w-full px-2.5 py-1.5 rounded-lg border bg-white text-slate-900 text-[14px] font-mono focus:outline-none focus:ring-2 ${
   scheduleErrors.matchMinutes ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
 }`}
 />
 {scheduleErrors.matchMinutes && (
   <p className="mt-1 text-[13px] font-semibold text-rose-600">{scheduleErrors.matchMinutes}</p>
 )}
 </label>
 </div>
 <button
 type="button"
 onClick={handleSchedule}
 disabled={scheduleBusy || !isScheduleValid}
 className="w-full px-3.5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[14px] transition-all flex items-center justify-center space-x-1.5 shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {scheduleBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
 <span>{scheduleBusy ? "Đang xếp lịch…" : "Sinh lịch & lưu vào hệ thống"}</span>
 </button>
 <p className="hidden sm:block text-[14px] text-slate-500 leading-relaxed">
 Sân lấy từ <span className="font-bold text-slate-500">{selected?.pitchName || selected?.location || "Sân BTC"}</span> trong hồ sơ giải. Xếp lại sẽ ghi đè lịch cũ.
 </p>
 </div>
 )}

  {/* Duyệt lệ phí: đội PENDING chờ BTC xác nhận đã thu tiền (chỉ hiển thị cho quản lý) */}
  {canManage && pendingTeams.length > 0 && (
  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 space-y-2">
  <div className="flex items-center justify-between">
    <p className="text-[14px] font-black text-amber-800 tracking-wider">
      Chờ xác nhận lệ phí ({pendingTeams.length})
    </p>
    {!canManage && (
      <span className="text-[14px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
        Chờ BTC duyệt
      </span>
    )}
  </div>
  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
  {pendingTeams.map((t) => (
  <div key={t.teamName} className="flex items-center justify-between gap-2 text-[14px]">
    <span className="text-slate-800 font-bold truncate">
      {t.teamName}
      <span className="text-slate-600 font-medium"> • {t.captainPhone || "—"}</span>
    </span>
    {canManage ? (
      <button
        type="button"
        onClick={() => handleConfirmPayment(t.teamName)}
        disabled={confirmingTeam === t.teamName || (teamCap > 0 && teamCount >= teamCap)}
        title={teamCap > 0 && teamCount >= teamCap ? "Giải đã đủ " + teamCap + " đội — hãy tăng sức chứa trước khi duyệt thêm" : "Xác nhận đã thu lệ phí của đội này"}
        className="shrink-0 px-2.5 py-1 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-black transition-all active:scale-95 disabled:opacity-50"
      >
        {confirmingTeam === t.teamName ? "Đang duyệt…" : "Đã thu phí"}
      </button>
    ) : (
      <span className="shrink-0 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[14px] font-bold">
        Đang chờ cọc
      </span>
    )}
  </div>
  ))}
  </div>
  {canManage && teamCap > 0 && teamCount >= teamCap && (
    <p className="text-[14px] text-rose-600 font-semibold pt-1">
      ⚠️ Giải đã đủ {teamCap} đội. Hãy tăng sức chứa trước khi duyệt thêm.
    </p>
  )}
  </div>
  )}
 </div>
 </div>

 {/* KHÔNG GIAN DÀNH RIÊNG CHO CẦU THỦ & KHÁN GIẢ (PLAYER & TEAM TOURNAMENT HUB) */}
 {!canManage && selected && (
   <div className="mt-4 space-y-4">
     {/* 1. Lời mời tham gia giải (nếu email của Cầu thủ có trong danh sách mời và chưa đăng ký đội) */}
     {isInvited && !myTeam && !isClosed && (
       <div className="rounded-xl border border-sky-300 bg-sky-50 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
         <div className="flex items-start gap-3.5">
           <div className="w-10 h-10 rounded-xl bg-[#0369a1] text-white flex items-center justify-center shrink-0 shadow-xs">
             <Mail className="w-5 h-5" />
           </div>
           <div className="space-y-1">
             <div className="flex items-center gap-2 flex-wrap">
               <span className="px-2.5 py-0.5 rounded-full bg-sky-200 text-sky-900 font-bold text-[13px]">
                 Thư Mời Thi Đấu
               </span>
               <span className="text-[13px] text-slate-600">
                 Gửi tới email: <strong className="text-slate-900">{authUser?.email}</strong>
               </span>
             </div>
             <h3 className="text-base sm:text-lg font-bold text-slate-900">
               Bạn đã nhận được thư mời tham gia giải “{selected.title}”!
             </h3>
             <p className="text-[14px] text-slate-600 leading-relaxed">
               Ban Tổ Chức đã gửi lời mời chính thức tới bạn. Hãy đăng ký đội bóng để giữ chỗ thi đấu trước khi đủ suất ({teamCount}/{teamCap || "—"} đội đã tham gia).
             </p>
           </div>
         </div>
         <a
           href={`/tournaments/register?tournamentId=${selected.id}`}
           className="px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] shadow-sm flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer"
         >
           <UserPlus className="w-4 h-4" />
           <span>Đăng Ký Đội Tham Gia</span>
         </a>
       </div>
     )}

     {/* 2. Trạng thái đội bóng của Cầu thủ: ĐANG CHỜ PHÊ DUYỆT LỆ PHÍ */}
     {myTeam && (myTeam.registrationStatus === "PENDING_PAYMENT" || (myTeam as any)?.status === "PENDING_PAYMENT") && (
       <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
         <div className="flex items-start gap-3.5">
           <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
             <Clock className="w-5 h-5" />
           </div>
           <div className="space-y-1">
             <div className="flex items-center gap-2 flex-wrap">
               <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[13px]">
                 Chờ Xác Nhận Lệ Phí
               </span>
               <span className="text-[13px] text-slate-600">
                 Đội bóng: <strong className="text-slate-900">{myTeam.teamName}</strong>
               </span>
             </div>
             <h3 className="text-base sm:text-lg font-bold text-slate-900">
               Đơn đăng ký của đội “{myTeam.teamName}” đang chờ Ban Tổ Chức duyệt
             </h3>
             <p className="text-[14px] text-slate-600 leading-relaxed">
               Lệ phí tham gia: <strong className="text-amber-800 font-mono">{formatMoney(selected.entryFee || 0)}</strong>.
               {selected.bankAccount ? (
                 <span>
                   {" "}Vui lòng chuyển khoản tới STK <strong>{selected.bankAccount}</strong> ({selected.bankCode || "Ngân hàng"} - {selected.accountName || "Ban Tổ Chức"}) với nội dung <strong>{myTeam.teamName}</strong> để được xác nhận vào nhánh đấu chính thức.
                 </span>
               ) : (
                 <span> Vui lòng liên hệ trực tiếp Ban Tổ Chức giải để hoàn tất thủ tục.</span>
               )}
             </p>
           </div>
         </div>
         <div className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 text-[13px] font-bold shrink-0 text-center">
           Chờ BTC Xác Nhận
         </div>
       </div>
     )}

     {/* 3. Trạng thái đội bóng của Cầu thủ: ĐÃ ĐƯỢC DUYỆT CHÍNH THỨC */}
     {myTeam && myTeam.registrationStatus !== "PENDING_PAYMENT" && (myTeam as any)?.status !== "PENDING_PAYMENT" && (
       <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 sm:p-5 space-y-3 shadow-xs">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
               <Shield className="w-5 h-5" />
             </div>
             <div>
               <div className="flex items-center gap-2 flex-wrap">
                 <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[13px]">
                   Đã Xác Nhận Tham Gia
                 </span>
                 <span className="text-[13px] text-slate-600">
                   Đội trưởng: <strong className="text-slate-900">{myTeam.captainName || authUser?.fullName || "Bạn"}</strong>
                 </span>
               </div>
               <h3 className="text-base sm:text-lg font-bold text-slate-900">
                 Đội bóng “{myTeam.teamName}” đã sẵn sàng thi đấu tại giải!
               </h3>
             </div>
           </div>

           <div className="flex items-center gap-2 shrink-0">
             <button
               type="button"
               onClick={() => setActiveTab("schedule")}
               className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-bold transition-all shadow-xs cursor-pointer"
             >
               Xem Lịch Trận Của Đội
             </button>
           </div>
         </div>

         {/* Card tóm tắt trận đấu sắp tới của đội */}
         {myNextMatch && (
           <div className="p-3.5 rounded-lg bg-white border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[14px]">
             <div className="flex items-center gap-2.5 flex-wrap">
               <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[13px] shrink-0">
                 {myNextMatch.roundTitle}
               </span>
               <span className="font-bold text-slate-900">
                 {myTeam.teamName} <span className="text-slate-400 font-normal">vs</span> {myNextMatch.opponentName}
               </span>
               {myNextMatch.isDone && (
                 <span className="font-mono font-bold text-sky-800 px-2 py-0.5 bg-sky-50 rounded">
                   Tỷ số: {myNextMatch.scoreA} - {myNextMatch.scoreB}
                 </span>
               )}
             </div>
             <div className="flex items-center gap-3 text-[13px] text-slate-600 flex-wrap">
               {myNextMatch.matchDate && (
                 <span className="flex items-center gap-1 font-medium">
                   <Calendar className="w-3.5 h-3.5 text-slate-500" />
                   {prettyDate(myNextMatch.matchDate)} {myNextMatch.timeSlot ? `(${myNextMatch.timeSlot})` : ""}
                 </span>
               )}
               <span className="font-medium text-slate-700">
                 📍 {myNextMatch.pitchName || selected.pitchName || selected.location || "Sân BTC"}
               </span>
             </div>
           </div>
         )}
       </div>
     )}

     {/* 4. Trường hợp giải INVITE_ONLY và Cầu thủ KHÔNG có trong danh sách mời và chưa đăng ký */}
     {!isInvited && !myTeam && selected.joinMode === "INVITE_ONLY" && !isClosed && (
       <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 flex items-center gap-3 text-[13px] text-slate-600">
         <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold shrink-0">
           Giải Đấu Kín
         </span>
         <span>
           Giải đấu này áp dụng hình thức <strong>Mời riêng qua email</strong>. Chỉ các đội bóng nhận được thư mời trực tiếp từ Ban Tổ Chức mới có thể nộp đơn tham gia.
         </span>
       </div>
     )}

     {/* 5. DÀNH CHO KHÁN GIẢ / CẦU THỦ VÃNG LAI CHƯA THAM GIA GIẢI CÔNG KHAI */}
     {!isInvited && !myTeam && selected.joinMode !== "INVITE_ONLY" && (
       <div className="space-y-3">
         {/* A. Giải đang mở đăng ký công khai -> Hiển thị Thẻ Kêu Gọi Nộp Đơn */}
         {!isClosed && teamCount < (selected.totalTeams || teamCap || 16) && (
           <div className="rounded-2xl border border-sky-300 bg-gradient-to-r from-sky-50 via-white to-sky-50/70 p-4 sm:p-5 shadow-xs space-y-3">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex items-start gap-3.5">
                 <div className="w-11 h-11 rounded-xl bg-[#0369a1] text-white flex items-center justify-center shrink-0 shadow-xs">
                   <Trophy className="w-5 h-5" />
                 </div>
                 <div className="space-y-1">
                   <div className="flex items-center gap-2 flex-wrap">
                     <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[13px] border border-emerald-200">
                       Đang Mở Đăng Ký Công Khai
                     </span>
                     <span className="text-[13px] text-slate-600 font-semibold">
                       Thể thức: <strong className="text-slate-900">{selected.format === "ROUND_ROBIN" ? "Vòng Tròn Tính Điểm" : selected.format === "GROUP_STAGE" ? "Chia Bảng & Loại Trực Tiếp" : "Cúp Loại Trực Tiếp (Knockout)"}</strong>
                     </span>
                   </div>
                   <h3 className="text-base sm:text-lg font-black text-slate-900">
                     Giải Đấu “{selected.title}” Đang Mở Đăng Ký Đội Thi Đấu!
                   </h3>
                   <p className="text-[14px] text-slate-600 leading-relaxed">
                     Quy mô giải: <strong className="text-slate-900">{selected.totalTeams || teamCap || "—"} đội</strong> • Quỹ giải thưởng: <strong className="text-amber-800 font-bold">{formatMoney(selected.prizePool || 0)}</strong> • Lệ phí tham gia: <strong className="text-slate-900 font-bold">{formatMoney(selected.entryFee || 0)}</strong>
                   </p>
                 </div>
               </div>

               <a
                 href={`/tournaments/register?tournamentId=${selected.id}`}
                 className="px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[14px] shadow-sm flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer"
               >
                 <UserPlus className="w-4 h-4" />
                 <span>Nộp Hồ Sơ Đăng Ký Đội</span>
               </a>
             </div>

             {/* Thanh tiến độ lấp đầy suất giải */}
             <div className="pt-2 border-t border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px]">
               <div className="flex items-center gap-2 flex-1 max-w-md">
                 <span className="text-slate-600 font-semibold shrink-0">
                   Tiến độ: <strong className="text-sky-900">{teamCount}/{selected.totalTeams || teamCap || "—"} đội</strong>
                 </span>
                 <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                   <div
                     className="h-full bg-[#0369a1] rounded-full transition-all"
                     style={{ width: `${Math.min(100, (teamCount / (selected.totalTeams || teamCap || 1)) * 100)}%` }}
                   />
                 </div>
               </div>
               <span className="text-slate-500 font-medium">
                 Hạn chót nộp đơn: <strong>{prettyDate(selected.registrationDeadline) || "Trước ngày khai mạc"}</strong>
               </span>
             </div>
           </div>
         )}

         {/* B. Giải đã bế mạc và có đội Quán Quân -> Vinh Danh Nhà Vô Địch */}
         {isClosed && tournamentChampion && (
           <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100/40 to-amber-50 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div className="flex items-center gap-3.5">
               <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                 <Trophy className="w-6 h-6 text-amber-100" />
               </div>
               <div>
                 <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[13px] border border-amber-300">
                   Giải Đấu Đã Bế Mạc
                 </span>
                 <h3 className="text-lg font-black text-amber-950 mt-0.5">
                   🏆 Đội Vô Địch: {tournamentChampion}
                 </h3>
                 <p className="text-[13px] text-amber-900 font-medium">
                   Chúc mừng tân vương của giải đấu “{selected.title}”!
                 </p>
               </div>
             </div>
             <div className="text-right sm:text-left">
               <span className="text-[13px] text-slate-600 block">Tổng quỹ thưởng giải</span>
               <span className="text-lg font-mono font-black text-amber-800">{formatMoney(selected.prizePool || 0)}</span>
             </div>
           </div>
         )}

         {/* C. Trận Cầu Tâm Điểm nếu giải đang thi đấu */}
         {guestSpotlightMatch && (!tournamentChampion || !isClosed) && (
           <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
             <div className="flex items-center gap-2.5 flex-wrap">
               <span className="px-2.5 py-1 rounded-lg bg-[#0369a1] text-white font-extrabold text-[13px] shrink-0">
                 ⚽ Trận Cầu Đáng Chú Ý
               </span>
               <div className="text-sm font-bold text-slate-900">
                 {guestSpotlightMatch.match.teamA?.name || "Chờ bốc"} <span className="text-slate-400">vs</span> {guestSpotlightMatch.match.teamB?.name || "Chờ bốc"}
               </div>
             </div>
             <div className="flex items-center gap-3 text-[13px] text-slate-600 flex-wrap">
               {guestSpotlightMatch.match.matchDate && (
                 <span className="flex items-center gap-1 font-semibold text-slate-700">
                   <Calendar className="w-3.5 h-3.5 text-sky-700" />
                   {prettyDate(guestSpotlightMatch.match.matchDate)} {guestSpotlightMatch.match.timeSlot ? `(${guestSpotlightMatch.match.timeSlot})` : ""}
                 </span>
               )}
               <button
                 type="button"
                 onClick={() => setActiveTab("schedule")}
                 className="px-3 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-bold text-slate-800 text-[13px] cursor-pointer"
               >
                 Xem Toàn Bộ Lịch Đấu ({allScheduledMatches.length} trận)
               </button>
             </div>
           </div>
         )}
       </div>
     )}
   </div>
 )}

 {/* Console Nav Tabs: Thích ứng động theo Role, Format & Số Lượng Đội */}
 <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-200 flex-wrap">
   {/* TAB CÂY NHÁNH ĐẤU (Đối với Vòng Tròn thì ẩn nếu không phải quản lý) */}
   {(canManage || selected.format !== "ROUND_ROBIN") && (
     <button
       type="button"
       onClick={() => setActiveTab("bracket")}
       className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-all flex items-center space-x-2 cursor-pointer ${
         activeTab === "bracket"
           ? "bg-[#0369a1] text-white shadow-md"
           : "bg-slate-100 text-slate-700 hover:bg-slate-200"
       }`}
     >
       <Trophy className="w-4 h-4" />
       <span>
         {selected.format === "GROUP_STAGE"
           ? "Nhánh Knock-out & Bảng Đấu"
           : selected.format === "ROUND_ROBIN"
           ? "Sơ Đồ Đấu Vòng Tròn"
           : `Cây Nhánh Đấu (${bracket?.rounds?.length || 0} vòng)`}
       </span>
     </button>
   )}

   {/* TAB LỊCH THI ĐẤU (Khán giả luôn cần xem lịch) */}
   <button
     type="button"
     onClick={() => setActiveTab("schedule")}
     className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-all flex items-center space-x-2 cursor-pointer ${
       activeTab === "schedule"
         ? "bg-[#0369a1] text-white shadow-md"
         : "bg-slate-100 text-slate-700 hover:bg-slate-200"
     }`}
   >
     <Calendar className="w-4 h-4 text-sky-700" />
     <span>Lịch Thi Đấu & Kết Quả ({allScheduledMatches.length})</span>
   </button>

   {/* TAB BẢNG XẾP HẠNG (Vòng tròn & Chia bảng đưa lên vị trí trọng tâm) */}
   <button
     type="button"
     onClick={() => setActiveTab("standings")}
     className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-all flex items-center space-x-2 cursor-pointer ${
       activeTab === "standings"
         ? "bg-[#0369a1] text-white shadow-md"
         : "bg-slate-100 text-slate-700 hover:bg-slate-200"
     }`}
   >
     <ListOrdered className="w-4 h-4" />
     <span>
       {selected.format === "ROUND_ROBIN"
         ? "Bảng Xếp Hạng League"
         : selected.format === "GROUP_STAGE"
         ? "Bảng Điểm Các Bảng"
         : "Bảng Xếp Hạng & Vua Phá Lưới"}
     </span>
   </button>

   {/* TAB DÀNH RIÊNG CHO BAN TỔ CHỨC / QUẢN LÝ */}
   {canManage && (
     <>
       <button
         type="button"
         onClick={() => setActiveTab("var_referee")}
         className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-all flex items-center space-x-2 cursor-pointer ${
           activeTab === "var_referee"
             ? "bg-[#0369a1] text-white shadow-md"
             : "bg-slate-100 text-slate-700 hover:bg-slate-200"
         }`}
       >
         <Video className="w-4 h-4 text-red-400" />
         <span>Bàn VAR Live</span>
         <span className="bg-red-950 text-red-300 px-1.5 py-0.5 rounded text-[13px] font-mono">Trực tiếp</span>
       </button>

       <button
         type="button"
         onClick={() => setActiveTab("esheet")}
         className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-all flex items-center space-x-2 cursor-pointer ${
           activeTab === "esheet"
             ? "bg-[#0369a1] text-white shadow-md"
             : "bg-slate-100 text-slate-700 hover:bg-slate-200"
         }`}
       >
         <FileText className="w-4 h-4" />
         <span>Biên Bản & QR</span>
       </button>
     </>
   )}
 </div>
 </div>

      {/* Sân khấu Lễ Bốc Thăm (Hiển thị ngay trên đầu khi bấm Bốc Thăm) */}
      {selected && lottery !== null && (
        <DrawLotteryOverlay
          inline
          open={true}
          tournamentTitle={selected.title}
          pairs={lottery.pairs}
          byes={lottery.byes}
          format={selected.format}
          teams={selected.teams}
          onDone={async () => {
            setLottery(null);
            const updated = await refreshTournamentInCache(selected.id);
            if (updated) {
              syncTournamentUpdate(updated);
            } else {
              const fullList = await fetchTournaments(true);
              setTournaments(fullList);
            }
            triggerToast("Nhánh đấu chính thức đã được lưu vào hệ thống!");
          }}
        />
      )}

 {/* TAB 1: BRACKET CANVAS (render ) */}
 {activeTab === "bracket" && (
 <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-6 shadow-md overflow-x-auto">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
 <Trophy className="w-5 h-5 text-emerald-500" />
 <span>Cây Nhánh Đấu {bracket ? `— ${bracket.rounds.length} vòng` : ""}</span>
 </h2>
 <span className="text-[14px] text-slate-500 font-medium">
 {bracket ? `Bốc thăm lúc ${bracket.drawnAt?.slice(0, 16).replace("T", " ")} • Hạt giống theo thứ tự đăng ký` : "Chưa có nhánh đấu"}
 </span>
 </div>

 {/* Nhắc nhở lịch thi đấu (Thân thiện theo Role) */}
 {bracket && scheduledCount === 0 && (
 <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-sky-400/50 bg-[#0369a1]/5 px-3 py-2.5">
 <p className="text-[14px] font-bold text-sky-700 ">
 <Calendar className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
 {canManage
   ? "Chưa có lịch thi đấu — bấm “Xếp lịch thi đấu” ở bảng điều hành để sinh ngày, giờ và sân cho từng trận."
   : "Ban Tổ Chức đang hoàn thiện lịch thi đấu chính thức cho giải. Các trận đấu sẽ sớm được cập nhật tại đây."}
 </p>
 </div>
 )}
 {bracket && scheduledCount > 0 && (
 <p className="text-[14px] font-bold text-sky-800 ">
 <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
 Đã xếp lịch {scheduledCount} trận — ngày, khung giờ và sân lấy trực tiếp .
 </p>
 )}

 {/* Thanh Bộ Lọc Vòng Đấu (Stage Filter) */}
 {bracket && bracket.rounds && bracket.rounds.length > 0 && (
 <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-sky-50/80 via-white to-slate-50 rounded-2xl border border-sky-100 shadow-xs">
 <div className="flex flex-wrap items-center gap-2">
 <div className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] font-bold text-slate-600">
 <Filter className="w-4 h-4 text-sky-700" />
 <span>Lọc vòng đấu:</span>
 </div>

 {/* Nút Tất Cả */}
 <button
 type="button"
 onClick={() => setSelectedRoundFilter("ALL")}
 className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
 selectedRoundFilter === "ALL"
 ? "bg-[#0369a1] text-white shadow-sm ring-2 ring-sky-300"
 : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
 }`}
 >
 <span>Tất Cả (Toàn Bộ Cây Nhánh)</span>
 <span className={`px-2 py-0.5 rounded-full text-[13px] font-mono font-bold ${
 selectedRoundFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
 }`}>
 {bracket.rounds.reduce((acc, r) => acc + (r.matches?.length ?? 0), 0)}
 </span>
 </button>

 {/* Các nút từng vòng */}
 {bracket.rounds.map((round, rIndex) => {
 const isSelected = selectedRoundFilter === String(rIndex);
 const isFinal = rIndex === bracket.rounds.length - 1;
 return (
 <button
 key={rIndex}
 type="button"
 onClick={() => setSelectedRoundFilter(String(rIndex))}
 className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
 isSelected
 ? isFinal
 ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-300"
 : "bg-[#0369a1] text-white shadow-sm ring-2 ring-sky-300"
 : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
 }`}
 >
 {isFinal && <Trophy className="w-3.5 h-3.5 text-amber-300" />}
 <span>{round.name}</span>
 <span className={`px-2 py-0.5 rounded-full text-[13px] font-mono font-bold ${
 isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
 }`}>
 {round.matches?.length ?? 0}
 </span>
 </button>
 );
 })}
 </div>

 {selectedRoundFilter === "ALL" && (
 <div className="hidden md:flex items-center gap-1.5 text-[13px] font-medium text-slate-400">
 <span>← Cuộn ngang để theo dõi đường nhánh đấu tiến vào chung kết →</span>
 </div>
 )}
 </div>
 )}

 {!selected ? (
 <div className="p-4 sm:p-8 text-center">
 <Trophy className="w-8 h-8 text-slate-400 mx-auto" />
 <p className="mt-3 text-sm text-slate-500">Chưa có giải đấu nào .</p>
 </div>
   ) : !bracket ? (
  <div className="space-y-6">
    {/* Banner thông báo trạng thái */}
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#0369a1] text-white text-[14px] font-black tracking-wide">
            Sơ Đồ Hạt Giống Dự Kiến
          </span>
          <span className="text-[14px] font-bold text-slate-500">
            {teamCount}/{teamCap || "—"} Đội Đã Ghi Danh
          </span>
        </div>
        <h3 className="text-base sm:text-lg font-black text-slate-900">
          Cây Nhánh Đấu Giải “{selected.title}”
        </h3>

      </div>

      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
        {canManage && selected?.joinMode === "INVITE_ONLY" && (
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-black text-[14px] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            title="Giải có ràng buộc mời qua email — Gửi thư mời tham gia"
          >
            <Mail className="w-4 h-4 text-amber-700" />
            <span>Mời Email</span>
          </button>
        )}
        {canManage && (
          <button
            type="button"
            onClick={() => setConfirmDraw(true)}
            disabled={teamCount < 2 || drawBusy}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[14px] shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            <span>Bốc Thăm</span>
          </button>
        )}
        {!full && (
          <a
            href={`/tournaments/register?tournamentId=${selected.id}`}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Đăng Ký</span>
          </a>
        )}
      </div>
    </div>

    {/* Cây Sơ Đồ Nhánh Đấu Dự Kiến (Preview Bracket Tree) */}
    <div className="bg-slate-50/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[14px] font-black text-slate-500 tracking-wider">
          Sơ Đồ Hạt Giống ({teamCap || Math.max(4, teamCount * 2)} Đội)
        </span>
        <span className="text-[14px] font-bold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-md">
          Thể thức: {formatLabel(selected.format)}
        </span>
      </div>

      {(() => {
        const capacity = teamCap > 0 ? teamCap : 8;
        const confirmedTeams = (selected.teams ?? []).filter((t) => t.registrationStatus !== "PENDING_PAYMENT");
        const round1MatchesCount = Math.max(2, Math.floor(capacity / 2));
        const round1Matches = Array.from({ length: round1MatchesCount }, (_, idx) => {
          const teamA = confirmedTeams[idx * 2];
          const teamB = confirmedTeams[idx * 2 + 1];
          return {
            matchId: `R1-M${idx + 1}`,
            teamA: teamA ? teamA.teamName : `Hạt giống #${idx * 2 + 1} (Chờ đăng ký)`,
            teamB: teamB ? teamB.teamName : `Hạt giống #${idx * 2 + 2} (Chờ đăng ký)`,
            hasRealA: !!teamA,
            hasRealB: !!teamB,
          };
        });

        const round2Count = Math.max(1, Math.floor(round1MatchesCount / 2));
        const round2Matches = Array.from({ length: round2Count }, (_, idx) => ({
          matchId: round2Count === 1 ? "Chung Kết" : `BK-M${idx + 1}`,
          teamA: `Thắng R1-M${idx * 2 + 1}`,
          teamB: `Thắng R1-M${idx * 2 + 2}`,
        }));

        return (
          <div className="flex gap-4 sm:gap-8 items-start min-w-[650px] pb-2">
            {/* Vòng 1 */}
            <div className="flex-1 space-y-3">
              <div className="text-center text-[14px] font-extrabold py-2 rounded-xl bg-slate-200/80 text-slate-700 border border-slate-300">
                Vòng Khởi Tranh ({round1MatchesCount} trận)
              </div>
              {round1Matches.map((m, mi) => (
                <div key={mi} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-[14px]">
                  <div className="flex items-center justify-between text-[14px] font-mono text-slate-500 font-bold">
                    <span>{m.matchId}</span>
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Dự kiến</span>
                  </div>
                  <div className="space-y-1">
                    <div className={`p-2 rounded-lg flex items-center justify-between ${m.hasRealA ? "bg-sky-50 font-black text-sky-900 border border-sky-200" : "bg-slate-50 text-slate-500 italic"}`}>
                      <span className="truncate">⚽ {m.teamA}</span>
                      {m.hasRealA && <span className="text-[14px] bg-sky-200 text-sky-800 px-1.5 py-0.2 rounded font-bold">Đã nộp</span>}
                    </div>
                    <div className="text-center font-mono font-bold text-slate-300 text-[14px]">VS</div>
                    <div className={`p-2 rounded-lg flex items-center justify-between ${m.hasRealB ? "bg-sky-50 font-black text-sky-900 border border-sky-200" : "bg-slate-50 text-slate-500 italic"}`}>
                      <span className="truncate">⚽ {m.teamB}</span>
                      {m.hasRealB && <span className="text-[14px] bg-sky-200 text-sky-800 px-1.5 py-0.2 rounded font-bold">Đã nộp</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vòng 2 / Bán kết */}
            <div className="flex-1 space-y-3 self-center">
              <div className="text-center text-[14px] font-extrabold py-2 rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-200">
                {round2Count === 1 ? "Trận Chung Kết" : "Vòng Bán Kết"}
              </div>
              {round2Matches.map((m, mi) => (
                <div key={mi} className="p-3 rounded-2xl bg-white border border-indigo-200 shadow-xs space-y-2 text-[14px]">
                  <div className="flex items-center justify-between text-[14px] font-mono text-indigo-700 font-bold">
                    <span>{m.matchId}</span>
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Tranh vé</span>
                  </div>
                  <div className="space-y-1 text-slate-500 italic text-[14px]">
                    <div className="p-2 rounded-lg bg-slate-50 truncate">👑 {m.teamA}</div>
                    <div className="text-center font-mono font-bold text-slate-300">VS</div>
                    <div className="p-2 rounded-lg bg-slate-50 truncate">👑 {m.teamB}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cúp Vô Địch */}
            <div className="w-48 text-center self-center space-y-3 p-4 rounded-2xl bg-gradient-to-b from-amber-50 to-white border border-amber-300 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-md">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[14px] font-black text-amber-900 tracking-wider">NGÔI VƯƠNG</span>
                <p className="text-base font-black text-amber-700">Cup Vô Địch</p>
                <p className="text-[14px] font-bold text-slate-500 mt-1 font-mono">
                  {selected.prizePool ? `Thưởng ${(selected.prizePool).toLocaleString("vi-VN")}đ` : "Huy Chương Vàng"}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>

    {/* Danh sách các đội đã ghi danh tham dự */}
    {(selected.teams ?? []).length > 0 && (
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-700" />
            Danh Sách Đội Đã Ghi Danh ({selected.teams?.length} đội)
          </h4>
          <span className="text-[14px] text-slate-500">
            Hạt giống xếp theo thời gian hoàn tất thủ tục
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {selected.teams?.map((tm, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-[14px]">
              <div className="min-w-0">
                <span className="font-extrabold text-slate-900 truncate block">
                  #{idx + 1} · {tm.teamName}
                </span>
                <span className="text-slate-500 text-[14px]">
                  HLV/Đội trưởng: {tm.captainName || "—"}
                </span>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[14px] font-black ${
                tm.registrationStatus === "PENDING_PAYMENT"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}>
                {tm.registrationStatus === "PENDING_PAYMENT" ? "Chờ duyệt phí" : "Chính thức"}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
  ) : selectedRoundFilter !== "ALL" ? (
    /* CHẾ ĐỘ XEM THEO TỪNG VÒNG ĐẤU ĐƯỢC CHỌN (Tứ Kết, Bán Kết, Chung Kết...) */
    (() => {
      const roundIdx = Number(selectedRoundFilter);
      const curRound = bracket.rounds[roundIdx];
      if (!curRound) return null;
      const isFinalRound = roundIdx === bracket.rounds.length - 1;

      return (
        <div key={`filtered-${roundIdx}`} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 via-white to-slate-50 border border-sky-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-white text-[13px] font-bold ${
                  isFinalRound ? "bg-amber-600" : "bg-[#0369a1]"
                }`}>
                  {isFinalRound ? "Trận Chung Kết" : `Vòng Đấu #${roundIdx + 1}`}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {curRound.name}
                </h3>
              </div>
              <p className="text-[13px] text-slate-600">
                Hiển thị danh sách {curRound.matches.length} trận đấu thuộc vòng này.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {roundIdx > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRoundFilter(String(roundIdx - 1))}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[13px] font-bold transition-all cursor-pointer"
                >
                  ← {bracket.rounds[roundIdx - 1].name}
                </button>
              )}
              {!isFinalRound && (
                <button
                  type="button"
                  onClick={() => setSelectedRoundFilter(String(roundIdx + 1))}
                  className="px-3 py-1.5 rounded-xl bg-[#0369a1] text-white hover:bg-[#075985] text-[13px] font-bold transition-all shadow-xs cursor-pointer"
                >
                  {bracket.rounds[roundIdx + 1].name} →
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedRoundFilter("ALL")}
                className="px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-sky-800 hover:bg-sky-50 text-[13px] font-bold transition-all cursor-pointer"
              >
                Xem Cây Nhánh Đầy Đủ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {curRound.matches.map((m, mi) => (
              <div key={m.matchId || mi} className="space-y-2">
                {renderMatch(m, mi)}
              </div>
            ))}
          </div>
        </div>
      );
    })()
  ) : (
    /* CHẾ ĐỘ XEM TOÀN BỘ CÂY NHÁNH ĐẤU KÈM ĐƯỜNG NỐI LIÊN KẾT (FULL CONNECTED TREE) */
    (() => {
      const finalRound = bracket.rounds[bracket.rounds.length - 1];
      const finalMatch = finalRound?.matches?.[0];
      const championName =
        finalMatch?.status === "DONE" && finalMatch?.winner ? finalMatch.winner : null;
      const baseMatchesCount = bracket.rounds[0]?.matches?.length || 1;
      const canvasMinHeight = Math.max(baseMatchesCount * 135, 500);

      return (
        <div
          key={bracket.drawnAt}
          className="pb-3 pt-1 overflow-x-auto select-none"
        >
          <div className="flex items-stretch min-w-max gap-0">
            {bracket.rounds.map((round, ri) => {
              const isFinal = ri === bracket.rounds.length - 1;
              const nextRound = !isFinal ? bracket.rounds[ri + 1] : null;

              return (
                <React.Fragment key={`round-group-${ri}`}>
                  {/* CỘT VÒNG ĐẤU */}
                  <div
                    className="min-w-[270px] sm:min-w-[300px] max-w-[330px] flex-1 flex flex-col"
                    style={{ minHeight: `${canvasMinHeight}px` }}
                  >
                    {/* Tiêu đề vòng đấu */}
                    <div
                      className={`text-center py-2.5 px-3 rounded-xl border mb-3 shrink-0 shadow-xs ${
                        isFinal
                          ? "text-amber-800 bg-amber-500/15 border-amber-300"
                          : "text-sky-800 bg-sky-50/70 border-sky-200"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 text-[13px] font-extrabold">
                        {isFinal && <Trophy className="w-4 h-4 text-amber-600" />}
                        <span>{round.name}</span>
                      </div>
                      <span className="text-[13px] font-medium text-slate-500 block mt-0.5">
                        {round.matches.length} trận
                      </span>
                    </div>

                    {/* Danh sách các trận trong vòng (căn giữa theo chiều dọc) */}
                    <div className="flex-1 flex flex-col justify-around py-1 gap-4">
                      {(round.matches ?? []).map((m, mi) => (
                        <div key={m.matchId || mi} className="w-full relative">
                          {renderMatch(m, mi)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CỘT ĐƯỜNG NỐI LIÊN KẾT VÀO VÒNG TIẾP THEO (CONNECTORS) */}
                  {nextRound && (
                    <div
                      className="w-10 sm:w-14 shrink-0 flex flex-col justify-around py-1"
                      style={{ minHeight: `${canvasMinHeight}px` }}
                    >
                      {/* Khoảng trống trên cùng tương ứng với chiều cao header */}
                      <div className="h-[52px] mb-3 shrink-0" />

                      {/* Các nhánh nối tương ứng từng trận ở vòng sau */}
                      <div className="flex-1 flex flex-col justify-around">
                        {nextRound.matches.map((childMatch, pIndex) => {
                          const parentA = round.matches[2 * pIndex];
                          const parentB = round.matches[2 * pIndex + 1];

                          const topWinner = parentA?.status === "DONE" ? parentA.winner : null;
                          const bottomWinner = parentB?.status === "DONE" ? parentB.winner : null;

                          const topHighlighted = Boolean(
                            topWinner &&
                              (childMatch.teamA?.name === topWinner ||
                                childMatch.teamB?.name === topWinner)
                          );
                          const bottomHighlighted = Boolean(
                            bottomWinner &&
                              (childMatch.teamA?.name === bottomWinner ||
                                childMatch.teamB?.name === bottomWinner)
                          );
                          const hasBottom = Boolean(parentB);

                          return (
                            <div
                              key={`fork-${ri}-${pIndex}`}
                              className="flex-1 relative flex items-center justify-center my-0.5"
                            >
                              {hasBottom ? (
                                <svg
                                  className="w-full h-full overflow-visible"
                                  viewBox="0 0 40 100"
                                  preserveAspectRatio="none"
                                >
                                  {/* Nhánh từ trận trên rẽ xuống giữa */}
                                  <path
                                    d="M 0 25 L 20 25 Q 26 25 26 31 L 26 50"
                                    fill="none"
                                    stroke={topHighlighted ? "#0369a1" : "#cbd5e1"}
                                    strokeWidth={topHighlighted ? "3" : "2"}
                                  />
                                  {/* Nhánh từ trận dưới rẽ lên giữa */}
                                  <path
                                    d="M 0 75 L 20 75 Q 26 75 26 69 L 26 50"
                                    fill="none"
                                    stroke={bottomHighlighted ? "#0369a1" : "#cbd5e1"}
                                    strokeWidth={bottomHighlighted ? "3" : "2"}
                                  />
                                  {/* Nhánh gộp chung đi thẳng vào trận vòng sau */}
                                  <path
                                    d="M 26 50 L 40 50"
                                    fill="none"
                                    stroke={
                                      topHighlighted || bottomHighlighted
                                        ? "#0369a1"
                                        : "#cbd5e1"
                                    }
                                    strokeWidth={
                                      topHighlighted || bottomHighlighted ? "3" : "2"
                                    }
                                  />
                                  {/* Điểm giao nút (Junction Dot) */}
                                  <circle
                                    cx="26"
                                    cy="50"
                                    r={topHighlighted || bottomHighlighted ? "3.5" : "2.5"}
                                    fill={
                                      topHighlighted || bottomHighlighted
                                        ? "#0369a1"
                                        : "#94a3b8"
                                    }
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-full h-full overflow-visible"
                                  viewBox="0 0 40 100"
                                  preserveAspectRatio="none"
                                >
                                  <path
                                    d="M 0 50 L 40 50"
                                    fill="none"
                                    stroke={topHighlighted ? "#0369a1" : "#cbd5e1"}
                                    strokeWidth={topHighlighted ? "3" : "2"}
                                  />
                                  <circle
                                    cx="20"
                                    cy="50"
                                    r={topHighlighted ? "3.5" : "2.5"}
                                    fill={topHighlighted ? "#0369a1" : "#94a3b8"}
                                  />
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ĐƯỜNG NỐI TỪ CHUNG KẾT VÀO CÚP VÔ ĐỊCH */}
                  {isFinal && (
                    <div
                      className="w-10 sm:w-14 shrink-0 flex flex-col justify-around py-1"
                      style={{ minHeight: `${canvasMinHeight}px` }}
                    >
                      <div className="h-[52px] mb-3 shrink-0" />
                      <div className="flex-1 flex items-center justify-center">
                        <svg
                          className="w-full h-12 overflow-visible"
                          viewBox="0 0 40 40"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M 0 20 L 40 20"
                            fill="none"
                            stroke={championName ? "#d97706" : "#cbd5e1"}
                            strokeWidth={championName ? "3" : "2"}
                            strokeDasharray={championName ? undefined : "4 2"}
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r={championName ? "4" : "2.5"}
                            fill={championName ? "#d97706" : "#94a3b8"}
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* CỘT CÚP VÔ ĐỊCH (NGÔI VƯƠNG) */}
            <div
              className="w-52 sm:w-60 shrink-0 flex flex-col justify-center py-1"
              style={{ minHeight: `${canvasMinHeight}px` }}
            >
              <div className="h-[52px] mb-3 shrink-0" />
              <div className="flex-1 flex items-center justify-center">
                <div
                  className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-center space-y-3 transition-all ${
                    championName
                      ? "bg-gradient-to-b from-amber-50 via-white to-amber-100/50 border-amber-400 shadow-md ring-4 ring-amber-100"
                      : "bg-gradient-to-b from-slate-50 to-white border-slate-200 shadow-xs"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-md ${
                      championName
                        ? "bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 ring-4 ring-amber-200"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <Trophy className="w-7 h-7" />
                  </div>

                  <div>
                    <span className="text-[13px] font-black text-amber-800 tracking-wider">
                      NGÔI VƯƠNG
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 truncate">
                      {championName ? championName : "Cúp Vô Địch"}
                    </h4>

                    {championName ? (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[13px] font-black">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Nhà Vô Địch
                      </span>
                    ) : (
                      <p className="text-[13px] font-bold text-slate-500 mt-1 font-mono">
                        {selected.prizePool
                          ? `Thưởng ${(selected.prizePool).toLocaleString("vi-VN")}đ`
                          : "Huy Chương Vàng"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })()
  )}
 </div>
 )}

 {/* TAB 2: TÒA TRỌNG TÀI VAR — chạy trên trận thật trong nhánh đấu */}
 {activeTab === "var_referee" && (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
 <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-3 sm:space-y-6">
 <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
 <div className="min-w-0">
 <span className="bg-red-500 text-white text-[14px] font-black px-2 py-0.5 rounded mr-2">VAR</span>
 <span className="font-extrabold text-base text-slate-900 ">
 {varMatch
 ? `${varRound} · ${varMatch.teamA?.name} vs ${varMatch.teamB?.name}`
 : "Chọn một trận để điều khiển tỷ số"}
 </span>
 </div>
 <div className="text-[14px] font-mono font-bold text-slate-500">
 {varMatch?.matchDate
 ? `${varMatch.matchDate.split("-").reverse().join("/")} • ${varMatch.timeSlot ?? ""} • ${varMatch.pitchName ?? "Chưa xếp sân"}`
 : "Chưa xếp lịch"}
 </div>
 </div>

 {!varMatch ? (
 <div className="p-10 text-center">
 <Video className="w-8 h-8 text-slate-400 mx-auto" />
 <p className="mt-3 text-sm text-slate-500">
 {playableMatches.length
 ? "Chưa chọn trận nào."
 : "Giải chưa bốc thăm hoặc chưa có cặp đấu nào đủ 2 đội thật."}
 </p>
 </div>
 ) : (
 <>
 {varMatch.status === "DONE" && (
 <p className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-[14px] font-bold text-amber-700 ">
 Trận này đã có kết quả {varMatch.scoreA}-{varMatch.scoreB}. Muốn sửa thì bấm “Huỷ KQ”
 trên thẻ trận ở tab Cây Nhánh Đấu — hệ thống sẽ mở lại trận và tính lại phong độ.
 </p>
 )}

 <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 text-slate-900 text-center shadow-2xl space-y-3 sm:space-y-4">
 <div className="flex items-center justify-center space-x-3 text-[14px] text-slate-500 font-mono font-bold">
 <Clock className="w-4 h-4 text-sky-700 " />
 <span>
 {varMatch.status === "DONE" ? "Đã kết thúc" : "Đang điều khiển"} • Tỷ số thời gian thực
 </span>
 </div>

 <div className="grid grid-cols-3 items-center gap-3 sm:gap-4 py-2">
 <div className="space-y-2 min-w-0">
 <div className="text-base sm:text-lg font-black text-sky-800 truncate">
 {varMatch.teamA?.name}
 </div>
 <div className="text-[14px] text-slate-500 font-mono">Thành tích {varMatch.teamA?.record ?? varMatch.teamA?.form ?? "—"}</div>
 <div className="text-2xl sm:text-6xl font-mono font-black text-slate-900 bg-slate-100 py-3 rounded-2xl border border-slate-200 shadow-inner">
 {varScoreA}
 </div>
 {varMatch.status !== "DONE" && (
 <div className="flex justify-center space-x-2 pt-2">
 <button
 onClick={() => setVarScoreA(varScoreA + 1)}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-extrabold px-3 py-1.5 rounded-lg shadow"
 >
 +1 Bàn
 </button>
 <button
 onClick={() => setVarScoreA(Math.max(0, varScoreA - 1))}
 className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[14px] font-bold px-2 py-1.5 rounded-lg"
 >
 -1
 </button>
 </div>
 )}
 </div>

 <div className="space-y-1">
 <div className="text-xl font-extrabold text-amber-600 font-mono">VS</div>
 <div className="text-[14px] text-slate-500 font-mono">{varMatch.matchId}</div>
 {varStatus && (
 <div className="bg-amber-500/10 text-amber-700 text-[14px] font-bold p-2 rounded-lg border border-amber-500/30 ">
 VAR: {varStatus}
 </div>
 )}
 </div>

 <div className="space-y-2 min-w-0">
 <div className="text-base sm:text-lg font-black text-cyan-700 truncate">
 {varMatch.teamB?.name}
 </div>
 <div className="text-[14px] text-slate-500 font-mono">Thành tích {varMatch.teamB?.record ?? varMatch.teamB?.form ?? "—"}</div>
 <div className="text-2xl sm:text-6xl font-mono font-black text-slate-900 bg-slate-100 py-3 rounded-2xl border border-slate-200 shadow-inner">
 {varScoreB}
 </div>
 {varMatch.status !== "DONE" && (
 <div className="flex justify-center space-x-2 pt-2">
 <button
 onClick={() => setVarScoreB(varScoreB + 1)}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-extrabold px-3 py-1.5 rounded-lg shadow"
 >
 +1 Bàn
 </button>
 <button
 onClick={() => setVarScoreB(Math.max(0, varScoreB - 1))}
 className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[14px] font-bold px-2 py-1.5 rounded-lg"
 >
 -1
 </button>
 </div>
 )}
 </div>
 </div>

 <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-[13px]">
  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
   <span className="font-bold text-slate-800 text-[14px] flex items-center gap-1.5">
    <FileText className="w-4 h-4 text-[#0369a1]" />
    <span>Ghi Nhận Sự Kiện Trực Tiếp (Bàn Thắng & Thẻ Phạt)</span>
   </span>
   <span className="text-slate-500 font-mono font-bold">
    {varEvents.length} sự kiện
   </span>
  </div>

  {varMatch.status !== "DONE" && (
   <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
    <select
     value={newEventType}
     onChange={(e) => setNewEventType(e.target.value as any)}
     className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none"
    >
     <option value="GOAL">⚽ Bàn Thắng</option>
     <option value="YELLOW_CARD">🟨 Thẻ Vàng</option>
     <option value="RED_CARD">🟥 Thẻ Đỏ</option>
    </select>

    <select
     value={newEventTeam || varMatch.teamA?.name || ""}
     onChange={(e) => setNewEventTeam(e.target.value)}
     className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none truncate"
    >
     <option value={varMatch.teamA?.name}>{varMatch.teamA?.name}</option>
     <option value={varMatch.teamB?.name}>{varMatch.teamB?.name}</option>
    </select>

    <input
     type="text"
     placeholder="Tên cầu thủ (vd: Tuấn Anh)..."
     value={newEventPlayer}
     onChange={(e) => setNewEventPlayer(e.target.value)}
     className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[13px] focus:outline-none"
    />

    <div className="flex items-center gap-1.5">
     <input
      type="text"
      placeholder="Phút (24')"
      value={newEventMinute}
      onChange={(e) => setNewEventMinute(e.target.value)}
      className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-[13px] focus:outline-none"
     />
     <button
      type="button"
      onClick={() => {
       if (!newEventPlayer.trim()) {
        triggerToast("Vui lòng nhập tên cầu thủ");
        return;
       }
       const team = newEventTeam || varMatch.teamA?.name || "";
       const ev = {
        id: `${Date.now()}-${Math.random()}`,
        type: newEventType,
        teamName: team,
        playerName: newEventPlayer.trim(),
        minute: newEventMinute.trim() || undefined,
       };
       setVarEvents((prev) => [...prev, ev]);
       if (newEventType === "GOAL") {
        if (team === varMatch.teamA?.name) setVarScoreA((s) => s + 1);
        if (team === varMatch.teamB?.name) setVarScoreB((s) => s + 1);
       }
       pushVarLog(
        `${newEventType === "GOAL" ? "⚽ Bàn thắng" : newEventType === "YELLOW_CARD" ? "🟨 Thẻ vàng" : "🟥 Thẻ đỏ"} [${newEventMinute || "Trận"}] ${newEventPlayer.trim()} (${team})`,
        "ok"
       );
       setNewEventPlayer("");
       setNewEventMinute("");
      }}
      className="px-3 py-1.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] shrink-0 cursor-pointer"
     >
      + Ghi
     </button>
    </div>
   </div>
  )}

  {varEvents.length > 0 && (
   <div className="flex flex-wrap gap-1.5 pt-1">
    {varEvents.map((ev) => (
     <span
      key={ev.id}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[13px] font-bold border ${
       ev.type === "GOAL"
        ? "bg-emerald-50 text-emerald-900 border-emerald-300"
        : ev.type === "YELLOW_CARD"
        ? "bg-amber-50 text-amber-900 border-amber-300"
        : "bg-rose-50 text-rose-900 border-rose-300"
      }`}
     >
      <span>
       {ev.type === "GOAL" ? "⚽" : ev.type === "YELLOW_CARD" ? "🟨" : "🟥"}{" "}
       {ev.minute ? `${ev.minute} ` : ""}{ev.playerName} ({ev.teamName})
      </span>
      <button
       type="button"
       onClick={() => {
        setVarEvents((prev) => prev.filter((x) => x.id !== ev.id));
        if (ev.type === "GOAL") {
         if (ev.teamName === varMatch.teamA?.name) setVarScoreA((s) => Math.max(0, s - 1));
         if (ev.teamName === varMatch.teamB?.name) setVarScoreB((s) => Math.max(0, s - 1));
        }
       }}
       className="text-slate-400 hover:text-rose-700 ml-1 font-bold cursor-pointer"
      >
       ×
      </button>
     </span>
    ))}
   </div>
  )}
 </div>

 {varMatch.status !== "DONE" && (
 <button
 onClick={saveVarScore}
 disabled={savingMatch === varMatch.matchId}
 className="w-full bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-extrabold py-3 rounded-xl shadow-lg transition active:scale-[0.99] disabled:opacity-50"
 >
 {savingMatch === varMatch.matchId
 ? "Đang lưu…"
 : `Lưu kết quả ${varScoreA}-${varScoreB} & lưu lịch sử thi đấu`}
 </button>
 )}
 </div>

 {/* Chọn trận */}
 <div className="space-y-2">
 <label className="text-[14px] font-bold text-slate-700 ">
 Chọn trận để điều khiển ({playableMatches.length} trận có đủ 2 đội)
 </label>
 <select
 value={varMatchId}
 onChange={(e) => setVarMatchId(e.target.value)}
 className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
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
 <span>Xem Lại VAR — Nhiều Góc Camera</span>
 </h3>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 {["Cam 1 - Góc Chính", "Cam 2 - Góc Vỉa Cầu", "Cam 3 - Góc Từ Trên Cao", "Cam 4 - Kiểm Tra Vạch AI"].map((cam) => (
 <button
 key={cam}
 onClick={() => setSelectedCameraAngle(cam)}
 className={`p-2.5 rounded-xl text-[14px] font-bold transition border ${
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
 <div className="text-[14px] font-bold text-slate-700 ">
 Quyết định Trọng Tài ({selectedCameraAngle}):
 </div>
 <div className="flex flex-wrap gap-2">
 <button
 onClick={() => handleVarCheck("Bóng trong sân", "ok")}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold px-3 py-2 rounded-lg transition"
 >
 ✅ Bóng Trong Sân
 </button>
 <button
 onClick={() => handleVarCheck("Bóng ngoài sân", "bad")}
 className="bg-rose-600 hover:bg-rose-700 text-white text-[14px] font-bold px-3 py-2 rounded-lg transition"
 >
 ❌ Bóng Ra Ngoài
 </button>
 <button
 onClick={() => handleVarCheck("Lỗi chân vạch", "warn")}
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold px-3 py-2 rounded-lg transition"
 >
 ⚠️ Lỗi Chân Vạch
 </button>
 </div>
 <p className="hidden sm:block text-[14px] text-slate-500 leading-relaxed">
 Camera là bộ công cụ mô phỏng dùng để minh hoạ luồng VAR. Quyết định bấm ở đây được ghi vào
 nhật ký phiên làm việc của BTC, không ghi vào hệ thống.
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
 <p className="text-[14px] text-slate-500">
 Chưa có mốc nào trong phiên làm việc này. Các quyết định VAR và lần lưu kết quả sẽ hiện ở đây.
 </p>
 ) : (
 <div className="space-y-2 text-[14px] max-h-72 overflow-y-auto pr-1">
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
 <p className="text-[14px] text-slate-600 ">
 {varMatch
 ? `Mã biên bản: ${shortTournamentCode(selected?.title)}-${varMatch.matchId}-${(varMatch.matchDate ?? "").replace(/-/g, "") || "CHUALICH"}`
 : "Chọn trận để tạo biên bản"}
 </p>
 </div>
 </div>

 <button
 onClick={() => setActiveTab("esheet")}
 disabled={!varMatch}
 className="w-full bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-extrabold py-3 rounded-xl shadow-lg transition active:scale-[0.99] disabled:opacity-40"
 >
 Mở Biên Bản Điện Tử
 </button>
 </div>
 </div>
 </div>
 )}

 {/* TAB: LỊCH THI ĐẤU & KẾT QUẢ CHO CẦU THỦ */}
 {activeTab === "schedule" && (
 <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
 <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
 <Calendar className="w-5 h-5 text-[#0369a1]" />
 <span>Lịch Thi Đấu & Kết Quả Các Vòng</span>
 </h3>
 <span className="text-[13px] font-bold text-slate-500">
 Tổng cộng {allScheduledMatches.length} trận đấu
 </span>
 </div>

 {allScheduledMatches.length === 0 ? (
 <p className="text-[14px] text-slate-500 py-8 text-center">
 Ban Tổ Chức chưa công bố lịch thi đấu chính thức cho giải này.
 </p>
 ) : (
 <div className="space-y-2.5">
 {allScheduledMatches.map(({ match: m, roundName }) => {
 const isDone = m.status === "DONE";
 const isThisMyMatch = Boolean(myTeam && (m.teamA?.name === myTeam.teamName || m.teamB?.name === myTeam.teamName));
 return (
 <div
 key={m.matchId}
 className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-[14px] transition-colors ${
 isThisMyMatch
 ? "bg-sky-50/80 border-sky-300 ring-1 ring-[#0369a1]"
 : "bg-slate-50 border-slate-200"
 }`}
 >
 <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
 <span className="px-2 py-0.5 rounded bg-white text-slate-600 font-mono text-[13px] font-bold border border-slate-200 shrink-0">
 {m.matchId} • {roundName}
 </span>
 <div className="flex items-center gap-2 truncate">
 <span className={`font-bold ${m.winner === m.teamA?.name ? "text-sky-900 font-black" : "text-slate-800"}`}>
 {m.teamA?.name}
 </span>
 {isDone ? (
 <span className="font-mono font-black text-sky-800 px-2 py-0.5 rounded bg-sky-100 shrink-0">
 {m.scoreA} - {m.scoreB}
 </span>
 ) : (
 <span className="font-bold text-slate-400 shrink-0">vs</span>
 )}
 <span className={`font-bold ${m.winner === m.teamB?.name ? "text-sky-900 font-black" : "text-slate-800"}`}>
 {m.teamB?.name}
 </span>
 </div>
 {isThisMyMatch && (
 <span className="px-2 py-0.5 rounded bg-[#0369a1] text-white text-[13px] font-bold shrink-0">
 Trận của bạn
 </span>
 )}
 </div>

 <div className="flex items-center gap-2 text-[13px] text-slate-600 font-mono shrink-0">
 {m.matchDate && (
 <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-sky-800">
 {m.matchDate.split("-").reverse().join("/")}
 </span>
 )}
 {m.timeSlot && (
 <span className="font-bold text-slate-700">
 {m.timeSlot}
 </span>
 )}
 {m.pitchName && (
 <span className="text-slate-700 max-w-[160px] truncate">
 📍 {m.pitchName}
 </span>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
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
 <span className="text-[14px] text-slate-600">
 Thắng = 3 điểm, Hòa = 1 điểm • Cập nhật tự động theo kết quả từng trận đấu
 </span>
 </div>

 <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
  <button
   type="button"
   onClick={() => setStandingsSubTab("teams")}
   className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold border transition-colors cursor-pointer ${
    standingsSubTab === "teams"
     ? "bg-[#0369a1] text-white border-[#0369a1]"
     : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
   }`}
  >
   📊 Bảng Xếp Hạng Đội Bóng
  </button>
  <button
   type="button"
   onClick={() => {
    setStandingsSubTab("scorers");
    if (selected?.id) loadTopScorers(selected.id);
   }}
   className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold border transition-colors cursor-pointer ${
    standingsSubTab === "scorers"
     ? "bg-[#0369a1] text-white border-[#0369a1]"
     : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
   }`}
  >
   👑 Vua Phá Lưới & Kiến Tạo ({topScorers.length})
  </button>
 </div>

 {standingsSubTab === "teams" ? (
 tableRows.length === 0 ? (
 <div className="p-4 sm:p-8 text-center">
 <Users className="w-8 h-8 text-slate-400 mx-auto" />
 <p className="mt-3 text-sm text-slate-500">
 {selected ? "Giải chưa có đội nào ghi danh." : "Chưa chọn giải đấu."}
 </p>
 </div>
 ) : (
 <div className="overflow-x-auto -mx-1 px-1">
 <table className="w-full text-left border-collapse text-[14px] min-w-[720px]">
 <thead>
 <tr className="border-b border-slate-200 text-slate-500 font-bold text-[14px] tracking-wider">
 <th className="py-3 px-2 sm:px-4 sticky left-0 bg-white z-10">Hạng</th>
 <th className="py-3 px-2 sm:px-4">Tên Đội / CLB</th>
 <th className="py-3 px-2 sm:px-4 text-center">Trận</th>
 <th className="py-3 px-2 sm:px-4 text-center">Thắng</th>
 <th className="py-3 px-2 sm:px-4 text-center">Hòa</th>
 <th className="py-3 px-2 sm:px-4 text-center">Thua</th>
 <th className="py-3 px-2 sm:px-4 text-center">BT - BB</th>
 <th className="py-3 px-2 sm:px-4 text-center">HS</th>
 <th className="py-3 px-2 sm:px-4 text-center">Điểm</th>
 <th className="py-3 px-2 sm:px-4 text-right">Trạng Thái Tại Giải</th>
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
 <td className="py-3.5 px-2 sm:px-4 text-center font-mono text-slate-600">{row.gf} - {row.ga}</td>
 <td className="py-3.5 px-2 sm:px-4 text-center font-mono font-semibold">{row.diff > 0 ? `+${row.diff}` : row.diff}</td>
 <td className="py-3.5 px-2 sm:px-4 text-center font-mono font-black text-[#0369a1] text-base">{row.points}</td>
 <td className="py-3.5 px-2 sm:px-4 text-right">
 <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[13px] ${row.stageStatus.tone}`}>
 {row.stageStatus.label}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )
 ) : (
  <div className="space-y-3">
   {topScorers.length === 0 ? (
    <div className="p-8 text-center space-y-2">
     <Trophy className="w-8 h-8 text-amber-500 mx-auto" />
     <p className="text-[14px] font-bold text-slate-700">
      Chưa có bàn thắng nào được ghi nhận trong giải đấu.
     </p>
     <p className="text-[13px] text-slate-500">
      Khi trọng tài hoặc ban tổ chức nhập tỷ số kèm danh sách cầu thủ ghi bàn, bảng xếp hạng Vua Phá Lưới sẽ tự động cập nhật tại đây.
     </p>
    </div>
   ) : (
    <div className="overflow-x-auto -mx-1 px-1">
     <table className="w-full text-left border-collapse text-[14px] min-w-[560px]">
      <thead>
       <tr className="border-b border-slate-200 text-slate-500 font-bold text-[13px]">
        <th className="py-2.5 px-3">Hạng</th>
        <th className="py-2.5 px-3">Cầu Thủ</th>
        <th className="py-2.5 px-3">Đội Bóng / CLB</th>
        <th className="py-2.5 px-3 text-center">Bàn Thắng ⚽</th>
        <th className="py-2.5 px-3 text-center">Kiến Tạo 👟</th>
        <th className="py-2.5 px-3 text-center">Tổng G+A</th>
       </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 font-medium">
       {topScorers.map((s, idx) => (
        <tr key={idx} className={idx === 0 ? "bg-amber-50/60 font-bold" : "hover:bg-slate-50"}>
         <td className="py-3 px-3 font-bold font-mono">
          {idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`}
         </td>
         <td className="py-3 px-3 font-bold text-slate-900">
          {idx === 0 && "👑 "}{s.playerName}
         </td>
         <td className="py-3 px-3 text-slate-700 font-semibold">{s.teamName}</td>
         <td className="py-3 px-3 text-center font-mono font-black text-rose-600 text-base">
          {s.goals || 0}
         </td>
         <td className="py-3 px-3 text-center font-mono font-bold text-sky-700">
          {s.assists || 0}
         </td>
         <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-900">
          {(s.goals || 0) + (s.assists || 0)}
         </td>
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   )}
  </div>
 )}
 </div>
 )}

 {/* TAB 4: BIÊN BẢN ĐIỆN TỬ — in thật từ dữ liệu trận  */}
 {activeTab === "esheet" && (
 <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-6 shadow-md">
 <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 print:border-0 print:pb-0">
 <div>
 <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
 <FileText className="w-5 h-5 text-emerald-500" />
 <span>Biên Bản Trận Đấu — E-Scoresheet</span>
 </h2>
 <p className="text-[14px] text-slate-500 mt-1">
 Dữ liệu lấy trực tiếp từ bảng <span className="font-mono">tournaments</span> &amp;{" "}
 <span className="font-mono">match_results</span> 
 </p>
 </div>
 <div className="flex items-center gap-2">
 <select
 value={varMatchId}
 onChange={(e) => setVarMatchId(e.target.value)}
 aria-label="Chọn trận cho biên bản"
 className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] max-w-[240px]"
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
 className="bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold px-4 py-2.5 rounded-xl shadow transition active:scale-95 disabled:opacity-40 print:hidden"
 >
 In / Lưu PDF
 </button>
 </div>
 </div>

 {!varMatch ? (
 <div className="p-10 text-center">
 <FileText className="w-8 h-8 text-slate-400 mx-auto" />
 <p className="mt-3 text-sm text-slate-500">
 Chưa có trận nào đủ 2 đội thật để lập biên bản. Bốc thăm giải trước đã.
 </p>
 </div>
 ) : (
 <div className="esheet-print bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-3 sm:space-y-5 text-[14px] print:bg-white print:border-0 print:p-0">
 {/* Header */}
 <div className="text-center space-y-1 pb-4 border-b border-slate-200 print:border-slate-400">
 <p className="text-[14px] font-black tracking-widest text-slate-500">Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam</p>
 <p className="text-[14px] font-bold text-slate-500">Độc lập – Tự do – Hạnh phúc</p>
 <h3 className="text-base font-black text-slate-900">
 Biên Bản Trận Đấu — {selected ? sportLabel(selected.sportType) : "Bóng Đá Sân 7 Phủi"}
 </h3>
 <p className="text-[14px] font-mono text-slate-500">
 Mã biên bản: {shortTournamentCode(selected?.title)}-{varMatch.matchId}-
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
 <tr className="bg-slate-100 text-[14px] text-slate-600 ">
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
 <td className="py-2.5 px-3 text-center font-bold text-[14px]">
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

 {/* Sự kiện ghi bàn & kỷ luật trong trận */}
 <div className="space-y-2 pt-2 border-t border-slate-200 print:border-slate-300">
  <h4 className="font-bold text-slate-800 text-[14px]">
   Diễn Biến Trận Đấu & Kỷ Luật
  </h4>
  {varEvents.length === 0 ? (
   <p className="text-[13px] text-slate-500 italic">
    Không có sự kiện bàn thắng hoặc thẻ phạt nào được ghi nhận riêng trong phiên làm việc này.
   </p>
  ) : (
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
    {varEvents.map((ev) => (
     <div
      key={ev.id}
      className={`p-2 rounded border flex items-center justify-between gap-2 ${
       ev.type === "GOAL"
        ? "bg-emerald-50 border-emerald-200 text-emerald-950 font-bold"
        : ev.type === "YELLOW_CARD"
        ? "bg-amber-50 border-amber-200 text-amber-950 font-bold"
        : "bg-rose-50 border-rose-200 text-rose-950 font-bold"
      }`}
     >
      <div className="flex items-center gap-1.5">
       <span>{ev.type === "GOAL" ? "⚽ Bàn thắng" : ev.type === "YELLOW_CARD" ? "🟨 Thẻ vàng" : "🟥 Thẻ đỏ"}</span>
       <span>•</span>
       <span>{ev.playerName}</span>
       <span className="font-normal text-slate-600">({ev.teamName})</span>
      </div>
      {ev.minute && <span className="font-mono text-slate-600">Phút {ev.minute}</span>}
     </div>
    ))}
   </div>
  )}
 </div>

 {/* Chữ ký xác nhận */}
 <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[13px] text-slate-700">
  <div className="space-y-8">
   <div className="font-bold">ĐẠI DIỆN ĐỘI A</div>
   <div className="italic text-slate-400 font-mono text-[13px]">(Ký & ghi rõ họ tên)</div>
  </div>
  <div className="space-y-8">
   <div className="font-bold">ĐẠI DIỆN ĐỘI B</div>
   <div className="italic text-slate-400 font-mono text-[13px]">(Ký & ghi rõ họ tên)</div>
  </div>
  <div className="space-y-8">
   <div className="font-bold">TRỌNG TÀI CHÍNH</div>
   <div className="italic text-slate-400 font-mono text-[13px]">(Ký & ghi rõ họ tên)</div>
  </div>
 </div>

 {/* Ghi chú trung thực */}
 <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 print:border-slate-400">
 <div className="flex items-center gap-2">
 <CheckCircle2
 className={`w-5 h-5 ${varMatch.status === "DONE" ? "text-emerald-500" : "text-slate-500"}`}
 />
 <span className="font-bold text-slate-900 ">
 {varMatch.status === "DONE"
 ? "Kết quả đã được BTC nhập và lưu lịch sử ."
 : "Chưa có kết quả — biên bản chỉ mang tính dự thảo."}
 </span>
 </div>
 <span className="font-mono text-slate-500">
 In lúc {typeof window !== "undefined" ? new Date().toLocaleDateString("vi-VN") : ""} • Người lập: BTC
 </span>
 </div>
 </div>
 )}
 </div>
 )}

      {/* POPUP MODAL MỜI CẦU THỦ QUA EMAIL */}
      <TournamentInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tournament={selected}
        tournaments={tournaments}
        onInviteSuccess={async () => {
          const list = await fetchTournaments(true);
          setTournaments(list);
        }}
      />
    </div>
 );
}

