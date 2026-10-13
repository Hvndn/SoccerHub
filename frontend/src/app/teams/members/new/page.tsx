"use client";

import React, { useState } from "react";
import WizardStepper from "@/components/WizardStepper";
import WizardPageShell from "@/components/WizardPageShell";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  UserPlus,
} from "lucide-react";

const STEPS = [
  { label: "Thông tin cá nhân", hint: "Tên & liên hệ" },
  { label: "Vị trí & trình độ", hint: "Sở trường thi đấu" },
  { label: "Đội & vai trò", hint: "Gán vào đội bóng" },
  { label: "Xác nhận & lưu", hint: "Duyệt & hoàn tất" },
];

const POSITIONS = ["Thủ Môn (GK)", "Hậu Vệ (CB/RB/LB)", "Tiền Vệ (CM/DM/AM)", "Tiền Vệ Cánh (LM/RM)", "Tiền Đạo (ST)"];
const LEVELS = ["Mới chơi", "Phong trào", "Bán chuyên", "Chuyên nghiệp"];
const ROLES = ["Thành Viên", "Đội Trưởng", "Đội Phó", "Thủ Quỹ"];

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";
const labelCls = "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5";
const errCls = "mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400";
const DRAFT_KEY = "soccerhub_player_drafts";
const PHONE_RE = /^0\d{9}$/;

export interface PlayerDraft {
  fullName: string;
  phone: string;
  position: string;
  level: string;
  favoriteSport: string;
  teamName: string;
  role: string;
  number: number;
  createdAt: string;
}

