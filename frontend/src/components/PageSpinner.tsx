/**
 * Vòng xoay loading dùng chung cho toàn hệ thống.
 * Chỉ dùng class Tailwind có sẵn nên không cần thêm CSS,
 * màu viền bám theo màu brand #0b4f6c (dark mode dùng sky-400).
 * Không khai báo "use client" để dùng được cả ở Server Component (loading.tsx).
 */
export default function PageSpinner({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Đang tải trang"
      className={`flex flex-col items-center justify-center gap-4 select-none ${className}`}
    >
      {/* Vòng xoay: 2 lớp tròn đồng tâm, lớp trên chỉ viền trên để tạo cung quét */}
      <span className="relative block h-12 w-12 sm:h-14 sm:w-14">
        <span className="absolute inset-0 rounded-full border-4 border-slate-200/90 dark:border-slate-800" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#0ea5e9] dark:border-t-sky-400" />
      </span>

      <span className="flex flex-col items-center gap-1.5">
        <span className="text-sm sm:text-base font-extrabold tracking-wide text-slate-700 dark:text-slate-200">
          TurfZone
        </span>
        <span className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500">
          Đang tải dữ liệu…
        </span>
      </span>
    </div>
  );
}