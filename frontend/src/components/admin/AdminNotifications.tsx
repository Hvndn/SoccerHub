"use client";

import React, { useState } from "react";
import { Megaphone, Send, Loader2 } from "lucide-react";
import { SectionCard } from "./AdminUI";
import { broadcastNotification } from "@/lib/adminService";
import { toastErr, toastOk } from "@/lib/toast";

const TARGET_ROLES = [
  { value: "ALL", label: "Tất cả người dùng" },
  { value: "PLAYER", label: "Cầu thủ" },
  { value: "OWNER", label: "Chủ sân" },
  { value: "ORGANIZER", label: "Ban tổ chức" },
];

export default function AdminNotifications({ notify }: { notify: (type: "ok" | "err", text: string) => void }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const m = message.trim();
    if (!t || !m) {
      notify("err", "Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }
    setSending(true);
    try {
      const res = await broadcastNotification({
        title: t,
        message: m,
        targetRole,
        link: link.trim() || null,
      });
      notify("ok", res.message || "Đã gửi thông báo.");
      setTitle("");
      setMessage("");
      setLink("");
      setTargetRole("ALL");
    } catch (err: any) {
      notify("err", err?.message || "Gửi thông báo thất bại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0369a1] flex items-center justify-center">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-sm">Gửi thông báo hệ thống</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Thông báo sẽ hiện trong chuông của người dùng được chọn.
            </p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Nhóm nhận</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
            >
              {TARGET_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tiêu đề *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="VD: Bảo trì hệ thống ngày 20/10"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Nội dung *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Nội dung thông báo gửi tới người dùng…"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0369a1] resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right">{message.length}/500</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Liên kết (tuỳ chọn)</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              maxLength={200}
              placeholder="VD: /?tab=tournaments"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-xs font-black transition-all active:scale-95 disabled:opacity-40 flex items-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Gửi thông báo
            </button>
            <span className="text-[11px] text-slate-500">
              Gửi đến: <strong className="text-slate-700">{TARGET_ROLES.find(r => r.value === targetRole)?.label}</strong>
            </span>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}