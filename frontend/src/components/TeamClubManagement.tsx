"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
 Users,
 Trophy,
 Calendar,
 Search,
 Loader2,
 UserPlus,
 ChevronRight,
 Shield
} from "lucide-react";
import { fetchTournaments, sportLabel } from "@/lib/tournamentService";

interface TeamClubManagementProps {
 user?: any;
 onBackToHome?: () => void;
 onNavigateTab?: (tab: string) => void;
}

/**
 * Quản lý đội bóng — toàn bộ dữ liệu lấy từ CSDL:
 * - Danh sách đội = các đội bạn làm đội trưởng (đăng ký vào giải, bảng tournament_teams embed trong tournament).
 * - Thành viên = các tài khoản cộng đồng có số điện thoại khớp (hệ thống không lưu danh sách cầu thủ theo đội nên hiển thị theo phong độ/địa bàn).
 * - Lịch đấu = các trận có đội của bạn trong bracketJson của giải.
 * Không có sổ quỹ trong hệ thống nên tab "Quỹ Đội" bị gỡ, không bịa số liệu.
 */
export default function TeamClubManagement({
 user,
 onBackToHome,
 onNavigateTab
}: TeamClubManagementProps) {
 const [activeSubTab, setActiveSubTab] = useState<"roster" | "matches">("roster");
 const [searchMember, setSearchMember] = useState("");
 const [tournaments, setTournaments] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const myPhone = (user?.phone ?? "").toString().replace(/\s/g, "");

 useEffect(() => {
 let alive = true;
 (async () => {
 try {
 const data = await fetchTournaments();
 if (alive) setTournaments(Array.isArray(data) ? data : []);
 } catch (e: any) {
 if (alive) setError(e?.message || "Không tải được danh sách giải");
 } finally {
 if (alive) setLoading(false);
 }
 })();
 return () => {
 alive = false;
 };
 }, []);

 // Đội của tôi: các đội mà tôi là đội trưởng (theo số điện thoại đăng ký)
 const myTeams = useMemo(() => {
 if (!myPhone) return [];
 const out: any[] = [];
 for (const t of tournaments) {
 for (const z of t.teams ?? []) {
 if (String(z.captainPhone ?? "").replace(/\s/g, "") !== myPhone) continue;
 out.push({ ...z, tournament: t });
 }
 }
 return out;
 }, [tournaments, myPhone]);

 const primaryTeam = myTeams[0] ?? null;

 // Lịch đấu: quét bracket của các giải có đội của tôi
 const myMatches = useMemo(() => {
 const out: any[] = [];
 if (!primaryTeam?.teamName) return out;
 for (const t of tournaments) {
 const team = (t.teams ?? []).find(
 (z: any) => String(z.captainPhone ?? "").replace(/\s/g, "") === myPhone
 );
 if (!team?.teamName || !t.bracketJson) continue;
 let bracket: any = null;
 try {
 bracket = JSON.parse(t.bracketJson);
 } catch {
 continue;
 }
 if (!Array.isArray(bracket?.rounds)) continue;
 for (const r of bracket.rounds) {
 for (const m of r.matches ?? []) {
 if (!m.teamA || !m.teamB) continue;
 const isA = m.teamA.name === team.teamName;
 const isB = m.teamB.name === team.teamName;
 if (!isA && !isB) continue;
 out.push({
 id: `${t.id}-${m.matchId}`,
 round: r.name ?? r.roundName ?? "Vòng",
 date: m.matchDate ?? "—",
 time: m.timeSlot ?? "—",
 pitch: m.pitchName ?? t.pitchName ?? t.location ?? "Chưa xếp sân",
 myTeam: isA ? m.teamA.name : m.teamB.name,
 opponent: isA ? m.teamB.name : m.teamA.name,
 status: m.status ?? "PENDING",
 score:
 m.status === "DONE" ? `${m.scoreA ?? 0} - ${m.scoreB ?? 0}` : "Chưa đấu",
 format: sportLabel(t.sportType)
 });
 }
 }
 }
 return out;
 }, [tournaments, primaryTeam, myPhone]);

 const subTabs = [
 { key: "roster", label: "Đội & Thành Viên", icon: Users },
 { key: "matches", label: "Lịch Đấu", icon: Calendar }
 ] as const;

 return (
 <div className="space-y-3 sm:space-y-6">
 {/* HEADER — thông tin đội thật */}
 <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm p-3 sm:p-7">
 {loading ? (
 <div className="flex items-center justify-center gap-2 py-8 sm:py-10 text-slate-500">
 <Loader2 className="w-5 h-5 animate-spin" /> Đang tải đội bóng của bạn…
 </div>
 ) : error ? (
 <p className="py-6 text-center text-sm text-rose-600">{error}</p>
 ) : primaryTeam ? (
 <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
 <div className="w-16 h-16 rounded-2xl bg-[#0369a1]/10 text-emerald-500 flex items-center justify-center text-lg sm:text-2xl shrink-0">
 <Shield className="w-8 h-8" />
 </div>
 <div className="min-w-0 flex-1">
 <h2 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
 {primaryTeam.teamName}
 </h2>
 <p className="text-xs text-slate-500 mt-0.5">
 Giải đang tham gia: {primaryTeam.tournament?.title || "—"} •{" "}
 {primaryTeam.tournament?.location || primaryTeam.tournament?.pitchName || "Chưa xếp sân"}
 </p>
 </div>
 <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
 <div>
 <p className="text-lg sm:text-xl font-black text-emerald-500 font-mono">
 {primaryTeam.record ?? "0-0-0"}
 </p>
 <p className="text-[10px] text-slate-500 uppercase font-bold">Thành Tích (T-H-B)</p>
 </div>
 <div>
 <p className="text-lg sm:text-xl font-black text-slate-900 font-mono">
 {primaryTeam.memberCount ?? "—"}
 </p>
 <p className="text-[10px] text-slate-500 uppercase font-bold">Thành Viên</p>
 </div>
 <div>
 <p className="text-lg sm:text-xl font-black text-slate-900 font-mono">
 {myTeams.length}
 </p>
 <p className="text-[10px] text-slate-500 uppercase font-bold">Giải Đã Đăng Ký</p>
 </div>
 </div>
 </div>
 ) : (
 <div className="py-6 text-center space-y-3">
 <p className="text-sm text-slate-600 ">
 Bạn chưa làm đội trưởng của đội nào trong hệ thống.
 </p>
 <p className="text-xs text-slate-500">
 Đăng ký đội khi tham gia một giải đấu — số điện thoại của bạn sẽ được dùng để liên kết đội.
 </p>
 <button
 type="button"
 onClick={() => onNavigateTab?.("tournaments")}
 className="px-5 py-2.5 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-xs inline-flex items-center gap-1.5"
 >
 Xem Giải Đấu <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 )}
 </div>

 {/* SUB TABS */}
 <div className="flex items-center gap-2 overflow-x-auto pb-1">
 {subTabs.map((tab) => (
 <button
 key={tab.key}
 type="button"
 onClick={() => setActiveSubTab(tab.key)}
 className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
 activeSubTab === tab.key
 ? "bg-[#0369a1] text-white"
 : "bg-white text-slate-600 border border-slate-200 "
 }`}
 >
 <tab.icon className="w-3.5 h-3.5 inline mr-1.5" />
 {tab.label}
 </button>
 ))}
 </div>

 {activeSubTab === "roster" && (
 <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
 <div className="p-3 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
 <h3 className="font-black text-slate-900 ">Danh Sách Đội Của Bạn</h3>
 <div className="relative">
 <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 value={searchMember}
 onChange={(e) => setSearchMember(e.target.value)}
 placeholder="Lọc theo tên đội hoặc giải…"
 className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs w-full sm:w-72"
 />
 </div>
 </div>
 {myTeams.length === 0 ? (
 <p className="p-4 sm:p-8 text-center text-sm text-slate-500">Chưa có đội nào.</p>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead className="bg-slate-50 ">
 <tr className="text-left text-slate-500">
 <th className="p-3 font-bold">Tên Đội</th>
 <th className="p-3 font-bold">Giải</th>
 <th className="p-3 font-bold">Số Người</th>
 <th className="p-3 font-bold">Phong Độ</th>
 <th className="p-3 font-bold">Trạng Thái</th>
 </tr>
 </thead>
 <tbody>
 {myTeams
 .filter(
 (z) =>
 !searchMember ||
 z.teamName
 .toLowerCase()
 .includes(searchMember.toLowerCase()) ||
 (z.tournament?.title ?? "")
 .toLowerCase()
 .includes(searchMember.toLowerCase())
 )
 .map((z, i) => (
 <tr
 key={`${z.tournament?.id}-${i}`}
 className="border-t border-slate-100 "
 >
 <td className="p-3 font-bold text-slate-900 ">
 {z.teamName}
 </td>
 <td className="p-3 text-slate-500">{z.tournament?.title || "—"}</td>
 <td className="p-3 font-mono">{z.memberCount ?? "—"}</td>
 <td className="p-3 font-mono text-emerald-500">
 {z.record && z.record !== "0-0-0" ? `${z.record} • ${z.winRate ?? 0}%` : "Tân binh"}
 </td>
 <td className="p-3">
 <span className="px-2 py-1 rounded-full bg-[#0369a1]/10 text-emerald-500 font-bold text-[10px]">
 {z.registrationStatus === "CONFIRMED"
 ? "Đã Xác Nhận"
 : z.registrationStatus === "PENDING_PAYMENT"
 ? "Chờ Thanh Toán"
 : z.registrationStatus || "—"}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 <p className="hidden sm:block p-3 sm:p-4 text-[11px] text-slate-500 border-t border-slate-200/80 ">
 Hệ thống liên kết đội theo số điện thoại đội trưởng. Danh sách cầu thủ từng người chưa được lưu riêng theo đội nên không hiển thị tại đây.
 </p>
 </div>
 )}

 {activeSubTab === "matches" && (
 <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
 <div className="p-3 sm:p-5 border-b border-slate-200/80 ">
 <h3 className="font-black text-slate-900 ">Lịch Đấu Của Đội</h3>
 </div>
 {myMatches.length === 0 ? (
 <p className="p-4 sm:p-8 text-center text-sm text-slate-500">
 Chưa có trận nào được xếp cho đội của bạn.
 </p>
 ) : (
 <div className="divide-y divide-slate-100 ">
 {myMatches.map((m) => (
 <div key={m.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
 <div className="flex-1 min-w-0">
 <p className="font-bold text-slate-900 text-sm">
 {m.myTeam} <span className="text-slate-500 font-normal">vs</span> {m.opponent}
 </p>
 <p className="text-[11px] text-slate-500 mt-0.5">
 {m.round} • {m.date} {m.time !== "—" ? `• ${m.time}` : ""} • {m.pitch}
 </p>
 </div>
 <div className="text-right shrink-0">
 <p className="font-mono font-black text-slate-900 ">
 {m.score}
 </p>
 <p
 className={`text-[10px] font-bold ${
 m.status === "DONE" ? "text-emerald-500" : "text-amber-700"
 }`}
 >
 {m.status === "DONE" ? "Đá Xong" : "Sắp Diễn Ra"}
 </p>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 );
}
