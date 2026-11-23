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
  Shield,
  Wrench,
  Menu,
  X,
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
import AdminMaintenance from "@/components/admin/AdminMaintenance";

type Section =
  | "overview"
  | "users"
  | "tournaments"
  | "pitches"
  | "bookings"
  | "moderation"
  | "chat"
  | "notifications"
  | "audit"
  | "maintenance";

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
        label: "Tổng Quan Sàn",
        desc: "KPI toàn sàn & biểu đồ tăng trưởng",
        icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      },
      {
        key: "bookings",
        label: "Đơn Đặt Sân & Cọc",
        desc: "Đơn đặt & đối soát cọc VietQR",
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
        label: "Người Dùng & Phân Quyền",
        desc: "Phân quyền RBAC & duyệt chủ sân",
        icon: <Users className="w-4 h-4 shrink-0" />,
      },
      {
        key: "pitches",
        label: "Danh Mục Cụm Sân",
        desc: "Kiểm duyệt & tọa độ GPS Haversine",
        icon: <MapPin className="w-4 h-4 shrink-0" />,
      },
      {
        key: "tournaments",
        label: "Giải Đấu Phong Trào",
        desc: "Giám sát giải & sơ đồ nhánh cúp",
        icon: <Trophy className="w-4 h-4 shrink-0" />,
      },
    ],
  },
  {
    id: "security_system",
    groupTitle: "An Ninh & Hệ Thống",
    groupDesc: "Kiểm duyệt, bảo trì & nhật ký",
    items: [
      {
        key: "moderation",
        label: "Kiểm Duyệt Chợ Kèo",
        desc: "Gỡ tin rác & chống gian lận ELO",
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
        desc: "Truy vết lịch sử quản trị viên",
        icon: <ScrollText className="w-4 h-4 shrink-0" />,
      },
      {
        key: "maintenance",
        label: "Bảo Trì Hệ Thống",
        desc: "Viễn thám, dọn DB & sao lưu snapshot",
        icon: <Wrench className="w-4 h-4 shrink-0" />,
      },
    ],
  },
];

const SECTION_TITLE: Record<Section, string> = {
  overview: "Tổng quan chỉ số sinh mệnh hệ thống",
  users: "Quản lý người dùng, phân quyền RBAC & duyệt chủ sân",
  tournaments: "Giám sát giải đấu & sơ đồ phân nhánh cúp",
  pitches: "Danh mục cụm sân đối tác & xác thực GPS",
  bookings: "Theo dõi đơn đặt sân & đối soát cọc VietQR",
  moderation: "Kiểm duyệt bài đăng chợ kèo & xếp hạng ELO",
  chat: "Kiểm duyệt tin nhắn phòng thảo luận",
  notifications: "Soạn thảo & phát thông báo hệ thống",
  audit: "Nhật ký kiểm toán thao tác quản trị",
  maintenance: "Quản trị hạ tầng, bảo trì sàn & dọn dẹp dữ liệu",
};

const SECTION_SUBTITLE: Record<Section, string> = {
  overview: "Giám sát tổng doanh thu cọc VietQR, lượng đơn đặt sân và người dùng hoạt động.",
  users: "Tra cứu tài khoản người dùng, phân cấp vai trò (RBAC), kiểm duyệt chủ sân mới và xử lý vi phạm.",
  tournaments: "Giám sát các giải đấu phong trào, kiểm duyệt thể thức thi đấu và sơ đồ phân nhánh cúp.",
  pitches: "Duyệt danh sách cụm sân đối tác, xác thực tọa độ GPS Haversine và biểu giá niêm yết theo ca.",
  bookings: "Theo dõi toàn bộ đơn đặt sân thời gian thực, quản lý 5 trạng thái và đối soát cọc Napas 24/7.",
  moderation: "Rà soát và gỡ bỏ các bài đăng tìm đối vi phạm quy chuẩn cộng đồng, chống gian lận điểm ELO.",
  chat: "Giám sát các kênh thảo luận cộng đồng và phòng chat giải đấu, xử lý phát ngôn tiêu cực.",
  notifications: "Soạn thảo và phát thông báo tức thời tới toàn bộ người dùng hoặc lọc riêng theo nhóm vai trò.",
  audit: "Truy vết toàn bộ lịch sử thao tác của các Quản trị viên nhằm bảo đảm tính minh bạch và an toàn.",
  maintenance: "Theo dõi viễn thám MySQL 8.0, AI Service, Spring Boot JVM, kích hoạt chế độ bảo trì và dọn dẹp dữ liệu.",
};

