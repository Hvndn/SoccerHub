"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Download, Loader2, BarChart3, CalendarRange, ClipboardList } from "lucide-react";
import { API_BASE_URL, getAuthToken, fetchWithTimeout } from '@/lib/api';
import { toastOk, toastErr } from "@/lib/toast";
import { Mail, Send } from "lucide-react";

type ReportType = "revenue" | "bookings" | "summary";

const REPORTS: {
 key: ReportType;
 label: string;
 desc: string;
 icon: React.ReactNode;
 filename: string;
}[] = [
 {
 key: "revenue",
 label: "Doanh thu theo tháng",
 desc: "Tổng doanh thu, số đơn và số đơn huỷ của từng tháng",
 icon: <BarChart3 className="w-4 h-4" />,
 filename: "bao-cao-doanh-thu.csv",
 },
 {
 key: "bookings",
 label: "Chi tiết đơn đặt sân",
 desc: "Danh sách từng đơn: khách, khung giờ, tiền cọc, còn lại",
 icon: <ClipboardList className="w-4 h-4" />,
 filename: "bao-cao-don-dat-san.csv",
 },
 {
 key: "summary",
 label: "Tổng quan cụm sân",
 desc: "Số sân con, giá, số đơn, doanh thu và tỷ lệ lấp đầy",
 icon: <FileSpreadsheet className="w-4 h-4" />,
 filename: "bao-cao-tong-quan.csv",
 },
];

function today(offsetDays = 0) {
 const d = new Date();
 d.setDate(d.getDate() + offsetDays);
 return d.toISOString().slice(0, 10);
}

/** Tải file CSV từ endpoint báo cáo (cần gửi Authorization vì backend chặn khách). */
async function downloadReport(path: string, filename: string) {
 const token = getAuthToken();
 const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
 headers: token ? { Authorization: `Bearer ${token}` } : {},
 });
 if (!res.ok) {
 let msg = `Lỗi ${res.status}`;
 try {
 const j = await res.json();
 msg = j?.message || msg;
 } catch {
 /* ignore */
 }
 throw new Error(msg);
 }
 const blob = await res.blob();
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = filename;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
}

