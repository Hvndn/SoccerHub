"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Lock, Unlock, ShieldCheck, Trash2, Search, Eye, ChevronLeft, ChevronRight, X, Loader2, CheckCircle2, AlertCircle, Building2, Sparkles } from "lucide-react";
import AdminTable, { type AdminColumn } from "./AdminTable";
import { ConfirmModal, SectionCard, StatusBadge } from "./AdminUI";
import {
 listAdminUsersPaged,
  getAdminUserDetail,
 setAdminUserRole,
 setAdminUserStatus,
 deleteAdminUser,
 listPendingOwnersApi,
 setOwnerApprovalApi,
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


const PAGE_SIZE = 12;

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

 // Xac nhan hien INLINE -> tu cuon toi.
 useEffect(() => {
  if (!confirm) return;
  const raf = requestAnimationFrame(() => {
   document.getElementById("admin-users-confirm-inline")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  return () => cancelAnimationFrame(raf);
 }, [confirm]);

  // Phân trang + tìm kiếm (server-side)
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [countByRole, setCountByRole] = useState<Record<string, number>>({});
  // TỔNG số user (không lọc) — dùng cho nhãn "Tất cả (N)".
  const [totalUsers, setTotalUsers] = useState(0);

  // Quản lý kiểm duyệt chủ sân (chống spam / acc clone)
  const [pendingOwners, setPendingOwners] = useState<any[]>([]);
  const [showPendingPanel, setShowPendingPanel] = useState<boolean>(false);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);

  const loadPendingOwners = useCallback(async () => {
    try {
      setLoadingPending(true);
      const data = await listPendingOwnersApi();
      setPendingOwners(data);
    } catch {
      setPendingOwners([]);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    loadPendingOwners();
  }, [loadPendingOwners]);

  const handleApproveOwner = async (ownerId: number, status: "APPROVED" | "REJECTED") => {
    try {
      setBusyId(ownerId);
      await setOwnerApprovalApi(ownerId, status);
      notify("ok", status === "APPROVED" ? "Đã phê duyệt chủ sân thành công!" : "Đã từ chối tài khoản chủ sân.");
      await Promise.all([load(), loadPendingOwners()]);
    } catch (err: any) {
      notify("err", err?.message || "Không thể cập nhật trạng thái duyệt.");
    } finally {
      setBusyId(null);
    }
  };

  // Modal chi tiết người dùng
  const [detail, setDetail] = useState<{ user: AdminUser; data: any } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Chi tiet nguoi dung hien INLINE -> tu cuon toi.
  useEffect(() => {
    if (!detail) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById("admin-user-detail-inline")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(raf);
  }, [detail]);

  // Gõ xong 400ms mới gọi API, tránh dội request mỗi ký tự
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(query.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [roleFilter]);

  const load = useCallback(async () => {
    try {
    setLoading(true);
    const res = await listAdminUsersPaged({
      page,
      size: PAGE_SIZE,
      q: debouncedQ || undefined,
      role: roleFilter || undefined,
    });
    setRows(Array.isArray(res.content) ? res.content : []);
    setTotal(res.total ?? 0);
    setTotalPages(Math.max(1, res.totalPages ?? 1));
    setCountByRole(res.countByRole || {});
   setTotalUsers(Number(res.total ?? 0));
  } catch (err: any) {
    notify("err", err?.message || "Không tải được danh sách người dùng. Cần đăng nhập tài khoản ADMIN.");
  } finally {
    setLoading(false);
  }
  }, [notify, page, debouncedQ, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (u: AdminUser) => {
    setDetail({ user: u, data: null });
    setDetailLoading(true);
    try {
      const data = await getAdminUserDetail(u.id);
      setDetail({ user: u, data });
    } catch (err: any) {
      notify("err", err?.message || "Không tải được chi tiết người dùng.");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };
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
 <p className="font-bold text-slate-900 ">{r.fullName}</p>
 <p className="text-[14px] font-mono text-slate-500 truncate max-w-[220px]">{r.email}</p>
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
 render: (r) => <span className="font-bold text-slate-700 ">{r.level || "—"}</span>,
 },
 {
 key: "enabled",
 header: "Trạng thái",
 sortable: true,
 sortValue: (r) => (r.enabled ? 1 : 0),
 render: (r) => (
  <div className="flex flex-col gap-1 items-start">
   {r.enabled ? (
    <StatusBadge tone="green">Đang hoạt động</StatusBadge>
   ) : (
    <StatusBadge tone="rose">Đã khóa</StatusBadge>
   )}
   {r.role === "OWNER" && (
    r.approvalStatus === "PENDING_APPROVAL" ? (
     <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      ⏳ Chờ duyệt sân
     </span>
    ) : r.approvalStatus === "REJECTED" ? (
     <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
      ✕ Từ chối sân
     </span>
    ) : (
     <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      ✓ Đã duyệt sân
     </span>
    )
   )}
  </div>
 ),
 },
 {
 key: "actions",
 header: "Thao tác",
 className: "whitespace-nowrap",
 render: (r) => (
  <div className="flex items-center gap-1.5">
  {r.role === "OWNER" && r.approvalStatus === "PENDING_APPROVAL" && (
   <button
     type="button"
     title="Phê duyệt nhanh chủ sân"
     disabled={busyId === r.id}
     onClick={() => handleApproveOwner(r.id, "APPROVED")}
     className="px-2 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all text-xs font-bold shrink-0 cursor-pointer"
   >
     Duyệt
   </button>
  )}
  <button
  type="button"
  title="Xem chi tiết tài khoản"
  aria-label={`Xem chi tiết ${r.fullName}`}
  onClick={() => openDetail(r)}
  className="p-1.5 rounded-lg border border-slate-200 text-[#0369a1] hover:bg-sky-50 transition-all"
  >
  <Eye className="w-3.5 h-3.5" />
  </button>
  <button
  type="button"
  title={r.enabled ? "Khóa tài khoản" : "Mở khóa tài khoản"}
 disabled={busyId === r.id}
 onClick={() => setConfirm({ kind: "status", user: r })}
 className={`p-1.5 rounded-lg border transition-all disabled:opacity-50 ${
 r.enabled
 ? "border-rose-200 text-rose-600 hover:bg-rose-50 "
 : "border-sky-200 text-sky-700 hover:bg-sky-50 "
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
 className="pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 bg-white text-[14px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0369a1] disabled:opacity-50 cursor-pointer"
 >
 {ALL_ROLES.map((role) => (
 <option key={role} value={role}>
 {ROLE_LABEL[role]}
 </option>
 ))}
 </select>
 <ShieldCheck className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
 </div>
 <button
 type="button"
 title={`Xóa tài khoản ${r.fullName}`}
 disabled={busyId === r.id}
 onClick={() => setConfirm({ kind: "delete", user: r })}
 className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all disabled:opacity-50"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 ),
 },
 ];

 return (
 <SectionCard>
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
  <div>
  <h2 className="font-black text-slate-900 text-sm">Quản lý người dùng</h2> <p className="hidden sm:block text-[14px] text-slate-500 mt-0.5">
  Khóa/mở tài khoản và phân vai trò. Không thể tự khóa hoặc tự đổi vai trò của chính mình.
  </p>
  </div>
  <div className="flex items-center gap-2">
  <div className="relative">
  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  <input
  type="search"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  placeholder="Tìm nhanh trong danh sách…"
  aria-label="Tìm kiếm người dùng"
  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[14px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0369a1] w-48"
  />
  </div>
  <select
  value={roleFilter}
  onChange={(e) => setRoleFilter(e.target.value)}
  aria-label="Lọc theo vai trò"
  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[14px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
  >
  <option value="">Tất cả ({totalUsers})</option>
  {ALL_ROLES.map((r) => (
  <option key={r} value={r}>
  {ROLE_LABEL[r]} ({countByRole[r] ?? 0})
  </option>
  ))}
  </select>
  {pendingOwners.some((o: any) => o.approvalStatus === "PENDING_APPROVAL") && (
    <button
      type="button"
      onClick={() => setShowPendingPanel(!showPendingPanel)}
      className={`px-3 py-1.5 rounded-xl border text-[13px] font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
        showPendingPanel
          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
          : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
      }`}
    >
      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
      <span>Chờ Duyệt ({pendingOwners.filter((o: any) => o.approvalStatus === "PENDING_APPROVAL").length})</span>
    </button>
  )}
  <button
  type="button"
  onClick={load}
  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[14px] font-bold text-slate-700 transition-all whitespace-nowrap shrink-0"
  >
  Tải lại
  </button>
  </div>
  </div>

  {showPendingPanel && (
    <div className="mb-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between pb-2 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          <h3 className="font-bold text-slate-900 text-sm">
            Chủ Sân Chờ Phê Duyệt (Chống Spam / Tạo Acc Clone)
          </h3>
        </div>
        <span className="text-[13px] text-slate-500 hidden sm:inline">
          Chủ sân có cụm sân & sân con đầy đủ sẽ được hệ thống duyệt tự động.
        </span>
      </div>

      {pendingOwners.filter((o: any) => o.approvalStatus === "PENDING_APPROVAL").length === 0 ? (
        <div className="py-4 text-center text-[13px] text-slate-500 italic bg-white rounded-lg border border-slate-200">
          Hiện không có tài khoản chủ sân nào đang chờ duyệt.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingOwners.filter((o: any) => o.approvalStatus === "PENDING_APPROVAL").map((owner: any) => (
            <div key={owner.id} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{owner.fullName}</h4>
                  <p className="text-[13px] font-mono text-slate-500">{owner.email} • {owner.phone || "Chưa có SĐT"}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[12px] font-bold border border-amber-200 shrink-0">
                  Chờ duyệt
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[13px] space-y-1">
                {owner.pitchName ? (
                  <>
                    <p className="font-bold text-[#0369a1] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{owner.pitchName}</span>
                    </p>
                    <p className="text-slate-600 truncate">📍 {owner.pitchAddress || "Chưa có địa chỉ"}</p>
                    <p className="text-slate-600">
                      🏟️ Sân con: <strong>{owner.courtTypes?.length ? owner.courtTypes.join(", ") : "Chưa có sân con"}</strong>
                    </p>
                  </>
                ) : (
                  <p className="text-amber-800 italic flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Chưa khai báo cụm sân (nguy cơ clone/spam).</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  disabled={busyId === owner.id}
                  onClick={() => handleApproveOwner(owner.id, "REJECTED")}
                  className="px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[13px] font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  ✕ Từ chối
                </button>
                <button
                  type="button"
                  disabled={busyId === owner.id}
                  onClick={() => handleApproveOwner(owner.id, "APPROVED")}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Phê duyệt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}

  <AdminTable
  rows={rows}
  columns={columns}
  rowKey={(r) => r.id}
  loading={loading}
  pageSize={PAGE_SIZE}
  emptyTitle={total === 0 ? "Không tìm thấy người dùng nào." : "Chưa có người dùng nào."}
  emptyHint="Danh sách lấy trực tiếp từ bảng users , phân trang phía server."
  />

  {/* Phân trang */}
  {total > 0 && (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
  <span className="text-[14px] font-bold text-slate-500">
  Hiển thị <strong className="text-slate-800">{rows.length}</strong> / {total} tài khoản
  {debouncedQ && <> · đang lọc “<strong className="text-slate-800">{debouncedQ}</strong>”</>}
  </span>
  <div className="flex items-center gap-1.5">
  <button
  type="button"
  disabled={page === 0 || loading}
  onClick={() => setPage((p) => Math.max(0, p - 1))}
  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[14px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
  >
  <ChevronLeft className="w-3.5 h-3.5" /> Trước
  </button>
  <span className="px-2.5 py-1.5 text-[14px] font-mono font-bold text-slate-700 bg-slate-100 rounded-lg">
  Trang {page + 1}/{totalPages}
  </span>
  <button
  type="button"
  disabled={page + 1 >= totalPages || loading}
  onClick={() => setPage((p) => p + 1)}
  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[14px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
  >
  Sau <ChevronRight className="w-3.5 h-3.5" />
  </button>
  </div>
  </div>
  )}
 <div id="admin-users-confirm-inline">
 <ConfirmModal
 open={confirm !== null}
 inline
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
 </div>

  {/* === BẢNG CHI TIẾT NGƯỜI DÙNG INLINE (Zero-Modal) === */}
  {detail && (
  <div
  id="admin-user-detail-inline"
  className="w-full rounded-2xl sm:rounded-3xl bg-white border-2 border-sky-600 shadow-xl overflow-hidden my-4 animate-fade-in"
  >
  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 sticky top-0 bg-white">
  <div className="min-w-0">
  <h3 className="font-black text-slate-900 text-base truncate">
  {detail.user.fullName}
  </h3>
  <p className="text-[14px] text-slate-500 font-mono truncate">{detail.user.email}</p>
  </div>
  <div className="flex items-center gap-2 shrink-0">
  <StatusBadge tone={detail.user.enabled ? "green" : "rose"}>
  {detail.user.enabled ? "Hoạt động" : "Đã khóa"}
  </StatusBadge>
  <button
  type="button"
  onClick={() => setDetail(null)}
  aria-label="Đóng"
  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
  >
  <X className="w-4 h-4" />
  </button>
  </div>
  </div>

  {detailLoading ? (
  <div className="py-16 flex items-center justify-center">
  <Loader2 className="w-6 h-6 animate-spin text-[#0369a1]" />
  </div>
  ) : detail.data ? (
  <div className="p-5 space-y-5 text-[14px]">
  {/* Chỉ số nhanh */}
  <div className="grid grid-cols-3 gap-3">
  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
  <p className="text-[14px] font-bold text-slate-500">Số đơn đặt</p>
  <p className="font-mono font-black text-lg text-slate-900">{detail.data.bookingCount ?? 0}</p>
  </div>
  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
  <p className="text-[14px] font-bold text-emerald-700">Tổng chi</p>
  <p className="font-mono font-black text-lg text-emerald-700">
  {Number(detail.data.totalSpent ?? 0).toLocaleString("vi-VN")}đ
  </p>
  </div>
  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3">
  <p className="text-[14px] font-bold text-rose-700">Kèo đã đăng</p>
  <p className="font-mono font-black text-lg text-rose-700">
  {(detail.data.matchmakingPosts || []).length}
  </p>
  </div>
  </div>

  {/* Hồ sơ */}
  <div>
  <h4 className="font-black text-slate-900 text-[14px] mb-2 pb-1.5 border-b border-slate-100">
  Hồ sơ cá nhân
  </h4>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
  {[
  ["Vai trò", ROLE_LABEL[detail.data.user.role] || detail.data.user.role],
  ["Số điện thoại", detail.data.user.phone || "—"],
  ["Khu vực", detail.data.user.area || "—"],
  ["Trình độ", detail.data.user.level || "—"],
  ["Vị trí thi đấu", detail.data.user.position || "—"],
  ["Môn thể thức", detail.data.user.favoriteSport || "—"],
  ["Chân thuận", detail.data.user.dominantFoot || "—"],
  ["Số áo", detail.data.user.jerseyNumber || "—"],
  ["Chiều cao", detail.data.user.height ? `${detail.data.user.height} cm` : "—"],
  ["Cân nặng", detail.data.user.weight ? `${detail.data.user.weight} kg` : "—"],
  ["CLB hiện tại", detail.data.user.currentClub || "—"],
  ["Ngày đăng ký", detail.data.user.createdAt ? String(detail.data.user.createdAt).slice(0, 10) : "—"],
  ].map(([label, val]) => (
  <div key={String(label)}>
  <p className="text-[14px] font-bold text-slate-400">{label}</p>
  <p className="font-bold text-slate-800 truncate">{String(val ?? "—")}</p>
  </div>
  ))}
  </div>
  </div>

  {/* Kèo đã đăng */}
  {(detail.data.matchmakingPosts || []).length > 0 && (
  <div>
  <h4 className="font-black text-slate-900 text-[14px] mb-2 pb-1.5 border-b border-slate-100">
  Kèo giao hữu đã đăng
  </h4>
  <div className="space-y-1.5">
  {detail.data.matchmakingPosts.map((p: any) => (
  <div
  key={p.id}
  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
  >
  <div className="min-w-0">
  <p className="font-bold text-slate-900 truncate">{p.teamName}</p>
  <p className="text-[14px] text-slate-500 truncate">
  {p.pitchName} · {p.matchTime}
  {p.opponentTeamName ? ` · đã ghép với ${p.opponentTeamName}` : ""}
  </p>
  </div>
  <StatusBadge tone={p.status === "OPEN" ? "green" : p.status === "MATCHED" ? "sky" : "slate"}>
  {p.status === "OPEN" ? "Đang mở" : p.status === "MATCHED" ? "Đã ghép" : "Đã huỷ"}
  </StatusBadge>
  </div>
  ))}
  </div>
  </div>
  )}
  </div>
  ) : null}
  </div>
  )}
  </SectionCard>
  );
}
