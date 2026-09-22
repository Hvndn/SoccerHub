"use client";

import React, { useState } from "react";
import {
  Shield,
  Users,
  Trophy,
  DollarSign,
  Plus,
  UserPlus,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Award,
  ArrowUpRight,
  Search,
  Filter,
  Share2,
  Sparkles,
  MapPin,
  Flame,
  Check,
  Zap,
  CreditCard
} from "lucide-react";

interface TeamClubManagementProps {
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function TeamClubManagement({
  onBackToHome,
  onNavigateTab
}: TeamClubManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<"roster" | "fund" | "matches" | "recruitment">("roster");
  const [searchMember, setSearchMember] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);

  // Mock Team Data (Stitch Spec: FC Thunder VaoSan)
  const teamInfo = {
    name: "FC Thunder Saigon",
    code: "FCT-88",
    logo: "⚡",
    sport: "Bóng Đá 7 Người",
    eloRating: 1680,
    rankTier: "Hạng Bạch Kim (Platinum)",
    division: "Giải VĐCLB VaoSan Premier",
    homePitch: "Sân Bóng Đá Đại Nam - Cụm A",
    captain: "Trần Hoàng Long (@long_captain)",
    foundedYear: 2024,
    totalMembers: 16,
    activeFund: "3,450,000 VNĐ",
    winRate: "78.5%"
  };

  const members = [
    { id: 1, name: "Trần Hoàng Long", role: "Đội Trưởng", pos: "Tiền Vệ (CM)", number: 10, elo: 1750, form: ["W", "W", "W", "D", "W"], attendance: "100%", status: "Ready" },
    { id: 2, name: "Nguyễn Văn Hùng", role: "Phó Đội", pos: "Tiền Đạo (ST)", number: 9, elo: 1690, form: ["W", "W", "L", "W", "W"], attendance: "95%", status: "Ready" },
    { id: 3, name: "Lê Minh Trí", role: "Thành Viên", pos: "Thủ Môn (GK)", number: 1, elo: 1640, form: ["W", "L", "W", "W", "W"], attendance: "90%", status: "Ready" },
    { id: 4, name: "Phạm Quốc Bảo", role: "Thành Viên", pos: "Hậu Vệ (CB)", number: 4, elo: 1580, form: ["D", "W", "W", "W", "L"], attendance: "85%", status: "Injured" },
    { id: 5, name: "Hoàng Anh Vũ", role: "Thành Viên", pos: "Tiền Vệ Cánh (LM)", number: 7, elo: 1620, form: ["W", "W", "W", "W", "D"], attendance: "100%", status: "Ready" },
    { id: 6, name: "Đặng Tuấn Anh", role: "Thành Viên", pos: "Hậu Vệ Cánh (RB)", number: 2, elo: 1550, form: ["L", "W", "D", "W", "W"], attendance: "80%", status: "Busy" }
  ];

  const fundHistory = [
    { id: 1, type: "IN", desc: "Đóng quỹ tháng 9 (16 cầu thủ)", amount: "+ 4,000,000 VNĐ", date: "01/09/2026", status: "Hoàn tất" },
    { id: 2, type: "OUT", desc: "Thanh toán cọc sân Đại Nam (Trận giao hữu FC Dragon)", amount: "- 650,000 VNĐ", date: "12/09/2026", status: "Đã chi" },
    { id: 3, type: "OUT", desc: "Mua 2 thùng nước suối & gel lạnh sơ cứu", amount: "- 180,000 VNĐ", date: "14/09/2026", status: "Đã chi" },
    { id: 4, type: "IN", desc: "Thưởng thắng trận thách đấu FC Real Star", amount: "+ 280,000 VNĐ", date: "15/09/2026", status: "Hoàn tất" }
  ];