export default function OwnerReportExport() {
 const [busy, setBusy] = useState<ReportType | null>(null);
 const [months, setMonths] = useState(6);
 const [from, setFrom] = useState(today(-30));
 const [to, setTo] = useState(today(0));
 const [days, setDays] = useState(30);

 // Gửi email
 const [mailTo, setMailTo] = useState("");
 const [mailType, setMailType] = useState<ReportType>("revenue");
 const [mailBusy, setMailBusy] = useState(false);
 const [mailReady, setMailReady] = useState<boolean | null>(null);

 const loadMailStatus = React.useCallback(async () => {
 try {
 const token = getAuthToken();
 const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/reports/email-status`, {
 headers: token ? { Authorization: `Bearer ${token}` } : {},
 });
 if (!res.ok) return;
 const j = await res.json();
 setMailReady(!!j?.enabled);
 } catch {
 setMailReady(false);
 }
 }, []);

 React.useEffect(() => {
 loadMailStatus();
 }, [loadMailStatus]);

 const sendMail = async () => {
 const to = mailTo.trim();
 if (!to) {
 toastErr("Vui lòng nhập email nhận báo cáo.");
 return;
 }
 setMailBusy(true);
 try {
 const token = getAuthToken();
 const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/reports/send-email`, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 ...(token ? { Authorization: `Bearer ${token}` } : {}),
 },
 body: JSON.stringify({
 toEmail: to,
 type: mailType,
 months,
 days,
 from,
 to,
 }),
 });
 const j = await res.json().catch(() => ({}));
 if (!res.ok) {
 toastErr(j?.message || "Không gửi được báo cáo qua email.");
 return;
 }
 toastOk(j?.message || "Đã gửi báo cáo qua email.");
 } catch (err: any) {
 toastErr(err?.message || "Lỗi khi gửi báo cáo qua email.");
 } finally {
 setMailBusy(false);
 }
 };

 const run = async (t: ReportType) => {
 const meta = REPORTS.find((r) => r.key === t)!;
 let path = "";
 if (t === "revenue") path = `/api/v1/reports/revenue.csv?months=${months}`;
 else if (t === "bookings")
 path = `/api/v1/reports/bookings.csv?from=${from}&to=${to}`;
 else path = `/api/v1/reports/summary.csv?days=${days}`;

 setBusy(t);
 try {
 await downloadReport(path, meta.filename);
 toastOk(`Đã tải về "${meta.filename}". Mở bằng Excel để xem.`);
 } catch (err: any) {
 toastErr(err?.message || "Không tải được báo cáo.");
 } finally {
 setBusy(null);
 }
 };

 return (
 <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-md p-4 sm:p-6 space-y-4">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
 <FileSpreadsheet className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-black text-sm text-slate-900">Xuất báo cáo thống kê</h3>
 <p className="text-[13px] text-slate-500 mt-0.5">
 Tải file CSV (mở bằng Excel). Chỉ gồm dữ liệu của các cụm sân bạn sở hữu.
 </p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 {REPORTS.map((r) => (
 <button
 key={r.key}
 type="button"
 onClick={() => run(r.key)}
 disabled={busy !== null}
 className="text-left rounded-2xl border border-slate-200 hover:border-[#0369a1]/50 hover:bg-slate-50 p-3.5 transition-all disabled:opacity-50 active:scale-[0.98] group"
 >
 <div className="flex items-center justify-between gap-2 mb-1.5">
 <span className="w-8 h-8 rounded-lg bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center shrink-0">
 {r.icon}
 </span>
 {busy === r.key ? (
 <Loader2 className="w-4 h-4 text-[#0369a1] animate-spin" />
 ) : (
 <Download className="w-4 h-4 text-slate-400 group-hover:text-[#0369a1] transition-colors" />
 )}
 </div>
 <p className="font-black text-[13px] text-slate-900 leading-tight">{r.label}</p>
 <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
 </button>
 ))}
 </div>

 {/* Bộ lọc theo từng loại báo cáo */}
 <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
 <label className="block">
 <span className="block text-[13px] font-bold text-slate-600 mb-1">Số tháng (báo cáo doanh thu)</span>
 <select
 value={months}
 onChange={(e) => setMonths(Number(e.target.value))}
 className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 >
 {[3, 6, 12, 24].map((m) => (
 <option key={m} value={m}>
 {m} tháng gần nhất
 </option>
 ))}
 </select>
 </label>

 <label className="block">
 <span className="block text-[13px] font-bold text-slate-600 mb-1">Từ ngày (báo cáo đơn đặt)</span>
 <input
 type="date"
 value={from}
 max={to}
 onChange={(e) => setFrom(e.target.value)}
 className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 </label>

 <label className="block">
 <span className="block text-[13px] font-bold text-slate-600 mb-1">Đến ngày / số ngày thống kê</span>
 <div className="flex gap-2">
 <input
 type="date"
 value={to}
 min={from}
 onChange={(e) => setTo(e.target.value)}
 className="flex-1 min-w-0 px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 <select
 value={days}
 onChange={(e) => setDays(Number(e.target.value))}
 aria-label="Số ngày thống kê tổng quan"
 className="px-2 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 >
 {[30, 90, 180, 365].map((d) => (
 <option key={d} value={d}>
 {d} ngày
 </option>
 ))}
 </select>
 </div>
 </label>
 </div>

 <p className="flex items-start gap-2 text-[13px] text-slate-500 leading-relaxed">
 <CalendarRange className="w-3.5 h-3.5 text-[#0369a1] shrink-0 mt-0.5" />
 <span>
 File CSV có BOM UTF-8 nên Excel hiển thị đúng tiếng Việt có dấu.
 Doanh thu tính = tiền cọc + tiền mặt còn lại ở các đơn đã thu; đơn đã huỷ không tính.
 </span>
 </p>

 {/* ---- Gửi báo cáo qua email ---- */}
 <div className="pt-3 border-t border-slate-100 space-y-3">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
 <Mail className="w-4 h-4" />
 </div>
 <div className="min-w-0 flex-1">
 <h4 className="font-black text-[13px] text-slate-900">Hoặc gửi báo cáo qua email</h4>
 <p className="text-[13px] text-slate-500 mt-0.5">
 File CSV được đính kèm trực tiếp trong email.
 </p>
 </div>
 {mailReady === false && (
 <span className="shrink-0 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[13px] font-black">
 SMTP chưa bật
 </span>
 )}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_auto] gap-3 items-end">
 <label className="block">
 <span className="block text-[13px] font-bold text-slate-600 mb-1">Email nhận báo cáo</span>
 <input
 type="email"
 value={mailTo}
 onChange={(e) => setMailTo(e.target.value)}
 placeholder="VD: chusan@gmail.com"
 className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 </label>

 <label className="block">
 <span className="block text-[13px] font-bold text-slate-600 mb-1">Loại báo cáo</span>
 <select
 value={mailType}
 onChange={(e) => setMailType(e.target.value as ReportType)}
 className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 >
 {REPORTS.map((r) => (
 <option key={r.key} value={r.key}>
 {r.label}
 </option>
 ))}
 </select>
 </label>

 <button
 type="button"
 onClick={sendMail}
 disabled={mailBusy || !mailTo.trim()}
 className="px-5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 whitespace-nowrap h-[38px]"
 >
 {mailBusy ? (
 <Loader2 className="w-3.5 h-3.5 animate-spin" />
 ) : (
 <Send className="w-3.5 h-3.5" />
 )}
 {mailBusy ? "Đang gửi…" : "Gửi email"}
 </button>
 </div>

 {mailReady === false && (
 <p className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
 Hệ thống chưa cấu hình SMTP nên chưa gửi được email. Quản trị viên cần đặt các biến{" "}
 <code className="font-mono">MAIL_ENABLED=true</code>, <code className="font-mono">MAIL_USERNAME</code>,{" "}
 <code className="font-mono">MAIL_PASSWORD</code> (với Gmail dùng Mật khẩu ứng dụng).
 </p>
 )}
 </div>
 </section>
 );
}