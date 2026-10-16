import Link from "next/link";
import { SearchX, Home, LayoutGrid } from "lucide-react";

export const metadata = {
  title: "Không tìm thấy trang — SoccerHub",
};

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#0ea5e9]/10 flex items-center justify-center mx-auto">
          <SearchX className="w-8 h-8 text-[#0ea5e9]" />
        </div>

        <p className="font-mono text-5xl sm:text-6xl font-black text-[#0ea5e9]">404</p>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">Không tìm thấy trang này</h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Đường dẫn bạn mở không tồn tại hoặc đã được chuyển đi. Có thể bạn gõ nhầm địa chỉ,
          hoặc sân / giải đấu đó đã bị xoá.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-black text-sm transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </Link>
          <Link
            href="/?tab=booking"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-sm transition-all active:scale-95"
          >
            <LayoutGrid className="w-4 h-4" />
            Tìm sân bóng
          </Link>
        </div>
      </div>
    </div>
  );
}