  const upcomingMatches = [
    { id: 1, opponent: "FC Dragon King", date: "Chủ Nhật, 20/09/2026", time: "19:30 - 21:00", pitch: "Sân Đại Nam - Sân 7A", type: "Giao Hữu Ghép Kèo Elo", bet: "Chia 50/50 Tiền Sân" },
    { id: 2, opponent: "Phoenix Star FC", date: "Thứ Tư, 23/09/2026", time: "20:00 - 21:30", pitch: "Sân Sport Plus Tân Bình", type: "Vòng 4 Giải VaoSan League", bet: "Trận Đánh Điểm Elo x2" }
  ];

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.pos.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* BANNER HEADER TEAM (STITCH SPEC) */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-[#0b4f6c] to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-slate-700/60">
        <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-6 pointer-events-none">
          <Shield className="w-96 h-96 text-sky-400" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/90 border-2 border-sky-400/80 flex items-center justify-center text-4xl shadow-lg shrink-0">
              {teamInfo.logo}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{teamInfo.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {teamInfo.code}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
                <span className="flex items-center space-x-1 font-semibold text-emerald-400">
                  <Award className="w-4 h-4" />
                  <span>Elo CLB: {teamInfo.eloRating}</span>
                </span>
                <span>•</span>
                <span>{teamInfo.sport}</span>
                <span>•</span>
                <span className="text-amber-300 font-semibold">{teamInfo.rankTier}</span>
              </div>

              <p className="text-xs text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Sân nhà: {teamInfo.homePitch}</span>
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto bg-slate-950/40 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md">
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Thành Viên</span>
              <span className="text-lg font-black text-white">{teamInfo.totalMembers} Cầu thủ</span>
            </div>
            <div className="text-center px-2 border-x border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Quỹ Đội</span>
              <span className="text-lg font-black text-emerald-400">{teamInfo.activeFund}</span>
            </div>
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Tỷ Lệ Thắng</span>
              <span className="text-lg font-black text-sky-400">{teamInfo.winRate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("roster")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeSubTab === "roster"
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh Sách Cầu Thủ ({members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("fund")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeSubTab === "fund"
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Quỹ Đội & Chi Phí</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("matches")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeSubTab === "matches"
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch Đấu CLB</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-sm flex items-center space-x-1.5 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Chiêu Mộ Cầu Thủ</span>
        </button>
      </div>

      {/* TAB CONTENT: ROSTER */}
      {activeSubTab === "roster" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="Tìm tên cầu thủ, vị trí thi đấu..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c]"
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Hiển thị <span className="font-bold text-slate-900 dark:text-white">{filteredMembers.length}</span> / {members.length} cầu thủ
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((m) => (
              <div
                key={m.id}
                className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#0b4f6c] dark:hover:border-sky-500 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0b4f6c] dark:text-sky-400 font-black text-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      #{m.number}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{m.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{m.pos}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-400/20">
                    {m.role}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Elo Cá Nhân</span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white">{m.elo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Điểm Danh</span>
                    <span className="font-mono font-extrabold text-emerald-500">{m.attendance}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Trạng Thái</span>
                    <span className={`font-bold ${m.status === "Ready" ? "text-emerald-500" : "text-amber-500"}`}>
                      {m.status === "Ready" ? "Sẵn Sàng" : "Vắng Mặt"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 font-medium">5 Trận Gần Nhất:</span>
                  <div className="flex space-x-1">
                    {m.form.map((f, idx) => (
                      <span
                        key={idx}
                        className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center text-white ${
                          f === "W" ? "bg-emerald-500" : f === "D" ? "bg-amber-500" : "bg-rose-500"
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: FUND */}
      {activeSubTab === "fund" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số Dư Quỹ Hiện Tại</span>
              <div className="text-2xl font-black text-emerald-500 font-mono">3,450,000 VNĐ</div>
              <p className="text-[11px] text-slate-500">Đã kiểm toán & công khai minh bạch cho 16 cầu thủ</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thu Trong Tháng</span>
              <div className="text-2xl font-black text-sky-500 font-mono">+ 4,280,000 VNĐ</div>
              <p className="text-[11px] text-slate-500">Gồm đóng quỹ định kỳ + tiền thưởng thi đấu</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đã Chi Trận Đấu</span>
              <div className="text-2xl font-black text-rose-500 font-mono">- 830,000 VNĐ</div>
              <p className="text-[11px] text-slate-500">Tiền cọc sân, nước uống & y tế sân cỏ</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Lịch Sử Thu Chi Quỹ Đội</h3>
              <button
                type="button"
                onClick={() => setShowFundModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 font-bold text-xs flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ghi Nhận Giao Dịch</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {fundHistory.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                        item.type === "IN" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {item.type === "IN" ? "+" : "-"}
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white">{item.desc}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-extrabold ${item.type === "IN" ? "text-emerald-500" : "text-rose-500"}`}>
                      {item.amount}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-semibold">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MATCHES */}
      {activeSubTab === "matches" && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Lịch Thi Đấu Giao Hữu & Giải Đấu Sắp Tới</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingMatches.map((m) => (
              <div key={m.id} className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-400/20">
                    {m.type}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-500">{m.bet}</span>
                </div>

                <div className="flex items-center justify-between py-2 text-center">
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-white font-black text-xl flex items-center justify-center mx-auto">
                      ⚡
                    </div>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block">FC Thunder</span>
                  </div>
                  <div className="text-slate-400 font-black text-sm">VS</div>
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-black text-xl flex items-center justify-center mx-auto">
                      🐉
                    </div>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white block">{m.opponent}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white">
                    <Clock className="w-3.5 h-3.5 text-[#0b4f6c] dark:text-sky-400" />
                    <span>{m.date} ({m.time})</span>
                  </p>
                  <p className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{m.pitch}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
