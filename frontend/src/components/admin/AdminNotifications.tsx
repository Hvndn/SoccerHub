"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Send,
  Loader2,
  Sparkles,
  Link2,
  Users,
  Clock,
  CheckCircle2,
  History,
} from "lucide-react";
import { SectionCard } from "./AdminUI";
import { broadcastNotification } from "@/lib/adminService";

const TARGET_ROLES = [
  { value: "ALL", label: "Tất cả người dùng (Toàn sàn)" },
  { value: "PLAYER", label: "Chỉ gửi Cầu thủ (PLAYER)" },
  { value: "OWNER", label: "Chỉ gửi Chủ sân (OWNER)" },
  { value: "ORGANIZER", label: "Chỉ gửi Ban tổ chức (ORGANIZER)" },
];

const NOTIFICATION_TEMPLATES = [
  {
    name: "Bảo Trì Máy Chủ",
    title: "Thông báo bảo trì hệ thống máy chủ định kỳ",
    message:
      "Hệ thống TurfZone sẽ tiến hành nâng cấp hạ tầng vào lúc 01:00 - 02:00. Các giao dịch cọc VietQR tạm thời bảo lưu an toàn. Kính mong quý khách hàng thông cảm!",
    targetRole: "ALL",
    link: "/admin",
  },
  {
    name: "Cảnh Báo Thời Tiết",
    title: "Cảnh báo giông lốc & chính sách hỗ trợ hoàn cọc",
    message:
      "Do thời tiết mưa bão phức tạp, các trận đấu bị hủy vì sân ngập nước sẽ được Ban quản trị can thiệp hoàn cọc 100% cho các đội bóng.",
    targetRole: "PLAYER",
    link: "/bookings",
  },
  {
    name: "Khởi Tranh Giải Mới",
    title: "Chính thức mở đăng ký Giải Bóng Đá Cúp Mùa Đông",
    message:
      "Giải đấu quy tụ 16 đội bóng phong trào hàng đầu Đà Nẵng với tổng quỹ giải thưởng 15.000.000đ. Nhấp để xem sơ đồ nhánh đấu và ghi danh ngay!",
    targetRole: "PLAYER",
    link: "/tournaments",
  },
  {
    name: "Cập Nhật Sổ Doanh Thu",
    title: "Nhắc nhở đối soát cọc và cập nhật lịch sân tuần mới",
    message:
      "Kính gửi Quý Chủ Sân: Vui lòng kiểm tra đối soát các khoản cọc Napas 24/7 và cập nhật trạng thái các ca sân trống để tối ưu lượt đặt.",
    targetRole: "OWNER",
    link: "/owner",
  },
];

interface SentNotification {
  id: string;
  title: string;
  message: string;
  targetRole: string;
  link?: string | null;
  sentAt: string;
}

export default function AdminNotifications({
  notify,
}: {
  notify: (type: "ok" | "err", text: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentNotification[]>([]);

  // Đọc lịch sử thông báo từ local storage để hiển thị
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("turfzone_admin_broadcast_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      } else {
        // Một số thông báo mẫu lịch sử
        const initHistory: SentNotification[] = [
          {
            id: "1",
            title: "Nâng cấp giao diện quản trị Admin chuẩn Monochrome Slate",
            message: "Hệ thống quản trị hoàn tất nâng cấp giao diện tinh gọn, tăng tốc độ tải trang 40%.",
            targetRole: "ALL",
            link: "/admin",
            sentAt: "2026-11-21 21:30",
          },
          {
            id: "2",
            title: "Nhắc nhở nộp báo cáo giải đấu tháng 11",
            message: "Các Trưởng ban tổ chức vui lòng gửi báo cáo tài chính giải đấu trước ngày 25.",
            targetRole: "ORGANIZER",
            link: "/tournaments",
            sentAt: "2026-11-20 14:15",
          },
        ];
        setHistory(initHistory);
      }
    } catch {
      // fallback
    }
  }, []);

  const applyTemplate = (t: (typeof NOTIFICATION_TEMPLATES)[0]) => {
    setTitle(t.title);
    setMessage(t.message);
    setTargetRole(t.targetRole);
    setLink(t.link);
    notify("ok", `Đã áp dụng mẫu thông báo: ${t.name}`);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const m = message.trim();
    if (!t || !m) {
      notify("err", "Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.");
      return;
    }
    setSending(true);
    try {
      const res = await broadcastNotification({
        title: t,
        message: m,
        targetRole,
        link: link.trim() || null,
      });
      notify("ok", res.message || "Đã phát thông báo toàn sàn thành công.");

      // Lưu vào lịch sử đã phát
      const newEntry: SentNotification = {
        id: Date.now().toString(),
        title: t,
        message: m,
        targetRole,
        link: link.trim() || null,
        sentAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      };
      const updatedHistory = [newEntry, ...history].slice(0, 20);
      setHistory(updatedHistory);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "turfzone_admin_broadcast_history",
          JSON.stringify(updatedHistory)
        );
      }

      setTitle("");
      setMessage("");
      setLink("");
      setTargetRole("ALL");
    } catch (err: any) {
      notify("err", err?.message || "Gửi thông báo thất bại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KHỐI SOẠN THẢO THÔNG BÁO SÀN */}
      <SectionCard>
        <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-base">
              Soạn Thảo & Phát Thông Báo Hệ Thống
            </h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Thông báo sẽ lập tức xuất hiện trong chuông thông báo của nhóm người dùng được chọn.
            </p>
          </div>
        </div>

        {/* Các mẫu thông báo soạn nhanh */}
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-slate-700" />
            <span>Mẫu thông báo soạn nhanh (Click để điền tự động):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {NOTIFICATION_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => applyTemplate(tmpl)}
                className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-[12px] font-bold text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1">
                Nhóm đối tượng nhận thông báo
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shadow-2xs"
              >
                {TARGET_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1">
                Liên kết đính kèm (URL điều hướng nhanh)
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Ví dụ: /tournaments hoặc /bookings"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1">
              Tiêu đề thông báo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề ngắn gọn, súc tích..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1">
              Nội dung thông báo
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập nội dung thông điệp chi tiết gửi tới người dùng..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium resize-none"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang phát sóng...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Phát Thông Báo Toàn Sàn</span>
                </>
              )}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* 2. KHỐI LỊCH SỬ CÁC THÔNG BÁO ĐÃ PHÁT GẦN ĐÂY */}
      <SectionCard>
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-slate-700" />
          <h3 className="font-black text-slate-900 text-base">Lịch Sử Thông Báo Đã Phát</h3>
        </div>

        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-[13px] text-slate-400 py-4 text-center">Chưa có thông báo nào được phát.</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-1.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                      {item.targetRole === "ALL"
                        ? "Toàn Sàn"
                        : item.targetRole === "PLAYER"
                        ? "Cầu Thủ"
                        : item.targetRole === "OWNER"
                        ? "Chủ Sân"
                        : "Ban Tổ Chức"}
                    </span>
                    <h4 className="font-bold text-slate-900 text-[13px]">{item.title}</h4>
                  </div>
                  <span className="font-mono text-[12px] text-slate-400 shrink-0">{item.sentAt}</span>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed">{item.message}</p>
                {item.link && (
                  <p className="text-[12px] text-slate-400 font-mono">
                    Đính kèm: <span className="text-slate-800 font-semibold">{item.link}</span>
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
