"use client";

import React, { useState, useEffect } from "react";
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
import GuestFeatureBanner from "@/components/GuestFeatureBanner";
import { MapPin, Trophy, Users, ShieldCheck } from "lucide-react";
import VietQRModal from "@/components/VietQRModal";
import AuthModal from "@/components/AuthModal";
import RealtimeClockBar from "@/components/RealtimeClockBar";

export default function Home() {
  const [activeTab, setActiveTab] = useState("booking");
  const [user, setUser] = useState<any | null>(null);

  // Transition & Loading States
  const [isTabChanging, setIsTabChanging] = useState(false);

  // Modals state
  const [bookingModalData, setBookingModalData] = useState<{ pitch: any; slot: any } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleTabChange = (newTab: string) => {
    if (newTab === activeTab) return;
    setIsTabChanging(true);
    setActiveTab(newTab);
    setTimeout(() => {
      setIsTabChanging(false);
    }, 550);
  };

  const handleSelectSlot = (pitch: any, slot: any) => {
    if (!user) {
      setAuthMode("login");
      setIsAuthOpen(true);
      return;
    }
    setBookingModalData({ pitch, slot });
  };

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    handleTabChange("booking");
  };

  const handleLogout = () => {
    setUser(null);
    handleTabChange("booking");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-pitch-emerald selection:text-white relative transition-colors duration-300">
      {/* Top Page Progress Loading Bar */}
      {isTabChanging && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-pitch-emerald z-50 animate-top-loader stadium-shadow" />
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Real-time Clock Bar starting with "Hiện tại: ..." */}
      <RealtimeClockBar />

      {/* Main Content Body with Keyframe Transition Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-10 lg:px-16 pt-3 sm:pt-4 pb-10 sm:pb-14 space-y-12 sm:space-y-16">
        <div key={activeTab} className="animate-fade-in-up">
          {activeTab === "booking" && (
            user ? (
              <PlayerDashboard
                user={user}
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

          {activeTab === "tournaments" && (
            <TournamentLeaderboard onBackToHome={() => handleTabChange("booking")} />
          )}

          {activeTab === "community" && (
            <>
              {!user && (
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

          {(activeTab === "admin" || activeTab === "my-activities") && (
            <ActivitySchedule 
              onBackToHome={() => handleTabChange("booking")} 
              onNavigateTab={handleTabChange}
            />
          )}

          {activeTab === "membership" && (
            <MemberCardPortal 
              user={user}
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
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-200 dark:border-slate-800 py-6 mt-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-10 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p>© 2026 <strong>VaoSan Multi-Sports Platform</strong>. Đồ Án Tốt Nghiệp: Xây dựng hệ thống quản lý sân Bóng Đá, Cầu Lông, Pickleball, Tennis và giải đấu đa thể thao AI.</p>
          <p className="text-pitch-emerald font-semibold">Công nghệ: Spring Boot, PostGIS, Redis, Python FastAPI (Scikit-learn / Multi-Sport Elo), Next.js 14, VietQR & WebSockets.</p>
        </div>
      </footer>
    </div>
  );
}
