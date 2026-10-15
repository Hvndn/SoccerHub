"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Trophy,
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
  AlertCircle
} from "lucide-react";
import { subscribeToBookingEvents, playNotificationChime, type RealtimeBookingEvent } from "@/lib/realtimeService";
import { listMyNotifications, markNotificationRead } from "@/lib/adminService";

// Notification item type
interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  cancelReason?: string;
  serverId?: number;
  link?: string | null;
}

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [mobilePitchOpen, setMobilePitchOpen] = useState(true);
  const [mobileTournamentOpen, setMobileTournamentOpen] = useState(false);

  const NOTIFS_STORAGE_KEY = "soccerhub_user_notifications";

  // Notification Center State — chỉ lấy thông báo thật từ server, không có mẫu giả
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notificationsRef = useRef<AppNotification[]>([]);
  // Mirror để đọc state mới nhất ngoài render (đồng bộ server)
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Load saved notifications from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTIFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.map((item: any) => ({
            ...item,
            time: new Date(item.time)
          }));
          setNotifications(formatted);
        }
      }
    } catch (e) {
      // ignore parse error
    }
  }, []);

  // Thông báo thật từ server khi đã đăng nhập (poll mỗi 60s). Khách: giữ local.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const pull = async (initial = false) => {
      try {
        const rows = await listMyNotifications();
        if (!alive) return;
        setNotifications((prev) => {
          const localOnly = prev.filter((n) => n.serverId == null);
          const mapped: AppNotification[] = rows.map((r) => ({
            id: `srv-${r.id}`,
            serverId: r.id,
            type: r.type || "SYSTEM",
            title: r.title,
            message: r.message || "",
            time: r.createdAt ? new Date(r.createdAt) : new Date(),
            read: !!r.read,
            link: r.link ?? null,
          }));
          const merged = [...mapped, ...localOnly].slice(0, 25);
          saveNotifications(merged);
          return merged;
        });
      } catch {
        // backend chưa chạy / chưa đăng nhập xong — giữ thông báo local
      }
    };
    pull(true);
    const timer = setInterval(() => pull(false), 60000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [user]);

  // Save to localStorage helper
  const saveNotifications = (items: AppNotification[]) => {
    try {
      localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
  };

  // Grouped Dropdown States
  const [showPitchMenu, setShowPitchMenu] = useState(false);
  const [showTournamentMenu, setShowTournamentMenu] = useState(false);

  const pitchMenuRef = useRef<HTMLDivElement>(null);
  const tournamentMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Subscribe to realtime booking events (cả cùng tab và đa tab)
  useEffect(() => {
    const unsubscribe = subscribeToBookingEvents((event: RealtimeBookingEvent) => {
      let newNotif: AppNotification | null = null;

      if (event.type === "BOOKING_CREATED") {
        newNotif = {
          id: `booking-${event.bookingId || Date.now()}`,
          type: "BOOKING_CREATED",
          title: "✅ Đặt Sân Thành Công!",
          message: `Ca ${event.timeSlot || ""} tại ${event.courtName || "sân"} đã được xác nhận. Mã: ${event.code || "--"}.`,
          time: new Date(event.timestamp),
          read: false
        };
      } else if (event.type === "BOOKING_CANCELLED") {
        newNotif = {
          id: `cancel-${event.bookingId || Date.now()}`,
          type: "BOOKING_CANCELLED",
          title: "❌ Ca Đặt Sân Bị Hủy",
          message: `Ca ${event.timeSlot || ""} tại ${event.courtName || "sân"} đã bị hủy bởi chủ sân.`,
          time: new Date(event.timestamp),
          read: false,
          cancelReason: event.cancelReason
        };
      } else if (event.type === "BOOKING_CHECKED_IN") {
        newNotif = {
          id: `checkin-${event.bookingId || Date.now()}`,
          type: "BOOKING_CHECKED_IN",
          title: "🏟️ Check-in Xác Nhận!",
          message: `Bạn đã check-in thành công ca ${event.timeSlot || ""} tại ${event.courtName || "sân"}.`,
          time: new Date(event.timestamp),
          read: false
        };
      }

      if (newNotif) {
        playNotificationChime();
        setNotifications(prev => {
          // Tránh duplicate notification id
          const filtered = prev.filter(n => n.id !== newNotif!.id);
          const updated = [newNotif!, ...filtered].slice(0, 25);
          saveNotifications(updated);
          return updated;
        });
      }
    });

    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useCallback(() => {
    // Đồng bộ lên server trước (fire-and-forget), rồi mới đánh dấu local
    notificationsRef.current
      .filter(n => n.serverId != null && !n.read)
      .forEach(n => markNotificationRead(n.serverId as number).catch(() => {}));
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  };

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
          { key: "community", label: "Chợ kèo", tab: "community", icon: Flame },
          { key: "profile", label: "Hồ sơ", tab: "profile", icon: User },
        ]
      : user
      ? [
          { key: "booking", label: "Đặt sân", tab: "booking", icon: Calendar },
          { key: "community", label: "Chợ kèo", tab: "community", icon: Flame },
          { key: "tournaments", label: "Giải đấu", tab: "tournaments", icon: Trophy },
          { key: "my-activities", label: "Vé của tôi", tab: "my-activities", icon: Ticket },
          { key: "profile", label: "Hồ sơ", tab: "profile", icon: User },
        ]
      : [
          { key: "booking", label: "Đặt sân", tab: "booking", icon: Calendar },
          { key: "community", label: "Chợ kèo", tab: "community", icon: Flame },
          { key: "tournaments", label: "Giải đấu", tab: "tournaments", icon: Trophy },
          { key: "login", label: "Đăng nhập", auth: true, icon: LogIn },
        ];

  const showBottomNav = user?.role !== "OWNER" && user?.role !== "ADMIN";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300 w-full">
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
          title="SoccerHub - Nền Tảng Quản Lý Sân Bóng & Giải Đấu Thông Minh"
        >
          {/* Light Mode Logo Image */}
          <img 
            src="/turfzone-logo.png" 
            alt="SoccerHub Logo" 
            className="h-8 sm:h-9 w-auto object-contain dark:hidden transition-transform group-hover:scale-105" 
          />
          {/* Dark Mode Logo Image */}
          <img 
            src="/turfzone-logo-dark.png" 
            alt="SoccerHub Logo" 
            className="h-8 sm:h-9 w-auto object-contain hidden dark:block transition-transform group-hover:scale-105" 
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
                    ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Clock className="w-[18px] h-[18px] text-emerald-400 shrink-0" />
                <span>Sơ Đồ Ca Sân Realtime</span>
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
                className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  activeTab === "organizer"
                    ? "bg-[#0b4f6c] text-white shadow-sm font-black"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Trophy className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-emerald-600 shrink-0" />
                <span>Điều Hành Giải Đấu</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#0b4f6c] text-white leading-none shadow-xs">
                  BTC
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSubTab("tournaments")}
                className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  activeTab === "tournaments"
                    ? "bg-[#0b4f6c] text-white shadow-sm font-black"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Award className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-amber-500 shrink-0" />
                <span>Giải Đấu &amp; BXH</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSubTab("community")}
                className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  activeTab === "community" || activeTab === "urgent-resale"
                    ? "bg-[#0b4f6c] text-white shadow-sm font-black"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Flame className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-rose-500 fill-rose-500 shrink-0" />
                <span>Chợ Kèo &amp; Pass Sân</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500 text-white leading-none shadow-xs">
                  HOT
                </span>
              </button>
            </>
          ) : !user ? (
            /* GUEST NAVBAR ITEMS — khám phá + CTA tham gia */
            <>
              <button
                type="button"
                onClick={() => handleSelectSubTab("booking")}
                className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  activeTab === "booking"
                    ? "bg-[#0b4f6c] text-white shadow-sm font-black"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Calendar className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-emerald-600 shrink-0" />
                <span>Đặt Sân Bóng Đá</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSubTab("community")}
                className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  activeTab === "community" || activeTab === "urgent-resale"
                    ? "bg-[#0b4f6c] text-white shadow-sm font-black"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Flame className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-rose-500 fill-rose-500 shrink-0" />
                <span>Chợ Kèo &amp; Pass Sân</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500 text-white leading-none shadow-xs">
                  HOT
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSubTab("tournaments")}
                className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  activeTab === "tournaments"
                    ? "bg-[#0b4f6c] text-white shadow-sm font-black"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Trophy className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-amber-500 shrink-0" />
                <span>Giải Đấu &amp; BXH</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth("register")}
                className="flex items-center space-x-1.5 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-black transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Tham Gia Ngay</span>
              </button>
            </>
          ) : (
            /* PLAYER NAVBAR ITEMS */
            <>
              <button
                type="button"
                onClick={() => handleSelectSubTab("booking")}
                className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  activeTab === "booking"
                    ? "bg-[#0b4f6c] text-white shadow-sm font-black"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Calendar className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-emerald-600 shrink-0" />
                <span>Đặt Sân Bóng Đá</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSubTab("community")}
                className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  activeTab === "community" || activeTab === "urgent-resale"
                    ? "bg-[#0b4f6c] text-white shadow-sm font-black"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Flame className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-rose-500 fill-rose-500 shrink-0" />
                <span>Chợ Kèo &amp; Pass Sân</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500 text-white leading-none shadow-xs">
                  HOT
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSubTab("tournaments")}
                className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  activeTab === "tournaments"
                    ? "bg-[#0b4f6c] text-white shadow-sm font-black"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Trophy className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-amber-500 shrink-0" />
                <span>Giải Đấu &amp; BXH</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSubTab("team-management")}
                className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  activeTab === "team-management"
                    ? "bg-[#0b4f6c] text-white shadow-sm font-black"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Users className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-sky-600 shrink-0" />
                <span>Đội Bóng</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSubTab("membership")}
                className={`flex items-center space-x-1.5 xl:space-x-2 px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  activeTab === "membership"
                    ? "bg-[#0b4f6c] text-white shadow-sm font-black"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Award className="w-4 h-4 xl:w-[18px] xl:h-[18px] text-amber-500 shrink-0" />
                <span>Thẻ Hội Viên</span>
              </button>
            </>
          )}
        </nav>

        {/* RIGHT SIDE WIDGETS */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {user?.role === "PLAYER" && (
            <div className="hidden 2xl:flex items-center space-x-3 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs font-bold font-mono">
              <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Elo {user?.eloRating ?? "—"}</span>
              </div>
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
              <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200">
                <Award className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400" />
                <span>{user?.level || "Chưa xếp bậc"}</span>
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
              className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700/80 transition-all shadow-xs"
              title="Thông báo hệ thống"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#0b4f6c] dark:text-sky-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center px-1.5 ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-[calc(100vw-24px)] max-w-[360px] sm:max-w-[540px] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-slate-200 dark:border-slate-800 z-50 animate-modal-pop overflow-hidden">
                {/* Header To Rõ */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Bell className="w-[18px] h-[18px] text-[#0b4f6c] dark:text-sky-400" />
                    </div>
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">Trung Tâm Thông Báo</span>
                    {unreadCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1.5 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      <span>Live Realtime</span>
                    </span>
                  </div>
                </div>

                {/* Notification List Rộng Rãi */}
                <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="py-16 flex flex-col items-center space-y-3 text-slate-400">
                      <Bell className="w-12 h-12 opacity-30 text-slate-400" />
                      <p className="text-sm font-semibold">Chưa có thông báo nào từ hệ thống</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`relative p-4 sm:p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          !notif.read ? "bg-sky-50/60 dark:bg-sky-950/20" : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3.5">
                          {/* Icon theo loại to hơn */}
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                            notif.type === "BOOKING_CREATED" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" :
                            notif.type === "BOOKING_CANCELLED" ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600" :
                            notif.type === "BOOKING_CHECKED_IN" ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600" :
                            "bg-amber-100 dark:bg-amber-900/40 text-amber-600"
                          }`}>
                            {notif.type === "BOOKING_CREATED" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                            {notif.type === "BOOKING_CANCELLED" && <XCircle className="w-5 h-5 text-rose-500" />}
                            {notif.type === "BOOKING_CHECKED_IN" && <CheckCircle className="w-5 h-5 text-sky-500" />}
                            {(notif.type === "PROMO" || notif.type === "OPERATING_HOURS_UPDATED") && <AlertCircle className="w-5 h-5 text-amber-500" />}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">{notif.title}</p>
                              {!notif.read && (
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 mt-1 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{notif.message}</p>

                            {/* Lý do hủy - hiển thị nổi bật */}
                            {notif.type === "BOOKING_CANCELLED" && notif.cancelReason && (
                              <div className="mt-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                                <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                                  📋 Lý do: <span className="font-normal">{notif.cancelReason}</span>
                                </p>
                              </div>
                            )}

                            <p className="text-[11px] text-slate-400 font-mono mt-1.5">{formatTime(notif.time)}</p>
                          </div>

                          {/* Nút xóa */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
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
                  <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => clearAllNotifications()}
                      className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                    >
                      Xóa tất cả thông báo
                    </button>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{notifications.length} thông báo</span>
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
                className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer pl-1 py-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="text-right hidden sm:block max-w-[130px] md:max-w-[170px]">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                    {user.fullName || user.name || "Người Dùng"}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono flex items-center justify-end space-x-1 whitespace-nowrap">
                    <span className="text-[#0b4f6c] dark:text-sky-400 font-extrabold shrink-0">
                      {user.role === 'OWNER' ? 'Chủ Sân' : user.role === 'ORGANIZER' ? 'BTC' : user.role === 'ADMIN' ? 'Quản Trị' : 'Cầu Thủ'}
                    </span>
                    {user.role === 'OWNER' ? (
                      <span className="shrink-0 text-emerald-500 font-bold">• {user.area || "Chưa cập nhật khu vực"}</span>
                    ) : (
                      <span className="shrink-0">• Elo {user.eloRating ?? "—"}</span>
                    )}
                    <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0b4f6c] dark:bg-sky-500 border-2 border-sky-400 text-white dark:text-slate-950 font-extrabold text-[10px] sm:text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {user.avatar || (user.fullName ? user.fullName.substring(0, 2).toUpperCase() : user.name ? user.name.substring(0, 2).toUpperCase() : "SH")}
                </div>
              </div>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1.5 z-50 animate-modal-pop">
                  <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate max-w-[140px]">
                        {user.fullName || user.name || "Người Dùng"}
                      </p>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#0b4f6c]/10 dark:bg-sky-400/20 text-[#0b4f6c] dark:text-sky-400">
                        {user.role === 'OWNER' ? 'Chủ Sân' : user.role === 'ORGANIZER' ? 'Ban Tổ Chức' : user.role === 'ADMIN' ? 'Quản Trị' : 'Cầu Thủ'}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                      {user.email || user.phone || ""}
                    </p>
                  </div>

                  {user.role === "ADMIN" && (
                    <a
                      href="/admin"
                      onClick={() => setShowUserDropdown(false)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 flex items-center space-x-2 transition-all active:scale-95 shadow-md"
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
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition-colors"
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
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center space-x-2 transition-colors"
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
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                      >
                        <Clock className="w-4 h-4 text-sky-500" />
                        <span>Sơ Đồ Ca Sân Realtime</span>
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
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition-colors"
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
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                      >
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Giải Đấu & BXH</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleSelectSubTab("my-activities");
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition-colors"
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
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                      >
                        <User className="w-4 h-4 text-sky-500" />
                        <span>Hồ Sơ VĐV & Rating</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleSelectSubTab("my-activities");
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        <span>Lịch Trình & Vé Đã Đặt</span>
                      </button>
                    </>
                  ) : null}

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
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
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs transition-all border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white flex items-center space-x-1 active:scale-95 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-[#0b4f6c] dark:text-sky-400" />
                <span>Đăng Nhập</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth("register")}
                className="px-3.5 py-2 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 hover:bg-[#07384d] dark:hover:bg-sky-400 text-white dark:text-slate-950 font-extrabold text-xs transition-all shadow-md hidden sm:flex items-center space-x-1 active:scale-95"
              >
                <span>Đăng Ký</span>
              </button>
            </div>
          )}

          {/* HAMBURGER BUTTON (MOBILE ONLY) */}
          <button
            type="button"
            onClick={() => setShowMobileDrawer(true)}
            className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer active:scale-95 ml-1"
            title="Mở menu ứng dụng"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5 text-[#0b4f6c] dark:text-sky-400" />
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
            <div className="w-screen max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
                <div className="flex items-center space-x-2">
                  <img
                    src="/turfzone-logo.png"
                    alt="SoccerHub Logo"
                    className="h-7 w-auto object-contain dark:hidden"
                  />
                  <img
                    src="/turfzone-logo-dark.png"
                    alt="SoccerHub Logo"
                    className="h-7 w-auto object-contain hidden dark:block"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileDrawer(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Đóng menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body - Danh Sách Chức Năng Theo Role */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-6">
                {/* User Snapshot Card nếu đã login */}
                {user ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 flex items-center justify-center font-black text-lg shrink-0">
                        {(user.fullName || user.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-sm text-slate-900 dark:text-white truncate">
                          {user.fullName || user.name || "Cầu Thủ SoccerHub"}
                        </p>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-sky-50 dark:bg-sky-500/10 text-[#0b4f6c] dark:text-sky-300">
                          {user.role === "OWNER" ? "Chủ Sân Đối Tác" : user.role === "ORGANIZER" ? "Ban Tổ Chức" : user.role === "ADMIN" ? "Quản Trị Viên" : "VĐV Chuyên Nghiệp"}
                        </span>
                      </div>
                    </div>
                    {(user.role === "PLAYER" || user.role === "ORGANIZER") && (
                      <div className="flex items-center justify-between text-xs font-mono font-bold pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500">
                          Elo:{" "}
                          <strong className="text-[#0b4f6c] dark:text-sky-400">
                            {user.eloRating ?? "—"}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/50 space-y-2">
                    <p className="font-extrabold text-xs text-[#0b4f6c] dark:text-sky-300">
                      Gia nhập cộng đồng SoccerHub
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Đăng nhập để theo dõi lịch trình, giải đấu và xếp hạng Elo của bạn.
                    </p>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMobileDrawer(false);
                          onOpenAuth("login");
                        }}
                        className="flex-1 py-2 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 font-bold text-xs text-center shadow-xs"
                      >
                        Đăng Nhập
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMobileDrawer(false);
                          onOpenAuth("register");
                        }}
                        className="flex-1 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 text-center"
                      >
                        Đăng Ký
                      </button>
                    </div>
                  </div>
                )}

                {/* Danh mục menu điều hướng chính đồng bộ 100% với PC Dropdowns */}
                <div className="space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 block">
                    Danh Mục Nền Tảng
                  </span>

                  {user?.role === "OWNER" ? (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectSubTab("admin")}
                        className={`w-full text-left p-3 rounded-2xl flex items-center space-x-3 transition-colors ${
                          activeTab === "admin"
                            ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md font-extrabold"
                            : "bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold leading-tight">Quản Lý Cụm Sân & Doanh Thu</div>
                          <div className={`text-[10px] ${activeTab === "admin" ? "text-white/80 dark:text-slate-900/80" : "text-slate-400"}`}>Điều hành doanh thu, ca sân & giá cọc</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectSubTab("multi-sport")}
                        className={`w-full text-left p-3 rounded-2xl flex items-center space-x-3 transition-colors ${
                          activeTab === "multi-sport"
                            ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md font-extrabold"
                            : "bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-sky-500" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold leading-tight">Sơ Đồ Ca Sân Realtime</div>
                          <div className={`text-[10px] ${activeTab === "multi-sport" ? "text-white/80 dark:text-slate-900/80" : "text-slate-400"}`}>Ma trận slot & trạng thái thi đấu trực tiếp</div>
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
                          <div className="text-xs font-extrabold leading-tight">Quản Trị Hệ Thống</div>
                          <div className="text-[10px] text-white/80">
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
                            ? "bg-emerald-600 text-white shadow-md font-extrabold"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <Trophy className="w-[18px] h-[18px] text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold leading-tight flex items-center gap-1.5">
                            <span>Điều Hành Giải Đấu</span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-[#0b4f6c] text-white">BTC</span>
                          </div>
                          <div className={`text-[10px] ${activeTab === "organizer" ? "text-white/80" : "text-slate-400"}`}>
                            Tạo giải, duyệt đội & bốc thăm
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectSubTab("tournaments")}
                        className={`w-full text-left p-3.5 rounded-2xl flex items-center space-x-3 transition-all ${
                          activeTab === "tournaments"
                            ? "bg-emerald-600 text-white shadow-md font-extrabold"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                          <Award className="w-[18px] h-[18px] text-amber-500" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold leading-tight">Giải Đấu & BXH</div>
                          <div className={`text-[10px] ${activeTab === "tournaments" ? "text-white/80" : "text-slate-400"}`}>
                            Theo dõi nhánh đấu & xếp hạng Elo
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectSubTab("community")}
                        className={`w-full text-left p-3.5 rounded-2xl flex items-center space-x-3 transition-all ${
                          activeTab === "community" || activeTab === "urgent-resale"
                            ? "bg-emerald-600 text-white shadow-md font-extrabold"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                          <Flame className="w-[18px] h-[18px] text-rose-500" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold leading-tight flex items-center gap-1.5">
                            <span>Chợ Kèo & Pass Sân</span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-rose-500 text-white">HOT</span>
                          </div>
                          <div className={`text-[10px] ${activeTab === "community" || activeTab === "urgent-resale" ? "text-white/80" : "text-slate-400"}`}>
                            Tìm đối cáp kèo & tuyển quân
                          </div>
                        </div>
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
                            ? "bg-emerald-600 text-white shadow-md font-extrabold"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <Calendar className="w-[18px] h-[18px] text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold leading-tight">Đặt Sân Bóng Đá</div>
                          <div className={`text-[10px] ${activeTab === "booking" ? "text-white/80" : "text-slate-400"}`}>
                            Tìm cụm sân gần nhất & giữ chỗ online
                          </div>
                        </div>
                      </button>

                      {/* ITEM 2: CHỢ KÈO & PASS SÂN */}
                      <button
                        type="button"
                        onClick={() => handleSelectSubTab("community")}
                        className={`w-full text-left p-3.5 rounded-2xl flex items-center space-x-3 transition-all ${
                          activeTab === "community" || activeTab === "urgent-resale"
                            ? "bg-emerald-600 text-white shadow-md font-extrabold"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                          <Flame className="w-[18px] h-[18px] text-rose-500" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold leading-tight flex items-center gap-1.5">
                            <span>Chợ Kèo & Pass Sân</span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-rose-500 text-white">HOT</span>
                          </div>
                          <div className={`text-[10px] ${activeTab === "community" || activeTab === "urgent-resale" ? "text-white/80" : "text-slate-400"}`}>
                            Tìm đối cáp kèo, pass sân gấp & tuyển quân
                          </div>
                        </div>
                      </button>

                      {/* ITEM 3: GIẢI ĐẤU & BXH */}
                      <button
                        type="button"
                        onClick={() => handleSelectSubTab("tournaments")}
                        className={`w-full text-left p-3.5 rounded-2xl flex items-center space-x-3 transition-all ${
                          activeTab === "tournaments" || activeTab === "organizer"
                            ? "bg-emerald-600 text-white shadow-md font-extrabold"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                          <Trophy className="w-[18px] h-[18px] text-amber-500" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold leading-tight">Giải Đấu & BXH</div>
                          <div className={`text-[10px] ${activeTab === "tournaments" || activeTab === "organizer" ? "text-white/80" : "text-slate-400"}`}>
                            Đăng ký giải, nhánh đấu & xếp hạng Elo
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
                            ? "bg-emerald-600 text-white shadow-md font-extrabold"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                          <Award className="w-[18px] h-[18px] text-sky-600" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold leading-tight">Thẻ Hội Viên & Ưu Đãi</div>
                          <div className={`text-[10px] ${activeTab === "membership" ? "text-white/80" : "text-slate-400"}`}>
                            Gói Pass tháng, tích điểm MP & quà tặng
                          </div>
                        </div>
                      </button>
                      )}

                      {/* KHỐI CÁ NHÂN VĐV NẾU ĐÃ LOGIN (LỊCH TRÌNH & HỒ SƠ) */}
                      {user && (
                        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 block">
                            Hồ Sơ & Hoạt Động
                          </span>

                          <button
                            type="button"
                            onClick={() => handleSelectSubTab("my-activities")}
                            className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
                              activeTab === "my-activities" ? "bg-[#0b4f6c]/10 dark:bg-sky-500/20 font-black text-[#0b4f6c] dark:text-sky-300" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-xs font-bold">Lịch Trình & Vé Đã Đặt</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectSubTab("profile")}
                            className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
                              activeTab === "profile" ? "bg-[#0b4f6c]/10 dark:bg-sky-500/20 font-black text-[#0b4f6c] dark:text-sky-300" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            <User className="w-4 h-4 text-sky-500 shrink-0" />
                            <span className="text-xs font-bold">Hồ Sơ VĐV & Thống Kê Elo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectSubTab("team-management")}
                            className={`w-full text-left p-2.5 rounded-xl flex items-center space-x-3 transition-colors ${
                              activeTab === "team-management" ? "bg-[#0b4f6c]/10 dark:bg-sky-500/20 font-black text-[#0b4f6c] dark:text-sky-300" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            <Users className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-xs font-bold">Đội Bóng Của Tôi</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer: Logout */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 space-y-3">
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileDrawer(false);
                      onLogout();
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95"
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
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-6px_24px_rgba(15,23,42,0.08)]"
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
                      ? "text-[#0b4f6c] dark:text-sky-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className={`absolute top-0 h-[3px] w-10 rounded-full transition-all ${
                      isActive ? "bg-[#0b4f6c] dark:bg-sky-400 opacity-100" : "opacity-0"
                    }`}
                  />
                  <Icon className="w-[21px] h-[21px]" />
                  <span className="text-[10px] font-bold leading-none tracking-tight">
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
