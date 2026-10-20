"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import NavbarAvatar from "@/components/NavbarAvatar";
import {
  Trophy,
  Building2,
 Users,
 ShieldCheck,
 LogIn,
 LogOut,
 Calendar,
 Bell,
 Ticket,
 Star,
 Award,
 Cpu,
 User,
 Shield,
 Clock,
 ChevronDown,
 Flame,
 Zap,
 Building,
 Plus,
 X,
 Menu,
 CheckCircle,
 XCircle,
  AlertCircle,
  MessageCircle
} from "lucide-react";
import { listMyGroups, listMyConversations, getUnreadCount } from "@/lib/groupChat";
import { useNotifications, formatNotifTime } from "@/lib/useNotifications";

interface NavbarProps {
 activeTab: string;
 setActiveTab: (tab: string) => void;
 user: any | null;
 onOpenAuth: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
 onLogout: () => void;
}

export default function Navbar({
 activeTab,
 setActiveTab,
 user,
 onOpenAuth,
 onLogout
}: NavbarProps) {
 const router = useRouter();
 const [showNotifications, setShowNotifications] = useState(false);
 const [showUserDropdown, setShowUserDropdown] = useState(false);
 const [showMobileDrawer, setShowMobileDrawer] = useState(false);
 const [mobilePitchOpen, setMobilePitchOpen] = useState(true);
 const [mobileTournamentOpen, setMobileTournamentOpen] = useState(false);

  const [chatUnread, setChatUnread] = useState(0);

  // Số tin nhắn chat chưa đọc (DM + Group) từ API getUnreadCount
  useEffect(() => {
    if (!user) { setChatUnread(0); return; }
    let alive = true;
    const load = async () => {
      try {
        const { total } = await getUnreadCount();
        if (!alive) return;
        setChatUnread(total);
      } catch {
        /* bỏ qua */
      }
    };
    load();
    const t = window.setInterval(load, 30000); // poll 30s
    return () => { alive = false; window.clearInterval(t); };
  }, [user]);

 // Trung Tâm Thông Báo: dùng chung hook với trang /notifications
 const {
 notifications,
 unreadCount,
 markAllRead,
 removeNotification,
 clearAllNotifications,
 } = useNotifications(user);

 // Grouped Dropdown States
 const [showPitchMenu, setShowPitchMenu] = useState(false);
 const [showTournamentMenu, setShowTournamentMenu] = useState(false);

 const pitchMenuRef = useRef<HTMLDivElement>(null);
 const tournamentMenuRef = useRef<HTMLDivElement>(null);
 const userMenuRef = useRef<HTMLDivElement>(null);
 const notificationRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (pitchMenuRef.current && !pitchMenuRef.current.contains(event.target as Node)) {
 setShowPitchMenu(false);
 }
 if (tournamentMenuRef.current && !tournamentMenuRef.current.contains(event.target as Node)) {
 setShowTournamentMenu(false);
 }
 if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
 setShowUserDropdown(false);
 }
 if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
 setShowNotifications(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const handleSelectSubTab = (tabId: string) => {
 setActiveTab(tabId);
 setShowPitchMenu(false);
 setShowTournamentMenu(false);
 setShowNotifications(false);
 setShowUserDropdown(false);
 setShowMobileDrawer(false);
 };

 // ============================================================
 // THANH ĐIỀU HƯỚNG DƯỚI (MOBILE BOTTOM NAV) — trải nghiệm dạng app
 // Chỉ hiển thị cho khách / Cầu thủ / Ban tổ chức (Chủ sân & Admin dùng drawer riêng)
 // ============================================================
 type MobileNavItem = {
 key: string;
 label: string;
 icon: React.ComponentType<{ className?: string }>;
 tab?: string;
 auth?: boolean;
 };


const mobileNav: MobileNavItem[] =
  user?.role === "ORGANIZER"
  ? [
  { key: "organizer", label: "Điều hành", tab: "organizer", icon: ShieldCheck },
  { key: "tournaments", label: "Giải đấu", tab: "tournaments", icon: Trophy },
  { key: "matchmaking", label: "Chợ Kèo", tab: "matchmaking", icon: Flame },
  { key: "community", label: "Cộng Đồng", tab: "community", icon: MessageCircle },
  { key: "profile", label: "Hồ sơ", tab: "profile", icon: User },
  ]
  : user
  ? [
  { key: "booking", label: "Đặt sân", tab: "booking", icon: Calendar },
  { key: "matchmaking", label: "Chợ Kèo", tab: "matchmaking", icon: Flame },
  { key: "community", label: "Cộng Đồng", tab: "community", icon: MessageCircle },
  { key: "tournaments", label: "Giải đấu", tab: "tournaments", icon: Trophy },
  { key: "profile", label: "Hồ sơ", tab: "profile", icon: User },
  ]
  : [
  { key: "booking", label: "Đặt sân", tab: "booking", icon: Calendar },
  { key: "matchmaking", label: "Chợ Kèo", tab: "matchmaking", icon: Flame },
  { key: "community", label: "Cộng Đồng", tab: "community", icon: MessageCircle },
  { key: "tournaments", label: "Giải đấu", tab: "tournaments", icon: Trophy },
  { key: "login", label: "Đăng nhập", auth: true, icon: LogIn },
  ];

  /** 5 mục trên màn hẹp -> chữ nhỏ lại cho vừa, tránh bị cắt chữ. */
  const bottomNavDense = mobileNav.length >= 5;

 const showBottomNav = user?.role !== "OWNER" && user?.role !== "ADMIN";

 return (
 <>
 <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-colors duration-300 w-full">
 <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 xl:px-8 2xl:px-[50px] h-[52px] sm:h-16 flex items-center justify-between gap-2 lg:gap-3 xl:gap-4">
 {/* BRAND LOGO */}
 <div
 onClick={() => {
 if (user?.role === "ADMIN") {
 window.location.assign("/admin");
 return;
 }
 handleSelectSubTab(user?.role === "OWNER" ? "admin" : "booking");
 }}
 className="flex items-center space-x-2 cursor-pointer select-none shrink-0 group"
 title="Turfzone - Nền Tảng Quản Lý Sân Bóng & Giải Đấu Thông Minh"
 >
 {/* Light Mode Logo Image */}
 <SafeImage 
 src="/turfzone-logo.png" 
 alt="Turfzone Logo" 
 className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105" 
 />
 {/* Dark Mode Logo Image */}
 <SafeImage 
 src="/turfzone-logo-dark.png" 
 alt="Turfzone Logo" 
 className="h-8 sm:h-9 w-auto object-contain hidden transition-transform group-hover:scale-105" 
 />
 </div>

 {/* CONSOLIDATED DESKTOP NAV */}
 <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 shrink-0">
 {user?.role === "OWNER" ? (
 /* OWNER ROLE NAVBAR ITEMS */
 <>
 <button
 type="button"
 onClick={() => handleSelectSubTab("admin")}
 className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
 activeTab === "admin"
 ? "bg-[#0369a1] text-white shadow-md"
 : "text-slate-700 hover:bg-slate-100 "
 }`}
 >
 <ShieldCheck className="w-[18px] h-[18px] text-emerald-500 shrink-0" />
 <span>Quản Lý Cụm Sân & Doanh Thu</span>
 </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("multi-sport")}
 className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
 activeTab === "multi-sport"
 ? "bg-[#0369a1] text-white shadow-md"
 : "text-slate-700 hover:bg-slate-100 "
 }`}
 >
 <Clock className="w-[18px] h-[18px] text-emerald-400 shrink-0" />
 <span>Sơ Đồ Ca Sân Realtime</span>
 </button>

  {/* Chu san cung to chuc giai tai cum san cua ho - page.tsx da cho render tab
  nay cho OWNER nhung truoc day khong co loi vao nao tu giao dien. */}
  <button
  type="button"
  onClick={() => handleSelectSubTab("organizer")}
  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
  activeTab === "organizer"
  ? "bg-[#0369a1] text-white shadow-md"
  : "text-slate-700 hover:bg-slate-100 "
  }}`}
  >
  <Trophy className="w-[18px] h-[18px] text-sky-700 shrink-0" />
  <span>Điều Hành Giải Đấu</span>
  </button>

  <button
  type="button"
  onClick={() => handleSelectSubTab("community")}
  className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
  activeTab === "community"
  ? "bg-[#0369a1] text-white shadow-md"
  : "text-slate-700 hover:bg-slate-100 "
  }`}
  >
  <MessageCircle className="w-[18px] h-[18px] text-emerald-400 shrink-0" />
  <span>Cộng Đồng</span>
  {chatUnread > 0 && (
  <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#0369a1] text-white text-[13px] font-black flex items-center justify-center">
  {chatUnread > 9 ? "9+" : chatUnread}
  </span>
  )}
  </button>
 </>
 ) : user?.role === "ADMIN" ? (
 /* ADMIN NAVBAR ITEM — về trang quản trị riêng /admin */
 <a
 href="/admin"
 className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95"
 >
 <ShieldCheck className="w-4 h-4 shrink-0" />
 <span>Quản Trị Hệ Thống</span>
 </a>
 ) : user?.role === "ORGANIZER" ? (
 /* ORGANIZER NAVBAR ITEMS — tập trung điều hành giải */
 <>
 <button
 type="button"
 onClick={() => handleSelectSubTab("organizer")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
 activeTab === "organizer"
 ? "bg-[#0369a1] text-white shadow-sm font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Trophy className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-sky-700 shrink-0" />
 <span>Điều Hành Giải Đấu</span>
 <span className="px-1.5 py-0.5 rounded text-[13px] font-black bg-[#0369a1] text-white leading-none shadow-xs">
 BTC
 </span>
 </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("tournaments")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
 activeTab === "tournaments"
 ? "bg-[#0369a1] text-white shadow-sm font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Award className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-amber-700 shrink-0" />
 <span>Giải Đấu &amp; BXH</span>
 </button>

<button
  type="button"
  onClick={() => handleSelectSubTab("matchmaking")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
  activeTab === "matchmaking"
  ? "bg-[#0369a1] text-white shadow-sm font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <Flame className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-rose-600 fill-rose-500 shrink-0" />
  <span>Chợ Kèo</span>
  <span className="px-1.5 py-0.5 rounded text-[13px] font-black bg-rose-500 text-white leading-none shadow-xs">
  HOT
  </span>
  </button>

  <button
  type="button"
  onClick={() => handleSelectSubTab("community")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
  activeTab === "community"
  ? "bg-[#0369a1] text-white shadow-sm font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <MessageCircle className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-[#0369a1] shrink-0" />
  <span>Cộng Đồng</span>
  </button>
 </>
 ) : !user ? (
 /* GUEST NAVBAR ITEMS — khám phá + CTA tham gia */
 <>
 <button
 type="button"
 onClick={() => handleSelectSubTab("booking")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
 activeTab === "booking"
 ? "bg-[#0369a1] text-white shadow-sm font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Calendar className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-sky-700 shrink-0" />
 <span>Đặt Sân Bóng Đá</span>
 </button>

<button
  type="button"
  onClick={() => handleSelectSubTab("matchmaking")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
  activeTab === "matchmaking"
  ? "bg-[#0369a1] text-white shadow-sm font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <Flame className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-rose-600 fill-rose-500 shrink-0" />
  <span>Chợ Kèo</span>
  <span className="px-1.5 py-0.5 rounded text-[13px] font-black bg-rose-500 text-white leading-none shadow-xs">
  HOT
  </span>
  </button>

  <button
  type="button"
  onClick={() => handleSelectSubTab("community")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
  activeTab === "community"
  ? "bg-[#0369a1] text-white shadow-sm font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <MessageCircle className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-[#0369a1] shrink-0" />
  <span>Cộng Đồng</span>
  </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("tournaments")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
 activeTab === "tournaments"
 ? "bg-[#0369a1] text-white shadow-sm font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Trophy className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-amber-700 shrink-0" />
 <span>Giải Đấu &amp; BXH</span>
 </button>

 </>
 ) : (
 /* PLAYER NAVBAR ITEMS */
 <>
 <button
 type="button"
 onClick={() => handleSelectSubTab("booking")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
 activeTab === "booking"
 ? "bg-[#0369a1] text-white shadow-sm font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Calendar className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-sky-700 shrink-0" />
 <span>Đặt Sân Bóng Đá</span>
 </button>

<button
  type="button"
  onClick={() => handleSelectSubTab("matchmaking")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
  activeTab === "matchmaking"
  ? "bg-[#0369a1] text-white shadow-sm font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <Flame className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-rose-600 fill-rose-500 shrink-0" />
  <span>Chợ Kèo</span>
  <span className="px-1.5 py-0.5 rounded text-[13px] font-black bg-rose-500 text-white leading-none shadow-xs">
  HOT
  </span>
  </button>

  <button
  type="button"
  onClick={() => handleSelectSubTab("community")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
  activeTab === "community"
  ? "bg-[#0369a1] text-white shadow-sm font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <MessageCircle className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-[#0369a1] shrink-0" />
  <span>Cộng Đồng</span>
  </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("tournaments")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
 activeTab === "tournaments"
 ? "bg-[#0369a1] text-white shadow-sm font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Trophy className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-amber-700 shrink-0" />
 <span>Giải Đấu &amp; BXH</span>
 </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("team-management")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
 activeTab === "team-management"
 ? "bg-[#0369a1] text-white shadow-sm font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Users className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-[#0369a1] shrink-0" />
 <span>Đội Bóng</span>
 </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("membership")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
 activeTab === "membership"
 ? "bg-[#0369a1] text-white shadow-sm font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Award className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-amber-700 shrink-0" />
 <span>Thẻ Hội Viên</span>
 </button>
 </>
 )}
 </nav>

 {/* RIGHT SIDE WIDGETS */}
 <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
 {user?.role === "PLAYER" && (
 <div className="hidden 2xl:flex items-center space-x-3 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200 text-[13px] font-bold font-mono">
 <div className="flex items-center space-x-1.5 text-slate-800 ">
 <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
 <span>{user?.level || "Phong trào"}</span>
 </div>
 <div className="w-px h-4 bg-slate-300 " />
 <div className="flex items-center space-x-1.5 text-slate-800 ">
 <Award className="w-4 h-4 text-[#0b4f6c] " />
 <span>{user?.area || "Toàn quốc"}</span>
 </div>
 </div>
 )}


 {user && (
 <div className="relative" ref={notificationRef}>
 <button
 type="button"
 onClick={() => {
 setShowNotifications(!showNotifications);
 setShowPitchMenu(false);
 setShowTournamentMenu(false);
 setShowUserDropdown(false);
 if (!showNotifications) markAllRead();
 }}
 className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center border border-slate-200 transition-all shadow-xs"
 title="Thông báo hệ thống"
 >
 <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#0b4f6c] " />
 {unreadCount > 0 && (
 <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[13px] font-black flex items-center justify-center px-1.5 ring-2 ring-white animate-pulse">
 {unreadCount > 9 ? "9+" : unreadCount}
 </span>
 )}
 </button>

 {showNotifications && (
 <div className="absolute right-0 mt-3 w-[calc(100vw-24px)] max-w-[360px] sm:max-w-[540px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-slate-200 z-50 animate-modal-pop overflow-hidden">
 {/* Header To Rõ */}
 <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/90 ">
 <div className="flex items-center space-x-3">
 <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-700 ">
 <Bell className="w-[18px] h-[18px] text-[#0b4f6c] " />
 </div>
 <span className="font-extrabold text-base text-slate-900 ">Trung Tâm Thông Báo</span>
 {unreadCount > 0 && (
 <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[13px] font-black">
 {unreadCount} mới
 </span>
 )}
 </div>
 <div className="flex items-center space-x-2">
 <span className="px-2.5 py-1 rounded-full bg-sky-50 text-[13px] text-sky-700 font-bold flex items-center space-x-1.5 border border-sky-200 ">
 <span className="w-2 h-2 rounded-full bg-[#0369a1] animate-pulse inline-block" />
 <span>Live Realtime</span>
 </span>
 </div>
 </div>

 {/* Notification List Rộng Rãi */}
 <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100 ">
 {notifications.length === 0 ? (
 <div className="py-16 flex flex-col items-center space-y-3 text-slate-500">
 <Bell className="w-12 h-12 opacity-30 text-slate-500" />
 <p className="text-sm font-semibold">Chưa có thông báo nào từ hệ thống</p>
 </div>
 ) : (
 notifications.map(notif => (
 <div
 key={notif.id}
 className={`relative p-4 sm:p-5 transition-colors hover:bg-slate-50 ${
 !notif.read ? "bg-sky-50/60 " : ""
 }`}
 >
 <div className="flex items-start space-x-3.5">
 {/* Icon theo loại to hơn */}
 <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
 notif.type === "BOOKING_CREATED" ? "bg-sky-100 text-sky-700" :
 notif.type === "BOOKING_CANCELLED" ? "bg-rose-100 text-rose-600" :
 notif.type === "BOOKING_CHECKED_IN" ? "bg-sky-100 text-[#0369a1]" :
 "bg-amber-100 text-amber-600"
 }`}>
 {notif.type === "BOOKING_CREATED" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
 {notif.type === "BOOKING_CANCELLED" && <XCircle className="w-5 h-5 text-rose-600" />}
 {notif.type === "BOOKING_CHECKED_IN" && <CheckCircle className="w-5 h-5 text-[#0369a1]" />}
 {(notif.type === "PROMO" || notif.type === "OPERATING_HOURS_UPDATED") && <AlertCircle className="w-5 h-5 text-amber-700" />}
 </div>

 <div className="flex-1 min-w-0 space-y-1">
 <div className="flex items-start justify-between gap-2">
 <p className="text-sm font-extrabold text-slate-900 leading-snug">{notif.title}</p>
 {!notif.read && (
 <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1] mt-1 shrink-0" />
 )}
 </div>
 <p className="text-[13px] sm:text-[13px] text-slate-600 leading-relaxed font-medium">{notif.message}</p>

 {/* Lý do hủy - hiển thị nổi bật */}
 {notif.type === "BOOKING_CANCELLED" && notif.cancelReason && (
 <div className="mt-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 ">
 <p className="text-[13px] font-bold text-rose-700 ">
 📋 Lý do: <span className="font-normal">{notif.cancelReason}</span>
 </p>
 </div>
 )}

 <p className="text-[13px] text-slate-500 font-mono mt-1.5">{formatNotifTime(notif.time)}</p>
 </div>

 {/* Nút xóa */}
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
 className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
 title="Xóa thông báo"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Footer To Rõ */}
 {notifications.length > 0 && (
 <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2">
 <button
 type="button"
 onClick={() => {
 setShowNotifications(false);
 router.push("/notifications");
 }}
 className="text-[13px] font-black text-[#0b4f6c] hover:underline"
 >
 Xem tất cả →
 </button>
 <span className="text-[13px] font-semibold text-slate-500">{notifications.length} thông báo</span>
 <button
 type="button"
 onClick={() => clearAllNotifications()}
 className="text-[13px] font-bold text-slate-500 hover:text-rose-600 transition-colors"
 >
 Xóa tất cả
 </button>
 </div>
 )}
 </div>
 )}
 </div>
 )}

 {user ? (
 <div className="relative" ref={userMenuRef}>
 <div
 onClick={() => {
 setShowUserDropdown(!showUserDropdown);
 setShowPitchMenu(false);
 setShowTournamentMenu(false);
 setShowNotifications(false);
 }}
 className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer pl-1 py-1 rounded-2xl hover:bg-slate-100 transition-colors"
 >
 <div className="text-right hidden sm:block max-w-[130px] md:max-w-[170px] overflow-hidden">
 <div className="text-[13px] font-extrabold text-slate-900 leading-tight truncate">
 {user.fullName || user.name || "Người Dùng"}
 </div>
 <div className="text-[13px] font-bold text-slate-500 font-mono flex items-center justify-end space-x-1 whitespace-nowrap">
 <span className="text-[#0b4f6c] font-extrabold shrink-0">
 {user.role === 'OWNER' ? 'Chủ Sân' : user.role === 'ORGANIZER' ? 'BTC' : user.role === 'ADMIN' ? 'Quản Trị' : 'Cầu Thủ'}
 </span>
 {user.role === 'OWNER' ? (
 <span className="truncate text-emerald-500 font-bold">• {user.area || "Chưa cập nhật khu vực"}</span>
 ) : (
 <span className="truncate">• {user.level || "Phong trào"}</span>
 )}
 <ChevronDown className={`w-3 h-3 text-slate-500 shrink-0 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
 </div>
 </div>

 <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0369a1] border-2 border-sky-400 text-white font-extrabold text-[13px] sm:text-[13px] flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
 <NavbarAvatar user={user} />
 </div>
 </div>

 {showUserDropdown && (
 <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1.5 z-50 animate-modal-pop">
 <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/80 rounded-xl">
 <div className="flex items-center justify-between">
 <p className="font-extrabold text-[13px] text-slate-900 truncate max-w-[140px]">
 {user.fullName || user.name || "Người Dùng"}
 </p>
 <span className="text-[13px] font-black px-1.5 py-0.5 rounded bg-[#0369a1]/10 text-[#0b4f6c] ">
 {user.role === 'OWNER' ? 'Chủ Sân' : user.role === 'ORGANIZER' ? 'Ban Tổ Chức' : user.role === 'ADMIN' ? 'Quản Trị' : 'Cầu Thủ'}
 </span>
 </div>
 <p className="text-[13px] font-mono text-slate-500 truncate mt-0.5">
 {user.email || user.phone || ""}
 </p>
 </div>

 {user.role === "ADMIN" && (
 <a
 href="/admin"
 onClick={() => setShowUserDropdown(false)}
 className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-black text-white bg-rose-600 hover:bg-rose-700 flex items-center space-x-2 transition-all active:scale-95 shadow-md"
 >
 <ShieldCheck className="w-4 h-4" />
 <span>Quản Trị Hệ Thống</span>
 </a>
 )}

 {user.role === "OWNER" ? (
 <>
 <button
 type="button"
 onClick={() => {
 handleSelectSubTab("admin");
 setShowUserDropdown(false);
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
 >
 <ShieldCheck className="w-4 h-4 text-emerald-500" />
 <span>Bảng Điều Hành Cụm Sân</span>
 </button>

 <button
 type="button"
 onClick={() => {
 handleSelectSubTab("owner-onboarding");
 setShowUserDropdown(false);
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100 flex items-center space-x-2 transition-colors"
 >
 <Plus className="w-4 h-4 text-indigo-500" />
 <span>Thiết Lập / Khởi Tạo Sân Mới</span>
 </button>

 <button
 type="button"
 onClick={() => {
 handleSelectSubTab("multi-sport");
 setShowUserDropdown(false);
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
 >
 <Clock className="w-4 h-4 text-[#0369a1]" />
 <span>Sơ Đồ Ca Sân Realtime</span>
 </button>
  <button
  type="button"
  onClick={() => {
  handleSelectSubTab("organizer");
  setShowUserDropdown(false);
  }}
  className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
  >
  <Trophy className="w-4 h-4 text-sky-700" />
  <span>Điều Hành Giải Đấu</span>
  </button>

  <button
  type="button"
  onClick={() => {
  handleSelectSubTab("community");
  setShowUserDropdown(false);
  }}
  className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
  >
  <Building2 className="w-4 h-4 text-sky-700" />
  <span>CLB của tôi</span>
  </button>

  <button
  type="button"
  onClick={() => {
  handleSelectSubTab("profile");
  setShowUserDropdown(false);
  }}
  className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
  >
  <User className="w-4 h-4 text-[#0369a1]" />
  <span>Hồ Sơ Cá Nhân</span>
  </button>
 </>
 ) : user.role === "ORGANIZER" ? (
 <>
 <button
 type="button"
 onClick={() => {
 handleSelectSubTab("organizer");
 setShowUserDropdown(false);
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
 >
 <Trophy className="w-4 h-4 text-emerald-500" />
 <span>Điều Hành Giải Đấu</span>
 </button>

 <button
 type="button"
 onClick={() => {
 handleSelectSubTab("tournaments");
 setShowUserDropdown(false);
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
 >
 <Award className="w-4 h-4 text-amber-700" />
 <span>Giải Đấu & BXH</span>
 </button>

 <button
 type="button"
 onClick={() => {
 handleSelectSubTab("my-activities");
 setShowUserDropdown(false);
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
 >
 <Calendar className="w-4 h-4 text-emerald-500" />
 <span>Lịch Trình & Vé Đã Đặt</span>
 </button>
 </>
 ) : user.role === "PLAYER" ? (
 <>
 <button
 type="button"
 onClick={() => {
 handleSelectSubTab("profile");
 setShowUserDropdown(false);
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
 >
 <User className="w-4 h-4 text-[#0369a1]" />
 <span>Hồ Sơ VĐV & Rating</span>
 </button>

 <button
 type="button"
 onClick={() => {
 handleSelectSubTab("my-activities");
 setShowUserDropdown(false);
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
 >
 <Calendar className="w-4 h-4 text-emerald-500" />
 <span>Lịch Trình & Vé Đã Đặt</span>
 </button>
 </>
 ) : null}

 <div className="pt-1 border-t border-slate-100 ">
 <button
 type="button"
 onClick={() => {
 setShowUserDropdown(false);
 onLogout();
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[13px] font-extrabold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
 >
 <LogOut className="w-4 h-4 text-rose-600" />
 <span>Đăng Xuất</span>
 </button>
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="flex items-center space-x-1.5 shrink-0">
 <button
 type="button"
 onClick={() => onOpenAuth("login")}
 className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-[13px] transition-all border border-slate-200 flex items-center space-x-1 active:scale-95 shrink-0"
 >
 <LogIn className="w-3.5 h-3.5 text-[#0b4f6c] " />
 <span>Đăng Nhập</span>
 </button>
 <button
 type="button"
 onClick={() => onOpenAuth("register")}
 className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[13px] transition-all shadow-md hidden sm:flex items-center space-x-1 active:scale-95"
 >
 <span>Đăng Ký</span>
 </button>
 </div>
 )}

 {/* HAMBURGER BUTTON (MOBILE ONLY) */}
 <button
 type="button"
 onClick={() => setShowMobileDrawer(true)}
 className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center border border-slate-200 transition-all cursor-pointer active:scale-95 ml-1"
 title="Mở menu ứng dụng"
 aria-label="Mở menu điều hướng"
 >
 <Menu className="w-5 h-5 text-[#0b4f6c] " />
 </button>
 </div>
 </div>
 </header>

 {/* MOBILE SLIDING DRAWER (PHƯƠNG ÁN A: TRƯỢT TỪ PHẢI SANG CHUẨN APP) */}
 {showMobileDrawer && (
 <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
 {/* Backdrop mờ làm tối nền */}
 <div
 onClick={() => setShowMobileDrawer(false)}
 className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
 />

 {/* Sliding Panel trượt từ phải */}
 <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
 <div className="w-screen max-w-xs sm:max-w-sm bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
 {/* Drawer Header */}
 <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 ">
 <div className="flex items-center space-x-2">
 <SafeImage
 src="/turfzone-logo.png"
 alt="Turfzone Logo"
 className="h-7 w-auto object-contain "
 />
 <SafeImage
 src="/turfzone-logo-dark.png"
 alt="Turfzone Logo"
 className="h-7 w-auto object-contain hidden "
 />
 </div>
 <button
 type="button"
 onClick={() => setShowMobileDrawer(false)}
 className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
 title="Đóng menu"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Drawer Body - Danh Sách Chức Năng Theo Role */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-6">
 {/* User Snapshot Card nếu đã login */}
 {user ? (
 <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
 <div className="flex items-center space-x-3">
 <div className="w-11 h-11 rounded-xl bg-[#0369a1] text-white flex items-center justify-center font-black text-lg shrink-0">
 {(user.fullName || user.name || "U").charAt(0).toUpperCase()}
 </div>
 <div className="min-w-0 flex-1">
 <p className="font-black text-sm text-slate-900 truncate">
 {user.fullName || user.name || "Cầu Thủ Turfzone"}
 </p>
 <span className="inline-block px-2 py-0.5 rounded-full text-[13px] font-extrabold bg-sky-50 text-[#0b4f6c] ">
 {user.role === "OWNER" ? "Chủ Sân Đối Tác" : user.role === "ORGANIZER" ? "Ban Tổ Chức" : user.role === "ADMIN" ? "Quản Trị Viên" : "VĐV Chuyên Nghiệp"}
 </span>
 </div>
 </div>
 {(user.role === "PLAYER" || user.role === "ORGANIZER") && (
 <div className="flex items-center justify-between text-[13px] font-mono font-bold pt-2 border-t border-slate-200/60 ">
 <span className="text-slate-500">
 Trình độ:{" "}
 <strong className="text-[#0b4f6c] ">
 {user.level ?? "Phong trào"}
 </strong>
 </span>
 </div>
 )}
 </div>
 ) : (
 <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 space-y-2">
 <p className="font-extrabold text-[13px] text-[#0b4f6c] ">
 Gia nhập cộng đồng Turfzone
 </p>
 <p className="text-[13px] text-slate-600 leading-relaxed">
 Đăng nhập để theo dõi lịch trình, giải đấu và phong độ thi đấu của bạn.
 </p>
 <div className="flex items-center space-x-2 pt-1">
 <button
 type="button"
 onClick={() => {
 setShowMobileDrawer(false);
 onOpenAuth("login");
 }}
 className="flex-1 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] text-center shadow-xs"
 >
 Đăng Nhập
 </button>
 <button
 type="button"
 onClick={() => {
 setShowMobileDrawer(false);
 onOpenAuth("register");
 }}
 className="flex-1 py-2 rounded-xl bg-white text-slate-700 font-bold text-[13px] border border-slate-200 text-center"
 >
 Đăng Ký
 </button>
 </div>
 </div>
 )}

 {/* Danh mục menu điều hướng chính đồng bộ 100% với PC Dropdowns */}
 <div className="space-y-3">
 <span className="text-[13px] font-extrabold tracking-wider text-slate-500 px-1 block">
 Danh Mục Nền Tảng
 </span>

 {user?.role === "OWNER" ? (
 <div className="space-y-1.5">
 <button
 type="button"
 onClick={() => handleSelectSubTab("admin")}
 className={`w-full text-left p-3 rounded-2xl flex items-center space-x-3 transition-colors ${
 activeTab === "admin"
 ? "bg-[#0369a1] text-white shadow-md font-extrabold"
 : "bg-slate-50 hover:bg-slate-100 text-slate-700 "
 }`}
 >
 <div className="w-8 h-8 rounded-xl bg-[#0369a1]/10 text-emerald-500 flex items-center justify-center shrink-0">
 <ShieldCheck className="w-4 h-4 text-emerald-500" />
 </div>
 <div>
 <div className="text-[13px] font-extrabold leading-tight">Quản Lý Cụm Sân & Doanh Thu</div>
 <div className={`text-[13px] ${activeTab === "admin" ? "text-white/80 " : "text-slate-500"}`}>Điều hành doanh thu, ca sân & giá cọc</div>
 </div>
 </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("multi-sport")}
 className={`w-full text-left p-3 rounded-2xl flex items-center space-x-3 transition-colors ${
 activeTab === "multi-sport"
 ? "bg-[#0369a1] text-white shadow-md font-extrabold"
 : "bg-slate-50 hover:bg-slate-100 text-slate-700 "
 }`}
 >
 <div className="w-8 h-8 rounded-xl bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center shrink-0">
 <Clock className="w-4 h-4 text-[#0369a1]" />
 </div>
 <div>
 <div className="text-[13px] font-extrabold leading-tight">Sơ Đồ Ca Sân Realtime</div>
 <div className={`text-[13px] ${activeTab === "multi-sport" ? "text-white/80 " : "text-slate-500"}`}>Ma trận slot & trạng thái thi đấu trực tiếp</div>
 </div>
 </button>

  {/* CỘNG ĐỒNG & NHẮN TIN (Chủ sân trao đổi với khách) */}
  <button
  type="button"
  onClick={() => {
  handleSelectSubTab("community");
  setShowMobileDrawer(false);
  }}
  className={`w-full text-left p-3 rounded-2xl flex items-center space-x-3 transition-colors ${
  activeTab === "community"
  ? "bg-[#0369a1] text-white shadow-md font-extrabold"
  : "bg-slate-50 hover:bg-slate-100 text-slate-700 "
  }`}
  >
  <div className="relative w-8 h-8 rounded-xl bg-[#0369a1]/10 flex items-center justify-center shrink-0">
  <MessageCircle className="w-4 h-4 text-[#0369a1]" />
  {chatUnread > 0 && (
  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#0369a1] text-white text-[13px] font-black flex items-center justify-center border-2 border-white">
  {chatUnread > 9 ? "9+" : chatUnread}
  </span>
  )}
  </div>
  <div className="min-w-0 flex-1">
  <div className="text-[13px] font-extrabold leading-tight">Cộng Đồng & Nhắn Tin</div>
  <div className={`text-[13px] truncate ${activeTab === "community" ? "text-white/80 " : "text-slate-500"}`}>
  Trao đổi với khách & nhóm chat
  </div>
  </div>
  </button>

  {/* HỒ SƠ CÁ NHÂN (chủ sân sửa họ tên, SĐT, khu vực, avatar) */}
  <button
  type="button"
  onClick={() => {
  handleSelectSubTab("profile");
  setShowMobileDrawer(false);
  }}
  className={`w-full text-left p-3 rounded-2xl flex items-center space-x-3 transition-colors ${
  activeTab === "profile"
  ? "bg-[#0369a1] text-white shadow-md font-extrabold"
  : "bg-slate-50 hover:bg-slate-100 text-slate-700 "
  }`}
  >
  <div className="w-8 h-8 rounded-xl bg-[#0369a1]/10 flex items-center justify-center shrink-0">
  <User className="w-4 h-4 text-[#0369a1]" />
  </div>
  <div className="min-w-0 flex-1">
  <div className="text-[13px] font-extrabold leading-tight">Hồ Sơ Cá Nhân</div>
  <div className={`text-[13px] truncate ${activeTab === "profile" ? "text-white/80 " : "text-slate-500"}`}>
  Họ tên, SĐT, khu vực & ảnh đại diện
  </div>
  </div>
  </button>
 </div>
 ) : user?.role === "ADMIN" ? (
 <div className="space-y-1.5">
 <a
 href="/admin"
 onClick={() => setShowMobileDrawer(false)}
 className="w-full text-left p-3.5 rounded-2xl flex items-center space-x-3 transition-all bg-rose-600 text-white shadow-md font-extrabold active:scale-95"
 >
 <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
 <ShieldCheck className="w-4 h-4" />
 </div>
 <div>
 <div className="text-[13px] font-extrabold leading-tight">Quản Trị Hệ Thống</div>
 <div className="text-[13px] text-white/80">
 Tổng quan, người dùng, giải đấu & kiểm duyệt
 </div>
 </div>
 </a>
 </div>
 ) : user?.role === "ORGANIZER" ? (
 <div className="space-y-1.5">
 <button
 type="button"
 onClick={() => handleSelectSubTab("organizer")}
 className={`w-full text-left p-3.5 rounded-2xl flex items-center space-x-3 transition-all ${
 activeTab === "organizer"
 ? "bg-[#0369a1] text-white shadow-md font-extrabold"
 : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
 }`}
 >
 <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 text-sky-700 flex items-center justify-center shrink-0">
 <Trophy className="w-[18px] h-[18px] text-sky-700" />
 </div>
 <div>
 <div className="text-[13px] font-extrabold leading-tight flex items-center gap-1.5">
 <span>Điều Hành Giải Đấu</span>
 <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#0369a1] text-white">BTC</span>
 </div>
 <div className={`text-[13px] ${activeTab === "organizer" ? "text-white/80" : "text-slate-500"}`}>
 Tạo giải, duyệt đội & bốc thăm
 </div>
 </div>
 </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("tournaments")}
 className={`w-full text-left p-3.5 rounded-2xl flex items-center space-x-3 transition-all ${
 activeTab === "tournaments"
 ? "bg-[#0369a1] text-white shadow-md font-extrabold"
 : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
 }`}
 >
 <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
 <Award className="w-[18px] h-[18px] text-amber-700" />
 </div>
 <div>
 <div className="text-[13px] font-extrabold leading-tight">Giải Đấu & BXH</div>
 <div className={`text-[13px] ${activeTab === "tournaments" ? "text-white/80" : "text-slate-500"}`}>
 Theo dõi nhánh đấu & phong độ thi đấu
 </div>
 </div>
 </button>

<button
  type="button"
  onClick={() => handleSelectSubTab("matchmaking")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
  activeTab === "matchmaking"
  ? "bg-[#0369a1] text-white shadow-sm font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <Flame className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-rose-600 fill-rose-500 shrink-0" />
  <span>Chợ Kèo</span>
  <span className="px-1.5 py-0.5 rounded text-[13px] font-black bg-rose-500 text-white leading-none shadow-xs">
  HOT
  </span>
  </button>

  <button
  type="button"
  onClick={() => handleSelectSubTab("community")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
  activeTab === "community"
  ? "bg-[#0369a1] text-white shadow-sm font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <MessageCircle className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-[#0369a1] shrink-0" />
  <span>Cộng Đồng</span>
  </button>
 </div>
 ) : (
 <div className="space-y-3">
 {/* ITEM 1: ĐẶT SÂN BÓNG ĐÁ */}
 <button
 type="button"
 onClick={() => handleSelectSubTab("booking")}
 className={`w-full text-left p-3.5 rounded-2xl flex items-center space-x-3 transition-all ${
 activeTab === "booking"
 ? "bg-[#0369a1] text-white shadow-md font-extrabold"
 : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
 }`}
 >
 <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 text-sky-700 flex items-center justify-center shrink-0">
 <Calendar className="w-[18px] h-[18px] text-sky-700" />
 </div>
 <div>
 <div className="text-[13px] font-extrabold leading-tight">Đặt Sân Bóng Đá</div>
 <div className={`text-[13px] ${activeTab === "booking" ? "text-white/80" : "text-slate-500"}`}>
 Tìm cụm sân gần nhất & giữ chỗ online
 </div>
 </div>
 </button>

 {/* ITEM 2: CHỢ KÈO & PASS SÂN */}
<button
  type="button"
  onClick={() => handleSelectSubTab("matchmaking")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
  activeTab === "matchmaking"
  ? "bg-[#0369a1] text-white shadow-sm font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <Flame className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-rose-600 fill-rose-500 shrink-0" />
  <span>Chợ Kèo</span>
  <span className="px-1.5 py-0.5 rounded text-[13px] font-black bg-rose-500 text-white leading-none shadow-xs">
  HOT
  </span>
  </button>

  <button
  type="button"
  onClick={() => handleSelectSubTab("community")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[13px] xl:text-sm font-bold transition-all ${
  activeTab === "community"
  ? "bg-[#0369a1] text-white shadow-sm font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <MessageCircle className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-[#0369a1] shrink-0" />
  <span>Cộng Đồng</span>
  </button>

 {/* ITEM 3: GIẢI ĐẤU & BXH */}
 <button
 type="button"
 onClick={() => handleSelectSubTab("tournaments")}
 className={`w-full text-left p-3.5 rounded-2xl flex items-center space-x-3 transition-all ${
 activeTab === "tournaments" || activeTab === "organizer"
 ? "bg-[#0369a1] text-white shadow-md font-extrabold"
 : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
 }`}
 >
 <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
 <Trophy className="w-[18px] h-[18px] text-amber-700" />
 </div>
 <div>
 <div className="text-[13px] font-extrabold leading-tight">Giải Đấu & BXH</div>
 <div className={`text-[13px] ${activeTab === "tournaments" || activeTab === "organizer" ? "text-white/80" : "text-slate-500"}`}>
 Đăng ký giải, nhánh đấu & lịch sử thi đấu
 </div>
 </div>
 </button>

 {/* ITEM 4: THẺ HỘI VIÊN (chỉ tài khoản đăng nhập) */}
 {user && (
 <button
 type="button"
 onClick={() => handleSelectSubTab("membership")}
 className={`w-full text-left p-3.5 rounded-2xl flex items-center space-x-3 transition-all ${
 activeTab === "membership"
 ? "bg-[#0369a1] text-white shadow-md font-extrabold"
 : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
 }`}
 >
 <div className="w-9 h-9 rounded-xl bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center shrink-0">
 <Award className="w-[18px] h-[18px] text-[#0369a1]" />
 </div>
 <div>
 <div className="text-[13px] font-extrabold leading-tight">Thẻ Hội Viên & Ưu Đãi</div>
 <div className={`text-[13px] ${activeTab === "membership" ? "text-white/80" : "text-slate-500"}`}>
 Gói Pass tháng, tích điểm MP & quà tặng
 </div>
 </div>
 </button>
 )}

 {/* KHỐI CÁ NHÂN VĐV NẾU ĐÃ LOGIN (LỊCH TRÌNH & HỒ SƠ) */}
 {user && (
 <div className="pt-2 border-t border-slate-200/80 space-y-2">
 <span className="text-[13px] font-extrabold tracking-wider text-slate-500 px-1 block">
 Hồ Sơ & Hoạt Động
 </span>

 <button
 type="button"
 onClick={() => handleSelectSubTab("my-activities")}
 className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
 activeTab === "my-activities" ? "bg-[#0369a1]/10 font-black text-[#0b4f6c] " : "hover:bg-slate-100 text-slate-700 "
 }`}
 >
 <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
 <span className="text-[13px] font-bold">Lịch Trình & Vé Đã Đặt</span>
 </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("profile")}
 className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
 activeTab === "profile" ? "bg-[#0369a1]/10 font-black text-[#0b4f6c] " : "hover:bg-slate-100 text-slate-700 "
 }`}
 >
 <User className="w-4 h-4 text-[#0369a1] shrink-0" />
 <span className="text-[13px] font-bold">Hồ Sơ VĐV & Lịch Sử Thi Đấu</span>
 </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("team-management")}
 className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
 activeTab === "team-management" ? "bg-[#0369a1]/10 font-black text-[#0b4f6c] " : "hover:bg-slate-100 text-slate-700 "
 }`}
 >
 <Users className="w-4 h-4 text-emerald-500 shrink-0" />
 <span className="text-[13px] font-bold">Đội Bóng Của Tôi</span>
 </button>
 </div>
 )}
 </div>
 )}
 </div>
 </div>

 {/* Drawer Footer: Logout */}
 <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 space-y-3">
 {user && (
 <button
 type="button"
 onClick={() => {
 setShowMobileDrawer(false);
 onLogout();
 }}
 className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-extrabold text-[13px] flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95"
 >
 <LogOut className="w-4 h-4" />
 <span>Đăng Xuất Tài Khoản</span>
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 )}
 {/* MOBILE BOTTOM NAVIGATION BAR — điều hướng nhanh dạng app */}
 {showBottomNav && (
 <nav
 className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-6px_24px_rgba(15,23,42,0.08)]"
 style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
 aria-label="Điều hướng nhanh trên điện thoại"
 >
 <div
 className="grid"
 style={{ gridTemplateColumns: `repeat(${mobileNav.length}, minmax(0, 1fr))` }}
 >
 {mobileNav.map((item) => {
 const Icon = item.icon;
 const isActive = !!item.tab && activeTab === item.tab;
 return (
 <button
 key={item.key}
 type="button"
 onClick={() => {
 if (item.auth) {
 onOpenAuth("login");
 } else if (item.tab) {
 handleSelectSubTab(item.tab);
 }
 }}
 className={`relative flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 transition-colors active:scale-95 ${
 isActive
 ? "text-[#0b4f6c] "
 : "text-slate-500"
 }`}
 aria-current={isActive ? "page" : undefined}
 >
 <span
 className={`absolute top-0 h-[3px] w-10 rounded-full transition-all ${
 isActive ? "bg-[#0369a1] text-white opacity-100" : "opacity-0"
 }`}
 />
 <Icon className="w-[21px] h-[21px]" />
 <span
  className={`font-bold leading-none tracking-tight ${
  bottomNavDense ? "text-[8.5px]" : "text-[13px]"
  }`}
  >
 {item.label}
 </span>
 </button>
 );
 })}
 </div>
 </nav>
 )}
 {/* Height spacer so content does not get hidden under fixed navbar */}
 <div className="h-[52px] sm:h-16 shrink-0 pointer-events-none" />
 </>
 );
}
