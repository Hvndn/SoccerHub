"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import NavbarAvatar from "@/components/NavbarAvatar";
import {
  Home,
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
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { listMyGroups, listMyConversations, getUnreadCount } from "@/lib/groupChat";
import { useNotifications, formatNotifTime } from "@/lib/useNotifications";

interface NavbarProps {
 activeTab: string;
 setActiveTab: (tab: string) => void;
 user: any | null;
 onOpenAuth: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
 onLogout: () => void;
 onOpenTournament?: (tournamentId: number) => void;
}

export default function Navbar({
 activeTab,
 setActiveTab,
 user,
 onOpenAuth,
 onLogout,
 onOpenTournament
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
 markSingleRead,
 removeNotification,
 clearAllNotifications,
 } = useNotifications(user);

  type NotifFilterKey = "all" | "unread" | "booking" | "tournament" | "system";
  const [notifFilter, setNotifFilter] = useState<NotifFilterKey>("all");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const t = (n.type || "").toUpperCase();
      if (notifFilter === "all") return true;
      if (notifFilter === "unread") return !n.read;
      if (notifFilter === "booking") return t.startsWith("BOOKING");
      if (notifFilter === "tournament")
        return ["TOURNAMENT", "MATCH", "BRACKET", "GOAL", "SCHEDULE"].some((k) => t.startsWith(k));
      return (
        !t.startsWith("BOOKING") &&
        !["TOURNAMENT", "MATCH", "BRACKET", "GOAL", "SCHEDULE"].some((k) => t.startsWith(k))
      );
    });
  }, [notifications, notifFilter]);

  const notifCounts = useMemo(() => {
    const all = notifications.length;
    const unread = notifications.filter((n) => !n.read).length;
    const booking = notifications.filter((n) => (n.type || "").toUpperCase().startsWith("BOOKING")).length;
    const tournament = notifications.filter((n) =>
      ["TOURNAMENT", "MATCH", "BRACKET", "GOAL", "SCHEDULE"].some((k) => (n.type || "").toUpperCase().startsWith(k))
    ).length;
    const system = notifications.filter(
      (n) =>
        !(n.type || "").toUpperCase().startsWith("BOOKING") &&
        !["TOURNAMENT", "MATCH", "BRACKET", "GOAL", "SCHEDULE"].some((k) => (n.type || "").toUpperCase().startsWith(k))
    ).length;
    return { all, unread, booking, tournament, system };
  }, [notifications]);

  const getNotificationActionText = (type?: string) => {
    const t = (type || "").toUpperCase();
    if (t.startsWith("BOOKING")) return "Xem lịch đặt sân →";
    if (t.startsWith("MATCH") || t.includes("COMMUNITY") || t.includes("SOS")) return "Xem chi tiết kèo →";
    if (t.startsWith("TOURNAMENT") || t.startsWith("BRACKET")) return "Xem giải đấu ngay →";
    if (t.startsWith("TEAM") || t.startsWith("CLUB")) return "Xem câu lạc bộ →";
    return "Xem chi tiết →";
  };

  const handleNotificationClick = (notif: any) => {
   if (!notif.read) {
     markSingleRead(notif.id);
   }
   setShowNotifications(false);
   if (!notif.link) return;

   if (/^https?:\/\//i.test(notif.link)) {
     window.location.href = notif.link;
     return;
   }

   try {
     const url = new URL(notif.link, window.location.origin);
     const tabParam = url.searchParams.get("tab");
     const tidParam = url.searchParams.get("tournamentId");

     if (tidParam && !isNaN(Number(tidParam)) && onOpenTournament) {
       onOpenTournament(Number(tidParam));
       return;
     }

     if (tabParam) {
       setActiveTab(tabParam);
       window.history.pushState({ tab: tabParam }, "", notif.link);
       return;
     }

     router.push(notif.link);
   } catch {
     router.push(notif.link);
   }
 };

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
  { key: "home", label: "Trang chủ", tab: "home", icon: Home },
  { key: "organizer", label: "Điều hành", tab: "organizer", icon: ShieldCheck },
  { key: "tournaments", label: "Giải đấu", tab: "tournaments", icon: Trophy },
  { key: "community", label: "Cộng đồng", tab: "community", icon: MessageCircle },
  { key: "profile", label: "Hồ sơ", tab: "profile", icon: User },
  ]
  : user
  ? [
  { key: "home", label: "Trang chủ", tab: "home", icon: Home },
  { key: "booking", label: "Đặt sân", tab: "booking", icon: Calendar },
  { key: "matchmaking", label: "Chợ kèo", tab: "matchmaking", icon: Flame },
  { key: "community", label: "Cộng đồng", tab: "community", icon: MessageCircle },
  { key: "profile", label: "Hồ sơ", tab: "profile", icon: User },
  ]
  : [
  { key: "home", label: "Trang chủ", tab: "home", icon: Home },
  { key: "booking", label: "Đặt sân", tab: "booking", icon: Calendar },
  { key: "matchmaking", label: "Chợ kèo", tab: "matchmaking", icon: Flame },
  { key: "tournaments", label: "Giải đấu", tab: "tournaments", icon: Trophy },
  { key: "login", label: "Đăng nhập", auth: true, icon: LogIn },
  ];

  /** 5 mục trên màn hẹp -> chữ nhỏ lại cho vừa, tránh bị cắt chữ. */
  const bottomNavDense = mobileNav.length >= 5;

 const showBottomNav = user?.role !== "OWNER" && user?.role !== "ADMIN";

 return (
 <>
 <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-xs transition-colors duration-300 w-full">
 <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 xl:px-8 2xl:px-[50px] h-[52px] sm:h-16 flex items-center justify-between gap-2 lg:gap-3 xl:gap-4">
 {/* BRAND LOGO */}
 <div
 onClick={() => {
 if (user?.role === "ADMIN") {
 window.location.assign("/admin");
 return;
 }
 handleSelectSubTab(user?.role === "OWNER" ? "admin" : user?.role === "ORGANIZER" ? "organizer" : "home");
 }}
 className="flex items-center space-x-2 cursor-pointer select-none shrink-0 group"
 title="Turfzone - Hệ Thống Đặt Sân Bóng Đá & Tổ Chức Giải Đấu"
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
 <span>Quản Lý Cụm Sân</span>
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
 <span>Sơ Đồ Sân</span>
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
  <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#0369a1] text-white text-[14px] font-black flex items-center justify-center">
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
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[14px] xl:text-sm font-bold transition-all ${
 activeTab === "organizer"
 ? "bg-[#0369a1] text-white shadow-sm font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Trophy className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-sky-700 shrink-0" />
 <span>Điều Hành Giải Đấu</span>
 <span className="px-1.5 py-0.5 rounded text-[14px] font-black bg-[#0369a1] text-white leading-none shadow-xs">
 BTC
 </span>
 </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("tournaments")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[14px] xl:text-sm font-bold transition-all ${
 activeTab === "tournaments"
 ? "bg-[#0369a1] text-white shadow-sm font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Award className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-amber-700 shrink-0" />
 <span>Giải Đấu</span>
 </button>



  <button
  type="button"
  onClick={() => handleSelectSubTab("community")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[14px] xl:text-sm font-bold transition-all ${
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
  onClick={() => handleSelectSubTab("team-management")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[14px] xl:text-sm font-bold transition-all ${
  activeTab === "team-management" || activeTab === "club"
  ? "bg-[#0369a1] text-white shadow-sm font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <Shield className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-[#0369a1] shrink-0" />
  <span>Câu Lạc Bộ</span>
  </button>
 </>
 ) : !user ? (
 /* GUEST NAVBAR ITEMS — khám phá + CTA tham gia */
 <>
  <button
  type="button"
  onClick={() => handleSelectSubTab("home")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[14px] font-bold transition-all ${
  activeTab === "home" || activeTab === "landing"
  ? "bg-[#0369a1] text-white shadow-xs font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <Home className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "home" || activeTab === "landing" ? "text-white" : "text-slate-500"}`} />
  <span>Trang Chủ</span>
  </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("booking")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[14px] font-bold transition-all ${
 activeTab === "booking"
 ? "bg-[#0369a1] text-white shadow-xs font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Calendar className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "booking" ? "text-white" : "text-slate-500"}`} />
 <span>Đặt Sân</span>
 </button>

<button
  type="button"
  onClick={() => handleSelectSubTab("matchmaking")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[14px] font-bold transition-all ${
  activeTab === "matchmaking"
  ? "bg-[#0369a1] text-white shadow-xs font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <Flame className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "matchmaking" ? "text-white" : "text-slate-500"}`} />
  <span>Chợ Kèo</span>
  </button>

  <button
  type="button"
  onClick={() => handleSelectSubTab("community")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[14px] font-bold transition-all ${
  activeTab === "community"
  ? "bg-[#0369a1] text-white shadow-xs font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <MessageCircle className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "community" ? "text-white" : "text-slate-500"}`} />
  <span>Cộng Đồng</span>
  </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("tournaments")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[14px] font-bold transition-all ${
 activeTab === "tournaments"
 ? "bg-[#0369a1] text-white shadow-xs font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Trophy className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "tournaments" ? "text-white" : "text-slate-500"}`} />
 <span>Giải Đấu</span>
 </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("team-management")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-[14px] font-bold transition-all ${
 activeTab === "team-management" || activeTab === "club"
 ? "bg-[#0369a1] text-white shadow-xs font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Shield className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "team-management" || activeTab === "club" ? "text-white" : "text-slate-500"}`} />
 <span>Câu Lạc Bộ</span>
 </button>

 </>
 ) : (
 /* PLAYER NAVBAR ITEMS */
 <>
  <button
  type="button"
  onClick={() => handleSelectSubTab("home")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3.5 py-2 rounded-xl text-[14px] font-bold transition-all ${
  activeTab === "home" || activeTab === "landing"
  ? "bg-[#0369a1] text-white shadow-xs font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <Home className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "home" || activeTab === "landing" ? "text-white" : "text-slate-500"}`} />
  <span>Trang Chủ</span>
  </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("booking")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3.5 py-2 rounded-xl text-[14px] font-bold transition-all ${
 activeTab === "booking"
 ? "bg-[#0369a1] text-white shadow-xs font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Calendar className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "booking" ? "text-white" : "text-slate-500"}`} />
 <span>Đặt Sân</span>
 </button>

<button
  type="button"
  onClick={() => handleSelectSubTab("matchmaking")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3.5 py-2 rounded-xl text-[14px] font-bold transition-all ${
  activeTab === "matchmaking"
  ? "bg-[#0369a1] text-white shadow-xs font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <Flame className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "matchmaking" ? "text-white" : "text-slate-500"}`} />
  <span>Chợ Kèo</span>
  </button>

  <button
  type="button"
  onClick={() => handleSelectSubTab("community")}
  className={`flex items-center space-x-1.5 xl:space-x-2 px-3.5 py-2 rounded-xl text-[14px] font-bold transition-all ${
  activeTab === "community"
  ? "bg-[#0369a1] text-white shadow-xs font-black"
  : "text-slate-700 hover:bg-slate-100"
  }`}
  >
  <MessageCircle className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "community" ? "text-white" : "text-slate-500"}`} />
  <span>Cộng Đồng</span>
  </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("tournaments")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3.5 py-2 rounded-xl text-[14px] font-bold transition-all ${
 activeTab === "tournaments"
 ? "bg-[#0369a1] text-white shadow-xs font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Trophy className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "tournaments" ? "text-white" : "text-slate-500"}`} />
 <span>Giải Đấu</span>
 </button>

 <button
 type="button"
 onClick={() => handleSelectSubTab("team-management")}
 className={`flex items-center space-x-1.5 xl:space-x-2 px-3.5 py-2 rounded-xl text-[14px] font-bold transition-all ${
 activeTab === "team-management" || activeTab === "club"
 ? "bg-[#0369a1] text-white shadow-xs font-black"
 : "text-slate-700 hover:bg-slate-100"
 }`}
 >
 <Shield className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "team-management" || activeTab === "club" ? "text-white" : "text-slate-500"}`} />
 <span>Câu Lạc Bộ</span>
 </button>


 </>
 )}
 </nav>

 {/* RIGHT SIDE WIDGETS */}
 <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
 


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
 <>
 {/* Mobile: chấm đỏ gọn, không đè lên icon chuông */}
 <span
 className="sm:hidden absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white"
 aria-hidden
 />
 {/* Từ sm trở lên đủ chỗ cho pill số đếm */}
 <span className="hidden sm:flex absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[14px] font-black items-center justify-center px-1 ring-2 ring-white animate-pulse">
 {unreadCount > 9 ? "9+" : unreadCount}
 </span>
 </>
 )}
 </button>

 {showNotifications && (
            <>
              {/* Backdrop mờ trên mobile để chạm ra ngoài tự đóng */}
              <div
                onClick={() => setShowNotifications(false)}
                className="sm:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 animate-fade-in"
              />

              {/* Khung Thông Báo: Trên mobile căn đều 2 lề (left-2 right-2 top-14), trên desktop dropdown góc phải */}
              <div className="fixed left-2 right-2 top-14 sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:absolute w-auto sm:w-[500px] max-w-[540px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-slate-200 z-50 animate-modal-pop overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[580px]">
                {/* Header To Rõ */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
                  <div className="flex items-center space-x-2.5 sm:space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-700">
                      <Bell className="w-[18px] h-[18px] text-[#0b4f6c]" />
                    </div>
                    <span className="font-extrabold text-[15px] sm:text-base text-slate-900">Trung Tâm Thông Báo</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[13px] font-black">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-sky-50 text-[13px] text-sky-700 font-bold flex items-center space-x-1.5 border border-sky-200">
                      <span className="w-2 h-2 rounded-full bg-[#0369a1] animate-pulse inline-block" />
                      <span>Trực Tiếp</span>
                    </span>
                    {/* Nút đóng X trên mobile */}
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="sm:hidden w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer ml-1 transition-colors"
                      title="Đóng thông báo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* DẢI CHIP LỌC PHÂN LOẠI THÔNG BÁO */}
                <div className="px-4 sm:px-6 py-2.5 bg-slate-50/60 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  {[
                    { id: "all" as const, label: "Tất cả", count: notifCounts.all },
                    { id: "unread" as const, label: "Chưa đọc", count: notifCounts.unread, isUnread: true },
                    { id: "booking" as const, label: "Đặt sân & Ca", count: notifCounts.booking },
                    { id: "tournament" as const, label: "Giải đấu", count: notifCounts.tournament },
                    { id: "system" as const, label: "Hệ thống", count: notifCounts.system },
                  ].map((chip) => {
                    const isActive = notifFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setNotifFilter(chip.id)}
                        className={`px-3 py-1 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          isActive
                            ? "bg-[#0369a1] text-white shadow-xs"
                            : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
                        }`}
                      >
                        <span>{chip.label}</span>
                        {chip.count > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[13px] font-mono font-bold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : chip.isUnread
                                ? "bg-rose-500 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {chip.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Notification List Rộng Rãi */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filteredNotifications.length === 0 ? (
                    <div className="py-14 flex flex-col items-center space-y-2 text-slate-500 text-center px-4">
                      <Bell className="w-10 h-10 opacity-30 text-slate-400" />
                      <p className="text-sm font-semibold text-slate-700">
                        {notifFilter === "unread"
                          ? "Tuyệt vời! Bạn không có thông báo chưa đọc nào."
                          : notifFilter === "booking"
                          ? "Không có thông báo đặt sân nào."
                          : notifFilter === "tournament"
                          ? "Không có thông báo giải đấu nào."
                          : notifFilter === "system"
                          ? "Không có thông báo hệ thống nào."
                          : "Chưa có thông báo nào từ hệ thống."}
                      </p>
                      {notifFilter !== "all" && (
                        <button
                          type="button"
                          onClick={() => setNotifFilter("all")}
                          className="text-[13px] text-[#0369a1] font-bold hover:underline cursor-pointer pt-1"
                        >
                          Xem tất cả ({notifCounts.all} thông báo)
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`relative p-4 sm:p-5 transition-colors cursor-pointer hover:bg-slate-100/90 ${
                          !notif.read ? "bg-sky-50/60" : ""
                        }`}
                        title={notif.link ? "Nhấp để mở chi tiết" : undefined}
                      >
                        <div className="flex items-start space-x-3.5">
                          {/* Icon theo loại to hơn */}
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                              notif.type === "BOOKING_CREATED"
                                ? "bg-sky-100 text-sky-700"
                                : notif.type === "BOOKING_CANCELLED"
                                ? "bg-rose-100 text-rose-600"
                                : notif.type === "BOOKING_CHECKED_IN"
                                ? "bg-sky-100 text-[#0369a1]"
                                : notif.type === "TOURNAMENT_INVITE" || notif.type?.startsWith("TOURNAMENT")
                                ? "bg-amber-100 text-amber-800"
                                : "bg-amber-100 text-amber-600"
                            }`}
                          >
                            {notif.type === "BOOKING_CREATED" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                            {notif.type === "BOOKING_CANCELLED" && <XCircle className="w-5 h-5 text-rose-600" />}
                            {notif.type === "BOOKING_CHECKED_IN" && <CheckCircle className="w-5 h-5 text-[#0369a1]" />}
                            {notif.type === "BOOKING_REMINDER" && <Bell className="w-5 h-5 text-amber-700" />}
                            {notif.type === "BOOKING_RESCHEDULED" && <Bell className="w-5 h-5 text-amber-700" />}
                            {(notif.type === "TOURNAMENT_INVITE" || notif.type?.startsWith("TOURNAMENT")) && (
                              <Trophy className="w-5 h-5 text-amber-700" />
                            )}
                            {(notif.type === "PROMO" || notif.type === "OPERATING_HOURS_UPDATED") && (
                              <AlertCircle className="w-5 h-5 text-amber-700" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-extrabold text-slate-900 leading-snug">{notif.title}</p>
                              {!notif.read && (
                                <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1] mt-1 shrink-0" />
                              )}
                            </div>
                            <p className="text-[14px] sm:text-[14px] text-slate-600 leading-relaxed font-medium">
                              {notif.message}
                            </p>

                            {/* Lý do hủy - hiển thị nổi bật */}
                            {notif.type === "BOOKING_CANCELLED" && notif.cancelReason && (
                              <div className="mt-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200">
                                <p className="text-[14px] font-bold text-rose-700">
                                  📋 Lý do: <span className="font-normal">{notif.cancelReason}</span>
                                </p>
                              </div>
                            )}

                            {notif.link && (
                              <p className="text-[13px] font-bold text-[#0369a1] hover:underline inline-flex items-center gap-1 pt-0.5">
                                <span>{getNotificationActionText(notif.type)}</span>
                              </p>
                            )}

                            <p className="text-[14px] text-slate-500 font-mono mt-1.5">{formatNotifTime(notif.time)}</p>
                          </div>

                          {/* Nút xóa */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notif.id);
                            }}
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
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
                  <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        router.push("/notifications");
                      }}
                      className="text-[13px] sm:text-[14px] font-black text-[#0b4f6c] hover:underline cursor-pointer"
                    >
                      Xem tất cả →
                    </button>
                    <span className="text-[13px] sm:text-[14px] font-semibold text-slate-500">
                      {notifications.length} thông báo
                    </span>
                    <button
                      type="button"
                      onClick={() => clearAllNotifications()}
                      className="text-[13px] sm:text-[14px] font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {user ? (
 <div className="relative shrink-0" ref={userMenuRef}>
 <button
 type="button"
 onClick={() => {
 setShowUserDropdown(!showUserDropdown);
 setShowPitchMenu(false);
 setShowTournamentMenu(false);
 setShowNotifications(false);
 }}
 className="flex items-center space-x-2 cursor-pointer p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 shrink-0"
 >
 <div className="w-8 h-8 rounded-full bg-[#0369a1] border-2 border-sky-400 text-white font-extrabold text-[13px] flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
 <NavbarAvatar user={user} />
 </div>

 <div className="text-left hidden sm:block max-w-[110px] md:max-w-[140px] xl:max-w-[160px] overflow-hidden">
 <div className="text-[13px] font-extrabold text-slate-900 leading-tight truncate">
 {user.fullName || user.name || "Người Dùng"}
 </div>
 <div className="text-[13px] font-semibold text-slate-500 flex items-center space-x-1 whitespace-nowrap">
 <span className="text-[#0369a1] font-bold shrink-0">
 {user.role === 'OWNER' ? 'Chủ Sân' : user.role === 'ORGANIZER' ? 'BTC' : user.role === 'ADMIN' ? 'Quản Trị' : 'Cầu Thủ'}
 </span>
 <span className="truncate">
 • {user.role === 'OWNER' ? (user.area || "Đà Nẵng") : (user.level || "Phong trào")}
 </span>
 </div>
 </div>

 <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
 </button>

 {showUserDropdown && (
 <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1.5 z-50 animate-modal-pop">
 <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/80 rounded-xl">
 <div className="flex items-center justify-between">
 <p className="font-extrabold text-[14px] text-slate-900 truncate max-w-[140px]">
 {user.fullName || user.name || "Người Dùng"}
 </p>
 <span className="text-[14px] font-black px-1.5 py-0.5 rounded bg-[#0369a1]/10 text-[#0b4f6c] ">
 {user.role === 'OWNER' ? 'Chủ Sân' : user.role === 'ORGANIZER' ? 'Ban Tổ Chức' : user.role === 'ADMIN' ? 'Quản Trị' : 'Cầu Thủ'}
 </span>
 </div>
 <p className="text-[14px] font-mono text-slate-500 truncate mt-0.5">
 {user.email || user.phone || ""}
 </p>
 
 {user.role === "PLAYER" && (
 <div className="flex items-center gap-1.5 pt-2 text-[13px] flex-wrap">
   <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-bold border border-amber-200">
     <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
     {user.level || "Phong trào"}
   </span>
   {user.area && (
     <span className="flex items-center gap-1 text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md font-bold truncate max-w-[140px] border border-sky-200">
       <Award className="w-3.5 h-3.5 text-[#0369a1]" />
       {user.area}
     </span>
   )}
 </div>
 )}
 </div>

 {user.role === "ADMIN" && (
 <a
 href="/admin"
 onClick={() => setShowUserDropdown(false)}
 className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-black text-white bg-rose-600 hover:bg-rose-700 flex items-center space-x-2 transition-all active:scale-95 shadow-md"
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
 className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
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
 className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-bold text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100 flex items-center space-x-2 transition-colors"
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
 className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
 >
 <Clock className="w-4 h-4 text-[#0369a1]" />
 <span>Sơ Đồ Sân</span>
 </button>
  <button
  type="button"
  onClick={() => {
  handleSelectSubTab("organizer");
  setShowUserDropdown(false);
  }}
  className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
  >
  <Trophy className="w-4 h-4 text-sky-700" />
  <span>Điều Hành Giải Đấu</span>
  </button>



  <button
  type="button"
  onClick={() => {
  handleSelectSubTab("profile");
  setShowUserDropdown(false);
  }}
  className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
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
 className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
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
 className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
 >
 <Award className="w-4 h-4 text-amber-700" />
 <span>Giải Đấu & BXH</span>
 </button>

 <button
 type="button"
 onClick={() => {
 handleSelectSubTab("profile");
 setShowUserDropdown(false);
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors"
 >
 <User className="w-4 h-4 text-[#0369a1]" />
 <span>Hồ Sơ Ban Tổ Chức</span>
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
 className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors cursor-pointer"
 >
 <User className="w-4 h-4 text-[#0369a1]" />
 <span>Hồ Sơ Cầu Thủ & Rating</span>
 </button>

 <button
 type="button"
 onClick={() => {
 handleSelectSubTab("team-management");
 setShowUserDropdown(false);
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors cursor-pointer"
 >
 <Users className="w-4 h-4 text-[#0369a1]" />
 <span>Đội Bóng Của Tôi</span>
 </button>

 <button
 type="button"
 onClick={() => {
 handleSelectSubTab("membership");
 setShowUserDropdown(false);
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors cursor-pointer"
 >
 <Award className="w-4 h-4 text-amber-600" />
 <span>Thẻ Hội Viên TurfZone</span>
 </button>

 <button
 type="button"
 onClick={() => {
 handleSelectSubTab("my-activities");
 setShowUserDropdown(false);
 }}
 className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-bold text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition-colors cursor-pointer"
 >
 <Calendar className="w-4 h-4 text-emerald-600" />
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
 className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-extrabold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
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
 className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-[14px] transition-all border border-slate-200 flex items-center space-x-1 active:scale-95 shrink-0"
 >
 <LogIn className="w-3.5 h-3.5 text-[#0b4f6c] " />
 <span>Đăng Nhập</span>
 </button>
 <button
 type="button"
 onClick={() => onOpenAuth("register")}
 className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[14px] transition-all shadow-md hidden sm:flex items-center space-x-1 active:scale-95"
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

   {/* MOBILE SLIDING DRAWER (TRƯỢT TỪ PHẢI SANG CHUẨN APP) */}
  {showMobileDrawer && (
  <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
  {/* Backdrop mờ làm tối nền */}
  <div
  onClick={() => setShowMobileDrawer(false)}
  className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
  />

  {/* Sliding Panel trượt từ phải - chiều rộng chuẩn app 88vw tối đa 390px */}
  <div className="absolute inset-y-0 right-0 max-w-full flex">
  <div className="w-[88vw] sm:w-96 max-w-[390px] h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
    {/* Drawer Header */}
    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
      <div className="flex items-center space-x-2">
        <SafeImage
          src="/turfzone-logo.png"
          alt="Turfzone Logo"
          className="h-7 w-auto object-contain"
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

    {/* Drawer Body - cuộn mượt và có padding dưới tránh bị che */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
      {/* User Snapshot Card nếu đã login */}
      {user ? (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0369a1] text-white flex items-center justify-center font-bold text-base shrink-0">
              {(user.fullName || user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[14px] text-slate-900 truncate">
                {user.fullName || user.name || "Cầu Thủ Turfzone"}
              </p>
              <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-[#0369a1] text-[13px] font-bold">
                {user.role === "OWNER"
                  ? "Chủ Sân Đối Tác"
                  : user.role === "ORGANIZER"
                  ? "Ban Tổ Chức"
                  : user.role === "ADMIN"
                  ? "Quản Trị Viên"
                  : "Cầu Thủ"}
              </span>
            </div>
          </div>
          {(user.role === "PLAYER" || user.role === "ORGANIZER") && (
            <div className="text-[13px] text-slate-600 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
              <span>Trình độ:</span>
              <strong className="text-[#0369a1] font-semibold">{user.level ?? "Phong trào"}</strong>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 space-y-2">
          <p className="font-bold text-[14px] text-[#0369a1]">
            Gia nhập cộng đồng Turfzone
          </p>
          <p className="text-[13px] text-slate-600 leading-relaxed">
            Đăng nhập để theo dõi lịch trình, giải đấu và phong độ của bạn.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowMobileDrawer(false);
                onOpenAuth("login");
              }}
              className="flex-1 py-2 rounded-lg bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] text-center shadow-xs cursor-pointer"
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMobileDrawer(false);
                onOpenAuth("register");
              }}
              className="flex-1 py-2 rounded-lg bg-white text-slate-700 font-bold text-[13px] border border-slate-300 text-center cursor-pointer"
            >
              Đăng Ký
            </button>
          </div>
        </div>
      )}

      {/* Menu Categories */}
      <div className="space-y-1.5">
        <span className="text-[13px] font-bold text-slate-500 px-1 block mb-2">
          Danh Mục Nền Tảng
        </span>

        {user?.role === "OWNER" ? (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("admin");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "admin"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "admin" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Quản Lý Cụm Sân & Doanh Thu</span>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "admin" ? "text-white/70" : "text-slate-400"}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("multi-sport");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "multi-sport"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "multi-sport" ? "bg-white/20 text-white" : "bg-sky-50 text-[#0369a1]"}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Sơ Đồ Ca Sân Trực Tiếp</span>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "multi-sport" ? "text-white/70" : "text-slate-400"}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("community");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "community"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "community" ? "bg-white/20 text-white" : "bg-sky-50 text-[#0369a1]"}`}>
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Cộng Đồng & Nhắn Tin</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {chatUnread > 0 && (
                  <span className="min-w-[18px] h-4.5 px-1.5 rounded-full bg-rose-600 text-white text-[13px] font-bold flex items-center justify-center">
                    {chatUnread > 9 ? "9+" : chatUnread}
                  </span>
                )}
                <ChevronRight className={`w-4 h-4 ${activeTab === "community" ? "text-white/70" : "text-slate-400"}`} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("profile");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "profile"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "profile" ? "bg-white/20 text-white" : "bg-sky-50 text-[#0369a1]"}`}>
                  <User className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Hồ Sơ Cá Nhân</span>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "profile" ? "text-white/70" : "text-slate-400"}`} />
            </button>
          </div>
        ) : user?.role === "ADMIN" ? (
          <div className="space-y-1.5">
            <a
              href="/admin"
              onClick={() => setShowMobileDrawer(false)}
              className="w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors bg-rose-600 text-white font-bold shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Quản Trị Hệ Thống</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/70 shrink-0" />
            </a>
          </div>
        ) : user?.role === "ORGANIZER" ? (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("organizer");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "organizer"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "organizer" ? "bg-white/20 text-white" : "bg-sky-50 text-sky-700"}`}>
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Điều Hành Giải Đấu</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.5 rounded text-[13px] font-bold bg-[#0369a1] text-white">BTC</span>
                <ChevronRight className={`w-4 h-4 ${activeTab === "organizer" ? "text-white/70" : "text-slate-400"}`} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("tournaments");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "tournaments"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "tournaments" ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700"}`}>
                  <Award className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Giải Đấu & BXH</span>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "tournaments" ? "text-white/70" : "text-slate-400"}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("community");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "community"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "community" ? "bg-white/20 text-white" : "bg-sky-50 text-[#0369a1]"}`}>
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Cộng Đồng</span>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "community" ? "text-white/70" : "text-slate-400"}`} />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("home");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "home" || activeTab === "landing"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "home" || activeTab === "landing" ? "bg-white/20 text-white" : "bg-sky-50 text-[#0369a1]"}`}>
                  <Home className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Trang Chủ</span>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "home" || activeTab === "landing" ? "text-white/70" : "text-slate-400"}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("booking");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "booking"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "booking" ? "bg-white/20 text-white" : "bg-sky-50 text-[#0369a1]"}`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Đặt Sân Bóng Đá</span>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "booking" ? "text-white/70" : "text-slate-400"}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("matchmaking");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "matchmaking"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "matchmaking" ? "bg-white/20 text-white" : "bg-rose-50 text-rose-600"}`}>
                  <Flame className="w-4 h-4 fill-rose-500" />
                </div>
                <span className="font-bold text-[14px] truncate">Chợ Kèo & SOS Mượn Chân</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.5 rounded text-[13px] font-bold bg-rose-600 text-white leading-none">
                  HOT
                </span>
                <ChevronRight className={`w-4 h-4 ${activeTab === "matchmaking" ? "text-white/70" : "text-slate-400"}`} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("community");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "community"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "community" ? "bg-white/20 text-white" : "bg-sky-50 text-[#0369a1]"}`}>
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Cộng Đồng & Nhắn Tin</span>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "community" ? "text-white/70" : "text-slate-400"}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("tournaments");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "tournaments"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "tournaments" ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700"}`}>
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Giải Đấu & BXH</span>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "tournaments" ? "text-white/70" : "text-slate-400"}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                handleSelectSubTab("team-management");
                setShowMobileDrawer(false);
              }}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === "team-management" || activeTab === "club"
                  ? "bg-[#0369a1] text-white font-bold shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "team-management" || activeTab === "club" ? "bg-white/20 text-white" : "bg-sky-50 text-[#0369a1]"}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-bold text-[14px] truncate">Câu Lạc Bộ & Đội Bóng</span>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "team-management" || activeTab === "club" ? "text-white/70" : "text-slate-400"}`} />
            </button>

            {user && (
              <>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectSubTab("membership");
                    setShowMobileDrawer(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                    activeTab === "membership"
                      ? "bg-[#0369a1] text-white font-bold shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "membership" ? "bg-white/20 text-white" : "bg-sky-50 text-[#0369a1]"}`}>
                      <Award className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-[14px] truncate">Thẻ Hội Viên & Ưu Đãi</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "membership" ? "text-white/70" : "text-slate-400"}`} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectSubTab("my-activities");
                    setShowMobileDrawer(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                    activeTab === "my-activities"
                      ? "bg-[#0369a1] text-white font-bold shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "my-activities" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"}`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-[14px] truncate">Lịch Trình & Vé Đã Đặt</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "my-activities" ? "text-white/70" : "text-slate-400"}`} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectSubTab("profile");
                    setShowMobileDrawer(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                    activeTab === "profile"
                      ? "bg-[#0369a1] text-white font-bold shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "profile" ? "bg-white/20 text-white" : "bg-sky-50 text-[#0369a1]"}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-[14px] truncate">Hồ Sơ Cầu Thủ</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${activeTab === "profile" ? "text-white/70" : "text-slate-400"}`} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Drawer Footer: Logout */}
    {user && (
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <button
          type="button"
          onClick={() => {
            setShowMobileDrawer(false);
            onLogout();
          }}
          className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-[14px] flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng Xuất Tài Khoản</span>
        </button>
      </div>
    )}
  </div>
  </div>
  </div>
  )}

  {/* MOBILE BOTTOM NAVIGATION BAR — điều hướng nhanh dạng app */}
 {showBottomNav && (
 <nav
 className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95  border-t border-slate-200 shadow-[0_-6px_24px_rgba(15,23,42,0.08)]"
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
  "text-[13px]"
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
