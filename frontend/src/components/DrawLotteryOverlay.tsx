"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Trophy, Volume2, VolumeX, Zap, Sparkles, RefreshCw, Shield, Play, ArrowRight, Award } from "lucide-react";

export interface DrawPair {
  matchId: string;
  teamA: string;
  teamB: string;
}

interface DrawLotteryOverlayProps {
  open: boolean;
  tournamentTitle: string;
  pairs: DrawPair[];
  byes: string[];
  onDone: () => void;
  /** true = hiển thị inline trong trang (không che popup); false = modal overlay. */
  inline?: boolean;
}

/**
 * Giao diện Lễ Bốc Thăm & Phân Nhánh Thi Đấu phong cách thể thao Turfzone:
 * - Trực quan, hiện đại, nền sáng thanh lịch với màu xanh thương hiệu (#0369a1).
 * - Sân khấu bốc thăm trung tâm hiển thị từng cặp đối đầu (Team A vs Team B) lật thẻ minh bạch.
 * - Cho phép bốc từng cặp hoặc bốc nhanh toàn bộ chỉ sau 1 click.
 * - Âm thanh chuông nhẹ nhàng tinh tế (có thể tắt/bật dễ dàng).
 * - Tuân thủ quy tắc UI: inline tại chỗ, chữ tối thiểu 13px, tiếng Việt chuẩn mực.
 */
