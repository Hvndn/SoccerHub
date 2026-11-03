"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Edit3,
  X,
  ShieldCheck,
  Building2,
  Save,
} from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/lib/authService";
import { toastOk, toastErr, toastInfo } from "@/lib/toast";
import { API_BASE_URL } from "@/lib/api";
import AvatarUploader from "@/components/AvatarUploader";

function resolveAvatarUrl(avatar?: string | null): string | null {
  if (!avatar) return null;
  const v = avatar.trim();
  if (/^(https?:|data:)/i.test(v)) return v;
  if (v.startsWith("/")) return `${API_BASE_URL}${v}`;
  return null;
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;

interface OwnerProfileConsoleProps {
  user?: UserProfile | null;
  onOpenAuth?: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
}

export default function OwnerProfileConsole({
  user: propUser,
  onOpenAuth,
  onNavigateTab,
}: OwnerProfileConsoleProps) {
  const { user: contextUser, updateProfile } = useAuth();
  const activeUser = propUser !== undefined ? propUser : contextUser;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    area: "",
    avatar: "",
  });

  useEffect(() => {
    if (!activeUser) return;
    setForm({
      fullName: activeUser.fullName || "",
      email: activeUser.email || "",
      phone: activeUser.phone || "",
      area: activeUser.area || "",
      avatar: activeUser.avatar || "",
    });
  }, [activeUser]);

  const displayFullName = activeUser?.fullName || "Chưa cập nhật tên";
  const displayEmail = activeUser?.email || "—";
  const displayPhone = activeUser?.phone || "Chưa khai báo SĐT";
  const displayArea = activeUser?.area || "Chưa khai báo khu vực";
  const displayAvatar = activeUser?.avatar;
  const avatarUrl = resolveAvatarUrl(displayAvatar);
  const isAvatarUrl = !!avatarUrl;

  const initials = displayFullName
    ? displayFullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "CS";

  const handleToggleEdit = () => {
    if (!activeUser) {
      if (onOpenAuth) onOpenAuth("login", "OWNER");
      else toastInfo("Vui lòng đăng nhập để cập nhật hồ sơ chủ sân!");
      return;
    }
    setErrorMsg("");
    setIsEditing((v) => !v);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    if (!form.fullName.trim()) {
      setErrorMsg("Vui lòng nhập họ và tên chủ sân.");
      return;
    }
    const email = form.email.trim();
    if (!EMAIL_REGEX.test(email)) {
      setErrorMsg("Email không hợp lệ. Ví dụ: chusan@gmail.com");
      return;
    }
    const emailChanged = email.toLowerCase() !== (activeUser.email || "").toLowerCase();
    setIsSaving(true);
    setErrorMsg("");
    try {
      await updateProfile({
        fullName: form.fullName.trim(),
        email,
        phone: form.phone.trim(),
        area: form.area.trim(),
        ...(form.avatar.trim() ? { avatar: form.avatar.trim() } : {}),
      });
      setIsEditing(false);
      toastOk(
        emailChanged
          ? `Đã lưu hồ sơ. Lần sau vui lòng đăng nhập bằng email mới: ${email}`
          : "Đã lưu hồ sơ chủ sân thành công."
      );
    } catch (err: any) {
      const msg = err?.message || "Cập nhật thất bại. Vui lòng thử lại.";
      setErrorMsg(msg);
      toastErr(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeUser) {
    return (
      <div className="py-12 max-w-lg mx-auto text-center space-y-4 bg-white p-6 rounded-lg border border-slate-300">
        <ShieldCheck className="w-8 h-8 text-amber-700 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Yêu Cầu Đăng Nhập Chủ Sân</h2>
        <button
          type="button"
          onClick={() => onOpenAuth?.("login", "OWNER")}
          className="px-5 py-2.5 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-sm cursor-pointer"
        >
          Đăng Nhập Ngay
        </button>
      </div>
    );
  }

  return (
    <div className="w-full text-slate-900 space-y-4 pb-12">
      <div className="bg-white rounded-lg border border-slate-300 p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-lg bg-[#0369a1] text-white font-bold text-2xl flex items-center justify-center border border-slate-300 overflow-hidden">
                {isAvatarUrl ? (
                  <SafeImage
                    src={avatarUrl as string}
                    alt={displayFullName}
                    className="w-full h-full object-cover"
                    fallbackLabel="Ảnh đại diện"
                  />
                ) : (
                  <span>{activeUser.avatar || initials}</span>
                )}
              </div>
              <div
                className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-md border border-white"
                title="Tài khoản chủ sân đã xác minh"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">
                  {displayFullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded text-[13px] font-bold bg-sky-50 text-[#0369a1] border border-sky-200">
                  Chủ Sân
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[14px] text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#0369a1]" />
                  <span>{displayEmail}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#0369a1]" />
                  <span>{displayPhone}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0369a1]" />
                  <span>{displayArea}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleEdit}
              className={`px-4 py-2 rounded-md border text-[14px] font-bold flex items-center gap-1.5 cursor-pointer ${
                isEditing
                  ? "border-[#0369a1] bg-sky-50 text-[#0369a1]"
                  : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
              }`}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4 text-[#0369a1]" />}
              <span>{isEditing ? "Đóng Form" : "Chỉnh Sửa Hồ Sơ"}</span>
            </button>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("admin")}
                className="px-4 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Bảng Điều Hành Cụm Sân</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Ô THÔNG TIN TÀI KHOẢN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[13px]">
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
            <p className="text-slate-500 font-semibold">Vai trò hệ thống</p>
            <p className="font-bold text-slate-900 mt-0.5">Chủ Sân (Quản lý cụm sân)</p>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
            <p className="text-slate-500 font-semibold">Email đăng nhập</p>
            <p className="font-mono font-bold text-slate-900 mt-0.5 truncate">{displayEmail}</p>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
            <p className="text-slate-500 font-semibold">Số điện thoại liên hệ</p>
            <p className="font-mono font-bold text-slate-900 mt-0.5">{displayPhone}</p>
          </div>
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
            <p className="text-slate-500 font-semibold">Khu vực hoạt động</p>
            <p className="font-bold text-slate-900 mt-0.5 truncate">{displayArea}</p>
          </div>
        </div>

        {/* FORM SỬA TẠI CHỖ */}
        {isEditing && (
          <form onSubmit={handleSave} className="pt-4 border-t border-slate-200 space-y-4 text-[14px]">
            <h3 className="text-base font-bold text-slate-900">Cập Nhật Thông Tin Cá Nhân</h3>

            {errorMsg && (
              <div className="p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  Họ và tên Chủ Sân *
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  Khu vực hoạt động
                </label>
                <input
                  type="text"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  Email đăng nhập *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1">
                Ảnh đại diện
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={form.avatar}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  placeholder="URL ảnh đại diện..."
                  className="flex-1 px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                />
                <AvatarUploader
                  compact
                  onUploaded={(url) => setForm({ ...form, avatar: url })}
                  label="Tải ảnh từ máy"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
