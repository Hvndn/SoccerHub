"use client";

import TournamentInviteModal from "./TournamentInviteModal";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { todayLocalPlus } from "@/lib/dateUtils";
import Link from "next/link";
import { API_BASE_URL, apiRequest, fetchWithTimeout } from '@/lib/api';
import { getMyPitchesApi, getAllPitchesApi, type PitchModel } from '@/lib/pitchService';
import {
  confirmedCount,
  sportLabel,
  formatLabel,
  formatMoney,
  formatDate,
  createTournament,
  updateTournament,
  fetchTournamentFinance,
  fillSimulatedTeams,
  clearSimulatedTeams,
  drawTournamentBracket,
  simulateTournamentResults,
  generateTournamentSchedule,
  undoMatchResult,
  confirmTeamPayment,
  refreshTournamentInCache,
  fetchTournaments,
  subscribeTournaments,
  type TournamentFinance,
} from "@/lib/tournamentService";
import FormDots from "./FormDots";
import BusinessContacts from "./BusinessContacts";
import {
  getPendingTeams, approveTeam, rejectTeam, addManualTeam,
  fetchJoinAccess, setJoinAccess, addTournamentInvite, removeTournamentInvite,
  getReferees, addReferee, removeReferee,
  updateTournamentStatus, updateTeamRoster, updateSingleMatchSchedule, broadcastTournamentAnnouncement,
  type PendingTeam, type RefereeInfo
} from "@/lib/organizerService";
import {
 Mail,
  Copy, Check, Send, CreditCard, ExternalLink, Clock, UserCheck,
 Trophy,
  Share2,
 ShieldCheck, MessageCircle,
 Cpu,
 Activity,
 Users,
 Video,
 CheckCircle2,
 ChevronRight,
 Download,
 Plus,
 RefreshCw,
 Lock, Unlock,
 Award,
 Radio,
 Sparkles,
 Filter,
 X,
 Pencil,
 Wallet,
 Users2, UserPlus,
 AlertCircle,
 Calendar,
 Megaphone,
 FileText,
 RotateCcw
} from "lucide-react";

interface TournamentOrganizerPortalProps {
  initialTournamentId?: number | string | null;
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenBracket?: (tournamentId: string) => void;
 /** Người đang điều hành — dùng cho kênh liên lạc B2B với chủ sân. */
 user?: any;
 /** Mở cuộc trò chuyện riêng với chủ sân. */
 onStartDm?: (partnerEmail: string, partnerName: string) => void;
  /** Mở phòng chat riêng của giải đấu (tab Cộng đồng > Chat Giải Đấu). */
  onOpenTournamentChat?: () => void;
}

