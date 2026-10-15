"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { ConfirmModal, SectionCard, StatusBadge } from "./AdminUI";
import {
  deleteMatchmakingPost,
  listMatchmakingPosts,
  type MatchmakingPost,
} from "@/lib/adminService";
import { formatMoney } from "@/lib/tournamentService";

const STATUS_TONE: Record<string, "green" | "amber" | "rose" | "sky" | "slate"> = {
  OPEN: "green",
  MATCHED: "sky",
  CANCELLED: "slate",
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: "Đang mở",
  MATCHED: "Đã ghép",
  CANCELLED: "Đã hủy",
};

export default function AdminModeration({ notify }: { notify: (type: "ok" | "err", text: string) => void }) {
  const [rows, setRows] = useState<MatchmakingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MatchmakingPost | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await listMatchmakingPosts());
    } catch (err: any) {
      notify("err", err?.message || "Không tải được tin chợ kèo.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      setBusyId(confirmDelete.id);
      const res = await deleteMatchmakingPost(confirmDelete.id);
      notify("ok", res.message);
      setConfirmDelete(null);
      await load();
    } catch (err: any) {
      notify("err", err?.message || "Gỡ bài thất bại. Cần đăng nhập tài khoản ADMIN.");
    } finally {
      setBusyId(null);
    }
  };

  const columns: AdminColumn<MatchmakingPost>[] = [
    {
      key: "id",
      header: "#",
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => <span className="font-mono font-bold text-slate-500">{r.id}</span>,
    },
    {
      key: "team",
      header: "Tin đăng",
      sortable: true,
      sortValue: (r) => r.teamName ?? "",
      render: (r) => (
        <div className="max-w-[280px]">
          <p className="font-bold text-slate-900 dark:text-white truncate">{r.teamName}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {r.pitchName} • {r.matchTime}
          </p>
          {r.note && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate italic">“{r.note}”</p>
          )}
        </div>
      ),
    },
    {
      key: "captain",
      header: "Liên hệ",
      render: (r) => (
        <div>
          <p className="font-bold">{r.captainName || "—"}</p>
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{r.captainPhone || ""}</p>
        </div>
      ),
    },
    {
      key: "elo",
      header: "Elo",
      sortable: true,
      sortValue: (r) => r.eloRating ?? 0,
      render: (r) => <span className="font-mono font-bold">{(r.eloRating ?? 0).toLocaleString("vi-VN")}</span>,
    },
    {
      key: "fee",
      header: "Phí dự kiến",
      render: (r) => <span className="font-mono font-bold">{formatMoney((r as any).estimatedFee)}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      sortable: true,
      sortValue: (r) => r.status ?? "",
      render: (r) => (
        <StatusBadge tone={STATUS_TONE[r.status ?? ""] ?? "slate"}>
          {STATUS_LABEL[r.status ?? ""] ?? r.status}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (r) => (
        <button
          type="button"
          title={`Gỡ bài của ${r.teamName}`}
          disabled={busyId === r.id}
          onClick={() => setConfirmDelete(r)}
          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <SectionCard>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-sm">Kiểm duyệt chợ kèo</h3>
          <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Gỡ tin đăng vi phạm (spam, sai sự thật). Hành động không thể hoàn tác.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all"
        >
          Tải lại
        </button>
      </div>

      <AdminTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        searchPlaceholder="Tìm theo tên đội, sân, SĐT…"
        searchFilter={(r, q) =>
          [r.teamName, r.pitchName, r.captainName ?? "", r.captainPhone ?? ""].join(" ").toLowerCase().includes(q)
        }
        emptyTitle="Chợ kèo đang trống."
      />

      <ConfirmModal
        open={confirmDelete !== null}
        title="Gỡ bài đăng?"
        message={
          confirmDelete ? (
            <>
              Gỡ tin <strong>“{confirmDelete.teamName}”</strong> ({confirmDelete.pitchName} •{" "}
              {confirmDelete.matchTime}) khỏi chợ kèo. Không thể hoàn tác.
            </>
          ) : null
        }
        confirmLabel="Gỡ bài đăng"
        danger
        busy={busyId !== null}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={doDelete}
      />
    </SectionCard>
  );
}
