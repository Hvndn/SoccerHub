"use client";

import React, { useState } from "react";
import { Users, Zap, Shield, Award, AlertTriangle, ArrowRight, Flame, UserPlus } from "lucide-react";

export default function CommunityElo() {
  const [activeSubTab, setActiveSubTab] = useState("matchmaking");

  const matchmakingPosts = [
    {
      id: "post-1",
      teamName: "FC Phù Đổng Q7",
      eloRating: 1350,
      winRate: "74%",
      reputationScore: 98,
      pitchName: "Cụm Sân ProHub Q7",
      matchTime: "20:00 Hôm nay",
      pitchType: "Sân 7",
      note: "Cần tìm đối đá bắt cọc tiền sân 50/50, fairplay không quạu.",
      winProbability: 58.4
    },
    {
      id: "post-2",
      teamName: "FC Bách Khoa",
      eloRating: 1210,
      winRate: "62%",
      reputationScore: 95,
      pitchName: "Sân Phú Nhuận Arena",
      matchTime: "18:30 Ngày mai",
      pitchType: "Sân 5",
      note: "Tìm kèo cọ xát nâng trình Elo, giao lưu vui vẻ.",
      winProbability: 71.2
    }
  ];

  const urgentMarket = [
    {
      id: "urg-1",
      matchTitle: "Trận Giao Hữu Sân 7 Q7",
      time: "19:00 Hôm nay (Còn 45 phút)",
      location: "Sân ProHub Q7",
      neededRoles: ["Thủ Môn (GK)", "Tiền Đạo (ST)"],
      rewardNote: "Hỗ trợ 50k tiền nước + Free tiền sân",
      urgencyLevel: "HIGH"
    },
    {
      id: "urg-2",
      matchTitle: "Giải Tứ Hùng Tân Bình",
      time: "20:30 Hôm nay",
      location: "Tân Bình Stadium",
      neededRoles: ["Hậu vệ thòng (CB)"],
      rewardNote: "Cộng 15 điểm Elo uy tín",
      urgencyLevel: "MEDIUM"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-pitch-emerald/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-pitch-emerald/10 border border-pitch-emerald/30 text-pitch-emerald text-xs font-bold mb-2">
              <Zap className="w-4 h-4 text-pitch-lime" />
              <span>Ghép Đội Elo Thông Minh & Chợ Kèo Khẩn Cấp</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Cộng Đồng Cầu Thủ & Matchmaking</h1>
            <p className="text-slate-400 text-xs mt-1">Tìm đối thủ giao hữu ngang trình Elo, viện trợ thiếu người tức thì.</p>
          </div>

          {/* Sub Navigation */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 space-x-1">
            <button
              onClick={() => setActiveSubTab("matchmaking")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "matchmaking" ? "bg-pitch-emerald text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Ghép Đội Elo
            </button>
            <button
              onClick={() => setActiveSubTab("urgent")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "urgent" ? "bg-rose-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Chợ Kèo Khẩn Cấp ⚡
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === "matchmaking" ? (
        /* Elo Matchmaking Feed */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Users className="w-5 h-5 text-pitch-lime mr-2" /> Đội Bóng Đang Tìm Kèo Giao Hữu (Matchmaking List)
            </h2>
            <button className="px-4 py-2 rounded-xl bg-pitch-emerald hover:bg-pitch-darkEmerald text-white font-bold text-xs">
              + Đăng Tin Tìm Kèo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matchmakingPosts.map((post) => (
              <div key={post.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 hover:border-pitch-emerald/50 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pitch-lime bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                      {post.pitchType} • {post.matchTime}
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-2">{post.teamName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{post.pitchName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-pitch-emerald font-mono">{post.eloRating}</span>
                    <span className="text-[10px] text-slate-400 block font-bold">Elo Rating</span>
                  </div>
                </div>

                {/* Matchmaking AI Prediction */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tỷ lệ thắng dự kiến với đội bạn:</span>
                  <span className="font-extrabold text-pitch-lime">{post.winProbability}% (Khá Ngang Sức)</span>
                </div>

                <p className="text-xs text-slate-300 italic bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  "{post.note}"
                </p>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-slate-400">Uy tín: <strong className="text-pitch-emerald">{post.reputationScore} điểm</strong></span>
                  <button className="px-4 py-2 rounded-xl bg-pitch-lime hover:bg-lime-500 text-pitch-navy font-bold text-xs transition-all stadium-shadow">
                    Bắt Kèo Ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Urgent Player Market */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Flame className="w-5 h-5 text-rose-500 mr-2 animate-bounce" /> Chợ Kèo Khẩn Cấp - Tìm Viện Trợ Cầu Thủ Tức Thời
            </h2>
            <span className="text-xs text-rose-400 font-bold">Cần bổ sung nhân sự gấp trước giờ đá</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {urgentMarket.map((item) => (
              <div key={item.id} className="glass-panel p-6 rounded-3xl border border-rose-500/40 space-y-4 bg-slate-900/90 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-extrabold uppercase">
                      ⚡ KHẨN CẤP • {item.urgencyLevel}
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-2">{item.matchTitle}</h3>
                    <p className="text-xs text-pitch-lime font-bold mt-1">{item.time}</p>
                  </div>
                </div>

                {/* Needed Roles Badges */}
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 block font-bold">Vị trí cần viện trợ gấp:</span>
                  <div className="flex flex-wrap gap-2">
                    {item.neededRoles.map((role, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-xl bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-500/30 flex items-center">
                        <UserPlus className="w-3.5 h-3.5 mr-1" /> {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-pitch-emerald font-bold">
                  🎁 Quyền lợi: {item.rewardNote}
                </div>

                <button className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-all shadow-lg shadow-rose-500/30">
                  Ứng Tuyển Viện Trợ Ngay
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
