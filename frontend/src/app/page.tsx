"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import LandingHero from "@/components/LandingHero";
import LandingFeatures from "@/components/LandingFeatures";
import PitchSearch from "@/components/PitchSearch";
import TournamentBracket from "@/components/TournamentBracket";
import TournamentLeaderboard from "@/components/TournamentLeaderboard";
import RefereePanel from "@/components/RefereePanel";
import CommunityElo from "@/components/CommunityElo";
import PlayerDashboard from "@/components/PlayerDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import ActivitySchedule from "@/components/ActivitySchedule";
import MemberCardPortal from "@/components/MemberCardPortal";
import TournamentOrganizerPortal from "@/components/TournamentOrganizerPortal";
import PlayerProfileConsole from "@/components/PlayerProfileConsole";
import TeamClubManagement from "@/components/TeamClubManagement";
import PostMatchUtilities from "@/components/PostMatchUtilities";
import UrgentSlotMarketplace from "@/components/UrgentSlotMarketplace";
import StadiumOwnerOnboarding from "@/components/StadiumOwnerOnboarding";
import MultiSportArena from "@/components/MultiSportArena";
import StadiumIoTConsole from "@/components/StadiumIoTConsole";
import GuestFeatureBanner from "@/components/GuestFeatureBanner";
import { MapPin, Trophy, Users, ShieldCheck, ShieldAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import VietQRModal from "@/components/VietQRModal";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const [activeTab, setActiveTab] = useState("booking");
  const { user: authUser, logout: authLogout } = useAuth();
  const [localUser, setLocalUser] = useState<any | null>(null);

  // Transition & Loading States
  const [isTabChanging, setIsTabChanging] = useState(false);

  // Modals state
  const [bookingModalData, setBookingModalData] = useState<{ pitch: any; slot: any } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authRole, setAuthRole] = useState<"PLAYER" | "OWNER" | "ORGANIZER">("PLAYER");

  // Hỗ trợ nhận tab qua URL query param nếu có
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      if (urlTab) {
        setActiveTab(urlTab);
      }
    }
  }, []);

  // Người dùng hiện tại: Ưu tiên user đăng nhập thật từ AuthContext, hoặc session đăng nhập tạm localUser
  // Khi đăng xuất: cả hai đều là null => Trở về trạng thái Guest tự nhiên, không bị khóa cứng
  const currentUser = authUser || localUser;

  // Thông báo phân quyền khi người dùng cố truy cập trang ngoài quyền hạn
  const [roleWarning, setRoleWarning] = useState<string | null>(null);
  // Lưu tab đang cố truy cập để sau khi đăng nhập xong thì tự chuyển về
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const showRoleWarning = (msg: string) => {
    setRoleWarning(msg);
    setTimeout(() => setRoleWarning(null), 5500);
  };

  // ============================================================
  // MA TRẬN PHÂN QUYỀN TAB (RBAC)
  // ============================================================
  // Tab chỉ dành cho OWNER (Chủ sân)
  const OWNER_TABS = ["admin", "owner-onboarding", "iot-console", "multi-sport"];
  // Tab chỉ dành cho ORGANIZER hoặc người có quyền điều hành giải
  const ORGANIZER_TABS = ["organizer"];
  // Tab yêu cầu đăng nhập (bất kỳ vai trò nào cũng phải có tài khoản)
  const AUTH_REQUIRED_TABS = ["my-activities", "profile", "post-match", "team-management", "membership"];
  // Tab bị cấm với OWNER (Chủ sân không được dùng chức năng dành cho Cầu thủ)
  const PLAYER_ONLY_TABS = ["booking", "urgent-resale", "community", "tournaments", "team-management", "post-match", "membership"];

  // Role Guard: Tự động điều hướng và bảo vệ phân quyền nhất quán khi role thay đổi
  React.useEffect(() => {
    if (!currentUser) {
      // Khách chưa đăng nhập: đẩy ra ngoài các tab yêu cầu auth
      if ([...OWNER_TABS, ...ORGANIZER_TABS, ...AUTH_REQUIRED_TABS].includes(activeTab)) {
        setActiveTab("booking");
      }
      return;
    }

    if (currentUser.role === "OWNER") {
      // CHỦ SÂN: Nếu là chủ sân mới (chưa tạo sân) thì giữ ở onboarding
      if (currentUser.isNewOwner && activeTab !== "owner-onboarding") {
        setActiveTab("owner-onboarding");
      } else if (!OWNER_TABS.includes(activeTab)) {
        setActiveTab("admin");
      }
    } else if (currentUser.role === "PLAYER") {
      // CẦU THỦ: Cấm vào trang quản lý sân & điều hành giải (của OWNER/ORGANIZER)
      if (OWNER_TABS.includes(activeTab)) {
        setActiveTab("booking");
      }
    } else if (currentUser.role === "ORGANIZER") {
      // BAN TỔ CHỨC: Cấm vào bảng quản lý sân của Chủ sân
      if (OWNER_TABS.includes(activeTab)) {
        setActiveTab("tournaments");
      }
    } else if (currentUser.role === "ADMIN") {
      // SUPER ADMIN: không thao tác ở trang home — về route quản trị riêng
      window.location.assign("/admin");
    }
  }, [currentUser?.role, currentUser?.isNewOwner]);

  const handleTabChange = (newTab: string) => {
    // ================================================================
    // GUARD 0: SUPER ADMIN - Không thao tác ở trang người dùng/chủ sân
    // ================================================================
    if (currentUser?.role === "ADMIN") {
      showRoleWarning("⚠️ Tài khoản Quản Trị không thao tác ở khu vực này. Đang chuyển về Trang Quản Trị Hệ Thống.");
      window.location.assign("/admin");
      return;
    }

    // ================================================================
    // GUARD 1: OWNER (Chủ Sân) - Không được vào khu vực Cầu Thủ
    // ================================================================
    if (currentUser?.role === "OWNER") {
      if (!OWNER_TABS.includes(newTab)) {
        showRoleWarning("⚠️ Tài khoản Chủ Sân không thể truy cập khu vực Cầu Thủ. Vui lòng dùng Bảng Điều Hành để quản lý cụm sân.");
        setActiveTab(currentUser.isNewOwner ? "owner-onboarding" : "admin");
        return;
      }
    }

    // ================================================================
    // GUARD 2: PLAYER (Cầu Thủ) - Không được vào khu quản lý sân OWNER
    // ================================================================
    if (currentUser?.role === "PLAYER") {
      if (OWNER_TABS.includes(newTab)) {
        showRoleWarning("🚫 Truy cập bị từ chối: Tài khoản Cầu Thủ không có quyền vào Bảng Quản Lý Cụm Sân & Doanh Thu.");
        setActiveTab("booking");
        return;
      }
      // Cầu Thủ cũng không được vào tab điều hành giải (chỉ dành ORGANIZER)
      if (ORGANIZER_TABS.includes(newTab)) {
        showRoleWarning("🚫 Tab Điều Hành Giải Đấu chỉ dành cho Ban Tổ Chức có xác thực. Liên hệ quản trị để nâng cấp quyền Tổ Chức.");
        setActiveTab("tournaments");
        return;
      }
    }

    // ================================================================
    // GUARD 3: ORGANIZER (Ban Tổ Chức) - Không được vào khu Chủ Sân
    // ================================================================
    if (currentUser?.role === "ORGANIZER") {
      if (OWNER_TABS.includes(newTab)) {
        showRoleWarning("🚫 Tài khoản Ban Tổ Chức không có quyền vào Bảng Quản Lý Cụm Sân. Chức năng này chỉ dành cho Chủ Sân (OWNER).");
        setActiveTab("tournaments");
        return;
      }
    }

    // ================================================================
    // GUARD 4: KHÁCH CHƯA ĐĂNG NHẬP
    // ================================================================
    if (!currentUser) {
      // 4a. Tab chỉ dành Chủ Sân => Yêu cầu đăng nhập OWNER
      if (OWNER_TABS.includes(newTab)) {
        setPendingTab(newTab);
        showRoleWarning("🔒 Vui lòng đăng nhập với vai trò Chủ Sân để truy cập Bảng Quản Lý!");
        handleOpenAuth("login", "OWNER");
        return;
      }
      // 4b. Tab điều hành giải => Yêu cầu đăng nhập ORGANIZER
      if (ORGANIZER_TABS.includes(newTab)) {
        setPendingTab(newTab);
        showRoleWarning("🔒 Chức năng Điều Hành Giải Đấu yêu cầu tài khoản Ban Tổ Chức (ORGANIZER). Vui lòng đăng nhập!");
        handleOpenAuth("login", "ORGANIZER");
        return;
      }
      // 4c. Tab yêu cầu đăng nhập chung => Yêu cầu đăng nhập PLAYER
      if (AUTH_REQUIRED_TABS.includes(newTab)) {
        setPendingTab(newTab);
        showRoleWarning("🔒 Vui lòng đăng nhập để sử dụng chức năng này!");
        handleOpenAuth("login", "PLAYER");
        return;
      }
    }

    if (newTab === activeTab) return;
    setIsTabChanging(true);
    setTimeout(() => {
      setActiveTab(newTab);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        setIsTabChanging(false);
      }, 450);
    }, 120);
  };

  const handleSelectSlot = (pitch: any, slot: any) => {
    if (!currentUser) {
      setAuthMode("login");
      setAuthRole("PLAYER");
      setIsAuthOpen(true);
      return;
    }
    setBookingModalData({ pitch, slot });
  };

  const handleOpenAuth = (
    mode: "login" | "register",
    role: "PLAYER" | "OWNER" | "ORGANIZER" = "PLAYER"
  ) => {
    setAuthMode(mode);
    setAuthRole(role);
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = (userData: any) => {
    setLocalUser(userData);

    // Nếu có pendingTab (tab người dùng đang cố vào trước khi bị redirect đăng nhập)
    // => Kiểm tra xem vai trò mới có đủ quyền truy cập pendingTab không
    if (pendingTab) {
      const savedPending = pendingTab;
      setPendingTab(null);

      const ownerTabs = ["admin", "owner-onboarding", "iot-console", "multi-sport"];
      const organizerTabs = ["organizer"];
      const authRequiredTabs = ["my-activities", "profile", "post-match", "team-management", "membership"];

      const canAccess =
        (ownerTabs.includes(savedPending) && userData?.role === "OWNER") ||
        (organizerTabs.includes(savedPending) && userData?.role === "ORGANIZER") ||
        (authRequiredTabs.includes(savedPending) && userData?.role === "PLAYER") ||
        // PLAYER cũng có thể vào các tab thông thường
        (!ownerTabs.includes(savedPending) && !organizerTabs.includes(savedPending) && userData?.role === "PLAYER");

      if (canAccess) {
        setActiveTab(savedPending);
        return;
      }
    }

    // Routing mặc định theo vai trò
    if (userData?.role === "ADMIN") {
      window.location.assign("/admin");
    } else if (userData?.role === "OWNER") {
      setActiveTab(userData?.isNewOwner ? "owner-onboarding" : "admin");
    } else if (userData?.role === "ORGANIZER") {
      setActiveTab("tournaments");
    } else {
      setActiveTab("booking");
    }
  };

  const handleLogout = () => {
    authLogout();
    setLocalUser(null);
    setActiveTab("booking");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white relative transition-colors duration-300">
      {/* Top Page Progress Loading Bar */}
      {isTabChanging && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-[#0b4f6c] dark:bg-sky-400 z-50 animate-top-loader stadium-shadow" />
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        user={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Toast Cảnh Báo Phân Quyền Vai Trò - Kích thước lớn dễ nhìn */}
      {roleWarning && (
        <div className="fixed top-20 inset-x-4 sm:inset-x-auto sm:right-6 z-50 flex items-center space-x-4 bg-slate-900/98 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-rose-500 animate-fade-in-up sm:max-w-lg backdrop-blur-md">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 animate-pulse" />
          <span className="text-sm font-bold leading-relaxed">{roleWarning}</span>
          <button 
            type="button" 
            onClick={() => setRoleWarning(null)} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content Body */}
      <main className={`flex-1 max-w-[1720px] w-full mx-auto px-3 sm:px-6 xl:px-8 2xl:px-[50px] pb-12 lg:pb-14 space-y-8 sm:space-y-16 ${!currentUser && activeTab === "booking" ? "pt-0" : "pt-4"}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.38, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="will-change-transform"
          >
          {activeTab === "booking" && (
            currentUser?.role === "OWNER" ? (
              <div className="py-16 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-[#0b4f6c]/10 dark:bg-sky-500/20 text-[#0b4f6c] dark:text-sky-400 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Không Gian Dành Cho Cầu Thủ Đặt Sân
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Bạn đang đăng nhập bằng tài khoản <strong>Chủ Sân ({currentUser.fullName || currentUser.name})</strong>. Chức năng tìm kiếm và cọc sân này dành riêng cho Cầu Thủ. Vui lòng chuyển sang Bảng Điều Hành để quản lý cụm sân và theo dõi doanh thu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("admin")}
                  className="px-6 py-3 rounded-2xl bg-[#0b4f6c] dark:bg-sky-500 hover:opacity-90 text-white dark:text-slate-950 font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  Chuyển Sang Bảng Điều Hành Cụm Sân →
                </button>
              </div>
            ) : currentUser ? (
              <PitchSearch
                user={currentUser}
                onSelectSlot={handleSelectSlot}
              />
            ) : (
              <div className="space-y-16 sm:space-y-24">
                <LandingHero 
                  onOpenAuth={handleOpenAuth} 
                  onNavigateTab={handleTabChange}
                />
                <LandingFeatures
                  onExplore={(role) => handleOpenAuth("login")}
                  onNavigateTab={handleTabChange}
                />
              </div>
            )
          )}

          {activeTab === "owner-onboarding" && (
            <StadiumOwnerOnboarding
              onComplete={() => {
                if (currentUser) {
                  setLocalUser((prev: any) => ({ ...prev, isNewOwner: false }));
                }
                handleTabChange("admin");
              }}
              onBackToHome={() => handleTabChange("booking")}
            />
          )}

          {activeTab === "multi-sport" && (
            <MultiSportArena
              user={currentUser}
              onNavigateToBooking={() => handleTabChange("booking")}
              onNavigateToChokego={() => handleTabChange("community")}
            />
          )}

          {activeTab === "iot-console" && (
            <StadiumIoTConsole />
          )}

          {activeTab === "urgent-resale" && (
            <UrgentSlotMarketplace
              onBackToHome={() => handleTabChange("booking")}
              onNavigateTab={handleTabChange}
              onSelectSlot={handleSelectSlot}
            />
          )}

          {activeTab === "tournaments" && (
            <CommunityElo 
              user={currentUser} 
              defaultSubTab="tournaments"
              onOpenAuth={handleOpenAuth}
            />
          )}

          {activeTab === "community" && (
            <>
              {!currentUser && (
                <GuestFeatureBanner
                  title="Cộng Đồng Cầu Thủ & Hệ Thống Rating Elo"
                  description="Tham gia cộng đồng thể thao VaoSan. Ghép trận ngẫu nhiên (Matchmaking) tìm đối thủ phù hợp trình độ và theo dõi chỉ số Elo thăng hạng của bản thân."
                  features={[
                    "Tính điểm Elo chuẩn thể thao",
                    "Ghép trận tìm đối thủ theo trình độ",
                    "Bảng xếp hạng cá nhân & CLB",
                  ]}
                  icon={Users}
                  onOpenAuth={handleOpenAuth}
                />
              )}
              <CommunityElo user={currentUser} onOpenAuth={handleOpenAuth} />
            </>
          )}

          {activeTab === "team-management" && (
            currentUser ? (
              <TeamClubManagement
                onBackToHome={() => handleTabChange("booking")}
                onNavigateTab={handleTabChange}
              />
            ) : (
              <div className="py-16 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">🔒 Yêu Cầu Đăng Nhập</h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Đăng nhập để quản lý đội bóng, thành viên và lịch thi đấu của CLB.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAuth("login", "PLAYER")}
                  className="px-6 py-3 rounded-2xl bg-[#0b4f6c] hover:opacity-90 text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  Đăng Nhập Ngay
                </button>
              </div>
            )
          )}

          {activeTab === "post-match" && (
            currentUser ? (
              <PostMatchUtilities
                onBackToHome={() => handleTabChange("booking")}
                onNavigateTab={handleTabChange}
              />
            ) : (
              <div className="py-16 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">🔒 Yêu Cầu Đăng Nhập</h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Đăng nhập để xem thống kê, phân tích sau trận và ghi chép kết quả.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAuth("login", "PLAYER")}
                  className="px-6 py-3 rounded-2xl bg-[#0b4f6c] hover:opacity-90 text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  Đăng Nhập Ngay
                </button>
              </div>
            )
          )}

          {activeTab === "admin" && (
            currentUser?.role === "OWNER" ? (
              <AdminDashboard 
                onBackToHome={() => handleTabChange("admin")} 
                onNavigateTab={handleTabChange}
              />
            ) : (
              <div className="py-16 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-rose-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Truy Cập Bị Từ Chối (403 Forbidden)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Trang Bảng Điều Hành và Quản Lý Doanh Thu chỉ dành riêng cho tài khoản <strong>Chủ Sân (OWNER)</strong>. Tài khoản Cầu Thủ hoặc khách chưa đăng nhập không có quyền truy cập khu vực này.
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange("booking")}
                    className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Quay Lại Trang Tìm Sân Bóng
                  </button>
                  {!currentUser && (
                    <button
                      type="button"
                      onClick={() => handleOpenAuth("login", "OWNER")}
                      className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      Đăng Nhập Chủ Sân
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {(activeTab === "my-activities" || activeTab === "schedule") && (
            currentUser ? (
              <ActivitySchedule
                user={currentUser}
                onBackToHome={() => handleTabChange("booking")}
                onNavigateTab={handleTabChange}
              />
            ) : (
              <div className="py-16 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">🔒 Yêu Cầu Đăng Nhập</h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Vui lòng đăng nhập để xem lịch thi đấu và hoạt động của bạn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAuth("login", "PLAYER")}
                  className="px-6 py-3 rounded-2xl bg-[#0b4f6c] hover:opacity-90 text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  Đăng Nhập Ngay
                </button>
              </div>
            )
          )}

          {activeTab === "profile" && (
            currentUser ? (
              <PlayerProfileConsole 
                user={currentUser}
                onOpenAuth={handleOpenAuth}
                onBackToHome={() => handleTabChange("booking")} 
                onNavigateTab={handleTabChange}
              />
            ) : (
              <div className="py-16 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">🔒 Yêu Cầu Đăng Nhập</h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Đăng nhập để xem và quản lý hồ sơ cầu thủ, chỉ số Elo và thành tích thi đấu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAuth("login", "PLAYER")}
                  className="px-6 py-3 rounded-2xl bg-[#0b4f6c] hover:opacity-90 text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  Đăng Nhập Ngay
                </button>
              </div>
            )
          )}

          {activeTab === "organizer" && (
            (currentUser?.role === "ORGANIZER" || currentUser?.role === "OWNER") ? (
              <CommunityElo 
                user={currentUser} 
                defaultSubTab="organizer"
                onOpenAuth={handleOpenAuth}
              />
            ) : currentUser ? (
              <div className="py-16 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-rose-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">🚫 Truy Cập Bị Từ Chối</h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Khu vực Điều Hành Giải Đấu chỉ dành cho tài khoản <strong>Ban Tổ Chức (ORGANIZER)</strong>. Liên hệ quản trị để được nâng cấp quyền điều hành.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("tournaments")}
                  className="px-6 py-3 rounded-2xl bg-[#0b4f6c] hover:opacity-90 text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  Xem Trang Giải Đấu Cộng Đồng
                </button>
              </div>
            ) : (
              <div className="py-16 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">🔒 Yêu Cầu Đăng Nhập với Tài Khoản Ban Tổ Chức</h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Chức năng Điều Hành Giải Đấu yêu cầu tài khoản <strong>ORGANIZER</strong> có xác thực.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAuth("login", "ORGANIZER")}
                  className="px-6 py-3 rounded-2xl bg-[#0b4f6c] hover:opacity-90 text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  Đăng Nhập Ban Tổ Chức
                </button>
              </div>
            )
          )}

          {activeTab === "membership" && (
            currentUser ? (
              <MemberCardPortal 
                user={currentUser}
                onBackToHome={() => handleTabChange("booking")} 
                onNavigateTab={handleTabChange}
              />
            ) : (
              <div className="py-16 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">🔒 Yêu Cầu Đăng Nhập</h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Đăng nhập để xem và quản lý Thẻ Hội Viên, ưu đãi và điểm tích lũy của bạn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAuth("login", "PLAYER")}
                  className="px-6 py-3 rounded-2xl bg-[#0b4f6c] hover:opacity-90 text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  Đăng Nhập Ngay
                </button>
              </div>
            )
          )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* VietQR Payment & Ticket Modal */}
      {bookingModalData && (
        <VietQRModal
          bookingData={bookingModalData}
          onClose={() => setBookingModalData(null)}
        />
      )}

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        initialRole={authRole}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-200 dark:border-slate-800 py-6 mt-12 transition-colors duration-300">
        <div className="w-full max-w-full mx-auto px-3 sm:px-6 lg:px-10 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p>© 2026 <strong>SoccerHub - Nền Tảng Đặt Sân & Quản Lý Bóng Đá Thông Minh</strong>. Đồ Án Tốt Nghiệp: Hệ thống quản lý cụm sân bóng đá mini cỏ nhân tạo (Sân 5, Sân 7, Sân 11), giải đấu phủi và kết nối đối thủ AI.</p>
          <p className="text-[#0b4f6c] dark:text-sky-400 font-semibold">Công nghệ: Spring Boot, MySQL 8.0, Next.js 14, Python FastAPI (tính điểm Elo), VietQR & WebSockets.</p>
        </div>
      </footer>
    </div>
  );
}
