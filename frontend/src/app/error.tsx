"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

/**
 * Bọc lỗi runtime của toàn bộ trang.
 * Không có file này thì một lỗi JS bất kỳ sẽ khiến trang trắng trơn — người dùng
 * không biết là lỗi mạng, lỗi dữ liệu hay lỗi của chính ứng dụng.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ghi ra console để còn tra được khi demo trước mặt thầy
    console.error("[SoccerHub] Lỗi runtime:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight">Ứng dụng gặp sự cố</h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Có lỗi xảy ra khi tải trang này. Thường là do mất kết nối mạng hoặc máy chủ tạm thời không phản hồi.
          Bạn có thể thử tải lại — dữ liệu tài khoản của bạn vẫn được giữ nguyên.
        </p>

        {error.digest && (
          <p className="font-mono text-[11px] text-slate-500">Mã lỗi: {error.digest}</p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-black text-sm transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Thử lại
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-sm transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}