export default function TournamentOrganizerPortal({
  onBackToHome,
  onNavigateTab,
  onOpenBracket,
  initialTournamentId,
  user,
  onStartDm,
  onOpenTournamentChat
}: TournamentOrganizerPortalProps) {
 // Sport Filter State
 const [selectedSport, setSelectedSport] = useState<string>("all");

 // Pitch selection by role (OWNER vs ORGANIZER/ADMIN)
 const [pitches, setPitches] = useState<PitchModel[]>([]);
 const [loadingPitches, setLoadingPitches] = useState(false);
 const isOwner = user?.role === "OWNER";

 useEffect(() => {
 let isMounted = true;
 setLoadingPitches(true);
 const fetcher = isOwner ? getMyPitchesApi() : getAllPitchesApi();
 fetcher
 .then((list) => {
 if (isMounted) setPitches(Array.isArray(list) ? list : []);
 })
 .catch((err) => console.error("Lỗi nạp danh sách sân cho portal:", err))
 .finally(() => {
 if (isMounted) setLoadingPitches(false);
 });
 return () => {
 isMounted = false;
 };
 }, [isOwner]);

 // Thông báo tương tác trong trang (không dùng alert để giữ đúng nghiệp vụ)
 const [varNotice, setVarNotice] = useState<string | null>(null);

 // Giải BTC đang thao tác. Mặc định lấy giải đầu tiên đã bốc thăm (nếu chưa chọn
 // tay) để các bảng BXH / lịch / tài chính vẫn có dữ liệu ngay khi vào trang.
 const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);

 // Active Tab for Tables/Logs
 const [bottomTab, setBottomTab] = useState<"teams" | "invites" | "referees" | "broadcast" | "finance" | "schedule" | "var_logs" | "edit">("teams");
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [inviteCustomNote, setInviteCustomNote] = useState("Ban Tổ Chức trân trọng kính mời bạn và đội bóng tham gia tranh tài tại giải đấu. Nhấp vào liên kết để nộp hồ sơ đăng ký!");

 // Real Database Tournaments (danh sách thật từ backend)
 const [dbTournaments, setDbTournaments] = useState<any[]>([]);
 const [loadingDb, setLoadingDb] = useState(false);

 // Fetch real tournaments from backend
 // Dùng CHUNG cache của tournamentService (không tự gọi API riêng) để tránh tải
 // trùng toàn bộ danh sách giải mỗi lần mở tab / sau mỗi thao tác.
 const fetchDbTournaments = async () => {
 try {
 setLoadingDb(true);
 const data = await fetchTournaments();
 setDbTournaments(data);
 } catch (e) {
 console.error("Lỗi tải giải đấu:", e);
 } finally {
 setLoadingDb(false);
 }
 };

 React.useEffect(() => {
    fetchDbTournaments();
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const tid = p.get("tournamentId");
      if (tid && !isNaN(Number(tid))) {
        setSelectedTournamentId(Number(tid));
      }
    }
    const unsubscribe = subscribeTournaments((list) => setDbTournaments(list));
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (initialTournamentId && !isNaN(Number(initialTournamentId))) {
      setSelectedTournamentId(Number(initialTournamentId));
    }
  }, [initialTournamentId]);

 // Danh sách giải lấy  — không dùng dữ liệu giả.
 const tournaments = useMemo(
 () =>
 dbTournaments.map((t: any) => {
 const teams = t.teams ?? [];
 const cap = t.totalTeams ?? 0;
 const progress = cap ? Math.min(100, Math.round((confirmedCount(t) / cap) * 100)) : 0;
 const st = t.status ?? "OPEN";
 return {
 id: String(t.id),
 sport: t.sportType ?? "SAN_7",
 sportBadge: `${sportLabel(t.sportType)} • ${
 st === "ONGOING" ? "Đang diễn ra" : st === "COMPLETED" ? "Đã kết thúc" : "Đang mở"
 }`,
 title: t.title,
 subtitle: `${teams.length}${cap ? `/${cap}` : ""} đội • ${formatLabel(t.format)} • Thưởng ${formatMoney(
 t.prizePool ?? 0
 )}`,
 progress,
 status: st === "ONGOING" ? "live" : st === "COMPLETED" ? "done" : "active",
 courts: t.pitchName || t.location || "Chưa chọn sân",
 hasBracket: !!t.bracketJson,
 };
 }),
 [dbTournaments]
 );

 const SPORT_FILTERS = [
 { id: "all", label: "Tất Cả Thể Thức" },
 { id: "SAN_7", label: "Bóng Đá Sân 7" },
 { id: "SAN_5", label: "Bóng Đá Sân 5" },
 { id: "SAN_11", label: "Bóng Đá Sân 11" },
 { id: "FUTSAL", label: "Futsal Trong Nhà" },
 ];

 const countBySportFilter = (id: string) =>
 id === "all" ? tournaments.length : tournaments.filter((t: any) => t.sport === id).length;

 // Giải dùng làm nguồn cho BXH / kết quả / lịch: giải đầu tiên đã bốc thăm .
 const activeTournamentId = useMemo(() => {
 if (selectedTournamentId) return selectedTournamentId;
 const withBracket = dbTournaments.find((t: any) => t.bracketJson);
 return withBracket?.id ?? dbTournaments[0]?.id ?? null;
 }, [dbTournaments, selectedTournamentId]);

 const activeTournament = useMemo(
 () => dbTournaments.find((t: any) => t.id === activeTournamentId) ?? null,
 [dbTournaments, activeTournamentId]
 );

  const kpiStats = useMemo(() => {
    const totalTournaments = dbTournaments.length;
    const ongoing = dbTournaments.filter((t: any) => t.status === "ONGOING").length;
    const open = dbTournaments.filter((t: any) => (t.status ?? "OPEN") === "OPEN").length;
    const totalTeams = dbTournaments.reduce((acc, t: any) => acc + (t.teams?.length || 0), 0);
    const totalPrize = dbTournaments.reduce((acc, t: any) => acc + Number(t.prizePool || 0), 0);
    const pendingTeamsCount = dbTournaments.reduce((acc, t: any) => {
      const p = (t.teams ?? []).filter((tm: any) => tm.registrationStatus === "PENDING_PAYMENT").length;
      return acc + p;
    }, 0);
    return { totalTournaments, ongoing, open, totalTeams, totalPrize, pendingTeamsCount };
  }, [dbTournaments]);

  // --- Duyệt đội đăng ký ---
  const [pendingTeams, setPendingTeams] = useState<PendingTeam[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingBusy, setPendingBusy] = useState(false);

  const loadPendingTeams = async (tid: number) => {
    setPendingLoading(true);
    setPendingFor(tid);
    try { setPendingTeams(await getPendingTeams(tid)); }
    catch { setPendingTeams([]); }
    finally { setPendingLoading(false); }
  };

  // Lưu ID giải đang mở panel thay vì boolean, vì panel nằm TRONG TỪNG card:
  // nếu dùng boolean chung thì bấm "Duyệt đội" ở giải B sẽ mở panel của cả giải A
  // (và hiển thị nhầm dữ liệu của B).
  const [pendingOpenFor, setPendingOpenFor] = useState<number | null>(null);
  // Giải mà pendingTeams/referees đang nạp — dùng để chỉ hiện badge cho đúng card.
  const [pendingFor, setPendingFor] = useState<number | null>(null);
  const [refFor, setRefFor] = useState<number | null>(null);

  const togglePending = (tid: number) => {
    setPendingOpenFor((cur) => {
      if (cur === tid) return null; // đang mở đúng giải này -> đóng lại
      loadPendingTeams(tid);
      return tid;
    });
  };

  const handleApprove = async (tid: number, name: string) => {
    setPendingBusy(true);
    try {
      await approveTeam(tid, name);
      await loadPendingTeams(tid);
      fetchDbTournaments();
    } catch { /* toast đã hiện */ }
    finally { setPendingBusy(false); }
  };

  const handleReject = async (tid: number, name: string) => {
    setPendingBusy(true);
    try {
      await rejectTeam(tid, name);
      await loadPendingTeams(tid);
      fetchDbTournaments();
    } catch { /* toast đã hiện */ }
    finally { setPendingBusy(false); }
  };

  const [confirmingTeamFee, setConfirmingTeamFee] = useState<string | null>(null);

  const handleConfirmTeamFee = async (tid: number, teamName: string) => {
    setConfirmingTeamFee(teamName);
    try {
      const res = await confirmTeamPayment(tid, teamName);
      await refreshTournamentInCache(tid);
      await fetchDbTournaments();
      setVarNotice(`✅ ${res.message || `Đã xác nhận thu lệ phí cho đội ${teamName}.`}`);
    } catch (err: any) {
      setVarNotice(`❌ ${err?.message || "Xác nhận lệ phí thất bại."}`);
    } finally {
      setConfirmingTeamFee(null);
    }
  };

  // --- Trọng tài ---
  const [referees, setReferees] = useState<RefereeInfo[]>([]);
  const [refOpen, setRefOpen] = useState<number | null>(null);
  const [refLoading, setRefLoading] = useState(false);
  const [refBusy, setRefBusy] = useState(false);
  const [refName, setRefName] = useState("");
  const [refPhone, setRefPhone] = useState("");
  const [refEmail, setRefEmail] = useState("");
  const [refNotes, setRefNotes] = useState("Trọng tài chính");

  const loadReferees = async (tid: number) => {
    setRefLoading(true);
    setRefFor(tid);
    try { setReferees(await getReferees(tid)); }
    catch { setReferees([]); }
    finally { setRefLoading(false); }
  };

  useEffect(() => {
    if (activeTournamentId) {
      loadPendingTeams(Number(activeTournamentId));
      loadReferees(Number(activeTournamentId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTournamentId]);

  const toggleReferees = (tid: number) => {
    setRefOpen((cur) => {
      if (cur === tid) return null; // đang mở đúng giải này -> đóng lại
      loadReferees(tid);
      return tid;
    });
  };

  const handleAddReferee = async (tid: number) => {
    if (refName.trim().length < 2) {
      setVarNotice("⚠️ Tên trọng tài cần tối thiểu 2 ký tự.");
      return;
    }
    setRefBusy(true);
    try {
      await addReferee(tid, {
        name: refName.trim(),
        phone: refPhone.trim() || undefined,
        email: refEmail.trim() || undefined,
        notes: refNotes.trim() || undefined,
      });
      setRefName(""); setRefPhone(""); setRefEmail(""); setRefNotes("Trọng tài chính");
      await loadReferees(tid);
      setVarNotice("✅ Đã thêm trọng tài vào tổ điều hành giải.");
    } catch (err: any) {
      setVarNotice("❌ " + (err?.message || "Không thêm được trọng tài."));
    }
    finally { setRefBusy(false); }
  };

  const handleRemoveReferee = async (tid: number, id: number) => {
    setRefBusy(true);
    try {
      await removeReferee(tid, id);
      await loadReferees(tid);
      setVarNotice("✅ Đã gỡ trọng tài khỏi giải.");
    } catch (err: any) {
      setVarNotice("❌ " + (err?.message || "Không xóa được trọng tài."));
    }
    finally { setRefBusy(false); }
  };

  // --- Quản lý Danh sách Cầu thủ (Roster) của từng đội ---
  const [editingRosterTeam, setEditingRosterTeam] = useState<string | null>(null);
  const [rosterCaptainName, setRosterCaptainName] = useState("");
  const [rosterCaptainPhone, setRosterCaptainPhone] = useState("");
  const [rosterMemberNames, setRosterMemberNames] = useState("");
  const [savingRoster, setSavingRoster] = useState(false);

  const handleOpenRosterEdit = (tm: any) => {
    if (editingRosterTeam === tm.teamName) {
      setEditingRosterTeam(null);
      return;
    }
    setEditingRosterTeam(tm.teamName);
    setRosterCaptainName(tm.captainName || "");
    setRosterCaptainPhone(tm.captainPhone || "");
    setRosterMemberNames(tm.memberNames || "");
  };

  const handleSaveRoster = async (teamName: string) => {
    if (!activeTournamentId) return;
    setSavingRoster(true);
    try {
      const res = await updateTeamRoster(Number(activeTournamentId), teamName, {
        captainName: rosterCaptainName,
        captainPhone: rosterCaptainPhone,
        memberNames: rosterMemberNames,
      });
      await refreshTournamentInCache(Number(activeTournamentId));
      await fetchDbTournaments();
      setEditingRosterTeam(null);
      setVarNotice("✅ " + (res.message || `Đã cập nhật danh sách cầu thủ đội ${teamName}.`));
    } catch (err: any) {
      setVarNotice("❌ " + (err?.message || "Không cập nhật được danh sách cầu thủ."));
    } finally {
      setSavingRoster(false);
    }
  };

  // --- Bộ Xếp Lịch Tự Động & Sửa Lịch Từng Trận ---
  const [scheduleConfig, setScheduleConfig] = useState({
    startDate: todayLocalPlus(1),
    matchesPerDay: 2,
    startHour: 17,
    matchMinutes: 90,
    daysBetweenRounds: 2,
  });
  const [schedulingBusy, setSchedulingBusy] = useState(false);
  const [editingMatchScheduleId, setEditingMatchScheduleId] = useState<string | null>(null);
  const [matchEditForm, setMatchEditForm] = useState({
    matchDate: "",
    timeSlot: "",
    pitchName: "",
    refereeName: "",
  });

  const handleAutoGenerateSchedule = async () => {
    if (!activeTournamentId) return;
    setSchedulingBusy(true);
    try {
      const res = await generateTournamentSchedule(Number(activeTournamentId), {
        startDate: scheduleConfig.startDate || activeTournament?.startDate || todayLocalPlus(1),
        matchesPerDay: Number(scheduleConfig.matchesPerDay) || 2,
        startHour: Number(scheduleConfig.startHour) || 17,
        matchMinutes: Number(scheduleConfig.matchMinutes) || 90,
        daysBetweenRounds: Number(scheduleConfig.daysBetweenRounds) ?? 2,
      });
      await fetchDbTournaments();
      setVarNotice("✅ " + (res.message || "Đã xếp lịch thi đấu tự động thành công!"));
    } catch (err: any) {
      setVarNotice("❌ " + (err?.message || "Xếp lịch tự động thất bại."));
    } finally {
      setSchedulingBusy(false);
    }
  };

  const handleOpenMatchScheduleEdit = (m: any) => {
    if (editingMatchScheduleId === m.matchId) {
      setEditingMatchScheduleId(null);
      return;
    }
    setEditingMatchScheduleId(m.matchId);
    setMatchEditForm({
      matchDate: m.matchDate || activeTournament?.startDate || todayLocalPlus(1),
      timeSlot: m.timeSlot || "17:30 - 19:00",
      pitchName: m.pitchName || activeTournament?.pitchName || "Sân 1",
      refereeName: m.refereeName || (referees[0]?.name ?? ""),
    });
  };

  const handleSaveSingleMatchSchedule = async (matchId: string) => {
    if (!activeTournamentId) return;
    setSchedulingBusy(true);
    try {
      const res = await updateSingleMatchSchedule(Number(activeTournamentId), matchId, matchEditForm);
      await refreshTournamentInCache(Number(activeTournamentId));
      await fetchDbTournaments();
      setEditingMatchScheduleId(null);
      setVarNotice("✅ " + (res.message || `Đã cập nhật lịch trận ${matchId}.`));
    } catch (err: any) {
      setVarNotice("❌ " + (err?.message || "Không lưu được lịch trận đấu."));
    } finally {
      setSchedulingBusy(false);
    }
  };

  // --- Phát Thông Báo Điều Hành Giải (Broadcast) ---
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [broadcastSendEmail, setBroadcastSendEmail] = useState(true);
  const [broadcastBusy, setBroadcastBusy] = useState(false);

  const handleSendBroadcast = async () => {
    if (!activeTournamentId) return;
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      setVarNotice("⚠️ Vui lòng nhập tiêu đề và nội dung thông báo.");
      return;
    }
    setBroadcastBusy(true);
    try {
      const res = await broadcastTournamentAnnouncement(Number(activeTournamentId), {
        title: broadcastTitle.trim(),
        content: broadcastContent.trim(),
        sendEmail: broadcastSendEmail,
      });
      setBroadcastTitle("");
      setBroadcastContent("");
      setVarNotice("✅ " + (res.message || "Đã phát thông báo tới toàn bộ đội bóng!"));
    } catch (err: any) {
      setVarNotice("❌ " + (err?.message || "Không gửi được thông báo."));
    } finally {
      setBroadcastBusy(false);
    }
  };

  // --- Đổi Trạng Thái Giải Đấu & Xuất CSV Báo Cáo ---
  const [statusBusy, setStatusBusy] = useState(false);
  const handleSwitchTournamentStatus = async (newStatus: "OPEN" | "ONGOING" | "COMPLETED") => {
    if (!activeTournamentId) return;
    setStatusBusy(true);
    try {
      const res = await updateTournamentStatus(Number(activeTournamentId), newStatus);
      await refreshTournamentInCache(Number(activeTournamentId));
      await fetchDbTournaments();
      setVarNotice("✅ " + (res.message || "Đã cập nhật trạng thái giải đấu."));
    } catch (err: any) {
      setVarNotice("❌ " + (err?.message || "Không đổi được trạng thái giải."));
    } finally {
      setStatusBusy(false);
    }
  };

  const handleExportTournamentCsv = () => {
    if (!activeTournament) return;
    const lines: string[] = [];
    lines.push(`"BÁO CÁO ĐIỀU HÀNH GIẢI ĐẤU - ${activeTournament.title}"`);
    lines.push(`"Môn thi đấu","${sportLabel(activeTournament.sportType)}","Thể thức","${formatLabel(activeTournament.format)}"`);
    lines.push(`"Cụm sân","${activeTournament.pitchName || activeTournament.location || "Đà Nẵng"}","Trạng thái","${activeTournament.status || "OPEN"}"`);
    lines.push(`"Lệ phí/đội","${activeTournament.entryFee || 0}","Quỹ thưởng","${activeTournament.prizePool || 0}"`);
    lines.push("");
    lines.push(`"1. DANH SÁCH ĐỘI BÓNG THAM GIA (${(activeTournament.teams || []).length} đội)"`);
    lines.push(`"STT","Tên Đội","Đội Trưởng","Số Điện Thoại","Quân Số","Trạng Thái Lệ Phí","Danh Sách Cầu Thủ"`);
    (activeTournament.teams || []).forEach((tm: any, idx: number) => {
      lines.push(
        `"${idx + 1}","${tm.teamName || ""}","${tm.captainName || ""}","${tm.captainPhone || ""}","${tm.memberCount || 12}","${tm.registrationStatus || "CONFIRMED"}","${(tm.memberNames || "").replace(/"/g, '""')}"`
      );
    });
    lines.push("");
    lines.push(`"2. LỊCH THI ĐẤU & KẾT QUẢ (${scheduledMatches.length} trận)"`);
    lines.push(`"Mã Trận","Đội A","Tỷ Số","Đội B","Ngày Thi Đấu","Khung Giờ","Sân","Trọng Tài"`);
    scheduledMatches.forEach((m: any) => {
      const done = doneMatches.find((d: any) => d.matchId === m.matchId);
      const scoreStr = done ? `${done.scoreA} - ${done.scoreB}` : "Chưa đá";
      lines.push(
        `"${m.matchId}","${m.teamA}","${scoreStr}","${m.teamB}","${m.matchDate || "Chưa xếp"}","${m.timeSlot || ""}","${m.pitchName || ""}","${m.refereeName || ""}"`
      );
    });

    const csvContent = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-giai-${activeTournament.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setVarNotice("✅ Đã xuất file báo cáo giải đấu (.CSV) thành công!");
  };

 // 
  const handleCreateRandomTournament = async () => {
    try {
      const now = new Date();
  // Dung helper local (VN UTC+7). toISOString() tra ve ngay hom truoc neu sau 17:00.
  const startDate = todayLocalPlus(7);
  const endDate = todayLocalPlus(30);

      const res = await createTournament({
        title: 'Giải Test ' + new Date().toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}),
        description: 'Giải đấu tự động tạo để test bốc thăm và giả lập kết quả',
        sportType: 'SAN_7',
        format: 'KNOCKOUT',
        pitchName: 'Cụm Sân Test Turfzone',
        location: 'Đà Nẵng',
        totalTeams: 16,
        prizePool: 50000000,
        entryFee: 2000000,
        startDate,
        endDate,
        registrationDeadline: startDate,
        status: 'OPEN',
      });

      const newTournamentId = res?.id;
      if (!newTournamentId) throw new Error('Không lấy được ID giải mới');

      await fillSimulatedTeams(newTournamentId);
      // fill-teams reset bracketJson -> phai boc tham that moi co nhanh dau
      await drawTournamentBracket(newTournamentId);

// Chọn luôn giải vừa tạo để BTC thấy ngay nhánh đấu vừa bốc.
setSelectedTournamentId(Number(newTournamentId));
await fetchDbTournaments();
setVarNotice('✅ Đã tạo giải test và bốc thăm thành công.');

      onOpenBracket?.(String(newTournamentId));

    } catch (err: any) {
      console.error('Tạo giải test thất bại:', err);
      setVarNotice('❌ Tạo giải test thất bại: ' + (err?.message || 'Lỗi không xác định'));
    }
  };

  // ---- QUẢN LÝ MỜI EMAIL & TRẠNG THÁI ----
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteModalTourney, setInviteModalTourney] = useState<any | null>(null);

  // Thêm đội thủ công (BTC nhập tay, không qua form đăng ký của cầu thủ)
  // Quyền tham gia giải: ai cũng tham gia / chỉ mời qua email
 const [joinMode, setJoinMode] = useState<"PUBLIC" | "INVITE_ONLY">("PUBLIC");
 const [inviteEmails, setInviteEmails] = useState<string[]>([]);
 const [inviteInput, setInviteInput] = useState("");
 const [accessBusy, setAccessBusy] = useState(false);

 /**
  * Nạp cấu hình quyền tham gia khi đổi giải.
  *
  * <p>accessSeq chống race: nếu người dùng bấm nút đổi quyền TRONG LÚC request GET
  * đang bay, response cũ (PUBLIC) sẽ ghi đè lựa chọn mới. Mỗi thao tác tăng seq,
  * response nào có seq cũ hơn sẽ bị bỏ qua.</p>
  */
 const accessSeq = React.useRef(0);
 const loadJoinAccess = useCallback(async (tid: number) => {
  const seq = ++accessSeq.current;
  try {
   const acc = await fetchJoinAccess(tid);
   if (seq !== accessSeq.current) return;
   setJoinMode(acc.joinMode);
   setInviteEmails(acc.invitedEmails);
  } catch {
   if (seq !== accessSeq.current) return;
   setJoinMode("PUBLIC");
   setInviteEmails([]);
  }
 }, []);

 useEffect(() => {
  const tid = Number(activeTournament?.id);
  if (tid) loadJoinAccess(tid);
 }, [activeTournament?.id, loadJoinAccess]);

 /** Lưu quyền tham gia (kèm danh sách email mời hiện tại). */
 const handleSaveAccess = async (mode: "PUBLIC" | "INVITE_ONLY") => {
  const tid = Number(activeTournament?.id);
  if (!tid) return;
  setAccessBusy(true);
  try {
   accessSeq.current++; // vô hiệu hoá response GET đang bay
   const res = await setJoinAccess(tid, mode, mode === "INVITE_ONLY" ? inviteEmails : []);
   setJoinMode(res.joinMode);
   setInviteEmails(res.invitedEmails);
   setVarNotice("✅ " + (res.message || "Đã lưu quyền tham gia."));
   await fetchDbTournaments();
  } catch (err: any) {
   setVarNotice("❌ " + (err?.message || "Không lưu được quyền tham gia."));
  } finally {
   setAccessBusy(false);
  }
 };

 /** Thêm 1 email vào danh sách mời. */
 const handleAddInvite = async () => {
  const tid = Number(activeTournament?.id);
  const email = inviteInput.trim().toLowerCase();
  if (!tid || !email) return;
  setAccessBusy(true);
  try {
   accessSeq.current++;
   const res = await addTournamentInvite(tid, email);
   setJoinMode(res.joinMode);
   setInviteEmails(res.invitedEmails);
   setInviteInput("");
   setVarNotice("✅ " + (res.message || "Đã thêm email mời."));
   await fetchDbTournaments();
  } catch (err: any) {
   setVarNotice("❌ " + (err?.message || "Không thêm được email mời."));
  } finally {
   setAccessBusy(false);
  }
 };

 /** Gỡ 1 email khỏi danh sách mời. */
 const handleRemoveInvite = async (email: string) => {
  const tid = Number(activeTournament?.id);
  if (!tid) return;
  setAccessBusy(true);
  try {
   accessSeq.current++;
   const res = await removeTournamentInvite(tid, email);
   setInviteEmails(res.invitedEmails);
   setVarNotice("✅ " + (res.message || "Đã gỡ email mời."));
  } catch (err: any) {
   setVarNotice("❌ " + (err?.message || "Không gỡ được email mời."));
  } finally {
   setAccessBusy(false);
  }
 };
 const [showAddTeamForm, setShowAddTeamForm] = useState(false); // form inline, KHÔNG popup
 const [addingTeam, setAddingTeam] = useState(false);
 const [addTeamForm, setAddTeamForm] = useState({
  teamName: "",
  captainName: "",
  captainPhone: "",
  memberCount: 12,
 });

 const manualTeamErrors = useMemo(() => {
   const errs: Record<string, string> = {};
   const name = addTeamForm.teamName.trim();
   if (!name) {
     errs.teamName = 'Vui lòng nhập tên đội bóng.';
   } else if (name.length < 3) {
     errs.teamName = 'Tên đội phải có ít nhất 3 ký tự.';
   } else if (activeTournament?.teams?.some((t: any) => (t?.name || t?.teamName || '').trim().toLowerCase() === name.toLowerCase())) {
     errs.teamName = `Đội "${name}" đã có trong danh sách thi đấu.`;
   } else if (pendingTeams?.some((t: any) => (t?.teamName || '').trim().toLowerCase() === name.toLowerCase())) {
     errs.teamName = `Đội "${name}" đang chờ duyệt hồ sơ.`;
   }

   const phone = addTeamForm.captainPhone.trim();
   if (phone && !/^0[0-9]{9}$/.test(phone)) {
     errs.captainPhone = 'Số ĐT phải gồm 10 chữ số (VD: 0909…).';
   }

   const members = Number(addTeamForm.memberCount);
   if (!Number.isInteger(members) || members < 5 || members > 25) {
     errs.memberCount = 'Quân số phải từ 5 - 25 người.';
   }

   const currentCount = activeTournament?.teams?.length || 0;
   const maxCount = activeTournament?.totalTeams || 0;
   if (maxCount > 0 && currentCount >= maxCount) {
     errs.quota = `Giải đã đủ ${maxCount}/${maxCount} đội, không thể thêm mới.`;
   }

   return errs;
 }, [addTeamForm, activeTournament, pendingTeams]);

 const isManualTeamValid = Object.keys(manualTeamErrors).length === 0;

 /** Gửi yêu cầu thêm đội thủ công vào giải đang chọn. */
 const handleCopyInviteLink = () => {
    if (!activeTournament?.id) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const link = `${origin}/tournaments/register?tournamentId=${activeTournament.id}`;
    navigator.clipboard.writeText(link);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 2500);
  };

  const handleAddManualTeam = async () => {

  const tid = Number(activeTournament?.id);
  if (!tid) {
   setVarNotice("❌ Hãy chọn giải đấu trước khi thêm đội.");
   return;
  }
  if (!isManualTeamValid) {
   const firstErr = Object.values(manualTeamErrors)[0] || "Thông tin đội bóng chưa hợp lệ.";
   setVarNotice("❌ " + firstErr);
   return;
  }
  setAddingTeam(true);
  try {
   const res = await addManualTeam(tid, {
    teamName: addTeamForm.teamName.trim(),
    captainName: addTeamForm.captainName.trim() || undefined,
    captainPhone: addTeamForm.captainPhone.trim() || undefined,
    memberCount: Number(addTeamForm.memberCount) || 12,
   });
   setVarNotice("✅ " + (res?.message || "Đã thêm đội vào giải."));
   setAddTeamForm({ teamName: "", captainName: "", captainPhone: "", memberCount: 12 });
   setShowAddTeamForm(false);
   await fetchDbTournaments();
   await loadPendingTeams(tid);
  } catch (err: any) {
   setVarNotice("❌ " + (err?.message || "Không thêm được đội. Vui lòng thử lại."));
  } finally {
   setAddingTeam(false);
  }
 };
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    sportType: 'SAN_7',
    format: 'KNOCKOUT',
    pitchName: '',
    location: '',
    totalTeams: 8,
    prizePool: 0,
    entryFee: 0,
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    bankCode: '',
    bankAccount: '',
    accountName: '',
  });

  /** Mở modal sửa và nạp dữ liệu giải đang chọn vào form. */
  const openEditModal = (t: any) => {
    if (!t) return;
    setEditForm({
      title: t.title ?? '',
      description: t.description ?? '',
      sportType: t.sportType ?? 'SAN_7',
      format: t.format ?? 'KNOCKOUT',
      pitchName: t.pitchName ?? '',
      location: t.location ?? '',
      totalTeams: t.totalTeams ?? 8,
      prizePool: t.prizePool ?? 0,
      entryFee: t.entryFee ?? 0,
      startDate: t.startDate ?? '',
      endDate: t.endDate ?? '',
      registrationDeadline: t.registrationDeadline ?? '',
      bankCode: t.bankCode ?? '',
      bankAccount: t.bankAccount ?? '',
      accountName: t.accountName ?? '',
    });
    setSelectedTournamentId(Number(t.id));
    setBottomTab('edit');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = activeTournament;
    if (!t?.id) return;
    if (!editForm.title.trim()) {
      setVarNotice('⚠️ Tên giải không được để trống.');
      return;
    }
    setSavingEdit(true);
    try {
      // Chỉ gửi field người dùng thực sự sửa — backend giữ nguyên phần còn lại.
      await updateTournament(Number(t.id), {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        sportType: editForm.sportType,
        format: editForm.format,
        pitchName: editForm.pitchName.trim(),
        location: editForm.location.trim(),
        totalTeams: Number(editForm.totalTeams) || 2,
        prizePool: Number(editForm.prizePool) || 0,
        entryFee: Number(editForm.entryFee) || 0,
        startDate: editForm.startDate || null,
        endDate: editForm.endDate || null,
        registrationDeadline: editForm.registrationDeadline || null,
        bankCode: editForm.bankCode.trim(),
        bankAccount: editForm.bankAccount.trim(),
        accountName: editForm.accountName.trim(),
      });
      await fetchDbTournaments();
      setBottomTab('teams');
      setVarNotice('✅ Đã lưu thông tin giải đấu.');
    } catch (err: any) {
      setVarNotice('❌ ' + (err?.message || 'Không lưu được thông tin giải.'));
    } finally {
      setSavingEdit(false);
    }
  };

  // ---- THỐNG KÊ TÀI CHÍNH GIẢI ----
  const [finance, setFinance] = useState<TournamentFinance | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);

  const loadFinance = useCallback(async (tournamentId?: number | string | null) => {
    const id = Number(tournamentId);
    if (!id) {
      setFinance(null);
      return;
    }
    setFinanceLoading(true);
    try {
      setFinance(await fetchTournamentFinance(id));
    } catch (err: any) {
      // Không chặn trang: chỉ hiện thông báo nhỏ, các tab khác vẫn dùng được.
      setFinance(null);
      setVarNotice('⚠️ ' + (err?.message || 'Không tải được thống kê tài chính.'));
    } finally {
      setFinanceLoading(false);
    }
  }, []);

  // Tự nạp thống kê tài chính khi chọn giải khác (hoặc sau khi vừa sửa xong).
  useEffect(() => {
    loadFinance(activeTournamentId);
  }, [activeTournamentId, loadFinance]);

