"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Shuffle, Trophy, Volume2, VolumeX } from "lucide-react";

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
}

/**
 * Hiệu ứng bốc thăm chia cặp chuẩn "Champions League":
 *   - Quả bóng vàng quay liên tục trong lúc xáo tên
 *   - Nhạc hiệu: trống rải khi xáo, fanfare khi khóa từng cặp, fanfare lớn khi hoàn tất
 *   - Tôn trọng prefers-reduced-motion (tắt animation + âm thanh)
 */
export default function DrawLotteryOverlay({ open, tournamentTitle, pairs, byes, onDone }: DrawLotteryOverlayProps) {
 const [shuffling, setShuffling] = useState(true);
 const [locked, setLocked] = useState(0);
 const [tick, setTick] = useState(0);
 const [soundOn, setSoundOn] = useState(true);
 const timers = useRef<number[]>([]);
 const audioCtx = useRef<AudioContext | null>(null);

 const pool = useMemo(() => {
  const names = [...byes];
  pairs.forEach((p) => names.push(p.teamA, p.teamB));
  return names.length ? names : ["?"];
 }, [pairs, byes]);

 // ---- Web Audio helpers (không cần file âm thanh) ----
 const getCtx = useCallback(() => {
  if (typeof window === "undefined") return null;
  if (!audioCtx.current) {
   const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
   if (!Ctx) return null;
   audioCtx.current = new Ctx();
  }
  return audioCtx.current;
 }, []);

 const playTone = useCallback((freq: number, duration: number, gain = 0.12, type: OscillatorType = "sine", startOffset = 0) => {
  const ctx = getCtx();
  if (!ctx || !soundOn) return;
  try {
   const osc = ctx.createOscillator();
   const g = ctx.createGain();
   osc.type = type;
   osc.frequency.value = freq;
   g.gain.setValueAtTime(0.0001, ctx.currentTime + startOffset);
   g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + startOffset + 0.02);
   g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startOffset + duration);
   osc.connect(g);
   g.connect(ctx.destination);
   osc.start(ctx.currentTime + startOffset);
   osc.stop(ctx.currentTime + startOffset + duration + 0.05);
  } catch {
   /* ignore */
  }
 }, [getCtx, soundOn]);

 const playDrumRoll = useCallback(() => {
  // Trống rải nhanh trong 1.4s
  for (let i = 0; i < 28; i++) {
   playTone(90 + (i % 3) * 30, 0.06, 0.09, "triangle", i * 0.05);
  }
 }, [playTone]);

 const playLockChime = useCallback((i: number) => {
  // Fanfare ngắn khi khóa 1 cặp: do-mi-sol
  const base = 523.25; // C5
  playTone(base, 0.18, 0.13, "sine", 0);
  playTone(base * 1.2599, 0.18, 0.13, "sine", 0.12); // E5
  playTone(base * 1.4983, 0.22, 0.15, "sine", 0.24); // G5
  void i;
 }, [playTone]);

 const playFinalFanfare = useCallback(() => {
  // Fanfare lớn khi hoàn tất: C-E-G-C cao + hợp âm
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => playTone(n, 0.35, 0.16, "sine", i * 0.12));
  // Hợp âm nền
  playTone(261.63, 0.6, 0.08, "triangle", 0);
  playTone(329.63, 0.6, 0.08, "triangle", 0);
  playTone(392.0, 0.6, 0.08, "triangle", 0);
 }, [playTone]);

 useEffect(() => {
  if (!open) return;
  timers.current.forEach((t) => {
   window.clearTimeout(t);
   window.clearInterval(t);
  });
  timers.current = [];
  const reduced =
   typeof window !== "undefined" &&
   window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (reduced || pairs.length === 0) {
   setShuffling(false);
   setLocked(pairs.length);
   if (soundOn) playFinalFanfare();
   return;
  }
  setShuffling(true);
  setLocked(0);
  setTick(0);

  const shuffleTimer = window.setInterval(() => setTick((t) => t + 1), 80);
  timers.current.push(shuffleTimer as unknown as number);

  // Trống rải khi bắt đầu xáo
  if (soundOn) playDrumRoll();

  // Hết xáo -> khóa từng cặp so le
  const stopAt = window.setTimeout(() => {
   window.clearInterval(shuffleTimer);
   setShuffling(false);
   pairs.forEach((_, i) => {
    const t = window.setTimeout(() => {
     setLocked(i + 1);
     if (soundOn) playLockChime(i);
     if (i === pairs.length - 1 && soundOn) {
      // Fanfare lớn sau khi khóa cặp cuối
      window.setTimeout(playFinalFanfare, 400);
     }
    }, 350 + i * 550);
    timers.current.push(t);
   });
  }, 1500);
  timers.current.push(stopAt);
  return () => {
   timers.current.forEach((t) => {
    window.clearTimeout(t);
    window.clearInterval(t);
   });
   timers.current = [];
  };
 }, [open, pairs, soundOn, playDrumRoll, playLockChime, playFinalFanfare]);

 if (!open) return null;

 const done = !shuffling && locked >= pairs.length;
 const shown = (idx: number, real: string) => {
  if (idx < locked) return real;
  return pool[(tick * 7 + idx * 13) % pool.length];
 };

 return (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
   <div
    role="dialog"
    aria-modal="true"
    aria-label={`Bốc thăm chia cặp ${tournamentTitle}`}
    className="animate-modal-pop w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-2xl p-4 sm:p-8 space-y-4 sm:space-y-5 my-auto"
   >
    <div className="text-center space-y-1">
     {/* Quả bóng vàng quay — hiệu ứng Champions League */}
     <div className="mx-auto w-16 h-16 relative mb-1">
      <div
       className={`absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-lg border-2 border-amber-200 flex items-center justify-center ${
        shuffling ? "animate-spin" : "scale-105"
       }`}
       style={{ animationDuration: shuffling ? "0.9s" : "0s" }}
      >
       <span className="text-2xl select-none" aria-hidden>
        ⚽
       </span>
      </div>
      {/* Vòng hào quang */}
      {shuffling && (
       <div className="absolute inset-0 rounded-full border-2 border-amber-400/40 animate-ping" />
      )}
     </div>
     <h2 className="text-lg font-black text-slate-900 ">
      {shuffling ? "Đang xáo thăm…" : done ? "Bốc thăm hoàn tất!" : "Đang khóa từng cặp…"}
     </h2>
     <p className="text-xs text-slate-500">
      {tournamentTitle} • {pairs.length} cặp đấu
      {byes.length > 0 && ` • ${byes.length} đội miễn vòng 1`}
     </p>
     {/* Nút bật/tắt âm thanh */}
     <button
      type="button"
      onClick={() => setSoundOn((s) => !s)}
      aria-label={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
     >
      {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      {soundOn ? "Âm thanh: Bật" : "Âm thanh: Tắt"}
     </button>
    </div>

    {/* Cặp đang bốc */}
    <div className="space-y-2 sm:space-y-2.5 max-h-[34vh] sm:max-h-[40vh] overflow-y-auto pr-1">
     {pairs.map((p, i) => {
      const isLocked = i < locked;
      return (
       <div
        key={p.matchId}
        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 ${
         isLocked
          ? "border-[#0369a1] bg-sky-50 scale-[1.01]"
          : "border-slate-200 bg-slate-50 "
        }`}
       >
        <span className="font-mono text-[10px] font-black text-slate-500 w-12 shrink-0">{p.matchId}</span>
        <span className={`flex-1 text-center text-sm font-black truncate ${isLocked ? "text-slate-900 " : "text-slate-500"}`}>
         {shown(i * 2, p.teamA)}
        </span>
        <span className="text-[10px] font-black text-slate-500 shrink-0">VS</span>
        <span className={`flex-1 text-center text-sm font-black truncate ${isLocked ? "text-slate-900 " : "text-slate-500"}`}>
         {shown(i * 2 + 1, p.teamB)}
        </span>
        {isLocked ? (
         <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        ) : (
         <span className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-emerald-500 animate-spin shrink-0" />
        )}
       </div>
      );
     })}
    </div>

    {/* Đội miễn vòng 1 */}
    {byes.length > 0 && (
     <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
      <span className="font-black text-amber-800 flex items-center gap-1.5">
       <Trophy className="w-3.5 h-3.5" /> Miễn vòng 1 (hạt giống cao):
      </span>
      <span className="text-amber-900 font-semibold">{byes.join(" • ")}</span>
     </div>
    )}

    <button
     type="button"
     onClick={onDone}
     disabled={!done}
     className="w-full py-3 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-sm font-black transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-wait"
    >
     {done ? "Xem nhánh đấu chính thức" : `Đang bốc thăm… ${locked}/${pairs.length} cặp`}
    </button>
   </div>
  </div>
 );
}