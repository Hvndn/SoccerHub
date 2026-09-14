"use client";

import React, { useState } from "react";
import { Radio, Plus, Minus, AlertCircle, ShieldAlert, Award, Clock, Play, Pause } from "lucide-react";

export default function RefereePanel() {
  const [scoreA, setScoreA] = useState(2);
  const [scoreB, setScoreB] = useState(1);
  const [matchMinute, setMatchMinute] = useState(78);
  const [isLive, setIsLive] = useState(true);

  const [events, setEvents] = useState([
    { id: 1, minute: 24, type: "GOAL", player: "Nguyễn Văn Hùng (#10)", team: "FC Tigers", detail: "Sút xa đẹp mắt 25m" },
    { id: 2, minute: 41, type: "YELLOW", player: "Trần Văn Bình (#4)", team: "FC Eagles", detail: "Phạm lỗi ngáng chân" },
    { id: 3, minute: 55, type: "GOAL", player: "Lê Hoàng Minh (#9)", team: "FC Eagles", detail: "Đánh đầu cận thành" },
    { id: 4, minute: 62, type: "GOAL", player: "Phạm Quốc Bảo (#7)", team: "FC Tigers", detail: "Phạt đền Penalty 11m" },
  ]);

  const addEvent = (type: string, team: string) => {
    if (type === "GOAL") {
      if (team === "A") setScoreA((s) => s + 1);
      else setScoreB((s) => s + 1);
    }

    const newEvt = {
      id: Date.now(),
      minute: matchMinute,
      type: type,
      player: team === "A" ? "Cầu thủ FC Tigers (#10)" : "Cầu thủ FC Eagles (#9)",
      team: team === "A" ? "FC Tigers" : "FC Eagles",
      detail: type === "GOAL" ? "Bàn thắng ghi nhận" : type === "YELLOW" ? "Thẻ vàng vi phạm" : "Thẻ đỏ truất quyền thi đấu"
    };
    setEvents([newEvt, ...events]);
  };

  return (
    <div className="space-y-8">
      {/* Live Referee Header */}
      <div className="glass-panel p-6 rounded-3xl border border-rose-500/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold mb-2">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Biên Bản Trọng Tài & Điều Khiển Trận Đấu Realtime (WebSocket Active)</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Bảng Điều Khiển Trận Đấu Trực Tiếp</h1>
            <p className="text-slate-400 text-xs mt-1">Cập nhật tỷ số, thẻ phạt, bàn thắng tức thì đến khán giả và hệ thống tự động tính BXH.</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center space-x-2 ${
                isLive ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40" : "bg-slate-800 text-slate-400"
              }`}
            >
              {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isLive ? "Tạm Dừng Trận" : "Tiếp Tục Trận"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Scoreboard Display Component */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-6 bg-slate-900/90 relative">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-pitch-lime font-mono text-sm font-extrabold stadium-shadow">
          <Clock className="w-4 h-4 text-pitch-lime animate-spin" />
          <span>PHÚT {matchMinute}'</span>
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping ml-1" />
        </div>

        <div className="grid grid-cols-3 items-center max-w-2xl mx-auto">
          {/* Team A */}
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-pitch-emerald/20 border-2 border-pitch-emerald mx-auto flex items-center justify-center font-bold text-xl text-pitch-emerald">
              FT
            </div>
            <h2 className="text-xl font-extrabold text-white">FC Tigers</h2>
            <span className="text-xs text-slate-400 font-semibold">Chủ nhà (Đỏ)</span>
          </div>

          {/* Big Score Counter */}
          <div className="flex items-center justify-center space-x-4">
            <span className="text-6xl font-extrabold text-pitch-lime font-mono tracking-tighter">{scoreA}</span>
            <span className="text-4xl text-slate-600 font-bold">:</span>
            <span className="text-6xl font-extrabold text-pitch-lime font-mono tracking-tighter">{scoreB}</span>
          </div>

          {/* Team B */}
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-pitch-lime/20 border-2 border-pitch-lime mx-auto flex items-center justify-center font-bold text-xl text-pitch-lime">
              FE
            </div>
            <h2 className="text-xl font-extrabold text-white">FC Eagles</h2>
            <span className="text-xs text-slate-400 font-semibold">Khách (Xanh)</span>
          </div>
        </div>

        {/* Referee Interactive Control Actions */}
        <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs max-w-3xl mx-auto">
          {/* Team A Actions */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="font-bold text-pitch-emerald block text-center uppercase tracking-wider">Hành Động: FC Tigers</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => addEvent("GOAL", "A")}
                className="p-2.5 rounded-xl bg-pitch-emerald hover:bg-pitch-darkEmerald text-white font-extrabold flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Bàn Thắng</span>
              </button>
              <button
                onClick={() => addEvent("YELLOW", "A")}
                className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-bold flex items-center justify-center space-x-1"
              >
                🟨 <span>Thẻ Vàng</span>
              </button>
              <button
                onClick={() => addEvent("RED", "A")}
                className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold flex items-center justify-center space-x-1"
              >
                🟥 <span>Thẻ Đỏ</span>
              </button>
            </div>
          </div>

          {/* Team B Actions */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="font-bold text-pitch-lime block text-center uppercase tracking-wider">Hành Động: FC Eagles</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => addEvent("GOAL", "B")}
                className="p-2.5 rounded-xl bg-pitch-emerald hover:bg-pitch-darkEmerald text-white font-extrabold flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Bàn Thắng</span>
              </button>
              <button
                onClick={() => addEvent("YELLOW", "B")}
                className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-bold flex items-center justify-center space-x-1"
              >
                🟨 <span>Thẻ Vàng</span>
              </button>
              <button
                onClick={() => addEvent("RED", "B")}
                className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold flex items-center justify-center space-x-1"
              >
                🟥 <span>Thẻ Đỏ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Match Event Log Timeline */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Clock className="w-5 h-5 text-pitch-lime mr-2" /> Nhật Ký Diễn Biến Trận Đấu (Realtime Log)
        </h3>

        <div className="space-y-2">
          {events.map((evt) => (
            <div key={evt.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-pitch-lime font-mono font-extrabold">{evt.minute}'</span>
                <span className="font-bold text-white">{evt.team}</span>
                <span className="text-slate-400">• {evt.player}</span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <span className="text-slate-300">{evt.detail}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-pitch-emerald font-extrabold uppercase text-[10px]">
                  {evt.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
