"use client";

import React, { Suspense, useCallback, useState, useEffect } from "react";
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
  MessageSquare,
  Megaphone,
  ScrollText,
  LogOut,
  ChevronRight,
  Activity,
  Shield,
  Layers,
  Sparkles,
  BarChart3,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminToast } from "@/components/admin/AdminUI";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminTournaments from "@/components/admin/AdminTournaments";
import AdminPitches from "@/components/admin/AdminPitches";
import AdminBookings from "@/components/admin/AdminBookings";
import AdminModeration from "@/components/admin/AdminModeration";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminChatModeration from "@/components/admin/AdminChatModeration";
import AdminAuditLogs from "@/components/admin/AdminAuditLogs";

type Section =
  | "overview"
  | "users"
  | "tournaments"
  | "pitches"
  | "bookings"
  | "moderation"
  | "chat"
  | "notifications"
  | "audit";

interface NavItem {
  key: Section;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

interface NavGroup {
  id: string;
  groupTitle: string;
  groupDesc: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "finance_analytics",
    groupTitle: "Số Liệu & Doanh Thu",
    groupDesc: "Chỉ số KPI và dòng tiền cọc",
    items: [
      {
        key: "overview",
        label: "Tổng Quan",
        desc: "KPI toàn sàn & bảo trì",
        icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      },
      {
        key: "bookings",
        label: "Đặt Sân & Cọc",
        desc: "Đơn đặt & cọc VietQR",
        icon: <Ticket className="w-4 h-4 shrink-0" />,
      },
    ],
  },
  {
    id: "entities_management",
    groupTitle: "Quản Lý Đối Tác",
    groupDesc: "Người dùng, cụm sân & giải đấu",
    items: [
      {
        key: "users",
        label: "Người Dùng",
        desc: "Phân quyền & duyệt chủ sân",
        icon: <Users className="w-4 h-4 shrink-0" />,
      },
      {
        key: "pitches",
        label: "Cụm Sân Bóng",
        desc: "Kiểm duyệt & quản lý sân",
        icon: <MapPin className="w-4 h-4 shrink-0" />,
      },
      {
        key: "tournaments",
        label: "Giải Đấu",
        desc: "Giám sát giải & nhánh cúp",
        icon: <Trophy className="w-4 h-4 shrink-0" />,
      },
    ],
  },
  {
    id: "security_system",
    groupTitle: "An Ninh & Hệ Thống",
    groupDesc: "Kiểm duyệt, thông báo & truy vết",
    items: [
      {
        key: "moderation",
        label: "Kiểm Duyệt Kèo",
        desc: "Gỡ tin rác & chống gian lận",
        icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
      },
      {
        key: "chat",
        label: "Kiểm Duyệt Chat",
        desc: "Tiêu chuẩn phòng trò chuyện",
        icon: <MessageSquare className="w-4 h-4 shrink-0" />,
      },
      {
        key: "notifications",
        label: "Thông Báo Sàn",
        desc: "Phát thông báo toàn hệ thống",
        icon: <Megaphone className="w-4 h-4 shrink-0" />,
      },
      {
        key: "audit",
        label: "Nhật Ký Thao Tác",
        desc: "Truy vết lịch sử quản trị",
        icon: <ScrollText className="w-4 h-4 shrink-0" />,
      },
    ],
  },
];

const SECTION_TITLE: Record<Section, string> = {
  overview: "Tổng quan hệ thống",
  users: "Quản lý người dùng & phân quyền",
  tournaments: "Quản lý giải đấu phong trào",
  pitches: "Quản lý danh mục cụm sân bóng",
  bookings: "Theo dõi đơn đặt sân & tiền cọc VietQR",
  moderation: "Kiểm duyệt chợ kèo & chống gian lận ELO",
  chat: "Kiểm duyệt tin nhắn phòng chat",
  notifications: "Gửi thông báo toàn hệ thống",
  audit: "Nhật ký kiểm toán thao tác quản trị",
};

