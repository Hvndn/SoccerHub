"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import WizardStepper from "@/components/WizardStepper";
import WizardPageShell from "@/components/WizardPageShell";
import {
 fetchTournaments,
 registerTeam,
 formatMoney,
 formatDate,
 sportLabel,
 buildVietQrUrl,
 type Tournament,
} from "@/lib/tournamentService";
import {
 ArrowLeft,
 ArrowRight,
 CheckCircle2,
 ChevronRight,
 QrCode,
 RefreshCw,
 ShieldCheck,
 Trophy,
} from "lucide-react";

const STEPS = [
 { label: "Chọn giải đấu", hint: "Giải đang mở đăng ký" },
 { label: "Thông tin đội", hint: "Tên đội & quân số" },
 { label: "Đội trưởng & liên hệ", hint: "Người chịu trách nhiệm" },
 { label: "Xác nhận & nộp", hint: "Duyệt & giữ chỗ" },
];

const inputCls =
 "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-emerald-500";
const labelCls = "block text-[13px] font-bold text-slate-700 mb-1.5";
const errCls = "mt-1 text-[13px] font-semibold text-rose-600 ";
const PHONE_RE = /^0\d{9}$/;

export default function RegisterTeamPage() {
 return (
 <Suspense fallback={<div className="p-4 sm:p-8 text-sm text-slate-500">Đang tải…</div>}>
 <RegisterTeamWizard />
 </Suspense>
 );
}

