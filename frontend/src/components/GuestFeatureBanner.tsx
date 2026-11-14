"use client";

import React from "react";
import { LogIn, Sparkles } from "lucide-react";

interface GuestFeatureBannerProps {
  currentTab?: string;
  onOpenAuth: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
}

export default function GuestFeatureBanner({
  currentTab = "booking",
  onOpenAuth,
}: GuestFeatureBannerProps) {
  const getMessage = () => {
    switch (currentTab) {
      case "booking":
        return "Chế độ xem thử: Đăng nhập để cọc sân và giữ chỗ.";
      case "matchmaking":
        return "Chế độ xem thử: Đăng nhập để đăng bài và nhận kèo.";
      case "tournaments":
        return "Chế độ xem thử: Đăng nhập để đăng ký tham gia giải.";
      case "community":
        return "Chế độ xem thử: Đăng nhập để bình luận và nhắn tin.";
      default:
        return "Chế độ xem thử: Đăng nhập để dùng đầy đủ tính năng.";
    }
  };

  return (
    <div className="bg-sky-50/90 border border-sky-200 rounded-lg px-3.5 py-2 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-slate-800">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="w-4 h-4 text-sky-700 shrink-0" />
        <span className="text-[13px] font-semibold text-slate-700 truncate">
          {getMessage()}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onOpenAuth("login", "PLAYER")}
          className="px-3 py-1 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Đăng Nhập</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenAuth("register", "PLAYER")}
          className="text-[13px] font-semibold text-sky-800 hover:text-sky-950 px-2 py-1 cursor-pointer"
        >
          Đăng Ký
        </button>
      </div>
    </div>
  );
}
