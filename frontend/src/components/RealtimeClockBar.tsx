"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function RealtimeClockBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  const daysOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayName = daysOfWeek[now.getDay()];

  const dateStr = now.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 pt-4 pb-1 flex justify-end">
      <div className="inline-flex items-center space-x-3 bg-transparent text-right">
        <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-pitch-emerald shrink-0 animate-pulse" />
        <div className="flex flex-col text-right leading-tight">
          <span className="text-base sm:text-lg font-extrabold text-pitch-emerald tracking-tight">
            Hiện tại: <span className="text-lg sm:text-xl font-black font-mono tracking-wider">{timeStr}</span>
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
            {dayName}, {dateStr}
          </span>
        </div>
      </div>
    </div>
  );
}
