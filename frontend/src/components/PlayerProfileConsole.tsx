"use client";

import React, { useMemo, useState, useEffect } from "react";
import { toastOk, toastInfo, toastErr } from "@/lib/toast";
import AvatarUploader from "@/components/AvatarUploader";
import { resolveAvatarUrl } from "@/lib/avatar";
import SafeImage from "@/components/SafeImage";
import {
  ShieldCheck,
  Trophy,
  Award,
  Flame,
  Edit3,
  Swords,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Check,
  X,
  Target,
  Save,
  Crown,
  Camera,
  Heart,
  Building2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/lib/authService";
import { fetchTournaments, sportLabel } from "@/lib/tournamentService";
import { getAllPitchesApi } from "@/lib/pitchService";
import {
  getFavoritePitchIds,
  toggleFavoritePitch,
  subscribeFavorites,
} from "@/lib/favoritePitchService";
import FormDots from "./FormDots";

interface PlayerProfileConsoleProps {
  user?: UserProfile | null;
  onOpenAuth?: (mode: "login" | "register") => void;
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function PlayerProfileConsole({
  user: propUser,
  onOpenAuth,
  onNavigateTab,
}: PlayerProfileConsoleProps) {
  const { user: contextUser, updateProfile } = useAuth();
  const activeUser = propUser !== undefined ? propUser : contextUser;

  const [tournaments, setTournaments] = useState<any[]>([]);
  useEffect(() => {
    let alive = true;
    fetchTournaments()
      .then((list) => {
        if (alive) setTournaments(list as any[]);
      })
      .catch(() => {
        if (alive) setTournaments([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const [historyFilter, setHistoryFilter] = useState<"all" | "win" | "loss">("all");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [favPitches, setFavPitches] = useState<any[]>([]);

  useEffect(() => {
    setFavoriteIds(getFavoritePitchIds(activeUser?.id));
    const unsub = subscribeFavorites((ids) => {
      setFavoriteIds(ids);
    }, activeUser?.id);
    return unsub;
  }, [activeUser?.id]);

  useEffect(() => {
    let alive = true;
    getAllPitchesApi()
      .then((data) => {
        if (alive && Array.isArray(data)) {
          setFavPitches(data);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const myFavoriteList = useMemo(() => {
    return favPitches.filter((p) => favoriteIds.includes(Number(p.id)));
  }, [favPitches, favoriteIds]);

  const [isEditingInline, setIsEditingInline] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");

  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    area: "",
    favoriteSport: "",
    level: "",
    avatar: "",
    dominantFoot: "",
    jerseyNumber: "",
    height: "",
    weight: "",
    preferredTime: "",
    currentClub: "",
  });

  const profileErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!editForm.fullName.trim()) {
      errs.fullName = "Vui lòng nhập họ và tên.";
    } else if (editForm.fullName.trim().length < 2) {
      errs.fullName = "Họ và tên tối thiểu 2 ký tự.";
    }
    if (editForm.phone.trim() && !/^0[0-9]{9}$/.test(editForm.phone.trim())) {
      errs.phone = "Số điện thoại phải gồm 10 chữ số (bắt đầu bằng 0).";
    }
    if (editForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
      errs.email = "Email không hợp lệ (VD: cauthu@gmail.com).";
    }
    if (editForm.jerseyNumber.trim()) {
      const num = parseInt(editForm.jerseyNumber, 10);
      if (!Number.isFinite(num) || num < 0 || num > 99) {
        errs.jerseyNumber = "Số áo hợp lệ từ 0 đến 99.";
      }
    }
    return errs;
  }, [editForm]);
  const isProfileValid = Object.keys(profileErrors).length === 0;

  useEffect(() => {
    if (activeUser) {
      setEditForm((prev) => ({
        ...prev,
        fullName: activeUser.fullName || "",
        email: activeUser.email || "",
        phone: activeUser.phone || "",
        position: activeUser.position || "",
        area: activeUser.area || "",
        favoriteSport: activeUser.favoriteSport || "football",
        level: activeUser.level || "",
        avatar: activeUser.avatar || "",
        dominantFoot: activeUser.dominantFoot || "",
        jerseyNumber: activeUser.jerseyNumber || "",
        height: activeUser.height || "",
        weight: activeUser.weight || "",
        preferredTime: activeUser.preferredTime || "",
        currentClub: activeUser.currentClub || "",
      }));
    }
  }, [activeUser]);

  const handleToggleEdit = () => {
    if (!activeUser) {
      if (onOpenAuth) {
        onOpenAuth("login");
      } else {
        toastInfo("Vui lòng đăng nhập để cập nhật hồ sơ cầu thủ!");
      }
      return;
    }
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
    setIsEditingInline(!isEditingInline);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfileValid) return;
    setIsSaving(true);
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
    try {
      await updateProfile(editForm);
      setSaveSuccessMsg("Đã lưu hồ sơ cầu thủ thành công!");
      toastOk("Đã cập nhật hồ sơ cầu thủ!");
      setTimeout(() => {
        setIsEditingInline(false);
        setSaveSuccessMsg("");
      }, 900);
    } catch (err: any) {
      setSaveErrorMsg(err?.message || "Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAvatarUploaded = async (url: string) => {
    try {
      await updateProfile({ avatar: url });
      setEditForm((prev) => ({ ...prev, avatar: url }));
      toastOk("Đã đổi ảnh đại diện thành công!");
    } catch (err: any) {
      toastErr(err?.message || "Không thể cập nhật ảnh đại diện.");
    }
  };

  const displayFullName = editForm.fullName || activeUser?.fullName || "Chưa cập nhật tên";
  const displayEmail = editForm.email || activeUser?.email || "—";
  const displayPhone = editForm.phone || activeUser?.phone || "Chưa khai báo SĐT";
  const displayRole =
    activeUser?.role === "OWNER"
      ? "Chủ Sân"
      : activeUser?.role === "ORGANIZER"
      ? "Ban Tổ Chức"
      : activeUser?.role === "ADMIN"
      ? "Quản Trị"
      : "Cầu Thủ";
  const displayPosition = editForm.position || "Chưa khai báo";
  const displayArea = editForm.area || "Chưa khai báo khu vực";
  const displayLevel = editForm.level || "Nghiệp dư";
  const displayAvatar = editForm.avatar || activeUser?.avatar;
  const avatarImgUrl = resolveAvatarUrl(displayAvatar);
  const isAvatarUrl = !!avatarImgUrl;
  const initials = displayFullName
    ? displayFullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "CT";

  const perf = useMemo(() => {
    const myPhone = (activeUser?.phone ?? "").toString().replace(/\s/g, "");
    const result = {
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      myTeamName: null as string | null,
      titles: 0,
      history: [] as any[],
    };
    if (!myPhone) return result;

    for (const t of tournaments) {
      const myTeam = (t.teams ?? []).find(
        (z: any) => String(z.captainPhone ?? "").replace(/\s/g, "") === myPhone
      );
      if (!myTeam?.teamName || !t.bracketJson) continue;
      if (!result.myTeamName) result.myTeamName = myTeam.teamName;

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
          const isA = m.teamA.name === myTeam.teamName;
          const isB = m.teamB.name === myTeam.teamName;
          if (!isA && !isB) continue;

          if (m.status !== "DONE") {
            result.history.push({
              id: `${t.id}-${m.matchId}`,
              date: m.matchDate ?? "",
              time: m.timeSlot ?? "",
              pitch: m.pitchName ?? t.pitchName ?? t.location ?? "Chưa xếp sân",
              format: sportLabel(t.sportType),
              result: "upcoming",
              score: "vs",
              myTeam: m.teamA.name,
              opponent: m.teamB.name,
              tournamentTitle: t.title,
            });
            continue;
          }

          const sa = m.scoreA ?? 0;
          const sb = m.scoreB ?? 0;
          const myScore = isA ? sa : sb;
          const oppScore = isA ? sb : sa;
          result.matches += 1;
          result.goalsFor += myScore;
          result.goalsAgainst += oppScore;
          if (myScore > oppScore) result.wins += 1;
          else if (myScore < oppScore) result.losses += 1;
          else result.draws += 1;
          if (oppScore === 0) result.cleanSheets += 1;

          result.history.push({
            id: `${t.id}-${m.matchId}`,
            date: m.matchDate ?? "",
            time: m.timeSlot ?? "",
            pitch: m.pitchName ?? t.pitchName ?? t.location ?? "Chưa xếp sân",
            format: sportLabel(t.sportType),
            result: myScore > oppScore ? "win" : myScore < oppScore ? "loss" : "draw",
            score: `${sa} - ${sb}`,
            myTeam: m.teamA.name,
            opponent: m.teamB.name,
            tournamentTitle: t.title,
          });
        }
      }

      const lastRound = [...bracket.rounds]
        .reverse()
        .find((r: any) =>
          (r.matches ?? []).some(
            (m: any) =>
              m.status !== "BYE" &&
              (m.teamA?.name === myTeam.teamName || m.teamB?.name === myTeam.teamName)
          )
        );
      const finalMatch = lastRound?.matches?.find(
        (m: any) =>
          m.status !== "BYE" &&
          (m.teamA?.name === myTeam.teamName || m.teamB?.name === myTeam.teamName)
      );
      if (finalMatch?.status === "DONE" && finalMatch.winner === myTeam.teamName) {
        result.titles += 1;
      }
    }

    result.history.sort((a: any, b: any) => {
      const ts = (m: any) => {
        if (!m?.date) return -1;
        const d = new Date(`${m.date}T${(m.time || "00:00").split(" - ")[0] || "00:00"}`);
        const n = d.getTime();
        return Number.isNaN(n) ? -1 : n;
      };
      return ts(b) - ts(a);
    });
    return result;
  }, [tournaments, activeUser?.phone]);

  const totalDecided = perf.wins + perf.losses + perf.draws;
  const winRate = totalDecided ? Math.round((perf.wins / totalDecided) * 1000) / 10 : 0;
  const goalDiff = perf.goalsFor - perf.goalsAgainst;
  const recentForm = perf.history.filter((h: any) => h.result !== "upcoming").slice(0, 5);
  const formStr = recentForm
    .map((h: any) => (h.result === "win" ? "W" : h.result === "loss" ? "L" : "D"))
    .join("");
  const recordStr = `${perf.wins}-${perf.draws}-${perf.losses}`;

  const filteredMatches = perf.history.filter((m) => {
    if (historyFilter === "win") return m.result === "win";
    if (historyFilter === "loss") return m.result === "loss" || m.result === "draw";
    return true;
  });

  return (
    <div className="w-full text-slate-900 space-y-4 pb-12">
      {/* 1. HỒ SƠ CÁ NHÂN & THÔNG SỐ CẦU THỦ */}
      <section className="bg-white rounded-lg border border-slate-300 p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
            <div className="flex flex-col items-center sm:items-start gap-1.5 shrink-0">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-[#0369a1] text-white font-bold text-2xl flex items-center justify-center border-2 border-slate-200 overflow-hidden shadow-xs">
                  {isAvatarUrl ? (
                    <SafeImage
                      src={avatarImgUrl}
                      alt={displayFullName}
                      className="w-full h-full object-cover"
                      fallbackLabel="Ảnh đại diện"
                    />
                  ) : (
                    <span>{displayAvatar || initials}</span>
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-md border-2 border-white shadow-xs"
                  title="Đã xác thực tài khoản"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Nút Đổi Avatar Nhanh */}
              <AvatarUploader
                compact
                onUploaded={handleQuickAvatarUploaded}
                label="Đổi Avatar"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{displayFullName}</h1>
                <span className="px-2.5 py-0.5 rounded text-[13px] font-bold bg-sky-50 text-[#0369a1] border border-sky-200">
                  {displayRole}
                </span>
                {activeUser?.isClubRep && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[13px] font-bold">
                    <Crown className="w-3.5 h-3.5" /> Đại diện CLB
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[14px] text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#0369a1]" />
                  <span>{displayEmail}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#0369a1]" />
                  <span>{displayPhone}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0369a1]" />
                  <span>{displayArea}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleEdit}
              className={`px-4 py-2 rounded-md border text-[14px] font-bold flex items-center gap-1.5 cursor-pointer ${
                isEditingInline
                  ? "border-[#0369a1] bg-sky-50 text-[#0369a1]"
                  : "border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
              }`}
            >
              <Edit3 className="w-4 h-4 text-[#0369a1]" />
              <span>{isEditingInline ? "Đóng Chỉnh Sửa" : "Chỉnh Sửa Hồ Sơ"}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab("matchmaking")}
              className="px-4 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white text-[14px] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>Tìm Kèo Đấu</span>
            </button>
          </div>
        </div>

        {/* 6 Ô THÔNG SỐ CÁ NHÂN GỌN GÀNG & TRỰC QUAN */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-[13px]">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-semibold block text-[13px]">🧤 Vị trí sở trường</span>
            <p className="font-extrabold text-slate-900 mt-1 truncate">{displayPosition}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-semibold block text-[13px]">⭐ Trình độ thi đấu</span>
            <p className="font-extrabold text-slate-900 mt-1 truncate">{displayLevel}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-semibold block text-[13px]">👟 Chân & Số áo</span>
            <p className="font-extrabold text-slate-900 mt-1 truncate">
              {editForm.dominantFoot || "Chưa khai báo"}
              {editForm.jerseyNumber ? ` • #${editForm.jerseyNumber}` : ""}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-semibold block text-[13px]">📏 Chiều cao / Cân nặng</span>
            <p className="font-extrabold text-slate-900 mt-1 truncate">
              {editForm.height || "—"} / {editForm.weight || "—"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-semibold block text-[13px]">⏰ Giờ thường đá</span>
            <p className="font-extrabold text-slate-900 mt-1 truncate">
              {editForm.preferredTime || "Chưa khai báo"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-semibold block text-[13px]">🛡️ Câu lạc bộ</span>
            <p className="font-extrabold text-slate-900 mt-1 truncate">
              {editForm.currentClub || perf.myTeamName || "Chưa khai báo"}
            </p>
          </div>
        </div>

        {/* FORM CHỈNH SỬA INLINE */}
        {isEditingInline && (
          <form
            onSubmit={handleSaveProfile}
            className="pt-4 border-t border-slate-200 space-y-4 text-[14px]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Cập Nhật Hồ Sơ Cầu Thủ</h3>
              <button
                type="button"
                onClick={() => setIsEditingInline(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4" />
                {saveSuccessMsg}
              </div>
            )}
            {saveErrorMsg && (
              <div className="p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                {saveErrorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md border bg-white focus:outline-none focus:ring-2 ${
                    profileErrors.fullName && editForm.fullName ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
                  }`}
                />
                {profileErrors.fullName && editForm.fullName && (
                  <p className="mt-1 text-[13px] font-semibold text-rose-600">{profileErrors.fullName}</p>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="cauthu@gmail.com"
                  className={`w-full px-3 py-2 rounded-md border bg-white focus:outline-none focus:ring-2 ${
                    profileErrors.email && editForm.email ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
                  }`}
                />
                {profileErrors.email && editForm.email && (
                  <p className="mt-1 text-[13px] font-semibold text-rose-600">{profileErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="0909…"
                  className={`w-full px-3 py-2 rounded-md border bg-white focus:outline-none focus:ring-2 ${
                    profileErrors.phone && editForm.phone ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
                  }`}
                />
                {profileErrors.phone && editForm.phone && (
                  <p className="mt-1 text-[13px] font-semibold text-rose-600">{profileErrors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Khu vực hoạt động</label>
                <input
                  type="text"
                  value={editForm.area}
                  onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                  placeholder="Ví dụ: Hải Châu, Đà Nẵng"
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Vị trí sở trường</label>
                <input
                  type="text"
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  placeholder="Tiền vệ / Hậu vệ / Tiền đạo"
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Trình độ</label>
                <select
                  value={editForm.level}
                  onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                >
                  <option value="Mới bắt đầu">Mới bắt đầu</option>
                  <option value="Nghiệp dư">Nghiệp dư</option>
                  <option value="Bán chuyên">Bán chuyên</option>
                  <option value="Chuyên nghiệp / Cựu tuyển">Chuyên nghiệp / Cựu tuyển</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Chân thuận</label>
                <select
                  value={editForm.dominantFoot}
                  onChange={(e) => setEditForm({ ...editForm, dominantFoot: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                >
                  <option value="">Chưa chọn</option>
                  <option value="Chân Phải">Chân Phải</option>
                  <option value="Chân Trái">Chân Trái</option>
                  <option value="Hai Chân">Hai Chân</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Số áo ưa thích (0-99)</label>
                <input
                  type="text"
                  value={editForm.jerseyNumber}
                  onChange={(e) => setEditForm({ ...editForm, jerseyNumber: e.target.value.replace(/[^0-9]/g, "") })}
                  placeholder="10"
                  className={`w-full px-3 py-2 rounded-md border bg-white focus:outline-none focus:ring-2 ${
                    profileErrors.jerseyNumber && editForm.jerseyNumber ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-[#0369a1]"
                  }`}
                />
                {profileErrors.jerseyNumber && editForm.jerseyNumber && (
                  <p className="mt-1 text-[13px] font-semibold text-rose-600">{profileErrors.jerseyNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Chiều cao</label>
                <input
                  type="text"
                  value={editForm.height}
                  onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                  placeholder="1m72"
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Cân nặng</label>
                <input
                  type="text"
                  value={editForm.weight}
                  onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                  placeholder="68kg"
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Đội bóng / CLB hiện tại</label>
                <input
                  type="text"
                  value={editForm.currentClub}
                  onChange={(e) => setEditForm({ ...editForm, currentClub: e.target.value })}
                  placeholder="FC Hải Châu"
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Ảnh đại diện</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editForm.avatar}
                    onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                    placeholder="URL ảnh..."
                    className="flex-1 min-w-0 px-3 py-2 rounded-md border border-slate-300 bg-white focus:border-[#0369a1] outline-none"
                  />
                  <AvatarUploader
                    compact
                    onUploaded={(url) => setEditForm({ ...editForm, avatar: url })}
                    label="Tải ảnh"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingInline(false)}
                className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving || !isProfileValid}
                className="px-5 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Đang lưu..." : "Lưu Hồ Sơ"}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 2. THỐNG KÊ THÀNH TÍCH THI ĐẤU (4 Ô NGANG) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[13px] font-bold text-slate-600">
            <span>Số trận đã đá</span>
            <Target className="w-4 h-4 text-[#0369a1]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{perf.matches}</span>
            <span className="text-[13px] font-semibold text-slate-600">
              ({recordStr} T-H-B • Thắng {winRate}%)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[13px] font-bold text-slate-600">
            <span>Phong độ 5 trận gần nhất</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <FormDots form={formStr} />
            <span className="text-[13px] font-mono font-bold text-slate-700">
              Hiệu số {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[13px] font-bold text-slate-600">
            <span>Bàn thắng & Giữ sạch lưới</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-slate-900 font-mono">{perf.goalsFor} bàn</span>
            <span className="text-[13px] font-semibold text-slate-600">
              • {perf.cleanSheets} trận sạch lưới
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[13px] font-bold text-slate-600">
            <span>Danh hiệu giải đấu</span>
            <Trophy className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700 font-mono">{perf.titles} cúp</span>
            <span className="text-[13px] font-semibold text-slate-600 truncate">
              {perf.myTeamName ? `Đội ${perf.myTeamName}` : "Chưa đăng ký đội"}
            </span>
          </div>
        </div>
      </section>

      {/* 3. LỊCH SỬ TRẬN ĐẤU GIẢI */}
      <section className="bg-white rounded-lg border border-slate-300 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0369a1]" />
              Lịch Sử Thi Đấu Giải ({filteredMatches.length})
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-[13px] font-bold">
            {[
              { id: "all", label: "Tất cả" },
              { id: "win", label: "Trận thắng" },
              { id: "loss", label: "Hòa / Thua" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setHistoryFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-md border cursor-pointer ${
                  historyFilter === f.id
                    ? "bg-[#0369a1] text-white border-[#0369a1]"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-[14px]">
            Chưa có trận đấu nào trong mục này.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredMatches.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-md text-[13px] font-bold flex items-center justify-center shrink-0 ${
                      m.result === "win"
                        ? "bg-emerald-600 text-white"
                        : m.result === "draw"
                        ? "bg-amber-500 text-white"
                        : m.result === "loss"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {m.result === "win" ? "T" : m.result === "draw" ? "H" : m.result === "loss" ? "B" : "—"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 truncate">
                      <span>{m.myTeam}</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono text-[13px]">
                        {m.score}
                      </span>
                      <span>{m.opponent}</span>
                    </div>
                    <p className="text-[13px] text-slate-600 truncate mt-0.5">
                      {m.tournamentTitle} • {m.pitch} {m.date ? `• ${m.date}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. CỤM SÂN RUỘT / YÊU THÍCH CỦA BẠN */}
      <section className="bg-white rounded-lg border border-slate-300 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <span>Cụm Sân Yêu Thích Của Tôi ({myFavoriteList.length})</span>
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Các cụm sân bóng đá phong trào bạn đã thả tim để theo dõi ca trống và cọc sân nhanh
            </p>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab("booking")}
              className="px-3.5 py-1.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Building2 className="w-4 h-4" />
              <span>Khám Phá Thêm Cụm Sân</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {myFavoriteList.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-3 bg-slate-50/70 rounded-xl border border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-200">
              <Heart className="w-6 h-6 fill-rose-400 text-rose-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[15px] font-bold text-slate-900">Bạn chưa lưu cụm sân yêu thích nào</h3>
              <p className="text-[13px] text-slate-500 max-w-md mx-auto">
                Bấm vào biểu tượng trái tim ❤️ ở trang Danh Sách Sân hoặc Trang Chủ để đánh dấu cụm sân ruột, hệ thống sẽ ưu tiên hiển thị giờ trống cho bạn.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("booking")}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#0369a1] border border-slate-300 font-bold text-[13px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Tìm Sân Bóng Đà Nẵng Ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myFavoriteList.map((pitch) => (
              <div
                key={pitch.id}
                className="group bg-white rounded-xl border border-slate-200 hover:border-rose-300 hover:ring-1 hover:ring-rose-200 overflow-hidden flex flex-col justify-between shadow-xs transition-all"
              >
                <div>
                  <div className="relative h-36 bg-slate-100 overflow-hidden">
                    <SafeImage
                      src={pitch.imageUrl || "/images/copa-action.png"}
                      alt={pitch.name || "Sân bóng"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[13px] flex items-center gap-1 shadow-xs">
                        <Heart className="w-3 h-3 fill-white text-white" />
                        <span>Sân ruột</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const res = toggleFavoritePitch(pitch.id, activeUser?.id);
                        if (!res.isFavorite) {
                          toastInfo(`Đã bỏ "${pitch.name}" khỏi danh sách yêu thích.`);
                        }
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 hover:bg-white text-rose-600 border border-rose-200 shadow-xs cursor-pointer transition-transform hover:scale-110"
                      title="Bỏ yêu thích sân này"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    </button>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-[#0369a1] transition-colors truncate">
                      {pitch.name}
                    </h3>
                    <p className="text-[13px] text-slate-500 flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{pitch.address || pitch.location || "Đà Nẵng"}</span>
                    </p>
                    <div className="flex items-center gap-3 text-[13px] text-slate-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#0369a1]" />
                        <span>{pitch.openTime || "06:00"} - {pitch.closeTime || "23:00"}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[13px] text-slate-500 block">Giá từ</span>
                    <span className="text-[14px] font-mono font-bold text-[#0369a1]">
                      {Number(pitch.pricePerHour || pitch.priceDiscounted || 300000).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab("booking")}
                      className="px-3 py-1.5 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <span>Đặt Ca Ngay</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
