"use client";

import React, { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Trophy,
  MapPin,
  Ticket,
  ShieldCheck,
  LogIn,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminToast } from "@/components/admin/AdminUI";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminTournaments from "@/components/admin/AdminTournaments";
import AdminPitches from "@/components/admin/AdminPitches";
import AdminBookings from "@/components/admin/AdminBookings";
import AdminModeration from "@/components/admin/AdminModeration";

type Section = "overview" | "users" | "tournaments" | "pitches" | "bookings" | "moderation";

const SECTIONS: { key: Section; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Tổng quan", desc: "KPI toàn hệ thống", icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: "users", label: "Người dùng", desc: "Khóa / phân vai trò", icon: <Users className="w-4 h-4" /> },
  { key: "tournaments", label: "Giải đấu", desc: "Đóng mở / xóa giải", icon: <Trophy className="w-4 h-4" /> },
  { key: "pitches", label: "Sân bóng", desc: "Danh sách cụm sân", icon: <MapPin className="w-4 h-4" /> },
  { key: "bookings", label: "Đặt sân", desc: "Đơn & doanh thu", icon: <Ticket className="w-4 h-4" /> },
  { key: "moderation", label: "Kiểm duyệt", desc: "Gỡ tin chợ kèo", icon: <ShieldCheck className="w-4 h-4" /> },
];

const SECTION_TITLE: Record<Section, string> = {
  overview: "Tổng quan hệ thống",
  users: "Quản lý người dùng",
  tournaments: "Quản lý giải đấu",
  pitches: "Quản lý sân bóng",
  bookings: "Đơn đặt sân & doanh thu",
  moderation: "Kiểm duyệt chợ kèo",
};

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Đang tải…</div>}>
      <AdminConsole />
    </Suspense>
  );
}

function AdminConsole() {
  const { user, isLoading } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const notify = useCallback((type: "ok" | "err", text: string) => {
    setToast({ type, text });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur">
        <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-[50px] py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2 font-black text-lg tracking-tight">
              <span className="text-sky-800 dark:text-sky-400">Turf</span>
              <span className="text-slate-900 dark:text-white">Zone</span>
            </Link>
            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
              Super Admin
            </span>
          </div>
          <Link
            href="/"
            aria-label="Về trang chủ"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Về trang chủ</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-[50px] py-4 sm:py-8">
        {isLoading ? (
          <div role="status" className="space-y-3 max-w-5xl mx-auto" aria-label="Đang tải quyền quản trị">
            <div className="skeleton-shimmer h-8 w-64 rounded-xl" />
            <div className="skeleton-shimmer h-64 w-full rounded-2xl" />
          </div>
        ) : !user ? (
          <div className="max-w-xl mx-auto text-center py-10 sm:py-16 px-4 sm:px-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 sm:space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 mx-auto flex items-center justify-center">
              <LogIn className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-xl font-black">Khu vực quản trị hệ thống</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Bạn cần đăng nhập tài khoản <strong>Quản trị viên (ADMIN)</strong> để truy cập.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-2xl bg-[#0b4f6c] hover:bg-[#083a50] text-white font-black text-sm transition-all active:scale-95"
            >
              Về trang chủ để đăng nhập
            </Link>
          </div>
        ) : user.role !== "ADMIN" ? (
          <div className="max-w-xl mx-auto text-center py-10 sm:py-16 px-4 sm:px-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 sm:space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-xl font-black">Truy cập bị từ chối</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Tài khoản <strong>{user.fullName || user.email}</strong> (vai trò {String(user.role)}) không có
              quyền quản trị hệ thống. Chỉ tài khoản <strong>ADMIN</strong> được vào khu vực này.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-sm transition-all active:scale-95"
            >
              Về trang chủ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-3 sm:gap-5 items-start">
            {/* Sidebar */}
            <nav aria-label="Mục quản trị" className="lg:sticky lg:top-[68px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 flex lg:flex-col gap-1 overflow-x-auto">
              {SECTIONS.map((s) => {
                const active = section === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setSection(s.key);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all shrink-0 lg:shrink ${
                      active
                        ? "bg-[#0b4f6c] text-white shadow-md"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <span className={active ? "text-white" : "text-sky-700 dark:text-sky-400"}>{s.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-xs font-black whitespace-nowrap">{s.label}</span>
                      <span className={`hidden lg:block text-[10px] ${active ? "text-emerald-100" : "text-slate-400"}`}>
                        {s.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Content */}
            <div className="min-w-0 space-y-3 sm:space-y-4">
              <div key={section} className="animate-fade-in-up">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight mb-4">
                  {SECTION_TITLE[section]}
                </h1>
                {section === "overview" && <AdminOverview notify={notify} />}
                {section === "users" && <AdminUsers notify={notify} />}
                {section === "tournaments" && <AdminTournaments notify={notify} />}
                {section === "pitches" && <AdminPitches notify={notify} />}
                {section === "bookings" && <AdminBookings notify={notify} />}
                {section === "moderation" && <AdminModeration notify={notify} />}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-4">
        <p className="text-center text-[11px] text-slate-600 dark:text-slate-400">
          © 2026 SoccerHub — Khu vực quản trị hệ thống (Super Admin).
        </p>
      </footer>

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
