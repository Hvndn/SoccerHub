"use client";

import React, { Suspense, useState } from "react";
import WizardStepper from "@/components/WizardStepper";
import WizardPageShell from "@/components/WizardPageShell";
import { createTournament, sportLabel, formatLabel } from "@/lib/tournamentService";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Trophy,
} from "lucide-react";

const STEPS = [
  { label: "Thông tin cơ bản", hint: "Tên giải & môn thi đấu" },
  { label: "Thể thức & quy mô", hint: "Knockout / vòng tròn" },
  { label: "Thời gian & địa điểm", hint: "Ngày đấu & sân đăng cai" },
  { label: "Giải thưởng & xác nhận", hint: "Duyệt & công bố" },
];

const SPORT_OPTIONS = ["SAN_7", "SAN_5", "SAN_11", "FUTSAL"] as const;
const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";
const labelCls = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5";
const errCls = "mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400";

function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s + "T00:00:00").getTime());
}

export default function NewTournamentPage() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-8 text-sm text-slate-500">Đang tải…</div>}>
      <NewTournamentWizard />
    </Suspense>
  );
}

function NewTournamentWizard() {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    sportType: "SAN_7",
    format: "KNOCKOUT",
    totalTeams: 16,
    pitchName: "",
    location: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    prizePool: 30000000,
    entryFee: 1500000,
    bankCode: "",
    bankAccount: "",
    accountName: "",
  });

  const set = (k: keyof typeof form, v: string | number) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      if (!e[k]) return e;
      const next = { ...e };
      delete next[k];
      return next;
    });
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (form.title.trim().length < 6) e.title = "Tên giải phải có ít nhất 6 ký tự.";
    }
    if (s === 2) {
      if (!form.pitchName.trim()) e.pitchName = "Vui lòng nhập sân đăng cai.";
      if (!form.location.trim()) e.location = "Vui lòng nhập khu vực tổ chức.";
      if (!isValidDate(form.startDate)) e.startDate = "Chọn ngày khởi tranh hợp lệ.";
      if (form.endDate && !isValidDate(form.endDate)) e.endDate = "Ngày bế mạc chưa hợp lệ.";
      if (isValidDate(form.startDate) && isValidDate(form.endDate) && form.endDate < form.startDate)
        e.endDate = "Ngày bế mạc phải sau ngày khởi tranh.";
      if (form.registrationDeadline && !isValidDate(form.registrationDeadline))
        e.registrationDeadline = "Hạn đăng ký chưa hợp lệ.";
      if (
        isValidDate(form.registrationDeadline) &&
        isValidDate(form.startDate) &&
        form.registrationDeadline > form.startDate
      )
        e.registrationDeadline = "Hạn đăng ký nên trước ngày khởi tranh.";
    }
    if (s === 3) {
      if (Number(form.prizePool) < 0) e.prizePool = "Quỹ thưởng không được âm.";
      if (Number(form.entryFee) < 0) e.entryFee = "Lệ phí không được âm.";
      if (form.bankCode && !form.bankAccount.trim()) e.bankAccount = "Nhập số tài khoản.";
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
    if (!validateStep(0) || !validateStep(2) || !validateStep(3)) {
      setStep(!form.title.trim() || form.title.trim().length < 6 ? 0 : 2);
      return;
    }
    try {
      setSubmitting(true);
      setSubmitError(null);
      const created = await createTournament({
        title: form.title.trim(),
        description:
          form.description.trim() ||
          `Giải đấu bóng đá phong trào ${form.sportType} tổ chức tại ${form.pitchName.trim()}.`,
        sportType: form.sportType,
        format: form.format,
        pitchName: form.pitchName.trim(),
        location: form.location.trim(),
        totalTeams: Number(form.totalTeams),
        prizePool: Number(form.prizePool),
        entryFee: Number(form.entryFee),
        bankCode: form.bankCode.trim() || undefined,
        bankAccount: form.bankAccount.trim() || undefined,
        accountName: form.accountName.trim() || undefined,
        startDate: form.startDate,
        endDate: form.endDate || form.startDate,
        registrationDeadline: form.registrationDeadline || form.startDate,
        status: "OPEN",
      });
      setCreatedId(created?.id ?? null);
    } catch (err: any) {
      setSubmitError(err?.message || "Tạo giải đấu không thành công, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WizardPageShell
      backHref="/?tab=tournaments"
      backLabel="Quay lại Giải Đấu & BXH"
      crumb="Tạo giải đấu mới"
      title="Khởi tạo giải đấu bóng đá mới"
      subtitle="Hoàn tất 4 bước để công bố giải lên hệ thống SoccerHub & CSDL thật."
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

      {/* Success state */}
      {createdId !== null ? (
        <div className="p-4 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Công bố giải đấu thành công!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Giải <strong className="text-slate-900 dark:text-white">“{form.title}”</strong> đã được
            lưu vào CSDL và hiển thị trong danh sách Giải Đấu & BXH.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 pt-2">
            <a
              href="/?tab=tournaments"
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all active:scale-95"
            >
              Xem danh sách giải đấu
            </a>
            <button
              type="button"
              onClick={() => {
                setCreatedId(null);
                setForm((f) => ({ ...f, title: "", description: "" }));
                setStep(0);
                setMaxReached(0);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              Tạo giải khác
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-7">
          {/* key={step} để replay animation fade mỗi lần sang bước mới */}
          <div key={step} className="animate-fade-in-up">
          {/* STEP 1 */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="t-title" className={labelCls}>Tên Giải Đấu *</label>
                <input
                  id="t-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ví dụ: Cúp Tứ Hùng Phủi Hòa Xuân Mùa Hè 2026"
                  className={inputCls}
                />
                {errors.title && <p className={errCls}>{errors.title}</p>}
              </div>
              <div>
                <label htmlFor="t-desc" className={labelCls}>Mô Tả Giải Đấu</label>
                <textarea
                  id="t-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Thể lệ nổi bật, đối tượng tham dự, điểm nhấn của giải…"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="t-sport" className={labelCls}>Môn / Thể Thức Sân *</label>
                <select
                  id="t-sport"
                  value={form.sportType}
                  onChange={(e) => set("sportType", e.target.value)}
                  className={inputCls}
                >
                  {SPORT_OPTIONS.map((s) => (
                    <option key={s} value={s}>{sportLabel(s)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <span className={labelCls}>Hình Thức Thi Đấu *</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["KNOCKOUT", "ROUND_ROBIN"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => set("format", f)}
                      aria-pressed={form.format === f}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.format === f
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="block text-sm font-black text-slate-900 dark:text-white">
                        {f === "KNOCKOUT" ? "Loại trực tiếp" : "Vòng tròn tính điểm"}
                      </span>
                      <span className="block mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {f === "KNOCKOUT"
                          ? "Thua là loại — kịch tính, phù hợp cúp ngắn ngày."
                          : "Đá vòng tròn — công bằng, phù hợp league dài hơi."}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="t-total" className={labelCls}>Quy Mô Số Đội *</label>
                <select
                  id="t-total"
                  value={form.totalTeams}
                  onChange={(e) => set("totalTeams", Number(e.target.value))}
                  className={inputCls}
                >
                  <option value={8}>8 đội (Tứ kết Knockout)</option>
                  <option value={16}>16 đội (Vòng bảng + Knockout)</option>
                  <option value={32}>32 đội (Open Cup đại quy mô)</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="t-pitch" className={labelCls}>Sân Đăng Cai Tổ Chức *</label>
                  <input
                    id="t-pitch"
                    type="text"
                    value={form.pitchName}
                    onChange={(e) => set("pitchName", e.target.value)}
                    placeholder="Ví dụ: Cụm Sân Chuyên Việt"
                    className={inputCls}
                  />
                  {errors.pitchName && <p className={errCls}>{errors.pitchName}</p>}
                </div>
                <div>
                  <label htmlFor="t-loc" className={labelCls}>Địa Điểm Khu Vực *</label>
                  <input
                    id="t-loc"
                    type="text"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="Ví dụ: Q. Hải Châu, Đà Nẵng"
                    className={inputCls}
                  />
                  {errors.location && <p className={errCls}>{errors.location}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="t-start" className={labelCls}>Ngày Khởi Tranh *</label>
                  <input
                    id="t-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    className={inputCls}
                  />
                  {errors.startDate && <p className={errCls}>{errors.startDate}</p>}
                </div>
                <div>
                  <label htmlFor="t-end" className={labelCls}>Ngày Bế Mạc</label>
                  <input
                    id="t-end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set("endDate", e.target.value)}
                    className={inputCls}
                  />
                  {errors.endDate && <p className={errCls}>{errors.endDate}</p>}
                </div>
                <div>
                  <label htmlFor="t-deadline" className={labelCls}>Hạn Đăng Ký</label>
                  <input
                    id="t-deadline"
                    type="date"
                    value={form.registrationDeadline}
                    onChange={(e) => set("registrationDeadline", e.target.value)}
                    className={inputCls}
                  />
                  {errors.registrationDeadline && <p className={errCls}>{errors.registrationDeadline}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="t-prize" className={labelCls}>Tổng Quỹ Thưởng (VNĐ)</label>
                  <input
                    id="t-prize"
                    type="number"
                    min={0}
                    step={1000000}
                    value={form.prizePool}
                    onChange={(e) => set("prizePool", Number(e.target.value))}
                    className={`${inputCls} font-mono font-bold`}
                  />
                  {errors.prizePool && <p className={errCls}>{errors.prizePool}</p>}
                </div>
                <div>
                  <label htmlFor="t-fee" className={labelCls}>Lệ Phí Mỗi Đội (VNĐ)</label>
                  <input
                    id="t-fee"
                    type="number"
                    min={0}
                    step={100000}
                    value={form.entryFee}
                    onChange={(e) => set("entryFee", Number(e.target.value))}
                    className={`${inputCls} font-mono font-bold`}
                  />
                  {errors.entryFee && <p className={errCls}>{errors.entryFee}</p>}
                </div>
              </div>

              {/* Tài khoản nhận lệ phí (tùy chọn — để hiện QR thu phí khi đội đăng ký) */}
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 sm:p-3.5 space-y-3">
                <p className="text-xs font-black text-slate-700 dark:text-slate-200">
                  Tài khoản nhận lệ phí <span className="font-medium text-slate-400">(tùy chọn)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="t-bank" className={labelCls}>Ngân hàng</label>
                    <select
                      id="t-bank"
                      value={form.bankCode}
                      onChange={(e) => set("bankCode", e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— Không thu online —</option>
                      <option value="970422">MBBank</option>
                      <option value="970415">VietinBank</option>
                      <option value="970418">BIDV</option>
                      <option value="970436">Vietcombank</option>
                      <option value="970432">VPBank</option>
                      <option value="970423">TPBank</option>
                      <option value="970407">Techcombank</option>
                      <option value="970405">Agribank</option>
                      <option value="970441">VIB</option>
                      <option value="970448">OCB</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="t-acc" className={labelCls}>Số tài khoản</label>
                    <input
                      id="t-acc"
                      type="text"
                      inputMode="numeric"
                      value={form.bankAccount}
                      onChange={(e) => set("bankAccount", e.target.value.replace(/\D/g, ""))}
                      placeholder="VD: 0909123456"
                      className={`${inputCls} font-mono`}
                    />
                    {errors.bankAccount && <p className={errCls}>{errors.bankAccount}</p>}
                  </div>
                  <div>
                    <label htmlFor="t-accname" className={labelCls}>Tên chủ TK</label>
                    <input
                      id="t-accname"
                      type="text"
                      value={form.accountName}
                      onChange={(e) => set("accountName", e.target.value)}
                      placeholder="VD: NGUYEN VAN A"
                      className={inputCls}
                    />
                  </div>
                </div>
                {form.bankCode && !form.bankAccount && (
                  <p className={errCls}>Đã chọn ngân hàng thì nhập thêm số tài khoản.</p>
                )}
              </div>

              {/* Review */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
                <p className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-sm">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  {form.title || "(Chưa đặt tên giải)"}
                </p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600 dark:text-slate-300">
                  <div><dt className="inline text-slate-500">Thể thức: </dt><dd className="inline font-bold">{sportLabel(form.sportType)} • {formatLabel(form.format)}</dd></div>
                  <div><dt className="inline text-slate-500">Quy mô: </dt><dd className="inline font-bold">{form.totalTeams} đội</dd></div>
                  <div><dt className="inline text-slate-500">Địa điểm: </dt><dd className="inline font-bold">{form.pitchName || "—"} — {form.location || "—"}</dd></div>
                  <div><dt className="inline text-slate-500">Thời gian: </dt><dd className="inline font-bold">{form.startDate || "—"} → {form.endDate || form.startDate || "—"}</dd></div>
                  <div><dt className="inline text-slate-500">Quỹ thưởng: </dt><dd className="inline font-mono font-bold text-emerald-700 dark:text-emerald-400">{Number(form.prizePool).toLocaleString("vi-VN")}đ</dd></div>
                  <div><dt className="inline text-slate-500">Lệ phí: </dt><dd className="inline font-mono font-bold">{Number(form.entryFee).toLocaleString("vi-VN")}đ/đội</dd></div>
                </dl>
              </div>

              {submitError && (
                <p className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-700 dark:text-rose-300">
                  {submitError}
                </p>
              )}
            </div>
          )}

          </div>

          {/* Footer nav */}
          <div className="flex items-center justify-between gap-3 pt-4 mt-4 sm:pt-6 sm:mt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">Bước {step + 1}/{STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all active:scale-95"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{submitting ? "Đang công bố…" : "Xác nhận & Công bố giải"}</span>
                {!submitting && <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      )}
    </WizardPageShell>
  );
}
