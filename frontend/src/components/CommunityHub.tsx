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
  Radio,
  UserPlus,
  Clock,
  Building,
  AlertCircle,
  Scale,
  ShoppingBag,
  Building2,
} from "lucide-react";
import { apiRequest, ensureLoggedIn } from "@/lib/api";
import CommunityChat from "./CommunityChat";
import GroupChatPanel from "./GroupChatPanel";
import TeamClubManagement from "./TeamClubManagement";
import ClubManagement from "./ClubManagement";

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
  lastSenderEmail: string;
  lastTime: string | null;
  memberCount: number;
  pinned: { id: number; content: string; senderName: string } | null;
}

type HubView =
  | { kind: "home" }
  | { kind: "public"; slug: string; name: string; desc: string }
  | { kind: "dm"; partnerEmail?: string; partnerName?: string }
  | { kind: "groups" }
  | { kind: "clan" };

type Filter = "all" | "unread" | "private" | "friends";

interface CommunityHubProps {
  user?: any;
  onOpenAuth?: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
  initialDmPartner?: { partnerEmail: string; partnerName: string } | null;
  initialChannel?: string | null;
}

const SEEN_PREFIX = "shub_chat_seen_";
const TOURNAMENT_CHANNEL = "giai-dau";

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
  { key: "private", label: "Tin nhắn riêng" },
  { key: "friends", label: "Đã liên hệ" },
];

