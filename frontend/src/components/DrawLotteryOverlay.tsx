"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Trophy,
  Shuffle,
  Play,
  CheckCircle2,
  Volume2,
  VolumeX,
  Music,
  Zap,
  Sparkles,
  Layers,
  Award,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  X,
} from "lucide-react";

interface DrawPair {
  matchId: string;
  teamA: string;
  teamB: string;
}

interface DrawTeamMeta {
  teamName: string;
  seed?: number | null;
  form?: string | null;
  winRate?: number | null;
  played?: number | null;
}

interface DrawLotteryOverlayProps {
  open: boolean;
  tournamentTitle: string;
  pairs: DrawPair[];
  byes?: string[];
  onDone: () => void;
  inline?: boolean;
  format?: string;
  teams?: DrawTeamMeta[];
}

/**
 * GIAO DIỆN LỄ BỐC THĂM & PHÂN NHÁNH THỂ THAO TURFZONE:
 * - Đồng bộ 100% Brand Identity Turfzone (Ocean Blue #0369a1, Navy #0b4f6c, Amber & Sky).
 * - Sân khấu ánh sáng thể thao rực rỡ, rổ bóng thủy tinh pha lê trong suốt.
 * - Hỗ trợ cả Cặp Đấu Loại Trực Tiếp (Knockout) lẫn Chia Bảng Đấu (Group Stage).
 * - Tuân thủ quy chuẩn UI: hiển thị Inline tại chỗ, font >= 13px, thuần tiếng Việt chuẩn hóa.
 */
