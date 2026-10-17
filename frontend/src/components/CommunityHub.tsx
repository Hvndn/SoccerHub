"use client";

import React, { useState } from "react";
import { MessageCircle, Users, Search, Flame, Trophy, ChevronRight, Plus } from "lucide-react";
import CommunityChat from "./CommunityChat";
import MatchmakingMarketplace from "./MatchmakingMarketplace";
import TournamentLeaderboard from "./TournamentLeaderboard";
import TournamentOrganizerPortal from "./TournamentOrganizerPortal";

type CommunityMode = "chat" | "clan";

interface CommunityHubProps {
  user?: any;
  onSelectSlot?: any;
  onOpenAuth?: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
}

/**
 * CommunityHub — Giao diện tab "Cộng đồng" chuẩn Mobile-first với phong cách
 * Dark/Neon Green. Bao gồm:
 *   - Top sub-nav: Toggle "Trò chuyện" / "Đội bóng (Clan)"
 *   - Search bar + filter chips: Chưa đọc, Riêng tư, Bạn bè
 *   - Banner nổi bật: "CHAT GIẢI ĐẤU" + "BẮT ĐỐI GIAO HỮU"
 *   - Channel card list: Avatar neon tròn, tên phòng, tin mới nhất, thời gian, badge số tin chưa đọc
 */
export default function CommunityHub({ user, onSelectSlot, onOpenAuth }: CommunityHubProps) {
  const [mode, setMode] = useState<CommunityMode>("chat");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "private" | "friends">("all");

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "unread", label: "Chưa đọc" },
    { key: "private", label: "Riêng tư" },
    { key: "friends", label: "Bạn bè" },
  ];

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-10 sm:pb-16">
      {/* ========================================================= */}
      {/* TOP SUB-NAV: Toggle "Trò chuyện" / "Đội bóng (Clan)" */}
      {/* ========================================================= */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
        <button
          type="button"
          onClick={() => setMode("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            mode === "chat"
              ? "bg-[#0369a1] text-white shadow-md"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span>Trò chuyện</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("clan")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            mode === "clan"
              ? "bg-[#0369a1] text-white shadow-md"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Đội bóng (Clan)</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SEARCH BAR + FILTER CHIPS */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm phòng chat, đội bóng, cầu thủ..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0369a1] focus:border-[#0369a1] transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                filter === f.key
                  ? "bg-[#0369a1] text-white border-[#0369a1] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#0369a1] hover:text-[#0369a1]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* BANNER NỔI BẬT: "CHAT GIẢI ĐẤU" + "BẮT ĐỐI GIAO HỮU" */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("chat")}
          className="group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all hover:shadow-lg active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #0369a1 0%, #075985 100%)" }}
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-5 h-5 text-white" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white/80">Phòng chat</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">Chat Giải Đấu</h3>
              <p className="text-[11px] sm:text-xs text-white/70 mt-1 leading-relaxed">
                Thảo luận trực tiếp với BTC, đội bóng và cầu thủ trong giải đấu.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode("chat")}
          className="group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left transition-all hover:shadow-lg active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }}
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-white" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white/80">Matchmaking</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">Bắt Đối Giao Hữu</h3>
              <p className="text-[11px] sm:text-xs text-white/70 mt-1 leading-relaxed">
                Tìm đối thủ tương đương phong độ, ghép kèo nhanh chóng.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
          </div>
        </button>
      </div>

      {/* ========================================================= */}
      {/* NỘI DUNG THEO MODE */}
      {/* ========================================================= */}
      {mode === "chat" ? (
        <CommunityChat user={user} />
      ) : (
        /* Clan / Đội bóng — placeholder, sẽ mở rộng sau */
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-black text-slate-900 text-base">Đội bóng (Clan)</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Tính năng quản lý đội bóng, thành viên và lịch sử thi đấu đang được phát triển.
            Hiện tại bạn có thể xem đội của mình ở tab <strong>"Đội của tôi"</strong>.
          </p>
        </div>
      )}
    </div>
  );
}