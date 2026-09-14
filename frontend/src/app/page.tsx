"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import LandingHero from "@/components/LandingHero";
import LandingFeatures from "@/components/LandingFeatures";
import PitchSearch from "@/components/PitchSearch";
import TournamentBracket from "@/components/TournamentBracket";
import RefereePanel from "@/components/RefereePanel";
import CommunityElo from "@/components/CommunityElo";
import AdminDashboard from "@/components/AdminDashboard";
import VietQRModal from "@/components/VietQRModal";
import AuthModal from "@/components/AuthModal";
import RealtimeClockBar from "@/components/RealtimeClockBar";

export default function Home() {
  const [activeTab, setActiveTab] = useState("landing");
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
    handleTabChange("landing");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-pitch-emerald selection:text-white relative">
      {/* Top Page Progress Loading Bar */}
      {isTabChanging && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-pitch-emerald to-pitch-lime z-50 animate-top-loader stadium-shadow" />
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
          {activeTab === "landing" && (
            <div className="space-y-16 sm:space-y-24">
              <LandingHero
                onOpenAuth={handleOpenAuth}
              />
              <LandingFeatures
                onExplore={() => {
                  if (!user) handleOpenAuth("login");
                  else handleTabChange("booking");
                }}
              />
            </div>
          )}

          {activeTab === "booking" && (
            <PitchSearch onSelectSlot={handleSelectSlot} />
          )}

          {activeTab === "tournaments" && (
            <TournamentBracket />
          )}

          {activeTab === "community" && (
            <CommunityElo />
          )}

          {activeTab === "admin" && (
            <AdminDashboard />
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
      <footer className="glass-panel border-t border-slate-800 py-6 mt-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-10 text-center text-xs text-slate-500 space-y-1">
          <p>© 2026 <strong>Kick-ON Platform</strong>. Đồ Án Tốt Nghiệp: Xây dựng hệ thống quản lý sân bóng và giải đấu thể thao tích hợp tính năng thông minh.</p>
          <p className="text-pitch-emerald font-semibold">Công nghệ: Spring Boot, PostGIS, Redis, Python FastAPI (Scikit-learn / Elo), Next.js 14, VietQR & WebSockets.</p>
        </div>
      </footer>
    </div>
  );
}
