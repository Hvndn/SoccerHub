"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MessageSquare, Loader2, Handshake, AlertCircle, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/api";

export interface BusinessContact {
  name: string;
  email: string;
  role: string;
}

interface BusinessContactsProps {
  viewerRole: "OWNER" | "ORGANIZER" | "PLAYER" | "ADMIN";
  onStartDm?: (partnerEmail: string, partnerName: string) => void;
}

const COUNTERPART: Record<string, { role: string; label: string; empty: string }> = {
  OWNER: {
    role: "ORGANIZER",
    label: "Ban Tổ Chức",
    empty: "Chưa có tài khoản Ban Tổ Chức.",
  },
  ORGANIZER: {
    role: "OWNER",
    label: "Chủ Sân",
    empty: "Chưa có tài khoản Chủ Sân.",
  },
};

export default function BusinessContacts({ viewerRole, onStartDm }: BusinessContactsProps) {
  const cfg = COUNTERPART[viewerRole];
  const [contacts, setContacts] = useState<BusinessContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!cfg) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await apiRequest<BusinessContact[]>(
        `/api/v1/chat/users?role=${encodeURIComponent(cfg.role)}`
      );
      setContacts(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setError(e?.message || "Không tải được danh sách.");
    } finally {
      setLoading(false);
    }
  }, [cfg]);

  useEffect(() => {
    load();
  }, [load]);

  if (!cfg) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:px-5 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#0369a1]/10 border border-[#0369a1]/25 flex items-center justify-center shrink-0">
            <Handshake className="w-4 h-4 text-[#0b4f6c]" />
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-sm font-black text-slate-900">
              Liên Hệ {cfg.label}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[13px] font-bold">
              {loading ? "…" : `${contacts.length} đối tác`}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="text-[13px] font-bold text-[#0369a1] hover:underline disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Đang tải…" : "Tải lại"}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <span>{expanded ? "Thu gọn" : "Xem"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="pt-3 mt-3 border-t border-slate-100">
          {error && (
            <p className="flex items-center gap-1.5 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {loading && contacts.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-3 text-[13px] text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tải…</span>
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-[13px] text-slate-500 py-2 text-center">{cfg.empty}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {contacts.map((c) => (
                <div
                  key={c.email}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900 truncate">{c.name}</p>
                    <p className="text-[13px] text-slate-500 truncate">{c.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartDm?.(c.email, c.name)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black transition-all active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Nhắn tin</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
