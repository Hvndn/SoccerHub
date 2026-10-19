"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
 User,
 Ruler,
 Weight,
 Shirt,
 Footprints,
 Clock,
 MapPin,
 Building2,
 Check,
 Loader2,
 Sparkles,
 ChevronRight,
 ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getAuthToken } from "@/lib/api";

/** Cờ đánh dấu "tài khoản cầu thủ mới, chưa hoàn tất khởi tạo hồ sơ" — lưu theo từng email. */
const PENDING_KEY = "Turfzone_player_setup_pending_";

export function markPlayerSetupPending(email: string) {
  if (typeof window === "undefined" || !email) return;
  try {
    localStorage.setItem(PENDING_KEY + email.toLowerCase(), "1");
  } catch {
    /* ignore */
  }
}

export function clearPlayerSetupPending(email: string) {
  if (typeof window === "undefined" || !email) return;
  try {
    localStorage.removeItem(PENDING_KEY + email.toLowerCase());
  } catch {
    /* ignore */
  }
}

export function isPlayerSetupPending(email: string): boolean {
  if (typeof window === "undefined" || !email) return false;
  try {
    return localStorage.getItem(PENDING_KEY + email.toLowerCase()) === "1";
  } catch {
    return false;
  }
}

const POSITIONS = [
 "Thủ môn",
 "Hậu vệ cánh phải",
 "Hậu vệ cánh trái",
 "Trung vệ",
 "Tiền vệ trung",
 "Tiền vệ cánh",
 "Tiền đạo",
 "Cầu thủ đa năng",
];

const FEET = ["Phải", "Trái", "Cả hai chân"];
const TIMES = ["Sáng (06h - 11h)", "Trưa (11h - 16h)", "Tối (16h - 22h)", "Khuya (22h - 06h)"];
const LEVELS = ["Mới bắt đầu", "Phong trào", "Nghiệp dư", "Bán chuyên", "Chuyên nghiệp"];
const SPORTS = ["Bóng đá sân 7", "Bóng đá sân 5", "Futsal", "Bóng đá sân 11"];

interface FormState {
 position: string;
 dominantFoot: string;
 jerseyNumber: string;
 height: string;
 weight: string;
 preferredTime: string;
 currentClub: string;
 area: string;
 level: string;
 favoriteSport: string;
}

const EMPTY: FormState = {
 position: "",
 dominantFoot: "Phải",
 jerseyNumber: "",
 height: "",
 weight: "",
 preferredTime: "Tối (16h - 22h)",
 currentClub: "",
 area: "",
 level: "Phong trào",
 favoriteSport: "Bóng đá sân 7",
};

