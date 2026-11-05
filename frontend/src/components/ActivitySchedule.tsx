"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  RefreshCw,
  CheckCircle2,
  X,
  Copy,
  Navigation,
  AlertTriangle,
  Bell,
  Users,
  Check,
} from "lucide-react";
import { API_BASE_URL, apiRequest, fetchWithTimeout } from "@/lib/api";
import { pitchTypeLabel } from "@/lib/pitchLabels";
import { isPastDay } from "@/lib/dateUtils";
import { sendHandoverReminderApi } from "@/lib/pitchService";
import {
  fetchTournaments,
  type Tournament,
  type TournamentBracketData,
} from "@/lib/tournamentService";

interface ActivityScheduleProps {
  user?: any;
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenBracket?: (tournamentId: number | string) => void;
}

type MatchRow = {
  key: string;
  matchId: string;
  roundName: string;
  tournamentId: number;
  tournamentTitle: string;
  teamA: string;
  teamB: string;
  formA?: string;
  recordA?: string;
  formB?: string;
  recordB?: string;
  scoreA?: number;
  scoreB?: number;
  status: string;
  matchDate?: string;
  timeSlot?: string;
  pitchName?: string;
  startAt?: Date;
};

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const money = (n?: number | null) => `${(n ?? 0).toLocaleString("vi-VN")}đ`;