export default function DrawLotteryOverlay({
  open,
  tournamentTitle,
  pairs,
  byes = [],
  onDone,
  inline = true,
  format = "KNOCKOUT",
  teams = [],
}: DrawLotteryOverlayProps) {
  // Chế độ xem: "PAIRS" (Cặp đấu loại trực tiếp) hoặc "GROUPS" (Chia các bảng đấu)
  const isRoundRobin = format === "ROUND_ROBIN";
  const [viewMode, setViewMode] = useState<"PAIRS" | "GROUPS">(isRoundRobin ? "GROUPS" : "PAIRS");
    // Đối với giải loại trực tiếp, luôn cố định chế độ PAIRS
    const effectiveViewMode = isRoundRobin ? viewMode : "PAIRS";

  const [lockedPairs, setLockedPairs] = useState(0);
  const [isSwirling, setIsSwirling] = useState(false);
  const [isBallRising, setIsBallRising] = useState(false);
  const [isBallOpened, setIsBallOpened] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  // Âm thanh
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;
  const musicOnRef = useRef(musicOn);
  musicOnRef.current = musicOn;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const musicIntervalRef = useRef<number | null>(null);
  const autoPlayTimerRef = useRef<number | null>(null);

  // Danh sách toàn bộ các đội tham gia bốc thăm
  const allDrawTeams = useMemo(() => {
    const list: string[] = [];
    pairs.forEach((p) => {
      if (p.teamA && !list.includes(p.teamA)) list.push(p.teamA);
      if (p.teamB && !list.includes(p.teamB)) list.push(p.teamB);
    });
    byes.forEach((b) => {
      if (b && !list.includes(b)) list.push(b);
    });
    if (list.length === 0 && teams && teams.length > 0) {
      teams.forEach((t) => {
        if (t.teamName && !list.includes(t.teamName)) list.push(t.teamName);
      });
    }
    return list;
  }, [pairs, byes, teams]);

  // Phân chia bảng đấu
  const groupCount = useMemo(() => {
    const count = allDrawTeams.length;
    if (count <= 4) return 1;
    if (count <= 8) return 2;
    if (count <= 16) return 4;
    return 4;
  }, [allDrawTeams.length]);

  const groupLabels = ["Bảng A", "Bảng B", "Bảng C", "Bảng D"];

  // Danh sách các đội đã bốc thăm vào từng bảng
  const drawnGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (let i = 0; i < groupCount; i++) {
      groups[groupLabels[i]] = [];
    }
    const totalDrawnTeams = Math.min(lockedPairs * 2, allDrawTeams.length);
    for (let i = 0; i < totalDrawnTeams; i++) {
      const gIdx = i % groupCount;
      groups[groupLabels[gIdx]].push(allDrawTeams[i]);
    }
    return groups;
  }, [groupCount, lockedPairs, allDrawTeams]);

  // Metadata đội bóng
  const getTeamMeta = useCallback(
    (name?: string) => {
      if (!name) return null;
      return teams?.find((t) => t.teamName.toLowerCase() === name.toLowerCase()) ?? null;
    },
    [teams]
  );

  // Khởi tạo audio context
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

  // 1. NHẠC HIỆU KHAI MẠC LỄ BỐC THĂM SYNTHESIZER
  const playChampionsLeagueAnthem = useCallback(() => {
    if (!musicOnRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.08, now + 0.3);
      masterGain.connect(ctx.destination);
      musicGainRef.current = masterGain;

      // Phase 1: Strings Arpeggio
      const arpNotes = [
        349.23, 440.0, 523.25, 698.46, 523.25, 440.0,
        392.0, 466.16, 587.33, 783.99, 587.33, 466.16,
        440.0, 554.37, 659.25, 880.0, 659.25, 554.37,
        523.25, 659.25, 783.99, 1046.5, 783.99, 659.25,
      ];

      arpNotes.forEach((freq, idx) => {
        const t = now + idx * 0.11;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, t);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1400, t);

        noteGain.gain.setValueAtTime(0.001, t);
        noteGain.gain.linearRampToValueAtTime(0.035, t + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(t);
        osc.stop(t + 0.14);
      });

      // Phase 2: Điệp khúc tráng lệ
      const chorusTime = now + arpNotes.length * 0.11 + 0.15;
      const brassChords = [
        { f: [349.23, 440.0, 523.25], dur: 0.45, delay: 0 },
        { f: [392.0, 466.16, 587.33], dur: 0.45, delay: 0.5 },
        { f: [440.0, 523.25, 659.25], dur: 0.5, delay: 1.0 },
        { f: [466.16, 587.33, 698.46], dur: 0.55, delay: 1.55 },
        { f: [349.23, 523.25, 698.46, 1046.5], dur: 1.5, delay: 2.2 },
      ];

      brassChords.forEach((chord) => {
        const cTime = chorusTime + chord.delay;
        chord.f.forEach((freq) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, cTime);

          g.gain.setValueAtTime(0.001, cTime);
          g.gain.linearRampToValueAtTime(0.06, cTime + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, cTime + chord.dur);

          osc.connect(g);
          g.connect(masterGain);
          osc.start(cTime);
          osc.stop(cTime + chord.dur + 0.05);
        });
      });

      // Trống Timpani
      [0, 0.5, 1.0, 1.55, 2.2].forEach((offset) => {
        const drumTime = chorusTime + offset;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(110, drumTime);
        osc.frequency.exponentialRampToValueAtTime(55, drumTime + 0.35);

        g.gain.setValueAtTime(0.08, drumTime);
        g.gain.exponentialRampToValueAtTime(0.0001, drumTime + 0.4);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(drumTime);
        osc.stop(drumTime + 0.42);
      });
    } catch {
      /* ignore audio error */
    }
  }, [getAudioCtx]);

  // 2. Âm thanh quả bóng xoay trong rổ thủy tinh
  const playSwirlSound = useCallback(() => {
    if (!soundOnRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 7; i++) {
        const t = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600 + (i % 3) * 180, t);
        osc.frequency.exponentialRampToValueAtTime(350, t + 0.09);

        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.09);
      }
    } catch {}
  }, [getAudioCtx]);

  // 3. Âm thanh quả bóng thủy tinh mở ra
  const playPopOpenSound = useCallback(() => {
    if (!soundOnRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }, [getAudioCtx]);

  // 4. Âm thanh kèn chiến thắng / hoàn tất
  const playFanfareSound = useCallback(() => {
    if (!soundOnRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.15;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.65);
      });
    } catch {}
  }, [getAudioCtx]);

  // Khởi động nhạc hiệu khi mở rổ bóng
  useEffect(() => {
    if (!open) {
      if (musicIntervalRef.current) {
        window.clearInterval(musicIntervalRef.current);
        musicIntervalRef.current = null;
      }
      return;
    }

    setLockedPairs(0);
    setIsSwirling(false);
    setIsBallRising(false);
    setIsBallOpened(false);
    setAutoPlay(false);

    const timer = setTimeout(() => {
      playChampionsLeagueAnthem();
    }, 400);

    musicIntervalRef.current = window.setInterval(() => {
      if (musicOnRef.current) {
        playChampionsLeagueAnthem();
      }
    }, 15000);

    return () => {
      clearTimeout(timer);
      if (musicIntervalRef.current) {
        window.clearInterval(musicIntervalRef.current);
        musicIntervalRef.current = null;
      }
    };
  }, [open, playChampionsLeagueAnthem]);

  const totalPairs = pairs.length;
  const isDone = lockedPairs >= totalPairs;
  const currentPairIdx = Math.min(lockedPairs, Math.max(0, totalPairs - 1));
  const currentPair = pairs[currentPairIdx];

  // Bốc một cặp đấu tiếp theo
  const drawNextPair = useCallback(() => {
    if (lockedPairs >= totalPairs || isSwirling) return;

    setIsSwirling(true);
    setIsBallRising(false);
    setIsBallOpened(false);
    playSwirlSound();

    setTimeout(() => {
      setIsSwirling(false);
      setIsBallRising(true);
      playPopOpenSound();

      setTimeout(() => {
        setIsBallOpened(true);

        setTimeout(() => {
          setLockedPairs((prev) => {
            const next = prev + 1;
            if (next >= totalPairs) {
              playFanfareSound();
              setAutoPlay(false);
            }
            return next;
          });
          setIsBallRising(false);
          setIsBallOpened(false);
        }, 1800);
      }, 500);
    }, 1000);
  }, [lockedPairs, totalPairs, isSwirling, playSwirlSound, playPopOpenSound, playFanfareSound]);

  // Bốc thăm nhanh tất cả
  const handleFastDraw = useCallback(() => {
    setAutoPlay(false);
    setLockedPairs(totalPairs);
    setIsSwirling(false);
    setIsBallRising(false);
    setIsBallOpened(false);
    playFanfareSound();
  }, [totalPairs, playFanfareSound]);

  // Auto-play timer
  useEffect(() => {
    if (autoPlay && !isDone && !isSwirling) {
      autoPlayTimerRef.current = window.setTimeout(() => {
        drawNextPair();
      }, 1600);
    }
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [autoPlay, isDone, isSwirling, lockedPairs, drawNextPair]);

  if (!open) return null;

  return (
    <div
      id="draw-lottery-stage"
      className={
        inline
          ? "w-full my-4 animate-fade-in"
          : "fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      }
    >
      <div
        role="region"
        aria-label={`Lễ bốc thăm phân nhánh ${tournamentTitle}`}
        className="w-full max-w-5xl mx-auto rounded-3xl bg-white border-2 border-sky-200 shadow-2xl overflow-hidden text-slate-800"
      >
        {/* ================= HEADER: BRAND BANNER TURFZONE ================= */}
        <div className="bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#0b4f6c] text-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md relative overflow-hidden">
          {/* Họa tiết trang trí nền */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:16px_16px]" />

          <div className="flex items-center gap-3 relative z-10 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner shrink-0 text-2xl">
              🏆
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[12px] font-extrabold tracking-wide border border-white/20">
                  Lễ Bốc Thăm Chính Thức
                </span>
                <span className="text-sky-100 text-[13px] font-semibold">
                  {totalPairs} Cặp Đấu • {groupCount} Bảng Đấu
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-white mt-0.5 drop-shadow-xs">
                {tournamentTitle}
              </h3>
            </div>
          </div>

          {/* CÁC NÚT ĐIỀU KHIỂN ÂM THANH & BỐC NHANH */}
          <div className="flex items-center gap-2 relative z-10 flex-wrap justify-center">
            {/* Nút Nhạc Hiệu */}
            <button
              type="button"
              onClick={() => {
                if (musicOn) {
                  setMusicOn(false);
                } else {
                  setMusicOn(true);
                  playChampionsLeagueAnthem();
                }
              }}
              title={musicOn ? "Tắt Nhạc Hiệu" : "Bật Nhạc Hiệu"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer border ${
                musicOn
                  ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                  : "bg-white/15 text-white/90 border-white/20 hover:bg-white/25"
              }`}
            >
              <Music className={`w-3.5 h-3.5 ${musicOn ? "animate-bounce" : ""}`} />
              <span>{musicOn ? "Nhạc: Bật" : "Nhạc: Tắt"}</span>
            </button>

            {/* Nút Bật/Tắt SFX */}
            <button
              type="button"
              onClick={() => setSoundOn(!soundOn)}
              title={soundOn ? "Tắt hiệu ứng âm thanh" : "Bật hiệu ứng âm thanh"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[13px] font-bold transition-colors cursor-pointer border border-white/20"
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[13px] font-black shadow-md transition-transform active:scale-95 cursor-pointer"
                title="Bốc toàn bộ các cặp và bảng đấu ngay lập tức"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Bốc Nhanh Tất Cả</span>
              </button>
            )}
          </div>
        </div>

        {/* THANH TAB CHUYỂN ĐỔI CHẾ ĐỘ: CẶP ĐẤU vs BẢNG ĐẤU */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Thể thức bốc thăm:</span>
            {isRoundRobin ? (
              <div className="inline-flex p-0.5 rounded-xl bg-slate-200/80 border border-slate-300">
                <button
                  type="button"
                  onClick={() => setViewMode("PAIRS")}
                  className={`px-3.5 py-1 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                    effectiveViewMode === "PAIRS"
                      ? "bg-white text-[#0369a1] shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cặp Đấu ({totalPairs} trận)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("GROUPS")}
                  className={`px-3.5 py-1 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                    effectiveViewMode === "GROUPS"
                      ? "bg-white text-[#0369a1] shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Chia Bảng Đấu ({groupCount} bảng)
                </button>
              </div>
            ) : (
              <span className="px-3.5 py-1 rounded-lg bg-sky-100 text-[#0369a1] font-black text-[13px] border border-sky-200 flex items-center gap-1.5 shadow-2xs">
                <Trophy className="w-3.5 h-3.5" />
                <span>Cặp Đấu Loại Trực Tiếp ({totalPairs} trận Knockout)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-600 font-bold">
              Tiến độ: <strong className="text-[#0369a1] font-black">{lockedPairs} / {totalPairs}</strong>
            </span>
            <div className="w-28 sm:w-36 bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#0369a1] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${totalPairs > 0 ? (lockedPairs / totalPairs) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* ================= SÂN KHẤU RỔ BÓNG THỦY TINH SÁNG TRỌNG ================= */}
        <div className="p-4 sm:p-6 space-y-6">
          <div className="relative p-5 sm:p-7 rounded-3xl bg-gradient-to-b from-sky-50/70 via-white to-slate-50 text-slate-900 border-2 border-sky-200 shadow-md overflow-hidden">
            {/* Hiệu ứng ánh sáng sân khấu trung tâm */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-300/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-2">
                <span className="text-[13px] font-extrabold tracking-wide px-3.5 py-1.5 rounded-full bg-white text-[#0369a1] border border-sky-300 shadow-xs">
                  {isDone
                    ? "🎉 LỄ BỐC THĂM ĐÃ HOÀN TẤT THÀNH CÔNG"
                    : isSwirling
                    ? "🌀 ĐANG KHUẤY RỔ BÓNG THỦY TINH..."
                    : isBallOpened
                    ? `✨ CẶP ĐẤU ĐÃ XÁC ĐỊNH: ${currentPair?.teamA ?? ''} VS ${currentPair?.teamB ?? ''}`
                    : `SÂN KHẤU BỐC THĂM TRỰC TIẾP: TRẬN ${currentPairIdx + 1}/${totalPairs}`}
                </span>
              </div>

              {/* RỔ BÓNG THỦY TINH PHA LÊ (CRYSTAL DRAW BOWL) */}
              <div className="relative my-4 flex flex-col items-center">
                {/* Quả bóng đang bốc nhấc lên (Levitating & Opened Draw Ball) */}
                {isBallRising && currentPair && (
                  <div
                    className={`absolute -top-16 z-30 transition-all duration-500 transform ${
                      isBallOpened ? "scale-105" : "scale-100"
                    }`}
                  >
                    <div className="flex flex-col items-center animate-pulse">
                      {/* Nửa trên quả bóng tách đôi */}
                      <div
                        className={`w-14 h-7 rounded-t-full bg-gradient-to-b from-white via-slate-50 to-sky-100 border-2 border-[#0369a1] shadow-md transition-transform duration-500 ${
                          isBallOpened ? "-translate-y-3" : "translate-y-0"
                        } flex items-center justify-center text-[10px] text-[#0369a1] font-black`}
                      >
                        ⭐
                      </div>

                      {/* Dải Băng Bốc Thăm bung mở ở giữa hiển thị CẢ 2 ĐỘI */}
                      {isBallOpened && (
                        <div className="py-2.5 px-6 rounded-2xl bg-white border-2 border-amber-400 text-slate-900 font-black text-[14px] sm:text-[15px] shadow-2xl ring-4 ring-amber-400/25 animate-fade-in flex items-center gap-2.5 max-w-lg">
                          <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-[#0369a1] font-black">{currentPair.teamA}</span>
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 text-[13px] font-black">VS</span>
                          <span className="text-amber-800 font-black">{currentPair.teamB}</span>
                        </div>
                      )}

                      {/* Nửa dưới quả bóng tách đôi */}
                      <div
                        className={`w-14 h-7 rounded-b-full bg-gradient-to-t from-[#0b4f6c] via-[#0369a1] to-sky-500 border-2 border-[#0369a1] shadow-md transition-transform duration-500 ${
                          isBallOpened ? "translate-y-3" : "translate-y-0"
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Thân Bát Thủy Tinh (Glass Bowl) */}
                <div
                  className={`w-52 h-34 sm:w-60 sm:h-40 rounded-b-full border-4 border-sky-300/80 bg-gradient-to-b from-white/95 via-sky-100/50 to-sky-200/60 backdrop-blur-md shadow-xl relative flex items-center justify-center overflow-hidden transition-all duration-300 ${
                    isSwirling ? "scale-105 ring-4 ring-sky-400/40" : ""
                  }`}
                  style={{
                    boxShadow: "inset 0 10px 25px rgba(255,255,255,0.7), 0 15px 30px rgba(3,105,161,0.15)",
                  }}
                >
                  {/* Miệng bát kim loại sáng bóng */}
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-sky-200 via-white to-sky-200 opacity-90 border-b border-sky-300" />

                  {/* Các quả bóng bốc thăm bên trong rổ */}
                  <div
                    className={`grid grid-cols-4 gap-2.5 p-3 transition-transform duration-700 ${
                      isSwirling ? "rotate-180 scale-95" : ""
                    }`}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[11px] font-bold transition-all ${
                          i % 2 === 0
                            ? "bg-gradient-to-tr from-[#0b4f6c] via-[#0369a1] to-sky-400 text-white"
                            : "bg-gradient-to-tr from-white via-slate-100 to-sky-50 text-slate-800 border-sky-300"
                        } ${isSwirling ? "animate-spin" : "hover:scale-110"}`}
                      >
                        ⚽
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chân đế bệ đỡ rổ thủy tinh */}
                <div className="w-32 sm:w-36 h-4 rounded-b-xl bg-gradient-to-r from-[#0369a1] via-sky-400 to-[#0b4f6c] shadow-md border-t border-sky-200" />
              </div>

              {/* THẺ ĐỐI ĐẦU ĐỘI A VS ĐỘI B TRỰC TIẾP */}
              {currentPair && (
                <div className="w-full max-w-2xl mt-2 grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                  {/* ĐỘI A */}
                  <div
                    className={`sm:col-span-5 p-4 rounded-2xl border transition-all duration-300 ${
                      isBallOpened || lockedPairs > currentPairIdx
                        ? "bg-white border-[#0369a1] shadow-md ring-4 ring-sky-100"
                        : "bg-slate-100 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0369a1] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                        {currentPair.teamA.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <span className="text-[13px] font-bold text-[#0369a1] block">Đội Hạt Giống 1</span>
                        <h4 className="text-[14px] sm:text-base font-extrabold text-slate-900 truncate">
                          {isBallOpened || lockedPairs > currentPairIdx ? currentPair.teamA : "Đang quay rổ bóng..."}
                        </h4>
                        {getTeamMeta(currentPair.teamA) && (
                          <span className="text-[13px] text-slate-500 font-semibold block">
                            Phong độ: {getTeamMeta(currentPair.teamA)?.form || "Mới"} • Thắng{" "}
                            {getTeamMeta(currentPair.teamA)?.winRate ?? 0}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BIỂU TƯỢNG VS */}
                  <div className="sm:col-span-1 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#0369a1] text-white flex items-center justify-center font-black text-[13px] shadow-md ring-4 ring-sky-100">
                      VS
                    </div>
                  </div>

                  {/* ĐỘI B */}
                  <div
                    className={`sm:col-span-5 p-4 rounded-2xl border transition-all duration-300 ${
                      isBallOpened || lockedPairs > currentPairIdx
                        ? "bg-white border-amber-400 shadow-md ring-4 ring-amber-100"
                        : "bg-slate-100 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-sm shrink-0">
                        {currentPair.teamB.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <span className="text-[13px] font-bold text-amber-700 block">Đội Đối Thủ 2</span>
                        <h4 className="text-[14px] sm:text-base font-extrabold text-slate-900 truncate">
                          {isBallOpened || lockedPairs > currentPairIdx ? currentPair.teamB : "Đang quay rổ bóng..."}
                        </h4>
                        {getTeamMeta(currentPair.teamB) && (
                          <span className="text-[13px] text-slate-500 font-semibold block">
                            Phong độ: {getTeamMeta(currentPair.teamB)?.form || "Mới"} • Thắng{" "}
                            {getTeamMeta(currentPair.teamB)?.winRate ?? 0}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NÚT THAO TÁC RỔ BÓNG */}
              <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
                {!isDone ? (
                  <>
                    <button
                      type="button"
                      onClick={drawNextPair}
                      disabled={isSwirling}
                      className="px-6 py-3 rounded-xl bg-[#0369a1] hover:bg-[#0284c7] text-white text-[14px] font-extrabold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSwirling ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang Khuấy Rổ Bóng...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current text-white" />
                          <span>Khuấy Rổ &amp; Bốc Cặp Tiếp Theo</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutoPlay(!autoPlay)}
                      className={`px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        autoPlay
                          ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>{autoPlay ? "Dừng Tự Động Bốc" : "Tự Động Bốc Lần Lượt"}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onDone}
                    className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-black flex items-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Hoàn Tất Lễ Bốc Thăm &amp; Lưu Nhánh Đấu</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ================= PHẦN DƯỚI: HIỂN THỊ CÁC BẢNG ĐẤU HOẶC CẶP ĐẤU ================= */}
          {effectiveViewMode === "GROUPS" ? (
            /* CHẾ ĐỘ 1: BẢNG ĐẤU (BẢNG A, B, C, D) */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0369a1]" />
                  <span>Các Bảng Đấu Chính Thức (Group Stage)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-sky-100 text-[#0369a1]">
                    {groupCount} Bảng
                  </span>
                </h5>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {groupLabels.slice(0, groupCount).map((label, gIdx) => {
                  const groupTeams = drawnGroups[label] || [];
                  return (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[13px] font-black text-[#0369a1] bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                          {label}
                        </span>
                        <span className="text-[12px] font-bold text-slate-500">
                          {groupTeams.length} đội
                        </span>
                      </div>

                      {groupTeams.length === 0 ? (
                        <div className="py-6 text-center text-[12px] text-slate-400 italic">
                          Chưa bốc đội vào bảng
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {groupTeams.map((tm, idx) => (
                            <div
                              key={tm}
                              className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[13px] animate-fade-in"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-sky-100 text-[#0369a1] font-bold text-[11px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-slate-900 truncate">{tm}</span>
                              </div>
                              {getTeamMeta(tm)?.form && (
                                <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0">
                                  {getTeamMeta(tm)?.form}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* CHẾ ĐỘ 2: CẶP ĐẤU LOẠI TRỰC TIẾP (KNOCKOUT PAIRS) */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#0369a1]" />
                  <span>Danh Sách Cặp Đấu Phân Nhánh Vòng 1</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-slate-100 text-slate-600">
                    {pairs.length} trận
                  </span>
                </h5>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {pairs.map((p, idx) => {
                  const isPairLocked = idx < lockedPairs;
                  const isCurrent = idx === lockedPairs;

                  return (
                    <div
                      key={p.matchId}
                      className={`p-3 rounded-2xl border transition-all ${
                        isPairLocked
                          ? "bg-emerald-50/50 border-emerald-300 shadow-xs"
                          : isCurrent
                          ? "bg-sky-50 border-sky-400 ring-2 ring-sky-200 shadow-sm"
                          : "bg-slate-50 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-extrabold text-slate-600 font-mono">
                          {p.matchId}
                        </span>
                        {isPairLocked ? (
                          <span className="text-[13px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã chốt</span>
                          </span>
                        ) : isCurrent ? (
                          <span className="text-[13px] font-bold px-2 py-0.5 rounded bg-sky-200 text-[#0369a1] animate-pulse">
                            Đang bốc thăm...
                          </span>
                        ) : (
                          <span className="text-[13px] font-medium text-slate-400">Chờ lượt</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[13px] font-bold">
                        <span
                          className={`truncate ${
                            isPairLocked || (isCurrent && isBallOpened)
                              ? "text-slate-900 font-extrabold"
                              : "text-slate-400 italic"
                          }`}
                        >
                          {isPairLocked || (isCurrent && isBallOpened) ? p.teamA : "—"}
                        </span>
                        <span className="text-slate-400 text-[13px] shrink-0 font-black">VS</span>
                        <span
                          className={`truncate text-right ${
                            isPairLocked || (isCurrent && isBallOpened) ? "text-slate-900 font-extrabold" : "text-slate-400 italic"
                          }`}
                        >
                          {isPairLocked || (isCurrent && isBallOpened) ? p.teamB : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ĐỘI ĐẶC CÁCH (NẾU CÓ BYE) */}
          {byes.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[13px] flex items-center gap-2.5">
              <Award className="w-4.5 h-4.5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-900">Đội đặc cách vào thẳng vòng trong: </span>
                <span className="text-amber-800 font-semibold">{byes.join(" • ")}</span>
              </div>
            </div>
          )}

          {/* FOOTER NÚT THOÁT / THU GỌN */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[13px] text-slate-500">
              * Lễ bốc thăm rổ bóng được thực hiện công khai &amp; kết quả được lưu trực tiếp vào CSDL Turfzone.
            </span>
            <button
              type="button"
              onClick={onDone}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-[13px] font-bold transition-colors cursor-pointer"
            >
              Đóng &amp; Xem Cây Nhánh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
