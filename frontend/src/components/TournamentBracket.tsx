"use client";

import React, { useState } from "react";
import { 
  Trophy, 
  RefreshCw, 
  Award, 
  Shield, 
  Check, 
  ListOrdered, 
  Video, 
  Flame, 
  Clock, 
  Users, 
  Play, 
  Pause, 
  RotateCcw, 
  FileText, 
  QrCode, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from "lucide-react";

export default function TournamentBracket() {
  const [selectedSport, setSelectedSport] = useState("PICKLEBALL");
  const [tournamentFormat, setTournamentFormat] = useState("KNOCKOUT");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"bracket" | "var_referee" | "standings" | "esheet">("bracket");

  // Scoreboard state for Live VAR console
  const [scoreA, setScoreA] = useState(11);
  const [scoreB, setScoreB] = useState(9);
  const [currentSet, setCurrentSet] = useState(3);
  const [cardsA, setCardsA] = useState(1);
  const [cardsB, setCardsB] = useState(0);
  const [timeoutsA, setTimeoutsA] = useState(1);
  const [timeoutsB, setTimeoutsB] = useState(2);
  const [varStatus, setVarStatus] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>("Cam 1 - Direct Baseline");

  const [quarterFinals, setQuarterFinals] = useState([
    { matchId: "Q1", teamA: "SG Titan Pickleball (DUPR 4.3)", teamB: "Thắng Lợi Q.7 (DUPR 4.1)", scoreA: 2, scoreB: 1, winner: "SG Titan Pickleball (DUPR 4.3)" },
    { matchId: "Q2", teamA: "D-Sport Warriors (DUPR 4.0)", teamB: "Phoenix Club (DUPR 3.9)", scoreA: 2, scoreB: 0, winner: "D-Sport Warriors (DUPR 4.0)" },
    { matchId: "Q3", teamA: "Oasis Lions (DUPR 4.2)", teamB: "Sharks Sport (DUPR 4.1)", scoreA: 1, scoreB: 2, winner: "Sharks Sport (DUPR 4.1)" },
    { matchId: "Q4", teamA: "Eagles Pro (DUPR 4.4)", teamB: "Titans Saigon (DUPR 4.2)", scoreA: 2, scoreB: 0, winner: "Eagles Pro (DUPR 4.4)" },
  ]);

  const [semiFinals, setSemiFinals] = useState([
    { matchId: "SF1", teamA: "SG Titan Pickleball", teamB: "D-Sport Warriors", scoreA: 2, scoreB: 1, winner: "SG Titan Pickleball" },
    { matchId: "SF2", teamA: "Sharks Sport", teamB: "Eagles Pro", scoreA: 0, scoreB: 2, winner: "Eagles Pro" },
  ]);

  const [finalMatch, setFinalMatch] = useState({
    matchId: "FINAL", teamA: "SG Titan Pickleball", teamB: "Eagles Pro", scoreA: 11, scoreB: 9, winner: "SG Titan Pickleball"
  });

  const standings = [
    { rank: 1, team: "SG Titan Pickleball", p: 4, w: 4, l: 0, setDiff: "+7", points: 12, duprAvg: "4.35" },
    { rank: 2, team: "Eagles Pro Club", p: 4, w: 3, l: 1, setDiff: "+4", points: 9, duprAvg: "4.40" },
    { rank: 3, team: "D-Sport Warriors", p: 3, w: 2, l: 1, setDiff: "+2", points: 6, duprAvg: "4.05" },
    { rank: 4, team: "Sharks Sport Alliance", p: 3, w: 2, l: 1, setDiff: "+1", points: 6, duprAvg: "4.10" },
    { rank: 5, team: "Thắng Lợi Q.7", p: 2, w: 1, l: 1, setDiff: "0", points: 3, duprAvg: "4.12" },
  ];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleShuffleDraw = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      triggerToast("Bốc thăm tự động phân nhánh đấu đã hoàn tất!");
    }, 600);
  };

  const handleVarCheck = (decision: string) => {
    setVarStatus(decision);
    triggerToast(`Đã ghi nhận VAR Replay: "${decision}"!`);
  };

  return (
    <div className="space-y-8 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 dark:bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-white" />
          <span className="font-semibold text-xs sm:text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-3">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Saigon Multi-Sport Open Cup 2026 • Live VAR & Interactive Bracket Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Quản Lý Giải Đấu & Bàn Trọng Tài Điện Tử Live VAR
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Tự động xếp cây nhánh đấu bốc thăm, điều hành trực tiếp bàn trọng tài điện tử, chấm điểm AI VAR và đồng bộ kết quả lên BXH DUPR/Elo toàn quốc.
            </p>
          </div>

          {/* Sport & Format Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs font-extrabold text-white rounded-xl px-3.5 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="PICKLEBALL">🏓 Pickleball Saigon Master (DUPR 4.0+)</option>
              <option value="FOOTBALL">⚽ Giải Bóng Đá Sân 7 VaoSan Cup</option>
              <option value="BADMINTON">🏸 Giải Cầu Lông Đôi Nam/Nữ BWF</option>
              <option value="TENNIS">🎾 Giải Tennis Open VaoSan</option>
            </select>

            <select
              value={tournamentFormat}
              onChange={(e) => setTournamentFormat(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs font-bold text-white rounded-xl px-3.5 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="KNOCKOUT">Thể thức Loại Trực Tiếp (Knockout)</option>
              <option value="ROUND_ROBIN">Thể thức Vòng Tròn (Round Robin)</option>
            </select>

            <button
              onClick={handleShuffleDraw}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all flex items-center space-x-1.5 shadow-lg active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
              <span>Bốc Thăm Tự Động</span>
            </button>
          </div>
        </div>

        {/* Console Nav Tabs */}
        <div className="flex items-center space-x-2 mt-6 pt-6 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("bracket")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "bracket"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Cây Nhánh Đấu Interactive</span>
          </button>

          <button
            onClick={() => setActiveTab("var_referee")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "var_referee"
                ? "bg-red-500 text-white shadow-md animate-pulse"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Video className="w-4 h-4 text-red-400" />
            <span>Bàn Trọng Tài Live VAR</span>
            <span className="bg-red-950 text-red-300 px-1.5 py-0.5 rounded text-[9px] uppercase font-mono">LIVE</span>
          </button>

          <button
            onClick={() => setActiveTab("standings")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "standings"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Bảng Xếp Hạng & Chỉ Số DUPR</span>
          </button>

          <button
            onClick={() => setActiveTab("esheet")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === "esheet"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Biên Bản Điện Tử & Ký QR</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BRACKET CANVAS */}
      {activeTab === "bracket" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-md overflow-x-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-emerald-500" />
              <span>Sơ Đồ Cây Nhánh Đấu Vòng Loại Trực Tiếp (Interactive Bracket Tree)</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tự động đẩy kết quả Set đấu realtime</span>
          </div>

          <div className="min-w-[900px] grid grid-cols-3 gap-8 py-4 items-center">
            {/* Round 1: Quarter Finals */}
            <div className="space-y-6">
              <div className="text-center text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                Vòng Tứ Kết (4 Trận)
              </div>
              {quarterFinals.map((match) => (
                <div key={match.matchId} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs shadow-xs">
                  <div className={`p-3 flex justify-between items-center ${match.winner === match.teamA ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-extrabold border-l-4 border-emerald-500" : "text-slate-600 dark:text-slate-400"}`}>
                    <span className="line-clamp-1">{match.teamA}</span>
                    <span className="font-mono bg-white dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold">{match.scoreA}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-800" />
                  <div className={`p-3 flex justify-between items-center ${match.winner === match.teamB ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-extrabold border-l-4 border-emerald-500" : "text-slate-600 dark:text-slate-400"}`}>
                    <span className="line-clamp-1">{match.teamB}</span>
                    <span className="font-mono bg-white dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold">{match.scoreB}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Round 2: Semi Finals */}
            <div className="space-y-12">
              <div className="text-center text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                Vòng Bán Kết (2 Trận)
              </div>
              {semiFinals.map((match) => (
                <div key={match.matchId} className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-emerald-500/40 overflow-hidden text-xs shadow-lg">
                  <div className={`p-3.5 flex justify-between items-center ${match.winner === match.teamA ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-extrabold border-l-4 border-emerald-500" : "text-slate-600 dark:text-slate-400"}`}>
                    <span>{match.teamA}</span>
                    <span className="font-mono bg-white dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold">{match.scoreA}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-800" />
                  <div className={`p-3.5 flex justify-between items-center ${match.winner === match.teamB ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-extrabold border-l-4 border-emerald-500" : "text-slate-600 dark:text-slate-400"}`}>
                    <span>{match.teamB}</span>
                    <span className="font-mono bg-white dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold">{match.scoreB}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Round 3: Final */}
            <div className="space-y-6">
              <div className="text-center text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-500/10 py-2 rounded-xl border border-amber-500/30 flex items-center justify-center space-x-1">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Trận Chung Kết Vô Địch</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl border-2 border-amber-500 overflow-hidden text-xs shadow-xl">
                <div className="bg-amber-500/20 text-center py-2 font-bold text-amber-800 dark:text-amber-300 border-b border-amber-500/30 text-xs uppercase tracking-widest flex items-center justify-center space-x-1">
                  <span>Vô Địch: {finalMatch.winner} 🏆</span>
                </div>
                <div className={`p-4 flex justify-between items-center ${finalMatch.winner === finalMatch.teamA ? "bg-emerald-500/20 text-slate-900 dark:text-white font-extrabold" : "text-slate-600 dark:text-slate-400"}`}>
                  <span className="text-sm">{finalMatch.teamA}</span>
                  <span className="font-mono text-sm bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded font-bold border border-slate-200 dark:border-slate-800">{finalMatch.scoreA}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800" />
                <div className={`p-4 flex justify-between items-center ${finalMatch.winner === finalMatch.teamB ? "bg-emerald-500/20 text-slate-900 dark:text-white font-extrabold" : "text-slate-600 dark:text-slate-400"}`}>
                  <span className="text-sm">{finalMatch.teamB}</span>
                  <span className="font-mono text-sm bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded font-bold border border-slate-200 dark:border-slate-800">{finalMatch.scoreB}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE REFEREE VAR CONSOLE */}
      {activeTab === "var_referee" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Referee Scoreboard & Controls */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase mr-2 animate-pulse">LIVE VAR</span>
                <span className="font-extrabold text-base text-slate-900 dark:text-white">Trận Chung Kết Pickleball DUPR 4.0+</span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                Sân PB-01 • Khung Giờ 20:00
              </div>
            </div>

            {/* Giant Monospace Scoreboard */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 rounded-2xl border border-emerald-500/30 text-white text-center shadow-2xl space-y-4">
              <div className="flex items-center justify-center space-x-3 text-xs text-slate-400 uppercase font-mono tracking-widest font-bold">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>SET {currentSet} • THỜI GIAN THI ĐẤU: 18:45</span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4 py-2">
                {/* Team A */}
                <div className="space-y-2">
                  <div className="text-lg font-black text-emerald-400">SG Titan Pickleball</div>
                  <div className="text-xs text-slate-400">DUPR 4.35 • Seeds #1</div>
                  <div className="text-6xl font-mono font-black text-white bg-slate-900 py-3 rounded-2xl border border-slate-800 shadow-inner">
                    {scoreA}
                  </div>
                  <div className="flex justify-center space-x-2 pt-2">
                    <button
                      onClick={() => setScoreA(scoreA + 1)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow"
                    >
                      +1 Điểm
                    </button>
                    <button
                      onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-2 py-1.5 rounded-lg"
                    >
                      -1
                    </button>
                  </div>
                </div>

                {/* VS Indicator */}
                <div className="space-y-1">
                  <div className="text-xl font-extrabold text-amber-400 font-mono">VS</div>
                  <div className="text-[10px] text-slate-400 font-mono">Tỷ số Set: 1 - 1</div>
                  {varStatus && (
                    <div className="bg-amber-400/20 text-amber-300 text-[10px] font-bold p-2 rounded-lg border border-amber-400/40">
                      VAR: {varStatus}
                    </div>
                  )}
                </div>

                {/* Team B */}
                <div className="space-y-2">
                  <div className="text-lg font-black text-cyan-400">Eagles Pro Club</div>
                  <div className="text-xs text-slate-400">DUPR 4.40 • Seeds #2</div>
                  <div className="text-6xl font-mono font-black text-white bg-slate-900 py-3 rounded-2xl border border-slate-800 shadow-inner">
                    {scoreB}
                  </div>
                  <div className="flex justify-center space-x-2 pt-2">
                    <button
                      onClick={() => setScoreB(scoreB + 1)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow"
                    >
                      +1 Điểm
                    </button>
                    <button
                      onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-2 py-1.5 rounded-lg"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* VAR Video Angles & Slow-Mo Controls */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Video className="w-4 h-4 text-red-500" />
                <span>Xem Lai VAR Camera Multi-Angle Slow-Mo</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Cam 1 - Direct Baseline', 'Cam 2 - Kitchen Line', 'Cam 3 - Overhead Angle', 'Cam 4 - AI Line Check'].map((cam) => (
                  <button
                    key={cam}
                    onClick={() => setSelectedCameraAngle(cam)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition border ${
                      selectedCameraAngle === cam
                        ? 'bg-red-500 text-white border-red-500 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    📹 {cam}
                  </button>
                ))}
              </div>

              {/* VAR Action Decisions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Quyết định Trọng Tài VAR Trực Tiếp ({selectedCameraAngle}):
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleVarCheck('Bóng Trong Sân (In-Bounds)')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                  >
                    ✅ Bóng Trong Sân (In-Bounds)
                  </button>
                  <button
                    onClick={() => handleVarCheck('Bóng Ngoài Sân (Out-of-Bounds)')}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                  >
                    ❌ Bóng Out (Out-of-Bounds)
                  </button>
                  <button
                    onClick={() => handleVarCheck('Phạm Lỗi Lưới (Kitchen Fault)')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg transition"
                  >
                    ⚠️ Lỗi Chân Vạch Kitchen
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Match Timeline & E-Sign Off */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Nhật Ký Diễn Biến Trận Đấu</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-emerald-500 font-mono">18:42</span> • Bàn thắng quyết định Set 3 của SG Titan (Dinking Master)
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-amber-500 font-mono">15:10</span> • Quyền Hội Ý Timeout của Eagles Pro Club (1/2)
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-red-500 font-mono">09:05</span> • VAR Review: Xác định bóng nằm trên vạch biên (In-Bounds)
                </div>
              </div>
            </div>

            {/* Referee E-Signature Widget */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-3xl p-6 border border-emerald-500/30 shadow-lg space-y-4">
              <div className="flex items-center space-x-3">
                <QrCode className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Chữ Ký Điện Tử Biên Bản</h4>
                  <p className="text-xs text-slate-300">Trọng tài chính: Phạm Hoàng Nam (BWF/USAPA Certified)</p>
                </div>
              </div>

              <button
                onClick={() => triggerToast("Đã ký số biên bản & tự động cập nhật kết quả lên BXH DUPR toàn quốc!")}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold py-3 rounded-xl shadow-lg transition"
              >
                Xác Nhận & Đẩy Điểm DUPR Tự Động
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STANDINGS & DUPR ELO LEADERBOARD */}
      {activeTab === "standings" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-md">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <ListOrdered className="w-5 h-5 text-emerald-500" />
            <span>Bảng Xếp Hạng Giải Đấu & Chỉ Số DUPR Quốc Gia</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Hạng</th>
                  <th className="py-3 px-4">Tên Đội / CLB</th>
                  <th className="py-3 px-4 text-center">Trận</th>
                  <th className="py-3 px-4 text-center">Thắng</th>
                  <th className="py-3 px-4 text-center">Thua</th>
                  <th className="py-3 px-4 text-center">Hiệu Số Set</th>
                  <th className="py-3 px-4 text-center">DUPR Trung Bình</th>
                  <th className="py-3 px-4 text-right">Điểm Số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                {standings.map((row) => (
                  <tr key={row.rank} className={`hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors ${row.rank === 1 ? "bg-emerald-50 dark:bg-emerald-950/20 text-slate-900 dark:text-white font-bold" : "text-slate-700 dark:text-slate-300"}`}>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">#{row.rank}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{row.team}</td>
                    <td className="py-3.5 px-4 text-center">{row.p}</td>
                    <td className="py-3.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">{row.w}</td>
                    <td className="py-3.5 px-4 text-center text-rose-500">{row.l}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{row.setDiff}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-amber-400/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                        DUPR {row.duprAvg}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ELECTRONIC SCORESHEET & PDF */}
      {activeTab === "esheet" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <span>Biên Bản Điện Tử Trận Đấu (E-Scoresheet & PDF Signature)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Biên bản chuẩn hóa Liên đoàn Thể thao & DUPR Official</p>
            </div>
            <button
              onClick={() => triggerToast("Đã tải xuống tệp PDF Biên bản trận đấu thành công!")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
            >
              Tải PDF Biên Bản
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Giải Đấu:</span>
                <div className="font-bold text-slate-900 dark:text-white">Saigon Multi-Sport Open Cup 2026</div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Vòng Đấu & Sân:</span>
                <div className="font-bold text-slate-900 dark:text-white">Chung Kết - Sân PB-01 D-Sport Oasis Q.7</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-900 dark:text-white">Kết Quả Chi Tiết Set Đấu:</div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono space-y-1">
                <div>Set 1: SG Titan 11 - 8 Eagles Pro</div>
                <div>Set 2: SG Titan 9 - 11 Eagles Pro</div>
                <div>Set 3: SG Titan 11 - 9 Eagles Pro (Match Point)</div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-slate-900 dark:text-white">Đã xác nhận chữ ký Trọng tài chính & Đội trưởng 2 đội</span>
              </div>
              <span className="text-emerald-500 font-mono font-bold">Mã Xác Thực: #VSS-2026-9981</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
