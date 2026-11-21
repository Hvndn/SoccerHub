"use client";

import React, { useState, useEffect } from "react";
import { Wrench, X } from "lucide-react";

export default function GlobalMaintenanceBanner() {
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState(
    "Hệ thống TurfZone đang tiến hành bảo trì nâng cấp định kỳ máy chủ. Vui lòng quay lại sau ít phút!"
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMaintenance = () => {
      const mode = localStorage.getItem("turfzone_maintenance_mode");
      const msg = localStorage.getItem("turfzone_maintenance_msg");
      setActive(mode === "true");
      if (msg) setMessage(msg);
    };

    checkMaintenance();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "turfzone_maintenance_mode" || e.key === "turfzone_maintenance_msg") {
        checkMaintenance();
      }
    };

    const handleCustomEvent = () => checkMaintenance();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("turfzone_maintenance_changed", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("turfzone_maintenance_changed", handleCustomEvent);
    };
  }, []);

  if (!active || dismissed) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full bg-slate-900 text-white px-4 py-2.5 border-b border-slate-800 shadow-md flex items-center justify-between gap-3 text-[13px] animate-fade-in"
    >
      <div className="flex items-center gap-2.5 min-w-0 mx-auto">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-amber-400 shrink-0">
          <Wrench className="w-3.5 h-3.5 animate-pulse" />
        </span>
        <p className="font-medium truncate">
          <span className="font-bold text-amber-400 mr-1.5">[Thông Báo Bảo Trì Sàn]:</span>
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
        aria-label="Đóng biểu ngữ bảo trì"
        title="Tạm ẩn thông báo"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