// Nhánh đấu parse từ bracketJson (nguồn thật, không cần gọi API thêm).
  const activeBracket = useMemo(() => {
 if (!activeTournament?.bracketJson) return null;
 try {
 const p = JSON.parse(activeTournament.bracketJson);
 return p && Array.isArray(p.rounds) ? p : null;
 } catch {
 return null;
 }
 }, [activeTournament]);

 const doneMatches = useMemo(() => {
 if (!activeBracket) return [];
 return activeBracket.rounds
 .flatMap((r: any) => r.matches ?? [])
 .filter((m: any) => m.status === "DONE" && m.teamA && m.teamB)
 .map((m: any) => ({
 matchId: m.matchId,
 teamA: m.teamA.name,
 teamB: m.teamB.name,
 scoreA: m.scoreA ?? 0,
 scoreB: m.scoreB ?? 0,
 matchDate: m.matchDate,
 }));
 }, [activeBracket]);

 const scheduledMatches = useMemo(() => {
 if (!activeBracket) return [];
 return activeBracket.rounds
 .flatMap((r: any) => (r.matches ?? []).map((m: any) => ({ ...m, roundName: r.name })))
 .filter((m: any) => m.status !== "BYE" && m.teamA && m.teamB)
 .map((m: any) => ({
 matchId: m.matchId,
 roundName: m.roundName,
 status: m.status,
 teamA: m.teamA.name,
 teamB: m.teamB.name,
 scoreA: m.scoreA ?? 0,
 scoreB: m.scoreB ?? 0,
 matchDate: m.matchDate,
 timeSlot: m.timeSlot,
 pitchName: m.pitchName,
 refereeName: m.refereeName,
 }))
 .sort((a: any, b: any) => (a.matchDate ?? "").localeCompare(b.matchDate ?? ""));
 }, [activeBracket]);

 // BXH tính từ các trận DONE (thắng 3đ, hòa 1đ; xếp điểm → hiệu số → tỷ lệ thắng)
 const standings = useMemo(() => {
 if (!activeTournament) return [];
 const base = new Map<string, any>();
 for (const t of activeTournament.teams ?? []) {
 base.set(t.teamName, {
 team: t.teamName,
 winRate: t.winRate ?? 0,
 form: t.form ?? "",
 record: t.record ?? "0-0-0",
 played: 0,
 won: 0,
 drawn: 0,
 lost: 0,
 gf: 0,
 ga: 0,
 });
 }
 for (const m of doneMatches) {
 const a = base.get(m.teamA);
 const b = base.get(m.teamB);
 if (a) { a.played++; a.gf += m.scoreA; a.ga += m.scoreB; }
 if (b) { b.played++; b.gf += m.scoreB; b.ga += m.scoreA; }
 if (m.scoreA === m.scoreB) {
 if (a) a.drawn++;
 if (b) b.drawn++;
 } else if (m.scoreA > m.scoreB) {
 if (a) a.won++;
 if (b) b.lost++;
 } else {
 if (b) b.won++;
 if (a) a.lost++;
 }
 }
 return Array.from(base.values())
 .map((r: any) => ({ ...r, points: r.won * 3 + r.drawn, diff: r.gf - r.ga }))
 .sort((x: any, y: any) => y.points - x.points || y.diff - x.diff || (y.winRate ?? 0) - (x.winRate ?? 0));
 }, [activeTournament, doneMatches]);

 // Vua phá lưới đọc từ bảng goal_events của giải
 const [topScorers, setTopScorers] = useState<any[]>([]);
 const loadTopScorers = useCallback((tid?: number | null) => {
 if (!tid) { setTopScorers([]); return; }
 fetchWithTimeout(`${API_BASE_URL}/api/v1/tournaments/${tid}/scorers`)
 .then((r) => (r.ok ? r.json() : []))
 .then((d) => { if (Array.isArray(d)) setTopScorers(d.slice(0, 10)); })
 .catch(() => { setTopScorers([]); });
 }, []);

 useEffect(() => {
 loadTopScorers(activeTournamentId);
 }, [activeTournamentId, loadTopScorers]);

 // --- Bảng điều khiển trọng tài: chọn 1 trận thật để nhập tỷ số & biên bản ---
 const umpireMatches = useMemo(() => {
 if (!activeBracket) return [] as any[];
 return activeBracket.rounds
 .flatMap((r: any) => (r.matches ?? []).map((m: any) => ({ ...m, roundName: r.name })))
 .filter((m: any) => m.teamA && m.teamB && !m.teamA.tbd && !m.teamB.tbd && m.status !== "BYE");
 }, [activeBracket]);

 const [umpireMatchId, setUmpireMatchId] = useState<string>("");
 const [umpireScoreA, setUmpireScoreA] = useState(0);
 const [umpireScoreB, setUmpireScoreB] = useState(0);
 const [umpireBusy, setUmpireBusy] = useState(false);
 const [umpireMsg, setUmpireMsg] = useState<string | null>(null);

 // Biên bản chi tiết trận đấu (Thẻ phạt, MVP, Cầu thủ ghi bàn)
 const [showMatchSheet, setShowMatchSheet] = useState(false);
 const [yellowCardsA, setYellowCardsA] = useState(0);
 const [yellowCardsB, setYellowCardsB] = useState(0);
 const [redCardsA, setRedCardsA] = useState(0);
 const [redCardsB, setRedCardsB] = useState(0);
 const [mvpPlayer, setMvpPlayer] = useState("");
 const [matchNotes, setMatchNotes] = useState("");
 const [scorerRows, setScorerRows] = useState<{ playerName: string; teamName: string; goals: number; assists: number }[]>([]);
 const [newScorerTeam, setNewScorerTeam] = useState<"A" | "B">("A");
 const [newScorerName, setNewScorerName] = useState("");
 const [newScorerGoals, setNewScorerGoals] = useState(1);
 const [newScorerAssists, setNewScorerAssists] = useState(0);

 useEffect(() => {
 if (!umpireMatches.length) { setUmpireMatchId(""); return; }
 if (!umpireMatches.some((m: any) => m.matchId === umpireMatchId)) {
 const first = umpireMatches.find((m: any) => m.status === "SCHEDULED") ?? umpireMatches[0];
 setUmpireMatchId(first.matchId);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [umpireMatches]);

 const umpireMatch = useMemo(
 () => umpireMatches.find((m: any) => m.matchId === umpireMatchId) ?? null,
 [umpireMatches, umpireMatchId]
 );

 // Danh sách cầu thủ gợi ý cho đội A và đội B của trận đang chọn
 const umpireRosterOptions = useMemo(() => {
 if (!activeTournament || !umpireMatch) return { A: [] as string[], B: [] as string[] };
 const findRoster = (tName: string) => {
 const entry = (activeTournament.teams ?? []).find((t: any) => t.teamName === tName);
 if (!entry?.memberNames) return [];
 return String(entry.memberNames)
 .split(",")
 .map((s) => s.trim())
 .filter(Boolean);
 };
 return {
 A: findRoster(umpireMatch.teamA?.name),
 B: findRoster(umpireMatch.teamB?.name),
 };
 }, [activeTournament, umpireMatch]);

 useEffect(() => {
 setUmpireScoreA(umpireMatch?.scoreA ?? 0);
 setUmpireScoreB(umpireMatch?.scoreB ?? 0);
 setYellowCardsA(0);
 setYellowCardsB(0);
 setRedCardsA(0);
 setRedCardsB(0);
 setMvpPlayer("");
 setMatchNotes("");
 setScorerRows([]);
 setNewScorerName("");
 setUmpireMsg(null);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [umpireMatchId]);

 const handleAddScorerRow = () => {
 if (!umpireMatch || !newScorerName.trim()) return;
 const teamName = newScorerTeam === "A" ? umpireMatch.teamA.name : umpireMatch.teamB.name;
 setScorerRows((prev) => [
 ...prev,
 {
 playerName: newScorerName.trim(),
 teamName,
 goals: Math.max(0, Number(newScorerGoals) || 0),
 assists: Math.max(0, Number(newScorerAssists) || 0),
 },
 ]);
 setNewScorerName("");
 setNewScorerGoals(1);
 setNewScorerAssists(0);
 };

 const handleRemoveScorerRow = (idx: number) => {
 setScorerRows((prev) => prev.filter((_, i) => i !== idx));
 };

 const handleUndoMatch = async (matchIdToUndo: string) => {
 if (!activeTournamentId) return;
 setUmpireBusy(true);
 try {
 const res = await undoMatchResult(Number(activeTournamentId), matchIdToUndo);
 await fetchDbTournaments();
 loadTopScorers(activeTournamentId);
 setUmpireMsg(`✅ ${res.message}`);
 setVarNotice(`✅ ${res.message}`);
 } catch (e: any) {
 setUmpireMsg(`❌ ${e?.message || "Không thể huỷ kết quả trận này."}`);
 } finally {
 setUmpireBusy(false);
 }
 };

 const saveUmpireScore = async () => {
 if (!activeTournamentId || !umpireMatch) return;
 const isLeague = activeTournament?.format === "ROUND_ROBIN";
 if (umpireScoreA === umpireScoreB && !isLeague) {
 setUmpireMsg("Vòng loại trực tiếp cần phân thắng bại, không nhận hòa.");
 return;
 }
 if (umpireMatch.status === "DONE") {
 setUmpireMsg("Trận này đã có kết quả. Bấm nút “Huỷ Kết Quả & Mở Lại Trận” để nhập lại.");
 return;
 }
 try {
 setUmpireBusy(true);
 const body = await apiRequest<any>(`/api/v1/tournaments/${activeTournamentId}/matches`, {
 method: "POST",
 body: JSON.stringify({
 matchId: umpireMatch.matchId,
 scoreA: umpireScoreA,
 scoreB: umpireScoreB,
 yellowCardsA,
 yellowCardsB,
 redCardsA,
 redCardsB,
 mvpPlayer: mvpPlayer.trim() || undefined,
 notes: matchNotes.trim() || undefined,
 scorers: scorerRows.length > 0 ? scorerRows : undefined,
 }),
 });
 const formNote = (body?.formChanges ?? []).map((c: any) => `${c.team} ${c.after?.record ?? ""}`).join(" • ");
 setUmpireMsg(`${body?.message ?? "Đã lưu kết quả."}${formNote ? ` | Phong độ: ${formNote}` : ""}`);
 setScorerRows([]);
 await fetchDbTournaments();
 loadTopScorers(activeTournamentId);
 } catch (e: any) {
 setUmpireMsg(e?.message || "Không gọi được máy chủ. Kiểm tra kết nối rồi thử lại.");
 } finally {
 setUmpireBusy(false);
 }
 };

 const filteredTournaments = selectedSport === "all"
 ? tournaments
 : tournaments.filter((t: any) => t.sport === selectedSport);


 return (
 <div className="space-y-4 sm:space-y-8 animate-fade-in pb-16">
 {/* HEADER BAR */}
  <div className="bg-white text-slate-900 rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden">
    {/* TẦNG 1: Tiêu đề & Cụm nút Thao tác */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-mono font-bold text-sky-900 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            <span className="w-2 h-2 rounded-full bg-[#0369a1] animate-ping" />
            <span>{loadingDb ? "Đang tải dữ liệu…" : `${dbTournaments.length} giải đấu`}</span>
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
          <span>Quản Lý Giải Đấu</span>
          <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[13px] font-bold">
            {loadingDb ? "Đang tải…" : `${dbTournaments.length} giải`}
          </span>
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Bốc thăm chia nhánh, duyệt hồ sơ đội bóng tham gia và điều hành kết quả thi đấu.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
        <button
          type="button"
          onClick={fetchDbTournaments}
          disabled={loadingDb}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[13px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? "animate-spin" : ""}`} />
          <span>Tải Lại</span>
        </button>

        <Link
          href="/tournaments/new"
          className="px-4 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Tạo Giải Mới</span>
        </Link>
      </div>
    </div>

    {/* TẦNG 2: 4 THẺ KPI ĐIỀU HÀNH TOÀN MÀN HÌNH */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
      <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 flex items-center gap-3.5 shadow-2xs">
        <div className="w-11 h-11 rounded-xl bg-[#0369a1] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Trophy className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {kpiStats.totalTournaments}
          </div>
          <div className="text-[13px] font-semibold text-slate-600 truncate">
            Giải đấu ({kpiStats.open} mở • {kpiStats.ongoing} live)
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3.5 shadow-2xs">
        <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Users className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {kpiStats.totalTeams}
          </div>
          <div className="text-[13px] font-semibold text-slate-600 truncate">
            Đội bóng tham gia
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center gap-3.5 shadow-2xs">
        <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
          <Clock className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {kpiStats.pendingTeamsCount}
          </div>
          <div className="text-[13px] font-semibold text-slate-600 truncate">
            Đội chờ duyệt phí
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center gap-3.5 shadow-2xs">
        <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Wallet className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {kpiStats.totalPrize > 0 ? `${(kpiStats.totalPrize / 1_000_000).toFixed(1)}Tr` : "0đ"}
          </div>
          <div className="text-[13px] font-semibold text-slate-600 truncate">
            Tổng quỹ giải thưởng
          </div>
        </div>
      </div>
    </div>

    {varNotice && (
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 animate-fade-in text-[13px]">
        <AlertCircle className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
        <p className="font-bold text-sky-900 flex-1">{varNotice}</p>
        <button
          type="button"
          onClick={() => setVarNotice(null)}
          className="text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )}

    {/* TẦNG 3: BỘ LỌC THỂ THỨC MÔN THỂ THAO */}
    <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[14px] font-bold text-slate-500 mr-2 flex items-center gap-1.5 whitespace-nowrap">
          <Filter className="w-3.5 h-3.5 text-slate-500" /> Môn:
        </span>
        {SPORT_FILTERS.map(item => (
          <button
            key={item.id}
            onClick={() => setSelectedSport(item.id)}
            className={`px-3.5 py-1.5 rounded-xl text-[14px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              selectedSport === item.id
                ? "bg-[#0369a1] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200/60"
            }`}
          >
            {item.label} ({countBySportFilter(item.id)})
          </button>
        ))}
      </div>

      <div className="text-[14px] font-mono text-slate-500 shrink-0 hidden md:block">
        Giải đang mở: <span className="text-sky-800 font-bold">{countBySportFilter("all")} giải </span>
      </div>
    </div>
  </div>

  {/* FOOTBALL TOURNAMENT BENTO CAROUSEL CARDS */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
 {loadingDb && filteredTournaments.length === 0 ? (
 [0, 1, 2].map((i) => (
 <div key={i} className="rounded-lg p-4 sm:p-6 border border-slate-200/90 bg-white space-y-3">
 <div className="skeleton-shimmer h-5 w-2/3 rounded-lg" />
 <div className="skeleton-shimmer h-3 w-1/2 rounded-lg" />
 <div className="skeleton-shimmer h-2 w-full rounded-full" />
 </div>
 ))
 ) : filteredTournaments.length === 0 ? (
 <div className="md:col-span-3 rounded-lg p-4 sm:p-10 text-center border border-dashed border-slate-300 bg-white">
 <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
 <p className="mt-3 text-sm font-bold text-slate-600">
 {selectedSport === "all"
 ? "Chưa có giải đấu nào ."
 : `Không có giải nào đúng bộ lọc “${SPORT_FILTERS.find((f) => f.id === selectedSport)?.label}”.`}
 </p>
 </div>
 ) : (
    filteredTournaments.map((t: any) => {
      const isSelected = String(t.id) === String(activeTournamentId);
      return (
        <div
          key={t.id}
          className={`rounded-lg p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden flex flex-col justify-between shadow-xs cursor-pointer group hover:border-[#0369a1] hover:shadow-sm ${
            isSelected
              ? "border-[#0369a1] ring-2 ring-[#0369a1]/25 bg-sky-50/20"
              : t.status === "live"
              ? "bg-sky-50/40 border-sky-300 text-slate-900 hover:border-sky-400"
              : "bg-white border-slate-200/90 text-slate-900 hover:border-slate-300"
          }`}
          onClick={() => {
            // Click vào ô giải là chuyển thẳng vào trang giải đấu luôn!
            onOpenBracket?.(String(t.id));
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenBracket?.(String(t.id));
            }
          }}
        >
          {isSelected && (
            <div className="absolute -top-px -right-px z-20">
              <span className="inline-flex items-center gap-1 rounded-bl-xl rounded-tr-lg bg-[#0369a1] px-2.5 py-1 text-[13px] font-bold text-white shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đang thao tác
              </span>
            </div>
          )}

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[13px] font-bold tracking-wider flex items-center gap-1.5 ${
                t.status === "live"
                  ? "bg-rose-500 text-white animate-pulse"
                  : t.status === "active"
                  ? "bg-amber-500/20 text-amber-700 border border-amber-500/30"
                  : "bg-slate-200 text-slate-600 "
              }`}>
                {t.status === "live" && <Radio className="w-3 h-3 animate-spin" />}
                {t.sportBadge}
              </span>

              <span className="text-[13px] font-mono text-slate-500 font-bold">
                {t.courts}
              </span>
            </div>

            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug group-hover:text-[#0369a1] transition-colors">
                  {t.title}
                </h3>
                <span className="text-slate-400 group-hover:text-[#0369a1] shrink-0 mt-0.5 p-1">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[13px] text-slate-500 mt-0.5 font-medium line-clamp-1">
                {t.subtitle}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[13px] font-bold text-slate-500">
                <span>Tiến Độ Giải Đấu</span>
                <span>{t.progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-[#0369a1] transition-all duration-500"
                  style={{ width: `${t.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2.5 mt-3 border-t border-slate-200 flex items-center justify-between text-[13px] relative z-10">
            <span className="font-bold text-slate-500">
              {t.hasBracket ? "✅ Đã bốc thăm" : "⏳ Chưa bốc thăm"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTournamentId(Number(t.id));
                  setVarNotice("✅ Đã chọn giải điều hành: " + t.title);
                }}
                className={`px-2.5 py-1 rounded text-[12px] font-bold border transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#0369a1] text-white border-[#0369a1]"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                }`}
                title="Chọn giải này để duyệt đội, mời email bên dưới"
              >
                {isSelected ? "Đang chọn" : "Quản lý"}
              </button>

              <span className="font-bold text-[#0369a1] flex items-center gap-0.5 text-[12px] group-hover:underline">
                <span>Vào trang</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      );
    })
  )}
</div>

{/* MAIN CONTENT GRID: LIVE ELECTRONIC UMPIRE CONSOLE (LEFT 8) + AI SEEDING & ESCROW (RIGHT 4) */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
 
 {/* LEFT 8 COLS: UMPIRE CONSOLE + BRACKET ENGINE + DATA TABLES */}
 <div className="lg:col-span-8 space-y-4 sm:space-y-8">

 {/* 1. BẢNG ĐIỀU KHIỂN TRỌNG TÀI — chạy trên trận thật trong nhánh đấu */}
 <div className="bg-white border border-slate-200/90 text-slate-900 rounded-lg p-4 sm:p-8 shadow-sm relative overflow-hidden">
 

 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-5 mb-6">
 <div className="flex items-center space-x-3 min-w-0">
 <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold shrink-0">
 <Activity className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <div className="flex items-center space-x-2">
 <span className="text-[14px] font-black text-rose-600">
 Bảng Điều Khiển Trọng Tài
 </span>
 <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[14px] font-black">
 
 </span>
 </div>
 <h2 className="text-lg font-black tracking-tight text-slate-900 mt-0.5 truncate">
 {umpireMatch
 ? `${umpireMatch.teamA.name} vs ${umpireMatch.teamB.name}`
 : activeTournament
 ? `${activeTournament.title} — chưa bốc thăm`
 : "Chưa có giải nào "}
 </h2>
 </div>
 </div>

 {umpireMatches.length > 0 && (
 <select
 value={umpireMatchId}
 onChange={(e) => setUmpireMatchId(e.target.value)}
 aria-label="Chọn trận để nhập tỷ số"
 className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-[14px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 max-w-[260px]"
 >
 {umpireMatches.map((m: any) => (
 <option key={m.matchId} value={m.matchId}>
 {m.matchId} · {m.teamA.name} vs {m.teamB.name}
 {m.status === "DONE" ? ` (đã đá ${m.scoreA}-${m.scoreB})` : ""}
 </option>
 ))}
 </select>
 )}
 </div>

 {umpireMatch && umpireMatch.status === "DONE" && (
 <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[14px] flex flex-wrap items-center justify-between gap-3">
   <span className="font-bold">
     Trận này đã có kết quả {umpireMatch.scoreA}-{umpireMatch.scoreB}. Bạn có thể huỷ kết quả để mở lại trận và nhập tỷ số mới.
   </span>
   <button
     type="button"
     onClick={() => handleUndoMatch(umpireMatch.matchId)}
     disabled={umpireBusy}
     className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
   >
     <RotateCcw className="w-3.5 h-3.5" />
     <span>Huỷ Kết Quả &amp; Mở Lại Trận</span>
   </button>
 </div>
 )}

 {!umpireMatch ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
                <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  {activeTournament ? `Giải “${activeTournament.title}” chưa có trận đấu nào được chọn để điều hành.` : "Chưa chọn giải đấu nào."}
                </p>
                <p className="text-[13px] text-slate-500 max-w-md mx-auto">
                  {activeBracket
                    ? "Vui lòng chọn một trận đấu ở menu bên trên hoặc xem nhánh đấu để cập nhật kết quả thi đấu."
                    : "Giải đấu chưa bốc thăm chia nhánh. Vui lòng bấm “Bốc Thăm Chia Nhánh Ngay” bên dưới để tạo lịch thi đấu."}
                </p>
                {activeTournament && !activeBracket && (
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await drawTournamentBracket(Number(activeTournament.id));
                          await fetchDbTournaments();
                          setVarNotice("✅ " + (res.message || "Đã bốc thăm chia nhánh thành công!"));
                        } catch (err: any) {
                          setVarNotice("❌ " + (err?.message || "Chưa đủ đội xác nhận để bốc thăm."));
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Bốc Thăm Chia Nhánh Ngay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenBracket?.(String(activeTournament.id))}
                      className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[13px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Mở Trang Giải Đấu</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Bảng điểm */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 items-center bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
 <div className="p-4 sm:p-6 rounded-2xl border border-sky-300 bg-white">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center space-x-2">
 <span className="w-3 h-3 rounded-full bg-[#0369a1]" />
 <span className="text-[14px] font-black tracking-wide text-slate-700">Đội A</span>
 </div>
 </div>
 <div className="flex items-baseline justify-between gap-2">
 <span className="text-sm font-bold text-slate-900 truncate">{umpireMatch?.teamA?.name}</span>
 <span className="text-5xl font-black font-mono text-sky-700 tracking-tighter">{umpireScoreA}</span>
 </div>
 <div className="mt-3 pt-3 border-t border-slate-100 text-[14px] font-mono text-slate-500 flex items-center justify-between">
 <span>{umpireMatch?.matchDate ?? "Chưa xếp lịch"}</span>
 <span className="text-sky-800 font-bold">Phong độ: {umpireMatch?.teamA?.record ?? umpireMatch?.teamA?.form ?? "—"}</span>
 </div>
 </div>

 <div className="p-4 sm:p-6 rounded-2xl border border-sky-300 bg-white">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center space-x-2">
 <span className="w-3 h-3 rounded-full bg-[#0369a1]" />
 <span className="text-[14px] font-black tracking-wide text-slate-700">Đội B</span>
 </div>
 </div>
 <div className="flex items-baseline justify-between gap-2">
 <span className="text-sm font-bold text-slate-900 truncate">{umpireMatch?.teamB?.name}</span>
 <span className="text-5xl font-black font-mono text-[#0369a1] tracking-tighter">{umpireScoreB}</span>
 </div>
 <div className="mt-3 pt-3 border-t border-slate-100 text-[14px] font-mono text-slate-500 flex items-center justify-between">
 <span>{umpireMatch?.timeSlot ?? "Chưa xếp giờ"}</span>
 <span className="text-sky-700 font-bold">Phong độ: {umpireMatch?.teamB?.record ?? umpireMatch?.teamB?.form ?? "—"}</span>
 </div>
 </div>
 </div>

 {/* Điều khiển tỷ số & Biên bản chi tiết trận đấu */}
 {umpireMatch && umpireMatch.status !== "DONE" && (
 <div className="mt-6 space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-2">
   <span className="text-[14px] font-bold text-slate-600">
     Điều Khiển Tỷ Số &amp; Biên Bản Trận Đấu:
   </span>
   <button
     type="button"
     onClick={() => setShowMatchSheet((v) => !v)}
     className="px-3.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0369a1] border border-sky-200 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
   >
     <FileText className="w-4 h-4" />
     <span>{showMatchSheet ? "Ẩn Biên Bản Chi Tiết" : "+ Ghi Cầu Thủ Ghi Bàn / Thẻ Phạt / MVP"}</span>
   </button>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <button
 onClick={() => setUmpireScoreA(umpireScoreA + 1)}
 className="py-3 px-4 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-black shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
 >
 <Plus className="w-4 h-4 stroke-[3]" />
 <span>+1 Bàn (Đội A)</span>
 </button>
 <button
 onClick={() => setUmpireScoreB(umpireScoreB + 1)}
 className="py-3 px-4 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-black shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
 >
 <Plus className="w-4 h-4 stroke-[3]" />
 <span>+1 Bàn (Đội B)</span>
 </button>
 <button
 onClick={() => { setUmpireScoreA(0); setUmpireScoreB(0); }}
 className="py-3 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-[14px] font-black shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
 >
 <RefreshCw className="w-4 h-4" />
 <span>Đặt lại 0-0</span>
 </button>
 <button
 onClick={saveUmpireScore}
 disabled={umpireBusy}
 className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-black shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
 >
 <CheckCircle2 className="w-4 h-4" />
 <span>{umpireBusy ? "Đang lưu…" : "Lưu KQ & Biên Bản"}</span>
 </button>
 </div>

 {/* KHỐI INLINE: BIÊN BẢN TRẬN ĐẤU CHI TIẾT (CẦU THỦ GHI BÀN, THẺ PHẠT, MVP) */}
 {showMatchSheet && (
   <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
     <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
       <h4 className="text-[14px] font-bold text-slate-900 flex items-center gap-1.5">
         <FileText className="w-4 h-4 text-[#0369a1]" />
         <span>Biên Bản Thống Kê Trận Đấu ({umpireMatch.matchId})</span>
       </h4>
       <span className="text-[13px] text-slate-500">Tự động cập nhật BXH Vua phá lưới</span>
     </div>

     {/* Thẻ vàng / Thẻ đỏ & Cầu thủ xuất sắc MVP */}
     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
       <div className="bg-white p-2.5 rounded-lg border border-slate-200">
         <label className="text-[13px] font-bold text-amber-700 block mb-1">
           🟨 Thẻ vàng ({umpireMatch.teamA.name})
         </label>
         <input
           type="number"
           min={0}
           max={15}
           value={yellowCardsA}
           onChange={(e) => setYellowCardsA(Math.max(0, Number(e.target.value)))}
           className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-[13px] font-bold text-slate-900"
         />
       </div>
       <div className="bg-white p-2.5 rounded-lg border border-slate-200">
         <label className="text-[13px] font-bold text-rose-700 block mb-1">
           🟥 Thẻ đỏ ({umpireMatch.teamA.name})
         </label>
         <input
           type="number"
           min={0}
           max={10}
           value={redCardsA}
           onChange={(e) => setRedCardsA(Math.max(0, Number(e.target.value)))}
           className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-[13px] font-bold text-slate-900"
         />
       </div>
       <div className="bg-white p-2.5 rounded-lg border border-slate-200">
         <label className="text-[13px] font-bold text-amber-700 block mb-1">
           🟨 Thẻ vàng ({umpireMatch.teamB.name})
         </label>
         <input
           type="number"
           min={0}
           max={15}
           value={yellowCardsB}
           onChange={(e) => setYellowCardsB(Math.max(0, Number(e.target.value)))}
           className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-[13px] font-bold text-slate-900"
         />
       </div>
       <div className="bg-white p-2.5 rounded-lg border border-slate-200">
         <label className="text-[13px] font-bold text-rose-700 block mb-1">
           🟥 Thẻ đỏ ({umpireMatch.teamB.name})
         </label>
         <input
           type="number"
           min={0}
           max={10}
           value={redCardsB}
           onChange={(e) => setRedCardsB(Math.max(0, Number(e.target.value)))}
           className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-[13px] font-bold text-slate-900"
         />
       </div>
     </div>

     {/* MVP & Ghi chú trọng tài */}
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
       <div>
         <label className="text-[13px] font-bold text-slate-700 block mb-1">
           ⭐ Cầu thủ xuất sắc nhất trận (MVP):
         </label>
         <input
           type="text"
           value={mvpPlayer}
           onChange={(e) => setMvpPlayer(e.target.value)}
           placeholder="Nhập tên cầu thủ MVP của trận..."
           className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-[13px] text-slate-900"
         />
       </div>
       <div>
         <label className="text-[13px] font-bold text-slate-700 block mb-1">
           📝 Ghi chú giám sát / trọng tài:
         </label>
         <input
           type="text"
           value={matchNotes}
           onChange={(e) => setMatchNotes(e.target.value)}
           placeholder="VD: Đá bù 3 phút, thời tiết tốt..."
           className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-[13px] text-slate-900"
         />
       </div>
     </div>

     {/* Thêm cầu thủ ghi bàn & kiến tạo */}
     <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
       <div className="flex flex-wrap items-center justify-between gap-2">
         <span className="text-[13px] font-bold text-slate-900">
           ⚽ Danh Sách Cầu Thủ Ghi Bàn &amp; Kiến Tạo
         </span>
         <span className="text-[13px] text-slate-500">
           Lưu ý: nếu nhập cầu thủ ghi bàn, tổng bàn của mỗi đội phải khớp tỷ số {umpireScoreA}-{umpireScoreB}
         </span>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
         <div className="sm:col-span-3">
           <label className="text-[13px] font-semibold text-slate-600 block mb-1">Thuộc đội</label>
           <select
             value={newScorerTeam}
             onChange={(e) => setNewScorerTeam(e.target.value as "A" | "B")}
             className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-[13px] font-bold text-slate-900"
           >
             <option value="A">{umpireMatch.teamA.name}</option>
             <option value="B">{umpireMatch.teamB.name}</option>
           </select>
         </div>

         <div className="sm:col-span-4">
           <label className="text-[13px] font-semibold text-slate-600 block mb-1">Tên cầu thủ</label>
           <input
             type="text"
             list="umpire-roster-datalist"
             value={newScorerName}
             onChange={(e) => setNewScorerName(e.target.value)}
             placeholder="Chọn hoặc gõ tên cầu thủ..."
             className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-[13px] text-slate-900"
           />
           <datalist id="umpire-roster-datalist">
             {(newScorerTeam === "A" ? umpireRosterOptions.A : umpireRosterOptions.B).map((pName) => (
               <option key={pName} value={pName} />
             ))}
           </datalist>
         </div>

         <div className="sm:col-span-2">
           <label className="text-[13px] font-semibold text-slate-600 block mb-1">Số bàn (⚽)</label>
           <input
             type="number"
             min={0}
             max={20}
             value={newScorerGoals}
             onChange={(e) => setNewScorerGoals(Math.max(0, Number(e.target.value)))}
             className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-[13px] font-bold text-slate-900"
           />
         </div>

         <div className="sm:col-span-1">
           <label className="text-[13px] font-semibold text-slate-600 block mb-1">Kiến tạo</label>
           <input
             type="number"
             min={0}
             max={20}
             value={newScorerAssists}
             onChange={(e) => setNewScorerAssists(Math.max(0, Number(e.target.value)))}
             className="w-full px-2 py-2 rounded-lg border border-slate-300 bg-white text-[13px] font-bold text-slate-900"
           />
         </div>

         <div className="sm:col-span-2">
           <button
             type="button"
             onClick={handleAddScorerRow}
             disabled={!newScorerName.trim()}
             className="w-full py-2 px-3 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold cursor-pointer disabled:opacity-40"
           >
             + Thêm
           </button>
         </div>
       </div>

       {scorerRows.length > 0 && (
         <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
           {scorerRows.map((row, idx) => (
             <span
               key={idx}
               className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 border border-sky-200 text-[13px] font-bold text-slate-800"
             >
               <span>{row.playerName}</span>
               <span className="text-slate-500">({row.teamName})</span>
               <span className="text-[#0369a1]">{row.goals}⚽</span>
               {row.assists > 0 && <span className="text-emerald-700">{row.assists}👟</span>}
               <button
                 type="button"
                 onClick={() => handleRemoveScorerRow(idx)}
                 className="text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
               >
                 <X className="w-3.5 h-3.5" />
               </button>
             </span>
           ))}
         </div>
       )}
     </div>
   </div>
 )}
 </div>
 )}

 
              </>
            )}

            {umpireMsg && (
 <p className="mt-4 p-3 rounded-xl bg-slate-100 text-[14px] font-bold text-slate-700 ">
 {umpireMsg}
 </p>
 )}

 <div className="mt-5 flex flex-wrap items-center gap-2">
 <button
 onClick={() => onOpenBracket?.(String(activeTournament?.id))}
 className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
 >
 <Video className="w-4 h-4 text-red-500" />
 <span>Mở Nhánh &amp; Trang Giải</span>
 </button>
 {activeTournament && activeBracket && (
   <button
     type="button"
     onClick={async () => {
       try {
         setUmpireBusy(true);
         const res = await simulateTournamentResults(Number(activeTournament.id), true);
         await fetchDbTournaments();
         loadTopScorers(activeTournament.id);
         setVarNotice("✅ " + res.message);
       } catch (err: any) {
         setVarNotice("❌ " + (err?.message || "Giả lập vòng đấu thất bại."));
       } finally {
         setUmpireBusy(false);
       }
     }}
     disabled={umpireBusy}
     className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
   >
     <Sparkles className="w-4 h-4 text-amber-600" />
     <span>Giả Lập Nhanh Vòng Hiện Tại</span>
   </button>
 )}
 <span className="px-3 py-2 rounded-xl bg-slate-50 text-[13px] text-slate-600 font-semibold flex items-center">
 Sân: {umpireMatch?.pitchName ?? activeTournament?.pitchName ?? activeTournament?.location ?? "Chưa xếp sân"}
 {umpireMatch?.refereeName ? ` • Trọng tài: ${umpireMatch.refereeName}` : ""}
 </span>
 </div>
 </div>

 {/* 2. NHÁNH ĐẤU THẬT — parse từ bracketJson của giải đang chọn */}
 <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-8 shadow-sm space-y-3 sm:space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
 <div className="min-w-0">
 <span className="text-[14px] font-black text-[#0b4f6c]">
 Nhánh Đấu Hiện Tại
 </span>
 <h3 className="text-xl font-black text-slate-900 tracking-tight truncate">
 {activeTournament ? activeTournament.title : "Chưa chọn giải nào"}
 </h3>
 </div>

 {activeTournament && (
 <span className="px-3 py-1 rounded-full bg-slate-100 text-[14px] font-bold text-slate-600 border border-slate-200 shrink-0">
 Thể thức: {formatLabel(activeTournament.format)}
 </span>
 )}
 </div>

 {!activeBracket ? (
  <div className="p-4 sm:p-8 text-center rounded-2xl border border-dashed border-slate-300 ">
 <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
 <p className="mt-3 text-sm text-slate-500">
 {dbTournaments.length === 0
 ? "Chưa đọc được giải đấu từ máy chủ."
 : "Chưa giải nào bốc thăm. Vào tab “Giải Đấu & BXH › Bảng Đấu & Nhánh Bracket” để bấm Bốc thăm."}
 </p>
  </div>
 ) : (
 <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
 <div className="flex gap-3 sm:gap-6 items-start">
 {activeBracket.rounds.map((r: any, ri: number) => (
 <div key={ri} className="min-w-[240px] flex-1 space-y-3 sm:space-y-4">
 <div
 className={`text-[14px] font-black text-center border-b pb-2 ${
 ri === activeBracket.rounds.length - 1
 ? "text-amber-600 border-amber-300 "
 : "text-slate-500 border-slate-200 "
 }`}
 >
 {r.name} ({r.matches.length})
 </div>

 {r.matches.map((m: any) => {
 if (m.status === "BYE" && m.bye) {
 return (
 <div
 key={m.matchId}
 className="bg-amber-50 p-3 rounded-xl border border-amber-300 text-[14px] flex items-center justify-between"
 >
 <span className="font-bold text-amber-900 truncate">{m.bye.name}</span>
 <span className="text-[14px] font-black text-amber-600 shrink-0">Miễn vòng</span>
 </div>
 );
 }
 const winner = m.winner;
 return (
 <div
 key={m.matchId}
 className={`bg-white p-3 rounded-xl border text-[14px] space-y-1.5 shadow-xs ${
 m.status === "DONE"
 ? "border-sky-300 "
 : "border-slate-200 "
 }`}
 >
 <div className="flex items-center justify-between gap-2">
 <span className="font-mono text-[14px] text-slate-500">{m.matchId}</span>
 {m.matchDate && (
 <span className="font-mono text-[14px] text-[#0369a1] ">
 {m.matchDate.split("-").reverse().join("/")} {m.timeSlot ?? ""}
 </span>
 )}
 </div>
 {[m.teamA, m.teamB].map((t: any, i: number) => (
 <div
 key={i}
 className={`flex items-center justify-between gap-2 ${
 winner === t?.name
 ? "font-black text-sky-800 "
 : winner && winner !== t?.name
 ? "text-slate-500"
 : t?.tbd
 ? "italic text-slate-500"
 : "text-slate-700 font-bold"
 }`}
 >
 <span className="truncate">{t?.tbd ? t?.name : t?.name ?? "?"}</span>
 <span className="font-mono shrink-0">{m.status === "DONE" ? (i === 0 ? m.scoreA : m.scoreB) : t?.record ?? t?.form ?? "-"}</span>
 </div>
 ))}
 {m.status !== "DONE" && m.pitchName && (
 <div className="text-[14px] text-slate-500 truncate">{m.pitchName}</div>
 )}
 </div>
 );
 })}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* 3. DATA TABLES & INCIDENT LOGS */}
 <div id="organizer-console">
 <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-8 shadow-sm space-y-3 sm:space-y-6">
 {/* TABS HEADER */}
 <div className="flex items-center justify-between border-b border-slate-200 pb-4">
 <div className="flex items-center gap-2 flex-wrap">
 {[
  { id: "teams", label: "Duyệt Đội & Đăng Ký", badge: pendingTeams.length > 0 ? pendingTeams.length : null },
  { id: "invites", label: "Mời Giải Qua Email", badge: joinMode === "INVITE_ONLY" ? inviteEmails.length : null },
  { id: "referees", label: "Tổ Trọng Tài", badge: referees.length > 0 ? referees.length : null },
  { id: "broadcast", label: "Thông Báo BTC", badge: null },
  { id: "schedule", label: "Lịch Thi Đấu", badge: null },
  { id: "var_logs", label: "Kết Quả & Ghi Bàn", badge: null },
  { id: "finance", label: "Tài Chính Giải", badge: null }
].map(tab => (
 <button
 key={tab.id}
 onClick={() => setBottomTab(tab.id as any)}
 className={`px-3.5 py-2 rounded-xl text-[13px] font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
 bottomTab === tab.id
 ? "bg-[#0369a1] text-white shadow-xs"
 : "text-slate-600 hover:bg-slate-100 "
 }`}
 >
 <span>{tab.label}</span>
 {tab.badge !== null && tab.badge !== undefined && (
   <span className={`px-1.5 py-0.5 rounded-full text-[13px] font-bold ${
     bottomTab === tab.id ? "bg-white text-[#0369a1]" : "bg-sky-100 text-[#0369a1]"
   }`}>
     {tab.badge}
   </span>
 )}
 </button>
 ))}
 </div>

 <button
 onClick={fetchDbTournaments}
 disabled={loadingDb}
 className="text-[14px] font-bold text-[#0369a1] hover:underline flex items-center space-x-1 shrink-0 disabled:opacity-50"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? "animate-spin" : ""}`} />
 <span>{loadingDb ? "Đang tải…" : "Tải lại "}</span>
 </button>
 </div>

 <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
  <p className="text-[14px] text-slate-500">
  {activeTournament
  ? `Đang thao tác trên giải: ${activeTournament.title}`
  : "Chưa chọn giải — hãy mở tab “Giải Đấu & BXH” và chọn một giải."}
  </p>
  <div className="flex flex-wrap items-center gap-2">
  {activeTournament?.joinMode === "INVITE_ONLY" && (
                    <button
                      type="button"
                      onClick={() => {
                        setInviteModalTourney(activeTournament);
                        setShowInviteModal(true);
                      }}
                      disabled={!activeTournament}
                      className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[13px] font-extrabold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                      title="Giải có ràng buộc mời qua email — Gửi thư mời tham gia"
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-700" />
                      <span>Mời Email</span>
                    </button>
                  )}
  <button
    type="button"
    onClick={handleExportTournamentCsv}
    disabled={!activeTournament}
    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[13px] font-bold transition-all active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
  >
    <Download className="w-3.5 h-3.5 text-[#0369a1]" />
    <span>Xuất Báo Cáo (.CSV)</span>
  </button>
                  <button
  type="button"
  onClick={() => openEditModal(activeTournament)}
  disabled={!activeTournament}
  className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-extrabold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
  >
  <Pencil className="w-3.5 h-3.5" />
  <span>Sửa Giải</span>
  </button>
  </div>
 </div>

 {/* Chưa chọn giải có nhánh đấu */}
 {!activeBracket && (
 <p className="text-sm text-slate-500 py-4 sm:py-6 text-center">
 {dbTournaments.length === 0
 ? "Chưa đọc được danh sách giải ."
 : "Chưa giải nào  đã bốc thăm. Mở tab “Giải Đấu & BXH › Bảng Đấu & Nhánh Bracket” để bốc thăm và nhập kết quả."}
 </p>
 )}

 {/* Bảng Xếp Hạng & Vua Phá Lưới công khai đã chuyển sang trang Giải Đấu & BXH (tournaments) để tránh lặp chức năng */}
          {/* ================= TAB 1: DUYỆT ĐỘI & ĐĂNG KÝ ================= */}
  {bottomTab === "teams" && activeTournament && (
  <div className="space-y-5">
    {/* Header & Quick stats */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3.5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-md bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center font-bold">
          <Users2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-[14px] font-bold text-slate-900">
            Quản Lý & Duyệt Đội Tham Gia ({confirmedCount(activeTournament)}/{activeTournament.totalTeams ?? "—"} đội)
          </h4>
          <p className="text-[13px] text-slate-500">
            Duyệt hồ sơ đội đăng ký, kiểm tra nộp lệ phí và quản lý danh sách đội thi đấu
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAddTeamForm((v) => !v)}
          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showAddTeamForm ? "Đóng Form Thêm" : "+ Thêm Đội Thủ Công"}</span>
        </button>
      </div>
    </div>

    {/* Form Thêm Đội Thủ Công (Inline) */}
    {showAddTeamForm && (
      <div className="p-4 rounded-lg border border-emerald-300 bg-emerald-50/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-emerald-900 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-emerald-700" />
            Nhập tay đội bóng vào giải (Đội tự động được đánh dấu đã hoàn thành lệ phí)
          </span>
          <button
            type="button"
            onClick={() => setShowAddTeamForm(false)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {manualTeamErrors.quota && (
          <div className="p-2.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-[13px] font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{manualTeamErrors.quota}</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <input
              type="text"
              value={addTeamForm.teamName}
              onChange={(e) => setAddTeamForm({ ...addTeamForm, teamName: e.target.value })}
              placeholder="Tên Đội Bóng (FC) *"
              className={`w-full px-3 py-2 rounded-lg border bg-white text-[13px] text-slate-900 font-bold focus:outline-none focus:ring-2 ${
                manualTeamErrors.teamName && addTeamForm.teamName ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-emerald-500'
              }`}
            />
            {manualTeamErrors.teamName && addTeamForm.teamName && (
              <p className="mt-1 text-[13px] font-semibold text-rose-600 leading-tight">
                {manualTeamErrors.teamName}
              </p>
            )}
          </div>
          <div>
            <input
              type="text"
              value={addTeamForm.captainName}
              onChange={(e) => setAddTeamForm({ ...addTeamForm, captainName: e.target.value })}
              placeholder="Họ tên người liên hệ / đội trưởng"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <input
              type="tel"
              value={addTeamForm.captainPhone}
              onChange={(e) => setAddTeamForm({ ...addTeamForm, captainPhone: e.target.value })}
              placeholder="Số ĐT / Zalo (10 số)"
              className={`w-full px-3 py-2 rounded-lg border bg-white text-[13px] text-slate-900 focus:outline-none focus:ring-2 ${
                manualTeamErrors.captainPhone && addTeamForm.captainPhone ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-emerald-500'
              }`}
            />
            {manualTeamErrors.captainPhone && addTeamForm.captainPhone && (
              <p className="mt-1 text-[13px] font-semibold text-rose-600 leading-tight">
                {manualTeamErrors.captainPhone}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={25}
                value={addTeamForm.memberCount}
                onChange={(e) => setAddTeamForm({ ...addTeamForm, memberCount: Number(e.target.value) })}
                placeholder="Quân số (5-25)"
                className={`w-24 px-3 py-2 rounded-lg border bg-white text-[13px] text-slate-900 focus:outline-none focus:ring-2 ${
                  manualTeamErrors.memberCount ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-emerald-500'
                }`}
              />
              <button
                type="button"
                onClick={handleAddManualTeam}
                disabled={addingTeam || !isManualTeamValid}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer"
              >
                {addingTeam ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Lưu Đội</span>
              </button>
            </div>
            {manualTeamErrors.memberCount && (
              <p className="mt-1 text-[13px] font-semibold text-rose-600 leading-tight">
                {manualTeamErrors.memberCount}
              </p>
            )}
          </div>
        </div>
      </div>
    )}

    {/* PHÂN MỤC 1: ĐỘI ĐĂNG KÝ MỚI CHỜ DUYỆT HỒ SƠ */}
    <div className="space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <h5 className="text-[14px] font-bold text-slate-900">
            1. Đội Đăng Ký Chờ Duyệt Hồ Sơ
          </h5>
          <span className={`px-2 py-0.5 rounded-full text-[12px] font-bold ${
            pendingTeams.length > 0 ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {pendingTeams.length} đội
          </span>
        </div>
        <button
          type="button"
          onClick={() => loadPendingTeams(Number(activeTournament.id))}
          disabled={pendingLoading}
          className="text-[13px] text-sky-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${pendingLoading ? "animate-spin" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {pendingLoading ? (
        <div className="p-4 text-center text-[13px] text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
          Đang nạp danh sách đội chờ duyệt…
        </div>
      ) : pendingTeams.length === 0 ? (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-[13px] text-slate-500">
          Không có đội nào đang chờ duyệt hồ sơ. Các đội mới nộp đơn sẽ xuất hiện tại đây.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingTeams.map((pt) => (
            <div
              key={pt.teamName}
              className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/50 flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h6 className="text-[14px] font-bold text-slate-900 truncate">{pt.teamName}</h6>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 text-[12px] font-bold shrink-0">
                    Chờ duyệt đơn
                  </span>
                </div>
                <p className="text-[13px] text-slate-600">
                  Đại diện: <strong>{pt.captainName}</strong> • {pt.memberCount || 12} cầu thủ
                </p>
                <div className="flex flex-wrap items-center gap-x-3 text-[13px] text-slate-500">
                  {pt.captainPhone && (
                    <a href={`tel:${pt.captainPhone}`} className="text-sky-700 hover:underline flex items-center gap-1">
                      <span>📞 {pt.captainPhone}</span>
                    </a>
                  )}
                  {pt.captainEmail && <span>✉️ {pt.captainEmail}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                <button
                  type="button"
                  onClick={() => handleApprove(Number(activeTournament.id), pt.teamName)}
                  disabled={pendingBusy}
                  className="flex-1 py-1.5 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Duyệt Vào Giải</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(Number(activeTournament.id), pt.teamName)}
                  disabled={pendingBusy}
                  className="py-1.5 px-3 rounded-md border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-[13px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Từ Chối</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* PHÂN MỤC 2: ĐỘI CHỜ XÁC NHẬN LỆ PHÍ */}
    <div className="space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-sky-700" />
          <h5 className="text-[14px] font-bold text-slate-900">
            2. Đội Chờ Xác Nhận Thu Lệ Phí
          </h5>
          <span className="px-2 py-0.5 rounded-full text-[12px] font-bold bg-sky-100 text-sky-800">
            {(activeTournament.teams ?? []).filter((z: any) => z.registrationStatus === "PENDING_PAYMENT").length} đội
          </span>
        </div>
        <span className="text-[13px] text-slate-500 font-semibold">
          Lệ phí: {formatMoney(activeTournament.entryFee ?? 0)}/đội
        </span>
      </div>

      {(activeTournament.teams ?? []).filter((z: any) => z.registrationStatus === "PENDING_PAYMENT").length === 0 ? (
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-center text-[13px] text-slate-500">
          Không có đội nào đang chờ xác nhận lệ phí.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(activeTournament.teams ?? [])
            .filter((z: any) => z.registrationStatus === "PENDING_PAYMENT")
            .map((tm: any) => (
              <div
                key={tm.teamName}
                className="p-3.5 rounded-lg border border-sky-300 bg-sky-50/50 flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h6 className="text-[14px] font-bold text-slate-900 truncate">{tm.teamName}</h6>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 text-[12px] font-bold shrink-0">
                      Chờ đóng phí
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-600">
                    Đại diện: <strong>{tm.captainName || "—"}</strong> • {tm.memberCount || 12} cầu thủ
                  </p>
                  <p className="text-[13px] text-slate-500">
                    SĐT: {tm.captainPhone ? <a href={`tel:${tm.captainPhone}`} className="text-sky-700 hover:underline">{tm.captainPhone}</a> : "—"}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-sky-200">
                  <button
                    type="button"
                    onClick={() => handleConfirmTeamFee(activeTournament.id, tm.teamName)}
                    disabled={confirmingTeamFee === tm.teamName}
                    className="flex-1 py-1.5 px-3 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {confirmingTeamFee === tm.teamName ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Xác Nhận Đã Thu Phí</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(activeTournament.id, tm.teamName)}
                    disabled={pendingBusy}
                    className="py-1.5 px-3 rounded-md border border-slate-300 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-[13px] font-bold transition-colors cursor-pointer"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>

    {/* PHÂN MỤC 3: DANH SÁCH ĐỘI ĐÃ VÀO GIẢI CHÍNH THỨC */}
    <div className="space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <h5 className="text-[14px] font-bold text-slate-900">
            3. Danh Sách Đội Đã Vào Giải Chính Thức (Sẵn Sàng Bốc Thăm)
          </h5>
          <span className="px-2 py-0.5 rounded-full text-[12px] font-bold bg-emerald-100 text-emerald-800">
            {(activeTournament.teams ?? []).filter((z: any) => z.registrationStatus !== "PENDING_PAYMENT").length} đội
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const cap = activeTournament.totalTeams || 8;
            const confirmedTeams = (activeTournament.teams ?? []).filter((z: any) => z.registrationStatus !== "PENDING_PAYMENT");
            const manualCount = confirmedTeams.filter((z: any) => !z.simulated).length;
            const simCount = confirmedTeams.filter((z: any) => !!z.simulated).length;
            const remaining = Math.max(0, cap - confirmedTeams.length);

            return (
              <>
                {remaining > 0 ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await fillSimulatedTeams(Number(activeTournament.id), remaining);
                      await fetchDbTournaments();
                      setVarNotice(`✅ Đã bổ sung ${remaining} đội ngẫu nhiên cho đủ ${cap} đội theo yêu cầu. Giữ nguyên ${manualCount} đội thủ công của bạn!`);
                    }}
                    className="text-[13px] font-bold px-3 py-1.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    title={`Thêm đúng ${remaining} đội ngẫu nhiên cho đủ ${cap} đội quy mô giải. Giữ nguyên 100% các đội thủ công đã nhập.`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Điền Ngẫu Nhiên (${remaining} đội còn lại)</span>
                  </button>
                ) : (
                  <span className="text-[13px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã đủ ${cap} đội</span>
                  </span>
                )}

                {simCount > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await clearSimulatedTeams(Number(activeTournament.id));
                      await fetchDbTournaments();
                      setVarNotice(`✅ Đã dọn dẹp các đội ngẫu nhiên, giữ lại ${manualCount} đội thủ công.`);
                    }}
                    className="text-[13px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                    title="Xoá các đội ngẫu nhiên giả lập, giữ nguyên các đội thủ công bạn đã tạo"
                  >
                    Dọn Đội Ngẫu Nhiên
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {(activeTournament.teams ?? []).filter((z: any) => z.registrationStatus !== "PENDING_PAYMENT").length === 0 ? (
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-[13px] text-slate-500">
          Chưa có đội nào được xác nhận chính thức. Hãy duyệt các đội đăng ký ở mục 1 hoặc thêm đội thủ công ở trên.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(activeTournament.teams ?? [])
            .filter((z: any) => z.registrationStatus !== "PENDING_PAYMENT")
            .map((tm: any, idx: number) => {
              const isEditingThisTeam = editingRosterTeam === tm.teamName;
              return (
                <div
                  key={tm.teamName}
                  className="p-3.5 rounded-lg border border-slate-300 bg-white flex flex-col gap-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[13px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-slate-900 truncate">{tm.teamName}</p>
                        <p className="text-[13px] text-slate-500 truncate">
                          {tm.captainName ? `${tm.captainName} · ` : ""}{tm.memberCount || 12} cầu thủ
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenRosterEdit(tm)}
                        className="px-2.5 py-1 rounded text-[13px] font-bold bg-sky-50 hover:bg-sky-100 text-[#0369a1] border border-sky-200 cursor-pointer transition-colors"
                      >
                        {isEditingThisTeam ? "Đóng" : "Cầu thủ"}
                      </button>
                      {tm.simulated ? (
                        <span className="px-2 py-0.5 rounded text-[13px] font-bold bg-slate-100 text-slate-600">
                          Ngẫu nhiên
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[13px] font-bold bg-emerald-100 text-emerald-800">
                          Thủ công
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleReject(activeTournament.id, tm.teamName)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xoá đội khỏi giải"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Form Inline sửa danh sách cầu thủ của đội */}
                  {isEditingThisTeam && (
                    <div className="pt-2.5 border-t border-slate-200 space-y-2.5 bg-slate-50 p-3 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[13px] font-bold text-slate-700 block mb-1">Đội trưởng</label>
                          <input
                            type="text"
                            value={rosterCaptainName}
                            onChange={(e) => setRosterCaptainName(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-[13px] text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[13px] font-bold text-slate-700 block mb-1">SĐT liên hệ</label>
                          <input
                            type="text"
                            value={rosterCaptainPhone}
                            onChange={(e) => setRosterCaptainPhone(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-[13px] text-slate-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[13px] font-bold text-slate-700 block mb-1">
                          Danh sách cầu thủ (phân tách bằng dấu phẩy):
                        </label>
                        <textarea
                          rows={2}
                          value={rosterMemberNames}
                          onChange={(e) => setRosterMemberNames(e.target.value)}
                          placeholder="VD: Nguyễn Văn A, Trần Văn B, Lê Hoàng C..."
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-[13px] text-slate-900"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingRosterTeam(null)}
                          className="px-3 py-1 rounded border border-slate-300 bg-white text-slate-700 text-[13px] font-bold cursor-pointer"
                        >
                          Huỷ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveRoster(tm.teamName)}
                          disabled={savingRoster}
                          className="px-3 py-1 rounded bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold cursor-pointer disabled:opacity-50"
                        >
                          {savingRoster ? "Đang lưu..." : "Lưu Danh Sách"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  </div>
)}

{/* ================= TAB 2: MỜI GIẢI QUA EMAIL ================= */}
{bottomTab === "invites" && activeTournament && (
  <div className="space-y-5">
    {/* Header Tab */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3.5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-[14px] font-bold text-slate-900">
            Quyền Tham Gia & Mời Đội Qua Email ({activeTournament.title})
          </h4>
          <p className="text-[13px] text-slate-500">
            Cấu hình mở công khai hoặc giới hạn giải kín, gửi thư mời và cấp quyền nộp đơn cho các đội
          </p>
        </div>
      </div>
    </div>

    {/* Khối 1: Chọn Chế Độ Tham Gia */}
    <div className="space-y-2.5">
      <label className="text-[13px] font-bold text-slate-700 block">
        Chọn Thể Thức Tham Gia Giải Đấu:
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSaveAccess("PUBLIC")}
          disabled={accessBusy || joinMode === "PUBLIC"}
          className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
            joinMode === "PUBLIC"
              ? "border-emerald-500 bg-emerald-50/70 shadow-xs"
              : "border-slate-300 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Unlock className={`w-4 h-4 ${joinMode === "PUBLIC" ? "text-emerald-700" : "text-slate-400"}`} />
            <span className="text-[14px] font-bold text-slate-900">Công Khai (Mở Tự Do)</span>
          </div>
          <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
            Mọi cầu thủ và đội bóng trên nền tảng đều có thể xem thông tin và nộp đơn đăng ký tham gia giải.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleSaveAccess("INVITE_ONLY")}
          disabled={accessBusy || joinMode === "INVITE_ONLY"}
          className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
            joinMode === "INVITE_ONLY"
              ? "border-amber-500 bg-amber-50/70 shadow-xs"
              : "border-slate-300 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Lock className={`w-4 h-4 ${joinMode === "INVITE_ONLY" ? "text-amber-800" : "text-slate-400"}`} />
            <span className="text-[14px] font-bold text-slate-900">Giải Kín (Chỉ Mời Qua Email)</span>
          </div>
          <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
            Chỉ những email được Ban Tổ Chức thêm vào danh sách bên dưới mới có quyền nộp đơn đăng ký.
          </p>
        </button>
      </div>
    </div>

    {/* Khối 2: Tiện ích Sao Chép Link Đăng Ký Trực Tiếp */}
    <div className="p-3.5 rounded-lg border border-slate-300 bg-white space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
          <ExternalLink className="w-4 h-4 text-[#0369a1]" />
          Đường Dẫn Đăng Ký Trực Tiếp Cho Đội Bóng:
        </span>
        <span className="text-[12px] text-slate-500">Gửi qua Zalo/Facebook cho đội trưởng</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={`${typeof window !== "undefined" ? window.location.origin : ""}/tournaments/register?tournamentId=${activeTournament.id}`}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 font-mono text-[13px] text-slate-700 outline-none"
        />
        <button
          type="button"
          onClick={handleCopyInviteLink}
          className="px-4 py-2 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
        >
          {copiedInviteLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copiedInviteLink ? "Đã Sao Chép!" : "Sao Chép Link"}</span>
        </button>
      </div>
    </div>

    {/* Khối 3: Gửi Thư Mời Email & Quản Lý Danh Sách Mời */}
    <div className="space-y-3">
      <div className="border border-slate-300 bg-white rounded-lg p-4 space-y-3">
        <h5 className="text-[14px] font-bold text-slate-900 flex items-center gap-1.5">
          <Send className="w-4 h-4 text-amber-700" />
          Gửi Thư Mời Mới Qua Email
        </h5>
        <div className="space-y-2">
          <div>
            <label className="text-[13px] font-bold text-slate-700 block mb-1">
              Địa chỉ email đội bóng / đội trưởng:
            </label>
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="Nhập email (ví dụ: fc1@gmail.com, captain2@gmail.com... phân tách bằng dấu phẩy)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 font-mono text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
            />
            <span className="text-[12px] text-slate-500 mt-0.5 block">
              * Có thể nhập nhiều email cùng lúc, phân tách bằng dấu phẩy (,) hoặc khoảng trắng.
            </span>
          </div>

          <div>
            <label className="text-[13px] font-bold text-slate-700 block mb-1">
              Lời nhắn gửi kèm trong thư mời:
            </label>
            <textarea
              rows={2}
              value={inviteCustomNote}
              onChange={(e) => setInviteCustomNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
            />
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={handleAddInvite}
              disabled={accessBusy || !inviteInput.trim()}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[13px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
            >
              {accessBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Gửi Thư Mời Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách email đã được cấp quyền mời */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-[14px] font-bold text-slate-900 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-sky-700" />
            Danh Sách Email Đã Được Cấp Quyền Tham Gia ({inviteEmails.length})
          </span>
          {joinMode === "INVITE_ONLY" && (
            <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Đang áp dụng giải kín
            </span>
          )}
        </div>

        {inviteEmails.length === 0 ? (
          <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-[13px] leading-relaxed">
            Chưa có email nào trong danh sách mời. Khi giải ở chế độ <strong>“Chỉ mời qua email”</strong>, đội bóng cần đăng nhập đúng một email trong danh sách này để được nộp đơn.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {inviteEmails.map((em) => (
              <div
                key={em}
                className="p-2.5 rounded-lg border border-slate-300 bg-white flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[13px] font-bold text-slate-900 truncate" title={em}>
                    {em}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveInvite(em)}
                  disabled={accessBusy}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                  title={`Gỡ lời mời ${em}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}


{/* TAB CONTENT: TỔ TRỌNG TÀI */}
 {bottomTab === "referees" && (
 <div className="space-y-4">
 {!activeTournament ? (
 <p className="text-sm text-slate-500 py-4 text-center">Vui lòng chọn một giải đấu để quản lý tổ trọng tài.</p>
 ) : (
 <>
 <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
 <div className="flex items-center justify-between">
 <h4 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-[#0369a1]" />
 Thêm Trọng Tài / Giám Sát Mới
 </h4>
 <span className="text-[13px] font-bold text-slate-500">
 Hiện có: {referees.length} người
 </span>
 </div>
 <form
 onSubmit={(e) => {
 e.preventDefault();
 handleAddReferee(Number(activeTournament.id));
 }}
 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5"
 >
 <input
 type="text"
 required
 value={refName}
 onChange={(e) => setRefName(e.target.value)}
 placeholder="Họ tên trọng tài *"
 className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-[13px] font-bold text-slate-900 focus:outline-none focus:border-[#0369a1]"
 />
 <input
 type="text"
 value={refPhone}
 onChange={(e) => setRefPhone(e.target.value)}
 placeholder="Số điện thoại"
 className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-[13px] font-mono text-slate-900 focus:outline-none focus:border-[#0369a1]"
 />
 <input
 type="email"
 value={refEmail}
 onChange={(e) => setRefEmail(e.target.value)}
 placeholder="Email liên hệ"
 className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-[13px] text-slate-900 focus:outline-none focus:border-[#0369a1]"
 />
 <select
 value={refNotes}
 onChange={(e) => setRefNotes(e.target.value)}
 className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-[13px] font-bold text-slate-800 focus:outline-none focus:border-[#0369a1] cursor-pointer"
 >
 <option value="Trọng tài chính">Trọng tài chính</option>
 <option value="Trọng tài biên">Trọng tài biên</option>
 <option value="Trọng tài bàn / Giám sát">Trọng tài bàn / Giám sát</option>
 <option value="Tổ Y tế / Hậu cần">Tổ Y tế / Hậu cần</option>
 </select>
 <button
 type="submit"
 disabled={refBusy || !refName.trim()}
 className="px-4 py-2 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
 >
 <UserPlus className="w-4 h-4" />
 <span>{refBusy ? "Đang thêm..." : "Thêm Trọng Tài"}</span>
 </button>
 </form>
 </div>

 {refLoading ? (
 <p className="text-[13px] text-slate-500 py-4 text-center">Đang tải danh sách trọng tài...</p>
 ) : referees.length === 0 ? (
 <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-[13px] text-slate-500">
 Chưa có trọng tài nào trong giải này. Hãy thêm trọng tài ở khung trên để phân công bắt chính các trận đấu.
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
 {referees.map((ref) => (
 <div
 key={ref.id}
 className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3"
 >
 <div className="min-w-0 space-y-0.5">
 <div className="flex items-center gap-2 flex-wrap">
 <p className="text-[14px] font-bold text-slate-900">{ref.name}</p>
 {ref.notes && (
 <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[13px] font-bold">
 {ref.notes}
 </span>
 )}
 </div>
 <p className="text-[13px] text-slate-500 font-mono">
 {ref.phone || "Chưa có SĐT"} {ref.email ? `· ${ref.email}` : ""}
 </p>
 </div>
 <button
 type="button"
 onClick={() => handleRemoveReferee(Number(activeTournament.id), ref.id)}
 disabled={refBusy}
 className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-[13px] font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
 >
 <X className="w-3.5 h-3.5" />
 <span>Xoá</span>
 </button>
 </div>
 ))}
 </div>
 )}
 </>
 )}
 </div>
 )}

 {/* TAB CONTENT: THÔNG BÁO BAN TỔ CHỨC (BROADCAST) */}
 {bottomTab === "broadcast" && (
 <div className="space-y-4">
 {!activeTournament ? (
 <p className="text-sm text-slate-500 py-4 text-center">Vui lòng chọn một giải đấu để gửi thông báo.</p>
 ) : (
 <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
 <div>
 <h4 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
 <Megaphone className="w-4 h-4 text-[#0369a1]" />
 Phát Thông Báo Toàn Giải: {activeTournament.title}
 </h4>
 <p className="text-[13px] text-slate-500 mt-0.5">
 Gửi thông báo trực tiếp lên chuông ứng dụng và Email cho tất cả đội trưởng & cầu thủ tham gia giải.
 </p>
 </div>

 <div className="space-y-1.5">
 <span className="text-[13px] font-bold text-slate-600 block">Chọn mẫu thông báo nhanh:</span>
 <div className="flex flex-wrap gap-2">
 {[
 {
 label: "Mời họp kỹ thuật & Bốc thăm",
 title: `[BTC ${activeTournament.title}] Thông báo họp kỹ thuật & bốc thăm chia nhánh`,
 content: `Ban Tổ Chức trân trọng kính mời Đội trưởng các đội bóng tham dự buổi họp kỹ thuật và bốc thăm chia nhánh giải ${activeTournament.title} tại ${activeTournament.pitchName || "sân thi đấu"}. Vui lòng có mặt đúng giờ để xác nhận danh sách cầu thủ.`,
 },
 {
 label: "Đã công bố Lịch thi đấu",
 title: `[BTC ${activeTournament.title}] Chính thức công bố Lịch thi đấu & Tổ trọng tài`,
 content: `Lịch thi đấu chính thức của giải ${activeTournament.title} đã được cập nhật trên hệ thống. Đề nghị các đội bóng kiểm tra giờ bóng lăn, cụm sân và có mặt trước trận đấu tối thiểu 15 phút để làm thủ tục.`,
 },
 {
 label: "Tạm hoãn / Đổi giờ do thời tiết",
 title: `[KHẨN - ${activeTournament.title}] Thông báo điều chỉnh giờ thi đấu do thời tiết`,
 content: `Do điều kiện thời tiết không thuận lợi, Ban Tổ Chức xin thông báo tạm hoãn và điều chỉnh khung giờ các lượt trận hôm nay tại ${activeTournament.pitchName || "cụm sân"}. Lịch đá bù đã được cập nhật trực tiếp trên bảng nhánh đấu.`,
 },
 ].map((tpl) => (
 <button
 key={tpl.label}
 type="button"
 onClick={() => {
 setBroadcastTitle(tpl.title);
 setBroadcastContent(tpl.content);
 }}
 className="px-3 py-1.5 rounded-lg bg-white hover:bg-sky-50 border border-slate-300 hover:border-sky-300 text-slate-700 hover:text-sky-800 text-[13px] font-bold transition-colors cursor-pointer"
 >
 + {tpl.label}
 </button>
 ))}
 </div>
 </div>

 <form
 onSubmit={(e) => {
 e.preventDefault();
 handleSendBroadcast();
 }}
 className="space-y-3"
 >
 <div className="space-y-1">
 <label className="text-[13px] font-bold text-slate-700 block">Tiêu đề thông báo *</label>
 <input
 type="text"
 required
 value={broadcastTitle}
 onChange={(e) => setBroadcastTitle(e.target.value)}
 placeholder="VD: Thông báo lịch họp kỹ thuật & công bố nhánh đấu..."
 className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-[14px] font-bold text-slate-900 focus:outline-none focus:border-[#0369a1]"
 />
 </div>

 <div className="space-y-1">
 <label className="text-[13px] font-bold text-slate-700 block">Nội dung chi tiết *</label>
 <textarea
 rows={4}
 required
 value={broadcastContent}
 onChange={(e) => setBroadcastContent(e.target.value)}
 placeholder="Nhập nội dung thông báo gửi tới các đội trưởng và cầu thủ..."
 className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-[14px] text-slate-900 focus:outline-none focus:border-[#0369a1]"
 />
 </div>

 <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
 <label className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-700 cursor-pointer">
 <input
 type="checkbox"
 checked={broadcastSendEmail}
 onChange={(e) => setBroadcastSendEmail(e.target.checked)}
 className="w-4 h-4 rounded accent-[#0369a1]"
 />
 <span>Đồng thời gửi Email cho các cầu thủ đã được mời tham gia giải</span>
 </label>

 <button
 type="submit"
 disabled={broadcastBusy || !broadcastTitle.trim() || !broadcastContent.trim()}
 className="px-5 py-2.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
 >
 <Megaphone className="w-4 h-4" />
 <span>{broadcastBusy ? "Đang phát thông báo..." : "Phát Thông Báo Ngay"}</span>
 </button>
 </div>
 </form>
 </div>
 )}
 </div>
 )}

{/* TAB CONTENT: KẾT QUẢ & VUA PHÁ LƯỚI (đọc từ goal_events) */}
 {bottomTab === "var_logs" && (
 <div className="space-y-3 sm:space-y-4">
 <div>
 <p className="text-[14px] font-black text-slate-500 mb-2">
 Kết quả đã ghi nhận ({doneMatches.length})
 </p>
 {doneMatches.length === 0 ? (
 <p className="text-[14px] text-slate-500">Chưa có trận nào kết thúc.</p>
 ) : (
 <div className="space-y-2">
 {doneMatches.map((m: any) => (
 <div
 key={m.matchId}
 className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[14px]"
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <span className="font-mono text-slate-500 shrink-0">{m.matchId}</span>
 <span className="font-bold text-slate-800 truncate">
 {m.teamA} <span className="font-mono text-sky-700 px-1.5 py-0.5 rounded bg-sky-100">{m.scoreA} - {m.scoreB}</span> {m.teamB}
 </span>
 {m.mvpPlayer && (
 <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[13px] font-bold">
 MVP: {m.mvpPlayer}
 </span>
 )}
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className="font-mono text-slate-500 text-[13px]">
 {m.matchDate ? m.matchDate.split("-").reverse().join("/") : "—"}
 </span>
 <button
 type="button"
 onClick={() => handleUndoMatch(m.matchId)}
 disabled={umpireBusy}
 className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-[13px] font-bold transition-colors cursor-pointer flex items-center gap-1"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 <span>Huỷ KQ</span>
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 <div>
 <p className="text-[14px] font-black text-slate-500 mb-2">
 Vua phá lưới giải ({topScorers.length})
 </p>
 {topScorers.length === 0 ? (
 <p className="text-[14px] text-slate-500">
 Chưa có dữ liệu cầu thủ ghi bàn. Khi nhập kết quả ở nhánh đấu, danh sách ghi bàn sẽ hiển thị tại đây.
 </p>
 ) : (
 <div className="space-y-2">
 {topScorers.map((s: any, idx: number) => (
 <div
 key={`${s.playerName}-${s.teamName}`}
 className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-[14px]"
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <span className="w-6 h-6 rounded-full bg-[#0369a1] text-white font-black text-[14px] flex items-center justify-center shrink-0">
 {idx + 1}
 </span>
 <div className="min-w-0">
 <p className="font-bold text-slate-900 truncate">{s.playerName}</p>
 <p className="text-[14px] text-slate-500 truncate">{s.teamName}</p>
 </div>
 </div>
 <div className="flex items-center gap-2 font-mono shrink-0">
 <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
 {s.goals}⚽
 </span>
 {s.assists > 0 && (
 <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-700 font-bold">
 {s.assists}👟
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}

 {/* ================= TAB 6: SỬA THÔNG TIN GIẢI ĐẤU (INLINE) ================= */}
{bottomTab === "edit" && activeTournament && (
  <div className="space-y-4 animate-fade-in">
    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center font-bold">
          <Pencil className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-[14px] font-bold text-slate-900">
            Sửa Thông Tin Giải: {activeTournament.title}
          </h4>
          <p className="text-[13px] text-slate-500">
            Cập nhật tên giải, môn, thể thức, số đội, lệ phí và thông tin sân thi đấu
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setBottomTab("teams")}
        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-bold transition-colors cursor-pointer"
      >
        Đóng / Về Duyệt Đội
      </button>
    </div>

    <form onSubmit={handleSaveEdit} className="px-5 sm:px-6 py-4 space-y-3.5">
 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 text-sm">Tên giải <span className="text-rose-500">*</span></label>
 <input
 type="text"
 value={editForm.title}
 onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
 required
 placeholder="VD: Giải Giao Hữu Mùa Xu"
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 text-sm">Môn thi đấu</label>
 <select
 value={editForm.sportType}
 onChange={(e) => setEditForm((f) => ({ ...f, sportType: e.target.value }))}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm cursor-pointer"
 >
 <option value="SAN_7">Bóng Đá Sân 7</option>
 <option value="SAN_5">Bóng Đá Sân 5</option>
 <option value="SAN_11">Bóng Đá Sân 11</option>
 <option value="FUTSAL">Futsal Trong Nhà</option>
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 text-sm">Thể thức giải</label>
 <select
 value={editForm.format}
 onChange={(e) => setEditForm((f) => ({ ...f, format: e.target.value }))}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm cursor-pointer"
 >
 <option value="KNOCKOUT">Loại trực tiếp</option>
 <option value="ROUND_ROBIN">Đấu vòng tròn</option>
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 text-sm">Số đội tối đa</label>
 <input
 type="number"
 min={2}
 max={128}
 value={editForm.totalTeams}
 onChange={(e) => setEditForm((f) => ({ ...f, totalTeams: Number(e.target.value) }))}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 text-sm">Đã đăng ký</label>
 <div className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-mono font-bold text-slate-600">
 {activeTournament?.teams?.length ?? 0} đội
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 text-sm">Tiền thưởng (VNĐ)</label>
 <input
 type="number"
 min={0}
 step={100000}
 value={editForm.prizePool}
 onChange={(e) => setEditForm((f) => ({ ...f, prizePool: Number(e.target.value) }))}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 text-sm">Lệ phí mỗi đội (VNĐ)</label>
 <input
 type="number"
 min={0}
 step={100000}
 value={editForm.entryFee}
 onChange={(e) => setEditForm((f) => ({ ...f, entryFee: Number(e.target.value) }))}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 text-sm">Ngày mở giải</label>
 <input
 type="date"
 value={editForm.startDate ?? ""}
 onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 text-sm">Ngày kết thúc</label>
 <input
 type="date"
 value={editForm.endDate ?? ""}
 onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 text-sm">Hạn đăng ký</label>
 <input
 type="date"
 value={editForm.registrationDeadline ?? ""}
 onChange={(e) => setEditForm((f) => ({ ...f, registrationDeadline: e.target.value }))}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>

 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <label className="font-extrabold text-slate-800 text-sm">Sân thi đấu</label>
 {isOwner && (
 <span className="text-[14px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
 Sân của bạn ({pitches.length})
 </span>
 )}
 </div>
 {pitches.length > 0 ? (
 <select
 value={editForm.pitchName}
 onChange={(e) => {
 const val = e.target.value;
 const selectedPitch = pitches.find((p) => p.name === val);
 setEditForm((f) => ({
 ...f,
 pitchName: val,
 location: selectedPitch ? (selectedPitch.area || selectedPitch.address || f.location) : f.location,
 }));
 }}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 >
 <option value="">-- Chọn cụm sân thi đấu --</option>
 {pitches.map((p) => (
 <option key={p.id} value={p.name}>
 {p.name} {p.area ? `(${p.area})` : p.address ? `(${p.address})` : ""}
 </option>
 ))}
 </select>
 ) : (
 <input
 type="text"
 value={editForm.pitchName}
 onChange={(e) => setEditForm((f) => ({ ...f, pitchName: e.target.value }))}
 placeholder={loadingPitches ? "Đang tải danh sách sân..." : "VD: Cụm Sân Turfzone Đà Nẵng"}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 )}
 {isOwner && pitches.length === 0 && !loadingPitches && (
 <p className="text-[14px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
 Bạn chưa đăng ký cụm sân nào. Vui lòng tạo sân tại Quản Lý Sân!
 </p>
 )}
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 text-sm">Địa điểm</label>
 <input
 type="text"
 value={editForm.location}
 onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
 placeholder="VD: Đà Nẵng"
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 text-sm">Mô tả giải đấu</label>
 <textarea
 value={editForm.description}
 onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
 rows={3}
 placeholder="Luật chơi, điều kiện thi, đồ đạo..."
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm resize-y"
 />
 </div>

 <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
 <p className="text-[14px] font-extrabold text-slate-600">
 Tài khoản nhận lệ phí (hiển thị cho đội khi đăng ký)
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <input
 type="text"
 value={editForm.bankCode}
 onChange={(e) => setEditForm((f) => ({ ...f, bankCode: e.target.value }))}
 placeholder="Mã ngân hàng"
 className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-[14px]"
 />
 <input
 type="text"
 value={editForm.bankAccount}
 onChange={(e) => setEditForm((f) => ({ ...f, bankAccount: e.target.value }))}
 placeholder="Số tài khoản"
 className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-[14px]"
 />
 <input
 type="text"
 value={editForm.accountName}
 onChange={(e) => setEditForm((f) => ({ ...f, accountName: e.target.value }))}
 placeholder="Chủ tài khoản"
 className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-[14px]"
 />
 </div>
 </div>

 <div className="flex gap-3 pt-1">
 <button
 type="button"
 onClick={() => setBottomTab("teams")}
 className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
 >
 Huỷ Bỏ
 </button>
 <button
 type="submit"
 disabled={savingEdit || !editForm.title.trim()}
 className="flex-1 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
 >
 {savingEdit ? "Đang lưu…" : "Lưu Thay Đổi"}
 </button>
 </div>
 </form>
  </div>
)}

{/* TAB CONTENT: THỐNG KÊ TÀI CHÍNH GIẢI (BTC) */}
 {bottomTab === "finance" && (
 <div className="space-y-4">
 {!activeTournament ? (
 <p className="text-sm text-slate-500 py-4 sm:py-6 text-center">
 Chưa chọn giải để xem thống kê tài chính.
 </p>
 ) : financeLoading && !finance ? (
 <p className="text-sm text-slate-500 py-4 sm:py-6 text-center">Đang tải số liệu…</p>
 ) : !finance ? (
 <p className="text-sm text-slate-500 py-4 sm:py-6 text-center">
 Chưa tải được thống kê tài chính của giải này.
 </p>
 ) : (
 <>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 {[
 { label: "Tổng lệ phí đã thu", value: finance.totalCollected, hint: `${finance.confirmedTeams} đội đã chuyển khoản`, tone: "text-emerald-600", icon: Wallet },
 { label: "Đang chờ chuyển khoản", value: finance.totalAwaiting, hint: `${finance.pendingTeams} đội chờ duyệt`, tone: "text-amber-600", icon: Users2 },
 { label: "Tiền thưởng dự kiến", value: finance.prizePool, hint: finance.prizeToPay > 0 ? "Đã tới hạn trao" : "Trao khi kết thúc giải", tone: "text-sky-700", icon: Award },
 { label: "Tiền còn lại dự kiến", value: finance.netAfterPrize, hint: "Sau khi chi giải thưởng", tone: "text-[#0b4f6c]", icon: Sparkles },
 ].map((card) => {
 const Icon = card.icon;
 return (
 <div key={card.label} className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
 <div className="flex items-center gap-1.5 text-slate-500">
 <Icon className="w-3.5 h-3.5 shrink-0" />
 <span className="text-[14px] font-black tracking-wide">{card.label}</span>
 </div>
 <p className={`text-base sm:text-lg font-black ${card.tone}`}>
 {formatMoney(card.value)}
 </p>
 <p className="text-[14px] text-slate-500">{card.hint}</p>
 </div>
 );
 })}
 </div>

 <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
 <Users2 className="w-4 h-4 text-[#0369a1]" />
 Quy mô giải đấu
 </h4>
 <span className="text-[14px] font-mono text-slate-500">
 {finance.totalTeams}/{finance.capacity || "∞"} đội · {finance.fillPercent}%
 </span>
 </div>
 <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
 <div
 className="h-full bg-[#0369a1] rounded-full transition-all"
 style={{ width: `${Math.max(2, finance.fillPercent)}%` }}
 />
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[14px]">
 <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
 <span className="block text-slate-500 text-[14px] font-bold">Đã xác nhận</span>
 <strong className="text-emerald-700 font-black">{finance.confirmedTeams}</strong>
 </div>
 <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
 <span className="block text-slate-500 text-[14px] font-bold">Chờ duyệt</span>
 <strong className="text-amber-700 font-black">{finance.pendingTeams}</strong>
 </div>
 <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
 <span className="block text-slate-500 text-[14px] font-bold">Đội giả lập</span>
 <strong className="text-slate-700 font-black">{finance.simulatedTeams}</strong>
 </div>
 <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
 <span className="block text-slate-500 text-[14px] font-bold">Lệ phí/đội</span>
 <strong className="text-sky-700 font-black">{formatMoney(finance.entryFee)}</strong>
 </div>
 </div>
 <p className="text-[14px] text-slate-500 leading-relaxed">
 Đội do nút “Giả lập đội” sinh ra là dữ liệu thử nghiệm nên không tính vào doanh thu thực tế.
 </p>
 </div>
 </>
 )}
 </div>
 )}

 {/* TAB CONTENT: LỊCH THI ĐẤU THẬT */}
 {bottomTab === "schedule" && (
 <div className="space-y-4">
 {!activeBracket ? (
 <p className="text-sm text-slate-500 py-4 text-center">
 Giải đấu chưa bốc thăm chia nhánh. Hãy bốc thăm nhánh đấu ở mục "Duyệt Đội & Đăng Ký" trước khi xếp lịch thi đấu.
 </p>
 ) : (
 <>
 {/* Bộ xếp lịch tự động inline */}
 <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div>
 <h4 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
 <Calendar className="w-4 h-4 text-[#0369a1]" />
 Bộ Xếp Lịch Thi Đấu Tự Động
 </h4>
 <p className="text-[13px] text-slate-500">
 Tự động phân bổ ngày thi đấu, ca giờ và cụm sân cho toàn bộ các trận trong nhánh đấu
 </p>
 </div>
 </div>

 <form
 onSubmit={(e) => {
 e.preventDefault();
 handleAutoGenerateSchedule();
 }}
 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1"
 >
 <div className="space-y-1">
 <label className="text-[13px] font-bold text-slate-600 block">Ngày bắt đầu</label>
 <input
 type="date"
 value={scheduleConfig.startDate || activeTournament?.startDate || ""}
 onChange={(e) => setScheduleConfig((c) => ({ ...c, startDate: e.target.value }))}
 className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-[13px] font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0369a1]"
 />
 </div>
 <div className="space-y-1">
 <label className="text-[13px] font-bold text-slate-600 block">Số trận / ngày</label>
 <input
 type="number"
 min={1}
 max={12}
 value={scheduleConfig.matchesPerDay}
 onChange={(e) => setScheduleConfig((c) => ({ ...c, matchesPerDay: Number(e.target.value) || 2 }))}
 className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-[13px] font-mono text-slate-900 focus:outline-none focus:border-[#0369a1]"
 />
 </div>
 <div className="space-y-1">
 <label className="text-[13px] font-bold text-slate-600 block">Giờ bóng lăn (0-23h)</label>
 <input
 type="number"
 min={6}
 max={22}
 value={scheduleConfig.startHour}
 onChange={(e) => setScheduleConfig((c) => ({ ...c, startHour: Number(e.target.value) || 17 }))}
 className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-[13px] font-mono text-slate-900 focus:outline-none focus:border-[#0369a1]"
 />
 </div>
 <div className="space-y-1">
 <label className="text-[13px] font-bold text-slate-600 block">Thời lượng (phút/trận)</label>
 <input
 type="number"
 min={30}
 max={150}
 step={15}
 value={scheduleConfig.matchMinutes}
 onChange={(e) => setScheduleConfig((c) => ({ ...c, matchMinutes: Number(e.target.value) || 90 }))}
 className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-[13px] font-mono text-slate-900 focus:outline-none focus:border-[#0369a1]"
 />
 </div>
 <div className="flex items-end">
 <button
 type="submit"
 disabled={schedulingBusy}
 className="w-full py-2 px-4 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
 >
 <Calendar className="w-4 h-4" />
 <span>{schedulingBusy ? "Đang xếp lịch..." : "Tự Động Xếp Lịch"}</span>
 </button>
 </div>
 </form>
 </div>

 {/* Danh sách tất cả trận trong nhánh để xem & chỉnh lịch từng trận */}
 <div className="space-y-2">
 {scheduledMatches.map((m: any) => (
 <div
 key={m.matchId}
 className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5 text-[14px]"
 >
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2.5 min-w-0">
 <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[13px] font-bold shrink-0">
 {m.matchId} {m.roundName ? `· ${m.roundName}` : ""}
 </span>
 <span className="font-bold text-slate-900 truncate">
 {m.teamA} vs {m.teamB}
 </span>
 </div>
 <div className="flex flex-wrap items-center gap-2 text-[13px]">
 {m.matchDate ? (
 <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono font-bold">
 {m.matchDate.split("-").reverse().join("/")}
 </span>
 ) : (
 <span className="text-slate-400">Chưa xếp ngày</span>
 )}
 {m.timeSlot && (
 <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">
 {m.timeSlot}
 </span>
 )}
 {m.pitchName && (
 <span className="text-slate-700 font-semibold truncate max-w-[180px]">
 📍 {m.pitchName}
 </span>
 )}
 {m.refereeName && (
 <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
 Trọng tài: {m.refereeName}
 </span>
 )}
 <button
 type="button"
 onClick={() => handleOpenMatchScheduleEdit(m)}
 className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-[#0369a1] border border-slate-300 text-[13px] font-bold transition-colors cursor-pointer"
 >
 {editingMatchScheduleId === m.matchId ? "Đóng" : "Đổi giờ / Sân / Trọng tài"}
 </button>
 </div>
 </div>

 {editingMatchScheduleId === m.matchId && (
 <div className="p-3 rounded-lg bg-slate-50 border border-sky-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2.5">
 <input
 type="date"
 value={matchEditForm.matchDate}
 onChange={(e) => setMatchEditForm((f) => ({ ...f, matchDate: e.target.value }))}
 className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[13px] font-mono text-slate-900"
 />
 <input
 type="text"
 value={matchEditForm.timeSlot}
 onChange={(e) => setMatchEditForm((f) => ({ ...f, timeSlot: e.target.value }))}
 placeholder="Khung giờ (VD: 19:00-20:30)"
 className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[13px] font-mono text-slate-900"
 />
 <input
 type="text"
 value={matchEditForm.pitchName}
 onChange={(e) => setMatchEditForm((f) => ({ ...f, pitchName: e.target.value }))}
 placeholder="Sân thi đấu (VD: Sân 5A)"
 className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[13px] text-slate-900"
 />
 <input
 type="text"
 list="tournament-referees-list"
 value={matchEditForm.refereeName}
 onChange={(e) => setMatchEditForm((f) => ({ ...f, refereeName: e.target.value }))}
 placeholder="Trọng tài bắt chính"
 className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[13px] text-slate-900"
 />
 <datalist id="tournament-referees-list">
 {referees.map((r) => (
 <option key={r.id} value={r.name} />
 ))}
 </datalist>
 <button
 type="button"
 onClick={() => handleSaveSingleMatchSchedule(m.matchId)}
 disabled={schedulingBusy}
 className="px-3 py-1.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-colors cursor-pointer"
 >
 {schedulingBusy ? "Đang lưu..." : "Lưu Lịch Trận"}
 </button>
 </div>
 )}
 </div>
 ))}
 </div>
 </>
 )}
 </div>
 )}

 </div>

 </div>

 </div>
 {/* RIGHT 4 COLS: TỔNG QUAN GIẢI ĐẤU ĐANG CHỌN (TOURNAMENT SNAPSHOT) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-300 text-slate-900 rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-bold text-sky-800">Thông tin giải đấu</span>
                <h4 className="text-base font-bold text-slate-900 truncate">
                  {activeTournament ? activeTournament.title : "Chưa chọn giải"}
                </h4>
              </div>
            </div>

            {!activeTournament ? (
              <p className="text-[13px] text-slate-500 py-4 text-center">
                Vui lòng chọn một giải đấu ở danh sách phía trên để xem tổng quan.
              </p>
            ) : (
              <>
                {/* Thanh tiến độ đăng ký */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-600 font-medium">Đội tham gia:</span>
                    <span className="font-bold text-slate-900">
                      {confirmedCount(activeTournament)}/{activeTournament.totalTeams ?? "—"} đội
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${
                          activeTournament.totalTeams
                            ? Math.min(100, Math.round((confirmedCount(activeTournament) / activeTournament.totalTeams) * 100))
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[13px] text-slate-500 pt-0.5">
                    <span>Trạng thái</span>
                    <span className="font-bold text-emerald-700">
                      {(confirmedCount(activeTournament) >= (activeTournament.totalTeams ?? 16)) ? "Đã đủ đội" : "Đang mở đăng ký"}
                    </span>
                  </div>
                </div>

                {/* Chuyển trạng thái giải đấu nhanh */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[13px] font-bold text-slate-700 block">Trạng thái vận hành giải:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { code: "OPEN", label: "Mở đăng ký" },
                      { code: "ONGOING", label: "Đang diễn ra" },
                      { code: "COMPLETED", label: "Đã kết thúc" },
                    ].map((st) => {
                      const isCurrent = (activeTournament.status || "OPEN").toUpperCase() === st.code;
                      return (
                        <button
                          key={st.code}
                          type="button"
                          disabled={statusBusy || isCurrent}
                          onClick={() => handleSwitchTournamentStatus(st.code as "OPEN" | "ONGOING" | "COMPLETED")}
                          className={`py-1.5 px-2 rounded-md text-[13px] font-bold transition-colors cursor-pointer border ${
                            isCurrent
                              ? "bg-[#0369a1] text-white border-[#0369a1]"
                              : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bảng thông số chi tiết */}
                <div className="space-y-2 text-[13px]">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Môn thi đấu:</span>
                    <span className="font-bold text-slate-900">{sportLabel(activeTournament.sportType)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Thể thức:</span>
                    <span className="font-bold text-slate-900">{formatLabel(activeTournament.format)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Lệ phí giải:</span>
                    <span className="font-bold font-mono text-slate-900">{formatMoney(activeTournament.entryFee ?? 0)}/đội</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Tổng quỹ thưởng:</span>
                    <span className="font-bold font-mono text-sky-800">{formatMoney(activeTournament.prizePool ?? 0)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Cụm sân:</span>
                    <span className="font-bold text-slate-900 text-right truncate">
                      {activeTournament.pitchName ?? activeTournament.location ?? "Chưa xếp sân"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Khởi tranh:</span>
                    <span className="font-bold text-slate-900">{formatDate(activeTournament.startDate)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-slate-500">Hạn đăng ký:</span>
                    <span className="font-bold text-slate-900">{formatDate(activeTournament.registrationDeadline)}</span>
                  </div>
                </div>

                {/* Hàng nút thao tác nhanh */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="w-full py-2.5 px-3 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Sao Chép Link Đăng Ký</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(activeTournament)}
                    className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold border border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Sửa Thông Tin Giải</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Kênh liên lạc B2B với Chủ Sân (nếu có) */}
          {user?.role === "ORGANIZER" && onOpenTournamentChat && (
            <button
              type="button"
              onClick={onOpenTournamentChat}
              className="w-full px-4 py-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-[13px] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#0369a1]" />
              <span>Phòng Chat Giải Đấu</span>
            </button>
          )}
        </div>
      </div>

      {/* POPUP MODAL MỜI CẦU THỦ QUA EMAIL NỔI BẬT KHÔNG BỊ TRÔI XUỐNG DƯỚI */}
      <TournamentInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tournament={inviteModalTourney || activeTournament}
        tournaments={dbTournaments}
        onInviteSuccess={async () => {
          await fetchDbTournaments();
          if (activeTournamentId) loadJoinAccess(Number(activeTournamentId));
        }}
      />
    </div>
 );
}