const SECTION_SUBTITLE: Record<Section, string> = {
  overview: "Giám sát các chỉ số sinh mệnh, tăng trưởng doanh thu cọc VietQR và công cụ dọn dẹp dữ liệu.",
  users: "Tra cứu tài khoản người dùng, phân cấp vai trò (RBAC), kiểm duyệt chủ sân mới và xử lý vi phạm.",
  tournaments: "Giám sát các giải đấu phong trào, kiểm duyệt thể thức thi đấu và sơ đồ phân nhánh cúp.",
  pitches: "Duyệt danh sách cụm sân đối tác, xác thực tọa độ GPS Haversine và biểu giá niêm yết theo ca.",
  bookings: "Theo dõi toàn bộ đơn đặt sân thời gian thực, quản lý 5 trạng thái và đối soát cọc Napas 24/7.",
  moderation: "Rà soát và gỡ bỏ các bài đăng tìm đối vi phạm quy chuẩn cộng đồng, chống gian lận điểm ELO.",
  chat: "Giám sát các kênh thảo luận cộng đồng và phòng chat giải đấu, xử lý phát ngôn tiêu cực.",
  notifications: "Soạn thảo và phát thông báo tức thời tới toàn bộ người dùng hoặc lọc riêng theo nhóm vai trò.",
  audit: "Truy vết toàn bộ lịch sử thao tác của các Quản trị viên nhằm bảo đảm tính minh bạch và an toàn.",
};

const SECTION_GROUP_NAME: Record<Section, string> = {
  overview: "Số Liệu & Doanh Thu",
  bookings: "Số Liệu & Doanh Thu",
  users: "Quản Lý Đối Tác",
  pitches: "Quản Lý Đối Tác",
  tournaments: "Quản Lý Đối Tác",
  moderation: "An Ninh & Vận Hành",
  chat: "An Ninh & Vận Hành",
  notifications: "An Ninh & Vận Hành",
  audit: "An Ninh & Vận Hành",
};

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[14px] text-slate-500 font-medium">Đang tải bảng quản trị...</div>}>
      <AdminConsole />
    </Suspense>
  );
}

