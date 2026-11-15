"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import Link from "next/link";

/**
 * Bọc lỗi runtime của toàn bộ trang.
 * Hiển thị giao diện thân thiện, đồng thời hỗ trợ thông tin kỹ thuật mở rộng
 * để nhanh chóng định vị nguyên nhân sự cố.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Ghi ra console để theo dõi khi phát triển và chạy thử
    console.error("[Turfzone] Lỗi runtime:", error);
  }, [error]);

  const handleClearCacheAndReload = () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("turfzone_active_tab");
        sessionStorage.removeItem("turfzone_pending_tab");
        window.location.href = "/";
        return;
      }
    } catch {
      /* ignore */
    }
    reset();
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-rose-600" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Ứng Dụng Gặp Sự Cố</h1>
        <p className="text-[14px] sm:text-sm text-slate-500 leading-relaxed">
          Đã xảy ra ngoại lệ khi kết nối hoặc kết xuất dữ liệu. Bạn có thể nhấn Thử Lại hoặc Đặt Lại Trạng Thái — dữ liệu tài khoản và phiên đăng nhập vẫn được bảo toàn.
        </p>

        {error.digest && (
          <p className="font-mono text-[13px] text-slate-400 bg-slate-50 py-1 px-3 rounded-lg inline-block border border-slate-200">
            Mã định danh: {error.digest}
          </p>
        )}

        {/* Khối chi tiết kỹ thuật có thể mở rộng */}
        <div className="text-left pt-1">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-600 hover:text-slate-900 mx-auto transition-colors cursor-pointer"
          >
            <span>{showDetails ? "Ẩn Chi Tiết Kỹ Thuật" : "Xem Chi Tiết Lỗi Kỹ Thuật"}</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-rose-300 font-mono text-[13px] leading-relaxed overflow-x-auto max-h-48 border border-slate-800">
              <p className="font-bold text-white mb-1">Thông điệp lỗi:</p>
              <p className="text-rose-400 whitespace-pre-wrap">{error?.message || "Không có thông điệp chi tiết"}</p>
              {error?.stack && (
                <details className="mt-2 text-slate-400">
                  <summary className="cursor-pointer text-[12px] text-slate-300 hover:text-white">Xem dấu vết ngăn xếp (Stack Trace)</summary>
                  <pre className="mt-2 text-[12px] text-slate-400 whitespace-pre-wrap overflow-x-auto">{error.stack}</pre>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            Thử Lại
          </button>

          <button
            type="button"
            onClick={handleClearCacheAndReload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            Làm Mới &amp; Về Trang Chủ
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
