"use client";

import React, { useState } from "react";
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

export default function Home() {
  const [activeTab, setActiveTab] = useState("landing");
  const [user, setUser] = useState<any | null>(null);

  // Modals state
  const [bookingModalData, setBookingModalData] = useState<{ pitch: any; slot: any } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

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
    setActiveTab("booking");
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab("landing");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-pitch-emerald selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Content Body with Smooth Page Transition Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-10 lg:px-16 py-10 sm:py-14 space-y-12 sm:space-y-16">
        <div key={activeTab} className="animate-page-transition">
          {activeTab === "landing" && (
            <div className="space-y-16 sm:space-y-24">
              <LandingHero
                onOpenAuth={handleOpenAuth}
              />
              <LandingFeatures
                onExplore={() => {
                  if (!user) handleOpenAuth("login");
                  else setActiveTab("booking");
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

          {activeTab === "referee" && (
            <RefereePanel />
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
