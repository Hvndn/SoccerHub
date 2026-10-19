"use client";

import React, { useEffect, useState } from "react";

import TournamentLeaderboard from "./TournamentLeaderboard";
import TournamentOrganizerPortal from "./TournamentOrganizerPortal";
import { fetchTournaments } from "@/lib/tournamentService";
import { apiUrl, fetchWithTimeout } from '@/lib/api';
import FormDots from "./FormDots";
import { Users, Trophy, Cpu, Flame } from "lucide-react";

interface CommunityFormProps {
 user?: any;
 onSelectSlot?: any;
 /** Mở cuộc trò chuyện riêng với đối tác (dùng cho kênh liên lạc với Chủ Sân). */
 onStartDm?: (partnerEmail: string, partnerName: string) => void;
 defaultSubTab?: "matchmaking" | "tournaments" | "organizer";
 onOpenAuth?: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
  /** Mở phòng chat riêng của giải đấu (tab Cộng đồng > Chat Giải Đấu). */
  onOpenTournamentChat?: () => void;
}

export default function CommunityForm({ user, onSelectSlot, onStartDm, defaultSubTab = "matchmaking", onOpenAuth, onNavigateTab, onOpenTournamentChat }: CommunityFormProps) {
 // "chat" đã bỏ khỏi danh sách: khối chat cộng đồng (search phòng chat, filter
// chưa đọc/riêng tư/bạn bè, danh sách kênh) nằm ở tab "Cộng Đồng" (CommunityHub).
// Trang Ban Tổ Chức chỉ lo phần giải đấu + điều hành + phong độ để tránh lặp UI.
const [subTab, setSubTab] = useState<"matchmaking" | "tournaments" | "organizer" | "formboard">(defaultSubTab as any);
 const [tournamentCount, setTournamentCount] = useState<number | null>(null);
 const [formBoard, setFormBoard] = useState<any[]>([]);

 // Bảng phong độ đội (tính từ lịch sử thi đấu thật, không điểm số)
 useEffect(() => {
 if (subTab !== "formboard" || formBoard.length > 0) return;
 let alive = true;
 fetchWithTimeout(apiUrl("/api/v1/community/players/leaderboard"), { cache: "no-store" })
 .then((r) => (r.ok ? r.json() : []))
 .then((d) => {
 if (!alive) return;
 const rows = Array.isArray(d) ? d : [];
 // Chỉ nhận dòng bảng-phong-độ mới (có teamName); API cũ trả users thì coi như trống.
 setFormBoard(rows.filter((r: any) => r.teamName != null));
 })
 .catch(() => { /* backend chưa lên */ });
 return () => { alive = false; };
 }, [subTab]);

 // Badge "N giải" lấy từ CSDL (cache dùng chung — không gọi API trùng lặp)
 useEffect(() => {
 let alive = true;
 fetchTournaments()
 .then((list) => { if (alive) setTournamentCount(list.length); })
 .catch(() => { /* backend chưa lên — giữ nguyên dấu "—" */ });
 return () => { alive = false; };
 }, []);

 return (
 <div className="w-full space-y-4 sm:space-y-6 pb-10 sm:pb-16">

 {/* ========================================================= */}
 {/* TAB CHUYỂN ĐỔI CHÍNH 3 TRỤ CỘT CỦA CỘNG ĐỒNG */}
 {/* ========================================================= */}
 <div className="relative z-10 mt-3 sm:mt-6 pt-3 sm:pt-5 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1.5 max-w-full scroll-smooth">

 <button
 type="button"
 onClick={() => setSubTab("tournaments")}
 className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
 subTab === "tournaments"
 ? "bg-[#0369a1] text-white shadow-sm"
 : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60"
 }`}
 >
 <Trophy className={`w-4 h-4 ${subTab === "tournaments" ? "text-amber-200" : "text-amber-700"}`} />
 <span className="sm:hidden">Giải Đấu</span>
 <span className="hidden sm:inline">Danh Sách Giải Đấu &amp; Nhánh Bracket</span>
 <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-900 font-black border border-sky-200">
 {tournamentCount === null ? "…" : `${tournamentCount} GIẢI`}
 </span>
 </button>

 <button
 type="button"
 onClick={() => setSubTab("organizer")}
 className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
 subTab === "organizer"
 ? "bg-[#0369a1] text-white shadow-sm"
 : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60"
 }`}
 >
 <Cpu className={`w-4 h-4 ${subTab === "organizer" ? "text-sky-100" : "text-[#0369a1]"}`} />
 <span className="sm:hidden">Điều Hành</span>
 <span className="hidden sm:inline">Điều Hành Giải Đấu</span>
 <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-800 font-black border border-sky-200">BTC PRO</span>
 </button>

 <button
 type="button"
 onClick={() => setSubTab("formboard")}
 className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
 subTab === "formboard"
 ? "bg-[#0369a1] text-white shadow-sm"
 : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60"
 }`}
 >
 <Flame className={`w-4 h-4 ${subTab === "formboard" ? "text-amber-200" : "text-amber-700"}`} />
 <span className="sm:hidden">Phong Độ</span>
 <span className="hidden sm:inline">BXH Phong Độ 5 Trận</span>
 </button>
 </div>

 {/* ========================================================= */}
 {/* NỘI DUNG TƯƠNG ỨNG THEO SUBTAB */}
 {/* ========================================================= */}
 <div className="w-full">
 {subTab === "tournaments" && (
 <TournamentLeaderboard
 user={user}
 onBackToHome={() => onNavigateTab?.("matchmaking")}
 onRequestLogin={onOpenAuth ? () => onOpenAuth("login", "PLAYER") : undefined}
 />
 )}

 {subTab === "organizer" && (
 <TournamentOrganizerPortal
  user={user}
  onNavigateTab={onNavigateTab}
  onStartDm={onStartDm}
  onOpenTournamentChat={onOpenTournamentChat}
  onOpenBracket={() => setSubTab("tournaments")}
  />
 )}

 {subTab === "formboard" && (
 <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
 <Flame className="w-4 h-4 text-amber-700" />
 Bảng Phong Độ (lịch sử thật, không điểm số)
 </h3>
 <span className="text-[11px] text-slate-500">Top {formBoard.length} đội • xếp theo tỷ lệ thắng</span>
 </div>
 {formBoard.length === 0 ? (
 <p className="text-xs text-slate-500 py-4 text-center">
 Chưa có đội nào có lịch sử thi đấu. Nhập kết quả trận đấu trong giải để bảng tự cập nhật.
 </p>
 ) : (
 <div className="overflow-x-auto -mx-1 px-1">
 <table className="w-full text-xs border-collapse min-w-[520px]">
 <thead>
 <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 ">
 <th scope="col" className="py-2 pr-2 font-bold">#</th>
 <th scope="col" className="py-2 pr-2 font-bold">Đội Bóng</th>
 <th scope="col" className="py-2 pr-2 font-bold">5 Trận Gần Nhất</th>
 <th scope="col" className="py-2 pr-2 font-bold text-center">T-H-B</th>
 <th scope="col" className="py-2 font-bold text-right">Thắng</th>
 </tr>
 </thead>
 <tbody>
 {formBoard.map((r: any) => (
 <tr key={r.teamName ?? r.name ?? r.rank} className="border-b border-slate-100 last:border-0">
 <td className="py-2.5 pr-2 font-black text-slate-500">{r.rank}</td>
 <td className="py-2.5 pr-2 font-bold text-slate-900 truncate max-w-[160px]">{r.teamName ?? r.name ?? "—"}</td>
 <td className="py-2.5 pr-2"><FormDots form={r.form} size="sm" /></td>
 <td className="py-2.5 pr-2 text-center font-mono font-bold text-slate-600 ">{r.record ?? "0-0-0"}</td>
 <td className="py-2.5 text-right font-mono font-black text-emerald-700 ">{r.winRate ?? 0}%</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
  </div>
 )}
 </div>
 </div>
 );
}
