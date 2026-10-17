"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  Users,
  Search,
  Flame,
  ChevronRight,
  Hash,
  ArrowLeft,
  Loader2,
  Lock,
  ShieldCheck,
  Radio,
  Sparkles,
  UserPlus,
  Clock,
  Building,
  AlertCircle,
  Scale,
  ShoppingBag,
} from "lucide-react";
import { apiRequest, ensureLoggedIn } from "@/lib/api";
import CommunityChat from "./CommunityChat";
import PageSpinner from "./PageSpinner";
import GroupChatPanel from "./GroupChatPanel";
import MatchmakingMarketplace from "./MatchmakingMarketplace";
import TeamClubManagement from "./TeamClubManagement";

/* =========================================================
 * CommunityHub — Tab "Cộng đồng" chuẩn Mobile-first
 * Phong cách Dark / Neon Green:
 *   + Top sub-nav: Toggle "Trò chuyện" / "Đội bóng (Clan)"
 *   + Search bar + filter chips: Tất cả, Chưa đọc, Riêng tư, Bạn bè
 *   + Banner nổi bật: "CHAT GIẢI ĐẤU" + "BẮT ĐỐI GIAO HỮU"
 *   + Channel card list: avatar tròn neon, tên phòng, tin mới nhất,
 *     thời gian, badge số tin chưa đọc màu xanh neon
 * ========================================================= */

interface Conversation {
  partnerEmail: string;
  partnerName: string;
  lastMessage: string;
  lastTime: string;
  isMine: boolean;
}

interface ChannelInfo {
  slug: string;
  name: string;
  desc: string;
  lastMessage: string;
  lastSender: string;
  lastTime: string | null;
  memberCount: number;
  pinned: { id: number; content: string; senderName: string } | null;
}

type HubView =
  | { kind: "home" }
  | { kind: "public"; slug: string; name: string; desc: string }
  | { kind: "dm"; partnerEmail?: string; partnerName?: string }
  | { kind: "groups" }
  | { kind: "matchmaking" }
  | { kind: "clan" };

type Filter = "all" | "unread" | "private" | "friends";

interface CommunityHubProps {
  user?: any;
  onOpenAuth?: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
}

const SEEN_PREFIX = "shub_chat_seen_";

function getSeen(key: string): number {
  if (typeof window === "undefined") return 0;
  const v = window.localStorage.getItem(SEEN_PREFIX + key);
  return v ? Number(v) || 0 : 0;
}

function markSeen(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_PREFIX + key, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
  { key: "private", label: "Riêng tư" },
  { key: "friends", label: "Bạn bè" },
];

