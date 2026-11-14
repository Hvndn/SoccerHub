"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Edit3,
  X,
  ShieldCheck,
  Building2,
  Save,
  Trophy,
  Clock,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  QrCode,
  Star,
  Users,
  ArrowUpRight,
  Activity,
  PhoneCall,
  Check,
  Settings,
  Wifi,
  Coffee,
  Car,
  Layers,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/lib/authService";
import { toastOk, toastErr, toastInfo } from "@/lib/toast";
import { API_BASE_URL } from "@/lib/api";
import AvatarUploader from "@/components/AvatarUploader";
import { getMyPitchesApi, PitchModel } from "@/lib/pitchService";

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

  // Dữ liệu cụm sân thuộc quyền sở hữu
  const [pitches, setPitches] = useState<PitchModel[]>([]);
  const [loadingPitches, setLoadingPitches] = useState(false);

  // Cấu hình tài khoản ngân hàng nhận tiền cọc VietQR
  const [bankInfo, setBankInfo] = useState({
    bankName: "MB Bank (Ngân hàng Quân Đội)",
    accountNumber: "0987654321",
    accountHolder: "TRẦN THỊ A",
    qrNote: "COC SAN BONG DA TURFZONE",
  });
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [tempBankInfo, setTempBankInfo] = useState(bankInfo);

  const bankErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!tempBankInfo.bankName.trim()) {
      errs.bankName = "Vui lòng nhập tên ngân hàng.";
    }
    const acc = tempBankInfo.accountNumber.trim();
    if (!acc) {
      errs.accountNumber = "Vui lòng nhập số tài khoản.";
    } else if (!/^[0-9]{6,20}$/.test(acc)) {
      errs.accountNumber = "Số tài khoản phải gồm 6 - 20 chữ số.";
    }
    const holder = tempBankInfo.accountHolder.trim();
    if (!holder) {
      errs.accountHolder = "Vui lòng nhập tên chủ tài khoản.";
    } else if (holder.length < 3) {
      errs.accountHolder = "Tên chủ tài khoản tối thiểu 3 ký tự.";
    }
    return errs;
  }, [tempBankInfo]);
  const isBankValid = Object.keys(bankErrors).length === 0;

  const profileErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) {
      errs.fullName = "Vui lòng nhập họ và tên chủ sân.";
    } else if (form.fullName.trim().length < 2) {
      errs.fullName = "Họ và tên tối thiểu 2 ký tự.";
    }
    if (form.phone.trim() && !/^0[0-9]{9}$/.test(form.phone.trim())) {
      errs.phone = "Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 0).";
    }
    if (!form.email.trim()) {
      errs.email = "Vui lòng nhập email đăng nhập.";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      errs.email = "Email không hợp lệ (VD: chusan@gmail.com).";
    }
    return errs;
  }, [form]);
  const isProfileValid = Object.keys(profileErrors).length === 0;

  // Tab chuyển đổi tiện ích phía dưới
  const [utilityTab, setUtilityTab] = useState<"VIETQR" | "PARTNER">("VIETQR");

  // Danh sách các ca đặt sắp diễn ra hôm nay
  const [todayBookings, setTodayBookings] = useState([
    {
      id: 101,
      timeSlot: "17:30 - 19:00",
      courtName: "Sân 5 - 1",
      customerName: "Nguyễn Văn Tuấn",
      customerPhone: "0905 123 456",
      depositPaid: 150000,
      totalPrice: 420000,
      status: "DEPOSITED",
      statusLabel: "Đã cọc",
      via: "ONLINE_VIETQR",
    },
    {
      id: 102,
      timeSlot: "19:00 - 20:30",
      courtName: "Sân 7 - 1",
      customerName: "Lê Hoàng Phúc",
      customerPhone: "0914 889 900",
      depositPaid: 200000,
      totalPrice: 560000,
      status: "DEPOSITED",
      statusLabel: "Đã cọc",
      via: "ONLINE_VIETQR",
    },
    {
      id: 103,
      timeSlot: "19:30 - 21:00",
      courtName: "Sân 5 - 2",
      customerName: "FC Anh Em Cẩm Lệ",
      customerPhone: "0982 345 678",
      depositPaid: 0,
      totalPrice: 420000,
      status: "COUNTER",
      statusLabel: "Đặt tại quầy",
      via: "COUNTER",
    },
    {
      id: 104,
      timeSlot: "20:30 - 22:00",
      courtName: "Sân 7 - 2",
      customerName: "Trần Quốc Bảo",
      customerPhone: "0935 112 233",
      depositPaid: 560000,
      totalPrice: 560000,
      status: "CHECKED_IN",
      statusLabel: "Đã check-in",
      via: "ONLINE_VIETQR",
    },
  ]);

  useEffect(() => {
    if (!activeUser) return;
    setForm({
      fullName: activeUser.fullName || "",
      email: activeUser.email || "",
      phone: activeUser.phone || "",
      area: activeUser.area || "",
      avatar: activeUser.avatar || "",
    });
    setBankInfo((prev) => ({
      ...prev,
      accountNumber: activeUser.phone || prev.accountNumber,
      accountHolder: (activeUser.fullName || prev.accountHolder).toUpperCase(),
    }));
  }, [activeUser]);

  // Tải danh sách cụm sân của chủ sân
  useEffect(() => {
    let alive = true;
    setLoadingPitches(true);
    getMyPitchesApi()
      .then((data) => {
        if (alive && data && data.length > 0) {
          setPitches(data);
        }
      })
      .catch(() => {
        // Dự phòng ổn định
      })
      .finally(() => {
        if (alive) setLoadingPitches(false);
      });
    return () => {
      alive = false;
    };
  }, []);

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
    if (!isProfileValid) {
      const firstErr = Object.values(profileErrors)[0] || "Thông tin hồ sơ chưa hợp lệ.";
      setErrorMsg(firstErr);
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

  const handleQuickAvatarUploaded = async (url: string) => {
    try {
      await updateProfile({ avatar: url });
      setForm((prev) => ({ ...prev, avatar: url }));
      toastOk("Đã đổi ảnh đại diện chủ sân thành công!");
    } catch (err: any) {
      toastErr(err?.message || "Không thể cập nhật ảnh đại diện.");
    }
  };

  // Check-in ca đặt sân trực tiếp
  const handleCheckInBooking = (id: number) => {
    setTodayBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "CHECKED_IN", statusLabel: "Đã check-in" } : b
      )
    );
    toastOk("Xác nhận khách đã nhận sân và check-in thành công!");
  };

  // Lưu thông tin tài khoản nhận cọc
  const handleSaveBankInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBankValid) return;
    setBankInfo(tempBankInfo);
    setIsEditingBank(false);
    toastOk("Đã lưu thông tin tài khoản nhận tiền cọc VietQR thành công!");
  };

  // URL VietQR Quicklink
  const vietQrUrl = useMemo(() => {
    const bankBin = "970422"; // MB Bank
    const acc = bankInfo.accountNumber.replace(/\s+/g, "");
    return `https://img.vietqr.io/image/${bankBin}-${acc}-compact2.png?amount=150000&addInfo=COC%20SAN%20TURFZONE&accountName=${encodeURIComponent(
      bankInfo.accountHolder
    )}`;
  }, [bankInfo]);

  if (!activeUser) {
    return (
      <div className="py-12 max-w-lg mx-auto text-center space-y-4 bg-white p-6 rounded-2xl border border-slate-300">
        <ShieldCheck className="w-8 h-8 text-amber-700 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Yêu Cầu Đăng Nhập Chủ Sân</h2>
        <button
          type="button"
          onClick={() => onOpenAuth?.("login", "OWNER")}
          className="px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-sm cursor-pointer"
        >
          Đăng Nhập Ngay
        </button>
      </div>
    );
  }

  // Tên và thông tin cụm sân đang quản lý
  const activePitch = pitches[0] || {
    id: 1,
    name: "Cụm Sân Bóng Đá Đại Nẵng",
    address: "12 Phan Đăng Lưu, P. Hòa Cường Nam, Quận Hải Châu, TP. Đà Nẵng",
    openTime: "06:00",
    closeTime: "23:00",
  };

  return (
    <div className="w-full text-slate-900 space-y-6 pb-12">
      {/* ==================== KHỐI 0: HEADER HỒ SƠ CHỦ SÂN ==================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 min-w-0">
            <div className="flex flex-col items-center sm:items-start gap-1.5 shrink-0">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-[#0369a1] text-white font-bold text-2xl flex items-center justify-center border-2 border-slate-200 overflow-hidden shadow-xs">
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
                  className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-md border-2 border-white shadow-xs"
                  title="Tài khoản chủ sân đã xác minh chính thức"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Nút Đổi Avatar Nhanh */}
              <AvatarUploader
                compact
                onUploaded={handleQuickAvatarUploaded}
                label="Đổi Avatar"
              />
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 break-words">
                  {displayFullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg text-[13px] font-bold bg-sky-50 text-[#0369a1] border border-sky-200">
                  Chủ Sân
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[13px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã xác minh</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[14px] text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#0369a1]" />
                  <span>{displayEmail}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#0369a1]" />
                  <span>{displayPhone}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#0369a1]" />
                  <span>{displayArea}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleEdit}
              className={`px-4 py-2.5 rounded-xl border text-[14px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
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
                className="px-4 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Bảng Điều Hành Cụm Sân</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Ô THÔNG TIN TÀI KHOẢN TỔNG QUAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[13px]">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-slate-500 font-semibold">Vai trò hệ thống</p>
            <p className="font-bold text-slate-900 mt-1">Chủ Sân (Quản lý cụm sân)</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-slate-500 font-semibold">Email đăng nhập</p>
            <p className="font-mono font-bold text-slate-900 mt-1 truncate">{displayEmail}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-slate-500 font-semibold">Số điện thoại liên hệ</p>
            <p className="font-mono font-bold text-slate-900 mt-1">{displayPhone}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-slate-500 font-semibold">Khu vực hoạt động</p>
            <p className="font-bold text-slate-900 mt-1 truncate">{displayArea}</p>
          </div>
        </div>

        {/* FORM SỬA THÔNG TIN INLINE TẠI CHỖ */}
        {isEditing && (
          <form onSubmit={handleSave} className="pt-4 border-t border-slate-200 space-y-4 text-[14px] animate-fade-in">
            <h3 className="text-base font-bold text-slate-900">Cập Nhật Thông Tin Cá Nhân</h3>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-[13px]">
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
                  className={`w-full px-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 ${
                    profileErrors.fullName && form.fullName ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
                  }`}
                />
                {profileErrors.fullName && form.fullName && (
                  <p className="mt-1 text-[13px] font-semibold text-rose-600">{profileErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0909…"
                  className={`w-full px-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 ${
                    profileErrors.phone && form.phone ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
                  }`}
                />
                {profileErrors.phone && form.phone && (
                  <p className="mt-1 text-[13px] font-semibold text-rose-600">{profileErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  Khu vực hoạt động
                </label>
                <input
                  type="text"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
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
                  className={`w-full px-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 ${
                    profileErrors.email && form.email ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
                  }`}
                />
                {profileErrors.email && form.email && (
                  <p className="mt-1 text-[13px] font-semibold text-rose-600">{profileErrors.email}</p>
                )}
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
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                />
                <AvatarUploader
                  compact
                  onUploaded={(url) => setForm({ ...form, avatar: url })}
                  label="Tải ảnh từ máy"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving || !isProfileValid}
                className="px-5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ==================== KHỐI 1: BẢNG CHỈ SỐ HIỆU SUẤT KINH DOANH ==================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-[#0369a1]" />
            <span>Hiệu Suất Vận Hành &amp; Dòng Tiền Cụm Sân</span>
          </h2>
          <span className="text-[13px] text-slate-500 font-medium">Cập nhật theo thời gian thực</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1 */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-sky-50/50 border border-sky-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[13px] font-bold text-slate-500 block">Doanh thu tháng này</span>
              <p className="text-xl sm:text-2xl font-black text-[#0369a1]">32.450.000đ</p>
              <span className="text-[13px] font-bold text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.5% so với tháng trước</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-[#0369a1] flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* KPI 2 */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-emerald-50/50 border border-emerald-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[13px] font-bold text-slate-500 block">Tổng ca đã phục vụ</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-800">148 ca</p>
              <span className="text-[13px] font-semibold text-slate-600">
                Sân 5: 92 ca • Sân 7: 56 ca
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* KPI 3 */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-amber-50/50 border border-amber-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[13px] font-bold text-slate-500 block">Tỷ lệ lấp đầy giờ vàng</span>
              <p className="text-xl sm:text-2xl font-black text-amber-700">86.4%</p>
              <span className="text-[13px] font-semibold text-slate-600">
                Khung giờ 17:30 - 21:30
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* KPI 4 */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-indigo-50/50 border border-indigo-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[13px] font-bold text-slate-500 block">Đánh giá &amp; uy tín</span>
              <p className="text-xl sm:text-2xl font-black text-indigo-900 flex items-center gap-1.5">
                <span>4.9</span>
                <span className="text-amber-500 text-lg">★★★★★</span>
              </p>
              <span className="text-[13px] font-semibold text-slate-600">
                Từ 210+ lượt khách đánh giá
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== KHỐI 2: CỤM SÂN SỞ HỮU & CƠ SỞ VẬT CHẤT ==================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0369a1]" />
              <span>Cụm Sân Sở Hữu &amp; Cơ Sở Vật Chất</span>
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Thông tin cấu hình cơ sở và hệ thống sân thi đấu thực tế do bạn quản trị
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateTab && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateTab("map")}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-[13px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#0369a1]" />
                  <span>Sơ Đồ Sân</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab("admin")}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Quản Lý Ma Trận Khung Giờ</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* THÔNG TIN CỤM SÂN CHI TIẾT */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-900">{activePitch.name}</h3>
                <span className="px-2.5 py-0.5 rounded-md text-[13px] font-bold bg-emerald-100 text-emerald-800">
                  Đang mở cửa đón khách
                </span>
              </div>
              <p className="text-[14px] text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{activePitch.address || "12 Phan Đăng Lưu, Quận Hải Châu, Đà Nẵng"}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 text-[13px] text-slate-600 font-medium">
              <Clock className="w-4 h-4 text-[#0369a1]" />
              <span>
                Giờ hoạt động: <strong>{activePitch.openTime || "06:00"} - {activePitch.closeTime || "23:00"}</strong>
              </span>
            </div>
          </div>

          {/* DANH SÁCH SÂN CON TRỰC THUỘC */}
          <div className="space-y-2">
            <span className="text-[13px] font-bold text-slate-700 block">
              Danh mục các sân bóng thi đấu đang vận hành (4 sân cỏ nhân tạo):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[13px]">
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Sân 5 - 1</span>
                  <span className="px-1.5 py-0.5 rounded text-[13px] font-bold bg-sky-50 text-[#0369a1] border border-sky-200">
                    Sân 5
                  </span>
                </div>
                <p className="text-slate-500">Giá: 420.000đ / ca</p>
                <span className="inline-block text-[13px] font-semibold text-emerald-700">● Sẵn sàng</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Sân 5 - 2</span>
                  <span className="px-1.5 py-0.5 rounded text-[13px] font-bold bg-sky-50 text-[#0369a1] border border-sky-200">
                    Sân 5
                  </span>
                </div>
                <p className="text-slate-500">Giá: 420.000đ / ca</p>
                <span className="inline-block text-[13px] font-semibold text-emerald-700">● Sẵn sàng</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Sân 7 - 1</span>
                  <span className="px-1.5 py-0.5 rounded text-[13px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Sân 7
                  </span>
                </div>
                <p className="text-slate-500">Giá: 560.000đ / ca</p>
                <span className="inline-block text-[13px] font-semibold text-emerald-700">● Sẵn sàng</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Sân 7 - 2</span>
                  <span className="px-1.5 py-0.5 rounded text-[13px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Sân 7
                  </span>
                </div>
                <p className="text-slate-500">Giá: 560.000đ / ca</p>
                <span className="inline-block text-[13px] font-semibold text-emerald-700">● Sẵn sàng</span>
              </div>
            </div>
          </div>

          {/* TIỆN ÍCH DỊCH VỤ SÂN */}
          <div className="flex items-center gap-4 flex-wrap text-[13px] text-slate-600 pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-800">Tiện ích cụm sân:</span>
            <span className="inline-flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" /> Wifi miễn phí
            </span>
            <span className="inline-flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-[#0369a1]" /> Bãi đỗ xe máy &amp; ô tô
            </span>
            <span className="inline-flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5 text-amber-700" /> Nước giải khát &amp; phòng thay đồ
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Hệ thống đèn LED chuẩn thi đấu
            </span>
          </div>
        </div>
      </div>

      {/* ==================== KHỐI 3: CA ĐẶT SẮP DIỄN RA HÔM NAY ==================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0369a1]" />
              <span>Ca Đặt Sắp Diễn Ra Hôm Nay &amp; Check-in Nhanh</span>
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Danh sách ca đấu trong ngày cần đón tiếp, xác nhận cọc hoặc thực hiện thủ tục nhận sân
            </p>
          </div>

          <span className="text-[13px] font-bold px-3 py-1 rounded-xl bg-sky-50 text-[#0369a1] border border-sky-200 self-start sm:self-auto">
            Hôm nay: {todayBookings.length} ca đặt
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="space-y-2.5 min-w-[620px]">
            {todayBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 bg-slate-50/50 hover:bg-white transition-all flex items-center justify-between gap-3 text-[13px]"
              >
                {/* Khung giờ & Sân */}
                <div className="flex items-center gap-3 w-48 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0369a1] flex items-center justify-center font-bold shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 block text-[14px]">{b.timeSlot}</span>
                    <span className="font-semibold text-slate-500">{b.courtName}</span>
                  </div>
                </div>

                {/* Thông tin khách hàng */}
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-900 block text-[14px] truncate">
                    {b.customerName}
                  </span>
                  <a
                    href={`tel:${b.customerPhone.replace(/\s+/g, "")}`}
                    className="text-slate-500 hover:text-[#0369a1] flex items-center gap-1 font-mono"
                  >
                    <PhoneCall className="w-3 h-3 text-[#0369a1]" />
                    <span>{b.customerPhone}</span>
                  </a>
                </div>

                {/* Tiền cọc & Tổng giá */}
                <div className="text-right w-36 shrink-0">
                  <span className="font-extrabold text-[#0369a1] block">
                    {b.depositPaid.toLocaleString("vi-VN")}đ cọc
                  </span>
                  <span className="text-slate-500 text-[13px]">
                    Tổng: {b.totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                {/* Trạng thái ca */}
                <div className="w-32 text-center shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-bold ${
                      b.status === "CHECKED_IN"
                        ? "bg-emerald-100 text-emerald-800"
                        : b.status === "COUNTER"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {b.status === "CHECKED_IN" && <Check className="w-3.5 h-3.5" />}
                    <span>{b.statusLabel}</span>
                  </span>
                </div>

                {/* Nút hành động */}
                <div className="w-36 text-right shrink-0">
                  {b.status !== "CHECKED_IN" ? (
                    <button
                      type="button"
                      onClick={() => handleCheckInBooking(b.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      Xác nhận nhận sân
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-bold text-[13px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã vào sân
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== KHỐI 4: TÀI KHOẢN NHẬN CỌC VIETQR & ĐỐI TÁC VẬN HÀNH ==================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#0369a1]" />
              <span>Cấu Hình Nhận Tiền Cọc &amp; Thông Tin Đối Tác</span>
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Cài đặt tài khoản ngân hàng nhận cọc tự động qua mã VietQR và hồ sơ đối tác Turfzone
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-[13px]">
            <button
              type="button"
              onClick={() => setUtilityTab("VIETQR")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                utilityTab === "VIETQR"
                  ? "bg-white text-[#0369a1] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tài Khoản Nhận Cọc (VietQR)
            </button>
            <button
              type="button"
              onClick={() => setUtilityTab("PARTNER")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                utilityTab === "PARTNER"
                  ? "bg-white text-[#0369a1] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hồ Sơ Hợp Tác Turfzone
            </button>
          </div>
        </div>

        {utilityTab === "VIETQR" ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* THÔNG TIN TÀI KHOẢN NGÂN HÀNG */}
            <div className="md:col-span-8 space-y-3">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-white border border-sky-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-slate-500">Tài khoản thụ hưởng chính thức:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempBankInfo(bankInfo);
                      setIsEditingBank(!isEditingBank);
                    }}
                    className="text-[13px] font-bold text-[#0369a1] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingBank ? "Đóng" : "Thay đổi số tài khoản"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
                  <div>
                    <span className="text-slate-500 block">Ngân hàng:</span>
                    <strong className="text-slate-900 text-[14px]">{bankInfo.bankName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Số tài khoản:</span>
                    <strong className="font-mono text-slate-900 text-[15px] text-[#0369a1]">
                      {bankInfo.accountNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Chủ tài khoản:</span>
                    <strong className="text-slate-900 text-[14px]">{bankInfo.accountHolder}</strong>
                  </div>
                </div>

                <p className="text-[13px] text-slate-500 italic pt-1 border-t border-sky-100">
                  * Khách đặt sân khi chọn quét VietQR sẽ chuyển khoản cọc trực tiếp vào tài khoản này. Hệ thống tự động kiểm tra biến động số dư và chốt ca.
                </p>
              </div>

              {/* FORM SỬA TÀI KHOẢN NGÂN HÀNG INLINE */}
              {isEditingBank && (
                <form
                  onSubmit={handleSaveBankInfo}
                  className="p-4 rounded-2xl bg-white border border-slate-300 space-y-3 text-[14px] animate-fade-in"
                >
                  <h4 className="font-bold text-slate-900">Chỉnh Sửa Tài Khoản Ngân Hàng Nhận Tiền Cọc</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1">
                        Ngân hàng thụ hưởng *
                      </label>
                      <input
                        type="text"
                        required
                        value={tempBankInfo.bankName}
                        onChange={(e) =>
                          setTempBankInfo({ ...tempBankInfo, bankName: e.target.value })
                        }
                        placeholder="VD: MB Bank, Vietcombank..."
                        className={`w-full px-3 py-2 rounded-xl border text-[13px] focus:outline-none focus:ring-2 ${
                          bankErrors.bankName && tempBankInfo.bankName ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
                        }`}
                      />
                      {bankErrors.bankName && tempBankInfo.bankName && (
                        <p className="mt-1 text-[13px] font-semibold text-rose-600">{bankErrors.bankName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1">
                        Số tài khoản nhận tiền *
                      </label>
                      <input
                        type="text"
                        required
                        value={tempBankInfo.accountNumber}
                        onChange={(e) =>
                          setTempBankInfo({ ...tempBankInfo, accountNumber: e.target.value.replace(/[^0-9]/g, "") })
                        }
                        placeholder="6-20 chữ số..."
                        className={`w-full px-3 py-2 rounded-xl border text-[13px] font-mono focus:outline-none focus:ring-2 ${
                          bankErrors.accountNumber && tempBankInfo.accountNumber ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
                        }`}
                      />
                      {bankErrors.accountNumber && tempBankInfo.accountNumber && (
                        <p className="mt-1 text-[13px] font-semibold text-rose-600">{bankErrors.accountNumber}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1">
                        Tên chủ tài khoản (In hoa) *
                      </label>
                      <input
                        type="text"
                        required
                        value={tempBankInfo.accountHolder}
                        onChange={(e) =>
                          setTempBankInfo({
                            ...tempBankInfo,
                            accountHolder: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="NGUYEN VAN A"
                        className={`w-full px-3 py-2 rounded-xl border text-[13px] focus:outline-none focus:ring-2 ${
                          bankErrors.accountHolder && tempBankInfo.accountHolder ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
                        }`}
                      />
                      {bankErrors.accountHolder && tempBankInfo.accountHolder && (
                        <p className="mt-1 text-[13px] font-semibold text-rose-600">{bankErrors.accountHolder}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingBank(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-[13px]"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={!isBankValid}
                      className="px-4 py-1.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu Tài Khoản</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* MÃ VIETQR MẪU MINH HỌA */}
            <div className="md:col-span-4 flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[13px] font-bold text-slate-700 mb-2">Mã VietQR Mẫu Cho Khách Cọc</span>
              <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-300 shadow-xs flex items-center justify-center overflow-hidden">
                <SafeImage
                  src={vietQrUrl}
                  alt="Mã VietQR Cọc Sân"
                  className="w-full h-full object-contain"
                  fallbackLabel="VietQR Cọc Sân"
                />
              </div>
              <span className="text-[13px] font-mono text-slate-500 mt-2 block">
                {bankInfo.accountNumber} • {bankInfo.accountHolder}
              </span>
            </div>
          </div>
        ) : (
          /* TAB HỒ SƠ HỢP TÁC TURFZONE */
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-[14px]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px]">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Tình trạng hợp đồng:</span>
                <span className="font-extrabold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã ký kết • Hiệu lực đến 12/2027</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Chứng chỉ chất lượng:</span>
                <span className="font-extrabold text-[#0369a1] flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Cụm Sân Tiêu Chuẩn Vàng Turfzone</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Hotline hỗ trợ chủ sân 24/7:</span>
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#0369a1]" />
                  <span>1900 6868 (Nhánh số 2)</span>
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-[13px] flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-[#0369a1] shrink-0" />
                <span>
                  Hồ sơ đối tác đã hoàn tất xác minh danh tính và kiểm định chất lượng mặt cỏ nhân tạo.
                </span>
              </span>
              <span className="font-bold text-[#0369a1]">Đối Tác Chiến Lược</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
