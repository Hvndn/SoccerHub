"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_BASE_URL, apiRequest, fetchWithTimeout } from '@/lib/api';
import {
  sportLabel,
  formatLabel,
  formatMoney,
  createTournament,
  updateTournament,
  fetchTournamentFinance,
  fillSimulatedTeams,
  drawTournamentBracket,
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
  type PendingTeam, type RefereeInfo
} from "@/lib/organizerService";
import {
 Trophy,
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
 AlertCircle
} from "lucide-react";

interface TournamentOrganizerPortalProps {
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
 user,
 onStartDm,
 onOpenTournamentChat
}: TournamentOrganizerPortalProps) {
 // Sport Filter State
 const [selectedSport, setSelectedSport] = useState<string>("all");

 // Thông báo tương tác trong trang (không dùng alert để giữ đúng nghiệp vụ)
 const [varNotice, setVarNotice] = useState<string | null>(null);

 // Giải BTC đang thao tác. Mặc định lấy giải đầu tiên đã bốc thăm (nếu chưa chọn
 // tay) để các bảng BXH / lịch / tài chính vẫn có dữ liệu ngay khi vào trang.
 const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);

 // Active Tab for Tables/Logs
 const [bottomTab, setBottomTab] = useState<"standings" | "var_logs" | "schedule" | "finance">("standings");

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
 // Cập nhật ngay khi cache dùng chung thay đổi (sau khi tạo giải / thêm đội / bốc thăm)
 const unsubscribe = subscribeTournaments((list) => setDbTournaments(list));
 return unsubscribe;
 }, []);

 // Danh sách giải lấy từ CSDL — không dùng dữ liệu giả.
 const tournaments = useMemo(
 () =>
 dbTournaments.map((t: any) => {
 const teams = t.teams ?? [];
 const cap = t.totalTeams ?? 0;
 const progress = cap ? Math.min(100, Math.round((teams.length / cap) * 100)) : 0;
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

 // Giải dùng làm nguồn cho BXH / kết quả / lịch: giải đầu tiên đã bốc thăm trong CSDL.
 const activeTournamentId = useMemo(() => {
 if (selectedTournamentId) return selectedTournamentId;
 const withBracket = dbTournaments.find((t: any) => t.bracketJson);
 return withBracket?.id ?? dbTournaments[0]?.id ?? null;
 }, [dbTournaments, selectedTournamentId]);

 const activeTournament = useMemo(
 () => dbTournaments.find((t: any) => t.id === activeTournamentId) ?? null,
 [dbTournaments, activeTournamentId]
 );

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

  // --- Trọng tài ---
  const [referees, setReferees] = useState<RefereeInfo[]>([]);
  const [refOpen, setRefOpen] = useState<number | null>(null);
  const [refLoading, setRefLoading] = useState(false);
  const [refBusy, setRefBusy] = useState(false);
  const [refName, setRefName] = useState("");
  const [refPhone, setRefPhone] = useState("");
  const [refEmail, setRefEmail] = useState("");

  const loadReferees = async (tid: number) => {
    setRefLoading(true);
    setRefFor(tid);
    try { setReferees(await getReferees(tid)); }
    catch { setReferees([]); }
    finally { setRefLoading(false); }
  };

  const toggleReferees = (tid: number) => {
    setRefOpen((cur) => {
      if (cur === tid) return null; // đang mở đúng giải này -> đóng lại
      loadReferees(tid);
      return tid;
    });
  };

  const handleAddReferee = async (tid: number) => {
    if (refName.trim().length < 2) return;
    setRefBusy(true);
    try {
      await addReferee(tid, { name: refName.trim(), phone: refPhone.trim() || undefined, email: refEmail.trim() || undefined });
      setRefName(""); setRefPhone(""); setRefEmail("");
      await loadReferees(tid);
    } catch { /* toast đã hiện */ }
    finally { setRefBusy(false); }
  };

  const handleRemoveReferee = async (tid: number, id: number) => {
    setRefBusy(true);
    try {
      await removeReferee(tid, id);
      await loadReferees(tid);
    } catch { /* toast đã hiện */ }
    finally { setRefBusy(false); }
  };

 // 
  const handleCreateRandomTournament = async () => {
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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

  // ---- SỬA THÔNG TIN GIẢI (trước đây BTC tạo xong không sửa được gì) ----
  const [showEditModal, setShowEditModal] = useState(false);

 // Form sửa giải hiện INLINE (không popup) nằm cuối trang -> tự cuộn tới khi mở.
 useEffect(() => {
  if (!showEditModal) return;
  const raf = requestAnimationFrame(() => {
   document.getElementById("edit-tournament-inline")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  return () => cancelAnimationFrame(raf);
 }, [showEditModal]);
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

 /** Gửi yêu cầu thêm đội thủ công vào giải đang chọn. */
 const handleAddManualTeam = async () => {

  const tid = Number(activeTournament?.id);
  if (!tid) {
   setVarNotice("❌ Hãy chọn giải đấu trước khi thêm đội.");
   return;
  }
  if (addTeamForm.teamName.trim().length < 3) {
   setVarNotice("❌ Tên đội phải có ít nhất 3 ký tự.");
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
    setShowEditModal(true);
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
      setShowEditModal(false);
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
 .flatMap((r: any) => r.matches)
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
 .flatMap((r: any) => r.matches)
 .filter((m: any) => m.status !== "BYE" && m.teamA && m.teamB)
 .map((m: any) => ({
 matchId: m.matchId,
 teamA: m.teamA.name,
 teamB: m.teamB.name,
 matchDate: m.matchDate,
 timeSlot: m.timeSlot,
 pitchName: m.pitchName,
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
 useEffect(() => {
 let alive = true;
 if (!activeTournamentId) { setTopScorers([]); return; }
 fetchWithTimeout(`${API_BASE_URL}/api/v1/tournaments/${activeTournamentId}/scorers`)
 .then((r) => (r.ok ? r.json() : []))
 .then((d) => { if (alive && Array.isArray(d)) setTopScorers(d.slice(0, 5)); })
 .catch(() => { if (alive) setTopScorers([]); });
 return () => { alive = false; };
 }, [activeTournamentId]);

 // --- Bảng điều khiển trọng tài: chọn 1 trận thật để nhập tỷ số ---
 const umpireMatches = useMemo(() => {
 if (!activeBracket) return [] as any[];
 return activeBracket.rounds
 .flatMap((r: any) => r.matches)
 .filter((m: any) => m.teamA && m.teamB && !m.teamA.tbd && !m.teamB.tbd && m.status !== "BYE")
 .map((m: any) => ({ ...m, roundName: "" }));
 }, [activeBracket]);

 const [umpireMatchId, setUmpireMatchId] = useState<string>("");
 const [umpireScoreA, setUmpireScoreA] = useState(0);
 const [umpireScoreB, setUmpireScoreB] = useState(0);
 const [umpireBusy, setUmpireBusy] = useState(false);
 const [umpireMsg, setUmpireMsg] = useState<string | null>(null);

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

 useEffect(() => {
 setUmpireScoreA(umpireMatch?.scoreA ?? 0);
 setUmpireScoreB(umpireMatch?.scoreB ?? 0);
 setUmpireMsg(null);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [umpireMatchId]);

 const saveUmpireScore = async () => {
 if (!activeTournamentId || !umpireMatch) return;
 const isLeague = activeTournament?.format === "ROUND_ROBIN";
 if (umpireScoreA === umpireScoreB && !isLeague) {
 setUmpireMsg("Vòng loại trực tiếp cần phân thắng bại, không nhận hòa.");
 return;
 }
 if (umpireMatch.status === "DONE") {
 setUmpireMsg("Trận này đã có kết quả. Mở tab Bracket để bấm “Huỷ KQ” rồi nhập lại.");
 return;
 }
 try {
 setUmpireBusy(true);
 const body = await apiRequest<any>(`/api/v1/tournaments/${activeTournamentId}/matches`, {
 method: "POST",
 body: JSON.stringify({ matchId: umpireMatch.matchId, scoreA: umpireScoreA, scoreB: umpireScoreB }),
 });
 const formNote = (body?.formChanges ?? []).map((c: any) => `${c.team} ${c.after?.record ?? ""}`).join(" • ");
 setUmpireMsg(`${body?.message ?? "Đã lưu kết quả."}${formNote ? ` | Phong độ: ${formNote}` : ""}`);
 await fetchDbTournaments();
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
 <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
 <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-50 via-emerald-50 to-transparent rounded-full blur-3xl pointer-events-none" />
 
 <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-6">
 <div className="space-y-3">
 <div className="flex items-center space-x-3">
 <div className="flex items-center space-x-2 text-[13px] font-mono text-sky-900 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
 <span className="w-2 h-2 rounded-full bg-[#0369a1] animate-ping" />
 <span>
 {loadingDb ? "Đang đồng bộ CSDL…" : `CSDL: ${dbTournaments.length} giải đấu`}
 </span>
 </div>
 </div>

 <h1 className="text-lg sm:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
 <span>Quản Lý Giải Đấu Bóng Đá Turfzone</span>
 <Award className="w-8 h-8 text-amber-700 shrink-0 hidden sm:inline-block" />
 </h1>
 <p className="text-sm text-slate-600 max-w-2xl font-medium leading-relaxed hidden sm:block">
 Nhập tỷ số trọng tài, bốc thăm nhánh đấu, giải thưởng và sơ đồ knockout thời gian thực.
 </p>
 </div>

 {/* Thông báo kết quả thao tác. Trước đây setVarNotice() được gọi ở nhiều nơi
 nhưng không có chỗ nào render nó, nên mọi phản hồi đều vô hình với người dùng. */}
 {varNotice && (
 <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#0369a1]/25 bg-[#0369a1]/5 px-4 py-3 animate-fade-in">
 <AlertCircle className="w-4 h-4 text-[#0b4f6c] shrink-0 mt-0.5" />
 <p className="text-[13px] sm:text-sm font-bold text-slate-700 leading-relaxed flex-1">{varNotice}</p>
 <button
 type="button"
 onClick={() => setVarNotice(null)}
 className="shrink-0 rounded-lg p-1 text-slate-500 hover:text-slate-800 hover:bg-white transition-colors"
 aria-label="Đóng thông báo"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 )}

 {/* Action Header Buttons */}
 <div className="flex flex-wrap items-center gap-3">
 <button
 onClick={() => window.print()}
 className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold border border-slate-200 transition-all flex items-center space-x-2 active:scale-95 shadow-xs"
 >
 <Download className="w-4 h-4 text-[#0369a1]" />
 <span>Xuất Báo Cáo</span>
 </button>

 <button
 onClick={() =>
 setVarNotice(
 `CSDL hiện có ${dbTournaments.length} giải đấu. Duyệt hồ sơ VĐV nằm ở mục Chợ Kèo của hệ thống.`
 )
 }
 className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold border border-slate-200 transition-all flex items-center space-x-2 relative active:scale-95 shadow-xs"
 >
 <Users className="w-4 h-4 text-amber-600" />
 <span>Giải đang quản lý</span>
 <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[13px] font-black flex items-center justify-center">
 {dbTournaments.length}
 </span>
 </button>

 <Link
 href="/tournaments/new"
 className="px-4 py-2.5 sm:px-5 rounded-xl text-[13px] font-black shadow-md transition-all flex items-center space-x-2 active:scale-95 bg-[#0369a1] hover:bg-[#075985] text-white"
 >
 <Plus className="w-4 h-4 stroke-[3]" />
 <span className="sm:hidden">+ Tạo Giải Mới</span>
 <span className="hidden sm:inline">+ Khởi Tạo Giải Đấu Mới</span>
 </Link>
 </div>
 </div>

 {/* Form tạo giải đã chuyển sang trang wizard riêng: /tournaments/new (4 bước) */}

 {/* SPORT CATEGORY FILTERS */}
 <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-[13px] font-bold text-slate-500 mr-2 flex items-center gap-1.5 whitespace-nowrap">
 <Filter className="w-3.5 h-3.5 text-slate-500" /> Môn:
 </span>
 {SPORT_FILTERS.map(item => (
 <button
 key={item.id}
 onClick={() => setSelectedSport(item.id)}
 className={`px-3.5 py-1.5 rounded-xl text-[13px] font-extrabold transition-all whitespace-nowrap ${
 selectedSport === item.id
 ? "bg-[#0369a1] text-white shadow-xs"
 : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200/60"
 }`}
 >
 {item.label} ({countBySportFilter(item.id)})
 </button>
 ))}
 </div>

 <div className="text-[13px] font-mono text-slate-500 shrink-0 hidden md:block">
 Giải đang mở: <span className="text-sky-800 font-bold">{countBySportFilter("all")} giải trong CSDL</span>
 </div>
 </div>
 </div>

 {/* FOOTBALL TOURNAMENT BENTO CAROUSEL CARDS */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
 {loadingDb && filteredTournaments.length === 0 ? (
 [0, 1, 2].map((i) => (
 <div key={i} className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 bg-white space-y-3">
 <div className="skeleton-shimmer h-5 w-2/3 rounded-lg" />
 <div className="skeleton-shimmer h-3 w-1/2 rounded-lg" />
 <div className="skeleton-shimmer h-2 w-full rounded-full" />
 </div>
 ))
 ) : filteredTournaments.length === 0 ? (
 <div className="md:col-span-3 rounded-2xl sm:rounded-3xl p-4 sm:p-10 text-center border border-dashed border-slate-300 bg-white">
 <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
 <p className="mt-3 text-sm font-bold text-slate-600">
 {selectedSport === "all"
 ? "Chưa có giải đấu nào trong CSDL."
 : `Không có giải nào đúng bộ lọc “${SPORT_FILTERS.find((f) => f.id === selectedSport)?.label}”.`}
 </p>
 </div>
 ) : filteredTournaments.map((t: any) => (
 <div
 key={t.id}
 className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-xs cursor-pointer ${
  String(t.id) === String(activeTournamentId)
    ? "border-[#0369a1] ring-2 ring-[#0369a1]/25"
    : t.status === "live"
    ? "bg-sky-50/40 border-sky-300 text-slate-900 hover:border-sky-400"
    : "bg-white border-slate-200/90 text-slate-900 hover:border-slate-300"
  }`}
 onClick={() => setSelectedTournamentId(Number(t.id))}
 role="button"
 tabIndex={0}
 onKeyDown={(e) => {
 if (e.key === "Enter" || e.key === " ") {
 e.preventDefault();
 setSelectedTournamentId(Number(t.id));
 }
 }}
 >
 {String(t.id) === String(activeTournamentId) && (
 <div className="absolute -top-px -right-px z-20">
 <span className="inline-flex items-center gap-1 rounded-bl-xl rounded-tr-2xl bg-[#0369a1] px-2.5 py-1 text-[13px] font-black text-white shadow-sm">
 <CheckCircle2 className="w-3 h-3" />
 Đang thao tác
 </span>
 </div>
 )}
 {t.status === "live" && (
 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />
 )}

 <div className="space-y-3 sm:space-y-4 relative z-10">
 <div className="flex items-center justify-between gap-2">
 <span className={`px-3 py-1 rounded-full text-[13px] font-black tracking-wider flex items-center gap-1.5 ${
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
 <h3 className="text-lg font-black tracking-tight leading-snug">
 {t.title}
 </h3>
 <p className="text-[13px] text-slate-500 mt-1 font-medium">
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
 className="h-full bg-gradient-to-r from-[#0369a1] to-[#075985] transition-all duration-500"
 style={{ width: `${t.progress}%` }}
 />
 </div>
 </div>
 </div>

 <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2 relative z-10">
 <span className="text-[13px] font-bold text-slate-500 flex items-center gap-1">
 {t.hasBracket ? "✅ Đã bốc thăm — có nhánh đấu trong CSDL" : "⏳ Chưa bốc thăm"}
 </span>

 <button
 onClick={(e) => {
 e.stopPropagation();
 onOpenBracket?.(String(t.id));
 }}
 className="text-[13px] font-black text-[#0369a1] hover:text-[#0369a1] flex items-center space-x-1 group"
 >
 <span>Mở Nhánh Đấu</span>
 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
 </button>

      {/* Nút Duyệt đội + Trọng tài */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => togglePending(Number(t.id))}
          className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-[13px] font-black transition-all active:scale-95 flex items-center gap-1"
        >
          <Users className="w-3.5 h-3.5" />
          Duyệt đội
          {pendingTeams.length > 0 && pendingFor === Number(t.id) && (
            <span className="min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[13px] font-black flex items-center justify-center">
              {pendingTeams.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => toggleReferees(Number(t.id))}
          className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 text-[13px] font-black transition-all active:scale-95 flex items-center gap-1"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Trọng tài
          {referees.length > 0 && refFor === Number(t.id) && (
            <span className="min-w-[16px] h-4 px-1 rounded-full bg-sky-500 text-white text-[13px] font-black flex items-center justify-center">
              {referees.length}
            </span>
          )}
        </button>
      </div>

      {/* Panel duyệt đội */}
      {pendingOpenFor === Number(t.id) && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2">
          <p className="text-[13px] font-black tracking-wider text-amber-700">Đội chờ duyệt</p>
          {pendingLoading ? (
            <p className="text-[13px] text-slate-500">Đang tải…</p>
          ) : pendingTeams.length === 0 ? (
            <p className="text-[13px] text-slate-500">Không có đội nào chờ duyệt.</p>
          ) : (
            <ul className="space-y-2">
              {pendingTeams.map((pt) => (
                <li key={pt.teamName} className="flex items-center gap-2 bg-white rounded-lg border border-amber-100 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{pt.teamName}</p>
                    <p className="text-[13px] text-slate-500 truncate">{pt.captainName} · {pt.captainPhone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApprove(Number(t.id), pt.teamName)}
                    disabled={pendingBusy}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-black transition-all active:scale-95 disabled:opacity-40"
                  >
                    Duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(Number(t.id), pt.teamName)}
                    disabled={pendingBusy}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-black transition-all active:scale-95 disabled:opacity-40"
                  >
                    Từ chối
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Panel trọng tài */}
      {refOpen === Number(t.id) && (
        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/50 p-3 space-y-2">
          <p className="text-[13px] font-black tracking-wider text-sky-700">Trọng tài</p>
          {refLoading ? (
            <p className="text-[13px] text-slate-500">Đang tải…</p>
          ) : referees.length === 0 ? (
            <p className="text-[13px] text-slate-500">Chưa có trọng tài nào.</p>
          ) : (
            <ul className="space-y-1.5">
              {referees.map((r) => (
                <li key={r.id} className="flex items-center gap-2 bg-white rounded-lg border border-sky-100 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{r.name}</p>
                    <p className="text-[13px] text-slate-500 truncate">{r.phone || r.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveReferee(Number(t.id), r.id)}
                    disabled={refBusy}
                    className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-[13px] font-black transition-all active:scale-95 disabled:opacity-40"
                  >
                    Xóa
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2">
            <input
              value={refName}
              onChange={(e) => setRefName(e.target.value)}
              placeholder="Tên trọng tài"
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
            />
            <input
              value={refPhone}
              onChange={(e) => setRefPhone(e.target.value)}
              placeholder="SĐT"
              className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
            />
            <button
              type="button"
              onClick={() => handleAddReferee(Number(t.id))}
              disabled={refBusy || refName.trim().length < 2}
              className="px-3 py-1.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black transition-all active:scale-95 disabled:opacity-40"
            >
              Thêm
            </button>
          </div>
        </div>
      )}
 </div>
 </div>
 ))}
 </div>

 {/* MAIN CONTENT GRID: LIVE ELECTRONIC UMPIRE CONSOLE (LEFT 8) + AI SEEDING & ESCROW (RIGHT 4) */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
 
 {/* LEFT 8 COLS: UMPIRE CONSOLE + BRACKET ENGINE + DATA TABLES */}
 <div className="lg:col-span-8 space-y-4 sm:space-y-8">

 {/* 1. BẢNG ĐIỀU KHIỂN TRỌNG TÀI — chạy trên trận thật trong nhánh đấu */}
 <div className="bg-white border border-slate-200/90 text-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm relative overflow-hidden">
 <div className="absolute top-0 right-0 w-80 h-80 bg-rose-50/50 rounded-full blur-3xl pointer-events-none" />

 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-5 mb-6">
 <div className="flex items-center space-x-3 min-w-0">
 <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold shrink-0">
 <Activity className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <div className="flex items-center space-x-2">
 <span className="text-[13px] font-black text-rose-600">
 Bảng Điều Khiển Trọng Tài
 </span>
 <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[13px] font-black">
 Nguồn: CSDL
 </span>
 </div>
 <h2 className="text-lg font-black tracking-tight text-slate-900 mt-0.5 truncate">
 {umpireMatch
 ? `${umpireMatch.teamA.name} vs ${umpireMatch.teamB.name}`
 : activeTournament
 ? `${activeTournament.title} — chưa bốc thăm`
 : "Chưa có giải nào trong CSDL"}
 </h2>
 </div>
 </div>

 {umpireMatches.length > 0 && (
 <select
 value={umpireMatchId}
 onChange={(e) => setUmpireMatchId(e.target.value)}
 aria-label="Chọn trận để nhập tỷ số"
 className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 max-w-[260px]"
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
 <p className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[13px] font-bold">
 Trận này đã có kết quả {umpireMatch.scoreA}-{umpireMatch.scoreB}. Muốn sửa thì vào tab
 Bracket bấm “Huỷ KQ” — hệ thống sẽ mở lại trận để nhập tỷ số mới.
 </p>
 )}

 {/* Bảng điểm */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 items-center bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
 <div className="p-4 sm:p-6 rounded-2xl border border-sky-300 bg-white">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center space-x-2">
 <span className="w-3 h-3 rounded-full bg-[#0369a1]" />
 <span className="text-[13px] font-black tracking-wide text-slate-700">ĐỘI A</span>
 </div>
 </div>
 <div className="flex items-baseline justify-between gap-2">
 <span className="text-sm font-bold text-slate-900 truncate">{umpireMatch?.teamA?.name}</span>
 <span className="text-5xl font-black font-mono text-sky-700 tracking-tighter">{umpireScoreA}</span>
 </div>
 <div className="mt-3 pt-3 border-t border-slate-100 text-[13px] font-mono text-slate-500 flex items-center justify-between">
 <span>{umpireMatch?.matchDate ?? "Chưa xếp lịch"}</span>
 <span className="text-sky-800 font-bold">Phong độ: {umpireMatch?.teamA?.record ?? umpireMatch?.teamA?.form ?? "—"}</span>
 </div>
 </div>

 <div className="p-4 sm:p-6 rounded-2xl border border-sky-300 bg-white">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center space-x-2">
 <span className="w-3 h-3 rounded-full bg-[#0369a1]" />
 <span className="text-[13px] font-black tracking-wide text-slate-700">ĐỘI B</span>
 </div>
 </div>
 <div className="flex items-baseline justify-between gap-2">
 <span className="text-sm font-bold text-slate-900 truncate">{umpireMatch?.teamB?.name}</span>
 <span className="text-5xl font-black font-mono text-[#0369a1] tracking-tighter">{umpireScoreB}</span>
 </div>
 <div className="mt-3 pt-3 border-t border-slate-100 text-[13px] font-mono text-slate-500 flex items-center justify-between">
 <span>{umpireMatch?.timeSlot ?? "Chưa xếp giờ"}</span>
 <span className="text-sky-700 font-bold">Phong độ: {umpireMatch?.teamB?.record ?? umpireMatch?.teamB?.form ?? "—"}</span>
 </div>
 </div>
 </div>

 {/* Điều khiển */}
 {umpireMatch && umpireMatch.status !== "DONE" && (
 <div className="mt-6 space-y-3">
 <span className="text-[13px] font-bold text-slate-500 block">
 Điều Khiển Tỷ Số:
 </span>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <button
 onClick={() => setUmpireScoreA(umpireScoreA + 1)}
 className="py-3 px-4 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5"
 >
 <Plus className="w-4 h-4 stroke-[3]" />
 <span>+1 Bàn (Đội A)</span>
 </button>
 <button
 onClick={() => setUmpireScoreB(umpireScoreB + 1)}
 className="py-3 px-4 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5"
 >
 <Plus className="w-4 h-4 stroke-[3]" />
 <span>+1 Bàn (Đội B)</span>
 </button>
 <button
 onClick={() => { setUmpireScoreA(0); setUmpireScoreB(0); }}
 className="py-3 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-[13px] font-black shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5"
 >
 <RefreshCw className="w-4 h-4" />
 <span>Đặt lại 0-0</span>
 </button>
 <button
 onClick={saveUmpireScore}
 disabled={umpireBusy}
 className="py-3 px-4 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
 >
 <CheckCircle2 className="w-4 h-4 text-purple-200" />
 <span>{umpireBusy ? "Đang lưu…" : "Lưu KQ & Lịch Sử"}</span>
 </button>
 </div>
 </div>
 )}

 {umpireMsg && (
 <p className="mt-4 p-3 rounded-xl bg-slate-100 text-[13px] font-bold text-slate-700 ">
 {umpireMsg}
 </p>
 )}

 <div className="mt-5 flex flex-wrap gap-2">
 <button
 onClick={() => onOpenBracket?.(String(activeTournament?.id))}
 className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold flex items-center gap-1.5"
 >
 <Video className="w-4 h-4 text-red-500" />
 <span>Mở Tòa VAR &amp; Biên Bản Đầy Đủ</span>
 </button>
 <span className="px-3 py-2 rounded-xl bg-slate-50 text-[13px] text-slate-500 flex items-center">
 Sân: {umpireMatch?.pitchName ?? activeTournament?.pitchName ?? activeTournament?.location ?? "Chưa xếp sân"}
 </span>
 </div>
 </div>

 {/* 2. NHÁNH ĐẤU THẬT — parse từ bracketJson của giải đang chọn */}
 <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm space-y-3 sm:space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
 <div className="min-w-0">
 <span className="text-[13px] font-black text-[#0b4f6c]">
 BRACKET ENGINE — NGUỒN CSDL
 </span>
 <h3 className="text-xl font-black text-slate-900 tracking-tight truncate">
 {activeTournament ? activeTournament.title : "Chưa chọn giải nào"}
 </h3>
 </div>

 {activeTournament && (
 <span className="px-3 py-1 rounded-full bg-slate-100 text-[13px] font-bold text-slate-600 border border-slate-200 shrink-0">
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
 className={`text-[13px] font-black text-center border-b pb-2 ${
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
 className="bg-amber-50 p-3 rounded-xl border border-amber-300 text-[13px] flex items-center justify-between"
 >
 <span className="font-bold text-amber-900 truncate">{m.bye.name}</span>
 <span className="text-[13px] font-black text-amber-600 shrink-0">Miễn vòng</span>
 </div>
 );
 }
 const winner = m.winner;
 return (
 <div
 key={m.matchId}
 className={`bg-white p-3 rounded-xl border text-[13px] space-y-1.5 shadow-xs ${
 m.status === "DONE"
 ? "border-sky-300 "
 : "border-slate-200 "
 }`}
 >
 <div className="flex items-center justify-between gap-2">
 <span className="font-mono text-[13px] text-slate-500">{m.matchId}</span>
 {m.matchDate && (
 <span className="font-mono text-[13px] text-[#0369a1] ">
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
 <div className="text-[13px] text-slate-500 truncate">{m.pitchName}</div>
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
 <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm space-y-3 sm:space-y-6">
 {/* TABS HEADER */}
 <div className="flex items-center justify-between border-b border-slate-200 pb-4">
 <div className="flex items-center gap-2 flex-wrap">
 {[
 { id: "standings", label: "Bảng Xếp Hạng" },
 { id: "var_logs", label: "Kết Quả & Vua Phá Lưới" },
 { id: "schedule", label: "Lịch Thi Đấu" },
 { id: "finance", label: "Tài Chính Giải" }
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setBottomTab(tab.id as any)}
 className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all whitespace-nowrap ${
 bottomTab === tab.id
 ? "bg-[#0369a1] text-white shadow-md"
 : "text-slate-600 hover:bg-slate-100 "
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>

 <button
 onClick={fetchDbTournaments}
 disabled={loadingDb}
 className="text-[13px] font-bold text-[#0369a1] hover:underline flex items-center space-x-1 shrink-0 disabled:opacity-50"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? "animate-spin" : ""}`} />
 <span>{loadingDb ? "Đang tải…" : "Tải lại từ CSDL"}</span>
 </button>
 </div>

 <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
  <p className="text-[13px] text-slate-500">
  {activeTournament
  ? `Đang thao tác trên giải: ${activeTournament.title}`
  : "Chưa chọn giải — hãy mở tab “Giải Đấu & BXH” và chọn một giải."}
  </p>
  <button
  type="button"
  onClick={() => openEditModal(activeTournament)}
  disabled={!activeTournament}
  className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-extrabold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
  >
  <Pencil className="w-3.5 h-3.5" />
  <span>Sửa Thông Tin Giải</span>
  </button>
 </div>

 {/* Chưa chọn giải có nhánh đấu */}
 {!activeBracket && (
 <p className="text-sm text-slate-500 py-4 sm:py-6 text-center">
 {dbTournaments.length === 0
 ? "Chưa đọc được danh sách giải từ CSDL."
 : "Chưa giải nào trong CSDL đã bốc thăm. Mở tab “Giải Đấu & BXH › Bảng Đấu & Nhánh Bracket” để bốc thăm và nhập kết quả."}
 </p>
 )}

 {/* TAB CONTENT: BXH TÍNH TỪ TRẬN ĐÃ ĐÁ */}
 {bottomTab === "standings" && activeBracket && (
 standings.length === 0 ? (
 <p className="text-sm text-slate-500 py-4 sm:py-6 text-center">
 Chưa có trận nào có kết quả nên chưa xếp hạng được.
 </p>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse min-w-[620px]">
 <thead>
 <tr className="border-b border-slate-200 text-[13px] font-black text-slate-500 tracking-wider">
 <th className="py-3 px-3">Hạng</th>
 <th className="py-3 px-3">Đội Bóng (FC)</th>
 <th className="py-3 px-3 text-center">Trận</th>
 <th className="py-3 px-3 text-center">T</th>
 <th className="py-3 px-3 text-center">H</th>
 <th className="py-3 px-3 text-center">B</th>
 <th className="py-3 px-3 text-center">HS</th>
 <th className="py-3 px-3 text-center">Điểm</th>
 <th className="py-3 px-3 text-right">Phong độ</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 text-[13px] font-medium">
 {standings.map((row: any, idx: number) => (
 <tr
 key={row.team}
 className={`hover:bg-slate-50 transition-colors ${
 idx === 0 ? "bg-sky-50 " : ""
 }`}
 >
 <td className="py-3 px-3 font-mono font-bold text-slate-900 sticky left-0 bg-white ">
 #{idx + 1}
 </td>
 <td className="py-3 px-3 font-bold text-slate-900 ">
 {idx === 0 ? "👑 " : ""}
 {row.team}
 </td>
 <td className="py-3 px-3 text-center font-mono text-slate-600 ">{row.played}</td>
 <td className="py-3 px-3 text-center font-mono font-bold text-sky-700 ">{row.won}</td>
 <td className="py-3 px-3 text-center font-mono font-bold text-amber-600 ">{row.drawn}</td>
 <td className="py-3 px-3 text-center font-mono font-bold text-rose-600">{row.lost}</td>
 <td className="py-3 px-3 text-center font-mono font-bold text-[#0369a1] ">
 {row.diff > 0 ? `+${row.diff}` : row.diff}
 </td>
 <td className="py-3 px-3 text-center font-mono font-black text-slate-900 ">{row.points}</td>
 <td className="py-3 px-3 text-right">
 <FormDots form={row.form} size="sm" />
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )
 )}

 {/* TAB CONTENT: KẾT QUẢ & VUA PHÁ LƯỚI (đọc từ goal_events) */}
 {bottomTab === "var_logs" && activeBracket && (
 <div className="space-y-3 sm:space-y-4">
 <div>
 <p className="text-[13px] font-black text-slate-500 mb-2">
 Kết quả đã ghi nhận ({doneMatches.length})
 </p>
 {doneMatches.length === 0 ? (
 <p className="text-[13px] text-slate-500">Chưa có trận nào kết thúc.</p>
 ) : (
 <div className="space-y-2">
 {doneMatches.map((m: any) => (
 <div
 key={m.matchId}
 className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-[13px]"
 >
 <span className="font-mono text-slate-500 shrink-0">{m.matchId}</span>
 <span className="font-bold text-slate-800 truncate">
 {m.teamA} <span className="font-mono text-sky-700 ">{m.scoreA}-{m.scoreB}</span> {m.teamB}
 </span>
 <span className="font-mono text-slate-500 shrink-0">
 {m.matchDate ? m.matchDate.split("-").reverse().join("/") : "—"}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>

 <div>
 <p className="text-[13px] font-black text-slate-500 mb-2">
 Vua phá lưới giải ({topScorers.length})
 </p>
 {topScorers.length === 0 ? (
 <p className="text-[13px] text-slate-500">
 Chưa có dữ liệu cầu thủ ghi bàn. Khi nhập kết quả ở tab Bracket, mục “Ghi bàn/kiến tạo” sẽ ghi vào bảng{" "}
 <span className="font-mono">goal_events</span>.
 </p>
 ) : (
 <div className="space-y-2">
 {topScorers.map((s: any, idx: number) => (
 <div
 key={`${s.playerName}-${s.teamName}`}
 className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-[13px]"
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <span className="w-6 h-6 rounded-full bg-[#0369a1] text-white font-black text-[13px] flex items-center justify-center shrink-0">
 {idx + 1}
 </span>
 <div className="min-w-0">
 <p className="font-bold text-slate-900 truncate">{s.playerName}</p>
 <p className="text-[13px] text-slate-500 truncate">{s.teamName}</p>
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
 <span className="text-[13px] font-black tracking-wide">{card.label}</span>
 </div>
 <p className={`text-base sm:text-lg font-black ${card.tone}`}>
 {formatMoney(card.value)}
 </p>
 <p className="text-[13px] text-slate-500">{card.hint}</p>
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
 <span className="text-[13px] font-mono text-slate-500">
 {finance.totalTeams}/{finance.capacity || "∞"} đội · {finance.fillPercent}%
 </span>
 </div>
 <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
 <div
 className="h-full bg-[#0369a1] rounded-full transition-all"
 style={{ width: `${Math.max(2, finance.fillPercent)}%` }}
 />
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[13px]">
 <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
 <span className="block text-slate-500 text-[13px] font-bold">Đã xác nhận</span>
 <strong className="text-emerald-700 font-black">{finance.confirmedTeams}</strong>
 </div>
 <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
 <span className="block text-slate-500 text-[13px] font-bold">Chờ duyệt</span>
 <strong className="text-amber-700 font-black">{finance.pendingTeams}</strong>
 </div>
 <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
 <span className="block text-slate-500 text-[13px] font-bold">Đội giả lập</span>
 <strong className="text-slate-700 font-black">{finance.simulatedTeams}</strong>
 </div>
 <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
 <span className="block text-slate-500 text-[13px] font-bold">Lệ phí/đội</span>
 <strong className="text-sky-700 font-black">{formatMoney(finance.entryFee)}</strong>
 </div>
 </div>
 <p className="text-[13px] text-slate-500 leading-relaxed">
 Đội do nút “Giả lập đội” sinh ra là dữ liệu thử nghiệm nên không tính vào doanh thu thực tế.
 </p>
 </div>
 </>
 )}
 </div>
 )}

 {/* TAB CONTENT: LỊCH THI ĐẤU THẬT */}
 {bottomTab === "schedule" && activeBracket && (
  scheduledMatches.length === 0 ? (
 <p className="text-sm text-slate-500 py-4 sm:py-6 text-center">
 BTC chưa bấm “Xếp lịch thi đấu” cho giải này nên chưa có ngày/giờ cho từng trận.
 </p>
 ) : (
 <div className="space-y-2">
 {scheduledMatches.map((m: any) => (
 <div
 key={m.matchId}
 className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[13px]"
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <span className="font-mono text-slate-500 shrink-0">{m.matchId}</span>
 <span className="font-bold text-slate-900 truncate">
 {m.teamA} vs {m.teamB}
 </span>
 </div>
 <div className="flex items-center gap-2 font-mono text-slate-500 shrink-0">
 {m.matchDate && (
 <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-700 font-bold">
 {m.matchDate.split("-").reverse().join("/")}
 </span>
 )}
 {m.timeSlot && <span className="font-bold text-slate-700 ">{m.timeSlot}</span>}
 {m.pitchName && <span className="text-sky-800 truncate max-w-[200px]">{m.pitchName}</span>}
 </div>
 </div>
 ))}
 </div>
 )
 )}

 </div>

 </div>

 {/* RIGHT 4 COLS: THỐNG KÊ GIẢI + QUỸ THƯỞNG THẬT */}
 <div className="lg:col-span-4 space-y-4 sm:space-y-8">

 {/* 1. THỐNG KÊ GIẢI ĐẤU (đếm từ CSDL) */}
 <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-3 sm:space-y-6">
 <div className="flex items-center space-x-3 border-b border-slate-200 pb-4">
 <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 border border-[#0369a1]/30 flex items-center justify-center text-sky-700 shrink-0">
 <Cpu className="w-5 h-5" />
 </div>
 <div>
 <span className="text-[13px] font-black text-sky-700 tracking-wider">
 Thống kê giải đấu
 </span>
 <h4 className="text-base font-black text-slate-900 ">Đăng Ký &amp; Nhánh Đấu</h4>
 </div>
 </div>

 <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
 {activeTournament ? (
 <>
 <div className="flex items-center justify-between text-[13px]">
 <span className="text-slate-500 font-bold">Đội đã đăng ký:</span>
 <span className="text-sky-800 font-mono font-black">
 {(activeTournament.teams?.length ?? 0)}/{activeTournament.totalTeams ?? 0}
 </span>
 </div>
 <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
 <div
 className="h-full bg-emerald-400 transition-all"
 style={{
 width: `${
 activeTournament.totalTeams
 ? Math.min(
 100,
 Math.round(
 ((activeTournament.teams?.length ?? 0) / activeTournament.totalTeams) * 100
 )
 )
 : 0
 }%`,
 }}
 />
 </div>
 <div className="flex items-center justify-between text-[13px]">
 <span className="text-slate-500 font-bold">Lệ phí mỗi đội:</span>
 <span className="font-mono font-black">{formatMoney(activeTournament.entryFee ?? 0)}</span>
 </div>
 <div className="flex items-center justify-between text-[13px]">
 <span className="text-slate-500 font-bold">Đội chờ xác nhận lệ phí:</span>
 <span className="font-mono font-black text-amber-600 ">
 {(activeTournament.teams ?? []).filter((z: any) => z.registrationStatus === "PENDING_PAYMENT").length}
 </span>
 </div>
 </>
 ) : (
 <p className="text-[13px] text-slate-500">Chưa chọn được giải nào từ CSDL.</p>
 )}
 </div>

 <button
 onClick={() => onOpenBracket?.(String(activeTournament?.id))}
 className="w-full py-3 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95"
 >
 <Sparkles className="w-4 h-4" />
 <span>Mở Bảng Điều Hành Bốc Thăm</span>
 </button>
 
  {/* Thêm đội thủ công — BTC nhập tay đội vào giải (không qua form đăng ký của cầu thủ) */}
  <button
  type="button"
  onClick={() => setShowAddTeamForm((v) => !v)}
  disabled={!activeTournament}
  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-black shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
  title="Nhập tay một đội bóng vào giải (đội trưởng, SĐT, số cầu thủ) — đội được đánh dấu đã đóng phí nên sẵn sàng bốc thăm"
  >
  <UserPlus className="w-4 h-4" />
  <span>Thêm Đội Thủ Công</span>
  </button>
  {/* FORM THÊM ĐỘI THỦ CÔNG — hiển thị INLINE tại chỗ (KHÔNG dùng popup/modal) */}
  {showAddTeamForm && (
  <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-3.5 space-y-3">
   <div className="flex items-center justify-between gap-2">
    <span className="text-[13px] font-black tracking-wider text-emerald-800 flex items-center gap-1.5">
     <UserPlus className="w-3.5 h-3.5" /> Thêm đội thủ công vào giải
    </span>
    <button
     type="button"
     onClick={() => setShowAddTeamForm(false)}
     className="text-emerald-700 hover:text-emerald-900 p-0.5"
     aria-label="Đóng form thêm đội"
    >
     <X className="w-3.5 h-3.5" />
    </button>
   </div>

   <input
    type="text"
    value={addTeamForm.teamName}
    onChange={(e) => setAddTeamForm((f) => ({ ...f, teamName: e.target.value }))}
    placeholder="Tên đội * — VD: FC Đại Việt Đà Nẵng"
    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
   />
   <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
    <input
     type="text"
     value={addTeamForm.captainName}
     onChange={(e) => setAddTeamForm((f) => ({ ...f, captainName: e.target.value }))}
     placeholder="Đội trưởng"
     className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
    />
    <input
     type="tel"
     value={addTeamForm.captainPhone}
     onChange={(e) => setAddTeamForm((f) => ({ ...f, captainPhone: e.target.value }))}
     placeholder="Số điện thoại"
     className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
    />
    <input
     type="number"
     min={1}
     max={30}
     value={addTeamForm.memberCount}
     onChange={(e) => setAddTeamForm((f) => ({ ...f, memberCount: Number(e.target.value) }))}
     placeholder="Số cầu thủ"
     aria-label="Số cầu thủ"
     className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
    />
   </div>
   <p className="text-[13px] text-emerald-800/80 leading-relaxed">
    Đội thêm tay được đánh dấu <strong>đã đóng lệ phí</strong> nên sẵn sàng bốc thăm. Danh sách đội sẽ đổi — cần bốc thăm lại.
   </p>
   <div className="flex items-center gap-2">
    <button
     type="button"
     onClick={() => setShowAddTeamForm(false)}
     className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-[13px] font-extrabold border border-slate-200 transition-all active:scale-95"
    >
     Hủy
    </button>
    <button
     type="button"
     onClick={handleAddManualTeam}
     disabled={addingTeam}
     className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-extrabold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
    >
     {addingTeam ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
     {addingTeam ? "Đang thêm…" : "Thêm vào giải"}
    </button>
   </div>
  </div>
  )}
  <button
    onClick={handleCreateRandomTournament}
    className="w-full py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-[13px] border-2 border-dashed border-slate-300 transition-all flex items-center justify-center space-x-2 active:scale-95"
    title="Tự động tạo giải thử (16 đội, loại trực tiếp, sân ngẫu nhiên) + bốc thăm ngay"
  >
    <RefreshCw className="w-4 h-4" />
    <span>Tạo giải Test ngẫu nhiên & Bốc thăm</span>
  </button>
  </div>

  {/* ===== QUYỀN THAM GIA GIẢI (ai cũng tham gia / chỉ mời qua email) — hiển thị INLINE ===== */}
  <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-5">
   <div className="flex items-center justify-between border-b border-slate-100 pb-4">
    <div className="flex items-center space-x-2.5">
     <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 border border-[#0369a1]/30 flex items-center justify-center text-sky-700 shrink-0">
      <ShieldCheck className="w-5 h-5" />
     </div>
     <div>
      <span className="text-[13px] font-black text-sky-700 tracking-wider">
       Quyền tham gia
      </span>
      <h4 className="text-sm font-black text-slate-900 ">
       {activeTournament ? activeTournament.title : "Chưa chọn giải"}
      </h4>
     </div>
    </div>
    {activeTournament && (
     <span className={`px-2.5 py-1 rounded-full text-[13px] font-black border ${
      joinMode === "INVITE_ONLY"
       ? "bg-amber-100 text-amber-800 border-amber-300"
       : "bg-emerald-100 text-emerald-800 border-emerald-300"
     }`}>
      {joinMode === "INVITE_ONLY" ? "🔒 Chỉ mời qua email" : "🔓 Ai cũng tham gia"}
     </span>
    )}
   </div>

   {!activeTournament ? (
    <p className="text-[13px] text-slate-500">Chọn một giải ở danh sách bên trái để đặt quyền tham gia.</p>
   ) : (
    <>
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {/* Ai cũng tham gia */}
      <button
       type="button"
       onClick={() => handleSaveAccess("PUBLIC")}
       disabled={accessBusy || joinMode === "PUBLIC"}
       className={`p-3.5 rounded-2xl border-2 text-left transition-all disabled:opacity-70 ${
        joinMode === "PUBLIC"
         ? "border-emerald-400 bg-emerald-50 shadow-xs"
         : "border-slate-200 bg-white hover:border-emerald-300"
       }`}
      >
       <div className="flex items-center gap-2">
        <Unlock className={`w-4 h-4 ${joinMode === "PUBLIC" ? "text-emerald-600" : "text-slate-400"}`} />
        <span className="text-[13px] font-black text-slate-900">Ai cũng có thể tham gia</span>
       </div>
       <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
        Mọi người có tài khoản đều đăng ký đội thi được. Phù hợp giải phong trào mở rộng.
       </p>
      </button>

      {/* Chỉ mời qua email */}
      <button
       type="button"
       onClick={() => handleSaveAccess("INVITE_ONLY")}
       disabled={accessBusy || joinMode === "INVITE_ONLY"}
       className={`p-3.5 rounded-2xl border-2 text-left transition-all disabled:opacity-70 ${
        joinMode === "INVITE_ONLY"
         ? "border-amber-400 bg-amber-50 shadow-xs"
         : "border-slate-200 bg-white hover:border-amber-300"
       }`}
      >
       <div className="flex items-center gap-2">
        <Lock className={`w-4 h-4 ${joinMode === "INVITE_ONLY" ? "text-amber-700" : "text-slate-400"}`} />
        <span className="text-[13px] font-black text-slate-900">Chỉ ai được mời qua email</span>
       </div>
       <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
        Giải kín — chỉ email trong danh sách bên dưới mới đăng ký thi được.
       </p>
      </button>
     </div>

     {/* Danh sách email mời */}
     {joinMode === "INVITE_ONLY" && (
      <div className="space-y-2.5 pt-1">
       <div className="flex items-center gap-2">
        <input
         type="email"
         value={inviteInput}
         onChange={(e) => setInviteInput(e.target.value)}
         onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddInvite(); } }}
         placeholder="Nhập email cầu thủ / đội trưởng rồi Enter"
         className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-[13px]"
        />
        <button
         type="button"
         onClick={handleAddInvite}
         disabled={accessBusy || !inviteInput.trim()}
         className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-extrabold transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap"
        >
         <Plus className="w-3.5 h-3.5" />
         Mời
        </button>
       </div>

       {inviteEmails.length === 0 ? (
        <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
         Chưa có email nào được mời. Cho tới khi có email trong danh sách, không ai đăng ký được vào giải này.
        </p>
       ) : (
        <div className="flex flex-wrap gap-1.5">
         {inviteEmails.map((em) => (
          <span key={em} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[13px] font-mono font-bold">
           {em}
           <button
            type="button"
            onClick={() => handleRemoveInvite(em)}
            disabled={accessBusy}
            aria-label={`Gỡ lời mời ${em}`}
            className="w-4 h-4 rounded-full hover:bg-amber-300 flex items-center justify-center transition-colors"
           >
            <X className="w-3 h-3" />
           </button>
          </span>
         ))}
        </div>
       )}
       <p className="text-[13px] text-slate-500">
        Đã mời {inviteEmails.length} email. Cầu thủ chỉ đăng ký được khi đăng nhập đúng một email trong danh sách này.
       </p>
      </div>
     )}
    </>
   )}
  </div>
 {/* 2. QUỸ THƯỞNG THẬT (prizePool từ CSDL) */}
 <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-6">
 <div className="flex items-center justify-between border-b border-slate-100 pb-4">
 <div className="flex items-center space-x-2.5">
 <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 border border-[#0369a1]/30 flex items-center justify-center text-sky-700 shrink-0">
 <Lock className="w-5 h-5" />
 </div>
 <div>
 <span className="text-[13px] font-black text-sky-700 tracking-wider">
 Quỹ giải thưởng
 </span>
 <h4 className="text-sm font-black text-slate-900 ">
 {activeTournament ? activeTournament.title : "Chưa chọn giải"}
 </h4>
 </div>
 </div>
 </div>

 {!activeTournament || !activeTournament.prizePool ? (
 <p className="text-[13px] text-slate-500">
 Giải này chưa khai báo giải thưởng trong CSDL.
 </p>
 ) : (
 <>
 <div className="text-center bg-slate-50 p-3 sm:p-5 rounded-2xl border border-slate-200 space-y-1">
 <span className="text-[13px] font-bold text-slate-500 block">
 Tổng giải thưởng
 </span>
 <span className="text-xl sm:text-3xl font-black font-mono text-sky-700 tracking-tight">
 {formatMoney(activeTournament.prizePool)}
 </span>
 <span className="text-[13px] text-slate-500 font-bold block pt-1">
 Số tiền do ban tổ chức khai trong hồ sơ giải
 </span>
 </div>

 <p className="text-[13px] text-slate-500 leading-relaxed">
 Hệ thống chưa có bảng phân bổ giải thưởng theo hạng trong CSDL — việc chia tiền do ban tổ chức thực hiện bên ngoài.
 </p>
 </>
 )}
 </div>

 {/* 3. THÔNG TIN SÂN & THỜI GIAN THI ĐẤU (thật) */}
 <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
 <h4 className="text-[13px] font-black text-slate-500">
 Thông Tin Giải Từ CSDL
 </h4>

 {!activeTournament ? (
 <p className="text-[13px] text-slate-500">Chưa chọn được giải.</p>
 ) : (
 <div className="space-y-2 text-[13px]">
 {[
 { label: "Thể thức môn", value: sportLabel(activeTournament.sportType) },
 { label: "Danh sách thi", value: formatLabel(activeTournament.format) },
 { label: "Ngày mở", value: activeTournament.startDate ?? "—" },
 { label: "Ngày kết thúc", value: activeTournament.endDate ?? "—" },
 { label: "Sân thi đấu", value: activeTournament.pitchName ?? activeTournament.location ?? "—" },
 { label: "Hạn đăng ký", value: activeTournament.registrationDeadline ?? "—" },
 ].map((r) => (
 <div
 key={r.label}
 className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
 >
 <span className="text-slate-500 shrink-0">{r.label}</span>
 <span className="font-bold text-slate-900 text-right truncate">{r.value}</span>
 </div>
 ))}
 </div>
 )}
 </div>

 </div>

  {/* Kênh liên lạc B2B với Chủ Sân */}
  {user?.role === "ORGANIZER" && (
  <>
  {onOpenTournamentChat && (
  <button
  type="button"
  onClick={onOpenTournamentChat}
  title="Vào phòng chat riêng của giải đấu để trao đổi với đội bóng và cầu thủ"
  className="w-full mb-3 px-4 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[13px] shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
  >
  <MessageCircle className="w-4 h-4" />
  <span>Chat Giải Đấu — trao đổi với đội bóng & cầu thủ</span>
  </button>
  )}
  <BusinessContacts viewerRole="ORGANIZER" onStartDm={onStartDm} />
  </>
  )}

 {/* MODAL SỬA THÔNG TIN GIẢI ĐẤU */}
 {showEditModal && (
 <div id="edit-tournament-inline" className="w-full animate-fade-in">
 <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl mx-auto border border-slate-200 overflow-hidden">
 <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
 <div className="flex items-center gap-2.5">
 <Pencil className="w-5 h-5 text-[#0369a1]" />
 <h3 className="font-black text-lg text-slate-900">Sửa Thông Tin Giải Đấu</h3>
 </div>
 <button
 type="button"
 onClick={() => setShowEditModal(false)}
 className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
 aria-label="Đóng"
 >
 <X className="w-5 h-5" />
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
 <label className="font-extrabold text-slate-800 text-sm">Sân thi đấu</label>
 <input
 type="text"
 value={editForm.pitchName}
 onChange={(e) => setEditForm((f) => ({ ...f, pitchName: e.target.value }))}
 placeholder="VD: Cụm Sân Turfzone Đà Nẵng"
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
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
 <p className="text-[13px] font-extrabold text-slate-600">
 Tài khoản nhận lệ phí (hiển thị cho đội khi đăng ký)
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <input
 type="text"
 value={editForm.bankCode}
 onChange={(e) => setEditForm((f) => ({ ...f, bankCode: e.target.value }))}
 placeholder="Mã ngân hàng"
 className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-[13px]"
 />
 <input
 type="text"
 value={editForm.bankAccount}
 onChange={(e) => setEditForm((f) => ({ ...f, bankAccount: e.target.value }))}
 placeholder="Số tài khoản"
 className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-[13px]"
 />
 <input
 type="text"
 value={editForm.accountName}
 onChange={(e) => setEditForm((f) => ({ ...f, accountName: e.target.value }))}
 placeholder="Chủ tài khoản"
 className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-[13px]"
 />
 </div>
 </div>

 <div className="flex gap-3 pt-1">
 <button
 type="button"
 onClick={() => setShowEditModal(false)}
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
 </div>
 )}

 </div>
 </div>
 );
}
