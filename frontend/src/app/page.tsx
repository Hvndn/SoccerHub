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
import { MapPin, Trophy, Users, ShieldCheck } from "lucide-react";
import VietQRModal from "@/components/VietQRModal";
import AuthModal from "@/components/AuthModal";
import RealtimeClockBar from "@/components/RealtimeClockBar";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const [activeTab, setActiveTab] = useState("booking");
  const { user: authUser, logout: authLogout } = useAuth();
  const [localUser, setLocalUser] = useState<any | null>(null);

  const currentUser = authUser || localUser;

  // Transition & Loading States
  const [isTabChanging, setIsTabChanging] = useState(false);

  // Modals state
  const [bookingModalData, setBookingModalData] = useState<{ pitch: any; slot: any } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authRole, setAuthRole] = useState<"PLAYER" | "OWNER" | "ORGANIZER">("PLAYER");

  // Hỗ trợ chế độ 2 Role song song theo Cổng (Cổng 3000: Chủ Sân • Cổng 3001: Cầu Thủ) hoặc qua URL
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const port = window.location.port;
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      const urlRole = params.get("role");

      // CỔNG 3000: MẶC ĐỊNH LÀ CHỦ SÂN (HỒ VĂN DIỆN - QUẢN LÝ CỤM SÂN & DOANH THU)
      if (port === "3000" || urlRole === "OWNER") {
        setLocalUser({
          id: 999,
          name: "Hồ Văn Diện",
          fullName: "Hồ Văn Diện",
          role: "OWNER",
          email: "owner@dsport.danang.vn",
          phone: "0988 776 652"
        });
        setActiveTab(urlTab || "admin");
      } 
      // CỔNG 3001: MẶC ĐỊNH LÀ CẦU THỦ (CAO VIỆT AN - TÌM SÂN & ĐẶT CỌC VIETQR)
      else if (port === "3001" || urlRole === "PLAYER") {
        setLocalUser({
          id: 1,
          name: "Cao Việt An",
          fullName: "Cao Việt An",
          role: "PLAYER",
          email: "caovietan@gmail.com",
          phone: "0914 555 789",
          eloRating: 1450
        });
        setActiveTab(urlTab || "booking");
      } else if (urlTab) {
        setActiveTab(urlTab);
      }
    }
  }, []);

  const handleTabChange = (newTab: string) => {
    if (newTab === activeTab) return;
    setIsTabChanging(true);
    setActiveTab(newTab);
    setTimeout(() => {
      setIsTabChanging(false);
    }, 400);
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
    if (userData?.role === "OWNER") {
      if (userData?.isNewOwner) {
        handleTabChange("owner-onboarding");
      } else {
        handleTabChange("admin");
      }
    } else {
      handleTabChange("booking");
    }
  };

  const handleLogout = () => {
    authLogout();
    setLocalUser(null);
    handleTabChange("booking");
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

      {/* Real-time Clock Bar */}
      <RealtimeClockBar />

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-[50px] pt-4 pb-24 lg:pb-14 space-y-8 sm:space-y-16">
        <div key={activeTab} className="animate-fade-in-up">
          {activeTab === "booking" && (
            currentUser ? (
              <PlayerDashboard
                user={currentUser}
                onNavigateTab={handleTabChange}
                onSelectSlot={handleSelectSlot}
              />
            ) : (
              <div className="space-y-16 sm:space-y-24">
                <LandingHero onOpenAuth={handleOpenAuth} />
                <LandingFeatures
                  onExplore={() => handleOpenAuth("login")}
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
            <MultiSportArena />
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
            <TournamentLeaderboard onBackToHome={() => handleTabChange("booking")} />
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
              <CommunityElo />
            </>
          )}

          {activeTab === "team-management" && (
            <TeamClubManagement
              onBackToHome={() => handleTabChange("booking")}
              onNavigateTab={handleTabChange}
            />
          )}

          {activeTab === "post-match" && (
            <PostMatchUtilities
              onBackToHome={() => handleTabChange("booking")}
              onNavigateTab={handleTabChange}
            />
          )}

          {activeTab === "admin" && (
            <AdminDashboard 
              onBackToHome={() => handleTabChange("booking")} 
              onNavigateTab={handleTabChange}
            />
          )}

          {(activeTab === "my-activities" || activeTab === "schedule") && (
            <ActivitySchedule 
              onBackToHome={() => handleTabChange("booking")} 
              onNavigateTab={handleTabChange}
            />
          )}

          {activeTab === "profile" && (
            <PlayerProfileConsole 
              user={currentUser}
              onOpenAuth={handleOpenAuth}
              onBackToHome={() => handleTabChange("booking")} 
              onNavigateTab={handleTabChange}
            />
          )}

          {activeTab === "organizer" && (
            <TournamentOrganizerPortal 
              onBackToHome={() => handleTabChange("booking")} 
              onNavigateTab={handleTabChange}
            />
          )}

          {activeTab === "membership" && (
            <MemberCardPortal 
              user={currentUser}
              onBackToHome={() => handleTabChange("booking")} 
              onNavigateTab={handleTabChange}
            />
          )}
        </div>
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
          <p className="text-[#0b4f6c] dark:text-sky-400 font-semibold">Công nghệ: Spring Boot, MySQL 8.0, Redis, Python FastAPI (Scikit-learn / Football Elo Rating), Next.js 14, VietQR & WebSockets.</p>
        </div>
      </footer>
    </div>
  );
}
