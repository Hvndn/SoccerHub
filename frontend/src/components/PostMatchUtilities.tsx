"use client";

import React, { useState } from "react";
import {
  Clock,
  Award,
  CheckCircle2,
  DollarSign,
  QrCode,
  Star,
  Users,
  TrendingUp,
  Flame,
  ThumbsUp,
  Share2,
  Trophy,
  ShieldCheck,
  Check,
  ChevronRight,
  MessageSquare
} from "lucide-react";

interface PostMatchUtilitiesProps {
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function PostMatchUtilities({
  onBackToHome,
  onNavigateTab
}: PostMatchUtilitiesProps) {
  const [selectedRating, setSelectedRating] = useState<Record<number, number>>({ 1: 5, 2: 5, 3: 4 });
  const [votedMotm, setVotedMotm] = useState<number | null>(1);
  const [isCopied, setIsCopied] = useState(false);

  // Mock Match Data (Stitch Spec: Post Match Matchday Result)
  const matchResult = {
    title: "Trận Giao Hữu Thách Đấu #MATCH-8842",
    date: "Hôm nay, 19:30 - 21:00",
    pitch: "Sân Bóng Đá Đại Nam - Cụm A (Sân 7)",
    homeTeam: "FC Thunder Saigon",
    homeScore: 4,
    awayTeam: "FC Real Star",
    awayScore: 2,
    motm: "Trần Hoàng Long (2 Bàn + 1 Kiến tạo)",
    eloGained: "+ 18 Điểm Elo",
    totalPitchFee: 650000,
    waterFee: 120000,
    playerCount: 14,
    feePerPlayer: 55000
  };

  const players = [
    { id: 1, name: "Trần Hoàng Long", pos: "CM", goals: 2, assists: 1, rating: 9.5, isMotm: true },
    { id: 2, name: "Nguyễn Văn Hùng", pos: "ST", goals: 2, assists: 0, rating: 8.8, isMotm: false },
    { id: 3, name: "Lê Minh Trí", pos: "GK", goals: 0, assists: 1, rating: 8.2, isMotm: false },
    { id: 4, name: "Hoàng Anh Vũ", pos: "LM", goals: 0, assists: 1, rating: 7.9, isMotm: false }
  ];

  const handleVoteMotm = (id: number) => {
    setVotedMotm(id);
  };

  const handleRatePlayer = (id: number, score: number) => {
    setSelectedRating((prev) => ({ ...prev, [id]: score }));
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* POST-MATCH HEADER CARD (STITCH SPEC) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-400/20">
                Biên Bản Trận Đấu Đã Xác Nhận
              </span>
              <span className="text-xs font-mono font-semibold text-slate-400">{matchResult.date}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {matchResult.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{matchResult.pitch}</p>
          </div>

          <div className="flex items-center space-x-2 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-400/30">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Biến Động Elo</span>
              <span className="text-sm font-black text-emerald-500">{matchResult.eloGained}</span>
            </div>
          </div>
        </div>

        {/* SCORE BOARD DISPLAY */}
        <div className="flex items-center justify-around py-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="text-center space-y-1">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{matchResult.homeScore}</span>
            <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300 block">{matchResult.homeTeam}</span>
          </div>
          <div className="text-center">
            <span className="px-3 py-1 bg-emerald-500 text-white font-black text-xs rounded-full uppercase tracking-widest shadow-xs">
              Thắng Năng Nổ
            </span>
            <span className="block text-[11px] text-slate-400 font-bold mt-1">Hết Giờ (FT 90')</span>
          </div>
          <div className="text-center space-y-1">
            <span className="text-3xl sm:text-4xl font-black text-slate-400">{matchResult.awayScore}</span>
            <span className="font-extrabold text-xs text-slate-500 block">{matchResult.awayTeam}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: VIETQR SPLIT BILL & POST MATCH PAYMENT */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-[#0b4f6c] dark:text-sky-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Chia Tiền VietQR</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-500">Tự Động</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <span>Tiền cọc sân (90 phút):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{matchResult.totalPitchFee.toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <span>Tiền nước suối & Y tế:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{matchResult.waterFee.toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <span>Số cầu thủ ra sân:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{matchResult.playerCount} Người</span>
              </div>
              <div className="flex justify-between items-center py-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-400/20">
                <span className="font-extrabold text-slate-900 dark:text-white">Mỗi cầu thủ thanh toán:</span>
                <span className="font-mono font-black text-emerald-500 text-base">{matchResult.feePerPlayer.toLocaleString()} VNĐ</span>
              </div>
            </div>

            {/* MOCK VIETQR CODE */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=STK_VAOSAN_MATCH_8842_${matchResult.feePerPlayer}`}
                alt="VietQR Split Bill"
                className="w-44 h-44 mx-auto object-contain rounded-xl"
              />
              <p className="text-[11px] font-mono font-bold text-slate-700">STK Quỹ Đội: 0988776655 (MBBank - FC Thunder)</p>
              <button
                type="button"
                onClick={() => setIsCopied(true)}
                className="w-full py-2 bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{isCopied ? "Đã Sao Chép Link CK" : "Gửi QR Vào Nhóm Zalo Đội"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MOTM VOTING & FAIRPLAY RATING */}
        <div className="lg:col-span-2 space-y-6">
          {/* MOTM VOTING SECTION */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Bình Chọn MOTM (Xuất Sắc Nhất Trận)</h3>
              </div>
              <span className="text-xs text-amber-500 font-bold font-mono">Bình Chọn Live</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleVoteMotm(p.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    votedMotm === p.id
                      ? "bg-amber-500/10 border-amber-400 text-slate-900 dark:text-white shadow-sm"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-400/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-[#0b4f6c] dark:text-sky-400">
                      {p.pos}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{p.goals} Bàn thắng • {p.assists} Kiến tạo</p>
                    </div>
                  </div>

                  {votedMotm === p.id && (
                    <span className="p-1.5 rounded-full bg-amber-500 text-slate-950">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PLAYER FAIRPLAY & SKILL RATING */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-sky-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Đánh Giá Fairplay Đồng Đội</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Chấm sao tăng điểm uy tín VaoSan</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {players.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white">{p.name}</h4>
                    <p className="text-[10px] text-slate-400">Điểm phong độ trận: {p.rating} / 10</p>
                  </div>

                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatePlayer(p.id, star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= (selectedRating[p.id] || 5)
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300 dark:text-slate-700"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
