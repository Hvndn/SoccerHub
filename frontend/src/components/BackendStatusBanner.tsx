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
  const [status, setStatus] = useState<BackendStatus | null>(null);
  /** Người dùng đã tự tắt banner — không ép hiện lại cho tới lần tải trang sau. */
  const [dismissed, setDismissed] = useState(false);
  const navHeight = useNavbarHeight();

  useEffect(() => {
    const unsubscribe = subscribeBackendStatus(setStatus);
    // Kiểm tra ngay khi vào trang để không phải chờ lời gọi API đầu tiên mới biết.
    probeBackend();
    return unsubscribe;
  }, []);

 // Khi backend chết, tự dò lại mỗi 6s — banner tự biến mất ngay khi máy chủ
 // phản hồi lại, không bắt người dùng phải bấm "Thử lại" thủ công.
 React.useEffect(() => {
  if (!status || status.reachable) return;
  const timer = window.setInterval(() => {
   probeBackend();
  }, 6000);
  return () => window.clearInterval(timer);
 }, [status]);

  if (!status || status.reachable || dismissed) return null;

  return (
    <div
      className="w-full flex justify-center px-3 shrink-0"
      style={{ paddingTop: navHeight + 12 }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-amber-300 bg-amber-50/95 shadow-lg backdrop-blur-md px-4 py-3 animate-fade-in-down">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <ServerCrash className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-amber-900 leading-tight">
              Không kết nối được máy chủ Turfzone
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
              {status.message ??
                "Hệ thống có thể đang bảo trì hoặc mất kết nối. Dữ liệu sẽ tự tải lại khi máy chủ phản hồi trở lại."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => probeBackend()}
              disabled={status.checking}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0369a1] px-3 py-2 text-xs font-extrabold text-white transition-all hover:bg-[#075985] active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${status.checking ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Thử lại</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-lg px-2 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
            >
              Ẩn
            </button>
          </div>
        </div>

        <p className="mt-2.5 flex items-center gap-1.5 border-t border-amber-200 pt-2.5 text-[11px] text-amber-700">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          Mọi thao tác cần máy chủ (đặt sân, đăng ký giải, nhắn tin) sẽ tạm hoãn cho tới khi kết nối lại.
        </p>
      </div>
    </div>
  );
}

/** Biến thể dùng trong Toaster: dấu hiệu nhỏ góc màn hình khi mất kết nối. */
export function BackendOfflineDot() {
  const [status, setStatus] = useState<BackendStatus | null>(null);

  useEffect(() => subscribeBackendStatus(setStatus), []);

  if (!status || status.reachable) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-800"
      title={status.message ?? "Mất kết nối máy chủ"}
    >
      <WifiOff className="h-3 w-3" />
      MẤT KẾT NỐI
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
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-extrabold text-emerald-800 shadow-xl animate-fade-in-up">
        <CheckCircle2 className="h-4 w-4" />
        Đã kết nối lại máy chủ
      </div>
    </div>
  );
}