function parseStart(date?: string, slot?: string): Date | undefined {
  if (!date) return undefined;
  const hhmm = /(\d{1,2}):(\d{2})/.exec(slot ?? "");
  const d = new Date(`${date}T${hhmm ? `${hhmm[1].padStart(2, "0")}:${hhmm[2]}` : "00:00"}:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseSlotRange(dateStr?: string, slotStr?: string): { start?: Date; end?: Date } {
  if (!dateStr || !slotStr) return {};
  const m = /(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/.exec(slotStr);
  if (!m) {
    const s = parseStart(dateStr, slotStr);
    return { start: s, end: s ? new Date(s.getTime() + 120 * 60000) : undefined };
  }
  const start = new Date(`${dateStr}T${m[1].padStart(2, "0")}:${m[2]}:00`);
  const end = new Date(`${dateStr}T${m[3].padStart(2, "0")}:${m[4]}:00`);
  return {
    start: Number.isNaN(start.getTime()) ? undefined : start,
    end: Number.isNaN(end.getTime()) ? undefined : end,
  };
}

function prettyDate(iso?: string): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export const ActivitySchedule: React.FC<ActivityScheduleProps> = ({
  user,
  onNavigateTab,
  onOpenBracket,
}) => {
  const [activeFilter, setActiveFilter] = useState<
    "bookings" | "upcoming" | "tournaments" | "matchmaking" | "history"
  >("bookings");

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedMatchKey, setSelectedMatchKey] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

  // SOS Mượn Chân state
  const [sosBookingId, setSosBookingId] = useState<number | null>(null);
  const [sosPosition, setSosPosition] = useState<string>("BAT_KY");
  const [sosCount, setSosCount] = useState<number>(1);
  const [sosFeeModel, setSosFeeModel] = useState<string>("HOST_COVER");
  const [sosFeeAmount, setSosFeeAmount] = useState<number>(30000);
  const [sosNote, setSosNote] = useState<string>("");
  const [sosPosting, setSosPosting] = useState<boolean>(false);
  const [sosSuccessId, setSosSuccessId] = useState<number | null>(null);

  // Handover reminder state
  const [sendingReminderId, setSendingReminderId] = useState<number | null>(null);
  const [reminderSent, setReminderSent] = useState<boolean>(false);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cancelMyBooking = async (b: any) => {
    try {
      setCancellingId(b.id);
      await apiRequest<any>(`/api/v1/pitches/bookings/${b.id}/cancel-by-customer`, {
        method: "POST",
        body: JSON.stringify({ reason: "Người đặt tự hủy từ màn Vé của tôi" }),
      });
      setNotice(`Đã hủy vé ${b.code}. Khung giờ đã mở lại.`);
      await load();
    } catch (e: any) {
      setNotice(e?.message || "Không hủy được vé. Vui lòng thử lại.");
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [ts, ps] = await Promise.all([
        fetchTournaments().catch(() => [] as Tournament[]),
        fetchWithTimeout(`${API_BASE_URL}/api/v1/community/matchmaking-posts`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [] as any[]),
      ]);
      setTournaments(ts);
      setPosts(Array.isArray(ps) ? ps : []);

      const phone = (user?.phone ?? "").toString().replace(/\s/g, "");
      if (phone.length >= 8) {
        const bs = await apiRequest<any[]>(
          `/api/v1/pitches/bookings/search?query=${encodeURIComponent(phone)}`
        )
          .then((r) => (Array.isArray(r) ? r : []))
          .catch(() => [] as any[]);
        setMyBookings(Array.isArray(bs) ? bs : []);
      } else {
        setMyBookings([]);
      }
    } catch (e: any) {
      setLoadError(e?.message || "Không tải được dữ liệu từ máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.phone]);

  const allMatches = useMemo<MatchRow[]>(() => {
    const rows: MatchRow[] = [];
    for (const t of tournaments) {
      if (!t.bracketJson) continue;
      let b: TournamentBracketData | null = null;
      try {
        const p = JSON.parse(t.bracketJson) as TournamentBracketData;
        b = p && Array.isArray(p.rounds) ? p : null;
      } catch {
        b = null;
      }
      if (!b) continue;
      for (const r of b.rounds) {
        for (const m of r.matches) {
          if (!m.teamA || !m.teamB || m.status === "BYE") continue;
          rows.push({
            key: `t${t.id}-${m.matchId}`,
            matchId: m.matchId,
            roundName: r.name,
            tournamentId: t.id,
            tournamentTitle: t.title,
            teamA: m.teamA.name,
            teamB: m.teamB.name,
            formA: m.teamA.form ?? "",
            recordA: m.teamA.record ?? "0-0-0",
            formB: m.teamB.form ?? "",
            recordB: m.teamB.record ?? "0-0-0",
            scoreA: m.scoreA,
            scoreB: m.scoreB,
            status: m.status ?? "SCHEDULED",
            matchDate: m.matchDate,
            timeSlot: m.timeSlot,
            pitchName: m.pitchName ?? t.pitchName ?? t.location ?? undefined,
            startAt: parseStart(m.matchDate, m.timeSlot),
          });
        }
      }
    }
    return rows.sort((a, b) => (a.startAt?.getTime() ?? Infinity) - (b.startAt?.getTime() ?? Infinity));
  }, [tournaments]);

  const upcoming = useMemo(
    () => allMatches.filter((m) => m.status !== "DONE" && (m.startAt ? m.startAt.getTime() > now.getTime() : true)),
    [allMatches, now]
  );
  const doneMatches = useMemo(() => allMatches.filter((m) => m.status === "DONE"), [allMatches]);
  const matchedPosts = useMemo(() => posts.filter((p: any) => p.status === "MATCHED"), [posts]);

  // Vé đặt sân hôm nay hoặc sắp diễn ra gần nhất để đếm ngược
  const todayActiveBooking = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayList = myBookings.filter(
      (b) => b.status !== "CANCELLED" && b.bookingDate === todayStr
    );
    if (todayList.length > 0) return todayList[0];
    const upcomingList = myBookings
      .filter((b) => b.status !== "CANCELLED" && !isPastDay(b.bookingDate))
      .sort((a, b) => (a.bookingDate || "").localeCompare(b.bookingDate || ""));
    return upcomingList[0] || null;
  }, [myBookings]);

  // Tính toán đếm ngược ca đá & tiến độ
  const countdownData = useMemo(() => {
    if (!todayActiveBooking) return null;
    const { start, end } = parseSlotRange(todayActiveBooking.bookingDate, todayActiveBooking.timeSlot);
    if (!start || !end) return null;

    const startMs = start.getTime();
    const endMs = end.getTime();
    const nowMs = now.getTime();

    const isUpcoming = nowMs < startMs;
    const isPlaying = nowMs >= startMs && nowMs < endMs;
    const isOverdue = nowMs >= endMs;

    let targetMs = isUpcoming ? startMs - nowMs : isPlaying ? endMs - nowMs : nowMs - endMs;
    if (targetMs < 0) targetMs = 0;

    const totalSeconds = Math.floor(targetMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const timeFormatted = `${hours > 0 ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const totalDurationMs = Math.max(1, endMs - startMs);
    const elapsedMs = Math.max(0, nowMs - startMs);
    const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));
    const isNearEnd = isPlaying && endMs - nowMs <= 10 * 60 * 1000;

    return {
      booking: todayActiveBooking,
      start,
      end,
      isUpcoming,
      isPlaying,
      isOverdue,
      isNearEnd,
      timeFormatted,
      progressPercent,
      minutesLeft: Math.floor((endMs - nowMs) / 60000),
    };
  }, [todayActiveBooking, now]);

  const handlePostSosFromBooking = async (b: any) => {
    try {
      setSosPosting(true);
      const teamName = b.customerName ? `FC ${b.customerName}` : (user?.fullName || "FC Đội Nhà");
      const pitchName = pitchTypeLabel(b.courtName) || b.courtType || "Sân bóng";
      const matchTime = `${b.timeSlot} ngày ${prettyDate(b.bookingDate)}`;
      const note = sosNote.trim() || `Đội cần mượn chân gấp cho ca đá ${b.timeSlot} tại ${pitchName}. Anh em đam mê vào giao lưu nhé!`;

      await apiRequest<any>("/api/v1/community/matchmaking-posts", {
        method: "POST",
        body: JSON.stringify({
          teamName,
          captainName: user?.fullName || b.customerName || "Đội trưởng",
          captainPhone: user?.phone || b.customerPhone || "",
          pitchName,
          address: "",
          matchTime,
          pitchType: b.courtType || "SAN_7",
          paymentModel: sosFeeModel,
          estimatedFee: sosFeeModel === "HOST_COVER" ? 0 : sosFeeAmount,
          note,
          postType: "SOS_GUEST",
          neededPosition: sosPosition,
          neededCount: sosCount,
        }),
      });

      setSosSuccessId(b.id);
      setNotice(`✓ Đã phát tin SOS mượn chân lên Chợ Kèo thành công cho ca ${b.timeSlot}!`);
      setTimeout(() => setNotice(null), 4000);
      setSosBookingId(null);
    } catch (err: any) {
      setNotice(err?.message || "Lỗi khi phát tin SOS. Vui lòng thử lại.");
    } finally {
      setSosPosting(false);
    }
  };

  const handleSendHandoverReminder = async (b: any) => {
    try {
      setSendingReminderId(b.id);
      await sendHandoverReminderApi(b.id);
      setReminderSent(true);
      setNotice("✓ Đã gửi lời nhắc bàn giao sân văn minh đến đội và chủ sân!");
      setTimeout(() => {
        setNotice(null);
        setReminderSent(false);
      }, 4000);
    } catch (err: any) {
      setNotice(err?.message || "Lỗi gửi nhắc nhở. Vui lòng thử lại.");
    } finally {
      setSendingReminderId(null);
    }
  };

  const filterTabs: { id: typeof activeFilter; label: string; count: number }[] = [
    { id: "bookings", label: "Vé Đặt Sân Của Tôi", count: myBookings.length },
    { id: "upcoming", label: "Lịch Đấu Sắp Tới", count: upcoming.length },
    { id: "tournaments", label: "Tất Cả Trận Giải", count: allMatches.length },
    { id: "matchmaking", label: "Kèo Đã Ghép", count: matchedPosts.length },
    { id: "history", label: "Kết Quả Đã Đá", count: doneMatches.length },
  ];

  const dateBox = (m: MatchRow) => {
    const d = m.startAt ?? (m.matchDate ? new Date(`${m.matchDate}T00:00:00`) : null);
    if (!d) return { top: "Lịch", num: "—", bot: m.timeSlot?.slice(0, 5) || "—" };
    return {
      top: WEEKDAY[d.getDay()],
      num: String(d.getDate()),
      bot: m.timeSlot?.slice(0, 5) || d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const visibleMatches =
    activeFilter === "upcoming"
      ? upcoming
      : activeFilter === "tournaments"
      ? allMatches
      : activeFilter === "history"
      ? doneMatches
      : [];

  return (
    <div className="w-full space-y-4 pb-12 text-slate-900">
      {/* 1. UNIFIED HEADER & TABS */}
      <section className="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Vé Đặt Sân & Lịch Thi Đấu
            </h1>
            <p className="text-[14px] text-slate-600 mt-1">
              Tra cứu vé đặt sân của bạn, lịch thi đấu giải và các kèo giao hữu đã chốt.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white text-slate-800 text-[14px] font-bold hover:bg-slate-50 border border-slate-300 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-[#0369a1] ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Đang tải..." : "Làm mới"}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab("booking")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>+ Đặt Sân Mới</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveFilter(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[14px] font-bold border transition-colors cursor-pointer ${
                activeFilter === t.id
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`px-2 py-0.5 rounded text-[13px] font-mono font-bold ${
                  activeFilter === t.id ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      {notice && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-[14px] font-bold flex items-center justify-between gap-2 animate-fade-in">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* WIDGET: ĐỒNG HỒ ĐẾM NGƯỢC CA ĐÁ & NHẮC TRẢ SÂN VĂN MINH */}
      {countdownData && (
        <section className={`p-4 sm:p-5 rounded-lg border transition-all ${
          countdownData.isNearEnd
            ? "bg-amber-50/70 border-amber-300"
            : countdownData.isOverdue
            ? "bg-rose-50/70 border-rose-300"
            : countdownData.isPlaying
            ? "bg-sky-50/60 border-sky-300"
            : "bg-white border-slate-300"
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded text-[13px] font-bold border ${
                  countdownData.isNearEnd
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : countdownData.isOverdue
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : countdownData.isPlaying
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-sky-100 text-sky-900 border-sky-300"
                }`}>
                  {countdownData.isNearEnd
                    ? "⚠️ Sắp hết ca (Dưới 10 phút)"
                    : countdownData.isOverdue
                    ? "⚠️ Đã quá giờ ca đá"
                    : countdownData.isPlaying
                    ? "🟢 Đang trong ca thi đấu"
                    : "📅 Sắp đến giờ bóng lăn"}
                </span>
                <span className="font-bold text-slate-800 text-[14px]">
                  {pitchTypeLabel(countdownData.booking.courtName) || countdownData.booking.courtName} • {countdownData.booking.timeSlot}
                </span>
                <span className="text-[13px] text-slate-500 font-mono">
                  ({prettyDate(countdownData.booking.bookingDate)})
                </span>
              </div>

              <p className="text-[14px] text-slate-600">
                {countdownData.isNearEnd
                  ? "Ca đá của bạn còn dưới 10 phút. Quý anh em vui lòng chuẩn bị nhặt bóng, dọn đồ và bàn giao sân sạch sẽ cho đội tiếp theo!"
                  : countdownData.isOverdue
                  ? "Ca đá đã kết thúc quá thời gian quy định. Quý anh em vui lòng nhường sân ngay để tránh phát sinh chi phí phụ trội!"
                  : countdownData.isPlaying
                  ? "Trận đấu đang diễn ra. Chúc anh em thi đấu fairplay, cống hiến và tràn đầy năng lượng!"
                  : "Vé thi đấu gần nhất của bạn. Anh em hãy có mặt trước 15 phút để khởi động và nhận bóng nhé!"}
              </p>

              {/* Progress Bar for Active Match */}
              {countdownData.isPlaying && (
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      countdownData.isNearEnd ? "bg-amber-500" : "bg-[#0369a1]"
                    }`}
                    style={{ width: `${countdownData.progressPercent}%` }}
                  />
                </div>
              )}
            </div>

            {/* Live Timer Box & Quick Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
              <div className="text-left sm:text-right">
                <span className="text-[13px] font-bold text-slate-500 block">
                  {countdownData.isUpcoming ? "Thời gian đếm ngược:" : countdownData.isPlaying ? "Thời gian ca còn lại:" : "Đã lố giờ:"}
                </span>
                <strong className={`font-mono text-2xl sm:text-3xl font-black ${
                  countdownData.isNearEnd
                    ? "text-amber-700"
                    : countdownData.isOverdue
                    ? "text-rose-600"
                    : "text-[#0369a1]"
                }`}>
                  {countdownData.timeFormatted}
                </strong>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const msg = `⚽ LỜI NHẮC BÀN GIAO SÂN VĂN MINH:\n🏟️ Sân: ${pitchTypeLabel(countdownData.booking.courtName) || countdownData.booking.courtName}\n⏰ Ca thi đấu: ${countdownData.booking.timeSlot} (${prettyDate(countdownData.booking.bookingDate)})\n👉 Đội ca sau đã có mặt sẵn sàng khởi động. Nhờ anh em thu dọn đồ đạc để bàn giao sân đúng giờ nhé! Cảm ơn anh em! 🤝`;
                    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(msg);
                      setNotice("✓ Đã sao chép lời nhắc trả sân văn minh để gửi Zalo / Messenger!");
                      setTimeout(() => setNotice(null), 3500);
                    }
                  }}
                  className="px-3 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Sao chép lời nhắc bàn giao</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendHandoverReminder(countdownData.booking)}
                  disabled={sendingReminderId === countdownData.booking.id || reminderSent}
                  className="px-3 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Bell className="w-4 h-4" />
                  <span>{reminderSent ? "Đã gửi nhắc nhở!" : "Báo chuông nhắc trả sân"}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {loadError && (
        <p className="rounded-lg bg-rose-50 border border-rose-300 px-4 py-3 text-[14px] font-bold text-rose-700">
          {loadError}
        </p>
      )}

      {/* 2. TAB: MY BOOKINGS */}
      {activeFilter === "bookings" && (
        <section>
          {myBookings.length === 0 ? (
            <div className="rounded-lg bg-white border border-slate-300 p-8 text-center space-y-3">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-[15px] font-semibold text-slate-700">
                {user?.phone
                  ? "Bạn chưa có vé đặt sân nào."
                  : "Tài khoản chưa cập nhật số điện thoại nên chưa tra cứu được vé đặt sân."}
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab("booking")}
                className="px-4 py-2 rounded-md bg-[#0369a1] text-white text-[14px] font-bold"
              >
                Tìm & Đặt Sân Ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {myBookings.map((b) => {
                const started =
                  b.status === "PLAYING" || b.status === "COMPLETED" || isPastDay(b.bookingDate);
                const canCancel =
                  b.status === "BOOKED" || b.status === "PENDING_PAYMENT" || b.status === "RESALE";
                const statusVi =
                  b.status === "CANCELLED"
                    ? "Đã hủy"
                    : b.status === "COMPLETED"
                    ? "Đã hoàn thành"
                    : b.status === "PENDING_PAYMENT"
                    ? "Chờ xác nhận cọc"
                    : b.status === "PLAYING"
                    ? "Đang thi đấu"
                    : "Đã đặt lịch";

                return (
                  <div
                    key={b.id}
                    className="rounded-lg bg-white border border-slate-300 p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-200">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {pitchTypeLabel(b.courtName) || b.courtType || "Sân bóng"} • {b.timeSlot}
                        </h3>
                        <p className="text-[13px] text-slate-600 mt-0.5">
                          Ngày đá: <strong className="text-slate-900">{prettyDate(b.bookingDate)}</strong> • Mã vé:{" "}
                          <span className="font-mono font-bold text-[#0369a1]">{b.code}</span>
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[13px] font-bold border shrink-0 ${
                          b.status === "CANCELLED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : b.status === "COMPLETED"
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {statusVi}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
                      <div className="text-slate-700">
                        Tổng tiền: <strong className="font-mono text-slate-900">{money(b.totalPrice)}</strong>{" "}
                        <span className="text-[13px] text-slate-500">(Đã cọc {money(b.depositPaid)})</span>
                      </div>

                      {canCancel && !started && (
                        confirmCancelId === b.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => cancelMyBooking(b)}
                              disabled={cancellingId === b.id}
                              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold"
                            >
                              {cancellingId === b.id ? "Đang hủy..." : "Xác nhận hủy"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCancelId(null)}
                              className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold"
                            >
                              Không
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(b.id)}
                            className="px-3 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[13px] font-bold cursor-pointer"
                          >
                            Hủy vé
                          </button>
                        )
                      )}
                    </div>

                    {/* Tiện ích Zalo & Chỉ đường cho vé đang hoạt động */}
                    {b.status !== "CANCELLED" && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            const splitAmt = Math.round((b.totalPrice || 350000) / 14).toLocaleString("vi-VN");
                            const totalAmt = (b.totalPrice || 350000).toLocaleString("vi-VN");
                            const msg = `⚽ THÔNG BÁO CA ĐÁ TUẦN NÀY\n🏟️ Sân: ${pitchTypeLabel(b.courtName) || b.courtType || "Sân bóng"}\n📅 Ngày đá: ${prettyDate(b.bookingDate)}\n⏰ Khung giờ: ${b.timeSlot}\n🎟️ Mã vé: ${b.code}\n💰 Tiền sân: ${totalAmt}đ (~${splitAmt}đ / người, chia 14 anh em)\n👉 Anh em có mặt trước 15 phút khởi động nhé! 🔥`;
                            if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
                              navigator.clipboard.writeText(msg);
                              setNotice("✓ Đã sao chép tin nhắn ca đá để gửi nhóm Zalo / Messenger!");
                              setTimeout(() => setNotice(null), 3000);
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-[13px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép tin Zalo ca đá</span>
                        </button>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.courtName || "Sân bóng đá")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 text-[13px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5 text-sky-700" />
                          <span>Chỉ đường</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            if (sosBookingId === b.id) {
                              setSosBookingId(null);
                            } else {
                              setSosBookingId(b.id);
                              setSosFeeAmount(Math.round((b.totalPrice || 350000) / 14));
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-[13px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            sosBookingId === b.id
                              ? "bg-rose-600 text-white"
                              : "bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100"
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{sosBookingId === b.id ? "Đóng SOS" : "🚨 Báo SOS Thiếu Chân"}</span>
                        </button>
                      </div>
                    )}

                    {/* INLINE SOS FORM CHO TỪNG VÉ */}
                    {sosBookingId === b.id && (
                      <div className="p-3.5 rounded-md bg-rose-50/60 border border-rose-300 space-y-3 mt-2 text-[13px] animate-fade-in">
                        <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                          <span className="font-bold text-rose-950 text-[14px]">
                            🚨 Phát Tin SOS Mượn Viện Binh Cho Ca {b.timeSlot}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSosBookingId(null)}
                            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Vị trí cần tuyển:</label>
                            <select
                              value={sosPosition}
                              onChange={(e) => setSosPosition(e.target.value)}
                              className="w-full bg-white px-2.5 py-1.5 rounded border border-slate-300 font-semibold focus:outline-none focus:border-rose-500"
                            >
                              <option value="BAT_KY">⭐ Bất kỳ vị trí</option>
                              <option value="THU_MON">🧤 Thủ Môn (Gôn)</option>
                              <option value="HAU_VE">🛡️ Hậu Vệ (Thòng/Biên)</option>
                              <option value="TIEN_VE">⚡ Tiền Vệ (Giữa)</option>
                              <option value="TIEN_DAO">🎯 Tiền Đạo</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Số lượng thiếu:</label>
                            <select
                              value={sosCount}
                              onChange={(e) => setSosCount(Number(e.target.value))}
                              className="w-full bg-white px-2.5 py-1.5 rounded border border-slate-300 font-semibold focus:outline-none focus:border-rose-500"
                            >
                              <option value={1}>Cần 1 người</option>
                              <option value={2}>Cần 2 người</option>
                              <option value={3}>Cần 3 người</option>
                              <option value={4}>Cần 4+ người</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Chi phí cho viện binh:</label>
                            <select
                              value={sosFeeModel}
                              onChange={(e) => setSosFeeModel(e.target.value)}
                              className="w-full bg-white px-2.5 py-1.5 rounded border border-slate-300 font-semibold focus:outline-none focus:border-rose-500"
                            >
                              <option value="HOST_COVER">Đội bao sân (Miễn phí 0đ)</option>
                              <option value="SPLIT_EQUAL">Cưa đôi tiền sân ({sosFeeAmount.toLocaleString("vi-VN")}đ)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Lời nhắn / Lưu ý:</label>
                          <input
                            type="text"
                            value={sosNote}
                            onChange={(e) => setSosNote(e.target.value)}
                            placeholder="Ví dụ: Đội đá giao lưu vui vẻ, anh em văn phòng, thiếu 1 gôn nhiệt tình..."
                            className="w-full bg-white px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setSosBookingId(null)}
                            className="px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePostSosFromBooking(b)}
                            disabled={sosPosting}
                            className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {sosPosting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                            <span>{sosPosting ? "Đang phát tin..." : "Phát Tin SOS Lên Chợ Kèo"}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {sosSuccessId === b.id && (
                      <p className="p-2.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[13px] font-bold animate-fade-in">
                        ✓ Đã phát tin SOS mượn chân lên Chợ Kèo! Các viện binh tự do sẽ thấy tin và liên hệ với bạn.
                      </p>
                    )}

                    {b.status === "CANCELLED" && b.cancelReason && (
                      <p className="text-[13px] text-rose-600">Lý do hủy: {b.cancelReason}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 3. TAB: MATCHMAKING */}
      {activeFilter === "matchmaking" && (
        <section>
          {matchedPosts.length === 0 ? (
            <div className="rounded-lg bg-white border border-slate-300 p-8 text-center">
              <p className="text-[15px] text-slate-600 font-semibold">Chưa có kèo giao hữu nào đã ghép.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {matchedPosts.map((p: any) => (
                <div
                  key={p.id}
                  className="rounded-lg bg-white p-4 border border-slate-300 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-base text-slate-900 truncate">
                      {p.teamName}{" "}
                      {p.opponentTeamName ? (
                        <span className="text-[#0369a1]">vs {p.opponentTeamName}</span>
                      ) : (
                        ""
                      )}
                    </p>
                    <p className="text-[13px] text-slate-600 truncate mt-0.5">
                      {p.pitchName} • {p.matchTime}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[13px] font-bold shrink-0">
                    Đã chốt kèo
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. TABS: TOURNAMENT MATCHES (UPCOMING / ALL / HISTORY) */}
      {(activeFilter === "upcoming" || activeFilter === "tournaments" || activeFilter === "history") && (
        <section>
          {visibleMatches.length === 0 ? (
            <div className="rounded-lg bg-white border border-slate-300 p-8 text-center">
              <p className="text-[15px] text-slate-600 font-semibold">
                Chưa có trận đấu nào trong mục này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visibleMatches.map((m) => {
                const db = dateBox(m);
                const isExpanded = selectedMatchKey === m.key;
                return (
                  <div
                    key={m.key}
                    className="rounded-lg bg-white p-4 border border-slate-300 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-13 h-13 rounded-md bg-slate-100 flex flex-col items-center justify-center shrink-0 text-center border border-slate-300 px-2 py-1">
                          <span className="text-[12px] font-bold text-slate-600">{db.top}</span>
                          <span className="text-base leading-tight text-[#0369a1] font-bold">{db.num}</span>
                          <span className="text-[12px] text-slate-600 font-mono">{db.bot}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[12px] font-bold border ${
                                m.status === "DONE"
                                  ? "bg-sky-50 text-[#0369a1] border-sky-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {m.status === "DONE" ? "Đã kết thúc" : m.roundName}
                            </span>
                            <span className="text-[13px] font-semibold text-slate-600 truncate">
                              {m.tournamentTitle}
                            </span>
                          </div>

                          <p className="text-base font-bold text-slate-900 mt-1">
                            <span>{m.teamA}</span>
                            {m.status === "DONE" ? (
                              <span className="font-mono text-[#0369a1] mx-2">
                                {m.scoreA} - {m.scoreB}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal mx-2">vs</span>
                            )}
                            <span>{m.teamB}</span>
                          </p>

                          <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600 mt-1">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#0369a1]" />
                              {m.timeSlot ?? "Chưa xếp giờ"}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5 text-[#0369a1]" />
                              {m.pitchName ?? "Chưa xếp sân"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedMatchKey(isExpanded ? null : m.key)}
                        className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-bold border border-slate-300 shrink-0 cursor-pointer"
                      >
                        {isExpanded ? "Thu gọn" : "Chi tiết"}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[13px] text-slate-600">
                        <div>
                          Mã trận: <strong className="font-mono text-slate-900">{m.matchId}</strong> • Ngày:{" "}
                          <strong className="text-slate-900">
                            {m.matchDate ? prettyDate(m.matchDate) : "Chưa xếp"}
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (m.tournamentId && onOpenBracket) {
                              onOpenBracket(m.tournamentId);
                            } else if (onNavigateTab) {
                              onNavigateTab("tournaments");
                            }
                          }}
                          className="px-3 py-1.5 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] flex items-center gap-1 cursor-pointer"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>Mở nhánh đấu giải</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {notice && (
        <div className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-md">
          <div className="rounded-lg bg-slate-900 text-white text-[14px] font-bold px-4 py-3 shadow-lg flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {notice}
            </span>
            <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitySchedule;