function loadDrafts(): PlayerDraft[] {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function NewPlayerPage() {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<PlayerDraft | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    position: POSITIONS[3],
    level: LEVELS[1],
    favoriteSport: "Bóng Đá Sân 7",
    teamName: "",
    role: ROLES[0],
    number: 10,
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
      if (form.fullName.trim().length < 3) e.fullName = "Họ tên phải có ít nhất 3 ký tự.";
      if (!PHONE_RE.test(form.phone.trim()))
        e.phone = "Số điện thoại phải gồm 10 số, bắt đầu bằng 0.";
    }
    if (s === 2) {
      if (form.teamName.trim().length < 2) e.teamName = "Vui lòng nhập tên đội bóng.";
      if (!Number.isInteger(form.number) || form.number < 1 || form.number > 99)
        e.number = "Số áo phải từ 1 đến 99.";
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

  const handleSubmit = () => {
    if (!validateStep(0) || !validateStep(2)) {
      setStep(form.fullName.trim().length < 3 ? 0 : 2);
      return;
    }
    const draft: PlayerDraft = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      position: form.position,
      level: form.level,
      favoriteSport: form.favoriteSport,
      teamName: form.teamName.trim(),
      role: form.role,
      number: form.number,
      createdAt: new Date().toISOString(),
    };
    try {
      const all = loadDrafts();
      all.push(draft);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
    } catch {
      // private mode — vẫn hiển thị thành công cho bản nháp hiện tại
    }
    setDone(draft);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <WizardPageShell
      backHref="/?tab=team-management"
      backLabel="Quay lại Quản Lý Đội"
      crumb="Thêm cầu thủ mới"
      title="Chiêu mộ cầu thủ vào đội"
      subtitle="Hoàn tất 4 bước để thêm hồ sơ cầu thủ. Hiện tại lưu nháp trên máy — sẽ đồng bộ CSDL khi backend có endpoint cầu thủ."
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

      {done ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Đã thêm cầu thủ!</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-white">“{done.fullName}”</strong> (áo số{" "}
            {done.number} — {done.position}) đã được thêm vào đội{" "}
            <strong className="text-slate-900 dark:text-white">“{done.teamName}”</strong> với vai trò{" "}
            {done.role}. Hồ sơ đang lưu nháp trên máy này.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 pt-2">
            <a
              href="/?tab=team-management"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all active:scale-95"
            >
              Về quản lý đội bóng
            </a>
            <button
              type="button"
              onClick={() => {
                setDone(null);
                setForm((f) => ({ ...f, fullName: "", phone: "", teamName: "" }));
                setStep(0);
                setMaxReached(0);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              Thêm cầu thủ khác
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7">
          {/* key={step} để replay animation fade mỗi lần sang bước mới */}
          <div key={step} className="animate-fade-in-up">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="p-name" className={labelCls}>Họ & Tên Cầu Thủ *</label>
                <input
                  id="p-name"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className={inputCls}
                />
                {errors.fullName && <p className={errCls}>{errors.fullName}</p>}
              </div>
              <div>
                <label htmlFor="p-phone" className={labelCls}>Số Điện Thoại / Zalo *</label>
                <input
                  id="p-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="09xx… (10 số)"
                  className={inputCls}
                />
                {errors.phone && <p className={errCls}>{errors.phone}</p>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="p-pos" className={labelCls}>Vị Trí Sở Trường *</label>
                <select
                  id="p-pos"
                  value={form.position}
                  onChange={(e) => set("position", e.target.value)}
                  className={inputCls}
                >
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="p-level" className={labelCls}>Trình Độ</label>
                  <select
                    id="p-level"
                    value={form.level}
                    onChange={(e) => set("level", e.target.value)}
                    className={inputCls}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="p-sport" className={labelCls}>Môn Yêu Thích</label>
                  <select
                    id="p-sport"
                    value={form.favoriteSport}
                    onChange={(e) => set("favoriteSport", e.target.value)}
                    className={inputCls}
                  >
                    {["Bóng Đá Sân 5", "Bóng Đá Sân 7", "Bóng Đá Sân 11", "Futsal"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="p-team" className={labelCls}>Đội Bóng Gia Nhập *</label>
                <input
                  id="p-team"
                  type="text"
                  value={form.teamName}
                  onChange={(e) => set("teamName", e.target.value)}
                  placeholder="Ví dụ: FC Thunder Saigon"
                  className={inputCls}
                />
                {errors.teamName && <p className={errCls}>{errors.teamName}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="p-role" className={labelCls}>Vai Trò Trong Đội</label>
                  <select
                    id="p-role"
                    value={form.role}
                    onChange={(e) => set("role", e.target.value)}
                    className={inputCls}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="p-num" className={labelCls}>Số Áo (1–99)</label>
                  <input
                    id="p-num"
                    type="number"
                    min={1}
                    max={99}
                    value={form.number}
                    onChange={(e) => set("number", Number(e.target.value))}
                    className={inputCls}
                  />
                  {errors.number && <p className={errCls}>{errors.number}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
                <p className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-sm">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  Duyệt lại hồ sơ cầu thủ
                </p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600 dark:text-slate-300">
                  <div><dt className="inline text-slate-500">Họ tên: </dt><dd className="inline font-bold">{form.fullName || "—"}</dd></div>
                  <div><dt className="inline text-slate-500">Liên hệ: </dt><dd className="inline font-bold">{form.phone || "—"}</dd></div>
                  <div><dt className="inline text-slate-500">Vị trí: </dt><dd className="inline font-bold">{form.position}</dd></div>
                  <div><dt className="inline text-slate-500">Trình độ: </dt><dd className="inline font-bold">{form.level}</dd></div>
                  <div><dt className="inline text-slate-500">Đội bóng: </dt><dd className="inline font-bold">{form.teamName || "—"}</dd></div>
                  <div><dt className="inline text-slate-500">Vai trò / Số áo: </dt><dd className="inline font-bold">{form.role} — #{form.number}</dd></div>
                </dl>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Lưu ý: backend hiện chưa có endpoint quản lý cầu thủ nên hồ sơ được lưu nháp trên
                trình duyệt này. Khi có API, chỉ cần thay 1 hàm lưu là đồng bộ CSDL.
              </p>
            </div>
          )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <span className="text-[11px] font-mono text-slate-400">Bước {step + 1}/{STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all active:scale-95"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all active:scale-95"
              >
                <span>Xác nhận & Thêm cầu thủ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </WizardPageShell>
  );
}
