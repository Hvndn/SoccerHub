"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Trash2, MessageSquare, RefreshCw } from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { ConfirmModal, SectionCard, StatusBadge } from "./AdminUI";
import { apiRequest } from "@/lib/api";

interface ChatMsg {
  id: number;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  channel?: string;
  groupId?: number;
  recipientEmail?: string;
  recipientName?: string;
  content: string;
  pinned?: boolean;
  createdAt: string;
}

export default function AdminChatModeration({ notify }: { notify: (type: "ok" | "err", text: string) => void }) {
/** Nhãn vai trò tiếng Việt (tránh lộ mã role ra UI). */
const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản Trị",
  ORGANIZER: "Ban Tổ Chức",
  OWNER: "Chủ Sân",
  PLAYER: "Cầu Thủ",
};

  const [rows, setRows] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<ChatMsg | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const url = channel
        ? `/api/v1/chat/admin/messages?channel=${encodeURIComponent(channel)}&limit=200`
        : `/api/v1/chat/admin/messages?limit=200`;
      const data = await apiRequest<ChatMsg[]>(url);
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      notify("err", err?.message || "Không tải được tin nhắn chat.");
    } finally {
      setLoading(false);
    }
  }, [channel, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      setBusyId(confirmDelete.id);
      await apiRequest(`/api/v1/chat/messages/${confirmDelete.id}`, { method: "DELETE" });
      notify("ok", "Đã xóa tin nhắn.");
      setConfirmDelete(null);
      await load();
    } catch (err: any) {
      notify("err", err?.message || "Xóa thất bại. Cần đăng nhập ADMIN.");
    } finally {
      setBusyId(null);
    }
  };

  const columns: AdminColumn<ChatMsg>[] = [
    {
      key: "id",
      header: "#",
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => <span className="font-mono font-bold text-slate-500">{r.id}</span>,
    },
    {
      key: "sender",
      header: "Người gửi",
      sortable: true,
      sortValue: (r) => r.senderName ?? "",
      render: (r) => (
        <div className="max-w-[180px]">
          <p className="font-bold text-slate-900 truncate">{r.senderName}</p>
          <p className="text-[13px] font-mono text-slate-500 truncate">{r.senderEmail}</p>
          <span className="text-[13px] font-bold text-slate-400">{ROLE_LABEL[r.senderRole] ?? r.senderRole}</span>
        </div>
      ),
    },
    {
      key: "where",
      header: "Kênh / DM",
      sortable: true,
      sortValue: (r) => r.channel ?? r.recipientEmail ?? "",
      render: (r) => {
        if (r.groupId) return <StatusBadge tone="sky">Nhóm #{r.groupId}</StatusBadge>;
        if (r.recipientEmail) return <StatusBadge tone="amber">DM → {r.recipientName || r.recipientEmail}</StatusBadge>;
        return <StatusBadge tone="slate">{r.channel || "general"}</StatusBadge>;
      },
    },
    {
      key: "content",
      header: "Nội dung",
      render: (r) => (
        <div className="max-w-[360px]">
          {r.pinned && <span className="text-[13px] font-bold text-amber-600 mr-1">[Ghim]</span>}
          <span className="text-slate-700 break-words">{r.content}</span>
        </div>
      ),
    },
    {
      key: "time",
      header: "Thời gian",
      sortable: true,
      sortValue: (r) => r.createdAt ?? "",
      render: (r) => (
        <span className="text-[13px] font-mono text-slate-500 whitespace-nowrap">
          {r.createdAt ? String(r.createdAt).replace("T", " ").slice(0, 16) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (r) => (
        <button
          type="button"
          title="Xóa tin nhắn"
          disabled={busyId === r.id}
          onClick={() => setConfirmDelete(r)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <SectionCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-black text-slate-900 text-sm">Kiểm duyệt tin nhắn chat</h2>
            <p className="hidden sm:block text-[13px] text-slate-500 mt-0.5">
              Xem và gỡ tin vi phạm trong các kênh công khai và nhóm chat.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
            >
              <option value="">Tất cả kênh</option>
              <option value="general">Phòng Chat Chung</option>
              <option value="vang-lai">Bắt Kèo Vàng Lai</option>
              <option value="bu-thieu-nguoi">Bù Thiếu Người</option>
              <option value="doi-30p">Tìm Đối 30 Phút</option>
              <option value="tinh-trang-san">Tình Trạng Sân</option>
              <option value="khieu-nai">Khiêu Nại & Góp Ý</option>
              <option value="ho-dap-luat">Hỏi Đáp Luật</option>
              <option value="do-dung-cu">Đồ Dụng Cụ</option>
              <option value="tuyen-cau-thu">Tuyển Cầu Thủ</option>
            </select>
            <button
              type="button"
              onClick={load}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-700 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tải lại
            </button>
          </div>
        </div>

        <AdminTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          searchPlaceholder="Tìm theo tên, email, nội dung…"
          searchFilter={(r, q) =>
            [r.senderName, r.senderEmail, r.content, r.channel ?? "", r.recipientEmail ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(q)
          }
          emptyTitle="Chưa có tin nhắn nào."
        />
      </SectionCard>

      <ConfirmModal
        open={!!confirmDelete}
        title="Xóa tin nhắn"
        message={
          confirmDelete
            ? `Xóa tin nhắn #${confirmDelete.id} của ${confirmDelete.senderName}?\n\n"${confirmDelete.content.slice(0, 80)}${confirmDelete.content.length > 80 ? "…" : ""}"`
            : ""
        }
        confirmLabel="Xóa"
        danger
        busy={busyId === confirmDelete?.id}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
