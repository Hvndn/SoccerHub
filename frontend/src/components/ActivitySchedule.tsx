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
} from "lucide-react";
import { API_BASE_URL, apiRequest, fetchWithTimeout } from "@/lib/api";
import { pitchTypeLabel } from "@/lib/pitchLabels";
import { isPastDay } from "@/lib/dateUtils";
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
  const [now] = useState(() => new Date());
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedMatchKey, setSelectedMatchKey] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

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
