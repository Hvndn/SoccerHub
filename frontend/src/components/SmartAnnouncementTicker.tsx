"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Megaphone, ExternalLink, X, Sparkles, AlertTriangle, ShieldCheck, Wrench } from "lucide-react";

export interface TickerData {
  id: string;
  enabled: boolean;
  scope: "ADMIN" | "OWNER";
  badge: string;
  badgeColor: "emerald" | "amber" | "blue" | "rose";
  message: string;
  linkText?: string;
  linkUrl?: string;
  updatedAt?: string;
}

const DEFAULT_TICKER: TickerData = {
  id: "turfzone-init-ticker",
  enabled: true,
  scope: "ADMIN",
  badge: "Thông Báo Sàn",
  badgeColor: "emerald",
  message:
    "TurfZone mở cổng đặt sân trực tuyến 24/7 • Giữ chỗ tức thì qua VietQR • Chính sách hỗ trợ dời lịch & hoàn cọc 100% khi thời tiết mưa bão • Khởi tranh Cúp Mùa Đông với tổng giải thưởng 15 triệu VNĐ!",
  linkText: "Xem Thể Lệ",
  linkUrl: "/tournaments",
};

export default function SmartAnnouncementTicker() {
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadTicker = () => {
      try {
        const saved = localStorage.getItem("turfzone_smart_ticker");
        let activeData: TickerData = DEFAULT_TICKER;
        if (saved) {
          activeData = JSON.parse(saved);
        }

        // Kiểm tra xem người dùng đã tạm ẩn ticker này trong phiên hiện tại chưa
        const dismissedId = sessionStorage.getItem("turfzone_ticker_dismissed_id");
        if (dismissedId === activeData.id) {
          setDismissed(true);
        } else {
          setDismissed(false);
        }

        setTicker(activeData);
      } catch {
        setTicker(DEFAULT_TICKER);
      }
    };

    loadTicker();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "turfzone_smart_ticker") {
        loadTicker();
      }
    };

    const handleCustomChange = () => {
      loadTicker();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("turfzone_ticker_changed", handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("turfzone_ticker_changed", handleCustomChange);
    };
  }, []);

  if (!ticker || !ticker.enabled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("turfzone_ticker_dismissed_id", ticker.id);
    }
  };

  const getBadgeStyle = (color: TickerData["badgeColor"]) => {
    switch (color) {
      case "amber":
        return {
          pill: "bg-amber-500/15 border-amber-500/30 text-amber-400",
          dot: "bg-amber-400",
          icon: AlertTriangle,
        };
      case "blue":
        return {
          pill: "bg-sky-500/15 border-sky-500/30 text-sky-400",
          dot: "bg-sky-400",
          icon: Sparkles,
        };
      case "rose":
        return {
          pill: "bg-rose-500/15 border-rose-500/30 text-rose-400",
          dot: "bg-rose-400",
          icon: Wrench,
        };
      case "emerald":
      default:
        return {
          pill: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
          dot: "bg-emerald-400",
          icon: Megaphone,
        };
    }
  };

  const style = getBadgeStyle(ticker.badgeColor);
  const BadgeIcon = style.icon;

  // Nội dung đơn vị lặp trong băng rôn (Text + Link)
  const TickerItem = () => (
    <span className="inline-flex items-center gap-3 mx-6 whitespace-nowrap">
      <span className="text-[13px] font-medium text-slate-200">
        {ticker.message}
      </span>
      {ticker.linkUrl && (
        <Link
          href={ticker.linkUrl}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[12px] font-bold text-amber-300 transition-colors border border-slate-700/60"
        >
          <span>{ticker.linkText || "Chi tiết"}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      )}
      <span className="text-slate-600 font-bold select-none">•</span>
    </span>
  );

  return (
    <aside
      aria-label="Băng rôn thông báo hệ thống"
      className="sticky top-0 z-40 w-full bg-slate-950 text-slate-200 border-b border-slate-800 shadow-sm transition-all"
    >
      <div className="w-full px-3 py-1.5 flex items-center gap-3 overflow-hidden">
        {/* Nhãn Huy Hiệu Cố Định Bên Trái */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-bold shrink-0 ${style.pill}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-ping shrink-0`} />
          <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="leading-none">{ticker.badge}</span>
        </div>

        {/* Khung Chạy Chữ Marquee Tinh Tế (Rê chuột tự dừng) */}
        <div
          className="flex-1 overflow-hidden relative cursor-default"
          title="Rê chuột để tạm dừng đọc thông báo"
        >
          <div className="animate-marquee-ticker flex items-center select-none py-0.5">
            <TickerItem />
            <TickerItem />
            <TickerItem />
            <TickerItem />
          </div>
        </div>

        {/* Nút Tạm Ẩn Băng Rôn Bên Phải */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          title="Tạm ẩn thông báo này"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