export default function DrawLotteryOverlay({
  open,
  tournamentTitle,
  pairs,
  byes,
  onDone,
  inline = true,
}: DrawLotteryOverlayProps) {
  const [locked, setLocked] = useState(0);
  const [shuffling, setShuffling] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [revealingTeamA, setRevealingTeamA] = useState(false);
  const [revealingTeamB, setRevealingTeamB] = useState(false);

  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Khởi tạo audio context an toàn trên trình duyệt
  const getAudioCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Tiếng chuông nhẹ nhàng khi mở lá thăm
  const playCardFlipSound = useCallback(() => {
    if (!soundOnRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.12); // A5
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch {
      /* ignore audio error */
    }
  }, [getAudioCtx]);

  // Tiếng còi kết thúc lễ bốc thăm nhẹ nhàng
  const playFinishFanfare = useCallback(() => {
    if (!soundOnRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + idx * 0.1);
        gain.gain.setValueAtTime(0.0001, t + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.08, t + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + idx * 0.1);
        osc.stop(t + idx * 0.1 + 0.26);
      });
    } catch {
      /* ignore audio error */
    }
  }, [getAudioCtx]);

  const totalPairs = pairs.length;
  const isDone = locked >= totalPairs;

  // Bốc thăm nhanh toàn bộ các cặp đấu
  const handleFastDraw = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLocked(totalPairs);
    setShuffling(false);
    setRevealingTeamA(true);
    setRevealingTeamB(true);
    playFinishFanfare();
  }, [totalPairs, playFinishFanfare]);

  // Bốc cặp tiếp theo (hoặc bắt đầu bốc)
  const drawNextPair = useCallback(() => {
    if (locked >= totalPairs) return;
    setShuffling(true);
    setRevealingTeamA(false);
    setRevealingTeamB(false);

    // Mở Đội A trước
    setTimeout(() => {
      setRevealingTeamA(true);
      playCardFlipSound();
    }, 300);

    // Mở Đội B sau 700ms
    setTimeout(() => {
      setRevealingTeamB(true);
      playCardFlipSound();
      setLocked((prev) => {
        const next = prev + 1;
        if (next >= totalPairs) {
          setTimeout(playFinishFanfare, 400);
        }
        return next;
      });
      setShuffling(false);
    }, 850);
  }, [locked, totalPairs, playCardFlipSound, playFinishFanfare]);

  // Tự động mở lần đầu khi popup mở ra
  useEffect(() => {
    if (!open) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    setLocked(0);
    setShuffling(false);
    setRevealingTeamA(false);
    setRevealingTeamB(false);

    // Bắt đầu bốc thăm cặp đầu tiên sau 500ms
    timerRef.current = window.setTimeout(() => {
      drawNextPair();
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open]);

  // Cặp đấu hiện tại đang bốc
  const currentPairIdx = Math.min(locked, Math.max(0, totalPairs - 1));
  const currentPair = pairs[currentPairIdx];

  if (!open) return null;

  return (
    <div
      className={
        inline
          ? "w-full my-4 animate-fade-in"
          : "fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in overflow-y-auto"
      }
    >
      <div
        role="region"
        aria-label={`Lễ bốc thăm chia cặp ${tournamentTitle}`}
        className="w-full max-w-4xl mx-auto rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden text-slate-800"
      >
        {/* HEADER: THƯƠNG HIỆU TURFZONE */}
        <div className="bg-gradient-to-r from-sky-800 via-[#0369a1] to-sky-700 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-sm shrink-0 text-xl">
              🏆
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[12px] font-bold tracking-wide">
                  Lễ Bốc Thăm & Phân Nhánh
                </span>
                <span className="text-sky-200 text-[13px] font-semibold">
                  {totalPairs} cặp đấu R1
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                {tournamentTitle}
              </h3>
            </div>
          </div>

          {/* CÁC NÚT ĐIỀU KHIỂN HEADER */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundOn(!soundOn)}
              title={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[13px] font-bold transition-colors cursor-pointer border border-white/20"
            >
              {soundOn ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-300" />
                  <span>Âm thanh: Bật</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-300" />
                  <span>Âm thanh: Tắt</span>
                </>
              )}
            </button>

            {!isDone && (
              <button
                type="button"
                onClick={handleFastDraw}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[13px] font-extrabold shadow-sm transition-transform active:scale-95 cursor-pointer"
                title="Bốc thăm toàn bộ các cặp ngay lập tức"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Bốc Nhanh Tất Cả</span>
              </button>
            )}
          </div>
        </div>

        {/* THANH TIẾN ĐỘ BỐC THĂM */}
        <div className="bg-slate-50 px-4 sm:px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-[13px] font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0369a1] animate-pulse" />
            <span>Tiến độ bốc thăm: {locked} / {totalPairs} cặp đấu</span>
          </div>
          <div className="w-36 sm:w-48 bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalPairs > 0 ? (locked / totalPairs) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* SÂN KHẤU BỐC THĂM TRUNG TÂM (LIVE DRAW STAGE) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-sky-50/70 to-slate-50 border border-sky-200 shadow-2xs">
            <div className="text-center mb-3">
              <span className="text-[13px] font-bold text-[#0369a1] bg-sky-100/80 px-3 py-1 rounded-full border border-sky-200">
                {isDone
                  ? "🎉 Lễ bốc thăm đã hoàn tất thành công!"
                  : `Đang bốc thăm: Trận ${currentPairIdx + 1} (${currentPair?.matchId || ""})`}
              </span>
            </div>

            {/* THẺ ĐỐI ĐẦU ĐỘI A VS ĐỘI B */}
            {currentPair && (
              <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                {/* ĐỘI A */}
                <div
                  className={`sm:col-span-5 p-4 rounded-xl border transition-all duration-300 ${
                    revealingTeamA || locked > currentPairIdx
                      ? "bg-white border-sky-400 shadow-md ring-2 ring-sky-200"
                      : "bg-slate-100/80 border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 text-[#0369a1] flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                      {currentPair.teamA.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[12px] font-bold text-sky-600 block">Đội Hạt Giống A</span>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                        {revealingTeamA || locked > currentPairIdx ? currentPair.teamA : "Đang rút thăm..."}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* BIỂU TƯỢNG VS */}
                <div className="sm:col-span-1 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[13px] shadow-sm">
                    VS
                  </div>
                </div>

                {/* ĐỘI B */}
                <div
                  className={`sm:col-span-5 p-4 rounded-xl border transition-all duration-300 ${
                    revealingTeamB || locked > currentPairIdx
                      ? "bg-white border-amber-400 shadow-md ring-2 ring-amber-200"
                      : "bg-slate-100/80 border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                      {currentPair.teamB.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[12px] font-bold text-amber-700 block">Đội Đối Thủ B</span>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                        {revealingTeamB || locked > currentPairIdx ? currentPair.teamB : "Đang rút thăm..."}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NÚT THAO TÁC SÂN KHẤU */}
            {!isDone && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={drawNextPair}
                  disabled={shuffling}
                  className="px-4 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {shuffling ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang mở lá thăm…</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Bốc Cặp Tiếp Theo</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ĐỘI ĐẶC CÁCH VÒNG 1 (NẾU CÓ BYE) */}
          {byes.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[13px] flex items-center gap-2.5">
              <Award className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-900">Đội đặc cách vào thẳng vòng trong: </span>
                <span className="text-amber-800 font-semibold">{byes.join(" • ")}</span>
              </div>
            </div>
          )}

          {/* LƯỚI DANH SÁCH CÁC CẶP ĐẤU ĐÃ PHÂN NHÁNH */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                <span>Bảng Phân Cặp Thi Đấu Vòng 1</span>
                <span className="px-2 py-0.5 rounded-full text-[12px] font-bold bg-slate-100 text-slate-600">
                  {pairs.length} trận đấu
                </span>
              </h5>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
              {pairs.map((p, idx) => {
                const isPairLocked = idx < locked;
                const isCurrent = idx === locked;

                return (
                  <div
                    key={p.matchId}
                    className={`p-3 rounded-xl border transition-all ${
                      isPairLocked
                        ? "bg-emerald-50/40 border-emerald-300 shadow-2xs"
                        : isCurrent
                        ? "bg-sky-50/60 border-sky-400 ring-1 ring-sky-300"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-extrabold text-slate-600 font-mono">
                        {p.matchId}
                      </span>
                      {isPairLocked ? (
                        <span className="text-[13px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đã chốt</span>
                        </span>
                      ) : isCurrent ? (
                        <span className="text-[13px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 flex items-center gap-1 animate-pulse">
                          <span>Đang bốc…</span>
                        </span>
                      ) : (
                        <span className="text-[13px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                          Chờ lượt
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-[13px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 truncate">
                          {isPairLocked ? p.teamA : "—"}
                        </span>
                        <span className="text-[13px] font-bold text-slate-400 shrink-0">Hạt giống 1</span>
                      </div>
                      <div className="border-t border-slate-200/60 my-1" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 truncate">
                          {isPairLocked ? p.teamB : "—"}
                        </span>
                        <span className="text-[13px] font-bold text-slate-400 shrink-0">Hạt giống 2</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NÚT HOÀN TẤT VÀ XEM NHÁNH ĐẤU */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onDone}
              disabled={!isDone}
              className="w-full py-3 px-4 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-sm sm:text-base shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isDone ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Hoàn Tất Lễ Bốc Thăm & Xem Nhánh Đấu</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Đang bốc thăm trực tiếp… ({locked}/{totalPairs} cặp đấu)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