export default function CommunityHub({
  user,
  onOpenAuth,
  onNavigateTab,
  initialDmPartner,
  initialChannel,
}: CommunityHubProps) {
  const myEmail = (user?.email || "").toLowerCase();

  const [mode, setMode] = useState<"chat" | "clan" | "club">("chat");
  const [view, setView] = useState<HubView>({ kind: "home" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [tick, setTick] = useState(0);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialDmPartner?.partnerEmail) return;
    setMode("chat");
    setView({
      kind: "dm",
      partnerEmail: initialDmPartner.partnerEmail,
      partnerName: initialDmPartner.partnerName || initialDmPartner.partnerEmail,
    });
  }, [initialDmPartner]);

  useEffect(() => {
    if (user?.role === "OWNER" && mode === "club") {
      setMode("chat");
    }
  }, [user?.role, mode]);

  const refreshSeqRef = useRef(0);
  const refreshingRef = useRef(false);
  const refresh = useCallback(async () => {
    if (!user) return;
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    const seq = ++refreshSeqRef.current;
    try {
      const [chans, convos] = await Promise.all([
        apiRequest<ChannelInfo[]>("/api/v1/chat/channels").catch(() => [] as ChannelInfo[]),
        apiRequest<Conversation[]>("/api/v1/chat/conversations").catch(() => [] as Conversation[]),
      ]);
      if (seq !== refreshSeqRef.current) return;
      setChannels(Array.isArray(chans) ? chans : []);
      setConversations(Array.isArray(convos) ? convos : []);
    } finally {
      refreshingRef.current = false;
      if (seq === refreshSeqRef.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || mode !== "chat" || view.kind !== "home") return;
    setLoading(true);
    refresh();
    const t = window.setInterval(refresh, 5000);
    return () => window.clearInterval(t);
  }, [user, mode, view.kind, refresh]);

  const channelUnread = useMemo(() => {
    const map: Record<string, number> = {};
    channels.forEach((c) => {
      const seen = getSeen("ch:" + c.slug);
      if (c.lastTime && new Date(c.lastTime).getTime() > seen && c.lastSenderEmail !== myEmail) {
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

  const openChannel = (c: ChannelInfo) => {
    if (!user) {
      ensureLoggedIn("vào phòng chat");
      onOpenAuth?.("login", "PLAYER");
      return;
    }
    markSeen("ch:" + c.slug);
    setTick((x) => x + 1);
    setView({ kind: "public", slug: c.slug, name: c.name, desc: c.desc });
  };

  const openTournamentChat = () => {
    const t = channels.find((c) => c.slug === TOURNAMENT_CHANNEL);
    if (t) {
      openChannel(t);
      return;
    }
    openChannel({
      slug: TOURNAMENT_CHANNEL,
      name: "Chat Giải Đấu",
      desc: "Trao đổi trực tiếp với Ban Tổ Chức, đội bóng và cầu thủ trong giải đấu",
      lastMessage: "",
      lastSender: "",
      lastSenderEmail: "",
      lastTime: null,
      memberCount: 0,
      pinned: null,
    });
  };

  const openedInitialChannel = useRef<string | null>(null);
  useEffect(() => {
    if (!initialChannel) return;
    if (openedInitialChannel.current === initialChannel) return;
    if (!user) return;
    if (channels.length === 0) return;
    openedInitialChannel.current = initialChannel;
    const found = channels.find((c) => c.slug === initialChannel);
    if (found) {
      openChannel(found);
    } else {
      openChannel({
        slug: initialChannel,
        name: "Chat Giải Đấu",
        desc: "Trao đổi trực tiếp với Ban Tổ Chức, đội bóng và cầu thủ trong giải đấu",
        lastMessage: "",
        lastSender: "",
        lastSenderEmail: "",
        lastTime: null,
        memberCount: 0,
        pinned: null,
      });
    }
  }, [initialChannel, channels, user]);

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
    setView({ kind: "dm", partnerEmail, partnerName });
  };

  const back = () => {
    setView({ kind: "home" });
  };

  const switchMode = (m: "chat" | "clan" | "club") => {
    if (m === mode) return;
    if (user?.role === "OWNER" && m === "club") return;
    setMode(m);
  };

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
        talkedToMe: !!c.isMine,
        onClick: () => openDm(c.partnerEmail, c.partnerName),
      });
    });

    return list;
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

  if (view.kind !== "home") {
    const title =
      view.kind === "public"
        ? view.name
        : view.kind === "dm"
        ? view.partnerName || "Tin nhắn riêng"
        : view.kind === "groups"
        ? "Nhóm chat"
        : "Đội bóng";
    const subtitle =
      view.kind === "public"
        ? view.desc
        : view.kind === "dm"
        ? view.partnerEmail || "Trò chuyện trực tiếp 1-1"
        : view.kind === "groups"
        ? "Phòng chat nhóm"
        : "Quản lý đội bóng của bạn";

    return (
      <div className="w-full space-y-4 pb-12">
        <div className="rounded-lg overflow-hidden bg-white border border-slate-300">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={back}
              className="px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[13px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-900 truncate">{title}</h2>
              <p className="text-[13px] text-slate-600 truncate">{subtitle}</p>
            </div>
          </div>

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
            {view.kind === "groups" && <GroupChatPanel user={user} />}
            {view.kind === "clan" && (
              <TeamClubManagement user={user} onBackToHome={back} onNavigateTab={onNavigateTab} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-12">
      {/* 1. UNIFIED HEADER + TABS + SEARCH/FILTERS */}
      <section className="bg-white border border-slate-300 rounded-lg p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Cộng Đồng & Nhắn Tin
            </h1>
            <p className="text-[14px] text-slate-600 mt-1">
              Kênh trao đổi trực tiếp giữa cầu thủ, đội trưởng, chủ sân và ban tổ chức giải đấu.
            </p>
          </div>

          {/* Sub-mode tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => switchMode("chat")}
              className={`px-4 py-2 rounded-md text-[14px] font-bold border flex items-center gap-1.5 cursor-pointer ${
                mode === "chat"
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Phòng Chat & Tin Nhắn</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode("clan")}
              className={`px-4 py-2 rounded-md text-[14px] font-bold border flex items-center gap-1.5 cursor-pointer ${
                mode === "clan"
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Đội Bóng</span>
            </button>
            {user?.role !== "OWNER" && (
              <button
                type="button"
                onClick={() => switchMode("club")}
                className={`px-4 py-2 rounded-md text-[14px] font-bold border flex items-center gap-1.5 cursor-pointer ${
                  mode === "club"
                    ? "bg-[#0369a1] text-white border-[#0369a1]"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>CLB Của Tôi</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Quick Actions when in Chat mode */}
        {mode === "chat" && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm phòng chat, đội bóng, người liên hệ..."
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 bg-white text-[14px] text-slate-900 focus:outline-none focus:border-[#0369a1]"
                />
              </div>

              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-md text-[13px] font-bold border cursor-pointer ${
                    filter === f.key
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={openTournamentChat}
                className="px-3 py-1.5 rounded-md bg-sky-50 hover:bg-sky-100 text-[#0369a1] border border-sky-200 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Kênh Giải Đấu</span>
              </button>
              <button
                type="button"
                onClick={() => setView({ kind: "groups" })}
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Nhóm Chat</span>
              </button>
              <button
                type="button"
                onClick={() => openDm()}
                className="px-3 py-1.5 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tin Nhắn Mới</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 2. MAIN CONTENT */}
      {mode === "chat" ? (
        <div className="rounded-lg bg-white border border-slate-300 overflow-hidden">
          {!user ? (
            <div className="px-5 py-10 text-center space-y-3">
              <Lock className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-[15px] font-bold text-slate-900">Đăng nhập để tham gia trò chuyện</p>
              <p className="text-[14px] text-slate-600 max-w-sm mx-auto">
                Nhắn tin trực tiếp với chủ sân, ban tổ chức giải đấu và các đội bóng khác.
              </p>
              <button
                type="button"
                onClick={() => onOpenAuth?.("login", "PLAYER")}
                className="px-5 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold"
              >
                Đăng Nhập Ngay
              </button>
            </div>
          ) : loading && channels.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-600 text-[14px] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách kênh...
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="px-5 py-10 text-center space-y-2">
              <MessageCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-[14px] text-slate-600">
                {filter === "unread"
                  ? "Không có tin nhắn chưa đọc."
                  : filter === "private" || filter === "friends"
                  ? 'Chưa có cuộc trò chuyện riêng. Bấm "Tin Nhắn Mới" để bắt đầu.'
                  : "Không tìm thấy kênh phù hợp."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:gap-px bg-slate-200">
              {filteredChannels.map((ch) => {
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={ch.onClick}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-slate-50 transition-colors text-left group cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-300 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#0369a1]" />
                      </div>
                      {ch.unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[14px] truncate ${
                          ch.unread > 0 ? "font-bold text-slate-900" : "font-semibold text-slate-800"
                        }`}
                      >
                        {ch.name}
                      </p>
                      <p className="text-[13px] text-slate-500 truncate mt-0.5">{ch.preview}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {ch.time && (
                        <span className="text-[12px] text-slate-500 font-mono">{formatTime(ch.time)}</span>
                      )}
                      {ch.unread > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-[#0369a1] text-white text-[12px] font-bold">
                          Mới
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0369a1]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : mode === "clan" ? (
        user ? (
          <div className="rounded-lg overflow-hidden bg-white border border-slate-300">
            <TeamClubManagement user={user} onBackToHome={() => switchMode("chat")} onNavigateTab={onNavigateTab} />
          </div>
        ) : (
          <div className="rounded-lg bg-white border border-slate-300 px-5 py-10 text-center space-y-3">
            <Users className="w-8 h-8 text-[#0369a1] mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Quản Lý Đội Bóng</h3>
            <p className="text-[14px] text-slate-600 max-w-sm mx-auto">
              Đăng nhập để tạo đội bóng, quản lý thành viên và theo dõi lịch sử thi đấu.
            </p>
            <button
              type="button"
              onClick={() => onOpenAuth?.("login", "PLAYER")}
              className="px-5 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold"
            >
              Đăng Nhập Ngay
            </button>
          </div>
        )
      ) : user ? (
        <div className="rounded-lg overflow-hidden bg-white border border-slate-300 p-4 sm:p-5">
          <ClubManagement user={user} onBack={() => switchMode("chat")} />
        </div>
      ) : (
        <div className="rounded-lg bg-white border border-slate-300 px-5 py-10 text-center space-y-3">
          <Building2 className="w-8 h-8 text-[#0369a1] mx-auto" />
          <h3 className="text-base font-bold text-slate-900">CLB Của Tôi</h3>
          <p className="text-[14px] text-slate-600 max-w-sm mx-auto">
            Đăng nhập để tạo CLB, thêm thành viên và quản lý đội bóng.
          </p>
          <button
            type="button"
            onClick={() => onOpenAuth?.("login", "PLAYER")}
            className="px-5 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold"
          >
            Đăng Nhập Ngay
          </button>
        </div>
      )}
    </div>
  );
}
