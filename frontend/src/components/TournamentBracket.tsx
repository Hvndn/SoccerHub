"use client";

import React, { useState } from "react";
import { Trophy, RefreshCw, Award, Shield, Check, ListOrdered } from "lucide-react";

export default function TournamentBracket() {
  const [tournamentFormat, setTournamentFormat] = useState("KNOCKOUT");
  const [isGenerating, setIsGenerating] = useState(false);

  const [quarterFinals, setQuarterFinals] = useState([
    { matchId: "Q1", teamA: "FC Tigers", teamB: "FC Dragons", scoreA: 3, scoreB: 1, winner: "FC Tigers" },
    { matchId: "Q2", teamA: "FC Warriors", teamB: "FC Phoenix", scoreA: 2, scoreB: 0, winner: "FC Warriors" },
    { matchId: "Q3", teamA: "FC Lions", teamB: "FC Sharks", scoreA: 1, scoreB: 2, winner: "FC Sharks" },
    { matchId: "Q4", teamA: "FC Eagles", teamB: "FC Titans", scoreA: 4, scoreB: 3, winner: "FC Eagles" },
  ]);

  const [semiFinals, setSemiFinals] = useState([
    { matchId: "SF1", teamA: "FC Tigers", teamB: "FC Warriors", scoreA: 2, scoreB: 1, winner: "FC Tigers" },
    { matchId: "SF2", teamA: "FC Sharks", teamB: "FC Eagles", scoreA: 0, scoreB: 1, winner: "FC Eagles" },
  ]);

  const [finalMatch, setFinalMatch] = useState({
    matchId: "FINAL", teamA: "FC Tigers", teamB: "FC Eagles", scoreA: 3, scoreB: 2, winner: "FC Tigers"
  });

  const standings = [
    { rank: 1, team: "FC Tigers", p: 3, w: 3, d: 0, l: 0, gf: 8, ga: 4, gd: "+4", pts: 9, cards: "🟨 2" },
    { rank: 2, team: "FC Eagles", p: 3, w: 2, d: 0, l: 1, gf: 7, ga: 5, gd: "+2", pts: 6, cards: "🟨 1" },
    { rank: 3, team: "FC Warriors", p: 2, w: 1, d: 0, l: 1, gf: 3, ga: 2, gd: "+1", pts: 3, cards: "🟨 3" },
    { rank: 4, team: "FC Sharks", p: 2, w: 1, d: 0, l: 1, gf: 2, ga: 2, gd: "0", pts: 3, cards: "🟥 1" },
    { rank: 5, team: "FC Dragons", p: 1, w: 0, d: 0, l: 1, gf: 1, ga: 3, gd: "-2", pts: 0, cards: "🟨 1" },
  ];

  const handleShuffleDraw = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-pitch-lime/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-pitch-lime/10 border border-pitch-lime/30 text-pitch-lime text-xs font-bold mb-2">
              <Trophy className="w-4 h-4" />
              <span>Tự Động Xếp Lịch Thi Đấu & Cây Nhánh Đấu (Bracket)</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Quản Lý Giải Đấu & Lịch Bảng Xếp Hạng</h1>
            <p className="text-slate-400 text-xs mt-1">Hệ thống bốc thăm tự động, tự động tính điểm, hiệu số và nhánh loại trực tiếp.</p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={tournamentFormat}
              onChange={(e) => setTournamentFormat(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs font-bold text-white rounded-xl px-3 py-2.5"
            >
              <option value="KNOCKOUT">Thể thức Loại Trực Tiếp (Knockout)</option>
              <option value="ROUND_ROBIN">Thể thức Vòng Tròn (Round Robin)</option>
            </select>
            <button
              onClick={handleShuffleDraw}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl bg-pitch-lime hover:bg-lime-500 text-pitch-navy font-bold text-xs transition-all flex items-center space-x-1.5 stadium-shadow"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
              <span>Bốc Thăm Nhánh Đấu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bracket Canvas Visualization */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 overflow-x-auto">
        <h2 className="text-lg font-bold text-white flex items-center">
          <Trophy className="w-5 h-5 text-pitch-lime mr-2" /> Sơ Đồ Nhánh Đấu Vòng Loại Trực Tiếp (Bracket Tree)
        </h2>

        <div className="min-w-[800px] grid grid-cols-3 gap-8 py-4 items-center">
          {/* Round 1: Quarter Finals */}
          <div className="space-y-6">
            <div className="text-center text-xs font-extrabold text-pitch-lime uppercase tracking-wider bg-slate-900/90 py-1.5 rounded-lg border border-slate-800">
              Vòng Tứ Kết (4 Trận)
            </div>
            {quarterFinals.map((match) => (
              <div key={match.matchId} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden text-xs">
                <div className={`p-2.5 flex justify-between items-center ${match.winner === match.teamA ? "bg-pitch-emerald/20 text-white font-bold border-l-4 border-pitch-emerald" : "text-slate-400"}`}>
                  <span>{match.teamA}</span>
                  <span className="font-mono bg-slate-950 px-2 py-0.5 rounded">{match.scoreA}</span>
                </div>
                <div className="border-t border-slate-800" />
                <div className={`p-2.5 flex justify-between items-center ${match.winner === match.teamB ? "bg-pitch-emerald/20 text-white font-bold border-l-4 border-pitch-emerald" : "text-slate-400"}`}>
                  <span>{match.teamB}</span>
                  <span className="font-mono bg-slate-950 px-2 py-0.5 rounded">{match.scoreB}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Round 2: Semi Finals */}
          <div className="space-y-12">
            <div className="text-center text-xs font-extrabold text-pitch-lime uppercase tracking-wider bg-slate-900/90 py-1.5 rounded-lg border border-slate-800">
              Vòng Bán Kết (2 Trận)
            </div>
            {semiFinals.map((match) => (
              <div key={match.matchId} className="bg-slate-900 rounded-2xl border border-pitch-emerald/40 overflow-hidden text-xs shadow-lg">
                <div className={`p-3 flex justify-between items-center ${match.winner === match.teamA ? "bg-pitch-emerald/30 text-pitch-lime font-extrabold border-l-4 border-pitch-lime" : "text-slate-400"}`}>
                  <span>{match.teamA}</span>
                  <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-white">{match.scoreA}</span>
                </div>
                <div className="border-t border-slate-800" />
                <div className={`p-3 flex justify-between items-center ${match.winner === match.teamB ? "bg-pitch-emerald/30 text-pitch-lime font-extrabold border-l-4 border-pitch-lime" : "text-slate-400"}`}>
                  <span>{match.teamB}</span>
                  <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-white">{match.scoreB}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Round 3: Final */}
          <div className="space-y-6">
            <div className="text-center text-xs font-extrabold text-amber-400 uppercase tracking-wider bg-amber-500/10 py-1.5 rounded-lg border border-amber-500/30 flex items-center justify-center space-x-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Trận Chung Kết Đỉnh Cao</span>
            </div>

            <div className="bg-slate-900 rounded-2xl border-2 border-amber-500 overflow-hidden text-xs stadium-shadow">
              <div className="bg-amber-500/10 text-center py-1.5 font-bold text-amber-400 border-b border-slate-800 text-[10px] uppercase tracking-widest">
                Đội Vô Địch: {finalMatch.winner} 🏆
              </div>
              <div className={`p-3.5 flex justify-between items-center ${finalMatch.winner === finalMatch.teamA ? "bg-pitch-emerald/30 text-white font-extrabold" : "text-slate-400"}`}>
                <span className="text-sm">{finalMatch.teamA}</span>
                <span className="font-mono text-sm bg-slate-950 text-pitch-lime px-2.5 py-1 rounded font-bold">{finalMatch.scoreA}</span>
              </div>
              <div className="border-t border-slate-800" />
              <div className={`p-3.5 flex justify-between items-center ${finalMatch.winner === finalMatch.teamB ? "bg-pitch-emerald/30 text-white font-extrabold" : "text-slate-400"}`}>
                <span className="text-sm">{finalMatch.teamB}</span>
                <span className="font-mono text-sm bg-slate-950 text-pitch-lime px-2.5 py-1 rounded font-bold">{finalMatch.scoreB}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standings Table (BXH) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center">
          <ListOrdered className="w-5 h-5 text-pitch-emerald mr-2" /> Bảng Xếp Hạng Giải Đấu (Live Standings)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-4">Hạng</th>
                <th className="py-3 px-4">Đội Bóng</th>
                <th className="py-3 px-4 text-center">Trận</th>
                <th className="py-3 px-4 text-center">Thắng</th>
                <th className="py-3 px-4 text-center">Hòa</th>
                <th className="py-3 px-4 text-center">Thua</th>
                <th className="py-3 px-4 text-center">Hiệu Số</th>
                <th className="py-3 px-4 text-center">Thẻ Phạt</th>
                <th className="py-3 px-4 text-right">Điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {standings.map((row) => (
                <tr key={row.rank} className={`hover:bg-slate-800/40 transition-colors ${row.rank === 1 ? "bg-pitch-emerald/10 text-white font-bold" : "text-slate-300"}`}>
                  <td className="py-3.5 px-4 font-bold text-pitch-lime">#{row.rank}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{row.team}</td>
                  <td className="py-3.5 px-4 text-center">{row.p}</td>
                  <td className="py-3.5 px-4 text-center text-pitch-emerald">{row.w}</td>
                  <td className="py-3.5 px-4 text-center">{row.d}</td>
                  <td className="py-3.5 px-4 text-center text-rose-400">{row.l}</td>
                  <td className="py-3.5 px-4 text-center font-mono">{row.gd}</td>
                  <td className="py-3.5 px-4 text-center">{row.cards}</td>
                  <td className="py-3.5 px-4 text-right text-sm font-extrabold text-pitch-lime">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
