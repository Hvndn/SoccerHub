"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
 isFull as isTournamentFull,
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

const STEPS_ALL = [
  { label: "Chọn giải đấu", hint: "Giải đang mở đăng ký" },
  { label: "Thông tin đội", hint: "Tên đội & quân số" },
  { label: "Đội trưởng & liên hệ", hint: "Người chịu trách nhiệm" },
  { label: "Xác nhận & nộp", hint: "Duyệt & giữ chỗ" },
];

const STEPS_DIRECT = [
  { label: "Thông tin đội", hint: "Tên đội & quân số" },
  { label: "Đội trưởng & liên hệ", hint: "Người chịu trách nhiệm" },
  { label: "Xác nhận & nộp", hint: "Duyệt & giữ chỗ" },
];

const STEPS_OLD = [
 { label: "Chọn giải đấu", hint: "Giải đang mở đăng ký" },
 { label: "Thông tin đội", hint: "Tên đội & quân số" },
 { label: "Đội trưởng & liên hệ", hint: "Người chịu trách nhiệm" },
 { label: "Xác nhận & nộp", hint: "Duyệt & giữ chỗ" },
];

const inputCls =
 "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-emerald-500";
const labelCls = "block text-[14px] font-bold text-slate-700 mb-1.5";
const errCls = "mt-1 text-[14px] font-semibold text-rose-600 ";
const PHONE_RE = /^0\d{9}$/;

export default function RegisterTeamPage() {
 return (
  <Suspense fallback={<div className="p-4 sm:p-8 text-sm text-slate-500">Đang tải…</div>}>
  <main>
 <RegisterTeamWizard />
  </main>
  </Suspense>
 );
}

