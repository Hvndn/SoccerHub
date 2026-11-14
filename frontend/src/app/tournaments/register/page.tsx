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
  AlertCircle,
  Lock,
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

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1]";
const labelCls = "block text-[13px] font-bold text-slate-700 mb-1.5";
const errCls = "mt-1 text-[13px] font-semibold text-rose-600";
const PHONE_RE = /^(0[3|5|7|8|9])[0-9]{8}$/;

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

  const { user, updateProfile } = useAuth();

  // Nạp danh sách giải đấu
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

  // Điền sẵn thông tin đội trưởng nếu user đã có hồ sơ
  useEffect(() => {
    if (user) {
      if (!captainName && user.fullName) {
        setCaptainName(user.fullName);
      }
      if (!captainPhone && user.phone) {
        setCaptainPhone(user.phone);
      }
    }
  }, [user]);

  const selected = tournaments.find((t) => String(t.id) === tournamentId) ?? null;
  const isInviteOnly = selected?.joinMode === "INVITE_ONLY";
  const myEmail = (user?.email ?? "").toLowerCase();
  const amInvited = !isInviteOnly || (selected?.invitedEmails ?? []).some((e) => (e ?? "").toLowerCase() === myEmail);
  const isSelectedFull = selected ? isTournamentFull(selected) : false;

  // Giai đoạn thực tế:
  // 0: Chọn giải
  // 1: Thông tin đội (Tên FC, quân số)
  // 2: Thông tin đội trưởng (Họ tên, SĐT)
  // 3: Xác nhận & Nộp
  const stage = isDirect ? step + 1 : step;

  const validateStage = (st: number): boolean => {
    const e: Record<string, string> = {};

    if (st === 0) {
      if (!selected) {
        e.tournament = "Vui lòng chọn một giải đấu đang mở đăng ký.";
      } else if (isInviteOnly && !amInvited) {
        e.tournament = "Giải đấu này chỉ mời tham gia qua email. Bạn cần được Ban Tổ Chức mời trước khi đăng ký.";
      }
    }

    if (st === 1) {
      if (!selected) {
        e.teamName = "Vui lòng chọn giải đấu trước khi điền thông tin đội.";
      } else if (isSelectedFull) {
        e.teamName = "Giải đấu này đã đủ số lượng đội đăng ký, không thể tiếp tục.";
      } else if (selected.status === "ONGOING" || selected.status === "COMPLETED") {
        e.teamName = "Giải đấu đã chính thức khởi tranh hoặc đã kết thúc, không thể nộp đơn đăng ký mới.";
      } else if (isInviteOnly && !amInvited) {
        e.teamName = "Giải đấu này giới hạn qua email mời. Bạn chưa nằm trong danh sách email được mời.";
      }
      if (teamName.trim().length < 3) {
        e.teamName = "Tên đội bóng phải có ít nhất 3 ký tự.";
      } else if (selected?.teams && Array.isArray(selected.teams)) {
        const isDuplicate = selected.teams.some(
          (t: any) => (t?.name || t?.teamName || "").trim().toLowerCase() === teamName.trim().toLowerCase()
        );
        if (isDuplicate) {
          e.teamName = `Tên đội "${teamName.trim()}" đã được đăng ký trong giải đấu này. Vui lòng chọn tên khác.`;
        }
      }
      if (!Number.isInteger(memberCount) || memberCount < 5 || memberCount > 25) {
        e.memberCount = "Quân số phải từ 5 đến 25 cầu thủ.";
      }
    }

    if (st === 2) {
      if (captainName.trim().length < 3) {
        e.captainName = "Vui lòng nhập họ tên người liên hệ / đội trưởng.";
      }
      if (!PHONE_RE.test(captainPhone.trim())) {
        e.captainPhone = "Số điện thoại phải gồm 10 số, bắt đầu bằng 0 (VD: 0909…).";
      }
      if (subCaptainPhone.trim()) {
        if (!PHONE_RE.test(subCaptainPhone.trim())) {
          e.subCaptainPhone = "Số điện thoại dự phòng chưa đúng định dạng 10 số (VD: 0909…).";
        } else if (subCaptainPhone.trim() === captainPhone.trim()) {
          e.subCaptainPhone = "Số điện thoại dự phòng không được trùng với số của đội trưởng.";
        }
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (isSelectedFull) {
      setErrors({ teamName: "Giải đấu này đã đủ số lượng đội đăng ký, không thể tiếp tục." });
      return;
    }
    if (isInviteOnly && !amInvited) {
      setErrors({
        tournament: "Giải đấu chỉ mời qua email. Vui lòng liên hệ Ban Tổ Chức giải để được cấp quyền mời.",
        teamName: "Giải đấu chỉ mời qua email. Vui lòng liên hệ Ban Tổ Chức giải để được cấp quyền mời.",
      });
      return;
    }
    if (!validateStage(stage)) return;

    const next = Math.min(step + 1, steps.length - 1);
    setStep(next);
    setMaxReached((m) => Math.max(m, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (step === 0) {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/?tab=tournaments");
      }
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
    if (isInviteOnly && !amInvited) {
      setSubmitError("Giải đấu chỉ mời qua email. Bạn chưa có trong danh sách mời của giải.");
      return;
    }
    if (!validateStage(1) || !validateStage(2) || !selected) {
      return;
    }
    if (!user) {
      setSubmitError("Vui lòng đăng nhập tài khoản Đội Trưởng để nộp hồ sơ thi đấu.");
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

  const isBlockedByInvite = Boolean(selected && isInviteOnly && !amInvited);

  return (
    <WizardPageShell
      onBack={goBack}
      backLabel="Quay lại"
      crumb="Đăng ký đội thi đấu"
      title="Đăng Ký Đội Bóng Tham Dự Giải"
      subtitle="Hoàn tất thông tin đội và nộp hồ sơ giữ chỗ thi đấu chính thức."
    >
      <WizardStepper
        steps={steps}
        current={step}
        maxReached={maxReached}
        onGo={(i) => {
          if (i <= maxReached) {
            setStep(i);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      />

      {!user && (
        <div className="px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[13px] font-semibold text-amber-900">
              Đăng nhập tài khoản Đội Trưởng để nộp hồ sơ tham gia giải
            </span>
          </div>
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-[13px] shrink-0 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Đăng Nhập</span>
          </a>
        </div>
      )}

      {done && selected ? (
        <PaymentSuccess
          selected={selected}
          teamName={teamName}
          paidAck={paidAck}
          onPaidAck={() => setPaidAck(true)}
        />
      ) : (
        <div className="rounded-lg bg-white border border-slate-300 p-4 sm:p-6 space-y-5 shadow-xs">
          {/* Card tóm tắt Giải Đấu Đang Đăng Ký (hiển thị 1 thẻ duy nhất ở trên) */}
          {selected && (
            <div
              className={`p-4 rounded-lg border space-y-2.5 ${
                isSelectedFull
                  ? "border-rose-300 bg-rose-50"
                  : isBlockedByInvite
                  ? "border-amber-300 bg-amber-50"
                  : "border-sky-300 bg-sky-50/60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[13px] font-bold text-sky-800">
                    Giải Đấu Đăng Ký
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {selected.title}
                  </h3>
                  <p className="mt-0.5 text-[13px] text-slate-600">
                    {sportLabel(selected.sportType)} • Khởi tranh {formatDate(selected.startDate)} •{" "}
                    <strong>{selected.registeredTeams ?? 0}/{selected.totalTeams ?? "—"} đội</strong>
                  </p>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="block text-[13px] text-slate-500 font-semibold">Lệ phí giải</span>
                  <span className="font-mono text-base font-bold text-sky-800">
                    {formatMoney(selected.entryFee)}
                  </span>
                </div>
              </div>

              {isSelectedFull ? (
                <div className="p-2.5 rounded-md bg-rose-100 border border-rose-300 text-rose-800 font-bold text-[13px] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Giải đấu đã đủ số lượng đội đăng ký (Hết suất). Bạn không thể nộp đơn tham gia giải này.</span>
                </div>
              ) : isBlockedByInvite ? (
                <div className="p-3 rounded-md bg-amber-100/90 border border-amber-300 text-amber-900 text-[13px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Lock className="w-4 h-4 shrink-0 text-amber-700" />
                    <span>Giải đấu này chỉ nhận đăng ký qua email mời (Invite-Only).</span>
                  </div>
                  <p className="text-amber-800">
                    Email tài khoản của bạn: <strong>{myEmail || "Chưa đăng nhập"}</strong> chưa nằm trong danh sách email được Ban Tổ Chức giải mời.
                  </p>
                  <p className="text-amber-800 text-[12px]">
                    * Nếu bạn là Chủ Sân hoặc BTC giải này: vui lòng vào trang Quản Lý Giải Đấu để thêm đội thủ công hoặc thêm email mời.
                  </p>
                </div>
              ) : (
                <div className="text-[13px] text-emerald-800 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Bạn đủ điều kiện đăng ký tham gia giải đấu này</span>
                </div>
              )}
            </div>
          )}

          {/* NỘI DUNG TỪNG BƯỚC */}
          <div key={stage} className="animate-fade-in-up">
            {/* GIAI ĐOẠN 0 — CHỌN GIẢI ĐẤU (chỉ khi vào từ đường dẫn chung không có tournamentId) */}
            {stage === 0 && (
              <div className="space-y-3">
                <p className="text-[13px] font-bold text-slate-700 mb-2">
                  Chọn giải đấu bạn muốn đăng ký tham dự:
                </p>
                {loading ? (
                  <div className="space-y-2.5 animate-pulse">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-16 rounded-lg bg-slate-100" />
                    ))}
                  </div>
                ) : loadError ? (
                  <p className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-[13px] font-bold text-rose-700">
                    {loadError}
                  </p>
                ) : tournaments.length === 0 ? (
                  <p className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-[13px] text-slate-500 text-center">
                    Hiện chưa có giải đấu nào đang mở đăng ký.
                  </p>
                ) : (
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
                        className={`w-full p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                          isFull
                            ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                            : tournamentId === String(t.id)
                            ? "border-sky-600 bg-sky-50/70"
                            : "border-slate-300 hover:border-slate-400 bg-white"
                        }`}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-slate-900 truncate">
                              {t.title}
                            </span>
                            <span className="mt-1 block text-[13px] text-slate-600">
                              {sportLabel(t.sportType)} • Khởi tranh {formatDate(t.startDate)} •{" "}
                              {t.registeredTeams ?? 0}/{t.totalTeams ?? "—"} đội
                            </span>
                            {isFull && (
                              <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 border border-rose-300 text-rose-800 text-[12px] font-bold">
                                🔒 Đã đủ đội
                              </span>
                            )}
                            {!isFull && t.joinMode === "INVITE_ONLY" && (
                              <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[12px] font-bold">
                                🔒 Chỉ mời qua email
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 font-mono text-sm font-bold text-sky-800">
                            {formatMoney(t.entryFee)}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
                {errors.tournament && <p className={errCls}>{errors.tournament}</p>}
              </div>
            )}

            {/* GIAI ĐOẠN 1 — THÔNG TIN ĐỘI BÓNG */}
            {stage === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="r-team" className={labelCls}>
                    Tên Đội Bóng (FC) *
                  </label>
                  <input
                    id="r-team"
                    type="text"
                    disabled={isBlockedByInvite || isSelectedFull}
                    value={teamName}
                    onChange={(e) => {
                      setTeamName(e.target.value);
                      if (errors.teamName) {
                        setErrors((prev) => {
                          const n = { ...prev };
                          delete n.teamName;
                          return n;
                        });
                      }
                    }}
                    placeholder="Ví dụ: FC Sông Hàn, FC Dragon Đà Nẵng..."
                    className={inputCls}
                  />
                  {errors.teamName && <p className={errCls}>{errors.teamName}</p>}
                </div>
                <div>
                  <label htmlFor="r-members" className={labelCls}>
                    Số Lượng Thành Viên Thi Đấu (5–25 cầu thủ) *
                  </label>
                  <input
                    id="r-members"
                    type="number"
                    disabled={isBlockedByInvite || isSelectedFull}
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

            {/* GIAI ĐOẠN 2 — ĐỘI TRƯỞNG & THÔNG TIN LIÊN HỆ */}
            {stage === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="r-cap" className={labelCls}>
                    Họ & Tên Đội Trưởng / Người Đại Diện *
                  </label>
                  <input
                    id="r-cap"
                    type="text"
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    placeholder="Họ và tên người chịu trách nhiệm chính của đội"
                    className={inputCls}
                  />
                  {errors.captainName && <p className={errCls}>{errors.captainName}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="r-phone" className={labelCls}>
                      Số Điện Thoại / Zalo Đội Trưởng *
                    </label>
                    <input
                      id="r-phone"
                      type="tel"
                      value={captainPhone}
                      onChange={(e) => setCaptainPhone(e.target.value)}
                      placeholder="09xx… (10 chữ số)"
                      className={inputCls}
                    />
                    {errors.captainPhone && <p className={errCls}>{errors.captainPhone}</p>}
                  </div>
                  <div>
                    <label htmlFor="r-subphone" className={labelCls}>
                      Số Điện Thoại Dự Phòng
                    </label>
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

            {/* GIAI ĐOẠN 3 — XÁC NHẬN HỒ SƠ */}
            {stage === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 border border-slate-300 p-4 space-y-2.5 text-[13px]">
                  <p className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                    <ShieldCheck className="w-4 h-4 text-sky-700" />
                    Duyệt Lại Hồ Sơ Đăng Ký
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-slate-700 pt-1">
                    <div>
                      <dt className="text-slate-500 font-semibold">Giải đấu:</dt>
                      <dd className="font-bold text-slate-900">{selected?.title ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-semibold">Tên đội bóng:</dt>
                      <dd className="font-bold text-sky-800">{teamName || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-semibold">Quân số đăng ký:</dt>
                      <dd className="font-bold text-slate-900">{memberCount} cầu thủ</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 font-semibold">Đội trưởng đại diện:</dt>
                      <dd className="font-bold text-slate-900">
                        {captainName || "—"} ({captainPhone || "—"})
                      </dd>
                    </div>
                    <div className="sm:col-span-2 pt-1 border-t border-slate-200">
                      <dt className="text-slate-500 font-semibold">Lệ phí giải dự kiến:</dt>
                      <dd className="font-mono text-base font-bold text-sky-800">
                        {formatMoney(selected?.entryFee)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <p className="flex items-center gap-2 text-[13px] text-slate-600">
                  <Trophy className="w-4 h-4 text-sky-700 shrink-0" />
                  Hồ sơ sẽ được ghi danh vào hệ thống và gửi thông báo tới Ban Tổ Chức giải.
                </p>

                {submitError && (
                  <p className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-[13px] font-bold text-rose-700">
                    {submitError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* THANH ĐIỀU HƯỚNG BƯỚC / SUBMIT */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>

            <span className="text-[13px] font-mono text-slate-600">
              Bước {step + 1}/{steps.length}
            </span>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={isBlockedByInvite || isSelectedFull}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || isBlockedByInvite || isSelectedFull}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
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
    <div className="p-4 sm:p-6 rounded-lg bg-white border border-slate-300 text-center space-y-4 shadow-xs">
      <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
      <h2 className="text-lg font-bold text-slate-900">Nộp Đơn Thành Công!</h2>
      <p className="text-[13px] text-slate-600">
        Đội bóng <strong className="text-slate-900">“{teamName}”</strong> đã được ghi danh vào giải đấu{" "}
        <strong className="text-slate-900">“{selected.title}”</strong> ở trạng thái{" "}
        <strong className="text-amber-700">chờ xác nhận lệ phí</strong>.
      </p>

      <div className="rounded-lg bg-slate-50 border border-slate-300 p-4 space-y-3 text-left">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <QrCode className="w-4 h-4 text-sky-700" />
          Lệ phí tham dự: <span className="font-mono text-sky-800">{formatMoney(selected.entryFee)}</span>
        </p>
        {qrUrl ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            <img
              src={qrUrl}
              alt={`QR nộp lệ phí giải ${selected.title}`}
              loading="lazy"
              className="w-44 h-44 rounded-lg border border-slate-300 bg-white object-contain shrink-0"
            />
            <div className="text-[13px] text-slate-600 space-y-1.5">
              <p>Quét mã VietQR bằng app ngân hàng để chuyển khoản lệ phí giải.</p>
              <p>
                Nội dung chuyển khoản: <strong className="font-mono text-slate-900">{teamName}</strong>
              </p>
              {selected.accountName && (
                <p>
                  Chủ tài khoản: <strong>{selected.accountName}</strong> • {selected.bankAccount}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-slate-500">
            Giải đấu chưa công bố tài khoản nhận online. Ban Tổ Chức sẽ liên hệ thu trực tiếp. Đội của bạn vẫn được giữ chỗ ở trạng thái chờ duyệt.
          </p>
        )}
        {paidAck ? (
          <p className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-[13px] font-bold text-emerald-800">
            ✓ Đã ghi nhận chuyển khoản. Ban Tổ Chức sẽ duyệt lệ phí và phân bổ vào nhánh bốc thăm.
          </p>
        ) : (
          qrUrl && (
            <button
              type="button"
              onClick={onPaidAck}
              className="w-full py-2.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-colors cursor-pointer"
            >
              Tôi Đã Chuyển Khoản Lệ Phí
            </button>
          )
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2.5 pt-1">
        <a
          href={`/?tab=tournaments&tournamentId=${selected.id}`}
          className="px-4 py-2 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-colors shadow-xs"
        >
          Theo dõi bảng đấu &amp; trạng thái đội →
        </a>
        <a
          href="/?tab=tournaments"
          className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[13px] font-bold transition-colors"
        >
          Tất cả giải đấu
        </a>
      </div>
    </div>
  );
}
