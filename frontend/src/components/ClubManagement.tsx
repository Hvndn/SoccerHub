"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  Crown,
  ShieldCheck,
  Mail,
  Pencil,
  X,
  Loader2,
  Check,
  Building2,
} from "lucide-react";
import {
  fetchMyClubs,
  createClub,
  deleteClub,
  addClubMember,
  removeClubMember,
  setClubRepresentative,
  type Club,
} from "@/lib/clubService";
import { toastErr, toastOk } from "@/lib/toast";

interface ClubManagementProps {
  user?: any;
  /** Quay lại tab trước (nút back trên header Cộng đồng). */
  onBack?: () => void;
}

/**
 * Quản lý CLB của người dùng đại diện.
 *
 * <p>Toàn bộ thao tác hiển thị INLINE tại chỗ — không dùng popup/modal, đúng quy ước
 * UI của dự án.</p>
 */
export default function ClubManagement({ user, onBack }: ClubManagementProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeClubId, setActiveClubId] = useState<number | null>(null);

  // Form tạo CLB (inline)
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    area: "",
    phone: "",
    maxMembers: 0,
  });

  // Form thêm thành viên (inline)
  const [memberEmail, setMemberEmail] = useState("");
  const [memberBusy, setMemberBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await fetchMyClubs();
      setClubs(list);
      setActiveClubId((prev) =>
        prev && list.some((c) => c.id === prev) ? prev : list[0]?.id ?? null
      );
    } catch (e: any) {
      setError(e?.message || "Không tải được danh sách CLB.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeClub = clubs.find((c) => c.id === activeClubId) ?? null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 3) {
      toastErr("Tên CLB phải có ít nhất 3 ký tự.");
      return;
    }
    setCreating(true);
    try {
      const res = await createClub({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        area: form.area.trim() || undefined,
        phone: form.phone.trim() || undefined,
        maxMembers: Number(form.maxMembers) || 0,
      });
      toastOk(res?.message || "Đã tạo CLB.");
      setForm({ name: "", description: "", area: "", phone: "", maxMembers: 0 });
      setShowCreate(false);
      await load();
    } catch (err: any) {
      toastErr(err?.message || "Không tạo được CLB.");
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClub) return;
    const email = memberEmail.trim();
    if (!email.includes("@")) {
      toastErr("Email không hợp lệ.");
      return;
    }
    setMemberBusy(true);
    try {
      const res = await addClubMember(activeClub.id, email);
      toastOk(res?.message || "Đã thêm thành viên.");
      setMemberEmail("");
      await load();
    } catch (err: any) {
      toastErr(err?.message || "Không thêm được thành viên.");
    } finally {
      setMemberBusy(false);
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!activeClub) return;
    try {
      const res = await removeClubMember(activeClub.id, email);
      toastOk(res?.message || "Đã gỡ thành viên.");
      await load();
    } catch (err: any) {
      toastErr(err?.message || "Không gỡ được thành viên.");
    }
  };

  const handleToggleRep = async (email: string, isRep: boolean) => {
    if (!activeClub) return;
    try {
      const res = await setClubRepresentative(activeClub.id, email, !isRep);
      toastOk(res?.message || "Đã cập nhật vai trò.");
      await load();
    } catch (err: any) {
      toastErr(err?.message || "Không đổi được vai trò.");
    }
  };

  const handleDeleteClub = async (club: Club) => {
    try {
      const res = await deleteClub(club.id);
      toastOk(res?.message || "Đã xoá CLB.");
      await load();
    } catch (err: any) {
      toastErr(err?.message || "Không xoá được CLB.");
    }
  };

  const myEmail = (user?.email ?? "").toLowerCase();

  return (
    <div className="w-full space-y-4 pb-10 sm:pb-16">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 transition-colors"
              aria-label="Quay lại"
            >
              ←
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-[#0369a1]/10 text-[#0b4f6c] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              CLB của tôi
            </h2>
            <p className="text-[11px] text-slate-500">
              Bạn là đại diện CLB — thêm thành viên, quản lý danh sách đội của CLB.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-xs font-extrabold transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
        >
          {showCreate ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showCreate ? "Đóng" : "Tạo CLB"}
        </button>
      </div>

      {/* FORM TẠO CLB — INLINE */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl sm:rounded-3xl border-2 border-[#0369a1]/30 bg-[#0369a1]/[0.04] p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0b4f6c]" />
            <span className="text-xs font-black text-slate-900">
              Tạo CLB mới — bạn sẽ là đại diện
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Tên CLB *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: FC Đại Việt Đà Nẵng"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Khu vực</label>
              <input
                type="text"
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                placeholder="VD: Quận 7, Đà Nẵng"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600">Mô tả</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="VD: CLB phong trào, tập luyện tối thứ 5-7"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Số điện thoại CLB</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="0909…"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">
                Tối đa thành viên (0 = không giới hạn)
              </label>
              <input
                type="number"
                min={0}
                max={500}
                value={form.maxMembers}
                onChange={(e) => setForm((f) => ({ ...f, maxMembers: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-xs font-extrabold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {creating ? "Đang tạo…" : "Tạo CLB"}
          </button>
        </form>
      )}

      {/* DANH SÁCH CLB */}
      {loading ? (
        <div className="space-y-2.5 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
          {error}
        </p>
      ) : clubs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center space-y-2">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Bạn chưa có CLB nào</p>
          <p className="text-xs text-slate-500">
            Tạo CLB để quản lý danh sách đội và đặt sân cho CLB của bạn.
          </p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-xs font-extrabold transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Tạo CLB ngay
          </button>
        </div>
      ) : (
        <>
          {/* Chọn CLB */}
          <div className="flex flex-wrap gap-2">
            {clubs.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveClubId(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                  c.id === activeClubId
                    ? "bg-[#0369a1] text-white border-[#0369a1] shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                {c.name}
                <span className="ml-1.5 opacity-70">({c.memberCount ?? 0})</span>
              </button>
            ))}
          </div>

          {activeClub && (
            <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
              {/* Thông tin CLB */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {activeClub.name}
                  </h3>
                  {activeClub.description && (
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {activeClub.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500 font-semibold">
                    {activeClub.area && <span>📍 {activeClub.area}</span>}
                    {activeClub.phone && <span>☎ {activeClub.phone}</span>}
                    <span>
                      👥 {activeClub.memberCount ?? 0} thành viên
                    </span>
                  </div>
                </div>
                {activeClub.canManage && (
                  <button
                    type="button"
                    onClick={() => handleDeleteClub(activeClub)}
                    className="shrink-0 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-extrabold border border-rose-200 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xoá CLB
                  </button>
                )}
              </div>

              {/* Thêm thành viên — INLINE */}
              {activeClub.canManage && (
                <form
                  onSubmit={handleAddMember}
                  className="flex flex-col sm:flex-row gap-2 rounded-2xl bg-slate-50 border border-slate-200 p-3"
                >
                  <div className="relative flex-1 min-w-0">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="Email thành viên — VD: player@Turfzone.vn"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={memberBusy || !memberEmail.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-xs font-extrabold transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {memberBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Thêm thành viên
                  </button>
                </form>
              )}

              {/* Danh sách thành viên */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Thành viên ({activeClub.memberCount ?? 0})
                </span>
                <div className="space-y-1.5">
                  {(activeClub.memberList ?? []).map((m) => (
                    <div
                      key={m.email}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 ${
                          m.isRepresentative
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {m.isRepresentative ? (
                          <Crown className="w-4 h-4" />
                        ) : (
                          (m.name || m.email).trim().charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 truncate">
                          {m.name || m.email}
                          {m.isRepresentative && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                              Đại diện
                            </span>
                          )}
                          {m.email === myEmail && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[9px] font-black uppercase">
                              Bạn
                            </span>
                          )}
                        </p>
                        <p className="text-[10.5px] font-mono text-slate-500 truncate">
                          {m.email}
                          {m.phone ? ` · ${m.phone}` : ""}
                        </p>
                      </div>
                      {activeClub.canManage && m.email !== myEmail && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleRep(m.email, m.isRepresentative)}
                            title={
                              m.isRepresentative
                                ? "Thu hồi vai trò đại diện"
                                : "Bổ nhiệm làm đại diện CLB"
                            }
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              m.isRepresentative
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.email)}
                            title="Gỡ khỏi CLB"
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {(activeClub.memberList ?? []).length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-3">
                      CLB chưa có thành viên nào.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