function RegisterTeamWizard() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("tournamentId");
  const isDirect = Boolean(presetId);
  const router = useRouter();

  // Nếu đã chỉ định giải từ trang trước (click vào giải) -> vào thẳng bước 0 của luồng 3 bước (không có bước chọn giải)
  const steps = isDirect ? STEPS_DIRECT : STEPS_ALL;
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

  // Khi có presetId → chỉ chọn giải đó, không load cho đổi giải khác
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await fetchTournaments();
        if (!alive) return;
        const open = list.filter((t) => (t.status ?? "OPEN") === "OPEN");
        setTournaments(open);
        if (presetId) {
          const matched = open.find((t) => String(t.id) === presetId) || list.find((t) => String(t.id) === presetId);
          if (matched) {
            setTournamentId(String(matched.id));
          }
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
  const { user, updateProfile } = useAuth();
  const isInviteOnly = selected?.joinMode === "INVITE_ONLY";
  const myEmail = (user?.email ?? "").toLowerCase();
  const amInvited = !isInviteOnly || (selected?.invitedEmails ?? []).some((e) => (e ?? "").toLowerCase() === myEmail);
  const isSelectedFull = selected ? isTournamentFull(selected) : false;

  // Mapping bước cho validate (khi isDirect thì step 0 là team, step 1 là captain, step 2 là confirm)
  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    const logicalStep = isDirect ? s + 1 : s;

    if (logicalStep === 0 && !selected) e.tournament = "Vui lòng chọn một giải đấu đang mở đăng ký.";
    if (logicalStep === 0 && selected && !amInvited) e.tournament = "Giải này chỉ mời tham gia qua email. Bạn cần được BTC mời trước khi đăng ký đội.";
    
    if (logicalStep === 1) {
      if (isSelectedFull) {
        e.teamName = "Giải đấu này đã đủ số lượng đội đăng ký, không thể tiếp tục.";
      }
      if (teamName.trim().length < 3) e.teamName = "Tên đội phải có ít nhất 3 ký tự.";
      if (!Number.isInteger(memberCount) || memberCount < 5 || memberCount > 25)
        e.memberCount = "Quân số phải từ 5 đến 25 cầu thủ.";
    }
    if (logicalStep === 2) {
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
    if (isSelectedFull) {
      setErrors({ teamName: "Giải đấu này đã đủ số lượng đội đăng ký, không thể tiếp tục." });
      return;
    }
    if (!validateStep(step)) return;
    const next = Math.min(step + 1, steps.length - 1);
    setStep(next);
    setMaxReached((m) => Math.max(m, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (step === 0) {
      router.back();
    } else {
      setStep((s) => Math.max(0, s - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    if (isSelectedFull) {
      setSubmitError("Giải đấu này đã đủ số lượng đội đăng ký, không thể nộp đơn.");
      return;
    }
    if (!validateStep(0) || !validateStep(1) || !selected) {
      return;
    }
    try {
      setSubmitting(true);
      setSubmitError(null);
      const profileName = (user?.fullName || "").trim();
      const profilePhone = (user?.phone || "").trim();
      const typedName = captainName.trim();
      const typedPhone = captainPhone.trim();
      if ((typedName && typedName !== profileName) || (typedPhone && typedPhone !== profilePhone)) {
        await updateProfile({
          ...(typedName ? { fullName: typedName } : {}),
          ...(typedPhone ? { phone: typedPhone } : {}),
        });
      }
      await registerTeam(selected.id, {
        teamName: teamName.trim(),
        captainName: typedName,
        captainPhone: typedPhone,
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
 onBack={() => {
   if (typeof window !== "undefined" && window.history.length > 1) {
     router.back();
   } else {
     router.push("/?tab=tournaments");
   }
 }}
 backLabel="Quay lại"
 crumb="Đăng ký đội thi đấu"
 title="Đăng ký đội bóng tham dự giải"
 subtitle="Hoàn tất các bước để nộp danh sách đội và giữ chỗ thi đấu ."
 >
 <WizardStepper
 steps={steps}
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
 <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-7 space-y-5">
        {/* Pinned Tournament Header Card (luôn hiển thị giải đang đăng ký, không cho đổi giải khác) */}
        {selected && (
          <div className={`p-4 rounded-xl border-2 space-y-2 ${
            isSelectedFull ? "border-rose-400 bg-rose-50" : "border-sky-300 bg-sky-50/70"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[14px] font-black text-sky-800 tracking-wider">
                  🏆 GIẢI ĐẤU ĐĂNG KÝ
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {selected.title}
                </h3>
                <p className="mt-0.5 text-[14px] text-slate-600">
                  {sportLabel(selected.sportType)} • Khởi tranh {formatDate(selected.startDate)} •{" "}
                  <strong>{selected.registeredTeams ?? 0}/{selected.totalTeams ?? "—"} đội</strong>
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="block text-[14px] text-slate-500 font-semibold">Lệ phí giải</span>
                <span className="font-mono text-base font-black text-sky-800">
                  {formatMoney(selected.entryFee)}
                </span>
              </div>
            </div>
            {isSelectedFull ? (
              <div className="p-2.5 rounded-lg bg-rose-100 border border-rose-300 text-rose-800 font-bold text-[14px] flex items-center gap-1.5">
                <span>🔒 Giải đấu đã đủ số lượng đội đăng ký (Hết suất). Bạn không thể nộp đơn tham gia giải này.</span>
              </div>
            ) : (
              <div className="text-[14px] text-emerald-800 font-bold flex items-center gap-1.5">
                <span>✅ Bạn đang nộp hồ sơ tham gia giải đấu này</span>
              </div>
            )}
          </div>
        )}

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
 <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[14px] font-bold text-rose-700 ">
 {loadError}
 </p>
 ) : tournaments.length === 0 ? (
 <p className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-[14px] text-slate-500 text-center">
 Hiện chưa có giải đấu nào đang mở đăng ký.
 </p>
  ) : (
  // Nếu có presetId → hiển thị card giải đã khoá (không cho đổi giải)
  presetId && selected ? (
  (() => {
  const isSelectedFull = (selected.registeredTeams ?? 0) >= (selected.totalTeams ?? Infinity);
  return (
  <div className={`p-4 rounded-xl border-2 space-y-1 ${
  isSelectedFull ? "border-rose-400 bg-rose-50" : "border-emerald-600 bg-sky-50"
  }`}>
  <div className="flex items-start justify-between gap-2">
  <div className="min-w-0">
  <p className="text-sm font-black text-slate-900 truncate">{selected.title}</p>
  <p className="mt-1 text-[14px] text-slate-600">
  {sportLabel(selected.sportType)} • Khởi tranh {formatDate(selected.startDate)} •{" "}
  {selected.registeredTeams ?? 0}/{selected.totalTeams ?? "—"} đội
  </p>
  </div>
  <span className="shrink-0 font-mono text-sm font-black text-sky-800">
  {formatMoney(selected.entryFee)}
  </span>
  </div>
  {isSelectedFull ? (
  <p className="text-[14px] text-rose-700 font-bold">🔒 Giải đấu này đã đủ số lượng đội tham gia. Vui lòng quay lại chọn giải khác.</p>
  ) : (
  <p className="text-[14px] text-emerald-700 font-bold">✅ Bạn đang đăng ký giải này</p>
  )}
  </div>
  );
  })()
  ) : (
  // Không có presetId → hiển thị danh sách để chọn
  tournaments.map((t) => {
  const isFull = (t.registeredTeams ?? 0) >= (t.totalTeams ?? Infinity);
  return (
  <button
  key={t.id}
  type="button"
  disabled={isFull}
  onClick={() => {
  if (isFull) return;
  setTournamentId(String(t.id));
  setErrors((e) => {
  const n = { ...e };
  delete n.tournament;
  return n;
  });
  }}
  aria-pressed={tournamentId === String(t.id)}
  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
  isFull
  ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
  : tournamentId === String(t.id)
  ? "border-emerald-600 bg-sky-50"
  : "border-slate-200 hover:border-slate-300"
  }`}
  >
  <span className="flex items-start justify-between gap-2">
  <span className="min-w-0">
  <span className="block text-sm font-black text-slate-900 truncate">
  {t.title}
  </span>
  <span className="mt-1 block text-[14px] text-slate-600">
  {sportLabel(t.sportType)} • Khởi tranh {formatDate(t.startDate)} •{" "}
  {t.registeredTeams ?? 0}/{t.totalTeams ?? "—"} đội
  </span>
  {isFull && (
  <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 border border-rose-300 text-rose-800 text-[14px] font-black">
  🔒 Đã đủ đội
  </span>
  )}
  {!isFull && t.joinMode === "INVITE_ONLY" && (
  <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[14px] font-black">
  🔒 Chỉ mời qua email
  </span>
  )}
  </span>
  <span className="shrink-0 font-mono text-sm font-black text-sky-800">
  {formatMoney(t.entryFee)}
  </span>
  </span>
  </button>
  );
  })
  )
 )}
  {selected && isInviteOnly && !amInvited && (
  <p className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-[14px] font-bold text-amber-900 leading-relaxed">
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
 placeholder="Ví dụ: FC Đại Nắng United"
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
 <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-[14px]">
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
 <p className="flex items-center gap-2 text-[14px] text-slate-500">
 <Trophy className="w-3.5 h-3.5 text-sky-700" />
 Hồ sơ được lưu vào hệ thống & giữ chỗ tự động cho đội của bạn.
 </p>
 {submitError && (
 <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[14px] font-bold text-rose-700 ">
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
 className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-[14px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all"
 >
 <ArrowLeft className="w-4 h-4" />
 <span>Quay lại</span>
 </button>
 <span className="text-[14px] font-mono text-slate-600 ">Bước {step + 1}/{steps.length}</span>
 {step < steps.length - 1 ? (
 <button
 type="button"
 onClick={goNext}
 className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-black transition-all active:scale-95"
 >
 <span>Tiếp tục</span>
 <ArrowRight className="w-4 h-4" />
 </button>
 ) : (
 <button
 type="button"
 onClick={handleSubmit}
 disabled={submitting}
 className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-black transition-all active:scale-95 disabled:opacity-50"
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
 <p className="text-[14px] sm:text-sm text-slate-500">
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
 <div className="text-[14px] text-slate-600 space-y-1.5">
 <p>Quét mã bằng app ngân hàng để chuyển khoản đúng số tiền.</p>
 <p>Nội dung CK: <strong className="font-mono">{teamName}</strong></p>
 {selected.accountName && (
 <p>Chủ TK: <strong>{selected.accountName}</strong> • {selected.bankAccount}</p>
 )}
 </div>
 </div>
 ) : (
 <p className="text-[14px] text-slate-500">
 Giải chưa công bố tài khoản nhận online — BTC sẽ liên hệ thu trực tiếp. Bạn vẫn giữ chỗ ở trạng thái chờ xác nhận.
 </p>
 )}
 {paidAck ? (
 <p className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[14px] font-bold text-sky-800 ">
 ✓ Đã ghi nhận chuyển khoản. BTC sẽ xác nhận trong 24h — đội được bốc thăm sau khi xác nhận.
 </p>
 ) : (
 qrUrl && (
 <button
 type="button"
 onClick={onPaidAck}
 className="w-full py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-black transition-all active:scale-95"
 >
 Tôi đã chuyển khoản
 </button>
 )
 )}
 </div>

 <div className="flex flex-wrap justify-center gap-2.5 pt-1">
 <a
 href="/?tab=tournaments"
 className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[14px] font-bold transition-all active:scale-95"
 >
 Về danh sách giải đấu
 </a>
 </div>
 </div>
 );
}
