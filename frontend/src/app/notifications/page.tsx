"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, LogIn } from "lucide-react";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import NotificationsCenter from "@/components/NotificationsCenter";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/lib/useNotifications";

/**
 * Trang riêng /notifications — xem TẤT CẢ thông báo trong luồng trang,
 * KHÔNG dùng popup/modal. Dùng chung hook useNotifications với chuông trên Navbar
 * nên số chưa đọc và trạng thái đã đọc luôn khớp nhau.
 */
export default function NotificationsPage() {
  const { user, isLoading, logout } = useAuth();
  const {
    notifications,
    loading,
    unreadCount,
    markAllRead,
    markSingleRead,
    removeNotification,
    clearAllNotifications,
  } = useNotifications(user);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authRole, setAuthRole] = useState<"PLAYER" | "OWNER" | "ORGANIZER">("PLAYER");

  const handleOpenAuth = (
    mode: "login" | "register",
    role: "PLAYER" | "OWNER" | "ORGANIZER" = "PLAYER"
  ) => {
    setAuthMode(mode);
    setAuthRole(role);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar
        activeTab="notifications"
        setActiveTab={(tab) => {
          window.location.assign(`/?tab=${tab}`);
        }}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={() => {
          logout();
          window.location.assign("/");
        }}
      />

      <main className="flex-1 max-w-[1000px] w-full mx-auto px-3 sm:px-6 xl:px-8 pt-3 sm:pt-4 pb-28 lg:pb-14 space-y-4 sm:space-y-5">
        {/* Tiêu đề trang */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0369a1]/10 text-[#0b4f6c] flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Trung Tâm Thông Báo
              </h1>
              <p className="text-[13px] text-slate-500">
                {loading && notifications.length === 0
                  ? "Đang tải thông báo…"
                  : `${notifications.length} thông báo`}
                {unreadCount > 0 && (
                  <span className="font-bold text-[#0b4f6c]"> • {unreadCount} chưa đọc</span>
                )}
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-700 transition-all active:scale-95 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Về trang chủ
          </Link>
        </div>

        {isLoading || (loading && notifications.length === 0) ? (
          <div role="status" className="space-y-3" aria-label="Đang tải thông báo">
            <div className="skeleton-shimmer h-12 w-full rounded-2xl" />
            <div className="skeleton-shimmer h-64 w-full rounded-2xl" />
          </div>
        ) : !user ? (
          <div className="max-w-xl mx-auto text-center py-10 sm:py-16 px-4 sm:px-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-xl space-y-3 sm:space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0369a1]/10 mx-auto flex items-center justify-center">
              <LogIn className="w-8 h-8 text-[#0b4f6c]" />
            </div>
            <h2 className="text-xl font-black">Bạn chưa đăng nhập</h2>
            <p className="text-[13px] sm:text-sm text-slate-500">
              Đăng nhập để xem toàn bộ thông báo đặt sân, giải đấu và hệ thống của bạn.
            </p>
            <button
              type="button"
              onClick={() => handleOpenAuth("login")}
              className="inline-block px-6 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm transition-all active:scale-95"
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : (
          <NotificationsCenter
            notifications={notifications}
            onDelete={removeNotification}
            onClearAll={clearAllNotifications}
            onMarkAllRead={markAllRead}
            onMarkRead={markSingleRead}
          />
        )}
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        initialRole={authRole}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
