"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Trash2,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
} from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { SectionCard, StatusBadge } from "./AdminUI";
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

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản Trị",
  ORGANIZER: "Ban Tổ Chức",
  OWNER: "Chủ Sân",
  PLAYER: "Cầu Thủ",
};

const CHANNELS = [
  { value: "", label: "Tất Cả Kênh" },
  { value: "general", label: "Phòng Chat Chung" },
  { value: "vang-lai", label: "Bắt Kèo Vãng Lai" },
  { value: "bu-thieu-nguoi", label: "Bù Thiếu Người" },
  { value: "doi-30p", label: "Tìm Đối 30 Phút" },
  { value: "tinh-trang-san", label: "Tình Trạng Sân" },
  { value: "khieu-nai", label: "Khiếu Nại & Góp Ý" },
  { value: "ho-dap-luat", label: "Hỏi Đáp Luật" },
  { value: "tuyen-cau-thu", label: "Tuyển Cầu Thủ" },
];

export default function AdminChatModeration({
  notify,
}: {
  notify: (type: "ok" | "err", text: string) => void;
}) {
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
      await apiRequest(`/api/v1/chat/admin/messages/${confirmDelete.id}`, { method: "DELETE" });
      notify("ok", "Đã xóa tin nhắn vi phạm thành công.");
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
      header: "Mã",
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => <span className="font-mono font-bold text-slate-500">#{r.id}</span>,
    },
    {
      key: "sender",
      header: "Người gửi",
      sortable: true,
      sortValue: (r) => r.senderName ?? "",
      render: (r) => (
        <div className="max-w-[200px]">
          <p className="font-bold text-slate-900 truncate">{r.senderName}</p>
          <p className="text-[12px] font-mono text-slate-500 truncate">{r.senderEmail}</p>
          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
            {ROLE_LABEL[r.senderRole] ?? r.senderRole}
          </span>
        </div>
      ),
    },
    {
      key: "where",
      header: "Kênh / Nhóm",
      sortable: true,
      sortValue: (r) => r.channel ?? r.recipientEmail ?? "",
      render: (r) => {
        if (r.groupId) {
          return (
            <span className="inline-flex px-2 py-0.5 rounded-md text-[12px] font-semibold bg-slate-100 text-slate-700">
              Nhóm #{r.groupId}
            </span>
          );
        }
        if (r.recipientEmail) {
          return (
            <span className="inline-flex px-2 py-0.5 rounded-md text-[12px] font-semibold bg-slate-100 text-slate-700">
              DM → {r.recipientName || r.recipientEmail}
            </span>
          );
        }
        return (
          <span className="inline-flex px-2 py-0.5 rounded-md text-[12px] font-semibold bg-slate-100 text-slate-700">
            #{r.channel || "general"}
          </span>
        );
      },
    },
    {
      key: "content",
      header: "Nội dung tin nhắn",
      render: (r) => (
        <div className="max-w-[380px]">
          {r.pinned && (
            <span className="text-[12px] font-bold text-amber-700 mr-1.5 bg-amber-50 px-1.5 py-0.5 rounded">
              [Ghim]
            </span>
          )}
          <span className="text-slate-800 break-words text-[13px]">{r.content}</span>
        </div>
      ),
    },
    {
      key: "time",
      header: "Thời gian",
      sortable: true,
      sortValue: (r) => r.createdAt ?? "",
      render: (r) => (
        <span className="text-[12px] font-mono text-slate-500 whitespace-nowrap">
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
          title="Xóa tin nhắn vi phạm"
          disabled={busyId === r.id}
          onClick={() => {
            setConfirmDelete(r);
            setTimeout(() => {
              document
                .getElementById("admin-chat-confirm-inline")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 50);
          }}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* KHỐI XÁC NHẬN XÓA TIN NHẮN INLINE (ZERO-MODAL) */}
      {confirmDelete && (
        <div
          id="admin-chat-confirm-inline"
          className="rounded-2xl bg-white border border-slate-300 p-5 shadow-sm space-y-3 animate-fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[14px] font-bold text-slate-900">
                Xác nhận xóa tin nhắn vi phạm của “{confirmDelete.senderName}”?
              </h4>
              <p className="text-[13px] text-slate-600 mt-1 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200 break-words">
                “{confirmDelete.content}”
              </p>
              <p className="text-[12px] text-slate-400 mt-1">
                Kênh: #{confirmDelete.channel || "general"} • Thời gian:{" "}
                {confirmDelete.createdAt ? String(confirmDelete.createdAt).replace("T", " ").slice(0, 16) : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={doDelete}
              disabled={busyId !== null}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {busyId !== null ? "Đang xóa..." : "Xác Nhận Xóa Tin Nhắn"}
            </button>
          </div>
        </div>
      )}

      {/* KHỐI BẢNG DANH MỤC TIN NHẮN CHAT */}
      <SectionCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-black text-slate-900 text-base">Kiểm Duyệt Phòng Chat Cộng Đồng</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Giám sát tin nhắn các kênh công khai và nhóm chat giải đấu, xử lý phát ngôn tiêu cực.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shadow-2xs"
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={load}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tải Lại</span>
            </button>
          </div>
        </div>

        <AdminTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          searchPlaceholder="Tìm theo tên, email, nội dung tin nhắn…"
          searchFilter={(r, q) =>
            [r.senderName, r.senderEmail, r.content, r.channel ?? "", r.recipientEmail ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(q)
          }
          emptyTitle="Chưa có tin nhắn nào trong kênh này."
        />
      </SectionCard>
    </div>
  );
}
