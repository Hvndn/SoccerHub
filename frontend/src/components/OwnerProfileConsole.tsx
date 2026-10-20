"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  X,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  Save,
  Info,
} from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/lib/authService";
import { toastOk, toastErr, toastInfo } from "@/lib/toast";
import { API_BASE_URL } from "@/lib/api";
import AvatarUploader from "@/components/AvatarUploader";

/**
 * Cùng biểu thức với backend (AuthService.EMAIL_PATTERN) để chặn email sai
 * ngay tại form thay vì phải chờ server trả lỗi.
 */
/**
 * Biến giá trị avatar thành URL trình duyệt load được:
 * - http(s)/data      -> dùng nguyên
 * - "/api/v1/..."     -> thêm API_BASE_URL (ảnh upload qua backend)
 * - text 1-2 ký tự    -> hiển thị nguyên (chữ viết tắt, không phải URL)
 */
function resolveAvatarUrl(avatar?: string | null): string | null {
  if (!avatar) return null;
  const v = avatar.trim();
  if (/^(https?:|data:)/i.test(v)) return v;
  if (v.startsWith("/")) return `${API_BASE_URL}${v}`;
  return null; // chữ viết tắt "TS", không phải ảnh thật
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;

/**
 * Hồ sơ cá nhân dành riêng cho tài khoản CHỦ SÂN (OWNER).
 *
 * Lý do tách khỏi PlayerProfileConsole: trang hồ sơ cầu thủ chỉ hiển thị phong độ,
 * thể chất, lịch sử thi đấu... không phù hợp với chủ sân. Trước đây tab "profile"
 * không nằm trong OWNER_TABS nên chủ sân bị chặn hoàn toàn, không có chỗ sửa
 * họ tên / SĐT / khu vực / ảnh đại diện của chính mình.
 *
 * Sửa tại chỗ (không popup) theo đúng quy ước giao diện của app.
 */
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
  // GH fix: avatar upload trả về "/api/v1/chat/files/xxx.png" (đường dẫn tương đối)
  // nên phải thêm API_BASE_URL để <img> load được, và chữ viết tắt "TS" là KHÔNG
  // phải URL ảnh -> xử lý như阀 nhán cái avatareshow chữ.
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
      setErrorMsg("Email không hợp lệ. Ví dụ hợp lệ: chusan@gmail.com");
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
        // Ảnh đại diện: bỏ trống thì giữ nguyên ảnh cũ (backend bỏ qua chuỗi rỗng)
        ...(form.avatar.trim() ? { avatar: form.avatar.trim() } : {}),
      });
      setIsEditing(false);
      toastOk(
        emailChanged
          ? `Đã lưu hồ sơ. Từ giờ hãy đăng nhập bằng email mới: ${email}`
          : "Đã lưu hồ sơ cá nhân. Tên chủ sân hiển thị trên cụm sân cũng được cập nhật theo."
      );
    } catch (err: any) {
      const msg = err?.message || "Cập nhật thất bại. Vui lòng kiểm tra lại kết nối máy chủ.";
      setErrorMsg(msg);
      toastErr(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Chưa đăng nhập (dự phòng — trang chỉ render khi đã có tài khoản)
  if (!activeUser) {
    return (
      <div className="py-10 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-amber-700" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">Yêu Cầu Đăng Nhập Chủ Sân</h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Đăng nhập bằng tài khoản Chủ Sân để xem và cập nhật thông tin cá nhân.
        </p>
        <button
          type="button"
          onClick={() => onOpenAuth?.("login", "OWNER")}
          className="px-6 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          Đăng Nhập Ngay
        </button>
      </div>
    );
  }

  return (
    <div className="w-full text-slate-900 space-y-3 sm:space-y-6 pb-20">
      {/* ================= HEADER: THẺ HỒ SƠ CHỦ SÂN ================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="relative min-h-[5.5rem] sm:h-32 bg-slate-100 px-4 sm:px-8 py-3 flex items-center justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#0369a1_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10 min-w-0">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[12px] sm:text-xs font-semibold bg-[#0369a1]/10 text-sky-800 border border-[#0369a1]/30">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-700 shrink-0" />
              <span className="truncate">HỒ SƠ CÁ NHÂN CHỦ SÂN</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 font-mono shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tài khoản Chủ Sân Turfzone
            </span>
          </div>
        </div>

        {/* Thông tin chính */}
        <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5 min-w-0">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-[#0369a1] to-sky-500 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg border-4 border-white overflow-hidden">
                  {isAvatarUrl ? (
                    <SafeImage src={avatarUrl as string} alt={displayFullName} className="w-full h-full object-cover" fallbackLabel="Ảnh đại diện đang tải..." />
                  ) : (
                    <span>{activeUser.avatar || initials}</span>
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 bg-[#0369a1] text-white p-1 sm:p-1.5 rounded-xl shadow-md border-2 border-white"
                  title="Tài khoản chủ sân đã xác minh"
                >
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Tên & liên hệ */}
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight break-words">
                    {displayFullName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[13px] sm:text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                    Chủ Sân
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 sm:gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium min-w-0">
                    <Mail className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                    <span className="truncate max-w-[220px] sm:max-w-none">{displayEmail}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium shrink-0">
                    <Phone className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                    {displayPhone}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    {displayArea}
                  </span>
                </div>
              </div>
            </div>

            {/* Nút thao tác */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleEdit}
                className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm min-h-[42px] active:scale-95 ${
                  isEditing
                    ? "border-[#0369a1] bg-sky-50 text-sky-800"
                    : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
                }`}
              >
                {isEditing ? <X className="w-4 h-4 text-sky-700 shrink-0" /> : <Edit3 className="w-4 h-4 text-sky-700 shrink-0" />}
                <span>{isEditing ? "Đóng Form" : "Chỉnh Sửa Hồ Sơ"}</span>
              </button>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab("admin")}
                  className="px-4 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-xs sm:text-sm font-black transition-all shadow-md flex items-center justify-center gap-2 min-h-[42px] active:scale-95"
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Bảng Điều Hành Cụm Sân</span>
                </button>
              )}
            </div>
          </div>

          {/* ================= FORM SỬA TẠI CHỖ ================= */}
          {isEditing && (
            <div className="pt-4 sm:pt-6 border-t border-slate-100 animate-fade-in">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-sky-700" />
                    Cập Nhật Thông Tin Cá Nhân
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Họ tên chủ sân được hiển thị công khai cho cầu thủ khi xem trang sân của bạn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  aria-label="Đóng form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="owner-full-name">
                      Họ và Tên Chủ Sân <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="owner-full-name"
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-[#0369a1] outline-none"
                      placeholder="Ví dụ: Trần Thị Chủ Sân"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="owner-phone">
                      Số Điện Thoại Liên Hệ
                    </label>
                    <input
                      id="owner-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-[#0369a1] outline-none"
                      placeholder="0908 123 456"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="owner-area">
                      Khu Vực Hoạt Động
                    </label>
                    <input
                      id="owner-area"
                      type="text"
                      value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-[#0369a1] outline-none"
                      placeholder="Ví dụ: Quận 7, Đà Nẵng"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="owner-email">
                      Email Đăng Nhập <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="owner-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-[#0369a1] outline-none"
                      placeholder="chusan@gmail.com"
                    />
                    <p className="text-[13px] text-slate-500 mt-1">
                      Đây cũng là tài khoản dùng để đăng nhập — đổi xong hãy đăng nhập bằng email mới.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="owner-avatar">
                    Ảnh Đại Diện (đường dẫn ảnh)
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="owner-avatar"
                      type="text"
                      inputMode="url"
                      value={form.avatar}
                      onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-[#0369a1] outline-none"
                      placeholder="https://.../avatar.jpg (bỏ trống để giữ ảnh hiện tại)"
                    />
                    <AvatarUploader compact onUploaded={(url) => setForm({ ...form, avatar: url })} label="Tải ảnh từ máy" />
                  </div>
                  <p className="text-[13px] text-slate-500 mt-1">
                    Nhập liên kết http(s) tới ảnh, hoặc tải hình từ máy. Cần xem trước ảnh hãy nhớ bấm
                    Lưu Thay Đổi.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Save className="w-4 h-4 shrink-0" />
                    <span>{isSaving ? "Đang lưu…" : "Lưu Thay Đổi"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all active:scale-95"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ================= THẺ THÔNG TIN TÀI KHOẢN & GỢI Ý ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-[#0369a1]" />
            <h3 className="font-extrabold text-base text-slate-900">Thông Tin Tài Khoản</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 text-xs font-semibold">Vai trò</span>
              <span className="font-bold text-sky-800">Chủ Sân (OWNER)</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 text-xs font-semibold">Email đăng nhập</span>
              <span className="font-mono text-xs text-slate-800 truncate max-w-[60%]">{displayEmail}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 text-xs font-semibold">Số điện thoại</span>
              <span className="font-mono text-xs text-slate-800">{displayPhone}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 text-xs font-semibold">Khu vực</span>
              <span className="text-xs font-bold text-slate-800 text-right">{displayArea}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Info className="w-5 h-5 text-[#0369a1]" />
            <h3 className="font-extrabold text-base text-slate-900">Lưu Ý Khi Cập Nhật</h3>
          </div>
          <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-[#0369a1] shrink-0 mt-0.5" />
              <span>Họ tên chủ sân dùng làm tên công khai trên tất cả cụm sân bạn đang sở hữu và trong phiếu đặt ca của khách.</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-[#0369a1] shrink-0 mt-0.5" />
              <span>Số điện thoại / hotline riêng của từng cụm sân được sửa ở mục <strong>Sửa Hồ Sơ Cụm Sân</strong> trong Bảng Điều Hành.</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-[#0369a1] shrink-0 mt-0.5" />
              <span>Email đăng nhập đổi được ngay tại đây. Sau khi đổi, phiên hiện tại vẫn hoạt động (hệ thống tự cấp lại phiên) nhưng lần đăng nhập sau phải dùng email mới.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
