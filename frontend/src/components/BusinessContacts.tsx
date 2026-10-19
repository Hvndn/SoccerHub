"use client";

/* =========================================================
 * BusinessContacts — Kênh liên lạc B2B giữa Chủ sân và Ban tổ chức
 *
 * Vấn đề giải quyết: trước đây BTC muốn thuê sân cho giải, hoặc chủ sân
 * muốn tìm BTC tổ chức giải, phải tra email qua admin hoặc gõ tay trong ô
 * tìm kiếm người dùng (mà vẫn phải biết trước email của đối phương).
 *
 * Giải pháp: danh sách đối tác theo vai trò đối diện + nút "Nhắn tin" mở
 * thẳng cuộc trò chuyện riêng. Không tạo bảng/endpoint mới — chỉ dùng
 * GET /api/v1/chat/users?role=... đã có sẵn và mở CommunityChat ở chế độ DM.
 * ========================================================= */

import React, { useCallback, useEffect, useState } from "react";
import { MessageSquare, Loader2, Handshake, Users2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

export interface BusinessContact {
  name: string;
  email: string;
  role: string;
}

interface BusinessContactsProps {
  /** Vai trò của người đang xem — dùng để chọn ra nhóm đối tác đối diện. */
  viewerRole: "OWNER" | "ORGANIZER" | "PLAYER" | "ADMIN";
  /** Mở cuộc trò chuyện riêng với đối tác (được page.tsx nối sang tab Cộng đồng). */
  onStartDm?: (partnerEmail: string, partnerName: string) => void;
}

const COUNTERPART: Record<string, { role: string; label: string; hint: string; empty: string }> = {
  OWNER: {
    role: "ORGANIZER",
    label: "Ban Tổ Chức",
    hint: "Liên hệ BTC để đề xuất tổ chức giải tại cụm sân của bạn.",
    empty: "Chưa có tài khoản Ban Tổ Chức nào trên hệ thống.",
  },
  ORGANIZER: {
    role: "OWNER",
    label: "Chủ Sân",
    hint: "Liên hệ chủ sân để thuê sân phục vụ giải đấu của bạn.",
    empty: "Chưa có chủ sân nào đăng ký trên hệ thống.",
  },
};

const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ORGANIZER: "bg-sky-50 text-sky-700 border-sky-200",
  ADMIN: "bg-amber-50 text-amber-700 border-amber-200",
  PLAYER: "bg-slate-50 text-slate-600 border-slate-200",
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Chủ Sân",
  ORGANIZER: "Ban Tổ Chức",
  ADMIN: "Quản Trị",
  PLAYER: "Cầu Thủ",
};

export default function BusinessContacts({ viewerRole, onStartDm }: BusinessContactsProps) {
  const cfg = COUNTERPART[viewerRole];
  const [contacts, setContacts] = useState<BusinessContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(e?.message || "Không tải được danh sách đối tác.");
    } finally {
      setLoading(false);
    }
  }, [cfg]);

  useEffect(() => {
    load();
  }, [load]);

  // Không áp dụng cho cầu thủ / admin — component này chỉ phục vụ 2 vai trò nghiệp vụ.
  if (!cfg) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 border border-[#0369a1]/30 flex items-center justify-center shrink-0">
            <Handshake className="w-5 h-5 text-[#0b4f6c]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
              Liên hệ {cfg.label}
            </h3>
            <p className="text-[11px] text-slate-500 truncate">{cfg.hint}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="shrink-0 text-[11px] font-bold text-[#0369a1] hover:underline disabled:opacity-50"
        >
          {loading ? "Đang tải…" : "Tải lại"}
        </button>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
          {error}
        </p>
      )}

      {loading && contacts.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-5 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải danh sách…
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-5 text-center">
          <Users2 className="w-8 h-8 text-slate-300" />
          <p className="text-xs text-slate-500">{cfg.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {contacts.map((c) => (
            <div
              key={c.email}
              className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200"
            >
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 truncate">{c.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{c.email}</p>
                <span
                  className={`inline-block mt-1 px-1.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wide ${
                    ROLE_BADGE[c.role] ?? ROLE_BADGE.PLAYER
                  }`}
                >
                  {ROLE_LABEL[c.role] ?? c.role}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onStartDm?.(c.email, c.name)}
                className="shrink-0 w-9 h-9 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white flex items-center justify-center transition-all active:scale-95"
                title={`Nhắn tin cho ${c.name}`}
                aria-label={`Nhắn tin cho ${c.name}`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}