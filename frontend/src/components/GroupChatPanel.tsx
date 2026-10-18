"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Users, Send, Loader2, ArrowLeft, Plus, UserPlus, Trash2, Crown,
  MessageCircle, Settings2, X, ShieldCheck, Bell,
} from "lucide-react";
import PageSpinner from "./PageSpinner";
import {
  listMyGroups, getGroup, getGroupMessages, sendGroupMessage, markGroupRead,
  createGroup, addGroupMember, removeGroupMember, deleteGroup,
  type GroupSummary, type GroupMessage, reportGroupError,
} from "@/lib/groupChat";
import { toastOk } from "@/lib/toast";
import { useChatPushNotification } from "@/lib/pushNotify";

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "text-rose-600",
  ORGANIZER: "text-amber-700",
  OWNER: "text-sky-700",
  PLAYER: "text-[#0b4f6c]",
};

function formatTime(iso?: string | null): string {
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

export default function GroupChatPanel({ user, myEmail }: { user?: any; myEmail?: string }) {
  const my = (myEmail || user?.email || "").toLowerCase();

  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [detail, setDetail] = useState<GroupSummary | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [gName, setGName] = useState("");
  const [gDesc, setGDesc] = useState("");
  const [gMembers, setGMembers] = useState("");
  const [creating, setCreating] = useState(false);

  const [showMembers, setShowMembers] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [busyMember, setBusyMember] = useState(false);

  // ---- Danh sách nhóm ----
  const loadGroups = useCallback(async (silent = false) => {
    try {
      setGroups(await listMyGroups());
    } catch (e: any) {
      if (!silent) reportGroupError(e, "Không tải được danh sách nhóm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    const t = window.setInterval(() => loadGroups(true), 8000);
    return () => window.clearInterval(t);
  }, [loadGroups]);

  // ---- Mở nhóm ----
  const openGroup = async (g: GroupSummary) => {
    setActiveId(g.id);
    setMsgLoading(true);
    setReplyTo(null);
    try {
      const [d, msgs] = await Promise.all([getGroup(g.id), getGroupMessages(g.id)]);
      setDetail(d);
      setMessages(msgs);
      await markGroupRead(g.id).catch(() => {});
      loadGroups(true);
    } catch (e: any) {
      reportGroupError(e, "Không mở được nhóm chat.");
    } finally {
      setMsgLoading(false);
    }
  };

  // ---- Polling tin nhóm đang mở ----
  useEffect(() => {
    if (activeId == null) return;
    const t = window.setInterval(async () => {
      try {
        const msgs = await getGroupMessages(activeId);
        setMessages(msgs);
      } catch {
        /* im lặng, lần sau thử lại */
      }
    }, 4000);
    return () => window.clearInterval(t);
  }, [activeId]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activeId]);

  // ---- Gửi tin ----
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || activeId == null) return;
    setSending(true);
    try {
      await sendGroupMessage(activeId, text, replyTo?.id ?? null);
      setInput("");
      setReplyTo(null);
      setMessages(await getGroupMessages(activeId));
    } catch (err: any) {
      reportGroupError(err, "Không gửi được tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  // ---- Tạo nhóm ----
  const handleCreate = async () => {
    const name = gName.trim();
    if (name.length < 3) return;
    setCreating(true);
    try {
      const emails = gMembers
        .split(/[,;\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.includes("@") && s !== my);
      const g = await createGroup({ name, description: gDesc.trim() || undefined, memberEmails: emails });
      toastOk(`Đã tạo nhóm "${g.name}".`);
      setShowCreate(false);
      setGName(""); setGDesc(""); setGMembers("");
      await loadGroups();
      await openGroup(g);
    } catch (e: any) {
      reportGroupError(e, "Không tạo được nhóm.");
    } finally {
      setCreating(false);
    }
  };

  // ---- Thêm / gỡ thành viên ----
  const handleAdd = async () => {
    const email = addEmail.trim().toLowerCase();
    if (!email.includes("@") || activeId == null) return;
    setBusyMember(true);
    try {
      await addGroupMember(activeId, email);
      setAddEmail("");
      setDetail(await getGroup(activeId));
      loadGroups(true);
    } catch (e: any) {
      reportGroupError(e, "Không thêm được thành viên.");
    } finally {
      setBusyMember(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (activeId == null) return;
    setBusyMember(true);
    try {
      await removeGroupMember(activeId, email);
      setDetail(await getGroup(activeId));
      loadGroups(true);
    } catch (e: any) {
      reportGroupError(e, "Không gỡ được thành viên.");
    } finally {
      setBusyMember(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (activeId == null) return;
    setBusyMember(true);
    try {
      await deleteGroup(activeId);
      setActiveId(null);
      setDetail(null);
      setMessages([]);
      await loadGroups();
    } catch (e: any) {
      reportGroupError(e, "Không xoá được nhóm.");
    } finally {
      setBusyMember(false);
    }
  };

  const msgById = useMemo(() => {
    const map: Record<number, GroupMessage> = {};
    messages.forEach((m) => { map[m.id] = m; });
    return map;
  }, [messages]);

  // Nút bật thông báo: chỉ hiện khi trình duyệt hỗ trợ và chưa cấp quyền
  const { permission, supported, requestPermission } = useChatPushNotification(
    activeId != null,
    messages,
    my
  );
  const canAskPush = supported && permission !== "granted" && permission !== "unsupported";

  /* =========================================================
   * DANH SÁCH NHÓM
   * ========================================================= */
  if (activeId == null) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[#0369a1]" />
            Nhóm chat của tôi
          </h3>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#0369a1] hover:text-[#075985] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo nhóm
          </button>
        </div>

        {showCreate && (
          <div className="px-4 sm:px-5 py-4 bg-slate-50 border-b border-slate-200 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Tên nhóm *</label>
              <input
                value={gName}
                onChange={(e) => setGName(e.target.value)}
                maxLength={60}
                placeholder="VD: Đội FC Bách Khoa — chuẩn bị giải"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Mô tả</label>
              <input
                value={gDesc}
                onChange={(e) => setGDesc(e.target.value)}
                maxLength={200}
                placeholder="Mục đích nhóm (tuỳ chọn)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Thêm thành viên (email, cách nhau bằng dấu phẩy)</label>
              <input
                value={gMembers}
                onChange={(e) => setGMembers(e.target.value)}
                placeholder="a@Turfzone.vn, b@Turfzone.vn"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || gName.trim().length < 3}
                className="px-4 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-xs font-black transition-all active:scale-95 disabled:opacity-40"
              >
                {creating ? "Đang tạo…" : "Tạo nhóm"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
              >
                Huỷ
              </button>
              <span className="text-[11px] text-slate-500">Tối đa 30 thành viên.</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <PageSpinner size="sm" showText={false} sub="Đang tải nhóm…" />
          </div>
        ) : groups.length === 0 ? (
          <div className="px-5 py-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Chưa có nhóm chat nào</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Tạo nhóm để rủ đội bóng, đồng đội hoặc BTC vào một phòng riêng tư.
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-xs font-black transition-all active:scale-95"
            >
              Tạo nhóm đầu tiên
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {groups.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => openGroup(g)}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-sky-50 ring-2 ring-[#0369a1]/25 group-hover:ring-[#0369a1]/60 transition-all flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#0369a1]" />
                    </div>
                    {g.unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0369a1] text-white text-[9px] font-black flex items-center justify-center border-2 border-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{g.name}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {g.lastMessage ? `${g.lastSender}: ${g.lastMessage}` : g.description || "Chưa có tin nhắn"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {g.lastTime && <span className="text-[10px] text-slate-500 font-semibold">{formatTime(g.lastTime)}</span>}
                    <span className="text-[10px] text-slate-500">{g.memberCount} thành viên</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  /* =========================================================
   * PHÒNG CHAT NHÓM
   * ========================================================= */
  return (
    <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-3.5 sm:px-5 py-3 border-b border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => { setActiveId(null); setDetail(null); setMessages([]); }}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0369a1] flex items-center justify-center transition-all active:scale-95 shrink-0"
          aria-label="Quay lại danh sách nhóm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-9 h-9 rounded-full bg-sky-50 ring-2 ring-[#0369a1]/30 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-[#0369a1]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900 truncate leading-tight">
            {detail?.name || "Nhóm chat"}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {detail ? `${detail.memberCount} thành viên` : ""}
            {detail?.isOwner ? " · Bạn là chủ nhóm" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowMembers((v) => !v)}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95 shrink-0"
          aria-label="Quản lý thành viên"
          title="Thành viên"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Panel thành viên */}
      {showMembers && detail && (
        <div className="px-4 sm:px-5 py-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Thành viên</p>
          <ul className="space-y-1.5">
            {(detail.members || []).map((m) => (
              <li key={m.email} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-50 ring-1 ring-[#0369a1]/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-[#0369a1]">
                    {(m.name || m.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                    {m.name || m.email}
                    {m.isOwner && <Crown className="w-3 h-3 text-amber-600 shrink-0" />}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{m.email}</p>
                </div>
                {detail.isOwner && !m.isOwner && (
                  <button
                    type="button"
                    onClick={() => handleRemove(m.email)}
                    disabled={busyMember}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors disabled:opacity-40 shrink-0"
                    title="Gỡ khỏi nhóm"
                    aria-label={`Gỡ ${m.email}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {detail.isOwner ? (
            <>
              <div className="flex items-center gap-2 pt-1">
                <input
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                  placeholder="email người muốn thêm"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={busyMember || !addEmail.includes("@")}
                  className="px-3 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Thêm
                </button>
              </div>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={busyMember}
                className="w-full px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black transition-all active:scale-95 disabled:opacity-40"
              >
                Xoá nhóm này
              </button>
            </>
          ) : (
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Chỉ chủ nhóm mới thêm/gỡ thành viên.
            </p>
          )}
        </div>
      )}

      {/* Tin nhắn */}
      <div className="h-[420px] overflow-y-auto px-3 sm:px-4 py-3 space-y-2.5 bg-slate-50/40">
        {msgLoading ? (
          <div className="flex items-center justify-center h-full">
            <PageSpinner size="sm" showText={false} sub="Đang tải tin nhắn…" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Nhóm chưa có tin nhắn nào.</p>
            <p className="text-[11px] text-slate-400 mt-1">Hãy là người đầu tiên nhắn tin 👋</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderEmail === my;
            const quoted = m.replyToId ? msgById[m.replyToId] : null;
            return (
              <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] sm:max-w-[70%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  {!mine && (
                    <div className="flex items-center gap-1.5 mb-0.5 px-1">
                      <span className={`text-[11px] font-black ${ROLE_COLOR[m.senderRole] || "text-slate-600"}`}>
                        {m.senderName}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{m.senderRole}</span>
                    </div>
                  )}
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-xs ${
                      mine
                        ? "bg-[#0369a1] text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {quoted && (
                      <div className="mb-1.5 pl-2 border-l-2 border-slate-300 text-[11px] italic text-slate-500 line-clamp-2">
                        {quoted.senderName}: {quoted.content}
                      </div>
                    )}
                    {m.content}
                  </div>
                  <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${mine ? "flex-row-reverse" : ""}`}>
                    <span className="text-[9px] text-slate-400">{formatTime(m.createdAt)}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setReplyTo(m)}
                        className="p-1 rounded-md text-slate-400 hover:text-[#0369a1] hover:bg-slate-100 transition-colors"
                        title="Trả lời"
                        aria-label="Trả lời tin nhắn"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <polyline points="9 17 4 12 9 7" />
                          <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Ô trả lời */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 border-t border-slate-200 bg-sky-50">
          <div className="min-w-0 flex-1 text-[11px] text-slate-600 truncate">
            <span className="font-bold text-slate-800">Trả lời {replyTo.senderName}: </span>
            {replyTo.content}
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white transition-colors shrink-0"
            aria-label="Huỷ trả lời"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Gửi tin */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-200 bg-white">
        {canAskPush && (
          <button
            type="button"
            onClick={requestPermission}
            title="Bật thông báo khi có tin mới"
            aria-label="Bật thông báo tin nhắn mới"
            className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95"
          >
            <Bell className="w-4 h-4" />
          </button>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhắn vào nhóm…"
          disabled={sending}
          maxLength={500}
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0369a1] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}