function AdminConsole() {
  const { user, isLoading, logout } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const sec = params.get("sec") as Section | null;
    const validSections: Section[] = [
      "overview",
      "users",
      "tournaments",
      "pitches",
      "bookings",
      "moderation",
      "chat",
      "notifications",
      "audit",
    ];
    if (sec && validSections.includes(sec)) {
      setSection(sec);
    }
  }, []);

  const notify = useCallback((type: "ok" | "err", text: string) => {
    setToast({ type, text });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* HEADER QUẢN TRỊ CAO CẤP */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-[50px] py-3 flex items-center justify-between gap-3">
          {/* Logo & Trạng thái hệ thống */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 font-black text-xl tracking-tight">
              <span className="text-sky-800">Turf</span>
              <span className="text-slate-900">Zone</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[13px] font-black tracking-wide">
                <Shield className="w-3.5 h-3.5" />
                Trung Tâm Quản Trị
              </span>
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Hệ Thống Trực Tuyến 24/7
              </span>
            </div>
          </div>

          {/* Thông tin Admin & Nút hành động */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-left">
                <div className="w-8 h-8 rounded-lg bg-[#0369a1] text-white flex items-center justify-center font-black text-[13px] shadow-xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="min-w-0 pr-1">
                  <p className="text-[13px] font-bold text-slate-800 truncate max-w-[140px] leading-tight">
                    {user.fullName || user.email}
                  </p>
                  <p className="text-[12px] font-semibold text-rose-600 leading-tight">
                    Quản Trị Viên Tối Cao
                  </p>
                </div>
              </div>
            )}

            <Link
              href="/"
              aria-label="Về trang chủ"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-700 transition-all active:scale-95 whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Về Trang Chủ</span>
            </Link>

            {user && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.assign("/");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 text-[13px] font-bold transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                title="Đăng xuất khỏi tài khoản Quản Trị"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Đăng Xuất</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-[50px] py-4 sm:py-6">
        {isLoading ? (
          <div role="status" className="space-y-4 max-w-5xl mx-auto py-8" aria-label="Đang tải quyền quản trị">
            <div className="h-10 w-64 rounded-xl bg-slate-200 animate-pulse" />
            <div className="h-72 w-full rounded-2xl bg-slate-200 animate-pulse" />
          </div>
        ) : !user ? (
          <div className="max-w-xl mx-auto text-center py-12 px-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 mx-auto flex items-center justify-center">
              <LogIn className="w-8 h-8 text-rose-600" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Khu vực quản trị hệ thống</h1>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Bạn cần đăng nhập tài khoản có thẩm quyền <strong>Quản Trị Viên</strong> để truy cập bảng điều khiển này.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[14px] transition-all active:scale-95 shadow-md"
            >
              Về trang chủ để đăng nhập
            </Link>
          </div>
        ) : user.role !== "ADMIN" ? (
          <div className="max-w-xl mx-auto text-center py-12 px-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-rose-600" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Truy cập bị từ chối</h1>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Tài khoản <strong>{user.fullName || user.email}</strong> (vai trò {String(user.role)}) không có
              thẩm quyền quản trị hệ thống. Chỉ tài khoản Quản Trị mới được truy cập.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-[14px] transition-all active:scale-95"
            >
              Về trang chủ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 sm:gap-6 items-start">
            {/* THANH ĐIỀU HƯỚNG PHÂN NHÓM CHUYÊN NGHIỆP */}
            <aside aria-label="Mục quản trị" className="lg:sticky lg:top-[74px] space-y-3">
              {/* Menu Mobile dạng phân nhóm chip */}
              <div className="lg:hidden bg-white rounded-2xl border border-slate-200 p-2.5 shadow-xs overflow-x-auto flex gap-1.5 scrollbar-thin">
                {NAV_GROUPS.flatMap((g) => g.items).map((s) => {
                  const active = section === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        setSection(s.key);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                        active
                          ? "bg-[#0369a1] text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sidebar Desktop dạng 3 Cụm thẻ */}
              <nav className="hidden lg:block space-y-3">
                {NAV_GROUPS.map((group) => (
                  <div
                    key={group.id}
                    className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-xs space-y-1"
                  >
                    <div className="px-3 py-1.5">
                      <p className="text-[12px] font-black text-slate-400 tracking-wider">
                        {group.groupTitle}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const active = section === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setSection(item.key);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            aria-current={active ? "page" : undefined}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              active
                                ? "bg-[#0369a1] text-white shadow-md font-bold"
                                : "hover:bg-slate-100/90 text-slate-700 font-medium"
                            }`}
                          >
                            <span className={active ? "text-white" : "text-sky-700"}>
                              {item.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[13px] font-bold truncate">
                                {item.label}
                              </span>
                              <span
                                className={`block text-[12px] truncate ${
                                  active ? "text-cyan-100" : "text-slate-500"
                                }`}
                              >
                                {item.desc}
                              </span>
                            </div>
                            {active && <ChevronRight className="w-3.5 h-3.5 text-white/70 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>

            {/* KHU VỰC NỘI DUNG CHÍNH (CONTENT AREA) */}
            <div className="min-w-0 space-y-4">
              {/* Header Thẻ Phân Hệ */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 mb-1">
                      <span>Quản Trị</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      <span className="text-[#0369a1]">{SECTION_GROUP_NAME[section]}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-800 font-extrabold">{SECTION_TITLE[section]}</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {SECTION_TITLE[section]}
                    </h1>
                    <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                      {SECTION_SUBTITLE[section]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Phân hệ Tương ứng */}
              <div key={section} className="animate-fade-in space-y-4">
                {section === "overview" && <AdminOverview notify={notify} />}
                {section === "users" && <AdminUsers notify={notify} />}
                {section === "tournaments" && <AdminTournaments notify={notify} />}
                {section === "pitches" && <AdminPitches notify={notify} />}
                {section === "bookings" && <AdminBookings notify={notify} />}
                {section === "moderation" && <AdminModeration notify={notify} />}
                {section === "chat" && <AdminChatModeration notify={notify} />}
                {section === "notifications" && <AdminNotifications notify={notify} />}
                {section === "audit" && <AdminAuditLogs notify={notify} />}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-4 bg-white/60 text-center">
        <p className="text-[13px] text-slate-500 font-medium">
          © 2026 Turfzone — Trung tâm điều hành & Quản trị hệ thống toàn sàn (Super Admin Console).
        </p>
      </footer>

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
