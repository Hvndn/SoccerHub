"use client";

/* =========================================================
 * BackendStatusBanner — Thông báo toàn cục khi mất kết nối máy chủ
 *
 * Hiện một thanh cảnh báo duy nhất ở giữa màn hình khi backend không phản
 * hồi, kèm nút "Thử lại". Mục tiêu: thay vì mỗi màn hình tự hiện vòng xoay
 * mãi / toast "Failed to fetch" rời rạc, người dùng thấy đúng một thông báo
 * nói rõ chuyện gì đang xảy ra.
 * ========================================================= */

import React, { useEffect, useLayoutEffect, useState } from "react";
import { ServerCrash, RefreshCw, WifiOff, CheckCircle2 } from "lucide-react";
import {
  subscribeBackendStatus,
  probeBackend,
  type BackendStatus,
} from "@/lib/backendStatus";

/** Đo chiều cao Navbar (đang fixed) để chừa khoảng, tránh bị Navbar đè lên. */
function useNavbarHeight(): number {
  const [h, setH] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const nav = document.querySelector("header") || document.querySelector("nav");
      setH(nav ? Math.round(nav.getBoundingClientRect().height) : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    // Bản dựng mới thêm/sửa Navbar có thể đổi chiều cao sau vài frame.
    const t = setTimeout(measure, 400);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, []);

  return h;
}

export default function BackendStatusBanner() {
  useEffect(() => {
    probeBackend();
  }, []);

  return null;
}

/** Biến thể dùng trong Toaster: dấu hiệu nhỏ góc màn hình khi mất kết nối. */
export function BackendOfflineDot() {
  const [status, setStatus] = useState<BackendStatus | null>(null);

  useEffect(() => subscribeBackendStatus(setStatus), []);

  if (!status || status.reachable) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[14px] font-black text-amber-800"
      title={status.message ?? "Mất kết nối máy chủ"}
    >
      <WifiOff className="h-3 w-3" />
      Mất kết nối
    </span>
  );
}

/** Hiển thị trạng thái đã kết nối lại trong 3 giây sau khi probe thành công. */
export function BackendRestoredToast() {
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeBackendStatus((s) => {
      const wasDown = status && !status.reachable;
      setStatus(s);
      if (s.reachable && wasDown) {
        setShow(true);
        setTimeout(() => setShow(false), 3000);
      }
    });
    return unsubscribe;
  }, [status]);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 sm:bottom-8">
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-[14px] font-extrabold text-emerald-800 shadow-xl animate-fade-in-up">
        <CheckCircle2 className="h-4 w-4" />
        Đã kết nối lại máy chủ
      </div>
    </div>
  );
}