export default function CommunityHub({ user, onOpenAuth, onNavigateTab }: CommunityHubProps) {
  const myEmail = (user?.email || "").toLowerCase();

  const [mode, setMode] = useState<"chat" | "clan">("chat");
  const [view, setView] = useState<HubView>({ kind: "home" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [tick, setTick] = useState(0);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Hiệu ứng chuyển trạng thái: bật vòng xoay tối thiểu MIN_LOADING_MS,
   * kể cả khi dữ liệu về nhanh hơn, để người dùng không thấy màn hình nhảy loè.
   */
  const MIN_LOADING_MS = 1000;
  const [switching, setSwitching] = useState(false);
  const switchTimer = useRef<number | null>(null);

  const runWithLoader = useCallback(() => {
    if (switchTimer.current) window.clearTimeout(switchTimer.current);
    setSwitching(true);
    switchTimer.current = window.setTimeout(() => {
      setSwitching(false);
      switchTimer.current = null;
    }, MIN_LOADING_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (switchTimer.current) window.clearTimeout(switchTimer.current);
    };
  }, []);

  // ---- Tải dữ liệu xem trước (chỉ khi đã đăng nhập) ----
  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [chans, convos] = await Promise.all([
        apiRequest<ChannelInfo[]>("/api/v1/chat/channels").catch(() => [] as ChannelInfo[]),
        apiRequest<Conversation[]>("/api/v1/chat/conversations").catch(() => [] as Conversation[]),
      ]);
      setChannels(Array.isArray(chans) ? chans : []);
      setConversations(Array.isArray(convos) ? convos : []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || mode !== "chat" || view.kind !== "home") return;
    setLoading(true);
    refresh();
    const t = window.setInterval(refresh, 5000);
    return () => window.clearInterval(t);
  }, [user, mode, view.kind, refresh]);

  // ---- Đếm tin chưa đọc ----
  const channelUnread = useMemo(() => {
    const map: Record<string, number> = {};
    channels.forEach((c) => {
      const seen = getSeen("ch:" + c.slug);
      if (c.lastTime && new Date(c.lastTime).getTime() > seen && c.lastSender !== myEmail) {
        map[c.slug] = 1;
      }
    });
    return map;
  }, [channels, myEmail, tick]);

  const dmChannels = useMemo(() => {
    return conversations.map((c) => {
      const seen = getSeen("dm:" + c.partnerEmail);
      const unread = !c.isMine && new Date(c.lastTime).getTime() > seen ? 1 : 0;
      return { ...c, unread };
    });
  }, [conversations, tick]);

  const onlineCount = useMemo(() => {
    return channels.find((c) => c.slug === "general")?.memberCount ?? 0;
  }, [channels]);

  // ---- Điều hướng ----
  const openChannel = (c: ChannelInfo) => {
    if (!user) {
      ensureLoggedIn("vào phòng chat");
      onOpenAuth?.("login", "PLAYER");
      return;
    }
    runWithLoader();
    markSeen("ch:" + c.slug);
    setTick((x) => x + 1);
    setView({ kind: "public", slug: c.slug, name: c.name, desc: c.desc });
  };

  const openGeneral = () => {
    const g = channels.find((c) => c.slug === "general");
    if (g) openChannel(g);
    else
      openChannel({
        slug: "general",
        name: "Phòng Chat Chung",
        desc: "Kênh chung của cộng đồng SoccerHub",
        lastMessage: "",
        lastSender: "",
        lastTime: null,
        memberCount: 0,
        pinned: null,
      });
  };

  const openDm = (partnerEmail?: string, partnerName?: string) => {
    if (!user) {
      ensureLoggedIn("xem tin nhắn riêng");
      onOpenAuth?.("login", "PLAYER");
      return;
    }
    if (partnerEmail) {
      markSeen("dm:" + partnerEmail);
      setTick((x) => x + 1);
    }
    runWithLoader();
    setView({ kind: "dm", partnerEmail, partnerName });
  };

  const back = () => {
    runWithLoader();
    setView({ kind: "home" });
  };

  /** Đổi chế độ Trò chuyện / Đội bóng — có hiệu ứng xoay. */
  const switchMode = (m: "chat" | "clan") => {
    if (m === mode) return;
    runWithLoader();
    setMode(m);
  };

  /** Mở chợ kèo giao hữu — có hiệu ứng xoay. */
  const openMatchmaking = () => {
    runWithLoader();
    setView({ kind: "matchmaking" });
  };

  // ---- Danh sách channel (kênh công khai + DM) ----
  const CHANNEL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
    general: Hash,
    "vang-lai": Flame,
    "bu-thieu-nguoi": UserPlus,
    "doi-30p": Clock,
    "tinh-trang-san": Building,
    "khieu-nai": AlertCircle,
    "ho-dap-luat": Scale,
    "do-dung-cu": ShoppingBag,
    "tuyen-cau-thu": Users,
  };

  const channelRows = useMemo(() => {
    const list: {
      id: string;
      name: string;
      preview: string;
      time: string | null;
      unread: number;
      icon: React.ComponentType<{ className?: string }>;
      isDm: boolean;
      /** Người bạn đã từng nhắn tin (dùng cho chip "Bạn bè"). */
      talkedToMe: boolean;
      onClick: () => void;
    }[] = [];

    channels.forEach((c) => {
      list.push({
        id: "ch:" + c.slug,
        name: c.name,
        preview: c.lastMessage ? `${c.lastSender}: ${c.lastMessage}` : c.desc,
        time: c.lastTime,
        unread: channelUnread[c.slug] ?? 0,
        icon: CHANNEL_ICON[c.slug] || Hash,
        isDm: false,
        talkedToMe: false,
        onClick: () => openChannel(c),
      });
    });

    dmChannels.forEach((c) => {
      list.push({
        id: "dm:" + c.partnerEmail,
        name: c.partnerName || c.partnerEmail,
        preview: (c.isMine ? "Bạn: " : "") + (c.lastMessage || "Bắt đầu trò chuyện"),
        time: c.lastTime,
        unread: c.unread,
        icon: MessageCircle,
        isDm: true,
        // "Bạn bè" = người mà bạn đã chủ động nhắn tin trước
        talkedToMe: !!c.isMine,
        onClick: () => openDm(c.partnerEmail, c.partnerName),
      });
    });

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels, channelUnread, dmChannels]);

  const filteredChannels = useMemo(() => {
    const q = search.trim().toLowerCase();
    return channelRows.filter((ch) => {
      if (q && !(ch.name + " " + ch.preview).toLowerCase().includes(q)) return false;
      if (filter === "unread" && ch.unread <= 0) return false;
      if (filter === "private" && !ch.isDm) return false;
      if (filter === "friends" && !ch.talkedToMe) return false;
      return true;
    });
  }, [channelRows, search, filter]);

  /* =========================================================
   * CHANNEL VIEW — mở phòng chat / kèo / đội bóng
   * ========================================================= */
  if (view.kind !== "home") {
    const title =
      view.kind === "public"
        ? view.name
        : view.kind === "dm"
        ? view.partnerName || "Tin nhắn riêng"
        : view.kind === "matchmaking"
        ? "Bắt Đối Giao Hữu"
        : view.kind === "groups"
        ? "Nhóm chat"
        : "Đội bóng (Clan)";
    const subtitle =
      view.kind === "public"
        ? view.desc
        : view.kind === "dm"
        ? view.partnerEmail || "Trò chuyện riêng tư 1-1"
        : view.kind === "groups"
        ? "Phòng chat riêng cho nhóm bạn"
        : view.kind === "matchmaking"
        ? "Ghép kèo theo trình độ & phong độ"
        : "Quản lý đội bóng của bạn";

    return (
      <div className="w-full space-y-4 pb-10 sm:pb-16">
        <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-2xl relative">
          {/* Vòng xoay khi đang chuyển trạng thái (tối thiểu 1s) */}
          {switching && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/85 backdrop-blur-[2px] animate-fade-in">
              <PageSpinner size="md" sub="Đang tải…" />
            </div>
          )}

          {/* Header kênh */}
          <div className="flex items-center gap-3 px-3.5 sm:px-5 py-3.5 border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white">
            <button
              type="button"
              onClick={back}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0369a1] flex items-center justify-center transition-all active:scale-95 shrink-0"
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="relative w-10 h-10 rounded-full bg-slate-100 ring-2 ring-[#0369a1]/40 shadow-sm flex items-center justify-center shrink-0">
              {view.kind === "matchmaking" ? (
                <Flame className="w-4 h-4 text-[#0369a1]" />
              ) : view.kind === "clan" || view.kind === "groups" ? (
                <Users className="w-4 h-4 text-[#0369a1]" />
              ) : (
                <MessageCircle className="w-4 h-4 text-[#0369a1]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate leading-tight">{title}</h2>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {subtitle}
              </p>
            </div>
          </div>

          {/* Nội dung */}
          <div className="bg-white">
            {view.kind === "public" && (
              <CommunityChat
                user={user}
                initialMode="public"
                channel={view.slug}
                channelName={view.name}
                channelDesc={view.desc}
              />
            )}
            {view.kind === "dm" && (
              <CommunityChat
                user={user}
                initialMode="dm"
                initialPartner={
                  view.partnerEmail
                    ? { partnerEmail: view.partnerEmail, partnerName: view.partnerName || view.partnerEmail }
                    : undefined
                }
              />
            )}
            {view.kind === "groups" && (
              <GroupChatPanel user={user} />
            )}
            {view.kind === "matchmaking" && (
              <div className="p-1">
                <MatchmakingMarketplace user={user} />
              </div>
            )}
            {view.kind === "clan" && (
              <TeamClubManagement user={user} onBackToHome={back} onNavigateTab={onNavigateTab} />
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
   * HOME — Hub dark/neon
   * ========================================================= */
  return (
    <div className="w-full space-y-4 sm:space-y-5 pb-10 sm:pb-16 relative">
      {/* ===== Lớp che + vòng xoay khi chuyển trạng thái (tối thiểu 1s) ===== */}
      {switching && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-white/80 backdrop-blur-[2px] animate-fade-in">
          <PageSpinner size="md" sub="Đang tải…" />
        </div>
      )}

      {/* ===== TOP SUB-NAV: Trò chuyện / Đội bóng (Clan) ===== */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200">
        <button
          type="button"
          onClick={() => switchMode("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
            mode === "chat"
              ? "bg-[#0369a1] text-white shadow-md"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span>Trò chuyện</span>
        </button>
        <button
          type="button"
          onClick={() => switchMode("clan")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
            mode === "clan"
              ? "bg-[#0369a1] text-white shadow-md"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Đội bóng (Clan)</span>
        </button>
      </div>

      {/* ===== SEARCH + FILTER CHIPS ===== */}
      <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-2xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0369a1]/80" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm phòng chat, đội bóng, cầu thủ..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0369a1]/40 focus:border-[#0369a1]/60 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                filter === f.key
                  ? "bg-[#0369a1] text-white border-[#0369a1] shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#0369a1]/60 hover:text-[#075985]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== BANNER NỔI BẬT ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* BẮT ĐỐI GIAO HỮU (trái) */}
        <button
          type="button"
          onClick={openMatchmaking}
          className="group relative overflow-hidden rounded-3xl p-4 sm:p-5 text-left transition-all hover:shadow-lg active:scale-[0.98] border border-white/20"
          style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }}
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/20 rounded-full blur-3xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-white" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white/90">Matchmaking</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">Bắt Đối Giao Hữu</h3>
              <p className="text-[11px] sm:text-xs text-white/95 mt-1 leading-relaxed">
                Tìm đối thủ tương đương phong độ, ghép kèo nhanh chóng.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
          </div>
        </button>

        {/* CHAT GIẢI ĐẤU (phải) */}
        <button
          type="button"
          onClick={openGeneral}
          className="group relative overflow-hidden rounded-3xl p-4 sm:p-5 text-left transition-all hover:shadow-lg active:scale-[0.98] border border-white/20"
          style={{ background: "linear-gradient(135deg, #0369a1 0%, #075985 100%)" }}
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/20 rounded-full blur-3xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Radio className="w-5 h-5 text-white" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white/90">
                  Trực tuyến · {onlineCount} thành viên
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">Chat Giải Đấu</h3>
              <p className="text-[11px] sm:text-xs text-white/95 mt-1 leading-relaxed">
                Thảo luận trực tiếp với BTC, đội bóng và cầu thủ trong giải đấu.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
          </div>
        </button>
      </div>

      {/* ===== CHANNEL CARD LIST ===== */}
      {mode === "chat" ? (
        <div className="rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#0369a1]" />
              Kênh trò chuyện
            </h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { runWithLoader(); setView({ kind: "groups" }); }}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#0369a1] hover:text-[#075985] transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                Nhóm chat
              </button>
              <button
                type="button"
                onClick={() => openDm()}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#0369a1] hover:text-[#075985] transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tin nhắn mới
              </button>
            </div>
          </div>

          {!user ? (
            <div className="px-5 py-10 text-center space-y-3">
              <Lock className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-900">Đăng nhập để tham gia cộng đồng</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Trò chuyện với cầu thủ, chủ sân và ban tổ chức giải đấu.
              </p>
              <button
                type="button"
                onClick={() => onOpenAuth?.("login", "PLAYER")}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-xs font-black transition-all active:scale-95 shadow-[0_0_18px_rgba(74,222,128,0.4)]"
              >
                Đăng nhập ngay
              </button>
            </div>
          ) : loading && channels.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải kênh…
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="px-5 py-10 text-center space-y-2">
              <MessageCircle className="w-9 h-9 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500">
                {filter === "unread"
                  ? "Không có tin nhắn chưa đọc."
                  : filter === "private" || filter === "friends"
                  ? "Chưa có hội thoại riêng. Bấm \"Tin nhắn mới\" để bắt đầu."
                  : "Không tìm thấy kênh phù hợp."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredChannels.map((ch) => {
                const Icon = ch.icon;
                return (
                  <li key={ch.id}>
                    <button
                      type="button"
                      onClick={ch.onClick}
                      className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group"
                    >
                      {/* Avatar icon tròn */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-sky-50 ring-2 ring-[#0369a1]/25 group-hover:ring-[#0369a1]/60 transition-all flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[#0369a1]" />
                        </div>
                        {ch.unread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                        )}
                      </div>

                      {/* Tên phòng + tin mới nhất */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate ${ch.unread > 0 ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>
                            {ch.name}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{ch.preview}</p>
                      </div>

                      {/* Thời gian + badge chưa đọc */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {ch.time && <span className="text-[10px] text-slate-500 font-semibold">{formatTime(ch.time)}</span>}
                        {ch.unread > 0 ? (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#0369a1] text-white text-[10px] font-black flex items-center justify-center">
                            {ch.unread > 9 ? "9+" : ch.unread}
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0369a1] group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        /* ===== CLAN MODE ===== */
        user ? (
          <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xl">
            <TeamClubManagement user={user} onBackToHome={() => switchMode("chat")} onNavigateTab={onNavigateTab} />
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-slate-200 shadow-2xl px-5 py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#0369a1]/10 ring-2 ring-[#0369a1]/40 flex items-center justify-center mx-auto">
              <Users className="w-7 h-7 text-[#0369a1]" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Đội bóng (Clan)</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Đăng nhập để tạo đội, quản lý thành viên và theo dõi lịch sử thi đấu của đội bạn.
            </p>
            <button
              type="button"
              onClick={() => onOpenAuth?.("login", "PLAYER")}
              className="mt-1 px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-xs font-black transition-all active:scale-95 shadow-[0_0_18px_rgba(74,222,128,0.4)]"
            >
              Đăng nhập ngay
            </button>
          </div>
        )
      )}

      {/* Ghi chú nhỏ */}
      <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#0369a1]" />
        Cộng đồng SoccerHub — kết nối cầu thủ, chủ sân &amp; ban tổ chức giải đấu
      </p>
    </div>
  );
}