function Field({
 label,
 icon,
 required,
 children,
 hint,
}: {
 label: string;
 icon: React.ReactNode;
 required?: boolean;
 children: React.ReactNode;
 hint?: string;
}) {
 return (
 <label className="block space-y-1.5">
 <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
 <span className="text-[#0369a1]">{icon}</span>
 {label}
 {required && <span className="text-rose-500">*</span>}
 </span>
 {children}
 {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
 </label>
 );
}

const inputCls =
 "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 " +
 "placeholder:text-slate-400 focus:outline-none focus:border-[#0369a1] focus:ring-2 focus:ring-[#0369a1]/25";

export default function PlayerSetup() {
 const router = useRouter();
 const { user, isLoading, updateProfile, setUser } = useAuth();
 const [form, setForm] = useState<FormState>(EMPTY);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [ready, setReady] = useState(false);

 // Nạp sẵn dữ liệu hồ sơ hiện có (nếu người dùng vào lại trang)
 useEffect(() => {
 if (isLoading) return;
 if (!user) {
 router.replace("/");
 return;
 }
 if (user.role !== "PLAYER") {
 router.replace("/");
 return;
 }
 // Không còn cờ "chưa khởi tạo" và hồ sơ đã có dữ liệu -> không cần vào lại trang này
 const pending = isPlayerSetupPending(user.email || "");
 const hasProfile = !!(user.position || user.dominantFoot || user.jerseyNumber);
 if (!pending && hasProfile) {
 router.replace("/");
 return;
 }
 setForm({
 position: user.position || "",
 dominantFoot: user.dominantFoot || "Phải",
 jerseyNumber: user.jerseyNumber || "",
 height: user.height || "",
 weight: user.weight || "",
 preferredTime: user.preferredTime || "Tối (16h - 22h)",
 currentClub: user.currentClub || "",
 area: user.area || "",
 level: user.level || "Phong trào",
 favoriteSport: user.favoriteSport || "Bóng đá sân 7",
 });
 setReady(true);
 }, [user, isLoading, router]);

 const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
 setForm((f) => ({ ...f, [k]: e.target.value }));

 const progress = useMemo(() => {
 const checks = [
 !!form.position,
 !!form.dominantFoot,
 !!form.jerseyNumber && Number(form.jerseyNumber) > 0,
 !!form.height && Number(form.height) > 0,
 !!form.weight && Number(form.weight) > 0,
 !!form.area.trim(),
 ];
 return Math.round((checks.filter(Boolean).length / checks.length) * 100);
 }, [form]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user) return;
 if (!form.position) {
 setError("Vui lòng chọn vị trí thi đấu của bạn.");
 return;
 }
 setSaving(true);
 setError(null);
 try {
 const updated = await updateProfile({
 position: form.position,
 dominantFoot: form.dominantFoot,
 jerseyNumber: form.jerseyNumber,
 height: form.height,
 weight: form.weight,
 preferredTime: form.preferredTime,
 currentClub: form.currentClub.trim(),
 area: form.area.trim(),
 level: form.level,
 favoriteSport: form.favoriteSport,
 });
 setUser(updated);
 clearPlayerSetupPending(user.email || "");
 router.replace("/");
 } catch (err: any) {
 setError(err?.message || "Không lưu được hồ sơ. Vui lòng thử lại.");
 } finally {
 setSaving(false);
 }
 };

 if (!ready || isLoading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-slate-50">
 <Loader2 className="w-8 h-8 animate-spin text-[#0369a1]" />
 </div>
 );
 }

 return (
 <main className="min-h-screen bg-slate-50 text-slate-900 py-6 sm:py-10 px-3 sm:px-6">
 <div className="max-w-3xl mx-auto space-y-5">
 {/* Header */}
 <header className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-7 space-y-3">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-2xl bg-[#0369a1] text-white flex items-center justify-center shrink-0">
 <User className="w-6 h-6" />
 </div>
 <div className="min-w-0">
 <h1 className="text-xl sm:text-2xl font-black text-slate-900">
 Khởi tạo hồ sơ cầu thủ
 </h1>
 <p className="text-xs text-slate-500 mt-0.5">
 Chào mừng <strong className="text-slate-800">{user?.fullName}</strong> — hoàn tất hồ sơ để
 hệ thống ghép kèo và đánh giá phong độ phù hợp với bạn.
 </p>
 </div>
 </div>

 {/* Thanh tiến trình */}
 <div className="pt-1">
 <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
 <span>Tiến độ hoàn tất</span>
 <span className="font-mono text-[#0369a1]">{progress}%</span>
 </div>
 <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
 <div
 className="h-full rounded-full bg-[#0369a1] transition-all duration-500"
 style={{ width: `${progress}%` }}
 />
 </div>
 </div>
 </header>

 {/* Form */}
 <form
 onSubmit={handleSubmit}
 className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5"
 >
 <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
 <Sparkles className="w-4 h-4 text-amber-600" />
 <h2 className="font-black text-sm text-slate-900">Thông tin thi đấu</h2>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Field label="Vị trí thi đấu" icon={<ChevronRight className="w-3.5 h-3.5" />} required>
 <select value={form.position} onChange={set("position")} className={inputCls} required>
 <option value="">— Chọn vị trí —</option>
 {POSITIONS.map((p) => (
 <option key={p} value={p}>
 {p}
 </option>
 ))}
 </select>
 </Field>

 <Field label="Chân thuận" icon={<Footprints className="w-3.5 h-3.5" />} required>
 <select value={form.dominantFoot} onChange={set("dominantFoot")} className={inputCls}>
 {FEET.map((f) => (
 <option key={f} value={f}>
 {f}
 </option>
 ))}
 </select>
 </Field>

 <Field label="Số áo" icon={<Shirt className="w-3.5 h-3.5" />} required>
 <input
 type="number"
 min={1}
 max={99}
 value={form.jerseyNumber}
 onChange={set("jerseyNumber")}
 placeholder="VD: 10"
 className={inputCls}
 />
 </Field>

 <Field label="Môn thể thức yêu thích" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
 <select value={form.favoriteSport} onChange={set("favoriteSport")} className={inputCls}>
 {SPORTS.map((s) => (
 <option key={s} value={s}>
 {s}
 </option>
 ))}
 </select>
 </Field>

 <Field label="Chiều cao (cm)" icon={<Ruler className="w-3.5 h-3.5" />} required>
 <input
 type="number"
 min={100}
 max={230}
 value={form.height}
 onChange={set("height")}
 placeholder="VD: 175"
 className={inputCls}
 />
 </Field>

 <Field label="Cân nặng (kg)" icon={<Weight className="w-3.5 h-3.5" />} required>
 <input
 type="number"
 min={35}
 max={150}
 value={form.weight}
 onChange={set("weight")}
 placeholder="VD: 70"
 className={inputCls}
 />
 </Field>

 <Field label="Khu vực chơi bóng" icon={<MapPin className="w-3.5 h-3.5" />} required>
 <input
 value={form.area}
 onChange={set("area")}
 placeholder="VD: Quận 7, Đà Nẵng"
 className={inputCls}
 required
 />
 </Field>

 <Field label="Khung giờ thường chơi" icon={<Clock className="w-3.5 h-3.5" />}>
 <select value={form.preferredTime} onChange={set("preferredTime")} className={inputCls}>
 {TIMES.map((t) => (
 <option key={t} value={t}>
 {t}
 </option>
 ))}
 </select>
 </Field>

 <Field label="Trình độ hiện tại" icon={<Sparkles className="w-3.5 h-3.5" />}>
 <select value={form.level} onChange={set("level")} className={inputCls}>
 {LEVELS.map((l) => (
 <option key={l} value={l}>
 {l}
 </option>
 ))}
 </select>
 </Field>

 <Field label="CLB / Đội bóng hiện tại" icon={<Building2 className="w-3.5 h-3.5" />}>
 <input
 value={form.currentClub}
 onChange={set("currentClub")}
 placeholder="VD: FC Phù Đổng Q7 (không bắt buộc)"
 className={inputCls}
 />
 </Field>
 </div>

 {error && (
 <p
 role="alert"
 className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-3.5 py-2.5"
 >
 {error}
 </p>
 )}

 <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-4">
 <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm">
 Bạn có thể sửa lại hồ sơ này bất cứ lúc nào trong mục{" "}
 <strong className="text-slate-700">Hồ Sơ VĐV</strong>.
 </p>
 <div className="flex flex-col sm:flex-row gap-2 shrink-0">
 <button
 type="button"
 disabled={saving}
 onClick={() => {
 if (user?.email) clearPlayerSetupPending(user.email);
 router.replace("/");
 }}
 className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all active:scale-95 disabled:opacity-40 whitespace-nowrap"
 >
 Hoàn thiện sau
 </button>
 <button
 type="submit"
 disabled={saving || progress < 100}
 className="px-6 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 whitespace-nowrap"
 >
 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
 {saving ? "Đang lưu…" : "Hoàn tất & vào hệ thống"}
 </button>
 </div>
 </div>
 </form>

 <p className="text-center text-[11px] text-slate-400">
 Không có token?{" "}
 <a href="/" className="underline hover:text-slate-600">
 Quay lại trang chủ
 </a>
 </p>
 </div>
 </main>
 );
}
