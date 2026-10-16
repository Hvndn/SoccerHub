"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Lock, Unlock, ShieldCheck, Trash2 } from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { ConfirmModal, SectionCard, StatusBadge } from "./AdminUI";
import {
  listAdminUsers,
  setAdminUserRole,
  setAdminUserStatus,
  deleteAdminUser,
  type AdminUser,
} from "@/lib/adminService";

const ROLE_LABEL: Record<string, string> = {
  PLAYER: "Cầu thủ",
  OWNER: "Chủ sân",
  ORGANIZER: "Ban tổ chức",
  ADMIN: "Quản trị",
};

const ROLE_TONE: Record<string, "green" | "amber" | "rose" | "sky" | "slate"> = {
  PLAYER: "sky",
  OWNER: "amber",
  ORGANIZER: "green",
  ADMIN: "rose",
};

const ALL_ROLES = ["PLAYER", "OWNER", "ORGANIZER", "ADMIN"];

export default function AdminUsers({ notify }: { notify: (type: "ok" | "err", text: string) => void }) {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: "status"; user: AdminUser }
    | { kind: "role"; user: AdminUser; role: string }
    | { kind: "delete"; user: AdminUser }
    | null
  >(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await listAdminUsers());
    } catch (err: any) {
      notify("err", err?.message || "Không tải được danh sách người dùng. Cần đăng nhập tài khoản ADMIN.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const doConfirm = async () => {
    if (!confirm) return;
    try {
      setBusyId(confirm.user.id);
      if (confirm.kind === "status") {
        const res = await setAdminUserStatus(confirm.user.id, !confirm.user.enabled);
        notify("ok", res.message);
      } else if (confirm.kind === "role") {
        const res = await setAdminUserRole(confirm.user.id, confirm.role);
        notify("ok", res.message);
      } else {
        const res = await deleteAdminUser(confirm.user.id);
        notify("ok", res.message);
      }
      setConfirm(null);
      await load();
    } catch (err: any) {
      notify("err", err?.message || "Thao tác thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const columns: AdminColumn<AdminUser>[] = [
    {
      key: "id",
      header: "#",
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => <span className="font-mono font-bold text-slate-500">{r.id}</span>,
    },
    {
      key: "fullName",
      header: "Người dùng",
      sortable: true,
      sortValue: (r) => r.fullName ?? "",
      render: (r) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{r.fullName}</p>
          <p className="text-[11px] font-mono text-slate-400 truncate max-w-[220px]">{r.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      sortable: true,
      sortValue: (r) => r.role ?? "",
      render: (r) => (
        <StatusBadge tone={ROLE_TONE[r.role ?? ""] ?? "slate"}>
          {ROLE_LABEL[r.role ?? ""] ?? r.role ?? "—"}
        </StatusBadge>
      ),
    },
    {
      key: "level",
      header: "Trình độ",
      sortable: true,
      sortValue: (r) => r.level ?? "",
      render: (r) => <span className="font-bold text-slate-700 dark:text-slate-300">{r.level || "—"}</span>,
    },
    {
      key: "enabled",
      header: "Trạng thái",
      sortable: true,
      sortValue: (r) => (r.enabled ? 1 : 0),
      render: (r) =>
        r.enabled ? (
          <StatusBadge tone="green">Đang hoạt động</StatusBadge>
        ) : (
          <StatusBadge tone="rose">Đã khóa</StatusBadge>
        ),
    },
    {
      key: "actions",
      header: "Thao tác",
      className: "whitespace-nowrap",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title={r.enabled ? "Khóa tài khoản" : "Mở khóa tài khoản"}
            disabled={busyId === r.id}
            onClick={() => setConfirm({ kind: "status", user: r })}
            className={`p-1.5 rounded-lg border transition-all disabled:opacity-50 ${
              r.enabled
                ? "border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                : "border-sky-200 dark:border-emerald-900 text-sky-700 hover:bg-sky-50 dark:hover:bg-emerald-950/40"
            }`}
          >
            {r.enabled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <div className="relative">
            <select
              aria-label={`Đổi vai trò của ${r.fullName}`}
              value={r.role ?? ""}
              disabled={busyId === r.id}
              onChange={(e) => {
                if (e.target.value && e.target.value !== r.role) {
                  setConfirm({ kind: "role", user: r, role: e.target.value });
                }
              }}
              className="pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7] disabled:opacity-50 cursor-pointer"
            >
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
            <ShieldCheck className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button
            type="button"
            title={`Xóa tài khoản ${r.fullName}`}
            disabled={busyId === r.id}
            onClick={() => setConfirm({ kind: "delete", user: r })}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <SectionCard>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-sm">Quản lý người dùng</h3>
          <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Khóa/mở tài khoản và phân vai trò. Không thể tự khóa hoặc tự đổi vai trò của chính mình.
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
        searchPlaceholder="Tìm theo tên, email, SĐT…"
        searchFilter={(r, q) =>
          [r.fullName, r.email, r.phone ?? "", r.area ?? ""].join(" ").toLowerCase().includes(q)
        }
        emptyTitle="Chưa có người dùng nào."
        emptyHint="Danh sách lấy trực tiếp từ bảng users trong CSDL."
      />

      <ConfirmModal
        open={confirm !== null}
        title={
          confirm?.kind === "status"
            ? (confirm.user.enabled ? "Khóa tài khoản?" : "Mở khóa tài khoản?")
            : confirm?.kind === "delete"
            ? "Xóa tài khoản?"
            : "Đổi vai trò?"
        }
        message={
          confirm?.kind === "status" ? (
            <>
              {confirm.user.enabled ? (
                <>Tài khoản <strong>{confirm.user.fullName}</strong> ({confirm.user.email}) sẽ <strong>không thể đăng nhập</strong> cho đến khi được mở khóa.</>
              ) : (
                <>Mở khóa cho <strong>{confirm.user.fullName}</strong> ({confirm.user.email}) để đăng nhập trở lại.</>
              )}
            </>
          ) : confirm?.kind === "delete" ? (
            <>Xóa vĩnh viễn tài khoản <strong>{confirm.user.fullName}</strong> ({confirm.user.email})? Không thể hoàn tác.</>
          ) : confirm ? (
            <>Chuyển <strong>{confirm.user.fullName}</strong> sang vai trò <strong>{ROLE_LABEL[confirm.role]}</strong>?</>
          ) : null
        }
        confirmLabel={
          confirm?.kind === "status"
            ? (confirm.user.enabled ? "Khóa tài khoản" : "Mở khóa")
            : confirm?.kind === "delete"
            ? "Xóa vĩnh viễn"
            : "Đổi vai trò"
        }
        danger={confirm?.kind === "delete" ? true : confirm?.kind === "status" ? confirm.user.enabled : false}
        busy={busyId !== null}
        onCancel={() => setConfirm(null)}
        onConfirm={doConfirm}
      />
    </SectionCard>
  );
}