function RegisterTeamWizard() {
 const searchParams = useSearchParams();
 const presetId = searchParams.get("tournamentId");

 const [step, setStep] = useState(0);
 const [maxReached, setMaxReached] = useState(0);
 const [errors, setErrors] = useState<Record<string, string>>({});
 const [tournaments, setTournaments] = useState<Tournament[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [submitting, setSubmitting] = useState(false);
 const [submitError, setSubmitError] = useState<string | null>(null);
 const [done, setDone] = useState(false);
 const [paidAck, setPaidAck] = useState(false);

 const [tournamentId, setTournamentId] = useState<string>(presetId ?? "");
 const [teamName, setTeamName] = useState("");
 const [memberCount, setMemberCount] = useState(12);
 const [captainName, setCaptainName] = useState("");
 const [captainPhone, setCaptainPhone] = useState("");
 const [subCaptainPhone, setSubCaptainPhone] = useState("");

 useEffect(() => {
 let alive = true;
 (async () => {
 try {
 setLoading(true);
 const list = await fetchTournaments();
 if (!alive) return;
 const open = list.filter((t) => (t.status ?? "OPEN") === "OPEN");
 setTournaments(open);
 if (presetId && open.some((t) => String(t.id) === presetId)) {
 setTournamentId(presetId);
 } else if (open.length > 0) {
 setTournamentId(String(open[0].id));
 }
 } catch {
 if (alive) setLoadError("Không tải được danh sách giải đấu. Kiểm tra Backend (cổng 8080) rồi thử lại.");
 } finally {
 if (alive) setLoading(false);
 }
 })();
 return () => {
 alive = false;
 };
 }, [presetId]);

 const selected = tournaments.find((t) => String(t.id) === tournamentId) ?? null;
  // Giải kín (chỉ mời qua email): email đang đăng nhập có nằm trong danh sách mời không.
  const { user } = useAuth();
  const isInviteOnly = selected?.joinMode === "INVITE_ONLY";
  const myEmail = (user?.email ?? "").toLowerCase();
  const amInvited = !isInviteOnly || (selected?.invitedEmails ?? []).some((e) => (e ?? "").toLowerCase() === myEmail);

 const validateStep = (s: number): boolean => {
 const e: Record<string, string> = {};
 if (s === 0 && !selected) e.tournament = "Vui lòng chọn một giải đấu đang mở đăng ký.";
  if (s === 0 && selected && !amInvited) e.tournament = "Giải này chỉ mời tham gia qua email. Bạn cần được BTC mời trước khi đăng ký đội.";
 if (s === 1) {
 if (teamName.trim().length < 3) e.teamName = "Tên đội phải có ít nhất 3 ký tự.";
 if (!Number.isInteger(memberCount) || memberCount < 5 || memberCount > 25)
 e.memberCount = "Quân số phải từ 5 đến 25 cầu thủ.";
 }
 if (s === 2) {
 if (captainName.trim().length < 3) e.captainName = "Vui lòng nhập họ tên đội trưởng.";
 if (!PHONE_RE.test(captainPhone.trim()))
 e.captainPhone = "Số điện thoại phải gồm 10 số, bắt đầu bằng 0 (VD: 0909…).";
 if (subCaptainPhone.trim() && !PHONE_RE.test(subCaptainPhone.trim()))
 e.subCaptainPhone = "Số dự phòng chưa đúng định dạng 10 số.";
 }
 setErrors(e);
 return Object.keys(e).length === 0;
 };

 const goNext = () => {
 if (!validateStep(step)) return;
 const next = Math.min(step + 1, STEPS.length - 1);
 setStep(next);
 setMaxReached((m) => Math.max(m, next));
 window.scrollTo({ top: 0, behavior: "smooth" });
 };
 const goBack = () => {
 setStep((s) => Math.max(0, s - 1));
 window.scrollTo({ top: 0, behavior: "smooth" });
 };

 const handleSubmit = async () => {
 if (!validateStep(0) || !validateStep(1) || !validateStep(2) || !selected) {
 setStep(!selected ? 0 : 1);
 return;
 }
 try {
 setSubmitting(true);
 setSubmitError(null);
 await registerTeam(selected.id, {
 teamName: teamName.trim(),
 captainName: captainName.trim(),
 captainPhone: captainPhone.trim(),
 subCaptainPhone: subCaptainPhone.trim(),
 memberCount,
 });
 setDone(true);
 window.scrollTo({ top: 0, behavior: "smooth" });
 } catch (err: any) {
 setSubmitError(err?.message || "Nộp đơn không thành công, vui lòng thử lại.");
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <WizardPageShell
 backHref="/?tab=tournaments"
 backLabel="Quay lại Giải Đấu & BXH"
 crumb="Đăng ký đội thi đấu"
 title="Đăng ký đội bóng tham dự giải"
 subtitle="Hoàn tất 4 bước để nộp danh sách đội và giữ chỗ thi đấu trong CSDL."
 >
 <WizardStepper
 steps={STEPS}
 current={step}
 maxReached={maxReached}
 onGo={(i) => {
 setStep(i);
 window.scrollTo({ top: 0, behavior: "smooth" });
 }}
 />

 {done && selected ? (
 <PaymentSuccess
 selected={selected}
 teamName={teamName}
 paidAck={paidAck}
 onPaidAck={() => setPaidAck(true)}
 />
 ) : (
 <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-7">
 {/* key={step} để replay animation fade mỗi lần sang bước mới */}
 <div key={step} className="animate-fade-in-up">
 {/* STEP 1 — chọn giải */}
 {step === 0 && (
 <div className="space-y-3">
 {loading ? (
 <div className="space-y-2.5 animate-pulse">
 {[0, 1, 2].map((i) => (
 <div key={i} className="h-16 rounded-xl bg-slate-100 " />
 ))}
 </div>
 ) : loadError ? (
 <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[13px] font-bold text-rose-700 ">
 {loadError}
 </p>
 ) : tournaments.length === 0 ? (
 <p className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-[13px] text-slate-500 text-center">
 Hiện chưa có giải đấu nào đang mở đăng ký.
 </p>
 ) : (
 tournaments.map((t) => (
 <button
 key={t.id}
 type="button"
 onClick={() => {
 setTournamentId(String(t.id));
 setErrors((e) => {
 const n = { ...e };
 delete n.tournament;
 return n;
 });
 }}
 aria-pressed={tournamentId === String(t.id)}
 className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
 tournamentId === String(t.id)
 ? "border-emerald-600 bg-sky-50 "
 : "border-slate-200 hover:border-slate-300"
 }`}
 >
 <span className="flex items-start justify-between gap-2">
 <span className="min-w-0">
 <span className="block text-sm font-black text-slate-900 truncate">
 {t.title}
 </span>
 <span className="mt-1 block text-[13px] text-slate-500">
 {sportLabel(t.sportType)} • Khởi tranh {formatDate(t.startDate)} •{" "}
 {t.registeredTeams ?? 0}/{t.totalTeams ?? "—"} đội
 </span>
  {t.joinMode === "INVITE_ONLY" && (
  <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[13px] font-black">
  🔒 Chỉ mời qua email
  </span>
  )}
 </span>
 <span className="shrink-0 font-mono text-sm font-black text-sky-800 ">
 {formatMoney(t.entryFee)}
 </span>
 </span>
 </button>
 ))
 )}
  {selected && isInviteOnly && !amInvited && (
  <p className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-[13px] font-bold text-amber-900 leading-relaxed">
  🔒 Giải này chỉ mời tham gia qua email. Bạn cần được Ban Tổ Chức mời trước khi đăng ký đội.
  </p>
  )}
 {errors.tournament && <p className={errCls}>{errors.tournament}</p>}
 </div>
 )}

 {/* STEP 2 — thông tin đội */}
 {step === 1 && (
 <div className="space-y-4">
 <div>
 <label htmlFor="r-team" className={labelCls}>Tên Đội Bóng (FC) *</label>
 <input
 id="r-team"
 type="text"
 value={teamName}
 onChange={(e) => setTeamName(e.target.value)}
 placeholder="Ví dụ: FC Saigon Warriors"
 className={inputCls}
 />
 {errors.teamName && <p className={errCls}>{errors.teamName}</p>}
 </div>
 <div>
 <label htmlFor="r-members" className={labelCls}>Số Lượng Thành Viên (5–25) *</label>
 <input
 id="r-members"
 type="number"
 min={5}
 max={25}
 value={memberCount}
 onChange={(e) => setMemberCount(Number(e.target.value))}
 className={inputCls}
 />
 {errors.memberCount && <p className={errCls}>{errors.memberCount}</p>}
 </div>
 </div>
 )}

 {/* STEP 3 — đội trưởng */}
 {step === 2 && (
 <div className="space-y-4">
 <div>
 <label htmlFor="r-cap" className={labelCls}>Họ & Tên Đội Trưởng *</label>
 <input
 id="r-cap"
 type="text"
 value={captainName}
 onChange={(e) => setCaptainName(e.target.value)}
 placeholder="Người chịu trách nhiệm chính của đội"
 className={inputCls}
 />
 {errors.captainName && <p className={errCls}>{errors.captainName}</p>}
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label htmlFor="r-phone" className={labelCls}>Số ĐT Đội Trưởng / Zalo *</label>
 <input
 id="r-phone"
 type="tel"
 value={captainPhone}
 onChange={(e) => setCaptainPhone(e.target.value)}
 placeholder="09xx… (10 số)"
 className={inputCls}
 />
 {errors.captainPhone && <p className={errCls}>{errors.captainPhone}</p>}
 </div>
 <div>
 <label htmlFor="r-subphone" className={labelCls}>Số ĐT Dự Phòng</label>
 <input
 id="r-subphone"
 type="tel"
 value={subCaptainPhone}
 onChange={(e) => setSubCaptainPhone(e.target.value)}
 placeholder="Không bắt buộc"
 className={inputCls}
 />
 {errors.subCaptainPhone && <p className={errCls}>{errors.subCaptainPhone}</p>}
 </div>
 </div>
 </div>
 )}

 {/* STEP 4 — xác nhận */}
 {step === 3 && (
 <div className="space-y-4">
 <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-[13px]">
 <p className="flex items-center gap-2 font-black text-slate-900 text-sm">
 <ShieldCheck className="w-4 h-4 text-sky-700" />
 Duyệt lại hồ sơ trước khi nộp
 </p>
 <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600 ">
 <div><dt className="inline text-slate-500">Giải đấu: </dt><dd className="inline font-bold">{selected?.title ?? "—"}</dd></div>
 <div><dt className="inline text-slate-500">Đội bóng: </dt><dd className="inline font-bold">{teamName || "—"}</dd></div>
 <div><dt className="inline text-slate-500">Quân số: </dt><dd className="inline font-bold">{memberCount} cầu thủ</dd></div>
 <div><dt className="inline text-slate-500">Đội trưởng: </dt><dd className="inline font-bold">{captainName || "—"} ({captainPhone || "—"})</dd></div>
 <div className="sm:col-span-2">
 <dt className="inline text-slate-500">Lệ phí dự kiến: </dt>
 <dd className="inline font-mono font-black text-sky-800 ">
 {formatMoney(selected?.entryFee)}
 </dd>
 </div>
 </dl>
 </div>
 <p className="flex items-center gap-2 text-[13px] text-slate-500">
 <Trophy className="w-3.5 h-3.5 text-sky-700" />
 Hồ sơ được lưu vào CSDL & giữ chỗ tự động cho đội của bạn.
 </p>
 {submitError && (
 <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[13px] font-bold text-rose-700 ">
 {submitError}
 </p>
 )}
 </div>
 )}

 </div>

 {/* Footer nav */}
 <div className="flex items-center justify-between gap-3 pt-4 mt-4 sm:pt-6 sm:mt-6 border-t border-slate-200 ">
 <button
 type="button"
 onClick={goBack}
 disabled={step === 0}
 className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-[13px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all"
 >
 <ArrowLeft className="w-4 h-4" />
 <span>Quay lại</span>
 </button>
 <span className="text-[13px] font-mono text-slate-600 ">Bước {step + 1}/{STEPS.length}</span>
 {step < STEPS.length - 1 ? (
 <button
 type="button"
 onClick={goNext}
 className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black transition-all active:scale-95"
 >
 <span>Tiếp tục</span>
 <ArrowRight className="w-4 h-4" />
 </button>
 ) : (
 <button
 type="button"
 onClick={handleSubmit}
 disabled={submitting}
 className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black transition-all active:scale-95 disabled:opacity-50"
 >
 {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
 <span>{submitting ? "Đang nộp…" : "Xác nhận & Nộp đơn"}</span>
 {!submitting && <ChevronRight className="w-4 h-4" />}
 </button>
 )}
 </div>
 </div>
 )}
 </WizardPageShell>
 );
}

function PaymentSuccess({
 selected,
 teamName,
 paidAck,
 onPaidAck,
}: {
 selected: Tournament;
 teamName: string;
 paidAck: boolean;
 onPaidAck: () => void;
}) {
 const qrUrl = buildVietQrUrl({
 bankCode: selected.bankCode,
 bankAccount: selected.bankAccount,
 accountName: selected.accountName,
 entryFee: selected.entryFee,
 addInfo: teamName,
 });

 return (
 <div className="p-4 sm:p-8 rounded-2xl bg-white border border-sky-200 text-center space-y-4">
 <CheckCircle2 className="w-12 h-12 text-sky-700 mx-auto" />
 <h2 className="text-lg font-black text-slate-900 ">Nộp đơn thành công!</h2>
 <p className="text-[13px] sm:text-sm text-slate-500">
 Đội <strong className="text-slate-900 ">“{teamName}”</strong> đã được ghi
 danh vào giải <strong className="text-slate-900 ">“{selected.title}”</strong> ở
 trạng thái <strong className="text-amber-600">chờ xác nhận lệ phí</strong>.
 </p>

 <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5 space-y-3 text-left">
 <p className="flex items-center gap-2 text-sm font-black text-slate-900 ">
 <QrCode className="w-4 h-4 text-sky-700" />
 Thanh toán lệ phí: <span className="font-mono text-sky-800 ">{formatMoney(selected.entryFee)}</span>
 </p>
 {qrUrl ? (
 <div className="flex flex-col sm:flex-row items-center gap-4">
 <img
 src={qrUrl}
 alt={`QR nộp lệ phí giải ${selected.title}`}
 loading="lazy"
 className="w-44 h-44 rounded-xl border border-slate-200 bg-white object-contain shrink-0"
 />
 <div className="text-[13px] text-slate-600 space-y-1.5">
 <p>Quét mã bằng app ngân hàng để chuyển khoản đúng số tiền.</p>
 <p>Nội dung CK: <strong className="font-mono">{teamName}</strong></p>
 {selected.accountName && (
 <p>Chủ TK: <strong>{selected.accountName}</strong> • {selected.bankAccount}</p>
 )}
 </div>
 </div>
 ) : (
 <p className="text-[13px] text-slate-500">
 Giải chưa công bố tài khoản nhận online — BTC sẽ liên hệ thu trực tiếp. Bạn vẫn giữ chỗ ở trạng thái chờ xác nhận.
 </p>
 )}
 {paidAck ? (
 <p className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[13px] font-bold text-sky-800 ">
 ✓ Đã ghi nhận chuyển khoản. BTC sẽ xác nhận trong 24h — đội được bốc thăm sau khi xác nhận.
 </p>
 ) : (
 qrUrl && (
 <button
 type="button"
 onClick={onPaidAck}
 className="w-full py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-black transition-all active:scale-95"
 >
 Tôi đã chuyển khoản
 </button>
 )
 )}
 </div>

 <div className="flex flex-wrap justify-center gap-2.5 pt-1">
 <a
 href="/?tab=tournaments"
 className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold transition-all active:scale-95"
 >
 Về danh sách giải đấu
 </a>
 </div>
 </div>
 );
}
