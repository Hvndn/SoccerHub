/**
 * Vòng xoay loading kiểu Messenger — dùng chung cho toàn hệ thống.
 *
 * - Chỉ dùng class Tailwind có sẵn nên không cần thêm CSS.
 * - Màu viền bám theo màu brand #0369a1 (đạt WCAG AA với nền trắng).
 * - Không khai báo "use client" để dùng được cả ở Server Component (loading.tsx).
 *
 * size:
 *   "sm"  — vòng nhỏ, dùng trong ô nội dung (chat, bảng, thẻ)
 *   "md"  — mặc định, kèm chữ TurfZone
 *   "lg"  — vòng to, dùng khi che cả trang
 */
export default function PageSpinner({
  className = "",
  size = "md",
  label = "TurfZone",
  sub = "Đang tải dữ liệu…",
  showText = true,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  sub?: string;
  showText?: boolean;
}) {
  // Kích thước vòng xoay theo size
  const box = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-14 sm:w-14";
  const border = size === "sm" ? "border-[3px]" : "border-4";
  const track = size === "sm" ? "border-slate-200" : "border-slate-200/90";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={sub}
      className={`flex flex-col items-center justify-center gap-4 select-none ${className}`}
    >
      {/* Vòng xoay Messenger: nền mờ + cung quét xoay đều, có hiệu ứng quét sáng */}
      <span className={`relative block shrink-0 ${box}`}>
        <span className={`absolute inset-0 rounded-full ${border} ${track}`} />
        <span
          className={`absolute inset-0 animate-spin rounded-full ${border} border-transparent border-t-[#0369a1]`}
          style={{ animationDuration: size === "sm" ? "0.7s" : "0.9s" }}
        />
      </span>

      {showText && (
        <span className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-sm sm:text-base font-extrabold tracking-wide text-slate-700">{label}</span>
          <span className="text-[13px] sm:text-xs font-medium text-slate-500">{sub}</span>
        </span>
      )}
    </div>
  );
}