"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Shuffle, Trophy } from "lucide-react";

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
 * Hiệu ứng bốc thăm chia cặp: xáo tên liên tục rồi khóa từng cặp
 * theo thứ tự, kèm nhịp stagger. Tôn trọng prefers-reduced-motion.
 */
export default function DrawLotteryOverlay({ open, tournamentTitle, pairs, byes, onDone }: DrawLotteryOverlayProps) {
  const [shuffling, setShuffling] = useState(true);
  const [locked, setLocked] = useState(0);
  const [tick, setTick] = useState(0);
  const timers = useRef<number[]>([]);

  const pool = useMemo(() => {
    const names = [...byes];
    pairs.forEach((p) => names.push(p.teamA, p.teamB));
    return names.length ? names : ["?"];
  }, [pairs, byes]);

  useEffect(() => {
    if (!open) return;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced || pairs.length === 0) {
      setShuffling(false);
      setLocked(pairs.length);
      return;
    }
    setShuffling(true);
    setLocked(0);
    setTick(0);

    const shuffleTimer = window.setInterval(() => setTick((t) => t + 1), 80);
    timers.current.push(shuffleTimer as unknown as number);

    // Hết xáo -> khóa từng cặp so le
    const stopAt = window.setTimeout(() => {
      window.clearInterval(shuffleTimer);
      setShuffling(false);
      pairs.forEach((_, i) => {
        const t = window.setTimeout(() => setLocked(i + 1), 350 + i * 550);
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
  }, [open, pairs]);

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
        className="animate-modal-pop w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-4 sm:p-8 space-y-4 sm:space-y-5 my-auto"
      >
        <div className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <Shuffle className={`w-6 h-6 ${shuffling ? "animate-spin" : ""}`} />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {shuffling ? "Đang xáo thăm…" : done ? "Bốc thăm hoàn tất!" : "Đang khóa từng cặp…"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tournamentTitle} • {pairs.length} cặp đấu
            {byes.length > 0 && ` • ${byes.length} đội miễn vòng 1`}
          </p>
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
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 scale-[1.01]"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                }`}
              >
                <span className="font-mono text-[10px] font-black text-slate-400 w-12 shrink-0">{p.matchId}</span>
                <span className={`flex-1 text-center text-sm font-black truncate ${isLocked ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                  {shown(i * 2, p.teamA)}
                </span>
                <span className="text-[10px] font-black text-slate-400 shrink-0">VS</span>
                <span className={`flex-1 text-center text-sm font-black truncate ${isLocked ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                  {shown(i * 2 + 1, p.teamB)}
                </span>
                {isLocked ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-emerald-500 animate-spin shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Đội miễn vòng 1 */}
        {byes.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs">
            <span className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Miễn vòng 1 (hạt giống cao):
            </span>
            <span className="text-amber-900 dark:text-amber-200 font-semibold">{byes.join(" • ")}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onDone}
          disabled={!done}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-wait"
        >
          {done ? "Xem nhánh đấu chính thức" : `Đang bốc thăm… ${locked}/${pairs.length} cặp`}
        </button>
      </div>
    </div>
  );
}
