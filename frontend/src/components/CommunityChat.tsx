"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Loader2, LogIn } from "lucide-react";
import { apiRequest, ensureLoggedIn } from "@/lib/api";
import { toastErr } from "@/lib/toast";

interface ChatMessage {
  id: number;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  content: string;
  createdAt: string;
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
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function CommunityChat({ user }: { user?: any }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<number>(0);

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const data = await apiRequest<ChatMessage[]>("/api/v1/chat/messages");
      const arr = Array.isArray(data) ? data : [];
      setMessages(arr);
      if (arr.length > 0) lastIdRef.current = arr[arr.length - 1].id;
      setError(null);
    } catch (e: any) {
      if (!silent) setError(e?.message || "Không tải được tin nhắn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const timer = window.setInterval(() => fetchMessages(true), 4000);
    return () => window.clearInterval(timer);
  }, [fetchMessages]);

  useEffect(() => {
    // Auto-scroll xuống cuối khi có tin mới
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (!ensureLoggedIn("gửi tin nhắn")) return;
    setSending(true);
    try {
      await apiRequest("/api/v1/chat/messages", {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });
      setInput("");
      await fetchMessages(true);
    } catch (err: any) {
      toastErr(err?.message || "Không gửi được tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  const myEmail = (user?.email || "").toLowerCase();

  return (
    <div className="flex flex-col h-[520px] sm:h-[600px] rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <MessageCircle className="w-5 h-5 text-[#0369a1]" />
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-sm text-slate-900 leading-tight">Chat Cộng Đồng SoccerHub</h3>
          <p className="text-[11px] text-slate-500">
            Phòng chat công khai — mọi cầu thủ, chủ sân, BTC đều thấy. Tin nhắn tự làm mới mỗi 4 giây.
          </p>
        </div>
        <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
          {messages.length} tin
        </span>
      </div>

      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-2.5 bg-slate-50/40">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải tin nhắn…
          </div>
        ) : error ? (
          <div className="text-xs text-rose-600 text-center py-6">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              Chưa có tin nhắn nào. Hãy là người đầu tiên chào mọi người! 👋
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = myEmail !== "" && m.senderEmail === myEmail;
            const roleColor = ROLE_COLOR[m.senderRole] || "text-slate-600";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] sm:max-w-[70%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  {!mine && (
                    <div className="flex items-center gap-1.5 mb-0.5 px-1">
                      <span className={`text-[11px] font-black ${roleColor}`}>{m.senderName}</span>
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
                  {mine && (
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1">{formatTime(m.createdAt)}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-200 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={user ? "Nhập tin nhắn…" : "Đăng nhập để gửi tin nhắn"}
          disabled={!user || sending}
          maxLength={500}
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0369a1] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!user || sending || !input.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}