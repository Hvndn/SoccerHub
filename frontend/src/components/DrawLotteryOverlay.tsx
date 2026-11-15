"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Trophy,
  Shuffle,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  Award,
  Zap,
  Volume2,
  VolumeX,
  X,
  ShieldCheck,
  Check,
} from "lucide-react";

export interface DrawPair {
  matchId: string;
  teamA: string;
  teamB: string;
}

export interface DrawTeamMeta {
  teamName: string;
  seed?: number | null;
  form?: string | null;
  winRate?: number | null;
  played?: number | null;
}

export interface DrawLotteryOverlayProps {
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
 * GIAO DIỆN LỄ BỐC THĂM CHUYÊN NGHIỆP TURFZONE (BROADCAST SHUFFLE STYLE)
 * - Thiết kế chuẩn bảng điện tử truyền hình thể thao quốc tế (UEFA/FIFA Draw).
 * - Hiệu ứng lướt tên đội bóng (Shuffle Reel) 1.2s rồi khóa cặp đấu dứt khoát, sang trọng.
 * - Loại bỏ hoàn toàn âm thanh synth chiptune gây ồn; hỗ trợ âm thanh click nhẹ tinh tế (mặc định tắt).
 * - Hiển thị 100% Inline tại chỗ, font >= 13px, Title Case, đồng bộ Brand Identity #0369a1.
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
  const totalPairs = pairs.length;
  const [lockedPairs, setLockedPairs] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shufflingNames, setShufflingNames] = useState<{ a: string; b: string }>({ a: "", b: "" });
  const [autoPlay, setAutoPlay] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Danh sách toàn bộ các đội tham gia
  const allTeamsList = useMemo(() => {
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

  // Âm thanh click nhẹ tinh tế khi lật thẻ
  const playClickSound = useCallback(() => {
    if (!soundOn || typeof window === "undefined") return;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5 note
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      /* ignore audio errors */
    }
  }, [soundOn]);

  const isDone = lockedPairs >= totalPairs;
  const currentPairIdx = Math.min(lockedPairs, Math.max(0, totalPairs - 1));
  const currentPair = pairs[currentPairIdx];

  // Helper tìm metadata đội bóng
  const getTeamMeta = useCallback(
    (name: string): DrawTeamMeta | undefined => {
      return teams.find((t) => t.teamName?.toLowerCase() === name?.toLowerCase());
    },
    [teams]
  );

  // Bốc cặp đấu tiếp theo với hiệu ứng lướt thẻ (Shuffle Reel)
  const drawNextPair = useCallback(() => {
    if (lockedPairs >= totalPairs || isShuffling) return;

    setIsShuffling(true);

    let shuffleCount = 0;
    const maxShuffles = 10;
    const intervalTime = 90;

    const interval = setInterval(() => {
      if (allTeamsList.length > 1) {
        const randomA = allTeamsList[Math.floor(Math.random() * allTeamsList.length)];
        let randomB = allTeamsList[Math.floor(Math.random() * allTeamsList.length)];
        while (randomB === randomA && allTeamsList.length > 1) {
          randomB = allTeamsList[Math.floor(Math.random() * allTeamsList.length)];
        }
        setShufflingNames({ a: randomA, b: randomB });
      }
      playClickSound();
      shuffleCount++;

      if (shuffleCount >= maxShuffles) {
        clearInterval(interval);
        setIsShuffling(false);
        setLockedPairs((prev) => {
          const next = prev + 1;
          if (next >= totalPairs) setAutoPlay(false);
          return next;
        });
        playClickSound();
      }
    }, intervalTime);
  }, [lockedPairs, totalPairs, isShuffling, allTeamsList, playClickSound]);

  // Bốc thăm nhanh toàn bộ
  const handleFastDraw = useCallback(() => {
    setAutoPlay(false);
    setIsShuffling(false);
    setLockedPairs(totalPairs);
    playClickSound();
  }, [totalPairs, playClickSound]);

  // Auto-play khi bật chế độ tự động
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (autoPlay && !isDone && !isShuffling) {
      timer = setTimeout(() => {
        drawNextPair();
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoPlay, isDone, isShuffling, drawNextPair]);

  if (!open) return null;

  const displayTeamA = isShuffling ? shufflingNames.a : currentPair?.teamA;
  const displayTeamB = isShuffling ? shufflingNames.b : currentPair?.teamB;
  const metaA = displayTeamA ? getTeamMeta(displayTeamA) : undefined;
  const metaB = displayTeamB ? getTeamMeta(displayTeamB) : undefined;

  const progressPercent = totalPairs > 0 ? Math.round((lockedPairs / totalPairs) * 100) : 100;

  return (
    <div className="w-full bg-slate-900/5 p-1 rounded-3xl animate-fade-in my-3">
      <div className="w-full rounded-2xl bg-white border border-slate-200/90 shadow-md overflow-hidden text-slate-800">
        {/* HEADER SÂN KHẤU */}
        <div className="bg-gradient-to-r from-[#0369a1] via-[#0b4f6c] to-[#0369a1] px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-sky-200">
                  Lễ Bốc Thăm Chính Thức
                </span>
                <span className="px-2 py-0.5 rounded-full text-[13px] font-bold bg-white/20 text-white">
                  {format === "ROUND_ROBIN" ? "Vòng Tròn" : "Loại Trực Tiếp"}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight truncate text-white">
                {tournamentTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Nút bật/tắt tiếng */}
            <button
              type="button"
              onClick={() => setSoundOn(!soundOn)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[13px] font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              title={soundOn ? "Tắt âm thanh hiệu ứng" : "Bật âm thanh click nhẹ"}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4 text-slate-300" />}
              <span>{soundOn ? "Âm thanh: Bật" : "Âm thanh: Tắt"}</span>
            </button>

            {/* Bốc nhanh tất cả */}
            {!isDone && (
              <button
                type="button"
                onClick={handleFastDraw}
                className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[13px] font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Bốc Nhanh Tất Cả</span>
              </button>
            )}

            {/* Đóng lễ bốc thăm */}
            <button
              type="button"
              onClick={onDone}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Đóng lễ bốc thăm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* THANH TIẾN ĐỘ */}
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-2.5 flex items-center justify-between text-[13px]">
          <span className="font-bold text-slate-600">
            Tiến độ bốc thăm: <strong className="text-[#0369a1]">{lockedPairs}/{totalPairs} Cặp Đấu</strong> ({progressPercent}%)
          </span>
          <div className="w-44 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#0369a1] h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* SÂN KHẤU TRUNG TÂM (CENTER BROADCAST MATCH CARD) */}
        <div className="p-5 sm:p-8 bg-gradient-to-b from-white to-slate-50/60">
          {!isDone ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Tiêu đề vòng/trận */}
              <div className="text-center space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0369a1] text-[13px] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sân Khấu Bốc Thăm Trực Tiếp • Cặp Đấu #{currentPairIdx + 1}/{totalPairs}</span>
                </span>
                <h4 className="text-sm text-slate-500 font-medium">
                  {isShuffling ? "Đang xáo tên đội bóng ngẫu nhiên..." : "Bấm nút bên dưới để xác định cặp đấu tiếp theo"}
                </h4>
              </div>

              {/* CARD SO TÀI 2 ĐỘI */}
              <div className={`p-4 sm:p-6 rounded-2xl bg-white border-2 transition-all duration-300 shadow-sm ${
                isShuffling ? "border-[#0369a1] ring-4 ring-sky-100" : "border-slate-200"
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
                  {/* ĐỘI A */}
                  <div className="md:col-span-5 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-[#0369a1] text-white mx-auto flex items-center justify-center font-black text-lg shadow-xs">
                      {(displayTeamA || "A").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[13px] font-bold text-slate-400 block">Đội Thứ Nhất</span>
                      <h5 className={`text-base sm:text-lg font-black text-slate-900 transition-all ${
                        isShuffling ? "text-[#0369a1] scale-105" : ""
                      }`}>
                        {displayTeamA || "Đang bốc..."}
                      </h5>
                    </div>
                    {metaA?.form && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[13px] font-bold bg-sky-100 text-[#0369a1]">
                        Phong độ: {metaA.form}
                      </span>
                    )}
                  </div>

                  {/* VS BADGE */}
                  <div className="md:col-span-1 text-center py-1">
                    <span className="w-10 h-10 rounded-full bg-slate-900 text-white font-black text-xs inline-flex items-center justify-center shadow-md border-2 border-white">
                      VS
                    </span>
                  </div>

                  {/* ĐỘI B */}
                  <div className="md:col-span-5 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-700 text-white mx-auto flex items-center justify-center font-black text-lg shadow-xs">
                      {(displayTeamB || "B").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[13px] font-bold text-slate-400 block">Đội Thứ Hai</span>
                      <h5 className={`text-base sm:text-lg font-black text-slate-900 transition-all ${
                        isShuffling ? "text-[#0369a1] scale-105" : ""
                      }`}>
                        {displayTeamB || "Đang bốc..."}
                      </h5>
                    </div>
                    {metaB?.form && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[13px] font-bold bg-slate-100 text-slate-700">
                        Phong độ: {metaB.form}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* NÚT THAO TÁC BỐC THĂM */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isShuffling}
                  onClick={drawNextPair}
                  className="px-6 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Shuffle className={`w-4 h-4 ${isShuffling ? "animate-spin" : ""}`} />
                  <span>{isShuffling ? "Đang Bốc Thăm..." : `Bốc Cặp Đấu #${lockedPairs + 1}`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAutoPlay(!autoPlay)}
                  className={`px-4 py-2.5 rounded-xl text-[13px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    autoPlay
                      ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {autoPlay ? <Pause className="w-4 h-4 text-amber-700" /> : <Play className="w-4 h-4 text-slate-600" />}
                  <span>{autoPlay ? "Dừng Tự Động Bốc" : "Tự Động Bốc Lần Lượt"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* HOÀN TẤT LỄ BỐC THĂM */
            <div className="max-w-lg mx-auto text-center space-y-4 py-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">
                  Lễ Bốc Thăm Đã Hoàn Tất Thành Công!
                </h4>
                <p className="text-[13px] text-slate-600">
                  Toàn bộ {totalPairs} cặp đấu phân nhánh đã được xác định công khai và lưu vào hệ thống giải đấu Turfzone.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onDone}
                  className="px-6 py-3 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold inline-flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span>Hoàn Tất Lễ Bốc Thăm &amp; Xem Nhánh Đấu</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DANH SÁCH CÁC CẶP ĐẤU ĐÃ XÁC ĐỊNH */}
        <div className="bg-slate-50/80 border-t border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-[13px] font-black text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0369a1]" />
              <span>Bảng Ghép Cặp Thi Đấu ({pairs.length} Trận)</span>
            </h5>
            <span className="text-[13px] text-slate-500">
              Đã chốt: <strong className="text-emerald-700 font-bold">{lockedPairs}/{totalPairs}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {pairs.map((p, idx) => {
              const isLocked = idx < lockedPairs;
              const isCurrent = idx === lockedPairs && !isDone;
              return (
                <div
                  key={p.matchId || idx}
                  className={`p-3 rounded-xl border text-[13px] transition-all ${
                    isLocked
                      ? "bg-white border-emerald-300 shadow-xs"
                      : isCurrent
                      ? "bg-sky-50/70 border-[#0369a1] ring-2 ring-sky-200"
                      : "bg-white/60 border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-[13px]">
                    <span className="font-mono text-slate-400 font-bold">{p.matchId}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[13px] font-bold ${
                      isLocked
                        ? "bg-emerald-100 text-emerald-800"
                        : isCurrent
                        ? "bg-sky-100 text-[#0369a1]"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {isLocked ? "Đã Chốt" : isCurrent ? "Đang Bốc" : "Chờ Bốc"}
                    </span>
                  </div>

                  <div className="pt-1.5 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800 truncate">
                      <span className="truncate">{p.teamA || "?"}</span>
                      {isLocked && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </div>
                    <div className="text-[13px] text-slate-400 font-mono text-center">VS</div>
                    <div className="flex items-center justify-between font-bold text-slate-800 truncate">
                      <span className="truncate">{p.teamB || "?"}</span>
                      {isLocked && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {byes.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2 text-[13px] text-slate-600">
              <span className="font-bold text-amber-800">Đội được miễn vòng (BYE):</span>
              {byes.map((bName, i) => (
                <span key={i} className="px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 font-bold text-amber-900">
                  {bName}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