const SECTION_GROUP_NAME: Record<Section, string> = {
  overview: "Số Liệu & Doanh Thu",
  bookings: "Số Liệu & Doanh Thu",
  users: "Quản Lý Đối Tác",
  pitches: "Quản Lý Đối Tác",
  tournaments: "Quản Lý Đối Tác",
  moderation: "An Ninh & Hệ Thống",
  chat: "An Ninh & Hệ Thống",
  notifications: "An Ninh & Hệ Thống",
  audit: "An Ninh & Hệ Thống",
  maintenance: "An Ninh & Hệ Thống",
};

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-[14px] text-slate-500 font-medium">
          Đang tải bảng quản trị hệ thống...
        </div>
      }
    >
      <AdminConsole />
    </Suspense>
  );
}

function AdminConsole() {
  const { user, isLoading, logout } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      "maintenance",
    ];
    if (sec && validSections.includes(sec)) {
      setSection(sec);
    }
  }, []);

  const notify = useCallback((type: "ok" | "err", text: string) => {
    setToast({ type, text });
  }, []);

  const handleSelectSection = (key: Section) => {
    setSection(key);
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100/60 text-slate-900 flex flex-col lg:flex-row font-sans selection:bg-slate-900 selection:text-white">
      {/* =========================================================================
          1. DESKTOP SIDEBAR: SÁT MÉP WEB BÊN TRÁI - MONOCHROME SLATE TỐI GIẢN
          ========================================================================= */}
      <aside
        aria-label="Thanh điều hướng Quản Trị"
        className="hidden lg:flex w-72 xl:w-80 shrink-0 bg-white border-r border-slate-200 min-h-screen sticky top-0 h-screen flex-col justify-between z-30 shadow-[1px_0_6px_rgba(0,0,0,0.02)]"
      >
        {/* Top Header: Logo & Danh tính hệ thống */}
        <div className="p-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-1.5 font-black text-2xl tracking-tight">
            <span className="text-slate-900">Turf</span>
            <span className="text-slate-500">Zone</span>
          </Link>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[12px] font-bold">
              <Shield className="w-3.5 h-3.5 text-slate-600" />
              Quản Trị Hệ Thống
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600 text-[12px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online 24/7
            </span>
          </div>
        </div>

        {/* Danh sách các nhóm chức năng cuộn mượt (Scrollable Menu) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 scrollbar-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="space-y-1">
              <div className="px-3 pb-1">
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
                      onClick={() => handleSelectSection(item.key)}
                      aria-current={active ? "page" : undefined}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        active
                          ? "bg-slate-900 text-white shadow-xs font-bold"
                          : "hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-medium"
                      }`}
                    >
                      <span className={active ? "text-white" : "text-slate-500"}>
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[13px] font-bold truncate">
                          {item.label}
                        </span>
                        <span
                          className={`block text-[12px] truncate ${
                            active ? "text-slate-300" : "text-slate-400"
                          }`}
                        >
                          {item.desc}
                        </span>
                      </div>
                      {active && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section: Admin Profile Card & Navigation */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          {user && (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-[14px] shadow-xs shrink-0">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-900 truncate leading-tight">
                  {user.fullName || "Quản Trị Viên"}
                </p>
                <p
                  className="text-[12px] font-mono font-medium text-slate-500 leading-tight truncate"
                  title={user.email}
                >
                  {user.email || "admin@turfzone.vn"}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[13px] font-bold text-slate-700 transition-all active:scale-95 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Về Trang Chủ</span>
            </Link>

            {user && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.assign("/");
                }}
                className="inline-flex items-center justify-center p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Đăng xuất tài khoản quản trị"
              >
                <LogOut className="w-4 h-4 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. MOBILE TOP BAR & NAVIGATION (CHO THIẾT BỊ DI ĐỘNG & TABLET)
          ========================================================================= */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-1.5 font-black text-xl tracking-tight">
          <span className="text-slate-900">Turf</span>
          <span className="text-slate-500">Zone</span>
          <span className="ml-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[12px] font-bold">
            Admin
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          aria-label="Mở danh mục điều hướng"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation (Khi bấm mở menu) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-4 shadow-xl animate-fade-in">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="space-y-1">
              <p className="text-[12px] font-bold text-slate-400 px-2">{group.groupTitle}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {group.items.map((item) => {
                  const active = section === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleSelectSection(item.key)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left text-[13px] font-bold transition-all ${
                        active
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[13px] font-bold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </Link>
            {user && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.assign("/");
                }}
                className="text-[13px] font-bold text-slate-600 hover:text-slate-900"
              >
                Đăng Xuất
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          3. MAIN CONTENT AREA: TẬN DỤNG TOÀN BỘ PHẦN MÀN HÌNH CÒN LẠI (EDGE-TO-EDGE)
          ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-slate-50">
        {/* Top Header Bar trên Desktop - Tối giản thanh lịch */}
        <header className="hidden lg:flex sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 xl:px-8 py-3.5 items-center justify-between gap-4 shadow-2xs">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[13px] font-bold text-slate-500">
            <span>Quản Trị</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-700 font-bold">{SECTION_GROUP_NAME[section]}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-black">{SECTION_TITLE[section]}</span>
          </div>

          {/* Quick System Status Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[12px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MySQL 8.0: Ổn Định</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[12px] font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>AI Engine: 8000</span>
            </div>
          </div>
        </header>

        {/* VÙNG NỘI DUNG CHÍNH (CONTENT BODY) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {isLoading ? (
            <div role="status" className="space-y-4 max-w-5xl py-8" aria-label="Đang tải quyền quản trị">
              <div className="h-10 w-64 rounded-xl bg-slate-200 animate-pulse" />
              <div className="h-72 w-full rounded-2xl bg-slate-200 animate-pulse" />
            </div>
          ) : !user ? (
            <div className="max-w-xl mx-auto text-center py-12 px-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4 my-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center">
                <LogIn className="w-8 h-8 text-slate-700" />
              </div>
              <h1 className="text-xl font-black text-slate-900">Khu vực quản trị hệ thống</h1>
              <p className="text-[14px] text-slate-500 leading-relaxed">
                Bạn cần đăng nhập tài khoản có thẩm quyền <strong>Quản Trị Viên</strong> để truy cập bảng điều khiển này.
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[14px] transition-all active:scale-95 shadow-md"
              >
                Về trang chủ để đăng nhập
              </Link>
            </div>
          ) : user.role !== "ADMIN" ? (
            <div className="max-w-xl mx-auto text-center py-12 px-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4 my-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-slate-700" />
              </div>
              <h1 className="text-xl font-black text-slate-900">Truy cập bị từ chối</h1>
              <p className="text-[14px] text-slate-500 leading-relaxed">
                Tài khoản <strong>{user.fullName || user.email}</strong> (vai trò {String(user.role)}) không có
                thẩm quyền quản trị hệ thống. Chỉ tài khoản Quản Trị mới được truy cập.
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[14px] transition-all active:scale-95"
              >
                Về trang chủ
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Thẻ Header mô tả phân hệ hiện tại */}
              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {SECTION_TITLE[section]}
                    </h1>
                    <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                      {SECTION_SUBTITLE[section]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Component phân hệ tương ứng */}
              <div key={section} className="animate-fade-in">
                {section === "overview" && <AdminOverview notify={notify} />}
                {section === "users" && <AdminUsers notify={notify} />}
                {section === "tournaments" && <AdminTournaments notify={notify} />}
                {section === "pitches" && <AdminPitches notify={notify} />}
                {section === "bookings" && <AdminBookings notify={notify} />}
                {section === "moderation" && <AdminModeration notify={notify} />}
                {section === "chat" && <AdminChatModeration notify={notify} />}
                {section === "notifications" && <AdminNotifications notify={notify} />}
                {section === "audit" && <AdminAuditLogs notify={notify} />}
                {section === "maintenance" && <AdminMaintenance notify={notify} />}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-4 px-6 bg-white/70 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px] text-slate-500">
          <p>© 2026 Turfzone — Trung tâm điều hành & Quản trị hệ thống toàn sàn.</p>
          <p className="font-semibold text-slate-600">Phiên bản v4.2.0-Enterprise</p>
        </footer>
      </div>

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
