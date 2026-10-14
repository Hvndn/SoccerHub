"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Trophy,
  Award,
  Zap,
  Activity,
  Heart,
  Flame,
  Star,
  Share2,
  Edit3,
  Swords,
  Video,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Filter,
  Sparkles,
  Phone,
  Mail,
  Check,
  X,
  Target,
  CircleDot,
  Save,
  ArrowLeft,
  Footprints,
  Shirt,
  Scale,
  Ruler,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/lib/authService";

interface PlayerProfileConsoleProps {
  user?: UserProfile | null;
  onOpenAuth?: (mode: "login" | "register") => void;
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function PlayerProfileConsole({
  user: propUser,
  onOpenAuth,
  onBackToHome,
  onNavigateTab
}: PlayerProfileConsoleProps) {
  const { user: contextUser, updateProfile } = useAuth();
  const activeUser = propUser !== undefined ? propUser : contextUser;

  // Active Football Pitch Format Tab State
  const [activeFormat, setActiveFormat] = useState<"san7" | "san5" | "san11" | "futsal">("san7");

  // History Filter State
  const [historyFilter, setHistoryFilter] = useState<"all" | "win" | "loss" | "ai_video">("all");

  // In-page Edit Mode (Inline Mode - Tuyệt đối không dùng popup)
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");

  // Detailed Form State (Mở rộng toàn diện hồ sơ thể chất & bóng đá)
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    area: "",
    favoriteSport: "",
    level: "",
    avatar: "",
    dominantFoot: "Chân Phải",
    jerseyNumber: "10",
    height: "1m75",
    weight: "68 kg",
    preferredTime: "17:30 - 20:30 (Thứ 3, 5, 7, CN)",
    currentClub: "FC Brothers Đà Nẵng",
  });

  useEffect(() => {
    if (activeUser) {
      setEditForm(prev => ({
        ...prev,
        fullName: activeUser.fullName || "Hồ Văn Diện",
        email: activeUser.email || "",
        phone: activeUser.phone || "0947304321",
        position: activeUser.position || "Tiền vệ trung tâm (CM) / Hộ công",
        area: activeUser.area || "Đà Nẵng (Hải Châu / Cẩm Lệ)",
        favoriteSport: activeUser.favoriteSport || "football",
        level: activeUser.level || "Bán chuyên",
        avatar: activeUser.avatar || "",
      }));
    }
  }, [activeUser]);

  const handleToggleEdit = () => {
    if (!activeUser) {
      if (onOpenAuth) {
        onOpenAuth("login");
      } else {
        alert("Vui lòng đăng nhập để cập nhật hồ sơ cầu thủ!");
      }
      return;
    }
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
    setIsEditingInline(!isEditingInline);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
    try {
      await updateProfile(editForm);
      setSaveSuccessMsg("Đã lưu thành công toàn bộ hồ sơ chi tiết cầu thủ!");
      setTimeout(() => {
        setIsEditingInline(false);
        setSaveSuccessMsg("");
      }, 1200);
    } catch (err: any) {
      setSaveErrorMsg(err?.message || "Cập nhật thất bại. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper values
  const displayFullName = editForm.fullName || activeUser?.fullName || "Hồ Văn Diện";
  const displayEmail = editForm.email || activeUser?.email || "0947304321@phone.turfzone.vn";
  const displayPhone = editForm.phone || activeUser?.phone || "0947304321";
  const displayRole = activeUser?.role === "OWNER" ? "Chủ Sân" : activeUser?.role === "ORGANIZER" ? "Ban Tổ Chức" : "Cầu Thủ Phủi Pro";
  const displayElo = activeUser?.eloRating || 1450;
  const displayPosition = editForm.position || "Tiền vệ trung tâm (CM) / Hộ công";
  const displayArea = editForm.area || "Đà Nẵng (Hải Châu / Cẩm Lệ)";
  const displayLevel = editForm.level || "Bán chuyên";
  const displayAvatar = editForm.avatar || activeUser?.avatar;

  const isAvatarUrl = displayAvatar && (displayAvatar.startsWith("http://") || displayAvatar.startsWith("https://") || displayAvatar.startsWith("data:"));
  const initials = displayFullName
    ? displayFullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "HD";

  // Format stats config
  const formatStats = {
    san7: {
      title: "Bóng Đá Sân 7",
      elo: displayElo,
      tier: "Division 2 Phủi",
      badge: "Serie B Open",
      percentile: "Top 10% Đà Nẵng",
      ranking: "#42 Khu vực Hải Châu / Cẩm Lệ",
      matches: 48,
      wins: 33,
      losses: 15,
      winRate: "68.8%",
      goals: 24,
      assists: 19,
      cleanSheets: 6,
      streak: "5 Thắng",
      streakBadge: "🔥 On Fire",
      skills: [
        { name: "Kỹ năng Dứt điểm & Sút xa cầu môn", value: 86, color: "bg-emerald-500" },
        { name: "Tầm nhìn & Chuyền bóng kiến tạo", value: 92, color: "bg-blue-500" },
        { name: "Khả năng Tranh chấp & Thu hồi bóng", value: 78, color: "bg-amber-500" },
        { name: "Rê dắt & Thoát pressing cự ly hẹp", value: 84, color: "bg-purple-500" },
        { name: "Thể lực & Bền bỉ suốt 60-90 phút", value: 88, color: "bg-rose-500" },
      ],
      radarPoints: [
        { label: "Dứt điểm", val: "86/100" },
        { label: "Kiến tạo", val: "92/100" },
        { label: "Thể lực", val: "88/100" },
        { label: "Thu hồi", val: "78/100" },
        { label: "Pressing", val: "84/100" },
      ]
    },
    san5: {
      title: "Bóng Đá Sân 5",
      elo: 1390,
      tier: "Division 3 Mini",
      badge: "League F5 Pro",
      percentile: "Top 15% Toàn Thành",
      ranking: "#58 Sân Cỏ Nhân Tạo 5 Người",
      matches: 22,
      wins: 14,
      losses: 8,
      winRate: "63.6%",
      goals: 18,
      assists: 11,
      cleanSheets: 2,
      streak: "2 Thắng",
      streakBadge: "Ổn Định",
      skills: [
        { name: "Tốc độ bứt phá cự ly ngắn", value: 88, color: "bg-emerald-500" },
        { name: "Phản xạ chạm bóng bước 1 (First Touch)", value: 85, color: "bg-blue-500" },
        { name: "Dứt điểm nhanh mũi giày & chích bóng", value: 82, color: "bg-amber-500" },
        { name: "Ban bật tam giác 1 chạm", value: 90, color: "bg-purple-500" },
        { name: "Di chuyển không bóng áp sát", value: 80, color: "bg-rose-500" },
      ],
      radarPoints: [
        { label: "Tốc độ", val: "88/100" },
        { label: "1 Chạm", val: "90/100" },
        { label: "Chích bóng", val: "82/100" },
        { label: "Bọc lót", val: "79/100" },
        { label: "Nhịp tim", val: "85/100" },
      ]
    },
    san11: {
      title: "Bóng Đá Sân 11",
      elo: 1420,
      tier: "Division 2 Sân Lớn",
      badge: "Cup 11 Người",
      percentile: "Top 12% CLB Phong Trào",
      ranking: "#31 Sân 11 Cỏ Tự Nhiên / Nhân Tạo",
      matches: 16,
      wins: 11,
      losses: 5,
      winRate: "68.7%",
      goals: 5,
      assists: 14,
      cleanSheets: 4,
      streak: "3 Thắng",
      streakBadge: "Chuỗi Thắng",
      skills: [
        { name: "Phát động tấn công & Chuyền dài vượt tuyến", value: 91, color: "bg-emerald-500" },
        { name: "Ý thức chiến thuật & Giữ cự ly đội hình", value: 89, color: "bg-blue-500" },
        { name: "Đánh chặn từ xa trước vòng cấm", value: 83, color: "bg-amber-500" },
        { name: "Không chiến & Tranh chấp bóng bổng", value: 75, color: "bg-purple-500" },
        { name: "Năng lượng & Thể lực phủ kín 90 phút", value: 86, color: "bg-rose-500" },
      ],
      radarPoints: [
        { label: "Chuyền dài", val: "91/100" },
        { label: "Chiến thuật", val: "89/100" },
        { label: "Đánh chặn", val: "83/100" },
        { label: "Không chiến", val: "75/100" },
        { label: "Bền bỉ", val: "86/100" },
      ]
    },
    futsal: {
      title: "Futsal Sàn Gỗ / Trong Nhà",
      elo: 1360,
      tier: "Division 3 Sàn Gỗ",
      badge: "Indoor Cup",
      percentile: "Top 20% Người Chơi Futsal",
      ranking: "#45 Sàn Futsal Nhà Thi Đấu",
      matches: 12,
      wins: 7,
      losses: 5,
      winRate: "58.3%",
      goals: 9,
      assists: 8,
      cleanSheets: 1,
      streak: "1 Thắng",
      streakBadge: "Cân Bằng",
      skills: [
        { name: "Kéo gầm giày & Giữ nhịp bóng sàn cứng", value: 88, color: "bg-emerald-500" },
        { name: "Xoay xở phạm vi hẹp 1 vs 1", value: 84, color: "bg-blue-500" },
        { name: "Chuyền chọc khe bất ngờ mũi chân", value: 86, color: "bg-amber-500" },
        { name: "Chuyển trạng thái công thủ chớp nhoáng", value: 81, color: "bg-purple-500" },
        { name: "Phòng ngự khối kim cương Futsal", value: 77, color: "bg-rose-500" },
      ],
      radarPoints: [
        { label: "Gầm giày", val: "88/100" },
        { label: "Xoay hẹp", val: "84/100" },
        { label: "Chọc khe", val: "86/100" },
        { label: "Phòng thủ", val: "77/100" },
        { label: "Phản xạ", val: "81/100" },
      ]
    }
  };

  const currentStat = formatStats[activeFormat];

  // Match history mock for football
  const matchHistory = [
    {
      id: "M-902",
      date: "05/10/2026",
      time: "19:00 - 20:30",
      pitch: "Sân Bóng Chuyên Nghiệp Tuyên Sơn - Sân 7A",
      format: "Bóng Đá Sân 7",
      result: "win",
      score: "5 - 3",
      myTeam: "FC Brothers Đà Nẵng",
      opponent: "FC Cựu Cầu Thủ Cẩm Lệ",
      eloChange: "+18",
      mvp: true,
      stats: "2 Bàn thắng, 1 Kiến tạo • MVP Trận Đấu",
      hasAiVideo: true,
    },
    {
      id: "M-889",
      date: "02/10/2026",
      time: "18:30 - 20:00",
      pitch: "Sân Cỏ Nhân Tạo Hòa Xuân - Sân 7 số 3",
      format: "Bóng Đá Sân 7",
      result: "win",
      score: "4 - 2",
      myTeam: "FC Brothers Đà Nẵng",
      opponent: "FC Doanh Nhân Hải Châu",
      eloChange: "+15",
      mvp: false,
      stats: "1 Bàn thắng, 2 Kiến tạo • 87% chuyền chính xác",
      hasAiVideo: true,
    },
    {
      id: "M-874",
      date: "28/09/2026",
      time: "20:00 - 21:30",
      pitch: "Sân Bóng Đá Quân Khu 5 - Sân 7 VIP",
      format: "Bóng Đá Sân 7",
      result: "loss",
      score: "2 - 3",
      myTeam: "FC Brothers Đà Nẵng",
      opponent: "FC Thanh Niên Cẩm Lệ",
      eloChange: "-12",
      mvp: false,
      stats: "1 Bàn thắng • Tranh chấp 12/15 thành công",
      hasAiVideo: false,
    },
    {
      id: "M-860",
      date: "24/09/2026",
      time: "17:30 - 19:00",
      pitch: "Sân Bóng Làng Thể Thao Tuyên Sơn - Sân 5 số 2",
      format: "Bóng Đá Sân 5",
      result: "win",
      score: "7 - 4",
      myTeam: "FC Brothers Đà Nẵng",
      opponent: "FC Sinh Viên Duy Tân",
      eloChange: "+14",
      mvp: true,
      stats: "3 Bàn thắng (Hat-trick) • MVP Trận Đấu",
      hasAiVideo: true,
    },
    {
      id: "M-845",
      date: "19/09/2026",
      time: "19:00 - 20:30",
      pitch: "Sân Cỏ Tự Nhiên Quân Khu 5 - Sân 11",
      format: "Bóng Đá Sân 11",
      result: "win",
      score: "2 - 1",
      myTeam: "CLB Phong Trào Hải Châu",
      opponent: "FC Ngân Hàng BIDV ĐN",
      eloChange: "+22",
      mvp: false,
      stats: "Thi đấu trọn 90 phút • 2 Cứu thua vạch vôi",
      hasAiVideo: false,
    }
  ];

  const filteredMatches = matchHistory.filter(m => {
    if (historyFilter === "win") return m.result === "win";
    if (historyFilter === "loss") return m.result === "loss";
    if (historyFilter === "ai_video") return m.hasAiVideo;
    return true;
  });

  return (
    <div className="w-full text-slate-900 dark:text-slate-100 transition-colors space-y-6 pb-20">
      {/* ========================================================= */}
      {/* HEADER COCKPIT: BẢN HỒ SƠ CẦU THỦ CHI TIẾT TOÀN DIỆN      */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Banner ngầm tinh tế */}
        <div className="relative min-h-[5.5rem] sm:h-32 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 px-4 sm:px-8 py-3 flex items-center justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10 max-w-full">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">HỆ THỐNG ĐỊNH DANH CẦU THỦ CHUYÊN NGHIỆP • SOCCERHUB PRO</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-emerald-200/70 font-mono shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Đồng bộ Elo VFF Phủi 4.0
            </span>
          </div>
        </div>

        {/* Hàng thông tin chính */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
            
            {/* Bên trái: Avatar + Tên + Thông tin liên hệ */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
              {/* Avatar Box */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl sm:text-3xl lg:text-4xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800 overflow-hidden">
                  {isAvatarUrl ? (
                    <img
                      src={displayAvatar}
                      alt={displayFullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 sm:p-1.5 rounded-xl shadow-md border-2 border-white dark:border-slate-900" title="Tài khoản đã xác minh căn cước & số điện thoại">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Tên & Meta */}
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {displayFullName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {displayRole}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    Elo {displayElo}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 sm:gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium break-all">
                    <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate max-w-[220px] sm:max-w-none">{displayEmail}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium shrink-0">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    {displayPhone}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {displayArea}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 pt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Vị trí: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{displayPosition}</span>
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>Trình độ: <strong className="text-slate-800 dark:text-slate-200">{displayLevel}</strong></span>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium w-full sm:w-auto">Trạng thái: Sẵn sàng nhận kèo</span>
                </div>
              </div>
            </div>

            {/* Bên phải: Nút thao tác */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 lg:pt-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleToggleEdit}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm min-h-[42px] ${
                    isEditingInline
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{isEditingInline ? "Đóng Form" : "Chỉnh Sửa Hồ Sơ"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Đã sao chép liên kết hồ sơ cầu thủ SoccerHub!");
                  }}
                  className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-all shadow-sm shrink-0 min-h-[42px] min-w-[42px] flex items-center justify-center"
                  title="Chia sẻ hồ sơ"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab("community");
                  } else {
                    window.location.hash = "#community";
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[42px]"
              >
                <Swords className="w-4 h-4 shrink-0" />
                <span>Mời Ghép Đội / Thách Đấu</span>
              </button>
            </div>

          </div>

          {/* BẢNG CHỈ SỐ THỂ CHẤT & THÔNG SỐ CẦU THỦ CHI TIẾT (MỚI BỔ SUNG) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Footprints className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">Chân Thuận</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{editForm.dominantFoot}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Shirt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">Số Áo Thích</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">#{editForm.jerseyNumber}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">Chiều Cao</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{editForm.height}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">Cân Nặng</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{editForm.weight}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">Khung Giờ</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate" title={editForm.preferredTime}>{editForm.preferredTime || "17:30 - 20:30"}</p>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">Đội Bóng / CLB</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate" title={editForm.currentClub}>{editForm.currentClub}</p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ========================================================= */}
        {/* BẢNG CHỈNH SỬA HỒ SƠ INLINE (NẰM TRỰC TIẾP TRÊN TRANG)    */}
        {/* ========================================================= */}
        {isEditingInline && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/80 p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-500" />
                  Cập Nhật Chi Tiết Hồ Sơ & Thể Chất Cầu Thủ
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Thay đổi thông tin trực tiếp trên giao diện hồ sơ (Không sử dụng popup).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingInline(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                {saveSuccessMsg}
              </div>
            )}

            {saveErrorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700 text-xs">
                {saveErrorMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ví dụ: Hồ Văn Diện"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Địa Chỉ Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="cauthu@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="0947 304 321"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trình Độ Thi Đấu
                  </label>
                  <select
                    value={editForm.level}
                    onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Mới bắt đầu">Mới bắt đầu</option>
                    <option value="Nghiệp dư">Nghiệp dư</option>
                    <option value="Bán chuyên">Bán chuyên</option>
                    <option value="Chuyên nghiệp / Cựu tuyển">Chuyên nghiệp / Cựu tuyển</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vị Trí Sở Trường
                  </label>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ví dụ: Tiền vệ trung tâm (CM) / Hộ công"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Khu Vực Thi Đấu Thường Xuyên
                  </label>
                  <input
                    type="text"
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ví dụ: Đà Nẵng (Hải Châu / Cẩm Lệ)"
                  />
                </div>
              </div>

              {/* Thông số Thể chất bổ sung */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chân Thuận
                  </label>
                  <select
                    value={editForm.dominantFoot}
                    onChange={(e) => setEditForm({ ...editForm, dominantFoot: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Chân Phải">Chân Phải</option>
                    <option value="Chân Trái">Chân Trái</option>
                    <option value="Hai Chân Như Một">Hai Chân Như Một</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số Áo Ưa Thích
                  </label>
                  <input
                    type="text"
                    value={editForm.jerseyNumber}
                    onChange={(e) => setEditForm({ ...editForm, jerseyNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chiều Cao
                  </label>
                  <input
                    type="text"
                    value={editForm.height}
                    onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="1m75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cân Nặng
                  </label>
                  <input
                    type="text"
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="68 kg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Đội Bóng / CLB Đang Thi Đấu
                  </label>
                  <input
                    type="text"
                    value={editForm.currentClub}
                    onChange={(e) => setEditForm({ ...editForm, currentClub: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="FC Brothers Đà Nẵng"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    URL Ảnh Đại Diện (Avatar)
                  </label>
                  <input
                    type="url"
                    value={editForm.avatar}
                    onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="https://... ảnh chân dung"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingInline(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Đang lưu..." : "Lưu Thông Tin"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4 THẺ THỐNG KÊ NHANH (QUICK METRICS RIBBON)               */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Trận đã đấu */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between animate-fade-in-up delay-stagger-1 hover-card-elevate">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                TRẬN ĐÃ ĐẤU
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Target className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {currentStat.matches}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Thắng {currentStat.wins}
                </span>
                <span className="text-xs text-slate-400">
                  Bại {currentStat.losses}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden flex">
                <div className="bg-emerald-500 h-full rounded-l-full" style={{ width: currentStat.winRate }} />
                <div className="bg-rose-500 h-full rounded-r-full" style={{ width: `${100 - parseFloat(currentStat.winRate)}%` }} />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Tỷ lệ chiến thắng: <strong className="text-slate-800 dark:text-slate-200">{currentStat.winRate}</strong>
              </p>
            </div>
          </div>

          {/* 2. Chuỗi phong độ */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between animate-fade-in-up delay-stagger-2 hover-card-elevate">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                CHUỖI PHONG ĐỘ
              </span>
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500">
                <Flame className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {currentStat.streak}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 uppercase">
                  {currentStat.streakBadge}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="w-6 h-6 rounded-md bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">W</span>
                <span className="w-6 h-6 rounded-md bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">W</span>
                <span className="w-6 h-6 rounded-md bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">W</span>
                <span className="w-6 h-6 rounded-md bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">W</span>
                <span className="w-6 h-6 rounded-md bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">W</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Chưa bị ngắt quãng • Đang giữ phong độ đỉnh
              </p>
            </div>
          </div>

          {/* 3. Chỉ số Fairplay */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between animate-fade-in-up delay-stagger-3 hover-card-elevate">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                CHỈ SỐ FAIRPLAY
              </span>
              <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-500">
                <Star className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  5.0
                </span>
                <span className="text-xs text-slate-400">/ 5.0</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 ml-auto">
                  Tuyệt Đối
                </span>
              </div>
              <div className="flex items-center gap-1 mt-3 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <Star className="w-4 h-4 fill-amber-400" />
                <Star className="w-4 h-4 fill-amber-400" />
                <Star className="w-4 h-4 fill-amber-400" />
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                100% đúng giờ, tôn trọng luật & đối thủ
              </p>
            </div>
          </div>

          {/* 4. Bộ sưu tập danh hiệu */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between animate-fade-in-up delay-stagger-4 hover-card-elevate">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                BỘ SƯU TẬP GIẢI ĐẤU
              </span>
              <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-500">
                <Trophy className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-500">
                  02
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Cúp Vô Địch
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  2 Mini Cup
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-blue-500" />
                  4 Huy Chương
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Cập nhật hệ thống SoccerHub Tournament
              </p>
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* NỘI DUNG CHÍNH: 2 CỘT (CỘT TRÁI 8 PHẦN, CỘT PHẢI 4 PHẦN)  */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI (8 CỘT): ĐÁNH GIÁ NĂNG LỰC, ELO VÀ LỊCH SỬ TRẬN ĐẤU */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* KHỐI 1: ELO & CHỈ SỐ KỸ NĂNG THEO MÔ HÌNH SÂN BÓNG */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              
              {/* Header chuyển đổi thể thức sân bóng */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Đánh Giá Năng Lực & Kỹ Năng Cầu Thủ
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Thuật toán tự động đo đạc dựa trên hiệu suất thi đấu, số bàn thắng và phiếu bầu MVP sau mỗi trận.
                  </p>
                </div>

                {/* Tabs thể thức: Sân 7, Sân 5, Sân 11, Futsal */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar max-w-full shrink-0">
                  <button
                    onClick={() => setActiveFormat("san7")}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      activeFormat === "san7"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Bóng Đá Sân 7
                  </button>
                  <button
                    onClick={() => setActiveFormat("san5")}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      activeFormat === "san5"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Bóng Đá Sân 5
                  </button>
                  <button
                    onClick={() => setActiveFormat("san11")}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      activeFormat === "san11"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Bóng Đá Sân 11
                  </button>
                  <button
                    onClick={() => setActiveFormat("futsal")}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      activeFormat === "futsal"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Futsal Sàn Gỗ
                  </button>
                </div>
              </div>

              {/* Thông số Elo chính của thể thức đang chọn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                
                {/* Box ELO & Ranking */}
                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      ĐIỂM ELO SOCCERHUB CHÍNH THỨC
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {currentStat.percentile}
                    </span>
                  </div>
                  
                  <div className="flex items-baseline gap-3 mt-3">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">
                      {currentStat.elo}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      +250 Elo trong 6 tháng
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
                    Hạng: <span className="text-slate-900 dark:text-white font-bold">{currentStat.ranking}</span>
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Hạng giải đấu: <strong className="text-slate-700 dark:text-slate-200">{currentStat.tier}</strong></span>
                    <span>Huy hiệu: <strong className="text-emerald-600 dark:text-emerald-400">{currentStat.badge}</strong></span>
                  </div>
                </div>

                {/* Box Thành tích bàn thắng & Kiến tạo */}
                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      ĐÓNG GÓP BÀN THẮNG & KIẾN TẠO
                    </span>
                    <span className="text-xs font-bold text-amber-500">
                      {currentStat.goals + currentStat.assists} G+A
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{currentStat.goals}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Bàn Thắng</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{currentStat.assists}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Kiến Tạo</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{currentStat.cleanSheets}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Giữ Sạch Lưới</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 text-center">
                    Thống kê tự động ghi nhận từ bảng điểm trọng tài & đội trưởng xác nhận
                  </p>
                </div>

              </div>

              {/* Danh sách thanh kỹ năng bóng đá chi tiết */}
              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Chỉ Số Kỹ Thuật Chuyên Môn ({currentStat.title})
                </h3>
                
                <div className="space-y-3.5">
                  {currentStat.skills.map((skill, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {skill.name}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {skill.value} <span className="text-slate-400 text-xs font-normal">/ 100</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${skill.color}`}
                          style={{ width: `${skill.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tóm tắt 5 trục Radar */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3">
                {currentStat.radarPoints.map((pt, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{pt.label}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{pt.val}</p>
                  </div>
                ))}
              </div>

            </div>

            {/* KHỐI 2: LỊCH SỬ THI ĐẤU & TRẬN KÈO PHỦI GẦN ĐÂY */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    Lịch Sử Thi Đấu Gần Đây
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Ghi chép kết quả trận đấu, biến động Elo và video AI tự động quay bàn thắng đẹp.
                  </p>
                </div>

                {/* Filter nút */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar max-w-full shrink-0">
                  <button
                    onClick={() => setHistoryFilter("all")}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                      historyFilter === "all"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setHistoryFilter("win")}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                      historyFilter === "win"
                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Thắng
                  </button>
                  <button
                    onClick={() => setHistoryFilter("loss")}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                      historyFilter === "loss"
                        ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Bại
                  </button>
                  <button
                    onClick={() => setHistoryFilter("ai_video")}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                      historyFilter === "ai_video"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Có Video AI
                  </button>
                </div>
              </div>

              {/* Danh sách trận */}
              <div className="space-y-4 pt-6">
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    Không có trận đấu nào khớp với bộ lọc hiện tại.
                  </div>
                ) : (
                  filteredMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all space-y-3"
                    >
                      {/* Dòng 1: Thời gian, Sân và Thể thức */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{m.date}</span>
                          <span>•</span>
                          <span>{m.time}</span>
                          <span>•</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">{m.format}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">ID: {m.id}</span>
                      </div>

                      {/* Dòng 2: Tỉ số & Tên hai đội */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                              m.result === "win"
                                ? "bg-emerald-500 text-white"
                                : "bg-rose-500 text-white"
                            }`}
                          >
                            {m.result === "win" ? "W" : "L"}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                {m.myTeam}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                                {m.score}
                              </span>
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {m.opponent}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {m.pitch}
                            </p>
                          </div>
                        </div>

                        {/* Thay đổi Elo & MVP */}
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {m.mvp && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              MVP
                            </span>
                          )}
                          <span
                            className={`text-sm font-bold ${
                              m.result === "win"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-500"
                            }`}
                          >
                            {m.eloChange} Elo
                          </span>
                        </div>
                      </div>

                      {/* Dòng 3: Đóng góp & Link Video AI */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600 dark:text-slate-300">
                          {m.stats}
                        </span>
                        {m.hasAiVideo ? (
                          <button
                            onClick={() => alert(`Đang tải video highlights AI của trận đấu ${m.id}...`)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Xem Highlight Bàn Thắng (AI Replay)
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Chưa đăng ký dịch vụ quay AI</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

          {/* CỘT PHẢI (4 CỘT): DỮ LIỆU THỂ LỰC & BỘ SƯU TẬP DANH HIỆU */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* KHỐI 1: THỂ LỰC VẬN ĐỘNG & BẢNG ĐO QUÃNG ĐƯỜNG */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Dữ Liệu Thể Lực Cầu Thủ
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Đồng bộ Smartwatch</span>
              </div>

              {/* 2 Card Calo & Nhịp tim */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                  <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 tracking-wider">
                    CALO TIÊU HAO / TUẦN
                  </span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    3,450 <span className="text-xs font-normal text-slate-500">kcal</span>
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +12% so với tuần trước
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                  <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                    NHỊP TIM TRUNG BÌNH
                  </span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    142 <span className="text-xs font-normal text-slate-500">bpm</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Đỉnh điểm 178 bpm (Phút 72)
                  </p>
                </div>
              </div>

              {/* Bảng quãng đường di chuyển */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  QUÃNG ĐƯỜNG DI CHUYỂN TRUNG BÌNH
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Bóng đá sân 5 / trận</span>
                    <strong className="text-slate-900 dark:text-white">4.8 km</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Bóng đá sân 7 / trận</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">7.2 km</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Bóng đá sân 11 / trận</span>
                    <strong className="text-slate-900 dark:text-white">10.5 km</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>Cầu thủ đạt tiêu chuẩn thể lực loại 1, đảm bảo thi đấu cường độ cao không hụt hơi.</span>
              </div>
            </div>

            {/* KHỐI 2: TỦ TRƯNG BÀY DANH HIỆU & HUY HIỆU PHỦI */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Danh Hiệu & Huy Chương Đạt Được
                </h3>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Vô Địch Cup Tuyên Sơn Open 2026
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Cùng FC Brothers Đà Nẵng • Thể thức sân 7
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Á Quân Giải Phủi Cẩm Lệ Mùa Hè 2025
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Hạng mục Phong trào 16 đội
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Vua Phá Lưới Mini Cup Hòa Xuân
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Ghi 11 bàn thắng trong 5 trận đấu
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-center text-slate-500 dark:text-slate-400">
                Hồ sơ tự động cập nhật từ hệ thống giải đấu SoccerHub
              </div>
            </div>

          </div>

        </div>

    </div>
  );
}
