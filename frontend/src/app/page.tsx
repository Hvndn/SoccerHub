"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import LandingHero from "@/components/LandingHero";
import LandingFeatures from "@/components/LandingFeatures";
import PitchSearch from "@/components/PitchSearch";
import TournamentBracket from "@/components/TournamentBracket";
import TournamentLeaderboard from "@/components/TournamentLeaderboard";
import RefereePanel from "@/components/RefereePanel";
import CommunityForm from "@/components/CommunityForm";
import CommunityHub from "@/components/CommunityHub";
import MatchmakingMarketplace from "@/components/MatchmakingMarketplace";
import { isPlayerSetupPending } from "@/components/PlayerSetup";
import AdminDashboard from "@/components/AdminDashboard";
import ActivitySchedule from "@/components/ActivitySchedule";
import MemberCardPortal from "@/components/MemberCardPortal";
import TournamentOrganizerPortal from "@/components/TournamentOrganizerPortal";
import PlayerProfileConsole from "@/components/PlayerProfileConsole";
import TeamClubManagement from "@/components/TeamClubManagement";
import StadiumOwnerOnboarding from "@/components/StadiumOwnerOnboarding";
import MultiSportArena from "@/components/MultiSportArena";
import GuestFeatureBanner from "@/components/GuestFeatureBanner";
import PageSpinner from "@/components/PageSpinner";
import BackendStatusBanner, { BackendRestoredToast } from "@/components/BackendStatusBanner";
import { MapPin, Trophy, Users, ShieldCheck, ShieldAlert, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
 const [activeTab, setActiveTab] = useState("booking");
 const { user: authUser, logout: authLogout } = useAuth();
 const [localUser, setLocalUser] = useState<any | null>(null);

 // Transition & Loading States
 const [isTabChanging, setIsTabChanging] = useState(false);

  /** Mọi lần chuyển trạng thái/trang đều hiện vòng xoay tối thiểu 1 giây. */
  const MIN_TAB_LOADING_MS = 1000;

 // Modals state
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

 // Kênh liên lạc B2B: chủ sân và ban tổ chức bấm "Nhắn tin" sẽ đưa cả hai sang
 // tab Cộng đồng và mở thẳng cuộc trò chuyện riêng với đối tác.
 const [pendingDmPartner, setPendingDmPartner] = useState<{
 partnerEmail: string;
 partnerName: string;
 } | null>(null);

 const handleStartDm = (partnerEmail: string, partnerName: string) => {
 setPendingDmPartner({ partnerEmail, partnerName });
 setActiveTab("community");
 if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
 };

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
// Tab dành riêng cho OWNER (Chủ sân) — quy trình khởi tạo cụm sân
  const OWNER_ONLY_TABS = ["owner-onboarding"];
  // Khu vực QUẢN LÝ riêng của OWNER — các vai trò khác bị chặn.
  const OWNER_MANAGE_TABS = ["admin", "owner-onboarding", "multi-sport"];
  // Tab mà OWNER được phép truy cập: quản lý cụm sân + cộng đồng để
  // trao đổi với khách (hỏi ca trống, xác nhận đặt sân, nhóm chat riêng).
  const OWNER_TABS = [...OWNER_MANAGE_TABS, "community", "matchmaking"];
 // Tab chỉ dành cho ORGANIZER hoặc người có quyền điều hành giải
 const ORGANIZER_TABS = ["organizer"];
 // Tab yêu cầu đăng nhập (bất kỳ vai trò nào cũng phải có tài khoản)
 const AUTH_REQUIRED_TABS = ["my-activities", "profile", "team-management", "membership"];

 // Role Guard: Tự động điều hướng và bảo vệ phân quyền nhất quán khi role thay đổi
 React.useEffect(() => {
if (!currentUser) {
  // Khách chưa đăng nhập: chỉ chặn tab thật sự cần đăng nhập.
  // PHẢI dùng OWNER_MANAGE_TABS (khớp với handleTabChange), KHÔNG dùng
  // OWNER_TABS — vì OWNER_TABS còn chứa "community" và "matchmaking" là những
  // tab khách vẫn được xem. Trước đây dùng nhầm OWNER_TABS khiến effect này
  // reset ngay lập tức về "booking", bấm Chợ Kèo / Cộng Đồng trên bottom nav
  // không ăn được.
  if ([...OWNER_MANAGE_TABS, ...ORGANIZER_TABS, ...AUTH_REQUIRED_TABS].includes(activeTab)) {
  setActiveTab("booking");
  }
  return;
  }

  // PLAYER mới đăng ký: bắt hoàn tất trang "Khởi tạo hồ sơ cầu thủ" trước khi dùng app
  if (currentUser.role === "PLAYER" && isPlayerSetupPending(currentUser.email || "")) {
  window.location.assign("/player-setup");
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
  // handleTabChange chan ca tab quan ly san cua Chu san VA tab dieu hanh giai cua BTC,
  // nen auto-guard cung phai chan ca hai. Truoc day chi chan OWNER_MANAGE_TABS,
  // nen mo ?tab=organizer lot vao giao dien BTC roi moi API deu 403.
  if ([...OWNER_MANAGE_TABS, ...ORGANIZER_TABS].includes(activeTab)) {
 setActiveTab("booking");
 }
 } else if (currentUser.role === "ORGANIZER") {
 // BAN TỔ CHỨC: Cấm vào bảng quản lý sân của Chủ sân
  if (OWNER_MANAGE_TABS.includes(activeTab)) {
 setActiveTab("tournaments");
 }
} else if (currentUser.role === "ADMIN") {
  // SUPER ADMIN: được phép xem trang chủ như mọi tài khoản khác (nút quản trị nằm
  // trên Navbar). Trước đây bị đẩy cứng về /admin -> vòng lặp, không về tới trang chủ được.
 }
 }, [currentUser, activeTab]);

const handleTabChange = (newTab: string) => {
  // SUPER ADMIN: được duyệt các khu vực của trang chủ như mọi tài khoản khác.
  // (Trước đây bị chặn cứng + đẩy về /admin khiến admin không về tới trang chủ được.)

  // ================================================================
  // GUARD 1: PLAYER mới đăng ký — bắt hoàn tất trang khởi tạo hồ sơ cầu thủ
  // ================================================================
  if (
  currentUser?.role === "PLAYER" &&
  isPlayerSetupPending(currentUser.email || "")
  ) {
  window.location.assign("/player-setup");
  return;
  }

 // ================================================================
 // GUARD 1: OWNER (Chủ Sân) - Không được vào khu vực Cầu Thủ
 // ================================================================
 if (currentUser?.role === "OWNER") {
 if (!OWNER_TABS.includes(newTab)) {
  showRoleWarning("⚠️ Tài khoản Chủ Sân không thể truy cập khu vực Cầu Thủ. Vui lòng dùng Bảng Điều Hành hoặc Cộng đồng & Nhắn tin.");
 setActiveTab(currentUser.isNewOwner ? "owner-onboarding" : "admin");
 return;
 }
 }

 // ================================================================
 // GUARD 2: PLAYER (Cầu Thủ) - Không được vào khu quản lý sân OWNER
 // ================================================================
 if (currentUser?.role === "PLAYER") {
  if (OWNER_MANAGE_TABS.includes(newTab)) {
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
  if (OWNER_MANAGE_TABS.includes(newTab)) {
 showRoleWarning("🚫 Tài khoản Ban Tổ Chức không có quyền vào Bảng Quản Lý Cụm Sân. Chức năng này chỉ dành cho Chủ Sân (OWNER).");
 setActiveTab("tournaments");
 return;
 }
 }

 // ================================================================
 // GUARD 4: KHÁCH CHƯA ĐĂNG NHẬP
 // ================================================================
 if (!currentUser) {
  // 4a. Khu quản lý riêng của Chủ Sân => Yêu cầu đăng nhập OWNER
  if (OWNER_MANAGE_TABS.includes(newTab)) {
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
 // Bật vòng xoay loading, giữ tối thiểu 1s để không thấy màn hình nhảy loè
 setIsTabChanging(true);
 const startedAt = Date.now();
 setTimeout(() => {
 setActiveTab(newTab);
 window.scrollTo({ top: 0, behavior: "smooth" });
 const elapsed = Date.now() - startedAt;
 const remaining = Math.max(0, MIN_TAB_LOADING_MS - elapsed);
 setTimeout(() => {
 setIsTabChanging(false);
 }, remaining);
 }, 120);
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

 const ownerTabs = ["admin", "owner-onboarding", "multi-sport"];
 const organizerTabs = ["organizer"];
 const authRequiredTabs = ["my-activities", "profile", "team-management", "membership"];

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

 // Thanh điều hướng dưới mobile hiển thị cho khách / Cầu thủ / Ban tổ chức
 const showBottomNav = currentUser?.role !== "OWNER" && currentUser?.role !== "ADMIN";

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#0369a1] selection:text-white relative transition-colors duration-300">
{/* Báo toàn cục khi mất kết nối máy chủ + thông báo đã kết nối lại */}
<BackendStatusBanner />
<BackendRestoredToast />
{/* Vòng xoay loading toàn trang khi chuyển tab/trạng thái (tối thiểu 1s) */}
  {isTabChanging && (
  <>
  <div className="fixed top-0 left-0 right-0 h-1 bg-[#0369a1] z-50 animate-top-loader stadium-shadow" />
  <div className="fixed inset-0 z-[45] flex items-center justify-center bg-slate-50/70 backdrop-blur-[2px] animate-fade-in">
  <PageSpinner size="lg" sub="Đang chuyển trang…" />
  </div>
  </>
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
 className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 )}

 {/* Main Content Body */}
 <main className={`flex-1 max-w-[1720px] w-full mx-auto px-3 sm:px-6 xl:px-8 2xl:px-[50px] pb-12 lg:pb-14 space-y-5 sm:space-y-16 ${!currentUser && activeTab === "booking" ? "pt-0" : "pt-3 sm:pt-4"} ${showBottomNav ? "pb-28 lg:pb-14" : ""}`}>
 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ y: 12 }}
 animate={{ y: 0 }}
 exit={{ y: -8 }}
 transition={{ duration: 0.38, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
 >
 {activeTab === "booking" && (
 currentUser?.role === "OWNER" ? (
 <div className="py-10 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
 <div className="w-16 h-16 rounded-2xl bg-[#0369a1]/10 text-[#0b4f6c] mx-auto flex items-center justify-center">
 <ShieldCheck className="w-8 h-8 text-emerald-500" />
 </div>
 <div className="space-y-2">
 <h2 className="text-xl sm:text-2xl font-black text-slate-900 ">
 Không Gian Dành Cho Cầu Thủ Đặt Sân
 </h2>
 <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
 Bạn đang đăng nhập bằng tài khoản <strong>Chủ Sân ({currentUser.fullName || currentUser.name})</strong>. Chức năng tìm kiếm và cọc sân này dành riêng cho Cầu Thủ. Vui lòng chuyển sang Bảng Điều Hành để quản lý cụm sân và theo dõi doanh thu.
 </p>
 </div>
 <button
 type="button"
 onClick={() => handleTabChange("admin")}
 className="px-6 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
 >
 Chuyển Sang Bảng Điều Hành Cụm Sân →
 </button>
 </div>
 ) : currentUser ? (
 <PitchSearch
 user={currentUser}
 />
 ) : (
 <div className="space-y-8 sm:space-y-24">
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

 {activeTab === "tournaments" && (
 <CommunityForm 
 user={currentUser} 
 defaultSubTab="tournaments"
 onOpenAuth={handleOpenAuth}
 />
 )}

 {activeTab === "matchmaking" && (
  <MatchmakingMarketplace user={currentUser} />
  )}

{activeTab === "community" && (
 <>
 {!currentUser && (
 <GuestFeatureBanner
 title="Cộng Đồng Cầu Thủ & Phong Độ Thi Đấu"
 description="Tham gia cộng đồng Turfzone. Ghép trận (Matchmaking) tìm đối thủ tương đương phong độ và theo dõi lịch sử thi đấu của bản thân."
 features={[
 "Lịch sử thi đấu & chuỗi phong độ 5 trận",
 "Ghép trận tìm đối thủ theo trình độ",
 "Bảng xếp hạng phong độ & CLB",
 ]}
 icon={Users}
 onOpenAuth={handleOpenAuth}
 />
 )}
  <CommunityHub user={currentUser} onOpenAuth={handleOpenAuth} onNavigateTab={handleTabChange} initialDmPartner={pendingDmPartner} />
 </>
 )}

 {activeTab === "team-management" && (
 currentUser ? (
 <TeamClubManagement
 user={currentUser}
 onBackToHome={() => handleTabChange("booking")}
 onNavigateTab={handleTabChange}
 />
 ) : (
 <div className="py-10 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
 <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center">
 <ShieldAlert className="w-8 h-8 text-amber-700" />
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
 className="px-6 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
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
 onStartDm={handleStartDm}
 />
 ) : (
 <div className="py-10 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
 <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 mx-auto flex items-center justify-center">
 <ShieldAlert className="w-8 h-8 text-rose-600" />
 </div>
 <div className="space-y-2">
 <h2 className="text-xl sm:text-2xl font-black text-slate-900 ">
 Truy Cập Bị Từ Chối (403 Forbidden)
 </h2>
 <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
 Trang Bảng Điều Hành và Quản Lý Doanh Thu chỉ dành riêng cho tài khoản <strong>Chủ Sân (OWNER)</strong>. Tài khoản Cầu Thủ hoặc khách chưa đăng nhập không có quyền truy cập khu vực này.
 </p>
 </div>
 <div className="flex items-center justify-center space-x-3 pt-2">
 <button
 type="button"
 onClick={() => handleTabChange("booking")}
 className="px-6 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
 >
 Quay Lại Trang Tìm Sân Bóng
 </button>
 {!currentUser && (
 <button
 type="button"
 onClick={() => handleOpenAuth("login", "OWNER")}
 className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer"
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
 <div className="py-10 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
 <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center">
 <ShieldAlert className="w-8 h-8 text-amber-700" />
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
 className="px-6 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
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
 <div className="py-10 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
 <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center">
 <ShieldAlert className="w-8 h-8 text-amber-700" />
 </div>
 <div className="space-y-2">
 <h2 className="text-xl sm:text-2xl font-black text-slate-900">🔒 Yêu Cầu Đăng Nhập</h2>
 <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
 Đăng nhập để xem và quản lý hồ sơ cầu thủ, phong độ và thành tích thi đấu.
 </p>
 </div>
 <button
 type="button"
 onClick={() => handleOpenAuth("login", "PLAYER")}
 className="px-6 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
 >
 Đăng Nhập Ngay
 </button>
 </div>
 )
 )}

 {activeTab === "organizer" && (
 (currentUser?.role === "ORGANIZER" || currentUser?.role === "OWNER") ? (
 <CommunityForm 
 user={currentUser} 
 defaultSubTab="organizer"
 onOpenAuth={handleOpenAuth}
 onStartDm={handleStartDm}
 />
 ) : currentUser ? (
 <div className="py-10 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
 <div className="w-16 h-16 rounded-2xl bg-rose-500/10 mx-auto flex items-center justify-center">
 <ShieldAlert className="w-8 h-8 text-rose-600" />
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
 className="px-6 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
 >
 Xem Trang Giải Đấu Cộng Đồng
 </button>
 </div>
 ) : (
 <div className="py-10 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
 <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center">
 <ShieldAlert className="w-8 h-8 text-amber-700" />
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
 className="px-6 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
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
 <div className="py-10 sm:py-24 max-w-xl mx-auto text-center space-y-5 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl animate-fade-in">
 <div className="w-16 h-16 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center">
 <ShieldAlert className="w-8 h-8 text-amber-700" />
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
 className="px-6 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
 >
 Đăng Nhập Ngay
 </button>
 </div>
 )
 )}
 </motion.div>
 </AnimatePresence>
 </main>

 {/* Auth Modal (Login / Register) */}
 <AuthModal
 isOpen={isAuthOpen}
 initialMode={authMode}
 initialRole={authRole}
 onClose={() => setIsAuthOpen(false)}
 onLoginSuccess={handleLoginSuccess}
 />

 {/* Footer */}
 <footer className={`glass-panel border-t border-slate-200 pt-6 transition-colors duration-300 ${showBottomNav ? "pb-28 lg:pb-6" : "pb-6"}`}>
 <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-10 text-center text-xs text-slate-500 space-y-1.5">
 <p>
 © 2026 <strong>Turfzone</strong>
 <span className="hidden sm:inline"> — Nền Tảng Đặt Sân &amp; Quản Lý Bóng Đá Thông Minh. Đồ Án Tốt Nghiệp: Hệ thống quản lý cụm sân bóng đá mini cỏ nhân tạo (Sân 5, Sân 7, Sân 11), giải đấu phủi và kết nối đối thủ AI.</span>
 </p>
 <p className="hidden sm:block text-[#0b4f6c] font-semibold">Công nghệ: Spring Boot, MySQL, Next.js 14, Python FastAPI (lịch sử & phong độ thi đấu), QR VietQR sinh từ STK báo cáo giải.</p>
 </div>
 </footer>
 </div>
 );
}
