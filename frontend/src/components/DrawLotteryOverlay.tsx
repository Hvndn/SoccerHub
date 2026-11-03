"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Trophy, Volume2, VolumeX, Zap, Sparkles, RefreshCw } from "lucide-react";

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
 * Hiệu ứng bốc thăm chia cặp chuẩn "UEFA Champions League":
 *   - Chiếc chậu pha lê hình quả bóng đặc trưng UEFA Starball Bowl
 *   - Các quả cầu bốc thăm Champions League nảy và xoay đảo chiều trong chậu
 *   - Quả cầu bay lên và tách đôi (unveiling ribbon) hé lộ tên đội bóng
 *   - Nhạc hiệu điệp khúc kinh điển UEFA Champions League Anthem hào hùng (Web Audio Brass & Strings Synthesis)
 *   - Tuân thủ quy tắc UI: inline tại chỗ, chữ tối thiểu 13px, tiếng Việt chuẩn mực
 */
export default function DrawLotteryOverlay({
  open,
  tournamentTitle,
  pairs,
  byes,
  onDone,
  inline = true,
}: DrawLotteryOverlayProps) {
  const [shuffling, setShuffling] = useState(true);
  const [locked, setLocked] = useState(0);
  const [tick, setTick] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [currentDrawnTeam, setCurrentDrawnTeam] = useState<string | null>(null);
  const [sphereOpening, setSphereOpening] = useState(false);

  const soundOnRef = useRef(soundOn);
  const timers = useRef<number[]>([]);
  const pairsRef = useRef(pairs);
  pairsRef.current = pairs;
  const audioCtx = useRef<AudioContext | null>(null);
  const activeNodes = useRef<Array<{ osc?: OscillatorNode; gain?: GainNode }>>([]);

  useEffect(() => {
    soundOnRef.current = soundOn;
    if (!soundOn) {
      stopAllAudio();
    }
  }, [soundOn]);

  const pool = useMemo(() => {
    const names = [...byes];
    pairs.forEach((p) => names.push(p.teamA, p.teamB));
    return names.length ? names : ["Đội hạt giống"];
  }, [pairs, byes]);

  // =========================================================================
  //  WEB AUDIO SYNTHESIZER: UEFA CHAMPIONS LEAGUE ANTHEM & SOUND EFFECTS
  // =========================================================================

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtx.current || audioCtx.current.state === "closed") {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      audioCtx.current = new Ctx();
    }
    if (audioCtx.current.state === "suspended") {
      audioCtx.current.resume().catch(() => {});
    }
    return audioCtx.current;
  }, []);

  const stopAllAudio = useCallback(() => {
    activeNodes.current.forEach(({ osc, gain }) => {
      try {
        if (gain) gain.gain.setValueAtTime(0.0001, 0);
        if (osc) osc.stop();
      } catch {
        /* ignore */
      }
    });
    activeNodes.current = [];
  }, []);

  // Phát một nốt nhạc phong cách dàn nhạc giao hưởng (Brass / String)
  const playOrchestralTone = useCallback(
    (
      freq: number,
      duration: number,
      gain = 0.1,
      type: OscillatorType = "sawtooth",
      startOffset = 0,
      detune = 0
    ) => {
      const ctx = getCtx();
      if (!ctx || !soundOnRef.current) return;

      try {
        const osc = ctx.createOscillator();
        const oscDetune = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();

        const startTime = ctx.currentTime + startOffset;
        const stopTime = startTime + duration;

        // Bộ lọc mô phỏng nhạc cụ dây và kèn đồng Champions League
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1600, startTime);
        filter.frequency.exponentialRampToValueAtTime(3200, startTime + 0.1);
        filter.frequency.exponentialRampToValueAtTime(800, stopTime);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        if (detune) osc.detune.setValueAtTime(detune, startTime);

        // Nốt bè thứ hai tạo độ dày hợp xướng
        oscDetune.type = "triangle";
        oscDetune.frequency.setValueAtTime(freq, startTime);
        oscDetune.detune.setValueAtTime(7, startTime);

        g.gain.setValueAtTime(0.0001, startTime);
        g.gain.linearRampToValueAtTime(gain, startTime + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, stopTime);

        osc.connect(filter);
        oscDetune.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);

        osc.start(startTime);
        oscDetune.start(startTime);
        osc.stop(stopTime + 0.05);
        oscDetune.stop(stopTime + 0.05);

        activeNodes.current.push({ osc, gain: g });
      } catch {
        /* ignore */
      }
    },
    [getCtx]
  );

  // Hiệu ứng âm thanh khi rút quả bóng và mở quả cầu
  const playBallDrawSound = useCallback(() => {
    const ctx = getCtx();
    if (!ctx || !soundOnRef.current) return;
    try {
      const startTime = ctx.currentTime;
      // Âm thanh whoosh khi bóng bay lên
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, startTime);
      osc.frequency.exponentialRampToValueAtTime(660, startTime + 0.22);
      g.gain.setValueAtTime(0.01, startTime);
      g.gain.linearRampToValueAtTime(0.12, startTime + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.26);

      // Âm thanh "pop" tách đôi quả cầu
      const popOsc = ctx.createOscillator();
      const popG = ctx.createGain();
      popOsc.type = "triangle";
      popOsc.frequency.setValueAtTime(520, startTime + 0.22);
      popOsc.frequency.exponentialRampToValueAtTime(140, startTime + 0.35);
      popG.gain.setValueAtTime(0.14, startTime + 0.22);
      popG.gain.exponentialRampToValueAtTime(0.001, startTime + 0.38);
      popOsc.connect(popG);
      popG.connect(ctx.destination);
      popOsc.start(startTime + 0.22);
      popOsc.stop(startTime + 0.4);
    } catch {
      /* ignore */
    }
  }, [getCtx]);

  // Nhạc hiệu kinh điển: Điệp khúc UEFA Champions League Anthem
  // Giai điệu: Handel's Zadok the Priest - "Die Meister! Die Besten! Les grandes équipes! The Champions!"
  const playChampionsLeagueAnthem = useCallback(() => {
    if (!soundOnRef.current) return;

    // 1. Dàn đàn dây rải dồn dập mở màn (Baroque Arpeggios)
    const arpeggioNotes = [
      261.63, 329.63, 392.0, 523.25, 659.25, 783.99, // C4 - E4 - G4 - C5 - E5 - G5
      293.66, 349.23, 440.0, 587.33, 698.46, 880.0, // D4 - F4 - A4 - D5 - F5 - A5
      261.63, 329.63, 392.0, 523.25, 659.25, 1046.5, // C4 - E4 - G4 - C5 - E5 - C6
    ];
    arpeggioNotes.forEach((n, idx) => {
      playOrchestralTone(n, 0.12, 0.05, "sawtooth", idx * 0.065);
    });

    // 2. Điệp khúc kèn đồng & hợp xướng oai nghiêm
    // "Die Meister!"
    const tMeister = 1.35;
    playOrchestralTone(523.25, 0.45, 0.15, "sawtooth", tMeister); // C5
    playOrchestralTone(659.25, 0.45, 0.15, "sawtooth", tMeister + 0.25); // E5
    playOrchestralTone(783.99, 0.55, 0.18, "sawtooth", tMeister + 0.5); // G5
    playOrchestralTone(261.63, 0.9, 0.1, "triangle", tMeister); // Bass C3

    // "Die Besten!"
    const tBesten = tMeister + 1.15;
    playOrchestralTone(587.33, 0.45, 0.15, "sawtooth", tBesten); // D5
    playOrchestralTone(698.46, 0.45, 0.15, "sawtooth", tBesten + 0.25); // F5
    playOrchestralTone(880.0, 0.55, 0.18, "sawtooth", tBesten + 0.5); // A5
    playOrchestralTone(293.66, 0.9, 0.1, "triangle", tBesten); // Bass D3

    // "Les grandes équipes!"
    const tEquipes = tBesten + 1.15;
    playOrchestralTone(783.99, 0.3, 0.14, "sawtooth", tEquipes); // G5
    playOrchestralTone(698.46, 0.3, 0.14, "sawtooth", tEquipes + 0.2); // F5
    playOrchestralTone(659.25, 0.3, 0.14, "sawtooth", tEquipes + 0.4); // E5
    playOrchestralTone(587.33, 0.3, 0.14, "sawtooth", tEquipes + 0.6); // D5

    // "THE CHAMPIONS!" — Cao trào đỉnh điểm vang vọng
    const tChampions = tEquipes + 0.95;
    // Chùm hợp âm C Major Fortissimo
    playOrchestralTone(1046.5, 1.6, 0.22, "sawtooth", tChampions); // C6
    playOrchestralTone(783.99, 1.6, 0.18, "sawtooth", tChampions); // G5
    playOrchestralTone(659.25, 1.6, 0.16, "sawtooth", tChampions); // E5
    playOrchestralTone(523.25, 1.6, 0.18, "sawtooth", tChampions); // C5
    playOrchestralTone(130.81, 1.8, 0.18, "triangle", tChampions); // Sub-bass C2
  }, [playOrchestralTone]);

  // Fanfare ngắn khi hoàn thành một cặp đấu
  const playPairLockFanfare = useCallback(
    (index: number) => {
      if (!soundOnRef.current) return;
      playBallDrawSound();
      const base = 440; // A4
      const notes = [base, base * 1.25, base * 1.5];
      notes.forEach((freq, idx) => {
        playOrchestralTone(freq, 0.25, 0.11, "triangle", 0.2 + idx * 0.12);
      });
      void index;
    },
    [playBallDrawSound, playOrchestralTone]
  );

  // =========================================================================
  //  LIFECYCLE & SEQUENCE BỐC THĂM
  // =========================================================================

  const skipDraw = useCallback(() => {
    timers.current.forEach((t) => {
      window.clearTimeout(t);
      window.clearInterval(t);
    });
    timers.current = [];
    setShuffling(false);
    setLocked(pairs.length);
    setCurrentDrawnTeam(null);
    setSphereOpening(false);
    if (soundOnRef.current) {
      playChampionsLeagueAnthem();
    }
  }, [pairs.length, playChampionsLeagueAnthem]);

  useEffect(() => {
    if (!open) {
      stopAllAudio();
      return;
    }

    timers.current.forEach((t) => {
      window.clearTimeout(t);
      window.clearInterval(t);
    });
    timers.current = [];
    stopAllAudio();

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced || pairsRef.current.length === 0) {
      setShuffling(false);
      setLocked(pairs.length);
      if (soundOnRef.current) playChampionsLeagueAnthem();
      return;
    }

    setShuffling(true);
    setLocked(0);
    setTick(0);
    setCurrentDrawnTeam(null);
    setSphereOpening(false);

    // Bắt đầu phát nhạc hiệu Champions League khi mở bốc thăm
    if (soundOnRef.current) {
      playChampionsLeagueAnthem();
    }

    // Nhịp quay xáo bóng trong chậu pha lê (mỗi 65ms)
    const shuffleTimer = window.setInterval(() => setTick((t) => t + 1), 65);
    timers.current.push(shuffleTimer as unknown as number);

    // Sau giai đoạn xáo bóng mở màn -> bắt đầu rút từng quả bóng
    const startDrawingTimeout = window.setTimeout(() => {
      window.clearInterval(shuffleTimer);
      setShuffling(false);

      const totalPairs = pairsRef.current.length;
      pairsRef.current.forEach((pair, pairIdx) => {
        // Rút bóng Đội A
        const t1 = window.setTimeout(() => {
          setCurrentDrawnTeam(pair.teamA);
          setSphereOpening(true);
          playBallDrawSound();
        }, pairIdx * 1400 + 100);
        timers.current.push(t1);

        // Rút bóng Đội B và chốt cặp
        const t2 = window.setTimeout(() => {
          setCurrentDrawnTeam(pair.teamB);
          setSphereOpening(true);
          playPairLockFanfare(pairIdx);
          setLocked(pairIdx + 1);
        }, pairIdx * 1400 + 750);
        timers.current.push(t2);

        // Kết thúc cặp
        const t3 = window.setTimeout(() => {
          setSphereOpening(false);
          if (pairIdx === totalPairs - 1) {
            setCurrentDrawnTeam(null);
          }
        }, pairIdx * 1400 + 1200);
        timers.current.push(t3);
      });
    }, 2000);

    timers.current.push(startDrawingTimeout);

    return () => {
      timers.current.forEach((t) => {
        window.clearTimeout(t);
        window.clearInterval(t);
      });
      timers.current = [];
      stopAllAudio();
    };
  }, [open, pairs.length, playChampionsLeagueAnthem, playBallDrawSound, playPairLockFanfare, stopAllAudio]);

  // =========================================================================
  //  VỊ TRÍ CÁC QUẢ BÓNG TRONG CHẬU PHA LÊ HÌNH QUẢ CẦU
  // =========================================================================

  const bowlBalls = useMemo(() => {
    const count = Math.max(6, Math.min(pool.length, 16));
    return Array.from({ length: count }, (_, i) => {
      const angle = ((tick * 11 + i * (360 / count)) % 360) * (Math.PI / 180);
      const wobble = Math.sin(tick * 0.2 + i) * 12;
      const radiusX = 38 + (i % 3) * 6;
      const radiusY = 28 + (i % 2) * 5;
      const x = 50 + Math.cos(angle) * radiusX;
      const y = 52 + Math.sin(angle) * radiusY + wobble;
      const rot = (tick * 14 + i * 45) % 360;
      return { x, y, rot };
    });
  }, [pool.length, tick]);

  if (!open) return null;

  const done = !shuffling && locked >= pairs.length;

  return (
    <div
      className={
        inline
          ? "w-full animate-fade-in my-3"
          : "fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      }
    >
      <div
        role="region"
        aria-label={`Lễ bốc thăm chia cặp ${tournamentTitle}`}
        className={
          inline
            ? "w-full rounded-3xl bg-gradient-to-b from-slate-900 via-sky-950 to-slate-900 text-white border-2 border-sky-400/30 shadow-2xl p-4 sm:p-7 space-y-5 relative overflow-hidden"
            : "w-full max-w-2xl rounded-3xl bg-gradient-to-b from-slate-900 via-sky-950 to-slate-900 text-white border-2 border-sky-400/30 shadow-2xl p-4 sm:p-8 space-y-5 my-auto relative overflow-hidden"
        }
      >
        {/* Ánh sáng sao nền UEFA Champions League Atmosphere */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER: UEFA CHAMPIONS LEAGUE DRAW CEREMONY BANNER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-sky-800/40 pb-4 relative z-10">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0 text-2xl">
              🏆
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 font-black text-[14px] tracking-wider">
                  ⭐ LỄ BỐC THĂM CHIA CẶP CHAMPIONS LEAGUE
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                {tournamentTitle}
              </h3>
            </div>
          </div>

          {/* BẬT / TẮT NHẠC HIỆU & NÚT BỎ QUA */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextState = !soundOn;
                setSoundOn(nextState);
                if (nextState) {
                  playChampionsLeagueAnthem();
                }
              }}
              title={soundOn ? "Tắt nhạc hiệu Champions League" : "Bật nhạc hiệu Champions League"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-sky-200 border border-sky-500/30 text-[14px] font-bold transition-all shadow-sm active:scale-95"
            >
              {soundOn ? (
                <>
                  <Volume2 className="w-4 h-4 text-sky-400 animate-pulse" />
                  <span>Nhạc hiệu: Bật</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span>Nhạc hiệu: Tắt</span>
                </>
              )}
            </button>

            {!done && (
              <button
                type="button"
                onClick={skipDraw}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[14px] transition-all shadow-md active:scale-95"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Xem nhanh kết quả</span>
              </button>
            )}
          </div>
        </div>

        {/* ===== KHU VỰC TRUNG TÂM: CHIẾC CHẬU THỦY TINH HÌNH QUẢ BÓNG & QUẢ CẦU RÚT THĂM ===== */}
        <div className="relative mx-auto w-full max-w-[420px] py-2 flex flex-col items-center justify-center select-none z-10">
          {/* QUẢ CẦU BAY LÊN TÁCH ĐÔI KHI RÚT TÊN ĐỘI */}
          {currentDrawnTeam && (
            <div className="absolute top-0 z-30 flex flex-col items-center animate-bounce">
              <div className="relative flex items-center justify-center">
                {/* Quả bóng bốc thăm tách đôi màu bạc pha ánh vàng */}
                <div
                  className={`w-14 h-14 rounded-full bg-gradient-to-tr from-slate-200 via-white to-amber-200 border-2 border-amber-300 shadow-2xl flex items-center justify-center text-xl transition-all duration-300 ${
                    sphereOpening ? "scale-110 ring-4 ring-amber-400/50" : ""
                  }`}
                >
                  ⭐
                </div>
              </div>
              {/* Dải ruy băng mở ra hiển thị tên đội bóng vừa rút */}
              <div className="mt-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm sm:text-base shadow-xl border border-amber-200 animate-fade-in-up">
                ⚽ {currentDrawnTeam}
              </div>
            </div>
          )}

          {/* CHIẾC CHẬU PHA LÊ HÌNH QUẢ BÓNG (CHAMPIONS LEAGUE GLASS BOWL) */}
          <div className="relative w-[280px] sm:w-[320px] h-[180px] sm:h-[200px] mt-6">
            {/* Hào quang phát sáng sau chậu */}
            <div className="absolute inset-x-8 bottom-4 h-[130px] rounded-b-[100px] bg-sky-400/20 blur-xl pointer-events-none" />

            {/* CÁC QUẢ BÓNG BỐC THĂM LĂN XÁO BÊN TRONG CHẬU */}
            <div className="absolute inset-x-6 bottom-[34px] h-[115px] sm:h-[130px] overflow-hidden rounded-b-[90px]">
              {bowlBalls.map((b, i) => (
                <div
                  key={i}
                  className="absolute w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform duration-100 ease-out"
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    transform: `translate(-50%, -50%) rotate(${b.rot}deg)`,
                    background:
                      i % 2 === 0
                        ? "radial-gradient(circle at 30% 30%, #ffffff 0%, #cbd5e1 55%, #475569 100%)"
                        : "radial-gradient(circle at 30% 30%, #fef08a 0%, #facc15 60%, #a16207 100%)",
                    border: "1.5px solid rgba(255, 255, 255, 0.7)",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  {/* Ngôi sao đặc trưng Champions League */}
                  <span className="text-[14px] font-black leading-none opacity-80 text-sky-950">
                    ★
                  </span>
                </div>
              ))}
            </div>

            {/* THÂN BÁT THỦY TINH PHA LÊ HÌNH BÁN CẦU QUẢ BÓNG */}
            <div className="absolute inset-x-0 bottom-3 h-[140px] sm:h-[155px] rounded-b-[140px] rounded-t-[20px] bg-gradient-to-b from-sky-400/25 via-sky-600/15 to-slate-900/60 backdrop-blur-md border-2 border-sky-300/40 shadow-2xl pointer-events-none overflow-hidden">
              {/* Đường vân hoa văn quả bóng Champions League trên thân chậu thủy tinh */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute top-2 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              {/* Phản chiếu ánh sáng vệt pha lê */}
              <div className="absolute top-4 left-4 w-12 h-20 bg-gradient-to-br from-white/30 to-transparent rounded-full -rotate-12 blur-xs" />
            </div>

            {/* MIỆNG CHẬU PHA LÊ (ELIPSE VIỀN BẠC ÁNH KIM) */}
            <div className="absolute inset-x-[-2px] bottom-[136px] sm:bottom-[152px] h-[36px] rounded-[50%] bg-gradient-to-b from-white/40 via-sky-500/20 to-sky-900/60 border-2 border-sky-200/60 shadow-lg pointer-events-none" />

            {/* CHÂN ĐẾ BỤC MẠ KIM LOẠI CỦA CHẬU */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[52%] h-[18px] rounded-full bg-gradient-to-b from-slate-300 via-sky-800 to-slate-900 border border-sky-400/40 shadow-xl" />

            {/* THÔNG BÁO HOÀN TẤT BÓNG TRONG CHẬU */}
            {done && (
              <div className="absolute inset-x-0 bottom-[65px] text-center z-20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[14px] shadow-lg animate-fade-in-up">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Đã bốc đủ {pairs.length} cặp đấu
                </span>
              </div>
            )}
          </div>

          <div className="text-center mt-3 space-y-1">
            <h4 className="text-base sm:text-lg font-black text-sky-200">
              {shuffling
                ? "Đang hòa trộn các quả bóng trong chậu pha lê Champions League…"
                : done
                ? "Lễ bốc thăm đã hoàn tất thành công!"
                : `Đang rút thăm lượt trận thứ ${locked + 1} / ${pairs.length}…`}
            </h4>
            <p className="text-[14px] text-sky-300/80">
              {pairs.length} cặp đấu thi đấu chính thức
              {byes.length > 0 && ` • ${byes.length} đội miễn vòng đầu (hạt giống)`}
            </p>
          </div>
        </div>

        {/* ===== DANH SÁCH CÁC CẶP ĐẤU ĐƯỢC BỐC THĂM TRỰC TIẾP ===== */}
        <div className="space-y-2.5 max-h-[300px] sm:max-h-[340px] overflow-y-auto pr-1">
          {pairs.map((p, i) => {
            const isLocked = i < locked;
            return (
              <div
                key={p.matchId}
                className={`flex items-center gap-2 p-3 sm:p-3.5 rounded-2xl border-2 transition-all duration-300 ${
                  isLocked
                    ? "border-sky-400/80 bg-sky-950/70 shadow-md shadow-sky-900/40 scale-[1.01]"
                    : "border-slate-800 bg-slate-900/50 opacity-60"
                }`}
              >
                <span className="font-mono text-[14px] font-black text-sky-400 w-14 shrink-0">
                  {p.matchId}
                </span>

                <div className="flex-1 text-center font-bold text-sm sm:text-base truncate">
                  {isLocked ? (
                    <span className="text-white font-black">{p.teamA}</span>
                  ) : (
                    <span className="text-slate-400 font-mono">
                      {pool[(tick * 5 + i * 7) % pool.length]}
                    </span>
                  )}
                </div>

                <div className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-black text-[14px] shrink-0 border border-sky-400/30">
                  VS
                </div>

                <div className="flex-1 text-center font-bold text-sm sm:text-base truncate">
                  {isLocked ? (
                    <span className="text-white font-black">{p.teamB}</span>
                  ) : (
                    <span className="text-slate-400 font-mono">
                      {pool[(tick * 11 + i * 13) % pool.length]}
                    </span>
                  )}
                </div>

                <div className="w-8 flex items-center justify-center shrink-0">
                  {isLocked ? (
                    <span className="text-xl leading-none animate-bounce" aria-hidden>
                      ⚽
                    </span>
                  ) : (
                    <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ĐỘI ĐẶC CÁCH VÒNG 1 (NẾU CÓ) */}
        {byes.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-[14px] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-black text-amber-300">Đội miễn thi đấu vòng 1: </span>
              <span className="text-amber-100 font-semibold">{byes.join(" • ")}</span>
            </div>
          </div>
        )}

        {/* NÚT HOÀN TẤT XEM CÂY NHÁNH ĐẤU */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onDone}
            disabled={!done}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-[#0369a1] to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-xl shadow-sky-600/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {done ? (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Xem Nhánh Đấu & Lịch Thi Đấu Chính Thức</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>
                  Đang bốc thăm trực tiếp… ({locked}/{pairs.length} cặp đấu)
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
