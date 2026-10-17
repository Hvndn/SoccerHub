"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Loader2, Users, Search, ArrowLeft, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toastErr, toastOk } from "@/lib/toast";
import { ensureLoggedIn } from "@/lib/api";

interface ChatMessage {
  id: number;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  recipientEmail?: string;
  recipientName?: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  partnerEmail: string;
  partnerName: string;
  lastMessage: string;
  lastTime: string;
  isMine: boolean;
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "text-rose-600",
  ORGANIZER: "text-amber-700",
  OWNER: "text-sky-700",
  PLAYER: "text-[#0b4f6c]",
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function CommunityChat({ user }: { user?: any }) {
  const [mode, setMode] = useState<"public" | "dm">("public");
  const myEmail = (user?.email || "").toLowerCase();

  // ---- Public chat state ----
  const [pubMessages, setPubMessages] = useState<ChatMessage[]>([]);
  const [pubInput, setPubInput] = useState("");
  const [pubSending, setPubSending] = useState(false);
  const [pubLoading, setPubLoading] = useState(true);
  const [pubError, setPubError] = useState<string | null>(null);
  const pubBottomRef = useRef<HTMLDivElement>(null);

  // ---- DM state ----
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<Conversation | null>(null);
  const [dmMessages, setDmMessages] = useState<ChatMessage[]>([]);
  const [dmInput, setDmInput] = useState("");
  const [dmSending, setDmSending] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const dmBottomRef = useRef<HTMLDivElement>(null);

  // ---- Fetch public messages ----
  const fetchPublic = useCallback(async (silent = false) => {
    try {
      const data = await apiRequest<ChatMessage[]>("/api/v1/chat/messages");
      setPubMessages(Array.isArray(data) ? data : []);
      setPubError(null);
    } catch (e: any) {
      if (!silent) setPubError(e?.message || "Không tải được tin nhắn.");
    } finally {
      setPubLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode !== "public") return;
    fetchPublic();
    const timer = window.setInterval(() => fetchPublic(true), 4000);
    return () => window.clearInterval(timer);
  }, [mode, fetchPublic]);

  useEffect(() => {
    if (mode === "public" && pubBottomRef.current) {
      pubBottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [pubMessages.length, mode]);

  const handlePubSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = pubInput.trim();
    if (!text) return;
    if (!ensureLoggedIn("gửi tin nhắn")) return;
    setPubSending(true);
    try {
      await apiRequest("/api/v1/chat/messages", { method: "POST", body: JSON.stringify({ content: text }) });
      setPubInput("");
      await fetchPublic(true);
    } catch (err: any) {
      toastErr(err?.message || "Không gửi được tin nhắn.");
    } finally {
      setPubSending(false);
    }
  };

  // ---- Fetch conversations ----
  const fetchConversations = useCallback(async () => {
    try {
      const data = await apiRequest<Conversation[]>("/api/v1/chat/conversations");
      setConversations(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toastErr(e?.message || "Không tải được danh sách hội thoại.");
    }
  }, []);

  // ---- Fetch DM messages ----
  const fetchDm = useCallback(async (partnerEmail: string, silent = false) => {
    try {
      const data = await apiRequest<ChatMessage[]>(`/api/v1/chat/messages?with=${encodeURIComponent(partnerEmail)}`);
      setDmMessages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (!silent) toastErr(e?.message || "Không tải được tin nhắn.");
    }
  }, []);

  useEffect(() => {
    if (mode !== "dm") return;
    fetchConversations();
    const timer = window.setInterval(() => {
      fetchConversations();
      if (activePartner) fetchDm(activePartner.partnerEmail, true);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [mode, fetchConversations, activePartner, fetchDm]);

  useEffect(() => {
    if (mode === "dm" && activePartner && dmBottomRef.current) {
      dmBottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [dmMessages.length, mode, activePartner]);

  const handleDmSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = dmInput.trim();
    if (!text || !activePartner) return;
    if (!ensureLoggedIn("gửi tin nhắn")) return;
    setDmSending(true);
    try {
      await apiRequest("/api/v1/chat/messages", {
        method: "POST",
        body: JSON.stringify({ content: text, recipientEmail: activePartner.partnerEmail, recipientName: activePartner.partnerName }),
      });
      setDmInput("");
      await fetchDm(activePartner.partnerEmail, true);
      await fetchConversations();
    } catch (err: any) {
      toastErr(err?.message || "Không gửi được tin nhắn.");
    } finally {
      setDmSending(false);
    }
  };

  // ---- User search ----
  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const data = await apiRequest<UserInfo[]>(`/api/v1/chat/users?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toastErr(e?.message || "Không tìm được người dùng.");
    } finally {
      setSearching(false);
    }
  };

  const startConversation = (u: UserInfo) => {
    const conv: Conversation = { partnerEmail: u.email, partnerName: u.name, lastMessage: "", lastTime: "", isMine: false };
    setActivePartner(conv);
    setDmMessages([]);
    setShowNewChat(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const renderMessage = (m: ChatMessage, mine: boolean) => (
    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] sm:max-w-[70%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
        {!mine && (
          <div className="flex items-center gap-1.5 mb-0.5 px-1">
            <span className={`text-[11px] font-black ${ROLE_COLOR[m.senderRole] || "text-slate-600"}`}>{m.senderName}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{m.senderRole}</span>
            <span className="text-[9px] text-slate-400">{formatTime(m.createdAt)}</span>
          </div>
        )}
        <div
          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-xs ${
            mine
              ? "bg-[#0369a1] text-white rounded-br-sm"
              : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
          }`}
        >
          {m.content}
        </div>
        {mine && <span className="text-[9px] text-slate-400 mt-0.5 px-1">{formatTime(m.createdAt)}</span>}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[520px] sm:h-[600px] rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header with tabs */}
      <div className="flex items-center gap-1 px-3 py-2.5 border-b border-slate-100 bg-slate-50">
        <button
          type="button"
          onClick={() => setMode("public")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mode === "public" ? "bg-[#0369a1] text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Phòng chat chung</span>
          <span className="sm:hidden">Chung</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("dm")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mode === "dm" ? "bg-[#0369a1] text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tin nhắn riêng</span>
          <span className="sm:hidden">Riêng</span>
          {conversations.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
              {conversations.length}
            </span>
          )}
        </button>
      </div>

      {/* ---- PUBLIC CHAT ---- */}
      {mode === "public" && (
        <>
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-2.5 bg-slate-50/40">
            {pubLoading ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải tin nhắn…
              </div>
            ) : pubError ? (
              <div className="text-xs text-rose-600 text-center py-6">{pubError}</div>
            ) : pubMessages.length === 0 ? (
              <div className="text-center py-10">
                <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Chưa có tin nhắn nào. Hãy là người đầu tiên chào mọi người! 👋</p>
              </div>
            ) : (
              pubMessages.map((m) => renderMessage(m, m.senderEmail === myEmail))
            )}
            <div ref={pubBottomRef} />
          </div>
          <form onSubmit={handlePubSend} className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-200 bg-white">
            <input
              type="text"
              value={pubInput}
              onChange={(e) => setPubInput(e.target.value)}
              placeholder={user ? "Nhập tin nhắn…" : "Đăng nhập để gửi tin nhắn"}
              disabled={!user || pubSending}
              maxLength={500}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0369a1] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!user || pubSending || !pubInput.trim()}
              className="shrink-0 w-10 h-10 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pubSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </>
      )}

      {/* ---- DIRECT MESSAGES ---- */}
      {mode === "dm" && (
        <div className="flex flex-1 min-h-0">
          {/* Conversation list */}
          <div className={`${activePartner ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-72 border-r border-slate-200 bg-slate-50/60`}>
            <div className="p-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    placeholder="Tìm người dùng…"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewChat(!showNewChat)}
                  className="w-8 h-8 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white flex items-center justify-center transition-all shrink-0"
                  aria-label="Tìm người mới"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search results */}
            {showNewChat && searchResults.length > 0 && (
              <div className="border-b border-slate-200 bg-white max-h-40 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => startConversation(u)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#0369a1] text-white text-xs font-black flex items-center justify-center shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{u.role}</span>
                  </button>
                ))}
              </div>
            )}
            {showNewChat && searching && (
              <div className="px-3 py-2 text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tìm…
              </div>
            )}

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && !showNewChat ? (
                <div className="text-center py-8 px-3">
                  <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Chưa có hội thoại nào.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Bấm <UserPlus className="w-3 h-3 inline" /> để tìm và nhắn tin.</p>
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.partnerEmail}
                    type="button"
                    onClick={() => { setActivePartner(c); fetchDm(c.partnerEmail); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-slate-100 ${
                      activePartner?.partnerEmail === c.partnerEmail
                        ? "bg-[#0369a1]/10"
                        : "hover:bg-white"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center shrink-0">
                      {c.partnerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{c.partnerName}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {c.isMine ? "Bạn: " : ""}{c.lastMessage}
                      </p>
                    </div>
                    <span className="text-[9px] text-slate-400 shrink-0">
                      {formatTime(c.lastTime)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat window */}
          <div className={`${activePartner ? "flex" : "hidden sm:flex"} flex-col flex-1 min-w-0`}>
            {activePartner ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setActivePartner(null)}
                    className="sm:hidden w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shrink-0"
                    aria-label="Quay lại"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-[#0369a1] text-white text-xs font-black flex items-center justify-center shrink-0">
                    {activePartner.partnerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-900 truncate">{activePartner.partnerName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{activePartner.partnerEmail}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-2.5 bg-slate-50/40">
                  {dmLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải…
                    </div>
                  ) : dmMessages.length === 0 ? (
                    <div className="text-center py-10">
                      <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Chưa có tin nhắn. Hãy gửi lời chào! 👋</p>
                    </div>
                  ) : (
                    dmMessages.map((m) => renderMessage(m, m.senderEmail === myEmail))
                  )}
                  <div ref={dmBottomRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleDmSend} className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-200 bg-white">
                  <input
                    type="text"
                    value={dmInput}
                    onChange={(e) => setDmInput(e.target.value)}
                    placeholder="Nhập tin nhắn…"
                    disabled={dmSending}
                    maxLength={500}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0369a1] disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={dmSending || !dmInput.trim()}
                    className="shrink-0 w-10 h-10 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {dmSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                <div className="text-center">
                  <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p>Chọn một hội thoại hoặc tìm người mới để nhắn tin.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}